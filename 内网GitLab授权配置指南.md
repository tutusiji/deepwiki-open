# DeepWiki-Open 内网 GitLab 授权配置指南

本文档介绍如何配置 DeepWiki-Open 以访问和分析内网 GitLab 上的代码库。

## 📋 目录

- [GitLab 访问机制](#gitlab-访问机制)
- [创建 GitLab Personal Access Token](#创建-gitlab-personal-access-token)
- [在 DeepWiki 中使用 Token](#在-deepwiki-中使用-token)
- [支持的 GitLab 类型](#支持的-gitlab-类型)
- [常见问题](#常见问题)

---

## GitLab 访问机制

DeepWiki-Open 支持通过以下方式访问 GitLab 仓库：

1. **公开仓库**：无需认证，直接输入 URL
2. **私有仓库**：需要提供 Personal Access Token (PAT)
3. **内网 GitLab**：支持自建 GitLab 服务器（包括 http 和 https）

### 技术实现

- 使用 GitLab API v4 获取仓库信息和文件内容
- 使用 `git clone` 命令克隆完整仓库到本地分析
- Token 通过 OAuth2 方式或 HTTP Header 方式认证

---

## 创建 GitLab Personal Access Token

### 步骤 1：登录内网 GitLab

访问您公司的 GitLab 地址，例如：
- `https://gitlab.company.com`
- `http://192.168.1.100:8080`

### 步骤 2：进入 Access Token 设置

1. 点击右上角头像
2. 选择 **"Preferences"**（偏好设置）或 **"Settings"**（设置）
3. 在左侧菜单选择 **"Access Tokens"**（访问令牌）

### 步骤 3：创建新 Token

填写以下信息：

| 字段 | 说明 | 建议值 |
|------|------|--------|
| **Token name** | Token 名称 | `DeepWiki-Access` |
| **Expiration date** | 过期时间 | 根据公司安全策略设置（建议 90 天或更长） |
| **Select scopes** | 权限范围 | ✅ 必选项见下方 |

### 步骤 4：选择必要的权限范围

**最小权限（推荐）**：
- ✅ `read_api` - 读取 API 数据
- ✅ `read_repository` - 读取仓库代码

**完整权限（如需要访问更多信息）**：
- ✅ `read_api`
- ✅ `read_repository` 
- ✅ `read_user` - 读取用户信息
- ⚠️ **不要选择** `write_repository`、`api` 等写权限

### 步骤 5：生成并保存 Token

1. 点击 **"Create personal access token"** 按钮
2. **立即复制生成的 Token**（只会显示一次！）
3. 将 Token 保存到安全的地方（例如密码管理器）

Token 格式示例：
```
glpat-xxxxxxxxxxxxxxxxxxxx
```

---

## 在 DeepWiki 中使用 Token

### 方法 1：通过 Web 界面配置（推荐）

#### 1. 访问 DeepWiki 界面

打开浏览器访问：http://localhost:3000

#### 2. 点击 "+ Add access tokens"

在输入框上方，点击展开 Token 配置区域

#### 3. 选择平台

点击 **"GitLab"** 按钮

#### 4. 输入 Token

在 "Personal Access Token" 输入框中粘贴您的 GitLab Token

#### 5. 输入仓库 URL

支持以下格式：

**公有云 GitLab**：
```
https://gitlab.com/username/project
https://gitlab.com/group/subgroup/project
```

**内网 GitLab**：
```
https://gitlab.company.com/username/project
http://192.168.1.100:8080/group/project
http://gitlab.internal/team/repo
```

#### 6. 生成 Wiki

点击 **"Generate Wiki"** 按钮开始分析

### 方法 2：通过 API 直接调用

如果您需要通过 API 方式调用：

```bash
curl -X POST "http://localhost:8001/generate-wiki-websocket" \
  -H "Content-Type: application/json" \
  -d '{
    "repo_url": "https://gitlab.company.com/team/project",
    "repo_type": "gitlab",
    "access_token": "glpat-xxxxxxxxxxxxxxxxxxxx",
    "provider": "openai",
    "model": "deepseek-chat"
  }'
```

---

## 支持的 GitLab 类型

### 1. GitLab.com（公有云）

```
✅ https://gitlab.com/username/project
✅ https://gitlab.com/group/project
✅ https://gitlab.com/group/subgroup/project
```

### 2. 自建 GitLab（内网）

#### HTTPS 协议
```
✅ https://gitlab.company.com/project
✅ https://git.internal.com/team/repo
✅ https://192.168.1.100/project
```

#### HTTP 协议（内网常用）
```
✅ http://gitlab.company.com/project
✅ http://192.168.1.100:8080/project
✅ http://git.local/team/repo
```

#### 带端口号
```
✅ https://gitlab.company.com:8443/project
✅ http://192.168.1.100:8080/project
```

#### 多级 Group
```
✅ https://gitlab.company.com/department/team/project
✅ http://192.168.1.100/group/subgroup/repo
```

---

## Token 安全说明

### 🔒 安全特性

1. **本地存储**：Token 仅存储在浏览器本地，不会发送到 DeepWiki 服务器
2. **仅用于 Git Clone**：Token 仅用于克隆仓库和访问 GitLab API
3. **临时使用**：每次生成 Wiki 时使用，完成后可以清除

### ⚠️ 安全建议

1. **最小权限原则**：只授予 `read_api` 和 `read_repository` 权限
2. **定期轮换**：建议每 90 天更换一次 Token
3. **独立 Token**：为 DeepWiki 创建专用 Token，不要共用其他应用的 Token
4. **及时撤销**：如 Token 泄露，立即在 GitLab 设置中撤销
5. **访问日志**：在 GitLab 中检查 Token 的访问日志

---

## 网络配置

### 1. 内网访问配置

如果 DeepWiki 部署在内网，确保后端服务器能访问 GitLab：

#### 测试网络连通性

```bash
# 测试 GitLab 服务器是否可达
ping gitlab.company.com

# 测试 GitLab API 是否可访问
curl http://gitlab.company.com/api/v4/version
```

#### 配置 hosts（如需要）

如果内网 GitLab 使用域名，可能需要配置 hosts：

**Windows**: `C:\Windows\System32\drivers\etc\hosts`
```
192.168.1.100  gitlab.company.com
```

**Linux/Mac**: `/etc/hosts`
```
192.168.1.100  gitlab.company.com
```

### 2. 代理配置

如果需要通过代理访问 GitLab，在启动后端时设置：

```bash
# Windows
set HTTP_PROXY=http://proxy.company.com:8080
set HTTPS_PROXY=http://proxy.company.com:8080
set NO_PROXY=localhost,127.0.0.1

# Linux/Mac
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
export NO_PROXY=localhost,127.0.0.1
```

或在 `.env` 文件中配置：

```bash
HTTP_PROXY=http://proxy.company.com:8080
HTTPS_PROXY=http://proxy.company.com:8080
NO_PROXY=localhost,127.0.0.1
```

### 3. SSL/TLS 配置

#### 自签名证书

如果内网 GitLab 使用自签名证书，需要配置 Git 信任：

```bash
# 方法 1：禁用 SSL 验证（仅测试环境）
git config --global http.sslVerify false

# 方法 2：添加证书到信任列表（推荐）
# 将 GitLab 的 CA 证书添加到系统证书存储
```

#### HTTP（非加密）

如果内网 GitLab 使用 HTTP（非 HTTPS），DeepWiki 已支持，无需额外配置。

---

## 常见问题

### 问题 1：无法访问内网 GitLab

**症状**：
```
Error: Failed to clone repository
Connection timeout
```

**解决方案**：
1. 确认后端服务器能访问 GitLab 服务器
2. 检查防火墙规则
3. 测试网络连通性：`ping gitlab.company.com`
4. 检查 GitLab 服务是否正常运行

### 问题 2：Token 认证失败

**症状**：
```
401 Unauthorized
Invalid token
```

**解决方案**：
1. 确认 Token 权限包含 `read_api` 和 `read_repository`
2. 检查 Token 是否已过期
3. 验证 Token 格式是否正确（应以 `glpat-` 开头）
4. 在 GitLab 中检查 Token 是否被撤销

### 问题 3：SSL 证书验证失败

**症状**：
```
SSL certificate problem: self signed certificate
```

**解决方案**：
1. 配置 Git 信任自签名证书
2. 或将 GitLab 证书添加到系统信任存储
3. 临时禁用 SSL 验证（仅测试）

### 问题 4：仓库克隆很慢

**症状**：
- 克隆过程长时间卡住
- 进度条不动

**解决方案**：
1. 检查网络带宽
2. 对于大型仓库，考虑使用浅克隆
3. 配置 Git 代理加速下载

### 问题 5：多级 Group 路径识别错误

**症状**：
```
Project not found
Invalid repository URL
```

**解决方案**：
确保 URL 格式正确：
```
✅ 正确：https://gitlab.company.com/department/team/project
❌ 错误：https://gitlab.company.com/department-team-project
```

### 问题 6：私有仓库访问被拒绝

**症状**：
```
403 Forbidden
You don't have permission to access this repository
```

**解决方案**：
1. 确认您在 GitLab 中有该仓库的访问权限
2. 确认 Token 是用有权限的账号创建的
3. 检查仓库是否真的是私有的

---

## 完整使用流程示例

### 场景：分析内网 GitLab 私有项目

假设：
- GitLab 地址：`http://192.168.1.100:8080`
- 项目路径：`backend/api-service`
- Token：`glpat-aBcDeFgHiJkLmNoPqRsT`

### 步骤：

1. **创建 Token**
   - 访问 `http://192.168.1.100:8080/-/profile/personal_access_tokens`
   - 创建名为 "DeepWiki" 的 Token
   - 权限：`read_api`, `read_repository`
   - 复制生成的 Token

2. **打开 DeepWiki**
   - 访问 `http://localhost:3000`

3. **配置 Token**
   - 点击 "+ Add access tokens"
   - 选择 "GitLab" 平台
   - 粘贴 Token：`glpat-aBcDeFgHiJkLmNoPqRsT`

4. **输入仓库 URL**
   ```
   http://192.168.1.100:8080/backend/api-service
   ```

5. **选择模型**
   - 选择内网大模型（如 DeepSeek 或 Qwen3）
   - 参考《内网大模型配置指南.md》进行配置

6. **生成 Wiki**
   - 点击 "Generate Wiki" 按钮
   - 等待分析完成（时间取决于项目大小）

7. **查看结果**
   - 浏览生成的文档
   - 使用 Ask 功能与代码库对话

---

## 批量分析多个仓库

如果需要分析多个 GitLab 仓库，可以：

### 方法 1：使用同一个 Token

一个 Token 可以访问您有权限的所有仓库，只需在每次分析时输入不同的仓库 URL。

### 方法 2：创建组织级 Token（GitLab 13.0+）

如果您是 GitLab 管理员，可以创建 Group Access Token：

1. 进入 Group 设置
2. 选择 "Access Tokens"
3. 创建 Group Token
4. 该 Token 可以访问整个 Group 下的所有项目

---

## 技术实现细节

DeepWiki 使用以下方式访问 GitLab：

### 1. Git Clone

```bash
# 使用 Token 克隆仓库
git clone https://oauth2:${TOKEN}@gitlab.company.com/group/project.git
```

### 2. GitLab API v4

```bash
# 获取项目信息
GET /api/v4/projects/:id
Header: PRIVATE-TOKEN: ${TOKEN}

# 获取文件内容
GET /api/v4/projects/:id/repository/files/:file_path/raw?ref=main
Header: PRIVATE-TOKEN: ${TOKEN}
```

### 3. 实现位置

相关代码在：
- `api/data_pipeline.py` - `get_gitlab_file_content()` 函数
- `api/data_pipeline.py` - `download_repo()` 函数

---

## 附录：GitLab 版本兼容性

| GitLab 版本 | API v4 支持 | DeepWiki 兼容性 |
|-------------|-------------|-----------------|
| GitLab 9.0+ | ✅ 完全支持 | ✅ 完全兼容 |
| GitLab 8.x  | ⚠️ 部分支持 | ⚠️ 可能有问题 |
| GitLab < 8.0 | ❌ 不支持 | ❌ 不兼容 |

建议使用 GitLab 9.0 或更高版本以获得最佳兼容性。

---

## 相关文档

- [内网大模型配置指南.md](./内网大模型配置指南.md) - 配置内网 AI 模型
- [GitLab Personal Access Tokens 官方文档](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html)

---

**文档版本**：1.0  
**创建日期**：2026-02-05  
**适用项目版本**：DeepWiki-Open v0.1.0  
**最后更新**：2026-02-05
