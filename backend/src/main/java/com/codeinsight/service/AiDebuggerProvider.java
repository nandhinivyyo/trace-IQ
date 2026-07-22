package com.codeinsight.service;

import com.codeinsight.dto.DebugRequest;
import com.codeinsight.dto.DebugResponse;

public interface AiDebuggerProvider {
    DebugResponse diagnoseCode(DebugRequest request);
}
