package com.interview.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class StartInterviewResp {

    private Long sessionId;
    private String position;
    private String interviewMode;
    private Integer totalQuestions;
    private List<QuestionDTO> questions;
}
