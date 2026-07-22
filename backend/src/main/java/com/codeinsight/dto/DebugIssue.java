package com.codeinsight.dto;

public class DebugIssue {
    private String type; // "SYNTAX", "RUNTIME", "LOGICAL", "SECURITY", "SMELL", "BEST_PRACTICE"
    private String severity; // "ERROR", "WARNING", "INFO"
    private String message;
    private int line;
    private String rootCause;
    private String reproduction;
    private String remedy;
    private String commonMistake;

    public DebugIssue() {}

    public DebugIssue(String type, String severity, String message, int line, 
                      String rootCause, String reproduction, String remedy, String commonMistake) {
        this.type = type;
        this.severity = severity;
        this.message = message;
        this.line = line;
        this.rootCause = rootCause;
        this.reproduction = reproduction;
        this.remedy = remedy;
        this.commonMistake = commonMistake;
    }

    // Getters and Setters
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public int getLine() { return line; }
    public void setLine(int line) { this.line = line; }

    public String getRootCause() { return rootCause; }
    public void setRootCause(String rootCause) { this.rootCause = rootCause; }

    public String getReproduction() { return reproduction; }
    public void setReproduction(String reproduction) { this.reproduction = reproduction; }

    public String getRemedy() { return remedy; }
    public void setRemedy(String remedy) { this.remedy = remedy; }

    public String getCommonMistake() { return commonMistake; }
    public void setCommonMistake(String commonMistake) { this.commonMistake = commonMistake; }
}
