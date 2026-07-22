package com.codeinsight.dto;

import java.util.ArrayList;
import java.util.List;

public class CompileResult {
    private String status; // "SUCCESS" or "ERROR"
    private String compilerOutput;
    private List<LineError> lineErrors = new ArrayList<>();

    public CompileResult() {}

    public CompileResult(String status, String compilerOutput) {
        this.status = status;
        this.compilerOutput = compilerOutput;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCompilerOutput() {
        return compilerOutput;
    }

    public void setCompilerOutput(String compilerOutput) {
        this.compilerOutput = compilerOutput;
    }

    public List<LineError> getLineErrors() {
        return lineErrors;
    }

    public void setLineErrors(List<LineError> lineErrors) {
        this.lineErrors = lineErrors;
    }

    public void addLineError(int line, String message) {
        this.lineErrors.add(new LineError(line, message));
    }

    public static class LineError {
        private int line;
        private String message;

        public LineError() {}

        public LineError(int line, String message) {
            this.line = line;
            this.message = message;
        }

        public int getLine() {
            return line;
        }

        public void setLine(int line) {
            this.line = line;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}
