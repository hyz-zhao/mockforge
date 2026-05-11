package com.interview.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class InterviewHistoryResp {

    private Long sessionId;
    private String position;
    private Double overallScore;
    private String status;
    private LocalDateTime startedAt;
    private Integer completedQuestions;
    private Integer totalQuestions;
}
