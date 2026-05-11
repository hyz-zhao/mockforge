package com.interview.controller;

import com.interview.common.Result;
import com.interview.dto.request.AiModelReq;
import com.interview.entity.AiModel;
import com.interview.service.AiModelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai-models")
@RequiredArgsConstructor
public class AiModelController {

    private final AiModelService aiModelService;

    @GetMapping
    public Result<List<AiModel>> getAll() {
        return Result.ok(aiModelService.getAllModels());
    }

    @GetMapping("/active")
    public Result<AiModel> getActive() {
        return Result.ok(aiModelService.getActiveModel());
    }

    @GetMapping("/{id}")
    public Result<AiModel> getById(@PathVariable Long id) {
        return Result.ok(aiModelService.getModelById(id));
    }

    @PostMapping
    public Result<AiModel> create(@Valid @RequestBody AiModelReq req) {
        return Result.ok(aiModelService.createModel(req));
    }

    @PutMapping("/{id}")
    public Result<AiModel> update(@PathVariable Long id, @Valid @RequestBody AiModelReq req) {
        return Result.ok(aiModelService.updateModel(id, req));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        aiModelService.deleteModel(id);
        return Result.ok();
    }

    @PostMapping("/{id}/activate")
    public Result<Void> activate(@PathVariable Long id) {
        aiModelService.setActiveModel(id);
        return Result.ok();
    }

    @PostMapping("/test-connection")
    public Result<String> testConnection(@Valid @RequestBody AiModelReq req) {
        String result = aiModelService.testConnection(req);
        if ("success".equals(result)) {
            return Result.ok("连接成功");
        }
        return new Result<>(400, result, null);
    }
}
