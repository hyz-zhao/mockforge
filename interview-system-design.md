# 🎯 在校大学生 AI 面试模拟系统 — 完整技术方案

> **定位**：帮助在校大学生通过 AI 驱动的模拟面试，快速定位能力薄弱点，追踪成长曲线。

---

## 一、系统全景架构

### 层级总览

| 层级 | 技术栈 | 核心职责 |
|------|--------|---------|
| **前端层** | React | 简历上传、岗位选择、WebSocket流式对话、雷达图报告、进步曲线 |
| **后端层** | Spring Boot | 业务逻辑编排、WebSocket服务、AI调用代理、报告生成 |
| **存储层** | MySQL + Redis | MySQL 持久化 + Redis 热缓存（题库、会话状态） |
| **AI层** | DeepSeek / 通义 / GPT-4o / Whisper | 题目生成、实时评分、简历解析、语音转文字 |

### 通信方式

| 路径 | 协议 | 说明 |
|------|------|------|
| 前端 → 后端 | HTTP REST | 注册登录、简历上传、报告查询等常规接口 |
| 前端 ↔ 后端 | WebSocket | 面试室内实时流式对话（打字机效果） |
| 后端 → AI | HTTP SSE | 调用大模型流式API，逐chunk推送给前端 |

### 后端核心服务

| 服务 | 功能 | 依赖 |
|------|------|------|
| **简历解析服务** | PDF/DOCX 解析 → 结构化提取 | Apache PDFBox + Apache POI |
| **题目生成服务** | 根据岗位/简历生成面试题 | AI API + Redis 缓存 |
| **面试对话服务** | WebSocket 流式推送 + AI 实时评分 | WebSocket + AI API |
| **报告生成服务** | 雷达图数据 + 薄弱点分析 + 学习建议 | 汇总面试记录，AI 综合分析 |
| **语音转文字服务** | 音频上传 → 文字返回 | Whisper API / 阿里 NLS |
| **历史记录服务** | 面试记录查询 + 进步曲线计算 | MySQL 聚合查询 |

---

## 二、核心功能模块

### 2.1 入口：简历上传 vs 直接选岗位

| 路径 | 流程 | 说明 |
|------|------|------|
| 上传简历 | PDF/DOCX → 解析文本 → AI分析 → 生成定制题目 | 根据项目经历、技能栈出题 |
| 直接选岗位 | 选择岗位 + 技术方向 → 走缓存题库 → 随机组卷 | 成本低，响应快 |

**简历解析技术方案：**
- `Apache PDFBox` 解析 PDF
- `Apache POI` 解析 DOCX
- 提取结构化信息（姓名/技能/项目/教育背景）后送 AI 分析

---

### 2.2 题目生成（Prompt 工程核心）

#### 生成策略

```
题目 = 岗位基础题（40%）+ 简历定制题（40%）+ 行为面试题（20%）
```

#### 题目结构（JSON 输出格式）

```json
{
  "questions": [
    {
      "id": 1,
      "type": "technical",        // technical / behavioral / scenario
      "difficulty": "medium",     // easy / medium / hard
      "category": "Java基础",
      "question": "请解释 Java 中 HashMap 和 ConcurrentHashMap 的区别？",
      "scoring_dimensions": ["知识准确性", "深度分析", "实际应用"],
      "reference_answer": "...",  // 仅后端保存，不暴露给用户
      "follow_up_hints": ["线程安全是怎么实现的？", "性能差异在哪？"]
    }
  ],
  "total": 8,
  "estimated_duration": 30
}
```

#### Prompt 模板（题目生成）

```
你是一位资深技术面试官，需要为【{岗位名称}】岗位设计一套面试题。

候选人背景：
{简历摘要 / 岗位方向说明}

要求：
1. 生成 {N} 道面试题，涵盖：技术题 {x} 道、项目经历题 {y} 道、行为面试题 {z} 道
2. 难度梯度：简单 2 道 → 中等 4 道 → 困难 2 道
3. 每题必须包含：题目、考查维度、参考答案要点
4. 严格按照以下 JSON Schema 输出，不要有多余文字：
{JSON Schema}
```

---

### 2.3 WebSocket 流式面试对话

#### 连接生命周期

