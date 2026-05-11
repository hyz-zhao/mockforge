package com.interview.dto.response;

import lombok.Data;

@Data
public class QuestionResult {

    private Integer order;
    private String questionText;
    private String userAnswer;
    private Double score;
    private String standardAnswer;
    private String feedback;
}
