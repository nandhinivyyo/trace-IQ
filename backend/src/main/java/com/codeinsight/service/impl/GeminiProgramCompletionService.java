package com.codeinsight.service.impl;

import com.codeinsight.dto.CompleteProgramRequest;
import com.codeinsight.dto.CompleteProgramResponse;
import com.codeinsight.service.AiProgramCompletionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service("geminiProgramCompletionService")
public class GeminiProgramCompletionService implements AiProgramCompletionService {

    private final AiProgramCompletionService mockService;

    @Autowired
    public GeminiProgramCompletionService(@Qualifier("mockProgramCompletionService") AiProgramCompletionService mockService) {
        this.mockService = mockService;
    }

    @Override
    public CompleteProgramResponse completeProgram(CompleteProgramRequest request) {
        String apiKey = System.getenv("GEMINI_API_KEY");
        if (apiKey == null || apiKey.trim().isEmpty()) {
            apiKey = System.getProperty("GEMINI_API_KEY");
        }
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new RuntimeException("GEMINI_API_KEY is not configured");
        }

        // Auto-detect check to avoid calling Gemini when the code is already a complete program
        String code = request.getCode() != null ? request.getCode() : "";
        String language = request.getLanguage() != null ? request.getLanguage() : "python";
        
        // If the request says isFunction = false, or we auto-detect it is already complete, return immediately
        Boolean isFunc = request.getIsFunction();
        if ((isFunc != null && !isFunc) || (isFunc == null && MockProgramCompletionService.isCompleteProgram(code, language))) {
            return new CompleteProgramResponse(code, false);
        }

        if (apiKey != null && !apiKey.trim().isEmpty()) {
            try {
                HttpClient client = HttpClient.newHttpClient();
                String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;

                String systemPrompt = "You are an expert programming assistant specializing in Data Structures and Algorithms.\n\n" +
                        "Your task is to convert standalone functions into complete executable programs without changing the user's algorithm.\n\n" +
                        "Rules:\n" +
                        "1. NEVER modify the algorithm.\n" +
                        "2. Preserve all variable names.\n" +
                        "3. Preserve all loops and conditions.\n" +
                        "4. Generate only the missing parts.\n" +
                        "5. Detect the programming language automatically.\n" +
                        "6. Add all required imports.\n" +
                        "7. Generate a proper main function.\n" +
                        "8. Read sample input using standard input.\n" +
                        "9. Call the user's function correctly.\n" +
                        "10. Print the output.\n" +
                        "11. Return only executable code.\n" +
                        "12. Do not include explanations.\n" +
                        "13. Do not optimize or rewrite the logic.\n" +
                        "14. If the code is already a complete executable program, return it unchanged.\n" +
                        "15. Ensure the generated code compiles successfully.";

                String userPrompt = "Determine whether the following code is only a function or already a complete executable program.\n\n" +
                        "If it is already complete, return it exactly as provided.\n\n" +
                        "If it is only a function:\n" +
                        "1. Detect the language.\n" +
                        "2. Add necessary imports.\n" +
                        "3. Create the appropriate class if required.\n" +
                        "4. Generate a main() method.\n" +
                        "5. Read suitable input from the console.\n" +
                        "6. Call the user's function.\n" +
                        "7. Print the output.\n" +
                        "8. Keep the original function completely unchanged.\n" +
                        "9. Return only the final executable program.\n\n" +
                        "User Code:\n" + code;

                String fullPrompt = systemPrompt + "\n\n" + userPrompt;

                ObjectMapper mapper = new ObjectMapper();
                String requestBody = "{\"contents\":[{\"parts\":[{\"text\":" + mapper.writeValueAsString(fullPrompt) + "}]}]}";

                HttpRequest httpRequest = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                        .build();

                HttpResponse<String> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() == 200) {
                    JsonNode rootNode = mapper.readTree(response.body());
                    String responseText = rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText().trim();

                    // Strip possible markdown code block wrapper
                    if (responseText.startsWith("```")) {
                        int firstNewLine = responseText.indexOf('\n');
                        if (firstNewLine != -1) {
                            responseText = responseText.substring(firstNewLine + 1);
                        } else {
                            responseText = responseText.substring(3);
                        }
                    }
                    if (responseText.endsWith("```")) {
                        responseText = responseText.substring(0, responseText.length() - 3);
                    }
                    responseText = responseText.trim();

                    return new CompleteProgramResponse(responseText, true);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        // Fall back to Mock completion if API call is not configured or failed
        return mockService.completeProgram(request);
    }
}