```
用户进入面试室
    ↓
WS 握手：/ws/interview/{sessionId}
    ↓
后端推送第1题（流式输出，打字机效果）
    ↓
用户输入回答（文字 or 语音→转文字）
    ↓
AI 实时评分 + 追问（流式推送）
    ↓
循环 N 轮
    ↓
面试结束 → 触发报告生成
```

#### 消息协议设计

```json
// 客户端 → 服务端
{
  "type": "answer",
  "sessionId": "uuid",
  "questionId": 1,
  "content": "用户的回答内容",
  "inputType": "text"  // text / voice
}

// 服务端 → 客户端（流式分片）
{
  "type": "stream_chunk",   // stream_chunk / stream_end / question / evaluation
  "content": "这个回答...", // 每次推送一小段
  "chunkIndex": 3,
  "isEnd": false
}

// 服务端 → 客户端（评分结果）
{
  "type": "evaluation",
  "questionId": 1,
  "scores": {
    "accuracy": 7,        // 知识准确性 0-10
    "depth": 6,           // 深度分析
    "expression": 8       // 表达清晰度
  },
  "feedback": "你对原理的掌握不错，但缺少对性能差异的量化说明...",
  "followUp": "那你能说说 JDK8 对 HashMap 做了哪些优化吗？"
}
```

#### Spring Boot WebSocket 核心代码结构

```java
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(interviewHandler(), "/ws/interview/{sessionId}")
                .setAllowedOrigins("*")
                .withSockJS();  // 兼容不支持 WS 的环境
    }
}

@Component
public class InterviewWebSocketHandler extends TextWebSocketHandler {

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        // 1. 解析用户答案
        // 2. 构建评分 Prompt
        // 3. 调用大模型（流式）
        // 4. 逐 chunk 推送给前端
    }

    private void streamToClient(WebSocketSession session, String text) throws Exception {
        // 模拟打字机：每 50ms 推一个 chunk
        for (String chunk : splitToChunks(text, 10)) {
            session.sendMessage(new TextMessage(buildChunkJson(chunk)));
            Thread.sleep(50);
        }
    }
}
```

---

### 2.4 AI 评分 Prompt（多轮评估）

```
# 角色
你是一位经验丰富的技术面试官，请对候选人的回答进行专业评分。

# 上下文
- 岗位：{岗位名称}
- 面试轮次：第 {n} 轮（共 {total} 轮）
- 本题考查方向：{scoring_dimensions}

# 当前问题
{question_content}

# 候选人回答
{user_answer}

# 参考答案要点（仅供你参考，不要透露给候选人）
{reference_answer}

# 评分要求
请严格按照以下 JSON 格式输出，不要有其他内容：
{
  "scores": {
    "accuracy": <0-10>,      // 知识准确性
    "depth": <0-10>,         // 深度与广度
    "expression": <0-10>,    // 表达清晰度
    "practical": <0-10>      // 实际应用意识
  },
  "overallScore": <0-100>,
  "strengths": ["优点1", "优点2"],
  "weaknesses": ["不足1", "不足2"],
  "feedback": "给候选人看的详细反馈（200字以内，鼓励式语气）",
  "followUp": "追问问题（如果不需要追问填 null）"
}
```

---

### 2.5 Redis 缓存热门题库

#### 缓存策略

```
Key 设计：interview:questions:{岗位slug}:{难度}
Value：JSON 序列化的题目列表
TTL：24小时（凌晨定时刷新）

热门岗位预热（应用启动时）：
- Java后端工程师
- 前端工程师
- 数据分析师
- 产品经理
- 算法工程师
```

#### 命中策略

```java
public List<Question> getQuestions(String position, String difficulty) {
    String cacheKey = "interview:questions:" + position + ":" + difficulty;
    
    // 1. 先查 Redis
    String cached = redisTemplate.opsForValue().get(cacheKey);
    if (cached != null) {
        return JSON.parseArray(cached, Question.class);
    }
    
    // 2. 查 MySQL 题库
    List<Question> questions = questionRepository.findByPositionAndDifficulty(position, difficulty);
    if (!questions.isEmpty()) {
        redisTemplate.opsForValue().set(cacheKey, JSON.toJSONString(questions), 24, TimeUnit.HOURS);
        return questions;
    }
    
    // 3. 调用 AI 生成并存入题库
    List<Question> aiGenerated = aiService.generateQuestions(position, difficulty);
    questionRepository.saveAll(aiGenerated);
    redisTemplate.opsForValue().set(cacheKey, JSON.toJSONString(aiGenerated), 24, TimeUnit.HOURS);
    return aiGenerated;
}
```

