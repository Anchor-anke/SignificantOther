# 艾德里安 · AI 智能伴侣 🌸

一个温暖柔和的 AI 陪伴聊天应用，提供拟人化的对话体验。支持文字对话、图片识别、长期记忆与个性化设置，打造专属的 AI 伴侣。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)

## ✨ 特性

- 💬 **自然对话体验**：微信风格聊天界面，AI 回复按句逐条弹出，带「正在输入」与逐字打字效果
- 🎭 **多性格设定**：4种人格类型可选（知心姐姐、软萌陪伴、元气鼓励、安静倾听）
- 🖼️ **图片识别**：支持上传图片（超4MB自动压缩），由智谱 GLM-4V-Flash 理解图片内容
- 💾 **长期记忆**：聊天记录持久化存储，每次请求携带最近20轮上下文
- ⚙️ **个性化定制**：自定义伴侣名称、称呼、头像等设置
- 😊 **拟真互动**：约每35-45条回复随机触发「打错字再撤回」效果，增强真实感
- 🔒 **安全边界**：内置心理危机与敏感内容安全机制

## 📸 功能预览

### 💬 自然对话体验
![聊天记录](./public/screenshots/chat-history.png)
*流畅的对话交互，支持上下文理解和自然回复*

### 🖼️ 图片识别能力
![图片识别](./public/screenshots/image-recognition.png)
*AI 能够理解图片内容并做出自然回应*

### 🎭 个性化设置
![伴侣设置](./public/screenshots/settings-panel.png)
*自定义伴侣名称、称呼、性格和头像*

### 🎵 深度对话示例
![深度对话](./public/screenshots/deep-conversation.png)
*支持音乐、影视等话题的深度交流*

## 🛠️ 技术栈

