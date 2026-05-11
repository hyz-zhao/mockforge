package com.interview.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AiModelReq {

    @NotBlank(message = "模型名称不能为空")
    private String name;

    @NotBlank(message = "供应商不能为空")
    private String provider;

    @NotBlank(message = "模型ID不能为空")
    private String modelId;

    @NotBlank(message = "API Key不能为空")
    private String apiKey;

    @NotBlank(message = "API地址不能为空")
    private String baseUrl;

    private Double temperature = 0.7;

    private Integer maxTokens = 4096;

    private Integer sortOrder = 0;

    private String remark;
}
