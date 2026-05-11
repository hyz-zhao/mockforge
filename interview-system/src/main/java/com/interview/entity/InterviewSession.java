package com.interview.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("interview_sessions")
public class InterviewSession {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private Long resumeId;

    private String position;

    private String interviewMode;

    private String status;

    private Integer totalQuestions;

    private Integer completedQuestions;

    private Double technicalScore;

    private Double logicScore;

    private Double expressionScore;

    private Double practicalScore;

    private Double learningScore;

    private Double overallScore;

    private String reportJson;

    private LocalDateTime startedAt;

    private LocalDateTime endedAt;

    private Integer deleted;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
