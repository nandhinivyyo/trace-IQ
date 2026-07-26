package com.codeinsight.controller;

import com.codeinsight.dto.DebugRequest;
import com.codeinsight.dto.DebugResponse;
import com.codeinsight.dto.CompleteProgramRequest;
import com.codeinsight.dto.CompleteProgramResponse;
import com.codeinsight.service.AiDebuggerProvider;
import com.codeinsight.service.AiProgramCompletionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/debugger")
@CrossOrigin(origins = "*")
public class AiDebuggerController {

    private final AiDebuggerProvider mockProvider;
    private final AiDebuggerProvider openaiProvider;
    private final AiDebuggerProvider geminiProvider;
    private final AiDebuggerProvider ollamaProvider;

    private final AiProgramCompletionService mockCompletionService;
    private final AiProgramCompletionService geminiCompletionService;

    @Autowired
    public AiDebuggerController(
            @Qualifier("mockDebuggerProvider") AiDebuggerProvider mockProvider,
            @Qualifier("openaiDebuggerProvider") AiDebuggerProvider openaiProvider,
            @Qualifier("geminiDebuggerProvider") AiDebuggerProvider geminiProvider,
            @Qualifier("ollamaDebuggerProvider") AiDebuggerProvider ollamaProvider,
            @Qualifier("mockProgramCompletionService") AiProgramCompletionService mockCompletionService,
            @Qualifier("geminiProgramCompletionService") AiProgramCompletionService geminiCompletionService) {
        this.mockProvider = mockProvider;
        this.openaiProvider = openaiProvider;
        this.geminiProvider = geminiProvider;
        this.ollamaProvider = ollamaProvider;
        this.mockCompletionService = mockCompletionService;
        this.geminiCompletionService = geminiCompletionService;
    }

    @PostMapping("/diagnose")
    public ResponseEntity<DebugResponse> diagnose(@RequestBody DebugRequest request) {
        AiDebuggerProvider activeProvider = mockProvider;
        
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
        
        DebugResponse response = activeProvider.diagnoseCode(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/complete-program")
    public ResponseEntity<CompleteProgramResponse> completeProgram(@RequestBody CompleteProgramRequest request) {
        AiProgramCompletionService activeService = mockCompletionService;
        
        if (request.getProvider() != null) {
            String providerName = request.getProvider().toUpperCase();
            if (providerName.equals("GEMINI")) {
                activeService = geminiCompletionService;
            }
        } else {
            // Default to Gemini for program completion
            activeService = geminiCompletionService;
        }
        
        CompleteProgramResponse response = activeService.completeProgram(request);
        return ResponseEntity.ok(response);
    }
}
