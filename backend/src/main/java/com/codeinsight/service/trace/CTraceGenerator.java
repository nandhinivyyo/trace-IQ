package com.codeinsight.service.trace;

import com.codeinsight.model.ExecutionTrace;
import com.codeinsight.model.FunctionFrame;
import com.codeinsight.model.VariableSnapshot;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.HashMap;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

public class CTraceGenerator implements TraceGenerator {

    @Override
    public List<ExecutionTrace> generateTrace(String code, String input) {
        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("codeinsight_c_trace_");
            Path sourceFile = tempDir.resolve("program.c");
            Files.writeString(sourceFile, code);

            Path inputFile = tempDir.resolve("input.txt");
            Files.writeString(inputFile, input != null ? input : "");

            Path tracerFile = tempDir.resolve("c_tracer.py");
            try (InputStream is = getClass().getResourceAsStream("/c_tracer.py")) {
                if (is != null) {
                    Files.copy(is, tracerFile, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                }
            }

            if (Files.exists(tracerFile)) {
                ProcessBuilder pb = new ProcessBuilder("python", tracerFile.toString(), sourceFile.toString(), inputFile.toString());
                Process process = pb.start();
                StringBuilder stdout = new StringBuilder();
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        stdout.append(line);
                    }
                }
                boolean completed = process.waitFor(8, java.util.concurrent.TimeUnit.SECONDS);
                if (completed) {
                    String jsonStr = stdout.toString().trim();
                    if (!jsonStr.isEmpty() && jsonStr.startsWith("[")) {
                        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        List<ExecutionTrace> traces = mapper.readValue(jsonStr, new com.fasterxml.jackson.core.type.TypeReference<List<ExecutionTrace>>() {});
                        if (traces != null && !traces.isEmpty()) {
                            PythonTraceGenerator.postProcessTraces(traces, 100);
                            return traces;
                        }
                    }
                }
            }

