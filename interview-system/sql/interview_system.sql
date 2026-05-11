CREATE DATABASE IF NOT EXISTS interview_system
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE interview_system;

-- ============================================================
-- 1. 用户表
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          BIGINT          PRIMARY KEY AUTO_INCREMENT,
    username    VARCHAR(50)     NOT NULL,
    password    VARCHAR(255)    NOT NULL,
    email       VARCHAR(100)    NOT NULL,
    avatar      VARCHAR(500)    DEFAULT NULL,
    role        TINYINT         NOT NULL DEFAULT 0 COMMENT '0=普通用户, 1=管理员',
    deleted     TINYINT         NOT NULL DEFAULT 0 COMMENT '0=正常, 1=已删除',
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_username (username),
    UNIQUE KEY uk_email (email),
    INDEX idx_deleted (deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. 简历表
-- ============================================================
CREATE TABLE IF NOT EXISTS resumes (
    id          BIGINT          PRIMARY KEY AUTO_INCREMENT,
    user_id     BIGINT          NOT NULL,
    file_name   VARCHAR(200)    NOT NULL,
    file_path   VARCHAR(500)    NOT NULL,
    file_size   BIGINT          DEFAULT NULL COMMENT '文件大小（字节）',
    file_type   VARCHAR(20)     DEFAULT NULL COMMENT 'pdf / docx',
    parsed_text LONGTEXT        DEFAULT NULL COMMENT '解析后的纯文本',
    ai_summary  TEXT            DEFAULT NULL COMMENT 'AI提炼的JSON结构化信息',
    deleted     TINYINT         NOT NULL DEFAULT 0,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_deleted (deleted),
    CONSTRAINT fk_resumes_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. 题库表
-- ============================================================
CREATE TABLE IF NOT EXISTS questions (
    id                  BIGINT          PRIMARY KEY AUTO_INCREMENT,
    position            VARCHAR(100)    NOT NULL COMMENT '岗位名称',
    category            VARCHAR(50)     NOT NULL COMMENT '分类，如Java基础/算法',
    difficulty          VARCHAR(10)     NOT NULL COMMENT 'easy / medium / hard',
    type                VARCHAR(20)     NOT NULL COMMENT 'technical / behavioral / scenario',
    question_text       TEXT            NOT NULL,
    reference_answer    TEXT            DEFAULT NULL,
    scoring_dimensions  JSON            DEFAULT NULL COMMENT '评分维度JSON数组',
    use_count           INT             NOT NULL DEFAULT 0,
    deleted             TINYINT         NOT NULL DEFAULT 0,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_position (position),
    INDEX idx_position_difficulty (position, difficulty),
    INDEX idx_deleted (deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. 面试会话表
-- ============================================================
CREATE TABLE IF NOT EXISTS interview_sessions (
    id                  BIGINT          PRIMARY KEY AUTO_INCREMENT,
    user_id             BIGINT          NOT NULL,
    resume_id           BIGINT          DEFAULT NULL,
    position            VARCHAR(100)    NOT NULL,
    interview_mode      VARCHAR(20)     NOT NULL DEFAULT 'qa' COMMENT 'qa=问答, voice=语音, video=视频',
    status              VARCHAR(20)     NOT NULL DEFAULT 'ongoing' COMMENT 'ongoing / completed / abandoned',
    total_questions     INT             NOT NULL DEFAULT 0,
    completed_questions INT             NOT NULL DEFAULT 0,
    technical_score     DECIMAL(5,2)    DEFAULT NULL,
    logic_score         DECIMAL(5,2)    DEFAULT NULL,
    expression_score    DECIMAL(5,2)    DEFAULT NULL,
    practical_score     DECIMAL(5,2)    DEFAULT NULL,
    learning_score      DECIMAL(5,2)    DEFAULT NULL,
    overall_score       DECIMAL(5,2)    DEFAULT NULL,
    report_json         LONGTEXT        DEFAULT NULL,
    started_at          DATETIME        DEFAULT NULL,
    ended_at            DATETIME        DEFAULT NULL,
    deleted             TINYINT         NOT NULL DEFAULT 0,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_user_date (user_id, started_at),
    INDEX idx_status (status),
    INDEX idx_deleted (deleted),
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_sessions_resume FOREIGN KEY (resume_id) REFERENCES resumes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. 面试问答记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS interview_records (
    id              BIGINT          PRIMARY KEY AUTO_INCREMENT,
    session_id      BIGINT          NOT NULL,
    question_id     BIGINT          DEFAULT NULL,
    question_order  INT             NOT NULL DEFAULT 0 COMMENT '第几题，从1开始',
    question_text   TEXT            NOT NULL,
    user_answer     TEXT            DEFAULT NULL,
    input_type      VARCHAR(10)     NOT NULL DEFAULT 'text' COMMENT 'text / voice',
    ai_evaluation   JSON            DEFAULT NULL,
    question_score  DECIMAL(5,2)    DEFAULT NULL,
    follow_up       TEXT            DEFAULT NULL,
    answered_at     DATETIME        DEFAULT NULL,
    deleted         TINYINT         NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session_id (session_id),
    INDEX idx_deleted (deleted),
    CONSTRAINT fk_records_session FOREIGN KEY (session_id) REFERENCES interview_sessions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
