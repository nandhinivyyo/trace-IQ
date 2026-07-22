package com.codeinsight.service;

import com.codeinsight.dto.CompileRequest;
import com.codeinsight.dto.CompileResult;
import com.codeinsight.dto.ExecutionResult;
import com.codeinsight.dto.RunRequest;
import com.codeinsight.model.ExecutionTrace;
import com.codeinsight.service.impl.CLanguageAdapter;
import com.codeinsight.service.impl.CppLanguageAdapter;
import com.codeinsight.service.impl.JavaLanguageAdapter;
import com.codeinsight.service.impl.PythonLanguageAdapter;
import com.codeinsight.service.trace.*;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ExecutionService {
    private final Map<String, LanguageAdapter> adapters = new HashMap<>();
    private final Map<String, TraceGenerator> traceGenerators = new HashMap<>();

    public ExecutionService() {
        adapters.put("java", new JavaLanguageAdapter());
        adapters.put("python", new PythonLanguageAdapter());
        adapters.put("c", new CLanguageAdapter());
        adapters.put("cpp", new CppLanguageAdapter());

        traceGenerators.put("java", new JavaTraceGenerator());
        traceGenerators.put("python", new PythonTraceGenerator());
        traceGenerators.put("c", new CTraceGenerator());
        traceGenerators.put("cpp", new CppTraceGenerator());
    }

    public CompileResult compile(CompileRequest request) {
        String lang = request.getLanguage().toLowerCase();
        LanguageAdapter adapter = adapters.get(lang);
        if (adapter == null) {
            return new CompileResult("ERROR", "Unsupported language: " + request.getLanguage());
        }
        return adapter.compile(request.getCode());
    }

    public ExecutionResult run(RunRequest request) {
        String lang = request.getLanguage().toLowerCase();
        LanguageAdapter adapter = adapters.get(lang);
        if (adapter == null) {
            return new ExecutionResult("ERROR", request.getLanguage(), 0, 0, "", "Unsupported language: " + request.getLanguage(), false);
        }
        return adapter.run(request.getCode(), request.getInput());
    }

    public List<ExecutionTrace> generateTrace(RunRequest request) {
        String lang = request.getLanguage().toLowerCase();
        TraceGenerator generator = traceGenerators.get(lang);
        if (generator == null) {
            throw new IllegalArgumentException("Unsupported language for tracing: " + request.getLanguage());
        }
        return generator.generateTrace(request.getCode(), request.getInput());
    }
}
