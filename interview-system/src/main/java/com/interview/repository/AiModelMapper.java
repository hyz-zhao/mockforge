package com.interview.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.interview.entity.AiModel;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface AiModelMapper extends BaseMapper<AiModel> {

    @Select("SELECT * FROM ai_models WHERE is_active = 1 ORDER BY sort_order ASC LIMIT 1")
    AiModel selectActiveModel();

    @Select("SELECT * FROM ai_models ORDER BY sort_order ASC")
    List<AiModel> selectAll();
}
