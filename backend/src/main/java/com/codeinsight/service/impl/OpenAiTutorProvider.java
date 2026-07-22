package com.codeinsight.service.impl;

import com.codeinsight.dto.TutorRequest;
import com.codeinsight.dto.TutorResponse;
import com.codeinsight.service.AiTutorProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service("openaiTutorProvider")
public class OpenAiTutorProvider implements AiTutorProvider {

    private final AiTutorProvider mockProvider;

    @Autowired
    public OpenAiTutorProvider(@Qualifier("mockTutorProvider") AiTutorProvider mockProvider) {
        this.mockProvider = mockProvider;
    }

    @Override
    public TutorResponse consultTutor(TutorRequest request) {
        TutorResponse response = mockProvider.consultTutor(request);
        
        List<String> taggedHints = new ArrayList<>();
        for (String hint : response.getHints()) {
            taggedHints.add("[OpenAI GPT-4o] " + hint);
        }
        response.setHints(taggedHints);
        response.setTeachingExplanation("*(OpenAI GPT-4o Tutor Sandbox)*\n\n" + response.getTeachingExplanation());
        
        return response;
    }
}
