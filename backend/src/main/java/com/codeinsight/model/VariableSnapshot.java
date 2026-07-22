package com.codeinsight.model;

public class VariableSnapshot {
    private String name;
    private String datatype;
    private String value;
    private String scope;
    private String memoryAddress;
    private int createdStep;
    private int updatedStep;
    private int destroyedStep;
    private boolean referenceType; // true for object, false for primitive

    public VariableSnapshot() {}

    public VariableSnapshot(String name, String datatype, String value, String scope, String memoryAddress,
                            int createdStep, int updatedStep, int destroyedStep, boolean referenceType) {
        this.name = name;
        this.datatype = datatype;
        this.value = value;
        this.scope = scope;
        this.memoryAddress = memoryAddress;
        this.createdStep = createdStep;
        this.updatedStep = updatedStep;
        this.destroyedStep = destroyedStep;
        this.referenceType = referenceType;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDatatype() {
        return datatype;
    }

    public void setDatatype(String datatype) {
        this.datatype = datatype;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getScope() {
        return scope;
    }

    public void setScope(String scope) {
        this.scope = scope;
    }

    public String getMemoryAddress() {
        return memoryAddress;
    }

    public void setMemoryAddress(String memoryAddress) {
        this.memoryAddress = memoryAddress;
    }

    public int getCreatedStep() {
        return createdStep;
    }

    public void setCreatedStep(int createdStep) {
        this.createdStep = createdStep;
    }

    public int getUpdatedStep() {
        return updatedStep;
    }

    public void setUpdatedStep(int updatedStep) {
        this.updatedStep = updatedStep;
    }

    public int getDestroyedStep() {
        return destroyedStep;
    }

    public void setDestroyedStep(int destroyedStep) {
        this.destroyedStep = destroyedStep;
    }

    public boolean isReferenceType() {
        return referenceType;
    }

    public void setReferenceType(boolean referenceType) {
        this.referenceType = referenceType;
    }
}
