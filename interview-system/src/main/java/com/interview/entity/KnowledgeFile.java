package com.interview.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("knowledge_files")
public class KnowledgeFile {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String fileName;

    private Long fileSize;

    private Integer questionCount;

    private LocalDateTime createdAt;
}
