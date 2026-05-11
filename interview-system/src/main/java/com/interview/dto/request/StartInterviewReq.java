package com.interview.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class StartInterviewReq {

    @NotBlank(message = "请选择岗位")
    private String position;

    private Long resumeId;

    private Integer questionCount = 8;

    private String difficulty = "mixed";

    private String sourceType = "database";

    private String knowledgeSource;

    private String interviewMode = "qa";
}
