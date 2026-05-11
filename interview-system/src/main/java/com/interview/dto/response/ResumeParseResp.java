package com.interview.dto.response;

import lombok.Data;

@Data
public class ResumeParseResp {

    private Long resumeId;
    private String parsedText;
    private ResumeSummary summary;
}
