package com.interview.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class ProjectExp {

    private String name;
    private String role;
    private String description;
    private List<String> techStack;
}
