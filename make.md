🎉 这个工程需要 两种不同类型的大模型 协同工作：

  🔧 两种模型的分工

  ┌─────────────────────────────────────────────────────────────┐
  │                    DeepWiki 架构                            │
  ├─────────────────────────────────────────────────────────────┤
  │                                                             │
  │  1️⃣ 嵌入模型 (Embedder)                                      │
  │     ├─ 模型: text-embedding-v3                              │
  │     ├─ 作用: 代码 → 向量 (Vector)                            │
  │     ├─ 用途: 构建向量数据库，相似度搜索                        │
  │     └─ 配置: DEEPWIKI_EMBEDDER_TYPE=dashscope               │
  │                                                             │
  │  2️⃣ 对话模型 (LLM/Generator)                                 │
  │     ├─ 模型: qwen3.5-plus                                   │
  │     ├─ 作用: 理解代码 → 生成 Wiki 内容                        │
  │     ├─ 用途: 生成文档、回答问题、代码摘要                      │
  │     └─ 配置: generator.json 中的 default_provider           │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘

  📝 为什么需要两种模型？

   类型       输入            输出                        类比
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   嵌入模型   代码片段        向量 (如 1024 维数字数组)   像"指纹录入"
   对话模型   代码 + 提示词   人类可读的 Wiki 文本        像"写文章"

  工作流程：

  1. 索引阶段：Embedder 把代码转成向量存到数据库
  2. 查询阶段：用户提问 → Embedder 把问题转成向量 → 找相似代码
  3. 生成阶段：把找到的代码发给 LLM → LLM 生成 Wiki/回答

  ⚠️ 重要：不能用错模型！

   错误配置                      结果
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   用 text-embedding-v3 做对话   ❌ 404 错误（只能输出向量，不能生成文本）
   用 qwen3.5-plus 做嵌入        ❌ 维度不匹配或格式错误

  ✅ 你的最终配置

  # .env 文件
  OPENAI_API_KEY=sk-your-dashscope-key
  OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
  DEEPWIKI_EMBEDDER_TYPE=dashscope   # 使用阿里嵌入模型

  // generator.json - 对话模型
  "openai": {
    "default_model": "qwen3.5-plus"   // 使用阿里对话模型
  }

  // embedder.json - 嵌入模型
  "embedder_dashscope": {
    "model_kwargs": {
      "model": "text-embedding-v3"   // 阿里嵌入模型
    }
  }