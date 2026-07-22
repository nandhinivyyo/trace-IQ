package com.codeinsight.service;

import com.codeinsight.dto.AiExplanationRequest;
import com.codeinsight.dto.AiExplanationResponse;

public interface AiExplanationProvider {
    AiExplanationResponse explainStep(AiExplanationRequest request);
}
