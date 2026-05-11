# AI Mock Interview System

在校大学生 AI 面试模拟系统

## 项目简介

这是一个基于 AI 的面试模拟平台，帮助在校大学生练习面试技能。系统支持多种面试模式，提供实时评分和详细的反馈报告。

## 技术栈

**后端**
- Spring Boot 3.2.5
- Java 17
- MyBatis-Plus 3.5.5
- MySQL
- WebSocket

**前端**
- React 18
- Vite
- Tailwind CSS
- ECharts

## 功能特性

- **多模式面试**：支持问答模式、语音模式
- **自定义岗位**：可输入自定义面试岗位
- **知识库**：上传 MD 文件作为题库来源
- **AI 评分**：实时评分，包含准确性、深度、流畅度等多维度评估
- **雷达图报告**：面试结束后生成详细的能力雷达图
- **进度追踪**：记录每次面试成绩，追踪进步趋势

## 快速开始

### 环境要求

- JDK 17+
- Node.js 16+
- MySQL 8.0+

### 1. 初始化数据库

```bash
mysql -u root -p < interview-system/sql/interview_system.sql
mysql -u root -p < interview-system/sql/ai_models.sql
mysql -u root -p < interview-system/sql/knowledge_base.sql
```

### 2. 配置后端

修改 `interview-system/src/main/resources/application.yml`：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/interview_system?useSSL=false&serverTimezone=Asia/Shanghai
    username: your_username
    password: your_password

deepseek:
  api-key: your_api_key
  base-url: https://api.deepseek.com
```

### 3. 启动后端

```bash
cd interview-system
mvn spring-boot:run
```

### 4. 启动前端

```bash
cd interview-frontend
npm install
npm run dev
```

### 5. 访问系统

打开浏览器访问 http://localhost:3000

## 面试模式

### 问答模式
- 文字输入回答问题
- 实时 AI 评分
- 显示标准答案和详细反馈

### 语音模式
- 麦克风实时语音识别
- AI 根据回答内容、流畅度、紧张程度综合评分
- 生成包含多维度的雷达图报告

## 项目结构

```
mockforge/
├── interview-system/          # 后端项目
│   ├── sql/                   # 数据库脚本
│   └── src/main/java/        # Java 源代码
│       └── com/interview/
│           ├── controller/    # 控制器
│           ├── service/       # 业务逻辑
│           ├── entity/        # 实体类
│           └── websocket/     # WebSocket 处理
│
├── interview-frontend/        # 前端项目
│   └── src/
│       ├── pages/             # 页面组件
│       ├── components/        # 公共组件
│       ├── hooks/            # 自定义 Hooks
│       └── services/          # API 服务
│
├── interview-spec-dev.md      # 开发规范
└── interview-system-design.md # 系统设计文档
```

## License

MIT
