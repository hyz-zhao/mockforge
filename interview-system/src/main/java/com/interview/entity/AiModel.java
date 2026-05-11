package com.interview.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("ai_models")
public class AiModel {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;

    private String provider;

    private String modelId;

    private String apiKey;

    private String baseUrl;

    private Integer isActive;

    private Double temperature;

    private Integer maxTokens;

    private Integer sortOrder;

    private String remark;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
