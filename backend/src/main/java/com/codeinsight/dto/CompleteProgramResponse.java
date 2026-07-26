package com.codeinsight.dto;

public class CompleteProgramResponse {
    private String code;
    private boolean converted;

    public CompleteProgramResponse() {}

    public CompleteProgramResponse(String code, boolean converted) {
        this.code = code;
        this.converted = converted;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public boolean isConverted() {
        return converted;
    }

    public void setConverted(boolean converted) {
        this.converted = converted;
    }
}
