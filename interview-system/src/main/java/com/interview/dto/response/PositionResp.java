package com.interview.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class PositionResp {

    private String name;
    private String description;
    private List<String> hotCategories;
    private Integer questionCount;
}
