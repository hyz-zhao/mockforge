package com.interview.dto.response;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class InterviewReportResp {

    private Long sessionId;
    private String position;
    private LocalDateTime startedAt;
    private Integer totalQuestions;
    private RadarData radarData;
    private Double overallScore;
    private String rank;
    private List<WeakPoint> weakPoints;
    private List<String> strongPoints;
    private String nextStepAdvice;
    private List<QuestionResult> questionResults;
}
