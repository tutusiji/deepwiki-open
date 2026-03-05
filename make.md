🎉 这个工程需要 两种不同类型的大模型 协同工作：

🔧 两种模型的分工

┌─────────────────────────────────────────────────────────────┐
│ DeepWiki 架构 │
├─────────────────────────────────────────────────────────────┤
│ │
│ 1️⃣ 嵌入模型 (Embedder) │
│ ├─ 模型: text-embedding-v3 │
│ ├─ 作用: 代码 → 向量 (Vector) │
│ ├─ 用途: 构建向量数据库，相似度搜索 │
│ └─ 配置: DEEPWIKI_EMBEDDER_TYPE=dashscope │
│ │
│ 2️⃣ 对话模型 (LLM/Generator) │
│ ├─ 模型: qwen3.5-plus │
│ ├─ 作用: 理解代码 → 生成 Wiki 内容 │
│ ├─ 用途: 生成文档、回答问题、代码摘要 │
│ └─ 配置: generator.json 中的 default_provider │
│ │
└─────────────────────────────────────────────────────────────┘

📝 为什么需要两种模型？

类型 输入 输出 类比
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
嵌入模型 代码片段 向量 (如 1024 维数字数组) 像"指纹录入"
对话模型 代码 + 提示词 人类可读的 Wiki 文本 像"写文章"

工作流程：

1. 索引阶段：Embedder 把代码转成向量存到数据库
2. 查询阶段：用户提问 → Embedder 把问题转成向量 → 找相似代码
3. 生成阶段：把找到的代码发给 LLM → LLM 生成 Wiki/回答

⚠️ 重要：不能用错模型！

错误配置 结果
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
用 text-embedding-v3 做对话 ❌ 404 错误（只能输出向量，不能生成文本）
用 qwen3.5-plus 做嵌入 ❌ 维度不匹配或格式错误

✅ 你的最终配置

# .env 文件

OPENAI_API_KEY=sk-your-dashscope-key
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DEEPWIKI_EMBEDDER_TYPE=dashscope # 使用阿里嵌入模型

// generator.json - 对话模型
"openai": {
"default_model": "qwen3.5-plus" // 使用阿里对话模型
}

// embedder.json - 嵌入模型
"embedder_dashscope": {
"model_kwargs": {
"model": "text-embedding-v3" // 阿里嵌入模型
}
}

---

支持向量计算的“嵌入式模型（Embedding Model）”不需要在弹窗中选择吗？
不需要，且从架构上也不应该在前端动态选择。

这是由系统底层的向量检索（RAG）原理决定的：

维度一致性要求：嵌入模型负责将你的代码和文档转化为几千维的“向量坐标”存入向量数据库（本项目使用的是 FAISS）。如果不加限制地允许用户每次更换嵌入模型，那么以前存入的 A 模型坐标和当前提问时 B 模型生成的坐标将处于完全不同的“数学空间”，会导致根本搜不到任何代码或者完全乱答。
全局生效：为了保证生成索引和提问检索时使用的是同一套“坐标系”，嵌入模型属于系统级底层配置。
配置位置：它已经在

.env
中通过 DEEPWIKI_EMBEDDER_TYPE=openai 并在后端的

api/config/embedder.json
文件中被全局固定了。所有用户的请求都会默认且强制使用这个统一模型来做向量计算。
因此，前端页面只允许用户灵活切换负责最终文本理解和生成的“大语言模型 (LLM)”（因为发给 LLM 的都是纯文本，不受向量空间限制），而把容易导致系统崩溃的“嵌入模型”设定为后台静默运作。

嵌入模型和大语言模型公用的OPENAI_BASE_URL吗
是的，完全正确。

在这个项目中，当你把

.env
里的 DEEPWIKI_EMBEDDER_TYPE 设置为 openai 后，系统底层的嵌入计算和前端能够选择的通过 openai 提供商生成回答的大语言模型，共享了同一个 OPENAI_API_KEY 和 OPENAI_BASE_URL。

