package com.interview.service;

import com.interview.dto.response.PositionResp;
import com.interview.dto.response.QuestionDTO;

import java.util.List;

public interface QuestionService {

    List<QuestionDTO> getQuestionsForInterview(String position, Integer count, String difficulty);

    List<QuestionDTO> getQuestionsFromKnowledge(String sourceFile, Integer count, String difficulty);

    List<QuestionDTO> getQuestionsFromKnowledgeByAi(String sourceFile, String position, Integer count, String difficulty);

    List<QuestionDTO> getQuestionsFromAi(String position, String resumeSummary, Integer count, String difficulty);

    boolean isKnowledgeFileRelevant(String sourceFile, String position);

    boolean isValidPositionName(String positionName);

    List<PositionResp> getAllPositions();

    void warmUpCache();
}
