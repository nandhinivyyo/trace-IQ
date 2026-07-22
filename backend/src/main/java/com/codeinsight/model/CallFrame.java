package com.codeinsight.model;

import java.util.HashMap;
import java.util.Map;

public class CallFrame {
    private String name;
    private String arguments;
    private Map<String, Object> localVariables = new HashMap<>();

    public CallFrame() {}

    public CallFrame(String name, String arguments) {
        this.name = name;
        this.arguments = arguments;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getArguments() {
        return arguments;
    }

    public void setArguments(String arguments) {
        this.arguments = arguments;
    }

    public Map<String, Object> getLocalVariables() {
        return localVariables;
    }

    public void setLocalVariables(Map<String, Object> localVariables) {
        this.localVariables = localVariables;
    }

    public void addVariable(String name, Object value) {
        this.localVariables.put(name, value);
    }
}
