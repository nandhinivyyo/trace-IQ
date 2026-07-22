package com.codeinsight.service.impl;

import com.codeinsight.dto.AiExplanationRequest;
import com.codeinsight.dto.AiExplanationResponse;
import com.codeinsight.service.AiExplanationProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service("ollamaExplanationProvider")
public class OllamaExplanationProvider implements AiExplanationProvider {

    private final AiExplanationProvider mockProvider;

    @Autowired
    public OllamaExplanationProvider(@Qualifier("mockExplanationProvider") AiExplanationProvider mockProvider) {
        this.mockProvider = mockProvider;
    }

    @Override
    public AiExplanationResponse explainStep(AiExplanationRequest request) {
        // In production, configure Ollama local endpoint http://localhost:11434/api/generate.
        // Falls back to mock provider prepending the LLM provider tag.
        AiExplanationResponse response = mockProvider.explainStep(request);
        response.setExplanation("[Local Ollama Llama3] " + response.getExplanation());
        response.setAlgorithmInsight(response.getAlgorithmInsight() != null ? 
            "[Ollama Local Mode] " + response.getAlgorithmInsight() : "[Ollama Local Mode] Standby");
        return response;
    }
}