这是因为它们都复用了 openai 的标准化接口（即你内网配置的这个 https://eisapi.byd.com/open-api/1.0/llm/v1 大模型网关）。

我们在文件

api/config/embedder.json
的第 4-7 行可以看到这个公用的明确定义：
"embedder": {
"client_class": "OpenAIClient",
"initialize_kwargs": {
"api_key": "${OPENAI_API_KEY}",
      "base_url": "${OPENAI_BASE_URL}"
},

💡 另外需要注意的一点：
系统给内网大模型发起的这两种请求在路径设计上是标准的：

生成文字请求：框架会在你配置的 baseURL 后面自动拼接 /chat/completions 并带上你从弹窗下拉列表选中的模型名字（例如 qwen3.5-plus）。
向量转换请求：框架会在同一个 baseURL 后面自动拼接 /embeddings 来请求生成向量，它使用的默认模型名字是 text-embedding-v3（同样在

embedder.json
下方第 10 行写死）。
所以，只要你们公司内网的大模型 API 网关（https://eisapi.byd.com/open-api/1.0/llm/v1） 同时兼顾代理了 /chat/completions 和 /embeddings 两个标准端口，而且包含了 text-embedding-v3（或者网关会自动把这个名字映射到你们内网的向量大模型），整个 RAG（检索增强生成）流程就可以完美运行。

如果公司公司内网的大模型 API 网关（https://eisapi.byd.com/open-api/1.0/llm/v1）是这个，但是嵌入模型和大语言模型分别是2个apikey怎么办？

我已经为您配置好了独立的大模型和嵌入模型 API Key 的支持！

您现在只需要在 .env 文件中配置这两个不同的 Key 即可。我为您做了以下修改：

1. 修改了 .env 文件 增加了一个专门用于向量模型的参数 OPENAI_EMBEDDING_API_KEY：

# 负责对话的大模型 API Key

OPENAI_API_KEY=sk-3a7d1d7faf694ab682ba2300843c330b

# 负责向量计算的嵌入模型 API Key

OPENAI_EMBEDDING_API_KEY=填写内网嵌入模型的专属Key

2. 增强了 api/config.py 和 api/config/embedder.json 的兼容性

如果你填写了 OPENAI_EMBEDDING_API_KEY，那么后端做向量计算（找代码片段）时就会独立使用这个 Key。
如果你把 OPENAI_EMBEDDING_API_KEY 留空，系统会自动退回使用上面通用的 OPENAI_API_KEY。
现在该怎么做？

请打开 .env 文件，将您内网专门用于嵌入模型的 API Key 填在 OPENAI_EMBEDDING_API_KEY= 后面。
填好后，需要重启后端的 Python 服务（你在运行 python -m api.main 的终端里按 Ctrl+C 停止，然后重新运行一次）让配置生效。

如果公司内网的大模型 API 网关调用地址也有点稍微不同呢？
我已经为您把**基础地址（Base URL）**也分离开了！

您只需要在刚刚的

.env
文件里，把不同的网关地址填进去即可：

# 嵌入模型的 API Key 和 基础地址（如果与上面不同，请修改此处；如果留空则默认使用上面的大模型配置）

OPENAI_EMBEDDING_API_KEY=这里的Key若是不同请填写
OPENAI_EMBEDDING_BASE_URL=https://eisapi.byd.com/open-api/2.0/embedding/v1 <-- 填入您内网专用的嵌入模型网关地址

底层逻辑一样：

如果 OPENAI_EMBEDDING_BASE_URL 填了内容，系统里的嵌入模型代码（找相似代码的功能）就会往这个新地址发请求。
如果你把它留空，系统就会自动去借用上面的 OPENAI_BASE_URL。
修改完这几个变量之后，记得在运行后端的终端（python -m api.main）里重新启动一次服务，这些新加的配置就会立刻生效了！
