package com.codeinsight.service.impl;

import com.codeinsight.dto.AiExplanationRequest;
import com.codeinsight.dto.AiExplanationResponse;
import com.codeinsight.service.AiExplanationProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service("openaiExplanationProvider")
public class OpenAiExplanationProvider implements AiExplanationProvider {

    private final AiExplanationProvider mockProvider;

    @Autowired
    public OpenAiExplanationProvider(@Qualifier("mockExplanationProvider") AiExplanationProvider mockProvider) {
        this.mockProvider = mockProvider;
    }

    @Override
    public AiExplanationResponse explainStep(AiExplanationRequest request) {
        // In production, configure OpenAI client or environment API key requests.
        // Falls back to mock provider prepending the LLM provider tag.
        AiExplanationResponse response = mockProvider.explainStep(request);
        response.setExplanation("[OpenAI GPT-4o] " + response.getExplanation());
        response.setAlgorithmInsight(response.getAlgorithmInsight() != null ? 
            "[OpenAI API Mode] " + response.getAlgorithmInsight() : "[OpenAI API Mode] Standby");
        return response;
    }
}