---

### 2.6 语音输入

```
前端录音（MediaRecorder API）
    ↓
发送音频 Blob 到后端 /api/speech/transcribe
    ↓
后端调用 Whisper API（OpenAI）或 阿里语音识别
    ↓
返回文字，填入输入框，用户可修改后提交
```

---

### 2.7 面试报告生成

#### 能力雷达图数据结构

```json
{
  "radarData": {
    "dimensions": ["技术知识", "逻辑思维", "表达能力", "项目经验", "学习潜力"],
    "scores": [72, 85, 68, 60, 90],
    "industryAverage": [75, 78, 72, 65, 80]
  },
  "overallScore": 75,
  "rank": "中等偏上（超过同岗位 62% 的候选人）",
  "weakPoints": [
    {
      "dimension": "项目经验",
      "score": 60,
      "analysis": "在项目经历题中，对技术选型的理由阐述不够充分，建议补充 STAR 法则训练",
      "resources": ["《程序员的项目管理》", "LeetCode 系统设计专题"]
    }
  ],
  "strongPoints": ["学习潜力突出", "逻辑推理清晰"],
  "nextStepAdvice": "重点练习：项目经历表达（STAR法则）+ JVM 调优专题"
}
```

#### 进步曲线（历史追踪）

```sql
-- 每次面试后记录各维度分数
SELECT 
    DATE(created_at) as date,
    AVG(technical_score) as technical,
    AVG(logic_score) as logic,
    AVG(expression_score) as expression
FROM interview_sessions
WHERE user_id = ?
GROUP BY DATE(created_at)
ORDER BY date ASC
```

---

## 三、数据库设计

### 核心表结构

```sql
-- 用户表
CREATE TABLE users (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    username    VARCHAR(50) NOT NULL UNIQUE,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 简历表
CREATE TABLE resumes (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id     BIGINT NOT NULL,
    file_name   VARCHAR(200),
    file_path   VARCHAR(500),
    parsed_text LONGTEXT,           -- 解析后的文本
    ai_summary  TEXT,               -- AI 提炼的关键信息
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 岗位题库表
CREATE TABLE questions (
    id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
    position            VARCHAR(100) NOT NULL,     -- 岗位
    category            VARCHAR(50) NOT NULL,      -- 分类（Java基础/算法/系统设计等）
    difficulty          ENUM('easy','medium','hard') NOT NULL,
    type                ENUM('technical','behavioral','scenario') NOT NULL,
    question_text       TEXT NOT NULL,
    reference_answer    TEXT,
    scoring_dimensions  JSON,
    use_count           INT DEFAULT 0,             -- 被使用次数，用于热度排序
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 面试会话表
CREATE TABLE interview_sessions (
    id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id             BIGINT NOT NULL,
    resume_id           BIGINT,                   -- 可为空（直接选岗位时）
    position            VARCHAR(100) NOT NULL,
    status              ENUM('ongoing','completed','abandoned') DEFAULT 'ongoing',
    total_questions     INT DEFAULT 0,
    completed_questions INT DEFAULT 0,
    -- 各维度最终得分
    technical_score     DECIMAL(5,2),
    logic_score         DECIMAL(5,2),
    expression_score    DECIMAL(5,2),
    practical_score     DECIMAL(5,2),
    learning_score      DECIMAL(5,2),
    overall_score       DECIMAL(5,2),
    report_json         LONGTEXT,                 -- 完整报告 JSON
    started_at          DATETIME,
    ended_at            DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 面试问答记录表
CREATE TABLE interview_records (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id      BIGINT NOT NULL,
    question_id     BIGINT,
    question_text   TEXT NOT NULL,
    user_answer     TEXT,
    input_type      ENUM('text','voice') DEFAULT 'text',
    ai_evaluation   JSON,             -- 包含各维度分数和反馈
    follow_up       TEXT,             -- 追问内容
    answered_at     DATETIME,
    FOREIGN KEY (session_id) REFERENCES interview_sessions(id)
);
```

