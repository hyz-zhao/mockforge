package com.interview.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.common.BusinessException;
import com.interview.dto.response.PositionResp;
import com.interview.dto.response.QuestionDTO;
import com.interview.entity.KnowledgeItem;
import com.interview.entity.Question;
import com.interview.repository.QuestionMapper;
import com.interview.service.KnowledgeService;
import com.interview.service.QuestionService;
import com.interview.utils.AIClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuestionServiceImpl implements QuestionService {

    private final QuestionMapper questionMapper;
    private final StringRedisTemplate redisTemplate;
    private final AIClient aiClient;
    private final ObjectMapper objectMapper;
    private final KnowledgeService knowledgeService;

    private static final String CACHE_KEY_PREFIX = "interview:questions:";
    private static final long CACHE_TTL_HOURS = 24;

    private static final List<PositionResp> POSITION_LIST = List.of(
            buildPosition("Java后端工程师", "负责服务端开发、API设计、系统架构", List.of("Java基础", "Spring框架", "数据库", "系统设计", "算法")),
            buildPosition("前端工程师", "负责Web前端开发、用户交互实现", List.of("JavaScript", "React/Vue", "CSS", "浏览器原理", "工程化")),
            buildPosition("数据分析师", "负责数据挖掘、分析和可视化", List.of("SQL", "Python", "统计学", "数据可视化", "机器学习基础")),
            buildPosition("产品经理", "负责产品规划、需求分析", List.of("需求分析", "产品设计", "数据分析", "用户研究", "竞品分析")),
            buildPosition("算法工程师", "负责机器学习、深度学习模型开发", List.of("机器学习", "深度学习", "Python", "数学基础", "论文阅读"))
    );

    @Override
    public List<QuestionDTO> getQuestionsForInterview(String position, Integer count, String difficulty) {
        String cacheKey = CACHE_KEY_PREFIX + position + ":" + difficulty;
        List<Question> allQuestions = new ArrayList<>();

        try {
            String cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                allQuestions = objectMapper.readValue(cached, new TypeReference<>() {});
            }
        } catch (Exception e) {
            log.warn("Redis缓存读取失败: {}", e.getMessage());
        }

        if (allQuestions.isEmpty()) {
            if ("mixed".equals(difficulty)) {
                allQuestions = questionMapper.selectByPosition(position);
            } else {
                allQuestions = questionMapper.selectByPositionAndDifficulty(position, difficulty);
            }
        }

        if (allQuestions.size() < count) {
            int need = count - allQuestions.size();
            log.info("库中已有{}道题，需要{}道，AI补充生成{}道", allQuestions.size(), count, need);
            List<Question> aiGenerated = generateQuestionsByAi(position, need, difficulty);
            for (Question q : aiGenerated) {
                questionMapper.insert(q);
                allQuestions.add(q);
            }
        }

        if (!allQuestions.isEmpty()) {
            cacheQuestions(cacheKey, allQuestions);
        }

        return selectRandom(allQuestions, count).stream()
                .map(this::toQuestionDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<QuestionDTO> getQuestionsFromKnowledge(String sourceFile, Integer count, String difficulty) {
        List<KnowledgeItem> items;
        if (difficulty != null && !"mixed".equals(difficulty)) {
            items = knowledgeService.getItemsByDifficulty(difficulty);
        } else {
            items = knowledgeService.getItemsBySource(sourceFile);
        }

        if (items.isEmpty()) {
            throw new BusinessException("知识库中没有找到相关题目");
        }

        List<KnowledgeItem> selected = selectRandomKnowledge(items, count);
        return selected.stream().map(this::toQuestionDTOFromKnowledge).collect(Collectors.toList());
    }

    @Override
    public List<QuestionDTO> getQuestionsFromAi(String position, String resumeSummary, Integer count, String difficulty) {
        List<Question> aiGenerated = generateQuestionsByAiWithResume(position, resumeSummary, count, difficulty);
        return aiGenerated.stream().map(this::toQuestionDTO).collect(Collectors.toList());
    }

    @Override
    public List<QuestionDTO> getQuestionsFromKnowledgeByAi(String sourceFile, String position, Integer count, String difficulty) {
        String fileContent = knowledgeService.getFileContent(sourceFile);
        if (fileContent == null || fileContent.isEmpty()) {
            throw new BusinessException("知识库文件内容不存在");
        }

        List<Question> aiGenerated = generateQuestionsFromKnowledgeContent(fileContent, position, count, difficulty);
        return aiGenerated.stream().map(this::toQuestionDTO).collect(Collectors.toList());
    }

    @Override
    public boolean isKnowledgeFileRelevant(String sourceFile, String position) {
        String fileContent = knowledgeService.getFileContent(sourceFile);
        if (fileContent == null || fileContent.isEmpty()) {
            return false;
        }

        String prompt = String.format(
                "请判断以下知识库文件内容是否与【%s】岗位相关。\n" +
                "如果相关，请只输出：true\n" +
                "如果不相关，请只输出：false\n" +
                "不要输出任何其他内容。\n\n" +
                "知识库内容：\n%s",
                position, fileContent);

        String response = aiClient.chat(prompt);
        return response.trim().toLowerCase().contains("true");
    }

    @Override
    public boolean isValidPositionName(String positionName) {
        if (positionName == null || positionName.trim().isEmpty()) {
            return false;
        }

        String prompt = String.format(
                "请判断以下文本是否像一个合理的职业/岗位名称。\n" +
                "合理的岗位名称通常包含：技术方向、职能领域、级别等关键词，如\"Java后端工程师\"、\"产品经理\"、\"数据分析师\"等。\n" +
                "不合理的输入如：\"你好\"、\"测试\"、\"随便\"、\"abc\"等与职业无关的内容。\n" +
                "如果像岗位名称，请只输出：true\n" +
                "如果不像岗位名称，请只输出：false\n" +
                "不要输出任何其他内容。\n\n" +
                "待判断文本：【%s】",
                positionName);

        String response = aiClient.chat(prompt);
        return response.trim().toLowerCase().contains("true");
    }

    @Override
    public List<PositionResp> getAllPositions() {
        return POSITION_LIST;
    }

    @Override
    public void warmUpCache() {
        for (PositionResp position : POSITION_LIST) {
            String cacheKey = CACHE_KEY_PREFIX + position.getName() + ":mixed";
            List<Question> questions = questionMapper.selectByPosition(position.getName());
            if (!questions.isEmpty()) {
                cacheQuestions(cacheKey, questions);
                log.info("题库预热完成: {} ({}道题)", position.getName(), questions.size());
            }
        }
    }

    private List<Question> generateQuestionsByAi(String position, Integer count, String difficulty) {
        String difficultyDesc;
        if ("mixed".equals(difficulty)) {
            int easy = Math.max(1, count / 3);
            int medium = count - easy * 2;
            int hard = easy;
            difficultyDesc = String.format("简单%d道、中等%d道、困难%d道", easy, medium, hard);
        } else {
            difficultyDesc = difficulty;
        }

        String prompt = String.format(
                "你是一位资深技术面试官，请为【%s】岗位生成%d道面试题。" +
                "难度要求：%s。" +
                "请严格按以下JSON数组格式输出，不要有其他内容：\n" +
                "[{\"category\":\"分类\",\"difficulty\":\"easy/medium/hard\",\"type\":\"technical/behavioral/scenario\"," +
                "\"questionText\":\"题目内容\",\"referenceAnswer\":\"参考答案要点\",\"scoringDimensions\":[\"维度1\",\"维度2\"]}]",
                position, count, difficultyDesc);

        String response = aiClient.chat(prompt);
        String json = extractJson(response);

        try {
            List<Map<String, Object>> items = objectMapper.readValue(json, new TypeReference<>() {});
            List<Question> result = new ArrayList<>();
            for (Map<String, Object> item : items) {
                Question q = new Question();
                q.setPosition(position);
                q.setCategory((String) item.get("category"));
                q.setDifficulty((String) item.get("difficulty"));
                q.setType((String) item.get("type"));
                q.setQuestionText((String) item.get("questionText"));
                q.setReferenceAnswer((String) item.get("referenceAnswer"));
                q.setScoringDimensions(objectMapper.writeValueAsString(item.get("scoringDimensions")));
                q.setUseCount(0);
                q.setDeleted(0);
                result.add(q);
            }
            return result;
        } catch (Exception e) {
            log.error("AI生成题目解析失败: {}", response, e);
            throw new BusinessException("题目生成失败，请重试");
        }
    }

    private List<Question> selectRandom(List<Question> questions, int count) {
        if (questions.size() <= count) {
            return new ArrayList<>(questions);
        }
        List<Question> shuffled = new ArrayList<>(questions);
        java.util.Collections.shuffle(shuffled);
        return shuffled.subList(0, count);
    }

    private List<KnowledgeItem> selectRandomKnowledge(List<KnowledgeItem> items, int count) {
        if (items.size() <= count) {
            return new ArrayList<>(items);
        }
        List<KnowledgeItem> shuffled = new ArrayList<>(items);
        java.util.Collections.shuffle(shuffled);
        return shuffled.subList(0, count);
    }

    private QuestionDTO toQuestionDTOFromKnowledge(KnowledgeItem item) {
        QuestionDTO dto = new QuestionDTO();
        dto.setId(item.getId());
        dto.setType(item.getQuestionType() != null ? item.getQuestionType() : "technical");
        dto.setCategory(item.getCategory());
        dto.setDifficulty(item.getDifficulty() != null ? item.getDifficulty() : "medium");
        dto.setQuestionText(item.getTitle() + "\n\n" + item.getContent());
        return dto;
    }

    private List<Question> generateQuestionsByAiWithResume(String position, String resumeSummary, Integer count, String difficulty) {
        String difficultyDesc;
        if ("mixed".equals(difficulty)) {
            int easy = Math.max(1, count / 3);
            int medium = count - easy * 2;
            int hard = easy;
            difficultyDesc = String.format("简单%d道、中等%d道、困难%d道", easy, medium, hard);
        } else {
            difficultyDesc = difficulty;
        }

        String prompt = String.format(
                "你是一位资深技术面试官，请为【%s】岗位生成%d道面试题。\n" +
                "候选人简历摘要：%s\n" +
                "难度要求：%s。\n" +
                "请结合候选人的简历背景，生成有针对性的面试题目。\n" +
                "请严格按以下JSON数组格式输出，不要有其他内容：\n" +
                "[{\"category\":\"分类\",\"difficulty\":\"easy/medium/hard\",\"type\":\"technical/behavioral/scenario\"," +
                "\"questionText\":\"题目内容\",\"referenceAnswer\":\"参考答案要点\",\"scoringDimensions\":[\"维度1\",\"维度2\"]}]",
                position, count, resumeSummary != null ? resumeSummary : "无简历信息", difficultyDesc);

        String response = aiClient.chat(prompt);
        String json = extractJson(response);

        try {
            List<Map<String, Object>> items = objectMapper.readValue(json, new TypeReference<>() {});
            List<Question> result = new ArrayList<>();
            for (Map<String, Object> item : items) {
                Question q = new Question();
                q.setPosition(position);
                q.setCategory((String) item.get("category"));
                q.setDifficulty((String) item.get("difficulty"));
                q.setType((String) item.get("type"));
                q.setQuestionText((String) item.get("questionText"));
                q.setReferenceAnswer((String) item.get("referenceAnswer"));
                q.setScoringDimensions(objectMapper.writeValueAsString(item.get("scoringDimensions")));
                q.setUseCount(0);
                q.setDeleted(0);
                result.add(q);
            }
            return result;
        } catch (Exception e) {
            log.error("AI生成题目解析失败: {}", response, e);
            throw new BusinessException("题目生成失败，请重试");
        }
    }

    private List<Question> generateQuestionsFromKnowledgeContent(String fileContent, String position, Integer count, String difficulty) {
        String difficultyDesc;
        if ("mixed".equals(difficulty)) {
            int easy = Math.max(1, count / 3);
            int medium = count - easy * 2;
            int hard = easy;
            difficultyDesc = String.format("简单%d道、中等%d道、困难%d道", easy, medium, hard);
        } else {
            difficultyDesc = difficulty;
        }

        String prompt = String.format(
                "你是一位资深技术面试官，请阅读以下知识库内容，并从中提取/生成%d道面试题。\n" +
                "目标岗位：%s\n" +
                "难度要求：%s。\n" +
                "请基于知识库内容生成与【%s】岗位相关的题目。\n" +
                "知识库内容：\n%s\n" +
                "请严格按以下JSON数组格式输出，不要有其他内容：\n" +
                "[{\"category\":\"分类\",\"difficulty\":\"easy/medium/hard\",\"type\":\"technical/behavioral/scenario\"," +
                "\"questionText\":\"题目内容\",\"referenceAnswer\":\"参考答案要点\",\"scoringDimensions\":[\"维度1\",\"维度2\"]}]",
                count, position, difficultyDesc, position, fileContent);

        String response = aiClient.chat(prompt);
        String json = extractJson(response);

        try {
            List<Map<String, Object>> items = objectMapper.readValue(json, new TypeReference<>() {});
            List<Question> result = new ArrayList<>();
            for (Map<String, Object> item : items) {
                Question q = new Question();
                q.setPosition("知识库");
                q.setCategory((String) item.get("category"));
                q.setDifficulty((String) item.get("difficulty"));
                q.setType((String) item.get("type"));
                q.setQuestionText((String) item.get("questionText"));
                q.setReferenceAnswer((String) item.get("referenceAnswer"));
                q.setScoringDimensions(objectMapper.writeValueAsString(item.get("scoringDimensions")));
                q.setUseCount(0);
                q.setDeleted(0);
                result.add(q);
            }
            return result;
        } catch (Exception e) {
            log.error("AI从知识库生成题目解析失败: {}", response, e);
            throw new BusinessException("题目生成失败，请重试");
        }
    }

    private void cacheQuestions(String cacheKey, List<Question> questions) {
        try {
            String json = objectMapper.writeValueAsString(questions);
            redisTemplate.opsForValue().set(cacheKey, json, CACHE_TTL_HOURS, TimeUnit.HOURS);
        } catch (Exception e) {
            log.warn("Redis缓存写入失败: {}", e.getMessage());
        }
    }

    private QuestionDTO toQuestionDTO(Question q) {
        QuestionDTO dto = new QuestionDTO();
        dto.setId(q.getId());
        dto.setType(q.getType());
        dto.setCategory(q.getCategory());
        dto.setDifficulty(q.getDifficulty());
        dto.setQuestionText(q.getQuestionText());
        return dto;
    }

    private String extractJson(String text) {
        int start = text.indexOf("[");
        int end = text.lastIndexOf("]");
        if (start >= 0 && end > start) {
            return text.substring(start, end + 1);
        }
        return text;
    }

    private static PositionResp buildPosition(String name, String desc, List<String> categories) {
        PositionResp p = new PositionResp();
        p.setName(name);
        p.setDescription(desc);
        p.setHotCategories(categories);
        p.setQuestionCount(0);
        return p;
    }
}
