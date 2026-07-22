package com.codeinsight.dto;

public class DebugRemedy {
    private String title; // "MINIMAL", "RECOMMENDED", "OPTIMIZED"
    private String code;
    private String advantages;
    private String disadvantages;

    public DebugRemedy() {}

    public DebugRemedy(String title, String code, String advantages, String disadvantages) {
        this.title = title;
        this.code = code;
        this.advantages = advantages;
        this.disadvantages = disadvantages;
    }

    // Getters and Setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getAdvantages() { return advantages; }
    public void setAdvantages(String advantages) { this.advantages = advantages; }

    public String getDisadvantages() { return disadvantages; }
    public void setDisadvantages(String disadvantages) { this.disadvantages = disadvantages; }
}
