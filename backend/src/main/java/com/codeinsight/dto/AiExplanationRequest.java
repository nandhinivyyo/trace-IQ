package com.codeinsight.dto;

import com.codeinsight.model.VariableSnapshot;
import com.codeinsight.model.FunctionFrame;
import com.codeinsight.model.LoopState;
import java.util.List;

public class AiExplanationRequest {
    private String code;
    private String language;
    private String learningMode; // "BEGINNER", "INTERMEDIATE", "ADVANCED"
    private String provider; // "MOCK", "OPENAI", "GEMINI", "OLLAMA"
    
    // Execution trace fields
    private int stepNumber;
    private int currentLineNumber;
    private String executedSourceCode;
    private String currentFunction;
    private List<VariableSnapshot> variablesAfter;
    private List<FunctionFrame> functionStack;
    private LoopState loopInformation;
    private String currentConsoleOutput;

    public AiExplanationRequest() {}

    // Getters and Setters
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getLearningMode() { return learningMode; }
    public void setLearningMode(String learningMode) { this.learningMode = learningMode; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public int getStepNumber() { return stepNumber; }
    public void setStepNumber(int stepNumber) { this.stepNumber = stepNumber; }

    public int getCurrentLineNumber() { return currentLineNumber; }
    public void setCurrentLineNumber(int currentLineNumber) { this.currentLineNumber = currentLineNumber; }

    public String getExecutedSourceCode() { return executedSourceCode; }
    public void setExecutedSourceCode(String executedSourceCode) { this.executedSourceCode = executedSourceCode; }

    public String getCurrentFunction() { return currentFunction; }
    public void setCurrentFunction(String currentFunction) { this.currentFunction = currentFunction; }

    public List<VariableSnapshot> getVariablesAfter() { return variablesAfter; }
    public void setVariablesAfter(List<VariableSnapshot> variablesAfter) { this.variablesAfter = variablesAfter; }

    public List<FunctionFrame> getFunctionStack() { return functionStack; }
    public void setFunctionStack(List<FunctionFrame> functionStack) { this.functionStack = functionStack; }

    public LoopState getLoopInformation() { return loopInformation; }
    public void setLoopInformation(LoopState loopInformation) { this.loopInformation = loopInformation; }

    public String getCurrentConsoleOutput() { return currentConsoleOutput; }
    public void setCurrentConsoleOutput(String currentConsoleOutput) { this.currentConsoleOutput = currentConsoleOutput; }
}
