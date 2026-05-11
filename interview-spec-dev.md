# 面试模拟系统 — AI 可直接执行的开发规格书

> 本文档面向 AI 编码助手，包含所有字段定义、方法签名、配置文件和接口示例。
> 与「技术方案文档」配合使用：技术方案讲「为什么这样做」，本文档讲「精确做什么」。

---

## 一、后端项目初始化

### 1.1 技术选型版本

| 依赖 | 版本 | 说明 |
|------|------|------|
| Java | 17 | LTS |
| Spring Boot | 3.2.x | |
| MySQL | 8.0 | |
| Redis | 7.x | |
| MyBatis-Plus | 3.5.5 | ORM，不用 JPA |
| Spring AI | 1.0.0 | AI 调用 |
| JWT (jjwt) | 0.12.5 | 认证 |
| Knife4j | 4.4.0 | API 文档 |
| Lombok | 最新 | 省略 getter/setter |

### 1.2 pom.xml 核心依赖

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.5</version>
</parent>

<dependencies>
    <!-- Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-websocket</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>

    <!-- 数据库 -->
    <dependency>
        <groupId>com.mysql</groupId>
        <artifactId>mysql-connector-j</artifactId>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>com.baomidou</groupId>
        <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
        <version>3.5.5</version>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>

    <!-- JWT -->
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.12.5</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.12.5</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-jackson</artifactId>
        <version>0.12.5</version>
        <scope>runtime</scope>
    </dependency>

    <!-- AI -->
    <dependency>
        <groupId>org.springframework.ai</groupId>
        <artifactId>spring-ai-openai-spring-boot-starter</artifactId>
        <version>1.0.0</version>
    </dependency>

    <!-- 工具 -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
    <dependency>
        <groupId>cn.dev33</groupId>
        <artifactId>satoken-jwt</artifactId>
        <version>1.37.0</version>
    </dependency>

    <!-- 文件解析 -->
    <dependency>
        <groupId>org.apache.pdfbox</groupId>
        <artifactId>pdfbox</artifactId>
        <version>3.0.1</version>
    </dependency>
    <dependency>
        <groupId>org.apache.poi</groupId>
        <artifactId>poi-ooxml</artifactId>
        <version>5.2.5</version>
    </dependency>

    <!-- 文档 -->
    <dependency>
        <groupId>com.github.xiaoymin</groupId>
        <artifactId>knife4j-openapi3-jakarta-spring-boot-starter</artifactId>
        <version>4.4.0</version>
    </dependency>
</dependencies>
```

### 1.3 application.yml 完整配置

```yaml
server:
  port: 8080