---

## 四、API 接口设计

### RESTful 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/register` | POST | 注册 |
| `/api/auth/login` | POST | 登录，返回 JWT |
| `/api/resume/upload` | POST | 上传简历（multipart） |
| `/api/resume/{id}/parse` | POST | 触发 AI 解析简历 |
| `/api/positions` | GET | 获取支持的岗位列表 |
| `/api/interview/start` | POST | 创建面试会话，返回 sessionId + 题目 |
| `/api/interview/{sessionId}/report` | GET | 获取面试报告 |
| `/api/interview/history` | GET | 获取历史面试列表 |
| `/api/interview/progress` | GET | 获取进步曲线数据 |
| `/api/speech/transcribe` | POST | 语音转文字 |

### WebSocket 接口

```
ws://host/ws/interview/{sessionId}
```

连接建立后，全程通过消息类型（type字段）区分交互阶段。

---

## 五、前端页面规划

```
/                   首页（产品介绍 + 快速开始）
/login              登录/注册
/dashboard          控制台（历史记录 + 进步曲线）
/interview/setup    面试准备（上传简历 or 选岗位）
/interview/room     面试室（WebSocket 流式对话）
/interview/report   面试报告（雷达图 + 薄弱点分析）
```

### 核心组件

| 组件 | 技术方案 |
|------|---------|
| 雷达图 | ECharts `radar` 类型 |
| 进步折线图 | ECharts `line` 类型 |
| 打字机效果 | WebSocket chunk 追加 + CSS 动画光标 |
| 语音录制 | `MediaRecorder` API + 波形可视化 |
| 简历上传 | `react-dropzone` + 上传进度条 |
| Markdown渲染 | `react-markdown`（AI 反馈支持格式化） |

---

## 六、大模型接入策略

### 推荐方案（成本优先）

| 场景 | 推荐模型 | 理由 |
|------|---------|------|
| 题目生成（离线批量） | DeepSeek-V3 | 成本极低，适合批量生成题库 |
| 实时面试评分 | DeepSeek-V3 / 通义 Qwen-Turbo | 低延迟，支持流式输出 |
| 简历深度分析 | GPT-4o / DeepSeek-R1 | 理解能力强，用于简历解析 |
| 语音转文字 | Whisper-1 / 阿里 NLS | 准确率高 |

### Spring AI 集成（推荐）

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-openai-spring-boot-starter</artifactId>
    <version>1.0.0</version>
</dependency>
```

```java
// 流式调用示例
@Service
public class AIService {

    @Autowired
    private StreamingChatClient streamingChatClient;

