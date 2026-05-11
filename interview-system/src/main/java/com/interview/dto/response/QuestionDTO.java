package com.interview.dto.response;

import lombok.Data;

@Data
public class QuestionDTO {

    private Long id;
    private Integer order;
    private String type;
    private String category;
    private String difficulty;
    private String questionText;
}
