package com.codeinsight.service.trace;

import com.codeinsight.model.ExecutionTrace;
import java.util.List;

public interface TraceGenerator {
    List<ExecutionTrace> generateTrace(String code, String input);
}
