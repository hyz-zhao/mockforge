package com.interview.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.dto.response.QuestionDTO;
import com.interview.entity.InterviewRecord;
import com.interview.entity.InterviewSession;
import com.interview.entity.Question;
import com.interview.repository.InterviewRecordMapper;
import com.interview.repository.InterviewSessionMapper;
import com.interview.repository.QuestionMapper;
import com.interview.service.AIEvaluateService;
import com.interview.service.InterviewService;
import com.interview.service.QuestionService;
import com.interview.utils.AIClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class InterviewWebSocketHandler extends TextWebSocketHandler {

    private final InterviewSessionMapper sessionMapper;
    private final InterviewRecordMapper recordMapper;
    private final QuestionMapper questionMapper;
    private final InterviewService interviewService;
    private final QuestionService questionService;
    private final AIEvaluateService aiEvaluateService;
    private final AIClient aiClient;
    private final ObjectMapper objectMapper;

    private static final Map<Long, WebSocketSession> SESSION_MAP = new ConcurrentHashMap<>();
    private static final Map<Long, Long> SESSION_ID_MAP = new ConcurrentHashMap<>();

    public InterviewWebSocketHandler(InterviewSessionMapper sessionMapper,
                                     InterviewRecordMapper recordMapper,
                                     QuestionMapper questionMapper,
                                     InterviewService interviewService,
                                     QuestionService questionService,
                                     AIEvaluateService aiEvaluateService,
                                     AIClient aiClient,
                                     ObjectMapper objectMapper) {
        this.sessionMapper = sessionMapper;
        this.recordMapper = recordMapper;
        this.questionMapper = questionMapper;
        this.interviewService = interviewService;
        this.questionService = questionService;
        this.aiEvaluateService = aiEvaluateService;
        this.aiClient = aiClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Long userId = (Long) session.getAttributes().get("userId");
        if (userId == null) {
            session.close(CloseStatus.NOT_ACCEPTABLE);
            return;
        }

        SESSION_MAP.put(userId, session);

        String uri = session.getUri() != null ? session.getUri().toString() : "";
        Long sessionId = extractSessionId(uri);
        SESSION_ID_MAP.put(userId, sessionId);

        if (sessionId != null) {
            InterviewSession interviewSession = sessionMapper.selectById(sessionId);
            if (interviewSession != null && interviewSession.getUserId().equals(userId)
                    && "ongoing".equals(interviewSession.getStatus())) {
                pushFirstQuestion(session, interviewSession);
            } else {
                sendMessage(session, buildErrorJson("面试会话无效"));
                session.close(CloseStatus.POLICY_VIOLATION);
            }
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        Long userId = (Long) session.getAttributes().get("userId");
        if (userId == null) return;

        JsonNode node = objectMapper.readTree(message.getPayload());
        String type = node.has("type") ? node.get("type").asText() : "";

        switch (type) {
            case "answer" -> handleAnswer(session, userId, node);
            case "end_interview" -> handleEndInterview(session, userId);
            case "next_question" -> log.debug("用户切换下一题: userId={}", userId);
            case "heartbeat" -> sendMessage(session, "{\"type\":\"heartbeat\"}");
            default -> log.warn("未知消息类型: {}", type);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Long userId = (Long) session.getAttributes().get("userId");
        if (userId != null) {
            SESSION_MAP.remove(userId);
            SESSION_ID_MAP.remove(userId);
            log.info("WebSocket连接关闭：userId={}, status={}", userId, status);
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.error("WebSocket传输错误", exception);
        Long userId = (Long) session.getAttributes().get("userId");
        if (userId != null) {
            SESSION_MAP.remove(userId);
            SESSION_ID_MAP.remove(userId);
        }
    }

    private void handleAnswer(WebSocketSession session, Long userId, JsonNode node) throws Exception {
        Long sessionId = SESSION_ID_MAP.get(userId);
        if (sessionId == null) {
            sendMessage(session, buildErrorJson("会话不存在"));
            return;
        }

        InterviewSession interviewSession = sessionMapper.selectById(sessionId);
        if (interviewSession == null || !"ongoing".equals(interviewSession.getStatus())) {
            sendMessage(session, buildErrorJson("面试已结束"));
            return;
        }

        long questionId = node.has("questionId") ? node.get("questionId").asLong() : 0;
        String content = node.has("content") ? node.get("content").asText() : "";
        String inputType = node.has("inputType") ? node.get("inputType").asText() : "text";
        int questionOrder = node.has("questionOrder") ? node.get("questionOrder").asInt() : 0;

        Question question = questionMapper.selectById(questionId);
        String questionText = question != null ? question.getQuestionText() : "";
        String referenceAnswer = question != null ? question.getReferenceAnswer() : "";
        String scoringDimensions = question != null ? question.getScoringDimensions() : "[]";

        InterviewRecord record = new InterviewRecord();
        record.setSessionId(sessionId);
        record.setQuestionId(questionId);
        record.setQuestionOrder(questionOrder);
        record.setQuestionText(questionText);
        record.setUserAnswer(content);
        record.setInputType(inputType);
        record.setAnsweredAt(LocalDateTime.now());
        record.setDeleted(0);

        recordMapper.insert(record);
        Long recordId = record.getId();

        sendMessage(session, buildEvaluatingJson(questionOrder));

        aiEvaluateService.evaluateAnswerAsync(recordId, questionText, content, referenceAnswer, scoringDimensions);

        int completed = interviewSession.getCompletedQuestions() + 1;
        interviewSession.setCompletedQuestions(completed);
        sessionMapper.updateById(interviewSession);

        if (completed >= interviewSession.getTotalQuestions()) {
            sendMessage(session, buildInterviewEndJson(sessionId));
            interviewService.completeSession(sessionId);
        }
    }

    private void handleEndInterview(WebSocketSession session, Long userId) throws Exception {
        Long sessionId = SESSION_ID_MAP.get(userId);
        if (sessionId != null) {
            InterviewSession s = sessionMapper.selectById(sessionId);
            if (s != null && "ongoing".equals(s.getStatus())) {
                interviewService.completeSession(sessionId);
            }
            sendMessage(session, buildInterviewEndJson(sessionId));
        }
        session.close(CloseStatus.NORMAL);
    }

    private void pushFirstQuestion(WebSocketSession session, InterviewSession interviewSession) {
        try {
            List<QuestionDTO> questions = questionService.getQuestionsForInterview(
                    interviewSession.getPosition(),
                    interviewSession.getTotalQuestions(),
                    "mixed");

            if (!questions.isEmpty()) {
                QuestionDTO first = questions.get(0);
                first.setOrder(1);
                sendMessage(session, buildQuestionJson(first, interviewSession.getTotalQuestions()));
            }
        } catch (Exception e) {
            log.error("推送第一题失败", e);
            sendMessage(session, buildErrorJson("题目加载失败"));
        }
    }

    private void pushNextQuestion(WebSocketSession session, InterviewSession interviewSession, int currentOrder) {
        try {
            List<QuestionDTO> questions = questionService.getQuestionsForInterview(
                    interviewSession.getPosition(),
                    interviewSession.getTotalQuestions(),
                    "mixed");

            if (currentOrder < questions.size()) {
                QuestionDTO next = questions.get(currentOrder);
                next.setOrder(currentOrder + 1);
                sendMessage(session, buildQuestionJson(next, interviewSession.getTotalQuestions()));
            }
        } catch (Exception e) {
            log.error("推送下一题失败", e);
        }
    }

    private String streamEvaluation(WebSocketSession session, String questionText, String userAnswer,
                                    String referenceAnswer, String scoringDimensions,
                                    String position, int order, int total, String interviewMode) {
        String promptTemplate = loadPromptTemplate(interviewMode);
        String prompt = promptTemplate
                .replace("{position}", position)
                .replace("{n}", String.valueOf(order))
                .replace("{total}", String.valueOf(total))
                .replace("{scoringDimensions}", scoringDimensions)
                .replace("{question}", questionText)
                .replace("{userAnswer}", userAnswer)
                .replace("{referenceAnswer}", referenceAnswer != null ? referenceAnswer : "无");

        String raw = aiClient.chat(prompt);
        String json = extractJson(raw);

        if (!json.isEmpty()) {
            int chunkSize = Math.max(1, json.length() / 20);
            for (int i = 0; i < json.length(); i += chunkSize) {
                int end = Math.min(i + chunkSize, json.length());
                String chunk = json.substring(i, end);
                try {
                    sendMessage(session, buildStreamChunkJson(chunk, false));
                } catch (Exception e) {
                    log.error("流式推送失败", e);
                }
            }
        }

        try {
            sendMessage(session, buildStreamChunkJson("", true));
        } catch (Exception e) {
            log.error("流式结束推送失败", e);
        }

        try {
            sendMessage(session, buildEvaluationResultJson(json));
        } catch (Exception e) {
            log.error("评分结果推送失败", e);
        }

        return json;
    }

    private String loadPromptTemplate(String interviewMode) {
        String promptPath = "voice".equals(interviewMode) ? "prompts/evaluate-answer-voice.txt" : "prompts/evaluate-answer.txt";
        try {
            ClassPathResource resource = new ClassPathResource(promptPath);
            try (InputStream is = resource.getInputStream()) {
                return new String(is.readAllBytes(), StandardCharsets.UTF_8);
            }
        } catch (IOException e) {
            log.warn("Prompt模板加载失败，使用默认模板");
            if ("voice".equals(interviewMode)) {
                return "你是极其严格的技术面试官和语音表达评估专家。岗位：{position}，第{n}/{total}题。\n" +
                        "问题：{question}\n回答：{userAnswer}\n参考答案：{referenceAnswer}\n" +
                        "评分维度：{scoringDimensions}\n" +
                        "评分必须严格：答非所问0-10分，仅提关键词不超过20分，概念错误不超过30分。\n" +
                        "语音模式下需评估流畅度和紧张程度。\n" +
                        "请严格按JSON输出：{\"overallScore\":0-100,\"scores\":{\"accuracy\":0-10,\"depth\":0-10,\"fluency\":0-10,\"nervousness\":0-10},\"standardAnswer\":\"标准答案\",\"feedback\":\"反馈\",\"followUp\":\"追问或null\"}";
            }
            return "你是极其严格的技术面试官。岗位：{position}，第{n}/{total}题。\n" +
                    "问题：{question}\n回答：{userAnswer}\n参考答案：{referenceAnswer}\n" +
                    "评分维度：{scoringDimensions}\n" +
                    "评分必须严格：答非所问0-10分，仅提关键词不超过20分，概念错误不超过30分。\n" +
                    "请严格按JSON输出：{\"overallScore\":0-100,\"scores\":{\"accuracy\":0-10,\"depth\":0-10,\"expression\":0-10,\"practical\":0-10},\"standardAnswer\":\"标准答案\",\"feedback\":\"反馈\",\"followUp\":\"追问或null\"}";
        }
    }

    private Long extractSessionId(String uri) {
        try {
            String[] parts = uri.split("/");
            for (int i = 0; i < parts.length; i++) {
                if ("session".equals(parts[i]) && i + 1 < parts.length) {
                    return Long.parseLong(parts[i + 1]);
                }
            }
            if (parts.length > 0) {
                String last = parts[parts.length - 1];
                if (last.contains("?")) {
                    last = last.substring(0, last.indexOf("?"));
                }
                return Long.parseLong(last);
            }
        } catch (NumberFormatException e) {
            log.warn("无法从URI解析sessionId: {}", uri);
        }
        return null;
    }

    private String extractJson(String text) {
        int start = text.indexOf("{");
        int end = text.lastIndexOf("}");
        if (start >= 0 && end > start) {
            return text.substring(start, end + 1);
        }
        return text;
    }

    private String buildQuestionJson(QuestionDTO question, int totalQuestions) {
        try {
            Map<String, Object> msg = new java.util.LinkedHashMap<>();
            msg.put("type", "question");
            msg.put("questionId", question.getId());
            msg.put("order", question.getOrder());
            msg.put("questionText", question.getQuestionText());
            msg.put("category", question.getCategory());
            msg.put("difficulty", question.getDifficulty());
            msg.put("totalQuestions", totalQuestions);
            return objectMapper.writeValueAsString(msg);
        } catch (Exception e) {
            return "{\"type\":\"error\",\"message\":\"构建题目JSON失败\"}";
        }
    }

    private String buildStreamChunkJson(String content, boolean isEnd) {
        try {
            Map<String, Object> msg = new java.util.LinkedHashMap<>();
            msg.put("type", isEnd ? "stream_end" : "stream_chunk");
            msg.put("content", content);
            msg.put("isEnd", isEnd);
            return objectMapper.writeValueAsString(msg);
        } catch (Exception e) {
            return "{\"type\":\"stream_chunk\",\"content\":\"\",\"isEnd\":" + isEnd + "}";
        }
    }

    private String buildEvaluationResultJson(String evaluationJson) {
        try {
            JsonNode eval = objectMapper.readTree(evaluationJson);
            Map<String, Object> msg = new java.util.LinkedHashMap<>();
            msg.put("type", "evaluation");
            msg.put("overallScore", eval.has("overallScore") ? eval.get("overallScore").asDouble() : 0);
            msg.put("scores", eval.has("scores") ? eval.get("scores") : Map.of());
            msg.put("standardAnswer", eval.has("standardAnswer") && !eval.get("standardAnswer").isNull() ? eval.get("standardAnswer").asText() : "");
            msg.put("feedback", eval.has("feedback") && !eval.get("feedback").isNull() ? eval.get("feedback").asText() : "");
            JsonNode followUpNode = eval.get("followUp");
            msg.put("followUp", (followUpNode != null && !followUpNode.isNull() && !followUpNode.asText().isEmpty()) ? followUpNode.asText() : null);
            return objectMapper.writeValueAsString(msg);
        } catch (Exception e) {
            return "{\"type\":\"evaluation\",\"overallScore\":0,\"feedback\":\"评分解析失败\"}";
        }
    }

    private String buildInterviewEndJson(Long sessionId) {
        return "{\"type\":\"interview_end\",\"sessionId\":" + sessionId + "}";
    }

    private String buildEvaluatingJson(int questionOrder) {
        return "{\"type\":\"evaluating\",\"questionOrder\":" + questionOrder + ",\"message\":\"AI正在评分中...\"}";
    }

    private String buildErrorJson(String message) {
        return "{\"type\":\"error\",\"message\":\"" + message + "\"}";
    }

    private void sendMessage(WebSocketSession session, String message) {
        try {
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(message));
            }
        } catch (IOException e) {
            log.error("WebSocket消息发送失败", e);
        }
    }
}
