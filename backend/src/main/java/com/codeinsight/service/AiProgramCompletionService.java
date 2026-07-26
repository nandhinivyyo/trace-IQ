package com.codeinsight.service;

import com.codeinsight.dto.CompleteProgramRequest;
import com.codeinsight.dto.CompleteProgramResponse;

public interface AiProgramCompletionService {
    CompleteProgramResponse completeProgram(CompleteProgramRequest request);
}
