package com.codeinsight.dto;

public class DebugRequest {
    private String code;
    private String language;
    private String errorLogs;
    private String provider; // "MOCK", "OPENAI", "GEMINI", "OLLAMA"

    public DebugRequest() {}

    // Getters and Setters
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getErrorLogs() { return errorLogs; }
    public void setErrorLogs(String errorLogs) { this.errorLogs = errorLogs; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
}
