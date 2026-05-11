package com.interview.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("knowledge_base")
public class KnowledgeItem {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String fileName;

    private String title;

    private String content;

    private String category;

    private String difficulty;

    private String questionType;

    private String sourceFile;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
