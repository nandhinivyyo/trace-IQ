package com.codeinsight.model;

import java.util.HashMap;
import java.util.Map;

public class LoopState {
    private String loopType; // e.g. "for", "while"
    private int outerLoopNumber;
    private int innerLoopNumber;
    private int iterationNumber;
    private int maxIteration;
    private Map<String, String> loopVariables = new HashMap<>();
    private String conditionResult; // e.g. "true", "false"

    public LoopState() {}

    public LoopState(String loopType, int iterationNumber) {
        this.loopType = loopType;
        this.iterationNumber = iterationNumber;
    }

    public String getLoopType() {
        return loopType;
    }

    public void setLoopType(String loopType) {
        this.loopType = loopType;
    }

    public int getOuterLoopNumber() {
        return outerLoopNumber;
    }

    public void setOuterLoopNumber(int outerLoopNumber) {
        this.outerLoopNumber = outerLoopNumber;
    }

    public int getInnerLoopNumber() {
        return innerLoopNumber;
    }

    public void setInnerLoopNumber(int innerLoopNumber) {
        this.innerLoopNumber = innerLoopNumber;
    }

    public int getIterationNumber() {
        return iterationNumber;
    }

    public void setIterationNumber(int iterationNumber) {
        this.iterationNumber = iterationNumber;
    }

    public int getMaxIteration() {
        return maxIteration;
    }

    public void setMaxIteration(int maxIteration) {
        this.maxIteration = maxIteration;
    }

    public Map<String, String> getLoopVariables() {
        return loopVariables;
    }

    public void setLoopVariables(Map<String, String> loopVariables) {
        this.loopVariables = loopVariables;
    }

    public void addLoopVariable(String name, String value) {
        this.loopVariables.put(name, value);
    }

    public String getConditionResult() {
        return conditionResult;
    }

    public void setConditionResult(String conditionResult) {
        this.conditionResult = conditionResult;
    }
}
