package com.interview.dto.response;

import lombok.Data;

@Data
public class ResumeUploadResp {

    private Long resumeId;
    private String fileName;
    private String status;
}
