package com.interview.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.common.BusinessException;
import com.interview.dto.request.StartInterviewReq;
import com.interview.dto.response.*;
import com.interview.entity.InterviewRecord;
import com.interview.entity.InterviewSession;
import com.interview.repository.InterviewRecordMapper;
import com.interview.repository.InterviewSessionMapper;
import com.interview.repository.ResumeMapper;
import com.interview.service.InterviewService;
import com.interview.service.QuestionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InterviewServiceImpl implements InterviewService {

    private final InterviewSessionMapper sessionMapper;
    private final InterviewRecordMapper recordMapper;
    private final ResumeMapper resumeMapper;
    private final QuestionService questionService;

    @Override
    public StartInterviewResp startInterview(Long userId, StartInterviewReq req) {
        List<QuestionDTO> questions;
        String sourceType = req.getSourceType() != null ? req.getSourceType() : "database";
        String position = req.getPosition();
        boolean isCustomPosition = isCustomPosition(position);

        if ("knowledge".equals(sourceType)) {
            if (isCustomPosition) {
                boolean relevant = questionService.isKnowledgeFileRelevant(req.getKnowledgeSource(), position);
                if (!relevant) {
                    throw new BusinessException("知识库文件内容与【" + position + "】岗位无关，请更换文件或选择其他出题来源");
                }
            }
            questions = questionService.getQuestionsFromKnowledgeByAi(
                    req.getKnowledgeSource(), position, req.getQuestionCount(), req.getDifficulty());
        } else if ("ai_resume".equals(sourceType)) {
            String resumeSummary = req.getResumeId() != null ? getResumeSummary(req.getResumeId()) : null;
            questions = questionService.getQuestionsFromAi(
                    position, resumeSummary, req.getQuestionCount(), req.getDifficulty());
        } else {
            if (isCustomPosition) {
                questions = questionService.getQuestionsFromAi(
                        position, null, req.getQuestionCount(), req.getDifficulty());
            } else {
                questions = questionService.getQuestionsForInterview(
                        position, req.getQuestionCount(), req.getDifficulty());
            }
        }

        InterviewSession session = new InterviewSession();
        session.setUserId(userId);
        session.setResumeId(req.getResumeId());
        session.setPosition(req.getPosition());
        session.setInterviewMode(req.getInterviewMode() != null ? req.getInterviewMode() : "qa");
        session.setStatus("ongoing");
        session.setTotalQuestions(questions.size());
        session.setCompletedQuestions(0);
        session.setStartedAt(LocalDateTime.now());
        session.setDeleted(0);
        sessionMapper.insert(session);

        for (int i = 0; i < questions.size(); i++) {
            questions.get(i).setOrder(i + 1);
        }

        StartInterviewResp resp = new StartInterviewResp();
        resp.setSessionId(session.getId());
        resp.setPosition(req.getPosition());
        resp.setInterviewMode(session.getInterviewMode());
        resp.setTotalQuestions(questions.size());
        resp.setQuestions(questions);
        return resp;
    }

    private String getResumeSummary(Long resumeId) {
        try {
            com.interview.entity.Resume resume = resumeMapper.selectById(resumeId);
            if (resume != null && resume.getAiSummary() != null) {
                return resume.getAiSummary();
            }
        } catch (Exception e) {
            log.warn("获取简历摘要失败", e);
        }
        return null;
    }

    private boolean isCustomPosition(String position) {
        if (position == null) return true;
        List<String> predefinedPositions = List.of(
                "Java后端工程师", "前端工程师", "数据分析师", "产品经理", "算法工程师"
        );
        return !predefinedPositions.contains(position);
    }

    @Override
    public void completeSession(Long sessionId) {
        InterviewSession session = sessionMapper.selectById(sessionId);
        if (session == null || session.getDeleted() == 1) {
            throw new BusinessException("面试会话不存在");
        }

        List<InterviewRecord> records = recordMapper.selectBySessionId(sessionId);
        double avgScore = records.stream()
                .filter(r -> r.getQuestionScore() != null)
                .mapToDouble(InterviewRecord::getQuestionScore)
                .average().orElse(0.0);

        double technicalAvg = avgScore;
        double logicAvg = avgScore;
        double expressionAvg = avgScore;

        session.setOverallScore(avgScore);
        session.setTechnicalScore(technicalAvg);
        session.setLogicScore(logicAvg);
        session.setExpressionScore(expressionAvg);
        session.setPracticalScore(avgScore);
        session.setLearningScore(avgScore);
        session.setStatus("completed");
        session.setEndedAt(LocalDateTime.now());
        sessionMapper.updateById(session);
    }

    @Override
    public InterviewReportResp getReport(Long sessionId) {
        InterviewSession session = sessionMapper.selectById(sessionId);
        if (session == null || session.getDeleted() == 1) {
            throw new BusinessException("面试会话不存在");
        }

        if (session.getReportJson() != null && !session.getReportJson().isEmpty()) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                return mapper.readValue(session.getReportJson(), InterviewReportResp.class);
            } catch (Exception e) {
                log.warn("报告JSON解析失败，重新生成", e);
            }
        }

        return buildReportFromRecords(session);
    }

    @Override
    public List<InterviewHistoryResp> getHistory(Long userId) {
        List<InterviewSession> sessions = sessionMapper.selectByUserId(userId);
        return sessions.stream().map(s -> {
            InterviewHistoryResp resp = new InterviewHistoryResp();
            resp.setSessionId(s.getId());
            resp.setPosition(s.getPosition());
            resp.setOverallScore(s.getOverallScore());
            resp.setStatus(s.getStatus());
            resp.setStartedAt(s.getStartedAt());
            resp.setCompletedQuestions(s.getCompletedQuestions());
            resp.setTotalQuestions(s.getTotalQuestions());
            return resp;
        }).collect(Collectors.toList());
    }

    @Override
    public ProgressResp getProgress(Long userId) {
        List<Map<String, Object>> byCountData = recordMapper.selectProgressByUserId(userId);

        ProgressResp resp = new ProgressResp();
        resp.setDates(new ArrayList<>());
        resp.setTechnicalScores(new ArrayList<>());
        resp.setLogicScores(new ArrayList<>());
        resp.setExpressionScores(new ArrayList<>());
        resp.setOverallScores(new ArrayList<>());

        int index = 0;
        for (Map<String, Object> row : byCountData) {
            Object dateObj = row.get("date");
            String dateStr = dateObj != null ? dateObj.toString() : "";
            resp.getDates().add("第" + (++index) + "次");
            resp.getTechnicalScores().add(toDouble(row.get("technical")));
            resp.getLogicScores().add(toDouble(row.get("logic")));
            resp.getExpressionScores().add(toDouble(row.get("expression")));
            resp.getOverallScores().add(toDouble(row.get("overall")));
        }

        List<Map<String, Object>> byDateData = recordMapper.selectProgressGroupByDate(userId);
        ProgressResp.ProgressDetail byDate = new ProgressResp.ProgressDetail();
        byDate.setDates(new ArrayList<>());
        byDate.setTechnicalScores(new ArrayList<>());
        byDate.setLogicScores(new ArrayList<>());
        byDate.setExpressionScores(new ArrayList<>());
        byDate.setOverallScores(new ArrayList<>());

        for (Map<String, Object> row : byDateData) {
            Object dateObj = row.get("date");
            byDate.getDates().add(dateObj != null ? dateObj.toString() : "");
            byDate.getTechnicalScores().add(toDouble(row.get("technical")));
            byDate.getLogicScores().add(toDouble(row.get("logic")));
            byDate.getExpressionScores().add(toDouble(row.get("expression")));
            byDate.getOverallScores().add(toDouble(row.get("overall")));
        }
        resp.setByDate(byDate);

        return resp;
    }

    private InterviewReportResp buildReportFromRecords(InterviewSession session) {
        List<InterviewRecord> records = recordMapper.selectBySessionId(session.getId());

        List<QuestionResult> questionResults = records.stream().map(r -> {
            QuestionResult qr = new QuestionResult();
            qr.setOrder(r.getQuestionOrder());
            qr.setQuestionText(r.getQuestionText());
            qr.setUserAnswer(r.getUserAnswer());
            qr.setScore(r.getQuestionScore());
            if (r.getAiEvaluation() != null) {
                try {
                    ObjectMapper mapper = new ObjectMapper();
                    JsonNode node = mapper.readTree(r.getAiEvaluation());
                    qr.setStandardAnswer(node.has("standardAnswer") ? node.get("standardAnswer").asText() : null);
                    qr.setFeedback(node.has("feedback") ? node.get("feedback").asText() : null);
                } catch (Exception e) {
                    qr.setStandardAnswer(null);
                    qr.setFeedback(null);
                }
            }
            return qr;
        }).collect(Collectors.toList());

        double avgScore = records.stream()
                .filter(r -> r.getQuestionScore() != null)
                .mapToDouble(InterviewRecord::getQuestionScore)
                .average().orElse(0.0);

        InterviewReportResp resp = new InterviewReportResp();
        resp.setSessionId(session.getId());
        resp.setPosition(session.getPosition());
        resp.setStartedAt(session.getStartedAt());
        resp.setTotalQuestions(session.getTotalQuestions());
        resp.setOverallScore(Math.round(avgScore * 100.0) / 100.0);
        resp.setRank(calculateRank(avgScore));
        resp.setQuestionResults(questionResults);

        RadarData radar = new RadarData();
        if ("voice".equals(session.getInterviewMode())) {
            radar.setDimensions(List.of("技术知识", "逻辑思维", "表达流畅度", "紧张控制", "项目经验"));
            radar.setScores(List.of(avgScore, avgScore, avgScore, avgScore, avgScore));
            radar.setIndustryAverage(List.of(75.0, 78.0, 72.0, 68.0, 65.0));
        } else {
            radar.setDimensions(List.of("技术知识", "逻辑思维", "表达能力", "项目经验", "学习潜力"));
            radar.setScores(List.of(avgScore, avgScore, avgScore, avgScore, avgScore));
            radar.setIndustryAverage(List.of(75.0, 78.0, 72.0, 65.0, 80.0));
        }
        resp.setRadarData(radar);

        resp.setWeakPoints(new ArrayList<>());
        resp.setStrongPoints(new ArrayList<>());
        resp.setNextStepAdvice("继续努力，多练习面试题");

        try {
            session.setOverallScore(avgScore);
            session.setTechnicalScore(avgScore);
            session.setLogicScore(avgScore);
            session.setExpressionScore(avgScore);
            session.setPracticalScore(avgScore);
            session.setLearningScore(avgScore);
            ObjectMapper mapper = new ObjectMapper();
            session.setReportJson(mapper.writeValueAsString(resp));
            sessionMapper.updateById(session);
        } catch (Exception e) {
            log.warn("报告缓存失败", e);
        }

        return resp;
    }

    private String calculateRank(double score) {
        if (score >= 90) return "优秀（超过同岗位90%的候选人）";
        if (score >= 80) return "良好（超过同岗位75%的候选人）";
        if (score >= 70) return "中等偏上（超过同岗位60%的候选人）";
        if (score >= 60) return "中等（超过同岗位40%的候选人）";
        return "待提升（低于同岗位平均水平）";
    }

    private Double toDouble(Object val) {
        if (val == null) return 0.0;
        if (val instanceof Number) return ((Number) val).doubleValue();
        try { return Double.parseDouble(val.toString()); } catch (Exception e) { return 0.0; }
    }
}
