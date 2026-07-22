package com.codeinsight.dto;

import java.util.List;

public class TutorRequest {
    private String code;
    private String language;
    private String problemName;
    private String mode; // "HINT", "SOCRATIC", "TEACHING"
    private int activeLevel; // 1 to 7
    private List<String> history;
    private String provider; // "MOCK", "OPENAI", "GEMINI", "OLLAMA"

    public TutorRequest() {}

    // Getters and Setters
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getProblemName() { return problemName; }
    public void setProblemName(String problemName) { this.problemName = problemName; }

    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }

    public int getActiveLevel() { return activeLevel; }
    public void setActiveLevel(int activeLevel) { this.activeLevel = activeLevel; }

    public List<String> getHistory() { return history; }
    public void setHistory(List<String> history) { this.history = history; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
}
