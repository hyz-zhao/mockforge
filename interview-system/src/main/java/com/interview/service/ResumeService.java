package com.interview.service;

import com.interview.dto.response.ResumeParseResp;
import com.interview.dto.response.ResumeUploadResp;
import com.interview.entity.Resume;
import org.springframework.web.multipart.MultipartFile;

public interface ResumeService {

    ResumeUploadResp upload(Long userId, MultipartFile file);

    ResumeParseResp parse(Long resumeId);

    Resume getResume(Long resumeId);
}
