package com.codeinsight.dto;

public class ExecutionResult {
    private String status; // "SUCCESS", "ERROR", "TIMEOUT"
    private String language;
    private long compileTime;
    private long executionTime;
    private String stdout;
    private String stderr;
    private boolean requiresInput;

    public ExecutionResult() {}

    public ExecutionResult(String status, String language, long compileTime, long executionTime, String stdout, String stderr, boolean requiresInput) {
        this.status = status;
        this.language = language;
        this.compileTime = compileTime;
        this.executionTime = executionTime;
        this.stdout = stdout;
        this.stderr = stderr;
        this.requiresInput = requiresInput;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public long getCompileTime() {
        return compileTime;
    }

    public void setCompileTime(long compileTime) {
        this.compileTime = compileTime;
    }

    public long getExecutionTime() {
        return executionTime;
    }

    public void setExecutionTime(long executionTime) {
        this.executionTime = executionTime;
    }

    public String getStdout() {
        return stdout;
    }

    public void setStdout(String stdout) {
        this.stdout = stdout;
    }

    public String getStderr() {
        return stderr;
    }

    public void setStderr(String stderr) {
        this.stderr = stderr;
    }

    public boolean isRequiresInput() {
        return requiresInput;
    }

    public void setRequiresInput(boolean requiresInput) {
        this.requiresInput = requiresInput;
    }
}
