package com.interview.service.impl;

import com.interview.common.BusinessException;
import com.interview.service.SpeechService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class SpeechServiceImpl implements SpeechService {

    @Value("${deepseek.api-key}")
    private String apiKey;

    @Value("${deepseek.base-url}")
    private String baseUrl;

    private static final List<String> ALLOWED_TYPES = List.of(
            "audio/wav", "audio/mpeg", "audio/mp3", "audio/webm", "audio/ogg", "audio/flac"
    );

    private String normalizeBaseUrl(String url) {
        String normalized = url.trim();
        if (normalized.endsWith("/v1")) {
            normalized = normalized.substring(0, normalized.length() - 3);
        }
        if (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    @Override
    @SuppressWarnings("unchecked")
    public String transcribe(MultipartFile audioFile) {
        if (audioFile.isEmpty()) {
            throw new BusinessException("音频文件不能为空");
        }

        String contentType = audioFile.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new BusinessException("仅支持 WAV、MP3、WebM、OGG、FLAC 格式");
        }

        try {
            RestTemplate restTemplate = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.setBearerAuth(apiKey);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new org.springframework.core.io.ByteArrayResource(audioFile.getBytes()) {
                @Override
                public String getFilename() {
                    return audioFile.getOriginalFilename();
                }
            });
            body.add("model", "whisper-1");
            body.add("language", "zh");

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            String url = normalizeBaseUrl(baseUrl) + "/v1/audio/transcriptions";
            log.info("语音识别请求URL: {}", url);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, requestEntity, Map.class);

            if (response.getBody() != null && response.getBody().containsKey("text")) {
                return (String) response.getBody().get("text");
            }

            throw new BusinessException("语音识别失败，请重试");
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("语音转文字失败", e);
            throw new BusinessException("语音识别服务异常：" + e.getMessage());
        }
    }
}