- **前端框架**：[Next.js 15](https://nextjs.org/) (App Router) + [React 19](https://react.dev/)
- **样式方案**：[Tailwind CSS 4](https://tailwindcss.com/)
- **编程语言**：[TypeScript 5.8](https://www.typescriptlang.org/)
- **数据库 ORM**：[Prisma](https://www.prisma.io/)
- **本地数据库**：SQLite (`prisma/dev.db`)
- **生产数据库**：PostgreSQL（推荐 Vercel Postgres 或 Neon）
- **文本模型**：DeepSeek API（默认 `deepseek-chat`）
- **视觉模型**：智谱 GLM-4V-Flash

## 🚀 快速开始

### 环境要求

- Node.js 18+ 
- npm 或 yarn

### 安装步骤

1. **克隆仓库**

```bash
git clone https://github.com/[你的GitHub用户名]/SignificantOther.git
cd SignificantOther
```

2. **安装依赖**

```bash
npm install
```

> 💡 如果遇到 EPERM 权限错误，项目已配置 `.npmrc` 将缓存写入本地 `.npm-cache` 目录。详见下方「常见问题」。

3. **配置环境变量**

```bash
# Windows
copy .env.example .env
copy .env.example .env.local

# macOS/Linux
cp .env.example .env
cp .env.example .env.local
```

编辑 `.env.local`，填入你的 API 密钥：

```env
DATABASE_URL="file:./dev.db"
DEEPSEEK_API_KEY="your-deepseek-api-key"
GLM_API_KEY="your-glm-api-key"
```

4. **初始化数据库**

```bash
npm run db:setup
```

5. **启动开发服务器**

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 开始使用！

## ⚙️ 环境变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `DATABASE_URL` | 数据库连接字符串 | `file:./dev.db` (本地) / PostgreSQL URL (生产) |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | `sk-xxx` |
| `DEEPSEEK_API_URL` | DeepSeek API 地址 | `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | DeepSeek 模型名称 | `deepseek-chat` |
| `GLM_API_KEY` | 智谱开放平台 API 密钥 | `xxx` |
| `GLM_API_URL` | 智谱 API 地址 | `https://open.bigmodel.cn/api/paas/v4` |
| `GLM_VISION_MODEL` | 视觉模型名称 | `glm-4v-flash` |

获取 API 密钥：
- DeepSeek: [https://platform.deepseek.com](https://platform.deepseek.com)
- 智谱 AI: [https://open.bigmodel.cn](https://open.bigmodel.cn)

## 📦 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（自动执行数据库同步） |
| `npm run build` | 构建生产版本 |
| `npm start` | 运行生产服务器 |
| `npm run db:setup` | 初始化/更新数据库结构 |
| `npm run db:migrate` | 执行数据库迁移（生产环境） |
| `npm run lint` | 代码检查 |

## 🗂️ 项目结构

```
significant-other/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── chat/         # 对话接口
│   │   ├── messages/     # 消息历史接口
│   │   └── settings/     # 用户设置接口
│   ├── history/          # 聊天记录页面
│   ├── globals.css       # 全局样式
│   ├── layout.tsx        # 根布局
│   └── page.tsx          # 首页
├── components/            # React 组件
│   ├── Chat.tsx          # 主聊天组件
│   ├── ChatInput.tsx     # 输入框组件
│   ├── ChatMessage.tsx   # 消息气泡组件
│   ├── ChatHistoryView.tsx  # 历史记录视图
│   ├── SettingsPanel.tsx # 设置面板
│   └── TypingIndicator.tsx  # 输入指示器
├── lib/                   # 工具函数库
│   ├── chat-limits.ts    # 聊天限制配置
│   ├── client-user.ts    # 客户端用户标识
│   ├── compress-image.ts # 图片压缩
│   ├── deepseek.ts       # DeepSeek API 封装
│   ├── glm.ts            # GLM API 封装
│   ├── personality.ts    # 人格设定
│   ├── prompts.ts        # AI 提示词
│   ├── sentence-split.ts # 句子分割
│   ├── typo-effect.ts    # 打字错误效果
│   └── ...
├── prisma/                # Prisma 配置
│   ├── schema.prisma     # 数据模型定义
│   └── migrations/       # 数据库迁移文件
├── public/avatars/        # 静态资源
└── scripts/               # 辅助脚本
```

## 🗄️ 数据库说明

### 数据存储位置

本地开发时，所有数据存储在 `prisma/dev.db`（SQLite 文件）。每条记录与浏览器中的用户标识 `significant_other_user_id`（localStorage）绑定。

### 数据模型

- **Conversation**: 会话表
- **Message**: 消息表（包含角色、内容、图片URL等）
- **Settings**: 用户设置表（伴侣名称、称呼、人格、头像等）

### 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 聊天记录突然消失 | 删除了 `dev.db` 或重置数据库 | 避免运行 `prisma migrate reset` |
| 看不到之前的记录 | 清除了浏览器数据，生成了新用户ID | 在设置页查看用户ID前8位确认身份 |
| 只显示最近消息 | 主页仅显示最近50条 | 点击右上角搜索图标查看全部记录 |
| 换浏览器/设备看不到记录 | 不同浏览器有不同的用户ID | 这是预期行为，数据仍在原浏览器的数据库中 |

自查命令（PowerShell）：

```powershell
# 检查数据库文件
Get-Item F:\SignificantOther\prisma\dev.db -ErrorAction SilentlyContinue

# 查看浏览器用户ID
# F12 → Application → Local Storage → significant_other_user_id
```

> ⚠️ **注意**：日常开发请使用 `npm run db:setup`（`db push`），不要使用 `prisma migrate reset`，后者会清空所有数据。

## 🌐 部署到 Vercel

1. **推送代码到 GitHub**

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **在 Vercel 导入项目**

访问 [Vercel](https://vercel.com)，点击 "New Project"，选择你的 GitHub 仓库。

3. **配置 PostgreSQL 数据库**

推荐使用以下服务之一：
- [Vercel Postgres](https://vercel.com/storage/postgres)
- [Neon](https://neon.tech)
- [Supabase](https://supabase.com)

4. **设置环境变量**

在 Vercel 项目的 **Settings → Environment Variables** 中添加：

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
DEEPSEEK_API_KEY=your-key
GLM_API_KEY=your-key
```

5. **切换数据库提供者**

修改 `prisma/schema.prisma`：

```prisma
datasource db {
  provider = "postgresql"  # 从 sqlite 改为 postgresql
  url      = env("DATABASE_URL")
}
```

提交更改后，Vercel 会自动重新构建。

6. **执行数据库迁移**

```bash
npx prisma migrate deploy
```

构建命令已在 `package.json` 中配置好，无需额外设置。

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [DeepSeek](https://deepseek.com) - 提供强大的文本生成能力
- [智谱 AI](https://bigmodel.cn) - 提供图片识别能力
- [Next.js](https://nextjs.org) - 优秀的 React 框架
- [Prisma](https://prisma.io) - 现代化的数据库工具

---

Made with ❤️ by 开发者
