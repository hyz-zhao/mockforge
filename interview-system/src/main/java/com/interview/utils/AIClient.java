package com.interview.utils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.entity.AiModel;
import com.interview.repository.AiModelMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class AIClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final AiModelMapper aiModelMapper;

    public AIClient(ObjectMapper objectMapper, AiModelMapper aiModelMapper) {
        this.restTemplate = new RestTemplate();
        this.objectMapper = objectMapper;
        this.aiModelMapper = aiModelMapper;
    }

    public String chat(String userMessage) {
        AiModel model = aiModelMapper.selectActiveModel();
        if (model == null) {
            log.error("没有启用的AI模型");
            return "{\"overallScore\":50,\"feedback\":\"AI服务未配置\"}";
        }
        return doChat(model, userMessage);
    }

    public String chat(String systemMessage, String userMessage) {
        AiModel model = aiModelMapper.selectActiveModel();
        if (model == null) {
            log.error("没有启用的AI模型");
            return "{\"overallScore\":50,\"feedback\":\"AI服务未配置\"}";
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(model.getApiKey());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model.getModelId());
        body.put("temperature", model.getTemperature());
        body.put("max_tokens", model.getMaxTokens());
        body.put("messages", List.of(
                Map.of("role", "system", "content", systemMessage),
                Map.of("role", "user", "content", userMessage)
        ));

        String normalizedUrl = normalizeBaseUrl(model.getBaseUrl());

        try {
            String jsonBody = objectMapper.writeValueAsString(body);
            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    normalizedUrl + "/v1/chat/completions",
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode choices = root.get("choices");
                if (choices != null && choices.size() > 0) {
                    JsonNode message = choices.get(0).get("message");
                    if (message != null && message.has("content")) {
                        return message.get("content").asText();
                    }
                }
            }

            log.error("AI API返回异常 [{}]: {}", model.getName(), response.getBody());
            return "{\"overallScore\":50,\"feedback\":\"AI评分服务暂时不可用\"}";
        } catch (Exception e) {
            log.error("AI API调用失败 [{}]", model.getName(), e);
            return "{\"overallScore\":50,\"feedback\":\"AI评分服务暂时不可用\"}";
        }
    }

    private String doChat(AiModel model, String userMessage) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(model.getApiKey());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model.getModelId());
        body.put("temperature", model.getTemperature());
        body.put("max_tokens", model.getMaxTokens());
        body.put("messages", List.of(
                Map.of("role", "user", "content", userMessage)
        ));

        String normalizedUrl = normalizeBaseUrl(model.getBaseUrl());

        try {
            String jsonBody = objectMapper.writeValueAsString(body);
            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    normalizedUrl + "/v1/chat/completions",
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode choices = root.get("choices");
                if (choices != null && choices.size() > 0) {
                    JsonNode message = choices.get(0).get("message");
                    if (message != null && message.has("content")) {
                        return message.get("content").asText();
                    }
                }
            }

            log.error("AI API返回异常 [{}]: {}", model.getName(), response.getBody());
            return "{\"overallScore\":50,\"feedback\":\"AI评分服务暂时不可用\"}";
        } catch (Exception e) {
            log.error("AI API调用失败 [{}]", model.getName(), e);
            return "{\"overallScore\":50,\"feedback\":\"AI评分服务暂时不可用\"}";
        }
    }

    private String normalizeBaseUrl(String baseUrl) {
        String url = baseUrl.trim();
        if (url.endsWith("/v1")) {
            url = url.substring(0, url.length() - 3);
        }
        if (url.endsWith("/")) {
            url = url.substring(0, url.length() - 1);
        }
        return url;
    }

    public String testConnection(String name, String modelId, String apiKey, String baseUrl) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", modelId);
        body.put("temperature", 0.7);
        body.put("max_tokens", 10);
        body.put("messages", List.of(
                Map.of("role", "user", "content", "Hi")
        ));

        String normalizedUrl = normalizeBaseUrl(baseUrl);

        try {
            String jsonBody = objectMapper.writeValueAsString(body);
            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    normalizedUrl + "/v1/chat/completions",
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode error = root.get("error");
                if (error != null) {
                    String errMsg = error.has("message") ? error.get("message").asText() : "未知错误";
                    return "连接失败: " + errMsg;
                }
                JsonNode choices = root.get("choices");
                if (choices != null && choices.size() > 0) {
                    return "success";
                }
                return "连接失败: 响应格式异常";
            }

            return "连接失败: HTTP " + response.getStatusCodeValue();
        } catch (Exception e) {
            String msg = e.getMessage();
            if (msg != null && msg.contains("Connection refused")) {
                return "连接失败: 无法连接到服务器，请检查 baseUrl 是否正确";
            }
            if (msg != null && msg.contains("timeout")) {
                return "连接失败: 请求超时，请检查网络";
            }
            return "连接失败: " + (msg != null ? msg : "未知错误");
        }
    }
}
