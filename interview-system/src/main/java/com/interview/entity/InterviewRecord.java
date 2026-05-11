package com.interview.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("interview_records")
public class InterviewRecord {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long sessionId;

    private Long questionId;

    private Integer questionOrder;

    private String questionText;

    private String userAnswer;

    private String inputType;

    private String aiEvaluation;

    private Double questionScore;

    private String followUp;

    private LocalDateTime answeredAt;

    private Integer deleted;

    private LocalDateTime createdAt;
}
