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

@Service("openaiDebuggerProvider")
public class OpenAiDebuggerProvider implements AiDebuggerProvider {

    private final AiDebuggerProvider mockProvider;

    @Autowired
    public OpenAiDebuggerProvider(@Qualifier("mockDebuggerProvider") AiDebuggerProvider mockProvider) {
        this.mockProvider = mockProvider;
    }

    @Override
    public DebugResponse diagnoseCode(DebugRequest request) {
        DebugResponse response = mockProvider.diagnoseCode(request);
        
        List<DebugIssue> taggedIssues = new ArrayList<>();
        for (DebugIssue issue : response.getIssues()) {
            issue.setMessage("[OpenAI GPT-4o] " + issue.getMessage());
            taggedIssues.add(issue);
        }
        response.setIssues(taggedIssues);
        response.setReadabilityReview("*(OpenAI GPT-4o Debug Sandbox)*\n\n" + response.getReadabilityReview());
        
        return response;
    }
}
