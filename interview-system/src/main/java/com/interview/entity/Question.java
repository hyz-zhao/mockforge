package com.interview.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("questions")
public class Question {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String position;

    private String category;

    private String difficulty;

    private String type;

    private String questionText;

    private String referenceAnswer;

    private String scoringDimensions;

    private Integer useCount;

    private Integer deleted;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
