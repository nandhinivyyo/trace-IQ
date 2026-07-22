package com.codeinsight.service;

import com.codeinsight.dto.TutorRequest;
import com.codeinsight.dto.TutorResponse;

public interface AiTutorProvider {
    TutorResponse consultTutor(TutorRequest request);
}
