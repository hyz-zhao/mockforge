package com.interview.dto.request;

import lombok.Data;

@Data
public class KnowledgeSearchReq {

    private String sourceFile;

    private String category;

    private String difficulty;

    private String keyword;

    private Integer page = 1;

    private Integer pageSize = 20;
}
