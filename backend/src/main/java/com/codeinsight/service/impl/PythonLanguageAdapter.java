package com.codeinsight.service.impl;

import com.codeinsight.dto.CompileResult;
import com.codeinsight.dto.ExecutionResult;
import com.codeinsight.service.LanguageAdapter;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class PythonLanguageAdapter implements LanguageAdapter {

    @Override
    public CompileResult compile(String code) {
        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("codeinsight_py_");
            Path sourceFile = tempDir.resolve("script.py");
            Files.writeString(sourceFile, code);

            // Check syntax using py_compile
            ProcessBuilder pb = new ProcessBuilder("python", "-m", "py_compile", sourceFile.toString());
            pb.redirectErrorStream(true);
            long startTime = System.currentTimeMillis();
            Process process = pb.start();
            
            StringBuilder compilerOutput = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    compilerOutput.append(line).append("\n");
                }
            }

            boolean completed = process.waitFor(5, TimeUnit.SECONDS);
            if (!completed) {
                process.destroyForcibly();
                return new CompileResult("ERROR", "Compilation check timed out.");
            }

            CompileResult result = new CompileResult();
            if (process.exitValue() == 0) {
                result.setStatus("SUCCESS");
                result.setCompilerOutput("Python syntax check passed.");
            } else {
                result.setStatus("ERROR");
                result.setCompilerOutput(compilerOutput.toString());
                
                // Parse line number from python syntax error: e.g. File "...", line 12
                Pattern pattern = Pattern.compile("line (\\d+)");
                Matcher matcher = pattern.matcher(compilerOutput.toString());
                int lineNum = 1;
                if (matcher.find()) {
                    try {
                        lineNum = Integer.parseInt(matcher.group(1));
                    } catch (NumberFormatException ignored) {}
                }
                result.addLineError(lineNum, compilerOutput.toString().trim());
            }
            return result;
        } catch (Exception e) {
            return new CompileResult("ERROR", "Failed to run Python compiler check: " + e.getMessage());
        } finally {
            cleanup(tempDir);
        }
    }

    @Override
    public ExecutionResult run(String code, String input) {
        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("codeinsight_py_run_");
            Path sourceFile = tempDir.resolve("script.py");
            Files.writeString(sourceFile, code);

            ProcessBuilder pb = new ProcessBuilder("python", sourceFile.toString());
            long startTime = System.currentTimeMillis();
            Process process = pb.start();

            // Write stdin input
            if (input != null && !input.isEmpty()) {
                try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(process.getOutputStream()))) {
                    writer.write(input);
                    writer.flush();
                }
            } else {
                process.getOutputStream().close(); // Close stream to avoid hanging
            }

            StringBuilder stdout = new StringBuilder();
            StringBuilder stderr = new StringBuilder();

            // Read output streams asynchronously
            Thread outThread = new Thread(() -> readStream(process.getInputStream(), stdout));
            Thread errThread = new Thread(() -> readStream(process.getErrorStream(), stderr));
            outThread.start();
            errThread.start();

            boolean completed = process.waitFor(6, TimeUnit.SECONDS);
            long endTime = System.currentTimeMillis();

            if (!completed) {
                process.destroyForcibly();
                outThread.interrupt();
                errThread.interrupt();
                return new ExecutionResult("TIMEOUT", "python", 0, endTime - startTime, "", "Execution timed out.", false);
            }

            outThread.join(2000);
            errThread.join(2000);

            boolean hasInputRequest = code.contains("input(");

            String status = process.exitValue() == 0 ? "SUCCESS" : "ERROR";
            return new ExecutionResult(
                status,
                "python",
                0, // Compile time is 0 for interpreted
                endTime - startTime,
                stdout.toString(),
                stderr.toString(),
                hasInputRequest
            );

        } catch (Exception e) {
            return new ExecutionResult("ERROR", "python", 0, 0, "", "Execution engine error: " + e.getMessage(), false);
        } finally {
            cleanup(tempDir);
        }
    }

    private void readStream(InputStream stream, StringBuilder out) {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream))) {
            String line;
            while ((line = reader.readLine()) != null) {
                out.append(line).append("\n");
            }
        } catch (IOException ignored) {}
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
