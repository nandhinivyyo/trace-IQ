package com.codeinsight.model;

import java.util.HashMap;
import java.util.Map;

public class FunctionFrame {
    private String currentFunction;
    private String parentFunction;
    private Map<String, String> arguments = new HashMap<>();
    private String returnType;
    private String returnValue;
    private int callDepth;
    private int recursiveCallCount;
    private int returnLine;

    public FunctionFrame() {}

    public FunctionFrame(String currentFunction, String parentFunction, int callDepth) {
        this.currentFunction = currentFunction;
        this.parentFunction = parentFunction;
        this.callDepth = callDepth;
    }

    public String getCurrentFunction() {
        return currentFunction;
    }

    public void setCurrentFunction(String currentFunction) {
        this.currentFunction = currentFunction;
    }

    public String getParentFunction() {
        return parentFunction;
    }

    public void setParentFunction(String parentFunction) {
        this.parentFunction = parentFunction;
    }

    public Map<String, String> getArguments() {
        return arguments;
    }

    public void setArguments(Map<String, String> arguments) {
        this.arguments = arguments;
    }

    public void addArgument(String name, String value) {
        this.arguments.put(name, value);
    }

    public String getReturnType() {
        return returnType;
    }

    public void setReturnType(String returnType) {
        this.returnType = returnType;
    }

    public String getReturnValue() {
        return returnValue;
    }

    public void setReturnValue(String returnValue) {
        this.returnValue = returnValue;
    }

    public int getCallDepth() {
        return callDepth;
    }

    public void setCallDepth(int callDepth) {
        this.callDepth = callDepth;
    }

    public int getRecursiveCallCount() {
        return recursiveCallCount;
    }

    public void setRecursiveCallCount(int recursiveCallCount) {
        this.recursiveCallCount = recursiveCallCount;
    }

    public int getReturnLine() {
        return returnLine;
    }

    public void setReturnLine(int returnLine) {
        this.returnLine = returnLine;
    }
}
