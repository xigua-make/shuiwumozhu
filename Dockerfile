# 构建阶段
FROM node:20-alpine AS builder

# 安装 pnpm
RUN npm install -g pnpm

WORKDIR /app

# 复制 package 文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建静态文件
RUN pnpm run build:cloudflare

# 运行阶段
FROM node:20-alpine

WORKDIR /app

# 安装 serve 静态服务器
RUN npm install -g serve

# 从构建阶段复制静态文件
COPY --from=builder /app/out ./out

# 暴露端口
EXPOSE 5000

# 启动服务
CMD ["serve", "-s", "out", "-l", "5000"]
