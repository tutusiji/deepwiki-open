# Ubuntu 裸机部署 DeepWiki 指南 (无 Docker 版)

本文档介绍如何在 Ubuntu 服务器上原生部署 DeepWiki 的前后端分离架构。
推荐生产环境配合 **PM2（进程守护）** 和 **Nginx（反向代理）** 使用。

## 环境准备

我们需要安装 Node.js、Python 和对应的包管理器。

### 1. 安装系统依赖 & Python 3.11+

```bash
sudo apt update
sudo apt install -y curl software-properties-common build-essential nginx

# 安装 Python 和 pip
sudo apt install -y python3 python3-pip python3-venv
```

### 2. 安装 Node.js 和 Yarn

项目需要 Node.js (推荐 v20+) 和 Yarn 1.x。

```bash
# 安装 Node.js v20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 Yarn
sudo npm install -g yarn

# 安装 PM2 (用于生产环境进程守护)
sudo npm install -g pm2
```

---

## 步骤一：部署后端 (Python FastAPI)

后端代码位于项目的 `api` 目录。它被拉起后默认运行在 `8001` 端口。

1. **进入后端目录并创建虚拟环境**

   ```bash
   cd deepwiki-open/api
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **安装依赖**
   我们直接使用 `pip` 结合项目中的 `pyproject.toml` 或原生命令安装必要包：

   ```bash
   pip install fastapi "uvicorn[standard]" pydantic google-generativeai tiktoken adalflow numpy faiss-cpu langid requests jinja2 python-dotenv openai ollama aiohttp boto3 websockets azure-identity azure-core watchfiles
   ```

3. **使用 PM2 启动后端**
   在 `deepwiki-open` 的根目录（而不是 api 目录里面，因为代码里用了相对根路径导入）运行守护进程：

   ```bash
   cd ..   # 确保在 deepwiki-open 根目录

   # 启动后端，命名为 deepwiki-api
   pm2 start api/main.py --interpreter api/venv/bin/python --name deepwiki-api
   ```

---

## 步骤二：部署前端 (Next.js)

前端在根目录，启动后默认运行在 `3000` 端口。

1. **安装依赖**

   ```bash
   # 保持在 deepwiki-open 根目录
   yarn install
   ```

2. **配置 `.env`**
   确保你已经把根目录的 `.env。` 配置正确填写了你那套内网大模型的参数。
   也可以创建一个 `.env.production` 来应对生产环境的独立参数。

3. **编译项目**

   ```bash
   yarn build
   ```

4. **使用 PM2 启动前端**

   ```bash
   pm2 start yarn --name deepwiki-web -- run start
   ```

5. **保存 PM2 状态** (实现开机自启)
   ```bash
   pm2 save
   pm2 startup
   # (复制上方终端提示的 sudo 命令并执行)
   ```

当输入 `pm2 list` 时，你应该能看到 `deepwiki-api` (online) 和 `deepwiki-web` (online) 这两个进程稳稳地在跑。

---

## 步骤三：配置 Nginx (反向代理)

由于前后端分别占用 `3000` 和 `8001` 端口，外网/内网用户访问时最好统一走 `80` (HTTP) 或 `443` (HTTPS)。我们将使用 Nginx 来代理。

1. **新建配置文件**

   ```bash
   sudo nano /etc/nginx/sites-available/deepwiki
   ```

2. **写入配置并修改 `server_name`**

   ```nginx
   server {
       listen 80;
       server_name deepwiki.yourcompany.com;  # 这里改成你想要的域名或者你的服务器IP

       # 将 /api 开头的请求路由到 Python 后端
       location /api/ {
           proxy_pass http://localhost:8001/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }

       # 将其他所有请求路由到 Next.js 前端
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           # Next.js 建议的支持 websocket/hot-reload 配置
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
       }
   }
   ```

3. **激活配置并重启 Nginx**
   ```bash
   sudo ln -s /etc/nginx/sites-available/deepwiki /etc/nginx/sites-enabled/
   sudo nginx -t   # 检查语法是否通过
   sudo systemctl restart nginx
   ```

### ✅ 部署完成

至此，你已经完成了原生的 Ubuntu 部署。如果你没有域名，直接访问你的 `http://服务器_IP`，它就能完美加载 DeepWiki，而分析代码时的后端请求通过 `/api/` 自动被代理进了守护中的大模型程序中。
