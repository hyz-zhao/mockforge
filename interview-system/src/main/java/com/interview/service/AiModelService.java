package com.interview.service;

import com.interview.dto.request.AiModelReq;
import com.interview.entity.AiModel;

import java.util.List;

public interface AiModelService {

    List<AiModel> getAllModels();

    AiModel getActiveModel();

    AiModel createModel(AiModelReq req);

    AiModel updateModel(Long id, AiModelReq req);

    void deleteModel(Long id);

    void setActiveModel(Long id);

    AiModel getModelById(Long id);

    String testConnection(AiModelReq req);
}
