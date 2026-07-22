package com.codeinsight.service.trace;

import com.codeinsight.model.ExecutionTrace;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

public class CppTraceGenerator implements TraceGenerator {

    @Override
    public List<ExecutionTrace> generateTrace(String code, String input) {
        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("codeinsight_cpp_trace_");
            Path sourceFile = tempDir.resolve("program.cpp");
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

            return CTraceGenerator.createFallbackTrace(code, "cpp");
        } catch (Exception e) {
            return CTraceGenerator.createFallbackTrace(code, "cpp");
        } finally {
            cleanup(tempDir);
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
