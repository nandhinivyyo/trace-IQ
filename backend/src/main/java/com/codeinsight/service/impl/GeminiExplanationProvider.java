package com.codeinsight.service.impl;

import com.codeinsight.dto.AiExplanationRequest;
import com.codeinsight.dto.AiExplanationResponse;
import com.codeinsight.service.AiExplanationProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service("geminiExplanationProvider")
public class GeminiExplanationProvider implements AiExplanationProvider {

    private final AiExplanationProvider mockProvider;

    @Autowired
    public GeminiExplanationProvider(@Qualifier("mockExplanationProvider") AiExplanationProvider mockProvider) {
        this.mockProvider = mockProvider;
    }

    @Override
    public AiExplanationResponse explainStep(AiExplanationRequest request) {
        String apiKey = System.getenv("GEMINI_API_KEY");
        if (apiKey == null || apiKey.trim().isEmpty()) {
            apiKey = System.getProperty("GEMINI_API_KEY");
        }
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new RuntimeException("GEMINI_API_KEY is not configured");
        }

        if (apiKey != null && !apiKey.trim().isEmpty()) {
            try {
                java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
                String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;
                
                String prompt = "You are an AI code execution tutor.\n" +
                        "Given this state of code execution:\n" +
                        "Language: " + request.getLanguage() + "\n" +
                        "Full Code:\n" + request.getCode() + "\n" +
                        "Step Number: " + request.getStepNumber() + "\n" +
                        "Line Number: " + request.getCurrentLineNumber() + "\n" +
                        "Executed Line: " + request.getExecutedSourceCode() + "\n" +
                        "Variables: " + request.getVariablesAfter() + "\n" +
                        "Function Stack: " + request.getFunctionStack() + "\n" +
                        "Explain what happens at this execution step in JSON format. Do not prepend any codeblock markdown. Return exactly this JSON structure:\n" +
                        "{\n" +
                        "  \"explanation\": \"simple explanation of what happens on this line\",\n" +
                        "  \"variableChanges\": \"what variables changed and their new values\",\n" +
                        "  \"memoryChanges\": \"how call stack or heap memory was updated\",\n" +
                        "  \"loopExplanation\": \"information about loops active on this line, if any\",\n" +
                        "  \"functionExplanation\": \"details about the current executing function, if any\",\n" +
                        "  \"dsaExplanation\": \"how this step relates to data structures or algorithms\",\n" +
                        "  \"algorithmInsight\": \"insight into the overall algorithm logic\",\n" +
                        "  \"optimizationTip\": \"optional tip to optimize this execution step\"\n" +
                        "}";

                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                String requestBody = "{\"contents\":[{\"parts\":[{\"text\":" + mapper.writeValueAsString(prompt) + "}]}]}";
                
                java.net.http.HttpRequest httpRequest = java.net.http.HttpRequest.newBuilder()
                        .uri(java.net.URI.create(url))
                        .header("Content-Type", "application/json")
                        .POST(java.net.http.HttpRequest.BodyPublishers.ofString(requestBody))
                        .build();
                
                java.net.http.HttpResponse<String> response = client.send(httpRequest, java.net.http.HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() == 200) {
                    com.fasterxml.jackson.databind.JsonNode rootNode = mapper.readTree(response.body());
                    String jsonText = rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText().trim();
                    
                    // strip possible markdown codeblock wrapper
                    if (jsonText.startsWith("```json")) {
                        jsonText = jsonText.substring(7);
                    } else if (jsonText.startsWith("```")) {
                        jsonText = jsonText.substring(3);
                    }
                    if (jsonText.endsWith("```")) {
                        jsonText = jsonText.substring(0, jsonText.length() - 3);
                    }
                    jsonText = jsonText.trim();

                    com.fasterxml.jackson.databind.JsonNode resultJson = mapper.readTree(jsonText);
                    AiExplanationResponse aiResponse = new AiExplanationResponse();
                    aiResponse.setStepNumber(request.getStepNumber());
                    aiResponse.setCurrentLineNumber(request.getCurrentLineNumber());
                    aiResponse.setExplanation(resultJson.path("explanation").asText(""));
                    aiResponse.setVariableChanges(resultJson.path("variableChanges").asText(""));
                    aiResponse.setMemoryChanges(resultJson.path("memoryChanges").asText(""));
                    aiResponse.setLoopExplanation(resultJson.path("loopExplanation").asText(""));
                    aiResponse.setFunctionExplanation(resultJson.path("functionExplanation").asText(""));
                    aiResponse.setDsaExplanation(resultJson.path("dsaExplanation").asText(""));
                    aiResponse.setAlgorithmInsight(resultJson.path("algorithmInsight").asText(""));
                    aiResponse.setOptimizationTip(resultJson.path("optimizationTip").asText(""));
                    return aiResponse;
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        // Falls back to mock provider prepending the LLM provider tag
        AiExplanationResponse response = mockProvider.explainStep(request);
        response.setExplanation("[Gemini Pro 1.5] " + response.getExplanation());
        response.setAlgorithmInsight(response.getAlgorithmInsight() != null ? 
            "[Gemini API Mode] " + response.getAlgorithmInsight() : "[Gemini API Mode] Standby");
        return response;
    }
}
