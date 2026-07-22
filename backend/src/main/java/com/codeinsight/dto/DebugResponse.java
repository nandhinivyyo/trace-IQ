package com.codeinsight.dto;

import java.util.List;

public class DebugResponse {
    private List<DebugIssue> issues;
    private List<DebugRemedy> remedies;
    
    // Code Review scores
    private int overallQualityScore;
    private String readabilityReview;
    private String namingReview;
    private String modularityReview;
    private String maintainabilityReview;
    
    // Performance and Complexity details
    private List<String> optimizations;
    private List<String> securityAlerts;
    private String timeComplexity;
    private String spaceComplexity;
    private List<String> bottlenecks;
    
    // Learning insights
    private List<String> conceptsToRevise;

    public DebugResponse() {}

    public DebugResponse(List<DebugIssue> issues, List<DebugRemedy> remedies, int overallQualityScore,
                         String readabilityReview, String namingReview, String modularityReview,
                         String maintainabilityReview, List<String> optimizations, List<String> securityAlerts,
                         String timeComplexity, String spaceComplexity, List<String> bottlenecks,
                         List<String> conceptsToRevise) {
        this.issues = issues;
        this.remedies = remedies;
        this.overallQualityScore = overallQualityScore;
        this.readabilityReview = readabilityReview;
        this.namingReview = namingReview;
        this.modularityReview = modularityReview;
        this.maintainabilityReview = maintainabilityReview;
        this.optimizations = optimizations;
        this.securityAlerts = securityAlerts;
        this.timeComplexity = timeComplexity;
        this.spaceComplexity = spaceComplexity;
        this.bottlenecks = bottlenecks;
        this.conceptsToRevise = conceptsToRevise;
    }

    // Getters and Setters
    public List<DebugIssue> getIssues() { return issues; }
    public void setIssues(List<DebugIssue> issues) { this.issues = issues; }

    public List<DebugRemedy> getRemedies() { return remedies; }
    public void setRemedies(List<DebugRemedy> remedies) { this.remedies = remedies; }

    public int getOverallQualityScore() { return overallQualityScore; }
    public void setOverallQualityScore(int overallQualityScore) { this.overallQualityScore = overallQualityScore; }

    public String getReadabilityReview() { return readabilityReview; }
    public void setReadabilityReview(String readabilityReview) { this.readabilityReview = readabilityReview; }

    public String getNamingReview() { return namingReview; }
    public void setNamingReview(String namingReview) { this.namingReview = namingReview; }

    public String getModularityReview() { return modularityReview; }
    public void setModularityReview(String modularityReview) { this.modularityReview = modularityReview; }

    public String getMaintainabilityReview() { return maintainabilityReview; }
    public void setMaintainabilityReview(String maintainabilityReview) { this.maintainabilityReview = maintainabilityReview; }

    public List<String> getOptimizations() { return optimizations; }
    public void setOptimizations(List<String> optimizations) { this.optimizations = optimizations; }

    public List<String> getSecurityAlerts() { return securityAlerts; }
    public void setSecurityAlerts(List<String> securityAlerts) { this.securityAlerts = securityAlerts; }

    public String getTimeComplexity() { return timeComplexity; }
    public void setTimeComplexity(String timeComplexity) { this.timeComplexity = timeComplexity; }

    public String getSpaceComplexity() { return spaceComplexity; }
    public void setSpaceComplexity(String spaceComplexity) { this.spaceComplexity = spaceComplexity; }

    public List<String> getBottlenecks() { return bottlenecks; }
    public void setBottlenecks(List<String> bottlenecks) { this.bottlenecks = bottlenecks; }

    public List<String> getConceptsToRevise() { return conceptsToRevise; }
    public void setConceptsToRevise(List<String> conceptsToRevise) { this.conceptsToRevise = conceptsToRevise; }
}
