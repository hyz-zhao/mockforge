package com.interview.controller;

import com.interview.common.Result;
import com.interview.entity.KnowledgeFile;
import com.interview.entity.KnowledgeItem;
import com.interview.service.KnowledgeService;
import com.interview.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/knowledge")
@RequiredArgsConstructor
public class KnowledgeController {

    private final KnowledgeService knowledgeService;
    private final QuestionService questionService;

    @PostMapping("/upload")
    public Result<Integer> upload(@RequestParam("file") MultipartFile file) {
        int count = knowledgeService.uploadAndParse(file);
        return Result.ok(count);
    }

    @GetMapping("/files")
    public Result<List<KnowledgeFile>> getAllFiles() {
        return Result.ok(knowledgeService.getAllFiles());
    }

    @GetMapping("/items")
    public Result<List<KnowledgeItem>> getItems(
            @RequestParam(required = false) String sourceFile,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String difficulty) {
        if (sourceFile != null) {
            return Result.ok(knowledgeService.getItemsBySource(sourceFile));
        }
        if (category != null) {
            return Result.ok(knowledgeService.getItemsByCategory(category));
        }
        if (difficulty != null) {
            return Result.ok(knowledgeService.getItemsByDifficulty(difficulty));
        }
        return Result.ok(List.of());
    }

    @GetMapping("/sources")
    public Result<List<String>> getSourceFiles() {
        return Result.ok(knowledgeService.getSourceFiles());
    }

    @GetMapping("/content/{fileName}")
    public Result<String> getFileContent(@PathVariable String fileName) {
        return Result.ok(knowledgeService.getFileContent(fileName));
    }

    @PostMapping("/check-relevance")
    public Result<Boolean> checkRelevance(
            @RequestParam String fileName,
            @RequestParam String position) {
        boolean relevant = questionService.isKnowledgeFileRelevant(fileName, position);
        return Result.ok(relevant);
    }

    @PostMapping("/check-position-name")
    public Result<Boolean> checkPositionName(@RequestParam String positionName) {
        boolean valid = questionService.isValidPositionName(positionName);
        return Result.ok(valid);
    }

    @DeleteMapping("/file/{fileName}")
    public Result<Void> deleteFile(@PathVariable String fileName) {
        knowledgeService.deleteFile(fileName);
        return Result.ok();
    }

    @DeleteMapping("/item/{id}")
    public Result<Void> deleteItem(@PathVariable Long id) {
        knowledgeService.deleteItem(id);
        return Result.ok();
    }
}
