package com.interview.service;

import org.springframework.web.multipart.MultipartFile;

public interface SpeechService {

    String transcribe(MultipartFile audioFile);
}