spring:
  application:
    name: interview-system

  # MySQL
  datasource:
    url: jdbc:mysql://localhost:3306/interview_system?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true
    username: root
    password: ${DB_PASSWORD:123456}
    driver-class-name: com.mysql.cj.jdbc.Driver
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000

  # Redis
  data:
    redis:
      host: localhost
      port: 6379
      password: ${REDIS_PASSWORD:}
      database: 0
      timeout: 5000ms
      lettuce:
        pool:
          max-active: 20
          max-idle: 10

  # 文件上传
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 10MB

  # AI（Spring AI 配置）
  ai:
    openai:
      api-key: ${OPENAI_API_KEY:sk-xxx}
      base-url: ${OPENAI_BASE_URL:https://api.deepseek.com}
      chat:
        options:
          model: deepseek-chat
          temperature: 0.7

# MyBatis-Plus
mybatis-plus:
  mapper-locations: classpath:/mapper/*.xml
  type-aliases-package: com.interview.entity
  global-config:
    db-config:
      id-type: auto
      logic-delete-field: deleted
      logic-delete-value: 1
      logic-not-delete-value: 0
  configuration:
    map-underscore-to-camel-case: true

# JWT
jwt:
  secret: ${JWT_SECRET:mySecretKeyForInterviewSystem2024MustBeAtLeast256BitsLong}
  expiration: 86400000  # 24小时，单位毫秒

# 文件存储
file:
  upload-dir: ${FILE_UPLOAD_DIR:./uploads/resume}
  max-size: 10485760  # 10MB

# 面试限制
interview:
  max-per-day: 3  # 每用户每天最多面试次数
  default-question-count: 8
```

---

## 二、实体类定义（Entity）

所有实体类放在 `com.interview.entity` 包下，使用 MyBatis-Plus 注解。

### 2.1 User.java

```java
@Data
@TableName("users")
public class User {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String username;       // 唯一，2-20字符
    private String password;       // BCrypt加密
    private String email;          // 唯一
    private String avatar;         // 头像URL，可为null
    private Integer role;          // 0=普通用户, 1=管理员
    private Integer deleted;       // 逻辑删除 0=正常 1=删除
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### 2.2 Resume.java

```java
@Data
@TableName("resumes")
public class Resume {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String fileName;       // 原始文件名
    private String filePath;       // 服务器存储路径
    private Long fileSize;         // 文件大小（字节）
    private String fileType;       // pdf / docx
    private String parsedText;     // 解析后的纯文本
    private String aiSummary;      // AI提炼的JSON结构化信息
    private Integer deleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### 2.3 Question.java

```java
@Data
@TableName("questions")
public class Question {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String position;       // 岗位名称，如"Java后端工程师"
    private String category;       // 分类，如"Java基础"/"算法"/"系统设计"
    private String difficulty;     // easy / medium / hard
    private String type;           // technical / behavioral / scenario
    private String questionText;   // 题目内容
    private String referenceAnswer;// 参考答案
    private String scoringDimensions; // JSON数组，如["准确性","深度","表达"]
    private Integer useCount;      // 被使用次数
    private Integer deleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### 2.4 InterviewSession.java

```java
@Data
@TableName("interview_sessions")
public class InterviewSession {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private Long resumeId;         // 可为null
    private String position;       // 面试岗位
    private String status;         // ongoing / completed / abandoned
    private Integer totalQuestions;
    private Integer completedQuestions;
    private Double technicalScore; // 技术知识得分
    private Double logicScore;     // 逻辑思维得分
    private Double expressionScore;// 表达能力得分
    private Double practicalScore; // 实践能力得分
    private Double learningScore;  // 学习潜力得分
    private Double overallScore;   // 综合得分
    private String reportJson;     // 完整报告JSON
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private Integer deleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### 2.5 InterviewRecord.java

```java
@Data
@TableName("interview_records")
public class InterviewRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long sessionId;
    private Long questionId;
    private Integer questionOrder;     // 第几题（从1开始）
    private String questionText;       // 冗余存储，防止题目被删
    private String userAnswer;         // 用户回答
    private String inputType;          // text / voice
    private String aiEvaluation;       // JSON：{scores, feedback, followUp}
    private Double questionScore;      // 本题得分 0-100
    private String followUp;           // AI追问内容
    private LocalDateTime answeredAt;
    private Integer deleted;
    private LocalDateTime createdAt;
}
```

---

## 三、DTO 定义

### 3.1 通用响应包装

```java
@Data
public class Result<T> {
    private Integer code;      // 200=成功, 400=参数错误, 401=未登录, 500=服务器错误
    private String message;
    private T data;

    public static <T> Result<T> ok(T data) { ... }
    public static <T> Result<T> ok() { ... }
    public static Result<Void> fail(String message) { ... }
}
```

### 3.2 请求 DTO（request 包）

```java
// ---- 认证 ----
@Data
public class RegisterReq {
    @NotBlank(message = "用户名不能为空")
    @Size(min = 2, max = 20)
    private String username;

    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 20)
    private String password;

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;
}

@Data
public class LoginReq {
    @NotBlank
    private String username;
    @NotBlank
    private String password;
}

// ---- 面试 ----
@Data
public class StartInterviewReq {
    @NotBlank(message = "请选择岗位")
    private String position;          // 岗位名称

    private Long resumeId;            // 简历ID，可选

    private Integer questionCount;    // 题目数量，默认8

    private String difficulty;        // 难度偏好：easy/medium/hard/mixed，默认mixed
}

// ---- 语音 ----
// 无DTO，直接接收 MultipartFile
```

### 3.3 响应 DTO（response 包）

```java
// ---- 认证 ----
@Data
public class LoginResp {
    private String token;            // JWT Token
    private Long userId;
    private String username;
    private String avatar;
}

// ---- 面试 ----
@Data
public class StartInterviewResp {
    private Long sessionId;
    private String position;
    private Integer totalQuestions;
    private List<QuestionDTO> questions;  // 本次面试题目列表
}

@Data
public class QuestionDTO {
    private Long id;
    private Integer order;           // 第几题
    private String type;             // technical / behavioral / scenario
    private String category;         // 分类
    private String difficulty;       // easy / medium / hard
    private String questionText;     // 题目内容
    // 注意：不返回 referenceAnswer 和 scoringDimensions
}

// ---- 报告 ----
@Data
public class InterviewReportResp {
    private Long sessionId;
    private String position;
    private LocalDateTime startedAt;
    private Integer totalQuestions;
    private RadarData radarData;
    private Double overallScore;
    private String rank;
    private List<WeakPoint> weakPoints;
    private List<String> strongPoints;
    private String nextStepAdvice;
    private List<QuestionResult> questionResults;
}

@Data
public class RadarData {
    private List<String> dimensions;     // ["技术知识","逻辑思维","表达能力","项目经验","学习潜力"]
    private List<Double> scores;         // 用户得分
    private List<Double> industryAverage;// 行业平均分
}

@Data
public class WeakPoint {
    private String dimension;
    private Double score;
    private String analysis;
    private List<String> resources;
}

@Data
public class QuestionResult {
    private Integer order;
    private String questionText;
    private String userAnswer;
    private Double score;
    private String feedback;
}

// ---- 历史 ----
@Data
public class InterviewHistoryResp {
    private Long sessionId;
    private String position;
    private Double overallScore;
    private String status;
    private LocalDateTime startedAt;
    private Integer completedQuestions;
    private Integer totalQuestions;
}

@Data
public class ProgressResp {
    private List<String> dates;          // ["2026-05-01", "2026-05-05", ...]
    private List<Double> technicalScores;
    private List<Double> logicScores;
    private List<Double> expressionScores;
    private List<Double> overallScores;
}

// ---- 简历 ----
@Data
public class ResumeUploadResp {
    private Long resumeId;
    private String fileName;
    private String status;          // uploaded / parsed / failed
}

@Data
public class ResumeParseResp {
    private Long resumeId;
    private String parsedText;      // 原始解析文本
    private ResumeSummary summary;  // AI提炼的结构化信息
}

@Data
public class ResumeSummary {
    private String name;
    private String education;       // "XX大学 计算机科学与技术 本科 2023-2027"
    private List<String> skills;    // ["Java", "Spring Boot", "MySQL", ...]
    private List<ProjectExp> projects;
    private List<String> highlights;// AI提炼的亮点/风险点
}

@Data
public class ProjectExp {
    private String name;
    private String role;
    private String description;
    private List<String> techStack;
}

// ---- 岗位 ----
@Data
public class PositionResp {
    private String name;            // "Java后端工程师"
    private String description;
    private List<String> hotCategories;  // ["Java基础", "Spring框架", "数据库", ...]
    private Integer questionCount;  // 该岗位已有题库数量
}
```

---

## 四、Repository（Mapper）接口

```java
// 所有Mapper放在 com.interview.repository 包下

@Mapper
public interface UserMapper extends BaseMapper<User> {
    User selectByUsername(String username);
    User selectByEmail(String email);
}

@Mapper
public interface ResumeMapper extends BaseMapper<Resume> {
    List<Resume> selectByUserId(Long userId);
}

@Mapper
public interface QuestionMapper extends BaseMapper<Question> {
    // 按岗位+难度查询可用题目
    List<Question> selectByPositionAndDifficulty(
        @Param("position") String position,
        @Param("difficulty") String difficulty
    );
    // 按岗位查询所有题目
    List<Question> selectByPosition(@Param("position") String position);
    // 随机抽取N道题
    List<Question> selectRandomQuestions(
        @Param("position") String position,
        @Param("limit") Integer limit
    );
}

@Mapper
public interface InterviewSessionMapper extends BaseMapper<InterviewSession> {
    // 查询用户面试次数（当天）
    Integer countTodayByUserId(@Param("userId") Long userId);
    // 查询用户所有面试记录（按时间倒序）
    List<InterviewSession> selectByUserId(@Param("userId") Long userId);
}

@Mapper
public interface InterviewRecordMapper extends BaseMapper<InterviewRecord> {
    List<InterviewRecord> selectBySessionId(@Param("sessionId") Long sessionId);
    // 查询用户进步曲线数据
    List<Map<String, Object>> selectProgressByUserId(@Param("userId") Long userId);
}
```

---

## 五、Service 方法签名

```java
// ---- AuthService ----
public interface AuthService {
    void register(RegisterReq req);           // 注册，密码BCrypt加密
    LoginResp login(LoginReq req);            // 登录，返回JWT
    Long getCurrentUserId(String token);      // 从JWT解析userId
}
```

```java
// ---- ResumeService ----
public interface ResumeService {
    ResumeUploadResp upload(Long userId, MultipartFile file);  // 上传并存储
    ResumeParseResp parse(Long resumeId);     // AI解析简历，返回结构化信息
    Resume getResume(Long resumeId);
}
```

```java
// ---- QuestionService ----
public interface QuestionService {
    List<QuestionDTO> getQuestionsForInterview(String position, Integer count, String difficulty);
    // 逻辑：Redis缓存优先 → MySQL题库 → AI生成并入库
    List<PositionResp> getAllPositions();
    void warmUpCache();  // 应用启动时预热热门岗位
}
```

```java
// ---- InterviewService ----
public interface InterviewService {
    StartInterviewResp startInterview(Long userId, StartInterviewReq req);
    // 校验每日次数限制 → 创建session → 生成/获取题目 → 返回

    void completeSession(Long sessionId);
    // 标记面试结束，触发报告异步生成

    InterviewReportResp getReport(Long sessionId);

    List<InterviewHistoryResp> getHistory(Long userId);

    ProgressResp getProgress(Long userId);
}
```

```java
// ---- AIEvaluateService ----
public interface AIEvaluateService {
    String streamEvaluate(String questionText, String userAnswer,
                          String referenceAnswer, String scoringDimensions);
    // 返回完整JSON字符串（含scores, feedback, followUp）
    // 实际流式推送在WebSocketHandler中处理

    InterviewReportResp generateReport(Long sessionId);
    // 汇总所有问答记录，AI生成雷达图数据+薄弱点分析+建议
}
```

```java
// ---- SpeechService ----
public interface SpeechService {
    String transcribe(MultipartFile audioFile);
    // 调用Whisper API，返回文字
}
```

---

## 六、Controller 方法签名

```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/register")
    public Result<Void> register(@Valid @RequestBody RegisterReq req);

    @PostMapping("/login")
    public Result<LoginResp> login(@Valid @RequestBody LoginReq req);
}
```

```java
@RestController
@RequestMapping("/api/resume")
public class ResumeController {

    @PostMapping("/upload")
    public Result<ResumeUploadResp> upload(
            @RequestHeader("Authorization") String token,
            @RequestParam("file") MultipartFile file);

    @PostMapping("/{resumeId}/parse")
    public Result<ResumeParseResp> parse(
            @RequestHeader("Authorization") String token,
            @PathVariable Long resumeId);
}
```

```java
@RestController
@RequestMapping("/api/interview")
public class InterviewController {

    @PostMapping("/start")
    public Result<StartInterviewResp> startInterview(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody StartInterviewReq req);

    @GetMapping("/{sessionId}/report")
    public Result<InterviewReportResp> getReport(
            @RequestHeader("Authorization") String token,
            @PathVariable Long sessionId);

    @GetMapping("/history")
    public Result<List<InterviewHistoryResp>> getHistory(
            @RequestHeader("Authorization") String token);

    @GetMapping("/progress")
    public Result<ProgressResp> getProgress(
            @RequestHeader("Authorization") String token);
}
```

```java
@RestController
@RequestMapping("/api/positions")
public class PositionController {

    @GetMapping
    public Result<List<PositionResp>> getAllPositions();
}
```

```java
@RestController
@RequestMapping("/api/speech")
public class SpeechController {

    @PostMapping("/transcribe")
    public Result<String> transcribe(
            @RequestHeader("Authorization") String token,
            @RequestParam("audio") MultipartFile audioFile);
}
```

---

## 七、WebSocket 精确设计

### 7.1 连接管理

```java
@Component
public class InterviewWebSocketHandler extends TextWebSocketHandler {

    // 线程安全的 session 管理
    private final ConcurrentHashMap<Long, WebSocketSession> sessionMap = new ConcurrentHashMap<>();
    // key = userId, value = WebSocketSession

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        // 1. 从URL路径提取sessionId: /ws/interview/{sessionId}
        // 2. 验证sessionId有效且属于当前用户（从HandshakeInterceptor获取userId）
        // 3. sessionMap.put(userId, session)
        // 4. 推送第一题（流式）
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        // 1. 解析JSON消息
        // 2. 根据type分发：
        //    "answer" → 调用AI评分 → 流式推送 evaluation
        //    "next_question" → 推送下一题
        //    "end_interview" → 结束面试 → 生成报告
        //    "heartbeat" → 回复 pong
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        // sessionMap.remove(userId)
        // 如果面试状态是ongoing，标记为abandoned
    }
}
```

### 7.2 HandshakeInterceptor（JWT校验）

```java
@Component
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, String> attributes) {
        // 1. 从query参数或header中获取token
        // 2. 验证JWT有效性
        // 3. 解析userId，放入attributes
        // 4. 返回 true/false
    }
}
```

### 7.3 流式推送实现

```java
// 在 WebSocketHandler 中
private void streamQuestion(WebSocketSession session, String questionText) {
    // 每10个字符推一个chunk，间隔50ms
    int chunkSize = 10;
    for (int i = 0; i < questionText.length(); i += chunkSize) {
        String chunk = questionText.substring(i, Math.min(i + chunkSize, questionText.length()));
        String json = """
            {"type":"stream_chunk","content":"%s","isEnd":false}
            """.formatted(escapeJson(chunk));
        session.sendMessage(new TextMessage(json));
        Thread.sleep(50);
    }
    session.sendMessage(new TextMessage("{\"type\":\"stream_end\",\"isEnd\":true}"));
}

private void streamEvaluation(WebSocketSession session, String evaluationJson) {
    // AI返回的JSON整体作为一个evaluation消息推送
    // 如果要打字机效果，需要AI流式返回时逐chunk推送
    String json = """
        {"type":"evaluation","data":%s}
        """.formatted(evaluationJson);
    session.sendMessage(new TextMessage(json));
}
```

### 7.4 WebSocket 客户端消息格式汇总

```json
// 用户提交回答
{
  "type": "answer",
  "questionId": 1,
  "content": "HashMap是非线程安全的，ConcurrentHashMap用了分段锁...",
  "inputType": "text"
}

// 请求下一题
{
  "type": "next_question"
}

// 结束面试
{
  "type": "end_interview"
}

// 心跳
{
  "type": "heartbeat"
}
```

### 7.5 WebSocket 服务端消息格式汇总

```json
// 推送新题目（流式开始前）
{
  "type": "question",
  "questionId": 1,
  "order": 1,
  "questionText": "请解释 Java 中 HashMap 和 ConcurrentHashMap 的区别？",
  "category": "Java基础",
  "difficulty": "medium",
  "totalQuestions": 8
}

// 流式推送chunk
{
  "type": "stream_chunk",
  "content": "这道题考查",
  "isEnd": false
}

// 流式结束
{
  "type": "stream_end",
  "isEnd": true
}

// 评分结果
{
  "type": "evaluation",
  "questionId": 1,
  "questionScore": 72,
  "scores": {
    "accuracy": 8,
    "depth": 6,
    "expression": 7,
    "practical": 7
  },
  "feedback": "你对 HashMap 和 ConcurrentHashMap 的基本区别理解到位...",
  "followUp": "那你能说说 JDK8 之后 ConcurrentHashMap 做了哪些优化吗？"
}

// 追问（如果AI判定需要追问）
{
  "type": "follow_up",
  "content": "那你能说说 JDK8 之后 ConcurrentHashMap 做了哪些优化吗？"
}

// 面试结束通知
{
  "type": "interview_end",
  "sessionId": 123,
  "reportUrl": "/interview/report/123"
}

// 错误
{
  "type": "error",
  "code": "EVALUATION_FAILED",
  "message": "AI评分服务暂时不可用，请稍后重试"
}
```

---

## 八、JWT 工具类

```java
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    // 生成Token
    public String generateToken(Long userId, String username) {
        return Jwts.builder()
            .subject(userId.toString())
            .claim("username", username)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expiration))
            .signWith(getSigningKey())
            .compact();
    }

    // 从Token解析userId
    public Long getUserId(String token) {
        Claims claims = Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
        return Long.parseLong(claims.getSubject());
    }

    // 验证Token有效性
    public boolean validateToken(String token) { ... }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
}
```

---

## 九、全局异常处理

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public Result<Void> handleBusinessException(BusinessException e) {
        return Result.fail(e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<Void> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
            .map(FieldError::getDefaultMessage)
            .collect(Collectors.joining("; "));
        return Result.fail(message);
    }

    @ExceptionHandler(Exception.class)
    public Result<Void> handleException(Exception e) {
        log.error("系统异常", e);
        return Result.fail("系统繁忙，请稍后重试");
    }
}

// 自定义业务异常
@Getter
public class BusinessException extends RuntimeException {
    private final Integer code;
    public BusinessException(String message) { super(message); this.code = 400; }
    public BusinessException(Integer code, String message) { super(message); this.code = code; }
}
```

---

## 十、每个接口的 Request/Response 示例

### 10.1 POST /api/auth/register

**Request Body:**
```json
{
  "username": "zhangsan",
  "password": "123456",
  "email": "zhangsan@example.com"
}
```

**Response:**
```json
{
  "code": 200,
  "message": "注册成功",
  "data": null
}
```

**错误响应:**
```json
{
  "code": 400,
  "message": "用户名已存在",
  "data": null
}
```

---

### 10.2 POST /api/auth/login

**Request Body:**
```json
{
  "username": "zhangsan",
  "password": "123456"
}
```

**Response:**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "userId": 1,
    "username": "zhangsan",
    "avatar": null
  }
}
```

---

### 10.3 POST /api/resume/upload

**Request:** `multipart/form-data`，字段名 `file`，文件类型 `application/pdf` 或 `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

**Header:** `Authorization: Bearer eyJhbGci...`

**Response:**
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "resumeId": 1,
    "fileName": "张三_简历.pdf",
    "status": "uploaded"
  }
}
```

---

### 10.4 POST /api/resume/{id}/parse

**Header:** `Authorization: Bearer eyJhbGci...`

**Response:**
```json
{
  "code": 200,
  "message": "解析成功",
  "data": {
    "resumeId": 1,
    "parsedText": "张三  XX大学 计算机科学与技术 ...",
    "summary": {
      "name": "张三",
      "education": "XX大学 计算机科学与技术 本科 2023-2027",
      "skills": ["Java", "Spring Boot", "MySQL", "Redis", "Git"],
      "projects": [
        {
          "name": "图书管理系统",
          "role": "后端开发",
          "description": "基于Spring Boot开发的图书管理系统...",
          "techStack": ["Java", "Spring Boot", "MySQL", "MyBatis"]
        }
      ],
      "highlights": [
        "有Spring Boot实战经验",
        "缺少分布式系统相关经验"
      ]
    }
  }
}
```

---

### 10.5 GET /api/positions

**Response:**
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "name": "Java后端工程师",
      "description": "Java方向后端开发岗位面试",
      "hotCategories": ["Java基础", "Spring框架", "MySQL", "Redis", "JVM"],
      "questionCount": 45
    },
    {
      "name": "前端工程师",
      "description": "前端开发岗位面试",
      "hotCategories": ["JavaScript基础", "React/Vue", "CSS", "网络协议"],
      "questionCount": 32
    }
  ]
}
```

---

### 10.6 POST /api/interview/start

**Request Body:**
```json
{
  "position": "Java后端工程师",
  "resumeId": 1,
  "questionCount": 8,
  "difficulty": "mixed"
}
```

**Response:**
```json
{
  "code": 200,
  "message": "面试已创建",
  "data": {
    "sessionId": 10,
    "position": "Java后端工程师",
    "totalQuestions": 8,
    "questions": [
      {
        "id": 101,
        "order": 1,
        "type": "technical",
        "category": "Java基础",
        "difficulty": "easy",
        "questionText": "请介绍一下 Java 的四种引用类型及其区别？"
      },
      {
        "id": 102,
        "order": 2,
        "type": "technical",
        "category": "Spring框架",
        "difficulty": "medium",
        "questionText": "请解释 Spring 中 Bean 的生命周期？"
      }
    ]
  }
}
```

---

### 10.7 GET /api/interview/{sessionId}/report

**Response:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "sessionId": 10,
    "position": "Java后端工程师",
    "startedAt": "2026-05-09T14:30:00",
    "totalQuestions": 8,
    "radarData": {
      "dimensions": ["技术知识", "逻辑思维", "表达能力", "项目经验", "学习潜力"],
      "scores": [72, 85, 68, 60, 90],
      "industryAverage": [75, 78, 72, 65, 80]
    },
    "overallScore": 75.5,
    "rank": "中等偏上（超过同岗位 62% 的模拟候选人）",
    "weakPoints": [
      {
        "dimension": "项目经验",
        "score": 60,
        "analysis": "项目经历描述偏向功能罗列，缺少技术选型理由和遇到的难点解决方案",
        "resources": ["STAR法则面试训练", "LeetCode 系统设计入门"]
      }
    ],
    "strongPoints": ["学习潜力突出", "逻辑推理清晰"],
    "nextStepAdvice": "重点练习：项目经历表达（STAR法则）+ MySQL索引优化专题",
    "questionResults": [
      {
        "order": 1,
        "questionText": "请介绍一下 Java 的四种引用类型及其区别？",
        "userAnswer": "Java有强引用、软引用、弱引用和虚引用...",
        "score": 78,
        "feedback": "基本概念掌握扎实，如果能结合实际应用场景说明就更好了"
      }
    ]
  }
}
```

---

### 10.8 GET /api/interview/history

**Response:**
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "sessionId": 10,
      "position": "Java后端工程师",
      "overallScore": 75.5,
      "status": "completed",
      "startedAt": "2026-05-09T14:30:00",
      "completedQuestions": 8,
      "totalQuestions": 8
    },
    {
      "sessionId": 7,
      "position": "Java后端工程师",
      "overallScore": 68.2,
      "status": "completed",
      "startedAt": "2026-05-07T10:00:00",
      "completedQuestions": 6,
      "totalQuestions": 8
    }
  ]
}
```

---

### 10.9 GET /api/interview/progress

**Response:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "dates": ["2026-05-01", "2026-05-04", "2026-05-07", "2026-05-09"],
    "technicalScores": [55, 62, 70, 72],
    "logicScores": [60, 72, 80, 85],
    "expressionScores": [50, 55, 62, 68],
    "overallScores": [55, 63, 71, 75.5]
  }
}
```

---

### 10.10 POST /api/speech/transcribe

**Request:** `multipart/form-data`，字段名 `audio`，支持 `audio/wav` / `audio/mpeg` / `audio/webm`

**Response:**
```json
{
  "code": 200,
  "message": "success",
  "data": "HashMap是非线程安全的，ConcurrentHashMap使用了分段锁来保证线程安全..."
}
```

---

## 十一、Prompt 模板文件

以下为 `src/main/resources/prompts/` 下的文件内容，AI读取时替换 `{占位符}`。

### generate-questions.txt

```
你是一位资深技术面试官，需要为【{position}】岗位设计一套面试题。

候选人背景：
{candidateContext}

要求：
1. 生成 {count} 道面试题
2. 类型分布：技术题 {techCount} 道、行为面试题 {behaviorCount} 道
3. 难度分布：简单 {easyCount} 道、中等 {mediumCount} 道、困难 {hardCount} 道
4. 每题必须包含：题目文本、考查维度、参考答案要点
5. 参考答案仅用于AI评分参考，不要向候选人展示

严格按照以下JSON格式输出，不要有任何其他文字：
{
  "questions": [
    {
      "type": "technical",
      "category": "分类名称",
      "difficulty": "easy|medium|hard",
      "questionText": "题目内容",
      "referenceAnswer": "参考答案要点",
      "scoringDimensions": ["维度1", "维度2", "维度3"]
    }
  ]
}
```

### evaluate-answer.txt

```
你是一位经验丰富的技术面试官，请对候选人的回答进行专业评分。

面试信息：
- 岗位：{position}
- 面试进度：第 {current} 题 / 共 {total} 题
- 本题考查维度：{scoringDimensions}

当前问题：
{questionText}

候选人回答：
{userAnswer}

参考答案要点（仅供你评分参考）：
{referenceAnswer}

评分要求（每项0-10分）：
- accuracy: 知识准确性（核心概念是否正确）
- depth: 深度与广度（是否深入理解原理）
- expression: 表达清晰度（逻辑是否清楚、语言是否简洁）
- practical: 实践意识（是否结合实际项目经验）

请严格按照以下JSON格式输出，不要有任何其他文字：
{
  "scores": {
    "accuracy": 0,
    "depth": 0,
    "expression": 0,
    "practical": 0
  },
  "questionScore": 0,
  "feedback": "给候选人的反馈（100字以内，鼓励式语气，先肯定再指出不足）",
  "followUp": "追问问题字符串，如果回答足够完整不需要追问则填null"
}
```

### analyze-resume.txt

```
你是一位技术面试官，请分析以下简历并提取结构化信息。

简历内容：
{resumeText}

请严格按照以下JSON格式输出，不要有任何其他文字：
{
  "name": "候选人姓名",
  "education": "学校 专业 学历 毕业年份",
  "skills": ["技能1", "技能2"],
  "projects": [
    {
      "name": "项目名称",
      "role": "候选人角色",
      "description": "项目描述（50字以内）",
      "techStack": ["技术1", "技术2"]
    }
  ],
  "highlights": ["亮点1", "需要注意的点1"]
}
```

### generate-report.txt

```
你是一位资深面试评估专家，请根据以下面试记录生成综合评估报告。

面试信息：
- 岗位：{position}
- 总题数：{totalQuestions}

所有问答记录：
{interviewRecords}

请严格按照以下JSON格式输出：
{
  "radarData": {
    "dimensions": ["技术知识", "逻辑思维", "表达能力", "项目经验", "学习潜力"],
    "scores": [0, 0, 0, 0, 0],
    "industryAverage": [75, 78, 72, 65, 80]
  },
  "overallScore": 0,
  "rank": "一句话定位，如：中等偏上（超过同岗位62%的模拟候选人）",
  "weakPoints": [
    {
      "dimension": "维度名称",
      "score": 0,
      "analysis": "具体分析（50字以内）",
      "resources": ["推荐学习资源1"]
    }
  ],
  "strongPoints": ["优点1", "优点2"],
  "nextStepAdvice": "下一步建议（30字以内）"
}

评分参考标准：
- 技术知识：各题accuracy维度的平均分（映射到百分制）
- 逻辑思维：各题depth维度的平均分
- 表达能力：各题expression维度的平均分
- 项目经验：行为题和项目相关题的综合表现
- 学习潜力：整体进步趋势、追问应对能力、对新知识的理解速度
```

---

## 十二、前端完整规格

### 12.1 package.json

```json
{
  "name": "interview-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.1",
    "axios": "^1.7.2",
    "echarts": "^5.5.0",
    "echarts-for-react": "^3.0.2",
    "react-markdown": "^9.0.1",
    "react-dropzone": "^14.2.3",
    "zustand": "^4.5.2",
    "dayjs": "^1.11.11"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "vite": "^5.3.1"
  }
}
```

### 12.2 Vite 配置 vite.config.js

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      },
    },
  },
});
```

### 12.3 路由配置

```jsx
// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/interview/setup" element={<ProtectedRoute><InterviewSetup /></ProtectedRoute>} />
        <Route path="/interview/room" element={<ProtectedRoute><InterviewRoom /></ProtectedRoute>} />
        <Route path="/interview/report/:sessionId" element={<ProtectedRoute><InterviewReport /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

// ProtectedRoute: 检查localStorage中是否有token，没有则跳转/login
```

### 12.4 API 层

```javascript
// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// 请求拦截：自动注入JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截：401自动跳转登录
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

```javascript
// src/services/interviewApi.js
import api from './api';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const resumeApi = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  parse: (resumeId) => api.post(`/resume/${resumeId}/parse`),
};

export const interviewApi = {
  start: (data) => api.post('/interview/start', data),
  getReport: (sessionId) => api.get(`/interview/${sessionId}/report`),
  getHistory: () => api.get('/interview/history'),
  getProgress: () => api.get('/interview/progress'),
};

export const positionApi = {
  getAll: () => api.get('/positions'),
};

export const speechApi = {
  transcribe: (audioFile) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    return api.post('/speech/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
```

### 12.5 WebSocket Hook

```javascript
// src/hooks/useWebSocket.js
import { useRef, useCallback, useEffect, useState } from 'react';

export function useWebSocket(url) {
  const wsRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState(null);  // 最新消息
  const messageQueueRef = useRef([]);  // 消息队列

  const connect = useCallback(() => {
    const token = localStorage.getItem('token');
    const ws = new WebSocket(`${url}?token=${token}`);

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => {
      setIsConnected(false);
      // 3秒后自动重连
      setTimeout(connect, 3000);
    };
    ws.onerror = (err) => console.error('WebSocket error:', err);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      messageQueueRef.current.push(data);
      setMessage(data);
    };

    wsRef.current = ws;
  }, [url]);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { isConnected, message, send, disconnect };
}
```

### 12.6 状态管理（Zustand）

```javascript
// src/stores/interviewStore.js
import { create } from 'zustand';

export const useInterviewStore = create((set) => ({
  sessionId: null,
  position: '',
  currentQuestionIndex: 0,
  totalQuestions: 0,
  questions: [],
  evaluations: [],
  isInterviewing: false,

  startInterview: (sessionId, position, questions) => set({
    sessionId,
    position,
    questions,
    totalQuestions: questions.length,
    currentQuestionIndex: 0,
    evaluations: [],
    isInterviewing: true,
  }),

  nextQuestion: () => set((state) => ({
    currentQuestionIndex: Math.min(state.currentQuestionIndex + 1, state.totalQuestions - 1),
  })),

  addEvaluation: (evaluation) => set((state) => ({
    evaluations: [...state.evaluations, evaluation],
  })),

  endInterview: () => set({ isInterviewing: false }),

  reset: () => set({
    sessionId: null,
    position: '',
    currentQuestionIndex: 0,
    totalQuestions: 0,
    questions: [],
    evaluations: [],
    isInterviewing: false,
  }),
}));
```

---

## 十三、数据库初始化脚本

```sql
-- 建库
CREATE DATABASE IF NOT EXISTS interview_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE interview_system;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    email           VARCHAR(100) NOT NULL UNIQUE,
    avatar          VARCHAR(500) DEFAULT NULL,
    role            TINYINT      DEFAULT 0 COMMENT '0=用户 1=管理员',
    deleted         TINYINT      DEFAULT 0 COMMENT '0=正常 1=删除',
    created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 简历表
CREATE TABLE IF NOT EXISTS resumes (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT       NOT NULL,
    file_name       VARCHAR(200) NOT NULL COMMENT '原始文件名',
    file_path       VARCHAR(500) NOT NULL COMMENT '服务器存储路径',
    file_size       BIGINT       DEFAULT 0 COMMENT '文件大小(字节)',
    file_type       VARCHAR(20)  DEFAULT NULL COMMENT 'pdf/docx',
    parsed_text     LONGTEXT     DEFAULT NULL COMMENT '解析后的文本',
    ai_summary      TEXT         DEFAULT NULL COMMENT 'AI提炼的JSON',
    deleted         TINYINT      DEFAULT 0,
    created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 题库表
CREATE TABLE IF NOT EXISTS questions (
    id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
    position            VARCHAR(100) NOT NULL COMMENT '岗位',
    category            VARCHAR(50)  NOT NULL COMMENT '分类',
    difficulty          VARCHAR(10)  NOT NULL COMMENT 'easy/medium/hard',
    type                VARCHAR(20)  NOT NULL COMMENT 'technical/behavioral/scenario',
    question_text       TEXT         NOT NULL,
    reference_answer    TEXT         DEFAULT NULL,
    scoring_dimensions  JSON         DEFAULT NULL COMMENT '["维度1","维度2"]',
    use_count           INT          DEFAULT 0 COMMENT '被使用次数',
    deleted             TINYINT      DEFAULT 0,
    created_at          DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_position_difficulty (position, difficulty),
    INDEX idx_position (position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 面试会话表
CREATE TABLE IF NOT EXISTS interview_sessions (
    id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id             BIGINT        NOT NULL,
    resume_id           BIGINT        DEFAULT NULL,
    position            VARCHAR(100)  NOT NULL,
    status              VARCHAR(20)   DEFAULT 'ongoing' COMMENT 'ongoing/completed/abandoned',
    total_questions     INT           DEFAULT 0,
    completed_questions INT           DEFAULT 0,
    technical_score     DECIMAL(5,2)  DEFAULT NULL,
    logic_score         DECIMAL(5,2)  DEFAULT NULL,
    expression_score    DECIMAL(5,2)  DEFAULT NULL,
    practical_score     DECIMAL(5,2)  DEFAULT NULL,
    learning_score      DECIMAL(5,2)  DEFAULT NULL,
    overall_score       DECIMAL(5,2)  DEFAULT NULL,
    report_json         LONGTEXT      DEFAULT NULL,
    started_at          DATETIME      DEFAULT NULL,
    ended_at            DATETIME      DEFAULT NULL,
    deleted             TINYINT       DEFAULT 0,
    created_at          DATETIME      DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 面试问答记录表
CREATE TABLE IF NOT EXISTS interview_records (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id      BIGINT       NOT NULL,
    question_id     BIGINT       DEFAULT NULL,
    question_order  INT          NOT NULL COMMENT '第几题',
    question_text   TEXT         NOT NULL COMMENT '冗余存储',
    user_answer     TEXT         DEFAULT NULL,
    input_type      VARCHAR(10)  DEFAULT 'text' COMMENT 'text/voice',
    ai_evaluation   JSON         DEFAULT NULL COMMENT '评分JSON',
    question_score  DECIMAL(5,2) DEFAULT NULL,
    follow_up       TEXT         DEFAULT NULL,
    answered_at     DATETIME     DEFAULT NULL,
    deleted         TINYINT      DEFAULT 0,
    created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session_id (session_id),
    FOREIGN KEY (session_id) REFERENCES interview_sessions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 十四、开发顺序建议（给AI的执行指令）

将以下内容作为指令发给AI，可以按模块逐步生成代码：

**模块1 - 基础骨架：**
> 请根据以上规格书，生成以下文件：
> 1. 完整的 pom.xml
> 2. application.yml
> 3. 主启动类 InterviewApplication.java
> 4. 所有 Entity 类（User, Resume, Question, InterviewSession, InterviewRecord）
> 5. 所有 Mapper 接口
> 6. Result.java 和 BusinessException.java
> 7. GlobalExceptionHandler.java
> 8. JwtUtil.java

**模块2 - 认证模块：**
> 请生成：
> 1. AuthService + AuthServiceImpl（含BCrypt密码加密）
> 2. AuthController
> 3. 对应的DTO（RegisterReq, LoginReq, LoginResp）

**模块3 - 简历模块：**
> 请生成：
> 1. ResumeService + ResumeServiceImpl（PDF/DOCX解析 + AI调用）
> 2. ResumeController
> 3. 对应DTO

**模块4 - 面试核心：**
> 请生成：
> 1. QuestionService + QuestionServiceImpl（Redis缓存逻辑）
> 2. InterviewService + InterviewServiceImpl
> 3. InterviewController
> 4. 对应DTO
> 5. InterviewWebSocketHandler
> 6. WebSocketConfig

**模块5 - AI服务：**
> 请生成：
> 1. AIEvaluateService + AIEvaluateServiceImpl（流式调用AI）
> 2. Prompt模板文件（4个.txt文件）
> 3. SpeechService（Whisper集成）

**模块6 - 前端：**
> 请生成React前端项目：
> 1. 完整的 package.json + vite.config.js
> 2. 路由配置 App.jsx
> 3. API层（api.js + interviewApi.js）
> 4. WebSocket Hook（useWebSocket.js）
> 5. 状态管理（interviewStore.js）
> 6. 所有页面组件（Home, Login, Dashboard, InterviewSetup, InterviewRoom, InterviewReport）
> 7. 所有复用组件（RadarChart, ProgressChart, TypewriterText, VoiceRecorder, ResumeUploader）

---

*文档版本 v1.0 | 与技术方案文档配合使用*
