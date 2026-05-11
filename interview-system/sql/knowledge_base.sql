-- ============================================================
-- 7. 知识库表
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_base (
    id              BIGINT          PRIMARY KEY AUTO_INCREMENT,
    file_name       VARCHAR(200)    NOT NULL COMMENT '原始文件名',
    title           VARCHAR(200)    NOT NULL COMMENT '题目标题',
    content         TEXT            NOT NULL COMMENT '题目内容/答案',
    category        VARCHAR(100)    DEFAULT NULL COMMENT '分类',
    difficulty      VARCHAR(20)     DEFAULT NULL COMMENT '难度 easy/medium/hard',
    question_type   VARCHAR(50)     DEFAULT NULL COMMENT '题目类型 technical/behavioral/scenario',
    source_file     VARCHAR(200)    NOT NULL COMMENT '来源文件名',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_difficulty (difficulty),
    INDEX idx_source (source_file)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 知识库文件记录表
CREATE TABLE IF NOT EXISTS knowledge_files (
    id              BIGINT          PRIMARY KEY AUTO_INCREMENT,
    file_name       VARCHAR(200)    NOT NULL COMMENT '文件名',
    file_size       BIGINT          NOT NULL COMMENT '文件大小（字节）',
    question_count  INT             NOT NULL DEFAULT 0 COMMENT '解析出的题目数量',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_filename (file_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 知识库原始文件内容表（存储完整MD内容供AI读取）
CREATE TABLE IF NOT EXISTS knowledge_file_content (
    id              BIGINT          PRIMARY KEY AUTO_INCREMENT,
    file_name       VARCHAR(200)    NOT NULL UNIQUE COMMENT '文件名',
    file_content    LONGTEXT        NOT NULL COMMENT 'MD文件完整内容',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_filename (file_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
