package com.codeinsight.model;

import java.util.ArrayList;
import java.util.List;

public class ExecutionTrace {
    private int stepNumber;
    private int currentLineNumber;
    private String executedSourceCode;
    private long executionTimestamp;
    private String executionStatus; // "SUCCESS", "ERROR", "EXCEPTION"
    
    private List<VariableSnapshot> variablesBefore = new ArrayList<>();
    private List<VariableSnapshot> variablesAfter = new ArrayList<>();
    private List<VariableSnapshot> modifiedVariables = new ArrayList<>();
    
    private String currentFunction;
    private List<FunctionFrame> functionStack = new ArrayList<>();
    private LoopState loopInformation;
    private int recursionDepth;
    private String currentConsoleOutput;
    private String inputConsumed;
    private String currentScope;
    private long executionDuration;

    public ExecutionTrace() {
        this.executionTimestamp = System.currentTimeMillis();
    }

    public int getStepNumber() {
        return stepNumber;
    }

    public void setStepNumber(int stepNumber) {
        this.stepNumber = stepNumber;
    }

    public int getCurrentLineNumber() {
        return currentLineNumber;
    }

    public void setCurrentLineNumber(int currentLineNumber) {
        this.currentLineNumber = currentLineNumber;
    }

    public String getExecutedSourceCode() {
        return executedSourceCode;
    }

    public void setExecutedSourceCode(String executedSourceCode) {
        this.executedSourceCode = executedSourceCode;
    }

    public long getExecutionTimestamp() {
        return executionTimestamp;
    }

    public void setExecutionTimestamp(long executionTimestamp) {
        this.executionTimestamp = executionTimestamp;
    }

    public String getExecutionStatus() {
        return executionStatus;
    }

    public void setExecutionStatus(String executionStatus) {
        this.executionStatus = executionStatus;
    }

    public List<VariableSnapshot> getVariablesBefore() {
        return variablesBefore;
    }

    public void setVariablesBefore(List<VariableSnapshot> variablesBefore) {
        this.variablesBefore = variablesBefore;
    }

    public List<VariableSnapshot> getVariablesAfter() {
        return variablesAfter;
    }

    public void setVariablesAfter(List<VariableSnapshot> variablesAfter) {
        this.variablesAfter = variablesAfter;
    }

    public List<VariableSnapshot> getModifiedVariables() {
        return modifiedVariables;
    }

    public void setModifiedVariables(List<VariableSnapshot> modifiedVariables) {
        this.modifiedVariables = modifiedVariables;
    }

    public String getCurrentFunction() {
        return currentFunction;
    }

    public void setCurrentFunction(String currentFunction) {
        this.currentFunction = currentFunction;
    }

    public List<FunctionFrame> getFunctionStack() {
        return functionStack;
    }

    public void setFunctionStack(List<FunctionFrame> functionStack) {
        this.functionStack = functionStack;
    }

    public LoopState getLoopInformation() {
        return loopInformation;
    }

    public void setLoopInformation(LoopState loopInformation) {
        this.loopInformation = loopInformation;
    }

    public int getRecursionDepth() {
        return recursionDepth;
    }

    public void setRecursionDepth(int recursionDepth) {
        this.recursionDepth = recursionDepth;
    }

    public String getCurrentConsoleOutput() {
        return currentConsoleOutput;
    }

    public void setCurrentConsoleOutput(String currentConsoleOutput) {
        this.currentConsoleOutput = currentConsoleOutput;
    }

    public String getInputConsumed() {
        return inputConsumed;
    }

    public void setInputConsumed(String inputConsumed) {
        this.inputConsumed = inputConsumed;
    }

    public String getCurrentScope() {
        return currentScope;
    }

    public void setCurrentScope(String currentScope) {
        this.currentScope = currentScope;
    }

    public long getExecutionDuration() {
        return executionDuration;
    }

    public void setExecutionDuration(long executionDuration) {
        this.executionDuration = executionDuration;
    }
}
