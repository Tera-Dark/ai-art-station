# 🚀 AI Art Station - Vercel 部署完整指南

## 📋 部署前准备清单

### ✅ 必需服务配置

- [ ] Supabase 项目已创建并配置
- [ ] ImgBB API 密钥已获取（推荐）
- [ ] GitHub 仓库已推送最新代码

### ✅ 本地测试通过

- [ ] `npm run build` 构建成功
- [ ] `npm run start` 本地预览正常
- [ ] 图片上传功能测试通过

## 🔧 步骤1: Vercel 项目设置

### 1.1 创建 Vercel 项目

```bash
# 方法A: 使用 Vercel CLI (推荐)
npm i -g vercel
vercel login
vercel

# 方法B: 通过 Vercel 网站
# 访问 https://vercel.com/new
# 选择从 GitHub 导入项目
```

### 1.2 项目配置

- **Framework Preset**: Next.js
- **Node.js Version**: 18.x (推荐)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm ci`

## 🔐 步骤2: 环境变量配置

### 2.1 在 Vercel Dashboard 设置环境变量

前往 `项目设置 > Environment Variables` 添加以下变量：

#### 🚀 核心配置 (必需)

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# 应用配置
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
```

#### 📸 图片上传配置

```bash
# ImgBB (推荐)
NEXT_PUBLIC_IMGBB_API_KEY=your-imgbb-api-key

# Cloudinary (可选)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

#### 🔐 认证配置 (可选)

```bash
# NextAuth
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-here
```

### 2.2 环境变量作用域设置

- **Production**: 生产环境使用
- **Preview**: 预览部署使用
- **Development**: 本地开发使用 (可选)

## 🛠️ 步骤3: 数据库配置

### 3.1 Supabase 生产环境设置

```sql
-- 在 Supabase SQL Editor 中运行
-- 或上传 database/ 目录下的 SQL 文件

-- 创建存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('artworks', 'artworks', true),
  ('avatars', 'avatars', true);

-- 设置存储策略
CREATE POLICY "Public artworks access" ON storage.objects
  FOR SELECT USING (bucket_id = 'artworks');

CREATE POLICY "Public avatars access" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
```

### 3.2 更新 Next.js 配置

确保 `next.config.ts` 中包含你的 Supabase 域名：

```typescript
// 在 images.domains 中添加
'your-project-id.supabase.co'
```

## 🚀 步骤4: 部署方式

### 方式A: CLI 部署 (推荐)

```bash
# 首次部署
vercel --prod

# 后续部署
git push origin main  # 自动触发部署
```

### 方式B: GitHub 集成

- 连接 GitHub 仓库
- 每次推送到 `main` 分支自动部署
- Pull Request 自动创建预览部署

### 方式C: 手动部署

- 在 Vercel Dashboard 点击 "Deploy"
- 选择分支或提交进行部署

## 📊 步骤5: 部署后验证

### 5.1 功能测试清单

- [ ] 网站正常访问
- [ ] 页面路由正常
- [ ] 图片加载正常
- [ ] 搜索功能正常
- [ ] 上传功能正常
- [ ] 响应式设计正常

### 5.2 性能优化验证

```bash
# 使用 Lighthouse 检测
# 或访问 https://pagespeed.web.dev/
```

## 🚨 常见问题排除

### Q1: 构建失败 "Module not found"

```bash
# 解决方案: 检查依赖安装
npm ci
npm run build
```

### Q2: 环境变量不生效

- 确保变量名以 `NEXT_PUBLIC_` 开头（客户端变量）
- 重新部署项目
- 检查变量值是否正确

### Q3: 图片无法加载

- 检查 `next.config.ts` 中的域名配置
- 确保 Supabase 存储桶为公开
- 验证图片 URL 格式

### Q4: "Bucket not found" 错误

```sql
-- 在 Supabase 中创建存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('artworks', 'artworks', true);
```

### Q5: 部署超时

- 检查构建日志
- 优化依赖和构建过程
- 考虑使用 Vercel Pro 计划

## 🔄 自动化部署工作流

### GitHub Actions (可选)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID}}
          vercel-project-id: ${{ secrets.PROJECT_ID}}
```

## 📈 部署后优化

### 性能监控

- 启用 Vercel Analytics
- 配置 Vercel Speed Insights
- 设置错误监控

### 域名配置

```bash
# 添加自定义域名
vercel domains add yourdomain.com
```

### CDN 优化

- 图片自动优化已启用
- 静态资源缓存已配置
- 全球 CDN 分发已启用

## 🎯 生产环境检查清单

部署完成后，请验证以下项目：

- [ ] 🌐 网站可正常访问
- [ ] 🔐 环境变量已正确配置
- [ ] 🗄️ 数据库连接正常
- [ ] 📸 图片上传功能正常
- [ ] 📱 移动端显示正常
- [ ] ⚡ 页面加载速度良好
- [ ] 🔍 SEO 元数据正确

## 📞 获得帮助

如果遇到部署问题：

1. 查看 Vercel 构建日志
2. 检查浏览器控制台错误
3. 参考 [Vercel 官方文档](https://vercel.com/docs)
4. 在项目 GitHub Issues 中提问

---

🎉 **恭喜！你的 AI Art Station 已成功部署到 Vercel！**
