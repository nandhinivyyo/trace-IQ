package com.codeinsight.service.trace;

import com.codeinsight.model.ExecutionTrace;
import com.codeinsight.model.VariableSnapshot;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

public class PythonTraceGenerator implements TraceGenerator {
    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public List<ExecutionTrace> generateTrace(String code, String input) {
        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("codeinsight_py_trace_");
            
            // 1. Write user script to temp file
            Path sourceFile = tempDir.resolve("script.py");
            Files.writeString(sourceFile, code);

            // 2. Write stdin input to temp file
            Path inputFile = tempDir.resolve("input.txt");
            Files.writeString(inputFile, input != null ? input : "");

            // 3. Extract tracer.py script from resources
            Path tracerFile = tempDir.resolve("tracer.py");
            try (InputStream is = getClass().getResourceAsStream("/tracer.py")) {
                if (is == null) {
                    throw new FileNotFoundException("tracer.py not found in resources");
                }
                Files.copy(is, tracerFile);
            }

            // 4. Spawn Python process
            ProcessBuilder pb = new ProcessBuilder(
                "python", 
                tracerFile.toString(), 
                sourceFile.toString(), 
                inputFile.toString()
            );
            
            long startTime = System.currentTimeMillis();
            Process process = pb.start();
            
            StringBuilder stdout = new StringBuilder();
            StringBuilder stderr = new StringBuilder();
            
            try (BufferedReader outReader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                 BufferedReader errReader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
                String line;
                while ((line = outReader.readLine()) != null) {
                    stdout.append(line);
                }
                while ((line = errReader.readLine()) != null) {
                    stderr.append(line).append("\n");
                }
            }

            boolean completed = process.waitFor(10, java.util.concurrent.TimeUnit.SECONDS);
            long duration = System.currentTimeMillis() - startTime;

            if (!completed) {
                process.destroyForcibly();
                return createErrorTrace("Execution timed out (infinite loop protection)", code);
            }

            if (process.exitValue() != 0) {
                return createErrorTrace("Runtime error:\n" + stderr.toString().trim(), code);
            }

            // 5. Parse JSON Trace Array
            String jsonOutput = stdout.toString().trim();
            if (jsonOutput.isEmpty()) {
                return createErrorTrace("Tracer failed with empty output.\n" + stderr.toString().trim(), code);
            }

            List<ExecutionTrace> traces = mapper.readValue(jsonOutput, new TypeReference<List<ExecutionTrace>>() {});
            
            // 6. Post-process variable lifecycles (created, updated, destroyed steps) and variablesBefore/After diffing
            postProcessTraces(traces, duration);

            return traces;

        } catch (Exception e) {
            return createErrorTrace("Trace Engine exception: " + e.getMessage(), code);
        } finally {
            cleanup(tempDir);
        }
    }

    private List<ExecutionTrace> createErrorTrace(String errorMsg, String code) {
        List<ExecutionTrace> errorList = new ArrayList<>();
        ExecutionTrace step = new ExecutionTrace();
        step.setStepNumber(1);
        step.setCurrentLineNumber(1);
        step.setExecutedSourceCode("");
        step.setExecutionStatus("ERROR");
        step.setCurrentConsoleOutput(errorMsg);
        step.setCurrentScope("global");
        step.setCurrentFunction("global");
        errorList.add(step);
        return errorList;
    }

    /**
     * Fills variablesBefore, calculates modifiedVariables, and assigns lifecycle step numbers (created/updated/destroyed).
     */
    public static void postProcessTraces(List<ExecutionTrace> traces, long totalDuration) {
        if (traces == null || traces.isEmpty()) return;

        // Shift state updates 1 step backward so currently executing line changes are immediately visible
        for (int i = 0; i < traces.size() - 1; i++) {
            ExecutionTrace current = traces.get(i);
            ExecutionTrace next = traces.get(i + 1);
            if (next.getVariablesAfter() != null) {
                current.setVariablesAfter(new ArrayList<>(next.getVariablesAfter()));
            }
            if (next.getFunctionStack() != null) {
                current.setFunctionStack(new ArrayList<>(next.getFunctionStack()));
            }
            current.setRecursionDepth(next.getRecursionDepth());
            current.setCurrentFunction(next.getCurrentFunction());
            current.setCurrentScope(next.getCurrentScope());
        }
        
        long stepShare = totalDuration / traces.size();
        
        // Track variable state lifecycles: name -> stats
        Map<String, Integer> createdSteps = new HashMap<>();
        Map<String, String> lastValues = new HashMap<>();
        Map<String, Integer> updatedSteps = new HashMap<>();

        for (int i = 0; i < traces.size(); i++) {
            ExecutionTrace current = traces.get(i);
            current.setExecutionDuration(stepShare);
            
            // Copy variablesAfter to a map for easy lookups
            Map<String, VariableSnapshot> currentVars = new HashMap<>();
            for (VariableSnapshot var : current.getVariablesAfter()) {
                currentVars.put(var.getName(), var);
            }

            // If not first step, populate variablesBefore from previous step's variablesAfter
            if (i > 0) {
                ExecutionTrace prev = traces.get(i - 1);
                current.setVariablesBefore(new ArrayList<>(prev.getVariablesAfter()));
            }

            // Calculate modified variables compared to previous step
            List<VariableSnapshot> modified = new ArrayList<>();
            for (VariableSnapshot var : current.getVariablesAfter()) {
                String name = var.getName();
                String val = var.getValue();
                
                // Track creation step
                if (!createdSteps.containsKey(name)) {
                    createdSteps.put(name, current.getStepNumber());
                    updatedSteps.put(name, current.getStepNumber());
                } else {
                    // Check if value updated
                    String lastVal = lastValues.get(name);
                    if (lastVal == null || !lastVal.equals(val)) {
                        updatedSteps.put(name, current.getStepNumber());
                        modified.add(var);
                    }
                }
                
                lastValues.put(name, val);
                
                // Write step details into variable
                var.setCreatedStep(createdSteps.get(name));
                var.setUpdatedStep(updatedSteps.get(name));
            }
            current.setModifiedVariables(modified);
        }

        // Fill destroyedSteps for variables that went out of scope
        for (int i = 0; i < traces.size(); i++) {
            ExecutionTrace current = traces.get(i);
            Set<String> activeInStep = new HashSet<>();
            for (VariableSnapshot var : current.getVariablesAfter()) {
                activeInStep.add(var.getName());
            }
            
            for (VariableSnapshot var : current.getVariablesAfter()) {
                String name = var.getName();
                
                // Scan forward to see where it disappears
                int destroyedAt = traces.size();
                for (int j = i + 1; j < traces.size(); j++) {
                    boolean found = false;
                    for (VariableSnapshot fvar : traces.get(j).getVariablesAfter()) {
                        if (fvar.getName().equals(name)) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        destroyedAt = traces.get(j).getStepNumber();
                        break;
                    }
                }
                var.setDestroyedStep(destroyedAt);
            }
        }
    }

    private void cleanup(Path tempDir) {
        if (tempDir != null) {
            try {
                Files.walk(tempDir)
                     .map(Path::toFile)
                     .forEach(File::delete);
            } catch (Exception ignored) {}
        }
    }
}
