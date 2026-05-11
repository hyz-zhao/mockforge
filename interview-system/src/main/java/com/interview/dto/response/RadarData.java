package com.interview.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class RadarData {

    private List<String> dimensions;
    private List<Double> scores;
    private List<Double> industryAverage;
}
