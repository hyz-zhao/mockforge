package com.interview.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class ProgressResp {

    private List<String> dates;
    private List<Double> technicalScores;
    private List<Double> logicScores;
    private List<Double> expressionScores;
    private List<Double> overallScores;

    private ProgressDetail byDate;

    @Data
    public static class ProgressDetail {
        private List<String> dates;
        private List<Double> technicalScores;
        private List<Double> logicScores;
        private List<Double> expressionScores;
        private List<Double> overallScores;
    }
}
