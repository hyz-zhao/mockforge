package com.interview.service.impl;

import com.interview.common.BusinessException;
import com.interview.dto.request.AiModelReq;
import com.interview.entity.AiModel;
import com.interview.repository.AiModelMapper;
import com.interview.service.AiModelService;
import com.interview.utils.AIClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AiModelServiceImpl implements AiModelService {

    private final AiModelMapper aiModelMapper;
    private final AIClient aiClient;

    @Override
    public List<AiModel> getAllModels() {
        return aiModelMapper.selectAll();
    }

    @Override
    public AiModel getActiveModel() {
        AiModel model = aiModelMapper.selectActiveModel();
        if (model == null) {
            throw new BusinessException("没有启用的AI模型，请先配置");
        }
        return model;
    }

    @Override
    @Transactional
    public AiModel createModel(AiModelReq req) {
        AiModel model = new AiModel();
        model.setName(req.getName());
        model.setProvider(req.getProvider());
        model.setModelId(req.getModelId());
        model.setApiKey(req.getApiKey());
        model.setBaseUrl(req.getBaseUrl());
        model.setIsActive(0);
        model.setTemperature(req.getTemperature() != null ? req.getTemperature() : 0.7);
        model.setMaxTokens(req.getMaxTokens() != null ? req.getMaxTokens() : 4096);
        model.setSortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0);
        model.setRemark(req.getRemark());
        aiModelMapper.insert(model);
        return model;
    }

    @Override
    @Transactional
    public AiModel updateModel(Long id, AiModelReq req) {
        AiModel model = aiModelMapper.selectById(id);
        if (model == null) {
            throw new BusinessException("模型配置不存在");
        }
        model.setName(req.getName());
        model.setProvider(req.getProvider());
        model.setModelId(req.getModelId());
        model.setApiKey(req.getApiKey());
        model.setBaseUrl(req.getBaseUrl());
        model.setTemperature(req.getTemperature() != null ? req.getTemperature() : 0.7);
        model.setMaxTokens(req.getMaxTokens() != null ? req.getMaxTokens() : 4096);
        model.setSortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0);
        model.setRemark(req.getRemark());
        aiModelMapper.updateById(model);
        return model;
    }

    @Override
    @Transactional
    public void deleteModel(Long id) {
        AiModel model = aiModelMapper.selectById(id);
        if (model == null) {
            throw new BusinessException("模型配置不存在");
        }
        if (model.getIsActive() == 1) {
            throw new BusinessException("不能删除正在使用的模型");
        }
        aiModelMapper.deleteById(id);
    }

    @Override
    @Transactional
    public void setActiveModel(Long id) {
        AiModel model = aiModelMapper.selectById(id);
        if (model == null) {
            throw new BusinessException("模型配置不存在");
        }
        // 先取消所有模型的激活状态
        List<AiModel> all = aiModelMapper.selectAll();
        for (AiModel m : all) {
            if (m.getIsActive() == 1) {
                m.setIsActive(0);
                aiModelMapper.updateById(m);
            }
        }
        // 激活指定模型
        model.setIsActive(1);
        aiModelMapper.updateById(model);
    }

    @Override
    public AiModel getModelById(Long id) {
        AiModel model = aiModelMapper.selectById(id);
        if (model == null) {
            throw new BusinessException("模型配置不存在");
        }
        return model;
    }

    @Override
    public String testConnection(AiModelReq req) {
        return aiClient.testConnection(req.getName(), req.getModelId(), req.getApiKey(), req.getBaseUrl());
    }
}
