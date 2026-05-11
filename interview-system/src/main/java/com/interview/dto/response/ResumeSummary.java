package com.interview.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class ResumeSummary {

    private String name;
    private String education;
    private List<String> skills;
    private List<ProjectExp> projects;
    private List<String> highlights;
}
