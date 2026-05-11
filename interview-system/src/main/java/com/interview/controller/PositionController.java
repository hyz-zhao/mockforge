package com.interview.controller;

import com.interview.common.Result;
import com.interview.dto.response.PositionResp;
import com.interview.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/positions")
@RequiredArgsConstructor
public class PositionController {

    private final QuestionService questionService;

    @GetMapping
    public Result<List<PositionResp>> getAllPositions() {
        List<PositionResp> resp = questionService.getAllPositions();
        return Result.ok(resp);
    }
}
