package com.codeinsight.service.impl;

import com.codeinsight.dto.TutorRequest;
import com.codeinsight.dto.TutorResponse;
import com.codeinsight.service.AiTutorProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service("geminiTutorProvider")
public class GeminiTutorProvider implements AiTutorProvider {

    private final AiTutorProvider mockProvider;

    @Autowired
    public GeminiTutorProvider(@Qualifier("mockTutorProvider") AiTutorProvider mockProvider) {
        this.mockProvider = mockProvider;
    }

    @Override
public TutorResponse consultTutor(TutorRequest request) {
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
                
                String prompt = "You are an AI programming tutor.\n" +
                        "The student is learning: " + request.getProblemName() + "\n" +
                        "Language: " + request.getLanguage() + "\n" +
                        "Tutor Mode: " + request.getMode() + "\n" +
                        "Active Level: " + request.getActiveLevel() + "\n" +
                        "Code Context:\n" + request.getCode() + "\n" +
                        "Interaction History: " + request.getHistory() + "\n\n" +
                        "Provide a detailed tutoring answer. Return it in JSON format containing two keys: \"teachingExplanation\" (string containing your explanation with markdown formatting) and \"hints\" (an array of 2-3 short, actionable suggestions/hints for the student to try next). Do not prepend codeblock markdown. Return exactly this JSON structure:\n" +
                        "{\n" +
                        "  \"teachingExplanation\": \"...\",\n" +
                        "  \"hints\": [\"...\", \"...\"]\n" +
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
                    TutorResponse tutorResponse = new TutorResponse();
                    tutorResponse.setTeachingExplanation(resultJson.path("teachingExplanation").asText(""));
                    List<String> hintsList = new ArrayList<>();
                    if (resultJson.has("hints") && resultJson.get("hints").isArray()) {
                        for (com.fasterxml.jackson.databind.JsonNode hintNode : resultJson.get("hints")) {
                            hintsList.add(hintNode.asText());
                        }
                    }
                    tutorResponse.setHints(hintsList);
                    return tutorResponse;
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        TutorResponse response = mockProvider.consultTutor(request);
        
        // Add Gemini Pro tags to show provider active status
        List<String> taggedHints = new ArrayList<>();
        for (String hint : response.getHints()) {
            taggedHints.add("[Gemini Pro] " + hint);
        }
        response.setHints(taggedHints);
        response.setTeachingExplanation("*(Gemini Pro Tutor Sandbox)*\n\n" + response.getTeachingExplanation());
        
        return response;
    }
}
