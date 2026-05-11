package com.interview.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("knowledge_file_content")
public class KnowledgeFileContent {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String fileName;

    private String fileContent;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
