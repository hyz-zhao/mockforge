package com.interview.controller;

import com.interview.common.Result;
import com.interview.dto.response.ResumeParseResp;
import com.interview.dto.response.ResumeUploadResp;
import com.interview.service.ResumeService;
import com.interview.utils.UserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/resume")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    @PostMapping("/upload")
    public Result<ResumeUploadResp> upload(@RequestParam("file") MultipartFile file) {
        Long userId = UserContext.getUserId();
        ResumeUploadResp resp = resumeService.upload(userId, file);
        return Result.ok(resp);
    }

    @PostMapping("/{resumeId}/parse")
    public Result<ResumeParseResp> parse(@PathVariable Long resumeId) {
        ResumeParseResp resp = resumeService.parse(resumeId);
        return Result.ok(resp);
    }
}
