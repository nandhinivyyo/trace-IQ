package com.codeinsight.dto;

import java.util.List;

public class TutorResponse {
    private List<String> hints;
    private List<String> socraticQuestions;
    private String teachingExplanation;
    private List<String> patterns;
    private List<String> dataStructures;
    private List<String> algorithms;
    private String attemptAnalysis;
    private List<String> roadmap;
    private List<String> relatedProblems;
    private String feedbackSummary;

    public TutorResponse() {}

    public TutorResponse(List<String> hints, List<String> socraticQuestions, String teachingExplanation,
                         List<String> patterns, List<String> dataStructures, List<String> algorithms,
                         String attemptAnalysis, List<String> roadmap, List<String> relatedProblems,
                         String feedbackSummary) {
        this.hints = hints;
        this.socraticQuestions = socraticQuestions;
        this.teachingExplanation = teachingExplanation;
        this.patterns = patterns;
        this.dataStructures = dataStructures;
        this.algorithms = algorithms;
        this.attemptAnalysis = attemptAnalysis;
        this.roadmap = roadmap;
        this.relatedProblems = relatedProblems;
        this.feedbackSummary = feedbackSummary;
    }

    // Getters and Setters
    public List<String> getHints() { return hints; }
    public void setHints(List<String> hints) { this.hints = hints; }

    public List<String> getSocraticQuestions() { return socraticQuestions; }
    public void setSocraticQuestions(List<String> socraticQuestions) { this.socraticQuestions = socraticQuestions; }

    public String getTeachingExplanation() { return teachingExplanation; }
    public void setTeachingExplanation(String teachingExplanation) { this.teachingExplanation = teachingExplanation; }

    public List<String> getPatterns() { return patterns; }
    public void setPatterns(List<String> patterns) { this.patterns = patterns; }

    public List<String> getDataStructures() { return dataStructures; }
    public void setDataStructures(List<String> dataStructures) { this.dataStructures = dataStructures; }

    public List<String> getAlgorithms() { return algorithms; }
    public void setAlgorithms(List<String> algorithms) { this.algorithms = algorithms; }

    public String getAttemptAnalysis() { return attemptAnalysis; }
    public void setAttemptAnalysis(String attemptAnalysis) { this.attemptAnalysis = attemptAnalysis; }

    public List<String> getRoadmap() { return roadmap; }
    public void setRoadmap(List<String> roadmap) { this.roadmap = roadmap; }

    public List<String> getRelatedProblems() { return relatedProblems; }
    public void setRelatedProblems(List<String> relatedProblems) { this.relatedProblems = relatedProblems; }

    public String getFeedbackSummary() { return feedbackSummary; }
    public void setFeedbackSummary(String feedbackSummary) { this.feedbackSummary = feedbackSummary; }
}
