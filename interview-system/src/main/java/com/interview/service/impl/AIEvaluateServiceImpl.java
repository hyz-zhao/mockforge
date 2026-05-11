package com.interview.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.common.BusinessException;
import com.interview.dto.response.InterviewReportResp;
import com.interview.entity.InterviewRecord;
import com.interview.entity.InterviewSession;
import com.interview.repository.InterviewRecordMapper;
import com.interview.repository.InterviewSessionMapper;
import com.interview.service.AIEvaluateService;
import com.interview.utils.AIClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIEvaluateServiceImpl implements AIEvaluateService {

    private final AIClient aiClient;
    private final ObjectMapper objectMapper;
    private final InterviewSessionMapper sessionMapper;
    private final InterviewRecordMapper recordMapper;

    @Async("aiTaskExecutor")
    @Override
    public void evaluateAnswerAsync(Long recordId, String questionText, String userAnswer,
                                   String referenceAnswer, String scoringDimensions) {
        try {
            String evaluationJson = evaluateAnswer(questionText, userAnswer, referenceAnswer, scoringDimensions);
            InterviewRecord record = recordMapper.selectById(recordId);
            if (record != null) {
                record.setAiEvaluation(evaluationJson);
                try {
                    JsonNode evalNode = objectMapper.readTree(evaluationJson);
                    if (evalNode.has("overallScore")) {
                        record.setQuestionScore(evalNode.get("overallScore").asDouble());
                    }
                    if (evalNode.has("followUp")) {
                        record.setFollowUp(evalNode.get("followUp").asText());
                    }
                } catch (Exception e) {
                    log.warn("异步评分JSON解析失败", e);
                }
                recordMapper.updateById(record);
            }
        } catch (Exception e) {
            log.error("异步评分失败, recordId={}", recordId, e);
        }
    }

    @Override
    public String evaluateAnswer(String questionText, String userAnswer,
                                 String referenceAnswer, String scoringDimensions) {
        String template = loadPrompt("prompts/evaluate-answer.txt");
        String prompt = template
                .replace("{question}", questionText)
                .replace("{userAnswer}", userAnswer)
                .replace("{referenceAnswer}", referenceAnswer != null ? referenceAnswer : "")
                .replace("{scoringDimensions}", scoringDimensions);

        String response = aiClient.chat(prompt);

        return extractJson(response);
    }

    @Override
    public InterviewReportResp generateReport(Long sessionId) {
        InterviewSession session = sessionMapper.selectById(sessionId);
        if (session == null) {
            throw new BusinessException("面试会话不存在");
        }

        List<InterviewRecord> records = recordMapper.selectBySessionId(sessionId);
        String recordsText = buildRecordsText(records);

        String template = loadPrompt("prompts/generate-report.txt");
        String prompt = template
                .replace("{position}", session.getPosition())
                .replace("{totalQuestions}", String.valueOf(session.getTotalQuestions()))
                .replace("{interviewRecords}", recordsText);

        String response = aiClient.chat(prompt);

        String json = extractJson(response);

        try {
            InterviewReportResp report = objectMapper.readValue(json, InterviewReportResp.class);
            report.setSessionId(sessionId);
            report.setPosition(session.getPosition());
            report.setStartedAt(session.getStartedAt());
            report.setTotalQuestions(session.getTotalQuestions());

            session.setReportJson(json);
            if (report.getRadarData() != null && report.getRadarData().getScores() != null) {
                List<Double> scores = report.getRadarData().getScores();
                if (scores.size() >= 5) {
                    session.setTechnicalScore(scores.get(0));
                    session.setLogicScore(scores.get(1));
                    session.setExpressionScore(scores.get(2));
                    session.setPracticalScore(scores.get(3));
                    session.setLearningScore(scores.get(4));
                }
            }
            session.setOverallScore(report.getOverallScore());
            sessionMapper.updateById(session);

            return report;
        } catch (Exception e) {
            log.error("报告JSON解析失败: {}", response, e);
            throw new BusinessException("报告生成失败，请重试");
        }
    }

    private String loadPrompt(String path) {
        try {
            ClassPathResource resource = new ClassPathResource(path);
            try (InputStream is = resource.getInputStream()) {
                return new String(is.readAllBytes(), StandardCharsets.UTF_8);
            }
        } catch (IOException e) {
            log.error("Prompt模板加载失败: {}", path, e);
            throw new BusinessException("Prompt模板加载失败");
        }
    }

    private String buildRecordsText(List<InterviewRecord> records) {
        return records.stream()
                .map(r -> String.format("第%d题: %s\n用户回答: %s\n评分: %s\n",
                        r.getQuestionOrder(),
                        r.getQuestionText(),
                        r.getUserAnswer() != null ? r.getUserAnswer() : "(未作答)",
                        r.getAiEvaluation() != null ? r.getAiEvaluation() : "未评分"))
                .collect(Collectors.joining("\n"));
    }

    private String extractJson(String text) {
        int start = text.indexOf("{");
        int end = text.lastIndexOf("}");
        if (start >= 0 && end > start) {
            return text.substring(start, end + 1);
        }
        return text;
    }
}
