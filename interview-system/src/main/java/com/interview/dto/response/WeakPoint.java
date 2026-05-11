package com.interview.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class WeakPoint {

    private String dimension;
    private Double score;
    private String analysis;
    private List<String> resources;
}
