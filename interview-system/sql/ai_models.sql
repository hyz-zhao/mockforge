-- ============================================================
-- 6. AI模型配置表
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_models (
    id              BIGINT          PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(50)     NOT NULL COMMENT '模型名称，如 DeepSeek Chat',
    provider        VARCHAR(50)     NOT NULL COMMENT '供应商，如 deepseek / openai / glm',
    model_id        VARCHAR(100)    NOT NULL COMMENT '模型ID，如 deepseek-chat',
    api_key         VARCHAR(500)    NOT NULL COMMENT 'API Key',
    base_url        VARCHAR(500)    NOT NULL COMMENT 'API基础地址',
    is_active       TINYINT         NOT NULL DEFAULT 0 COMMENT '是否启用，0=否 1=是',
    temperature     DECIMAL(3,1)    NOT NULL DEFAULT 0.7 COMMENT '温度参数',
    max_tokens      INT             NOT NULL DEFAULT 4096 COMMENT '最大输出token数',
    sort_order      INT             NOT NULL DEFAULT 0 COMMENT '排序',
    remark          VARCHAR(500)    DEFAULT NULL COMMENT '备注',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_provider (provider),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 预置常用模型配置（API Key需要用户自行替换）
INSERT INTO ai_models (name, provider, model_id, api_key, base_url, is_active, temperature, max_tokens, sort_order, remark) VALUES
('DeepSeek Chat', 'deepseek', 'deepseek-chat', 'sk-xxx', 'https://api.deepseek.com', 1, 0.7, 4096, 1, '默认模型，性价比高'),
('DeepSeek Reasoner', 'deepseek', 'deepseek-reasoner', 'sk-xxx', 'https://api.deepseek.com', 0, 0.7, 4096, 2, '推理模型，适合复杂分析'),
('OpenAI GPT-4o', 'openai', 'gpt-4o', 'sk-xxx', 'https://api.openai.com', 0, 0.7, 4096, 3, 'OpenAI旗舰模型'),
('OpenAI GPT-3.5', 'openai', 'gpt-3.5-turbo', 'sk-xxx', 'https://api.openai.com', 0, 0.7, 4096, 4, 'OpenAI经济模型'),
('智谱 GLM-4', 'glm', 'glm-4', 'xxx', 'https://open.bigmodel.cn', 0, 0.7, 4096, 5, '智谱AI旗舰模型'),
('智谱 GLM-4-Plus', 'glm', 'glm-4-plus', 'xxx', 'https://open.bigmodel.cn', 0, 0.7, 4096, 6, '智谱AI增强模型'),
('智谱 GLM-4-Flash', 'glm', 'glm-4-flash', 'xxx', 'https://open.bigmodel.cn', 0, 0.7, 4096, 7, '智谱AI快速模型'),
('通义千问 Qwen-Max', 'qwen', 'qwen-max', 'sk-xxx', 'https://dashscope.aliyuncs.com', 0, 0.7, 4096, 8, '阿里云旗舰模型'),
('通义千问 Qwen-Plus', 'qwen', 'qwen-plus', 'sk-xxx', 'https://dashscope.aliyuncs.com', 0, 0.7, 4096, 9, '阿里云均衡模型'),
('文心一言 ERNIE-4.0', 'baidu', 'ernie-4.0-8k', 'xxx', 'https://aip.baidubce.com', 0, 0.7, 4096, 10, '百度旗舰模型'),
('Kimi Moonshot', 'moonshot', 'moonshot-v1-8k', 'sk-xxx', 'https://api.moonshot.cn', 0, 0.7, 4096, 11, '月之暗面长文本模型'),
('MiniMax', 'minimax', 'abab6.5-chat', 'xxx', 'https://api.minimax.chat', 0, 0.7, 4096, 12, 'MiniMax对话模型');