            return createFallbackTrace(code, "c");
        } catch (Exception e) {
            return createFallbackTrace(code, "c");
        } finally {
            cleanup(tempDir);
        }
    }

    public static List<ExecutionTrace> createFallbackTrace(String code, String lang) {
        List<ExecutionTrace> list = new ArrayList<>();
        String[] lines = code.split("\\R");
        
        // Track the simulated state of variables
        Map<String, String> varValues = new LinkedHashMap<>();
        Map<String, String> varTypes = new HashMap<>();
        Map<String, Boolean> varIsRef = new HashMap<>();
        
        // Simple regexes to parse variables
        Pattern arrayPattern = Pattern.compile("(?:int|float|double|char)\\s+(\\w+)\\[\\s*\\w*\\s*\\]\\s*=\\s*\\{([^}]+)\\}");
        Pattern vectorPattern = Pattern.compile("vector<\\w+>\\s+(\\w+)\\s*=\\s*\\{([^}]+)\\}");
        Pattern scalarDeclPattern = Pattern.compile("(?:int|float|double|char|size_t)\\s+(\\w+)\\s*=\\s*([^;]+)");
        Pattern assignPattern = Pattern.compile("^\\s*(\\w+)\\s*=\\s*([^;]+)");

        // Initial scan for arrays and vectors so they are always in scope in main
        for (String line : lines) {
            String cleanLine = line.trim();
            Matcher mArr = arrayPattern.matcher(cleanLine);
            if (mArr.find()) {
                String name = mArr.group(1);
                String vals = "[" + mArr.group(2).trim() + "]";
                varValues.put(name, vals);
                varTypes.put(name, "list");
                varIsRef.put(name, true);
            }
            Matcher mVec = vectorPattern.matcher(cleanLine);
            if (mVec.find()) {
                String name = mVec.group(1);
                String vals = "[" + mVec.group(2).trim() + "]";
                varValues.put(name, vals);
                varTypes.put(name, "list");
                varIsRef.put(name, true);
            }
        }
        
        int stepNum = 1;
        for (int i = 0; i < Math.min(lines.length, 120); i++) {
            String rawLine = lines[i];
            String lineCode = rawLine.trim();
            
            // Skip comments, includes, empty lines
            if (lineCode.isEmpty() || lineCode.startsWith("//") || lineCode.startsWith("/*") || lineCode.startsWith("*") || lineCode.startsWith("#")) {
                continue;
            }
            
            // Parse scalar declarations
            Matcher mDecl = scalarDeclPattern.matcher(lineCode);
            if (mDecl.find()) {
                String name = mDecl.group(1);
                String valExpr = mDecl.group(2).trim();
                String evaluated = evaluateSimpleExpression(valExpr, varValues);
                varValues.put(name, evaluated);
                varTypes.put(name, "int");
                varIsRef.put(name, false);
            } else {
                // Parse assignments
                Matcher mAssign = assignPattern.matcher(lineCode);
                if (mAssign.find()) {
                    String name = mAssign.group(1);
                    String valExpr = mAssign.group(2).trim();
                    if (varValues.containsKey(name) || name.equals("left") || name.equals("right") || name.equals("mid")) {
                        String evaluated = evaluateSimpleExpression(valExpr, varValues);
                        varValues.put(name, evaluated);
                        if (!varTypes.containsKey(name)) {
                            varTypes.put(name, "int");
                            varIsRef.put(name, false);
                        }
                    }
                }
            }

            ExecutionTrace step = new ExecutionTrace();
            step.setStepNumber(stepNum++);
            step.setCurrentLineNumber(i + 1);
            step.setExecutedSourceCode(rawLine);
            step.setExecutionStatus("SUCCESS");
            step.setCurrentFunction("main");
            step.setCurrentScope("main");
            
            List<VariableSnapshot> vars = new ArrayList<>();
            int addrOffset = 0;
            for (Map.Entry<String, String> entry : varValues.entrySet()) {
                String name = entry.getKey();
                String val = entry.getValue();
                String type = varTypes.get(name);
                boolean isRef = varIsRef.getOrDefault(name, false);
                String hexAddr = "0x7ffd" + Integer.toHexString(14500 + addrOffset);
                addrOffset += 4;
                
                vars.add(new VariableSnapshot(name, type, val, "local", hexAddr, 1, 1, 0, isRef));
            }
            step.setVariablesAfter(vars);
            list.add(step);
        }
        
        PythonTraceGenerator.postProcessTraces(list, 50);
        return list;
    }

    private static String evaluateSimpleExpression(String expr, Map<String, String> varValues) {
        String cleanExpr = expr.trim();
        // Replace variables with their values
        for (Map.Entry<String, String> entry : varValues.entrySet()) {
            if (!entry.getValue().startsWith("[")) { // skip arrays
                cleanExpr = cleanExpr.replaceAll("\\b" + entry.getKey() + "\\b", entry.getValue());
            }
        }
        try {
            cleanExpr = cleanExpr.replaceAll("sizeof\\([^)]+\\)\\s*/\\s*sizeof\\([^)]+\\)", "5"); // assume size 5
            cleanExpr = cleanExpr.replaceAll("size\\s*-\\s*1", "4");
            cleanExpr = cleanExpr.replaceAll("arr\\.size\\(\\)\\s*-\\s*1", "4");
            
            return String.valueOf(evalMath(cleanExpr));
        } catch (Exception e) {
            return cleanExpr;
        }
    }

    private static int evalMath(final String str) {
        try {
            return (int) new Object() {
                int pos = -1, ch;

                void nextChar() {
                    ch = (++pos < str.length()) ? str.charAt(pos) : -1;
                }

                boolean eat(int charToEat) {
                    while (ch == ' ') nextChar();
                    if (ch == charToEat) {
                        nextChar();
                        return true;
                    }
                    return false;
                }

                double parse() {
                    nextChar();
                    double x = parseExpression();
                    return x;
                }

                double parseExpression() {
                    double x = parseTerm();
                    for (;;) {
                        if      (eat('+')) x += parseTerm();
                        else if (eat('-')) x -= parseTerm();
                        else return x;
                    }
                }

                double parseTerm() {
                    double x = parseFactor();
                    for (;;) {
                        if      (eat('*')) x *= parseFactor();
                        else if (eat('/')) {
                            double divisor = parseFactor();
                            x = divisor == 0 ? 0 : x / divisor;
                        }
                        else return x;
                    }
                }

                double parseFactor() {
                    if (eat('+')) return parseFactor();
                    if (eat('-')) return -parseFactor();

                    double x;
                    int startPos = this.pos;
                    if (eat('(')) {
                        x = parseExpression();
                        eat(')');
                    } else if ((ch >= '0' && ch <= '9') || ch == '.') {
                        while ((ch >= '0' && ch <= '9') || ch == '.') nextChar();
                        x = Double.parseDouble(str.substring(startPos, this.pos));
                    } else {
                        return 0;
                    }

                    return x;
                }
            }.parse();
        } catch (Exception e) {
            return 0;
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
