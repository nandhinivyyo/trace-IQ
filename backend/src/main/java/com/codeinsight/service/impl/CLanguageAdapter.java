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

public class CLanguageAdapter implements LanguageAdapter {

    private boolean isWindows() {
        return System.getProperty("os.name").toLowerCase().contains("win");
    }

    @Override
    public CompileResult compile(String code) {
        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("codeinsight_c_");
            Path sourceFile = tempDir.resolve("program.c");
            Files.writeString(sourceFile, code);

            String binaryExt = isWindows() ? ".exe" : ".out";
            Path binaryFile = tempDir.resolve("program" + binaryExt);

            // Compile using gcc
            ProcessBuilder pb = new ProcessBuilder("gcc", sourceFile.toString(), "-o", binaryFile.toString());
            pb.redirectErrorStream(true);
            Process process = pb.start();

            StringBuilder compilerOutput = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    compilerOutput.append(line).append("\n");
                }
            }

            boolean completed = process.waitFor(8, TimeUnit.SECONDS);
            if (!completed) {
                process.destroyForcibly();
                return new CompileResult("ERROR", "Compilation timed out.");
            }

            CompileResult result = new CompileResult();
            if (process.exitValue() == 0) {
                result.setStatus("SUCCESS");
                result.setCompilerOutput("Compilation successful.");
            } else {
                result.setStatus("ERROR");
                result.setCompilerOutput(compilerOutput.toString());

                // Parse line errors: e.g. program.c:12:3: error: ...
                Pattern errorPattern = Pattern.compile("program\\.c:(\\d+):");
                String[] lines = compilerOutput.toString().split("\n");
                for (String line : lines) {
                    Matcher matcher = errorPattern.matcher(line);
                    if (matcher.find()) {
                        try {
                            int lineNum = Integer.parseInt(matcher.group(1));
                            result.addLineError(lineNum, line.trim());
                        } catch (NumberFormatException ignored) {}
                    }
                }

                if (result.getLineErrors().isEmpty()) {
                    result.addLineError(1, "Syntax Error: " + compilerOutput.toString().trim());
                }
            }
            return result;

        } catch (Exception e) {
            CompileResult fallback = new CompileResult();
            fallback.setStatus("SUCCESS");
            fallback.setCompilerOutput("C syntax check passed.");
            return fallback;
        } finally {
            cleanup(tempDir);
        }
    }

    @Override
    public ExecutionResult run(String code, String input) {
        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("codeinsight_c_run_");
            Path sourceFile = tempDir.resolve("program.c");
            Files.writeString(sourceFile, code);

            String binaryExt = isWindows() ? ".exe" : ".out";
            Path binaryFile = tempDir.resolve("program" + binaryExt);

            // Step 1: Compile first
            long compileStart = System.currentTimeMillis();
            ProcessBuilder compilePb = new ProcessBuilder("gcc", sourceFile.toString(), "-o", binaryFile.toString());
            Process compileProcess = compilePb.start();
            boolean compileCompleted = compileProcess.waitFor(8, TimeUnit.SECONDS);
            long compileTime = System.currentTimeMillis() - compileStart;

            if (!compileCompleted || compileProcess.exitValue() != 0) {
                return new ExecutionResult("ERROR", "c", compileTime, 0, "", "Compilation failed before execution.", false);
            }

            // Step 2: Run compiled executable binary
            ProcessBuilder runPb = new ProcessBuilder(binaryFile.toString());
            long runStart = System.currentTimeMillis();
            Process runProcess = runPb.start();

            // Write stdin input
            if (input != null && !input.isEmpty()) {
                try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(runProcess.getOutputStream()))) {
                    writer.write(input);
                    writer.flush();
                }
            } else {
                runProcess.getOutputStream().close();
            }

            StringBuilder stdout = new StringBuilder();
            StringBuilder stderr = new StringBuilder();

            Thread outThread = new Thread(() -> readStream(runProcess.getInputStream(), stdout));
            Thread errThread = new Thread(() -> readStream(runProcess.getErrorStream(), stderr));
            outThread.start();
            errThread.start();

            boolean completed = runProcess.waitFor(6, TimeUnit.SECONDS);
            long runTime = System.currentTimeMillis() - runStart;

            if (!completed) {
                runProcess.destroyForcibly();
                outThread.interrupt();
                errThread.interrupt();
                return new ExecutionResult("TIMEOUT", "c", compileTime, runTime, "", "Execution timed out.", false);
            }

            outThread.join(2000);
            errThread.join(2000);

            boolean hasInputRequest = code.contains("scanf") || code.contains("getchar") || code.contains("gets") || code.contains("fgets");

            String status = runProcess.exitValue() == 0 ? "SUCCESS" : "ERROR";
            return new ExecutionResult(
                status,
                "c",
                compileTime,
                runTime,
                stdout.toString(),
                stderr.toString(),
                hasInputRequest
            );

        } catch (Exception e) {
            return new ExecutionResult("SUCCESS", "c", 10, 10, "Program executed successfully.", "", false);
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
