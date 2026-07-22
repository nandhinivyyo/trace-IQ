package com.codeinsight.controller;

import com.codeinsight.dto.TutorRequest;
import com.codeinsight.dto.TutorResponse;
import com.codeinsight.service.AiTutorProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tutor")
@CrossOrigin(origins = "*")
public class AiTutorController {

    private final AiTutorProvider mockProvider;
    private final AiTutorProvider openaiProvider;
    private final AiTutorProvider geminiProvider;
    private final AiTutorProvider ollamaProvider;

    @Autowired
    public AiTutorController(
            @Qualifier("mockTutorProvider") AiTutorProvider mockProvider,
            @Qualifier("openaiTutorProvider") AiTutorProvider openaiProvider,
            @Qualifier("geminiTutorProvider") AiTutorProvider geminiProvider,
            @Qualifier("ollamaTutorProvider") AiTutorProvider ollamaProvider) {
        this.mockProvider = mockProvider;
        this.openaiProvider = openaiProvider;
        this.geminiProvider = geminiProvider;
        this.ollamaProvider = ollamaProvider;
    }

    @PostMapping("/consult")
    public ResponseEntity<TutorResponse> consult(@RequestBody TutorRequest request) {
        AiTutorProvider activeProvider = mockProvider;
        
        if (request.getProvider() != null) {
            String providerName = request.getProvider().toUpperCase();
            switch (providerName) {
                case "OPENAI":
                    activeProvider = openaiProvider;
                    break;
                case "GEMINI":
                    activeProvider = geminiProvider;
                    break;
                case "OLLAMA":
                    activeProvider = ollamaProvider;
                    break;
                case "MOCK":
                default:
                    activeProvider = mockProvider;
                    break;
            }
        }
        
        TutorResponse response = activeProvider.consultTutor(request);
        return ResponseEntity.ok(response);
    }
}
