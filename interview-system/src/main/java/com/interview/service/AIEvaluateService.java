package com.interview.service;

import com.interview.dto.response.InterviewReportResp;

public interface AIEvaluateService {

    String evaluateAnswer(String questionText, String userAnswer,
                          String referenceAnswer, String scoringDimensions);

    InterviewReportResp generateReport(Long sessionId);
}
