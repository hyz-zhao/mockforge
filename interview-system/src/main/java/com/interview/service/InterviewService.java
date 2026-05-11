package com.interview.service;

import com.interview.dto.request.StartInterviewReq;
import com.interview.dto.response.*;

import java.util.List;

public interface InterviewService {

    StartInterviewResp startInterview(Long userId, StartInterviewReq req);

    void completeSession(Long sessionId);

    InterviewReportResp getReport(Long sessionId);

    List<InterviewHistoryResp> getHistory(Long userId);

    ProgressResp getProgress(Long userId);
}
