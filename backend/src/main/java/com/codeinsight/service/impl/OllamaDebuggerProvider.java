package com.codeinsight.service.impl;

import com.codeinsight.dto.DebugIssue;
import com.codeinsight.dto.DebugRequest;
import com.codeinsight.dto.DebugResponse;
import com.codeinsight.service.AiDebuggerProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service("ollamaDebuggerProvider")
public class OllamaDebuggerProvider implements AiDebuggerProvider {

    private final AiDebuggerProvider mockProvider;

    @Autowired
    public OllamaDebuggerProvider(@Qualifier("mockDebuggerProvider") AiDebuggerProvider mockProvider) {
        this.mockProvider = mockProvider;
    }

    @Override
    public DebugResponse diagnoseCode(DebugRequest request) {
        DebugResponse response = mockProvider.diagnoseCode(request);
        
        List<DebugIssue> taggedIssues = new ArrayList<>();
        for (DebugIssue issue : response.getIssues()) {
            issue.setMessage("[Ollama Llama3] " + issue.getMessage());
            taggedIssues.add(issue);
        }
        response.setIssues(taggedIssues);
        response.setReadabilityReview("*(Ollama Llama3 Debug Sandbox)*\n\n" + response.getReadabilityReview());
        
        return response;
    }
}
