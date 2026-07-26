package com.codeinsight.dto;

public class CompleteProgramRequest {
    private String code;
    private String language;
    private Boolean isFunction;
    private String provider;

    public CompleteProgramRequest() {}

    public CompleteProgramRequest(String code, String language, Boolean isFunction, String provider) {
        this.code = code;
        this.language = language;
        this.isFunction = isFunction;
        this.provider = provider;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public Boolean getIsFunction() {
        return isFunction;
    }

    public void setIsFunction(Boolean isFunction) {
        this.isFunction = isFunction;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }
}
