package com.interview.controller;

import com.interview.common.Result;
import com.interview.dto.request.StartInterviewReq;
import com.interview.dto.response.*;
import com.interview.service.InterviewService;
import com.interview.utils.UserContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interview")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;

    @PostMapping("/start")
    public Result<StartInterviewResp> startInterview(@Valid @RequestBody StartInterviewReq req) {
        Long userId = UserContext.getUserId();
        StartInterviewResp resp = interviewService.startInterview(userId, req);
        return Result.ok(resp);
    }

    @GetMapping("/{sessionId}/report")
    public Result<InterviewReportResp> getReport(@PathVariable Long sessionId) {
        InterviewReportResp resp = interviewService.getReport(sessionId);
        return Result.ok(resp);
    }

    @GetMapping("/history")
    public Result<List<InterviewHistoryResp>> getHistory() {
        Long userId = UserContext.getUserId();
        List<InterviewHistoryResp> resp = interviewService.getHistory(userId);
        return Result.ok(resp);
    }

    @GetMapping("/progress")
    public Result<ProgressResp> getProgress() {
        Long userId = UserContext.getUserId();
        ProgressResp resp = interviewService.getProgress(userId);
        return Result.ok(resp);
    }
}
