package com.codeinsight.model;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MemorySnapshot {
    private List<String> stackAddresses = new ArrayList<>();
    private Map<String, Object> heapObjects = new HashMap<>();

    public MemorySnapshot() {}

    public List<String> getStackAddresses() {
        return stackAddresses;
    }

    public void setStackAddresses(List<String> stackAddresses) {
        this.stackAddresses = stackAddresses;
    }

    public Map<String, Object> getHeapObjects() {
        return heapObjects;
    }

    public void setHeapObjects(Map<String, Object> heapObjects) {
        this.heapObjects = heapObjects;
    }

    public void addStackAddress(String address) {
        this.stackAddresses.add(address);
    }

    public void addHeapObject(String address, Object details) {
        this.heapObjects.put(address, details);
    }
}
