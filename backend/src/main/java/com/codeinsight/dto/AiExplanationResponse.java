package com.codeinsight.dto;

public class AiExplanationResponse {
    private int stepNumber;
    private int currentLineNumber;
    private String explanation;
    private String variableChanges;
    private String memoryChanges;
    private String loopExplanation;
    private String functionExplanation;
    private String dsaExplanation;
    private String algorithmInsight;
    private String optimizationTip;

    public AiExplanationResponse() {}

    public AiExplanationResponse(int stepNumber, int currentLineNumber, String explanation, 
                                String variableChanges, String memoryChanges, String loopExplanation, 
                                String functionExplanation, String dsaExplanation, 
                                String algorithmInsight, String optimizationTip) {
        this.stepNumber = stepNumber;
        this.currentLineNumber = currentLineNumber;
        this.explanation = explanation;
        this.variableChanges = variableChanges;
        this.memoryChanges = memoryChanges;
        this.loopExplanation = loopExplanation;
        this.functionExplanation = functionExplanation;
        this.dsaExplanation = dsaExplanation;
        this.algorithmInsight = algorithmInsight;
        this.optimizationTip = optimizationTip;
    }

    // Getters and Setters
    public int getStepNumber() { return stepNumber; }
    public void setStepNumber(int stepNumber) { this.stepNumber = stepNumber; }

    public int getCurrentLineNumber() { return currentLineNumber; }
    public void setCurrentLineNumber(int currentLineNumber) { this.currentLineNumber = currentLineNumber; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }

    public String getVariableChanges() { return variableChanges; }
    public void setVariableChanges(String variableChanges) { this.variableChanges = variableChanges; }

    public String getMemoryChanges() { return memoryChanges; }
    public void setMemoryChanges(String memoryChanges) { this.memoryChanges = memoryChanges; }

    public String getLoopExplanation() { return loopExplanation; }
    public void setLoopExplanation(String loopExplanation) { this.loopExplanation = loopExplanation; }

    public String getFunctionExplanation() { return functionExplanation; }
    public void setFunctionExplanation(String functionExplanation) { this.functionExplanation = functionExplanation; }

    public String getDsaExplanation() { return dsaExplanation; }
    public void setDsaExplanation(String dsaExplanation) { this.dsaExplanation = dsaExplanation; }

    public String getAlgorithmInsight() { return algorithmInsight; }
    public void setAlgorithmInsight(String algorithmInsight) { this.algorithmInsight = algorithmInsight; }

    public String getOptimizationTip() { return optimizationTip; }
    public void setOptimizationTip(String optimizationTip) { this.optimizationTip = optimizationTip; }
}
