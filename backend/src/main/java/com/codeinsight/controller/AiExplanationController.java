package com.codeinsight.controller;

import com.codeinsight.dto.AiExplanationRequest;
import com.codeinsight.dto.AiExplanationResponse;
import com.codeinsight.service.AiExplanationProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AiExplanationController {

    private final AiExplanationProvider mockProvider;
    private final AiExplanationProvider openaiProvider;
    private final AiExplanationProvider geminiProvider;
    private final AiExplanationProvider ollamaProvider;

    @Autowired
    public AiExplanationController(
            @Qualifier("mockExplanationProvider") AiExplanationProvider mockProvider,
            @Qualifier("openaiExplanationProvider") AiExplanationProvider openaiProvider,
            @Qualifier("geminiExplanationProvider") AiExplanationProvider geminiProvider,
            @Qualifier("ollamaExplanationProvider") AiExplanationProvider ollamaProvider) {
        this.mockProvider = mockProvider;
        this.openaiProvider = openaiProvider;
        this.geminiProvider = geminiProvider;
        this.ollamaProvider = ollamaProvider;
    }

    @PostMapping("/explain")
    public ResponseEntity<AiExplanationResponse> explain(@RequestBody AiExplanationRequest request) {
        AiExplanationProvider activeProvider = mockProvider;
        
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
        
        AiExplanationResponse response = activeProvider.explainStep(request);
        return ResponseEntity.ok(response);
    }
}
