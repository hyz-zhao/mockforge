package com.interview.controller;

import com.interview.common.Result;
import com.interview.service.SpeechService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/speech")
@RequiredArgsConstructor
public class SpeechController {

    private final SpeechService speechService;

    @PostMapping("/transcribe")
    public Result<String> transcribe(@RequestParam("file") MultipartFile file) {
        String text = speechService.transcribe(file);
        return Result.ok(text);
    }
}
