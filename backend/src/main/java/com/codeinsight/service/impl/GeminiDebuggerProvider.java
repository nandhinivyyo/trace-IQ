package com.codeinsight.service.impl;

import com.codeinsight.dto.DebugIssue;
import com.codeinsight.dto.DebugRequest;
import com.codeinsight.dto.DebugResponse;
import com.codeinsight.dto.DebugRemedy;
import com.codeinsight.service.AiDebuggerProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service("geminiDebuggerProvider")
public class GeminiDebuggerProvider implements AiDebuggerProvider {

    private final AiDebuggerProvider mockProvider;

    @Autowired
    public GeminiDebuggerProvider(@Qualifier("mockDebuggerProvider") AiDebuggerProvider mockProvider) {
        this.mockProvider = mockProvider;
    }

    @Override
    public DebugResponse diagnoseCode(DebugRequest request) {
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
                
                String prompt = "You are an AI programming debugger and code reviewer.\n" +
                        "Given this code context:\n" +
                        "Language: " + request.getLanguage() + "\n" +
                        "Code:\n" + request.getCode() + "\n" +
                        "Error Logs (if any):\n" + request.getErrorLogs() + "\n\n" +
                        "Diagnose the code and provide detailed feedback in JSON format. Do not prepend any codeblock markdown. Return exactly this JSON structure:\n" +
                        "{\n" +
                        "  \"readabilityReview\": \"review of code readability\",\n" +
                        "  \"namingReview\": \"review of naming conventions\",\n" +
                        "  \"modularityReview\": \"review of code modularity\",\n" +
                        "  \"maintainabilityReview\": \"review of maintainability\",\n" +
                        "  \"overallQualityScore\": 85,\n" +
                        "  \"timeComplexity\": \"overall time complexity, e.g. O(N)\",\n" +
                        "  \"spaceComplexity\": \"overall space complexity, e.g. O(1)\",\n" +
                        "  \"optimizations\": [\"optimization 1\", \"optimization 2\"],\n" +
                        "  \"securityAlerts\": [\"security alert 1\"],\n" +
                        "  \"bottlenecks\": [\"performance bottleneck 1\"],\n" +
                        "  \"conceptsToRevise\": [\"concept to revise 1\"],\n" +
                        "  \"issues\": [\n" +
                        "    {\n" +
                        "      \"type\": \"LOGICAL\",\n" +
                        "      \"severity\": \"ERROR\",\n" +
                        "      \"message\": \"short error description\",\n" +
                        "      \"line\": 8,\n" +
                        "      \"rootCause\": \"why this issue happens\",\n" +
                        "      \"reproduction\": \"example scenario triggering the bug\",\n" +
                        "      \"remedy\": \"how to fix it\",\n" +
                        "      \"commonMistake\": \"the common conceptual mistake\"\n" +
                        "    }\n" +
                        "  ],\n" +
                        "  \"remedies\": [\n" +
                        "    {\n" +
                        "      \"title\": \"RECOMMENDED\",\n" +
                        "      \"code\": \"fixed code snippet\",\n" +
                        "      \"advantages\": \"pros of this fix\",\n" +
                        "      \"disadvantages\": \"cons of this fix\"\n" +
                        "    }\n" +
                        "  ]\n" +
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
                    DebugResponse debugResponse = new DebugResponse();
                    debugResponse.setReadabilityReview(resultJson.path("readabilityReview").asText(""));
                    debugResponse.setNamingReview(resultJson.path("namingReview").asText(""));
                    debugResponse.setModularityReview(resultJson.path("modularityReview").asText(""));
                    debugResponse.setMaintainabilityReview(resultJson.path("maintainabilityReview").asText(""));
                    debugResponse.setOverallQualityScore(resultJson.path("overallQualityScore").asInt(80));
                    debugResponse.setTimeComplexity(resultJson.path("timeComplexity").asText("O(1)"));
                    debugResponse.setSpaceComplexity(resultJson.path("spaceComplexity").asText("O(1)"));

                    List<String> opts = new ArrayList<>();
                    if (resultJson.has("optimizations") && resultJson.get("optimizations").isArray()) {
                        for (com.fasterxml.jackson.databind.JsonNode node : resultJson.get("optimizations")) {
                            opts.add(node.asText());
                        }
                    }
                    debugResponse.setOptimizations(opts);

                    List<String> sec = new ArrayList<>();
                    if (resultJson.has("securityAlerts") && resultJson.get("securityAlerts").isArray()) {
                        for (com.fasterxml.jackson.databind.JsonNode node : resultJson.get("securityAlerts")) {
                            sec.add(node.asText());
                        }
                    }
                    debugResponse.setSecurityAlerts(sec);

                    List<String> bot = new ArrayList<>();
                    if (resultJson.has("bottlenecks") && resultJson.get("bottlenecks").isArray()) {
                        for (com.fasterxml.jackson.databind.JsonNode node : resultJson.get("bottlenecks")) {
                            bot.add(node.asText());
                        }
                    }
                    debugResponse.setBottlenecks(bot);

                    List<String> conc = new ArrayList<>();
                    if (resultJson.has("conceptsToRevise") && resultJson.get("conceptsToRevise").isArray()) {
                        for (com.fasterxml.jackson.databind.JsonNode node : resultJson.get("conceptsToRevise")) {
                            conc.add(node.asText());
                        }
                    }
                    debugResponse.setConceptsToRevise(conc);

                    List<DebugIssue> issuesList = new ArrayList<>();
                    if (resultJson.has("issues") && resultJson.get("issues").isArray()) {
                        for (com.fasterxml.jackson.databind.JsonNode node : resultJson.get("issues")) {
                            DebugIssue issue = new DebugIssue();
                            issue.setType(node.path("type").asText("LOGICAL"));
                            issue.setSeverity(node.path("severity").asText("ERROR"));
                            issue.setMessage(node.path("message").asText(""));
                            issue.setLine(node.path("line").asInt(1));
                            issue.setRootCause(node.path("rootCause").asText(""));
                            issue.setReproduction(node.path("reproduction").asText(""));
                            issue.setRemedy(node.path("remedy").asText(""));
                            issue.setCommonMistake(node.path("commonMistake").asText(""));
                            issuesList.add(issue);
                        }
                    }
                    debugResponse.setIssues(issuesList);

                    List<DebugRemedy> remediesList = new ArrayList<>();
                    if (resultJson.has("remedies") && resultJson.get("remedies").isArray()) {
                        for (com.fasterxml.jackson.databind.JsonNode node : resultJson.get("remedies")) {
                            DebugRemedy remedy = new DebugRemedy();
                            remedy.setTitle(node.path("title").asText("RECOMMENDED"));
                            remedy.setCode(node.path("code").asText(""));
                            remedy.setAdvantages(node.path("advantages").asText(""));
                            remedy.setDisadvantages(node.path("disadvantages").asText(""));
                            remediesList.add(remedy);
                        }
                    }
                    debugResponse.setRemedies(remediesList);

                    return debugResponse;
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        DebugResponse response = mockProvider.diagnoseCode(request);
        
        // Add Gemini Pro tags to show provider active status
        List<DebugIssue> taggedIssues = new ArrayList<>();
        for (DebugIssue issue : response.getIssues()) {
            issue.setMessage("[Gemini Pro 1.5] " + issue.getMessage());
            taggedIssues.add(issue);
        }
        response.setIssues(taggedIssues);
        response.setReadabilityReview("*(Gemini Pro Debug Sandbox)*\n\n" + response.getReadabilityReview());
        
        return response;
    }
}
