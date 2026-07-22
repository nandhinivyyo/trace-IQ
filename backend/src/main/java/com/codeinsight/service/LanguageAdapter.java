package com.codeinsight.service;

import com.codeinsight.dto.CompileResult;
import com.codeinsight.dto.ExecutionResult;

public interface LanguageAdapter {
    CompileResult compile(String code);
    ExecutionResult run(String code, String input);
}