    public Flux<String> streamEvaluate(String prompt) {
        return streamingChatClient.stream(new Prompt(prompt))
            .map(response -> response.getResult().getOutput().getContent());
    }
}
```

---

## 七、项目结构（Spring Boot）

### 后端目录

**根目录**：`interview-system/`

| 目录/文件 | 说明 |
|-----------|------|
| `src/main/java/com/interview/config/` | 配置类 |
| → `WebSocketConfig.java` | WebSocket 端点注册、跨域、SockJS 兼容 |
| → `RedisConfig.java` | Redis 连接池、序列化策略 |
| → `SecurityConfig.java` | JWT 过滤器、接口权限控制 |
| `src/main/java/com/interview/controller/` | REST 接口层 |
| → `AuthController.java` | 注册、登录（返回 JWT） |
| → `ResumeController.java` | 简历上传（multipart）、触发 AI 解析 |
| → `InterviewController.java` | 开始面试、获取报告、历史记录、进步曲线 |
| → `SpeechController.java` | 语音转文字接口 |
| `src/main/java/com/interview/service/` | 业务逻辑层 |
| → `ResumeParseService.java` | PDF/DOCX 解析 + AI 提炼结构化信息 |
| → `QuestionGenerateService.java` | 缓存优先的题目获取 + AI 生成 fallback |
| → `AIEvaluateService.java` | 多维度评分 Prompt 调用 + 结构化解析 |
| → `ReportGenerateService.java` | 汇总面试记录，生成雷达图数据 + 薄弱报告 |
| → `CacheService.java` | Redis 缓存封装（题库、会话状态） |
| `src/main/java/com/interview/websocket/` | |
| → `InterviewWebSocketHandler.java` | 核心类：处理 WS 消息、流式推送、评分协调 |
| `src/main/java/com/interview/entity/` | JPA 实体类 |
| → `User.java` / `Resume.java` / `Question.java` / `InterviewSession.java` / `InterviewRecord.java` |
| `src/main/java/com/interview/repository/` | MyBatis/JPA Mapper 接口 |
| `src/main/java/com/interview/dto/` | 数据传输对象 |
| → `request/` | 入参 DTO（StartInterviewReq、UploadResumeReq 等） |
| → `response/` | 出参 DTO（InterviewReportResp、ProgressResp 等） |

### 资源目录

**根目录**：`src/main/resources/`

| 文件 | 说明 |
|------|------|
| `application.yml` | 主配置（数据库连接、Redis、JWT密钥、AI API Key） |
| `application-dev.yml` | 开发环境配置（本地数据库、调试模式） |
| `application-prod.yml` | 生产环境配置 |
| `prompts/generate-questions.txt` | 题目生成 Prompt 模板（含占位符） |
| `prompts/evaluate-answer.txt` | 回答评分 Prompt 模板 |
| `prompts/analyze-resume.txt` | 简历分析 Prompt 模板 |
| `prompts/generate-report.txt` | 综合报告生成 Prompt 模板 |

### 前端目录

**根目录**：`interview-frontend/`

| 目录/文件 | 说明 |
|-----------|------|
| `src/pages/` | 页面组件 |
| → `Home.jsx` | 首页（产品介绍 + 快速开始按钮） |
| → `Login.jsx` | 登录/注册 |
| → `Dashboard.jsx` | 控制台（历史记录列表 + 进步曲线图） |
| → `InterviewSetup.jsx` | 面试准备（上传简历 or 选岗位） |
| → `InterviewRoom.jsx` | 面试室（核心页面，WebSocket 流式对话） |
| → `InterviewReport.jsx` | 面试报告（雷达图 + 薄弱点 + 建议） |
| `src/components/` | 复用组件 |
| → `RadarChart.jsx` | ECharts 雷达图 |
| → `ProgressChart.jsx` | ECharts 进步折线图 |
| → `TypewriterText.jsx` | 打字机效果（CSS 闪烁光标） |
| → `VoiceRecorder.jsx` | 语音录制 + 波形可视化 |
| → `ResumeUploader.jsx` | 简历拖拽上传 + 进度条 |
| `src/hooks/` | 自定义 Hooks |
| → `useWebSocket.js` | WebSocket 连接管理 + 自动重连 |
| → `useInterview.js` | 面试状态管理（当前题目、评分、计时） |
| `src/services/` | API 调用层 |
| → `api.js` | Axios 实例（JWT 自动注入） |
| → `interviewApi.js` | 面试相关接口封装 |

---

## 八、开发优先级与里程碑

### Phase 1（MVP，2周）
- [ ] 用户注册/登录（JWT）
- [ ] 直接选岗位 → 题目生成（走 Redis 缓存）
- [ ] WebSocket 文字面试对话
- [ ] 基础评分反馈

### Phase 2（核心功能，2周）
- [ ] 简历上传 + AI 解析
- [ ] 定制化题目生成
- [ ] 语音输入（Whisper）
- [ ] 面试报告 + 雷达图

### Phase 3（体验优化，1周）
- [ ] 历史记录 + 进步曲线
- [ ] 热门岗位题库预热
- [ ] 追问机制（多轮对话）
- [ ] 移动端适配

---

## 九、成本优化要点

1. **题库复用**：相同岗位的基础题生成一次，存入 MySQL + Redis，不重复调 AI
2. **评分精简**：先用轻量模型快速评分，仅在最终报告用重量级模型做综合分析
3. **限流保护**：每用户每天最多 3 次完整面试（防止恶意刷 API）
4. **异步生成**：简历分析异步处理，不阻塞用户操作

---

*文档版本 v1.0 | 生成时间：2026-05-09*
