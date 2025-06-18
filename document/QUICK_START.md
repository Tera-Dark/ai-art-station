# AI Art Station 快速启动指南

> 🚀 5分钟快速上手指南，解决常见问题

## 📋 当前问题解决方案

### 问题 1: 图片上传失败

**现象**: 控制台显示 "Bucket not found" 或 "ImgBB上传失败"

**解决方案**:

#### 方案A: 配置 Supabase（推荐）

1. **创建 `.env.local` 文件**:

   ```bash
   # 在项目根目录创建此文件
   cp env.example .env.local
   ```

2. **获取 Supabase 配置**:

   - 访问 [Supabase](https://supabase.com)
   - 创建项目或使用现有项目
   - 进入项目设置 > API，复制：
     - Project URL
     - anon public key

3. **配置环境变量**:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **创建存储桶**:

   - 在 Supabase 控制台进入 Storage
   - 创建名为 `artworks` 的 bucket
   - 设置为 Public bucket

5. **运行数据库脚本**:
   - 在 Supabase SQL 编辑器中运行 `database-setup.sql`

#### 方案B: 使用 ImgBB（简单）

1. **获取 ImgBB API Key**:

   - 访问 [ImgBB API](https://api.imgbb.com)
   - 注册并获取 API key

2. **配置环境变量**:
   ```bash
   NEXT_PUBLIC_IMGBB_API_KEY=your-imgbb-api-key
   ```

#### 方案C: 演示模式（无需配置）

如果不配置任何服务，系统会自动使用演示模式：

- 图片使用临时 URL
- 页面刷新后图片会丢失
- 适合快速体验功能

### 问题 2: 评论功能不工作

**现象**: 评论显示为假数据

**解决方案**:
已修复！现在评论功能连接真实数据库：

- 需要先完成 Supabase 配置（见方案A）
- 评论会实时保存到数据库
- 支持回复和点赞功能

### 问题 3: 作品详情页无法滚动

**现象**: 作品详情页面布局有问题，无法正常滚动

**解决方案**:
已修复！改进了布局：

- 信息区域和评论区可独立滚动
- 响应式设计，适配手机端
- 优化了滚动条样式

## 🚀 快速启动步骤

### 1. 最小配置（5分钟）

```bash
# 1. 复制环境文件
cp env.example .env.local

# 2. 只需配置一个图片服务（任选其一）:

# 选项 A: ImgBB（最简单）
echo "NEXT_PUBLIC_IMGBB_API_KEY=your-key" >> .env.local

# 选项 B: 或者什么都不配置，直接使用演示模式

# 3. 启动项目
npm run dev
```

### 2. 完整配置（15分钟）

如果你想要完整功能（包括用户系统、评论等）：

1. **配置 Supabase**（见上方方案A）
2. **运行数据库脚本**
3. **配置图片服务**（ImgBB 或 Cloudinary）

## 🔧 环境变量说明

| 变量名                          | 必需 | 说明                     |
| ------------------------------- | ---- | ------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | 推荐 | 用户系统、评论、数据存储 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 推荐 | Supabase 密钥            |
| `NEXT_PUBLIC_IMGBB_API_KEY`     | 可选 | 图片上传（推荐）         |
| `NEXT_PUBLIC_CLOUDINARY_*`      | 可选 | 图片上传（备选）         |

## 📱 功能状态

| 功能     | 无配置  | 仅图片服务 | 完整配置 |
| -------- | ------- | ---------- | -------- |
| 浏览作品 | ✅      | ✅         | ✅       |
| 上传作品 | ⚠️ 临时 | ✅         | ✅       |
| 用户登录 | ❌      | ❌         | ✅       |
| 评论功能 | ❌      | ❌         | ✅       |
| 点赞收藏 | ❌      | ❌         | ✅       |

## 🐛 常见问题

### Q: 上传的图片看不到了？

A: 可能使用了临时 URL，配置图片服务即可解决。

### Q: 无法登录？

A: 需要配置 Supabase，并运行数据库脚本。

### Q: 评论发不出去？

A: 需要先登录，并确保 Supabase 配置正确。

### Q: 页面布局有问题？

A: 尝试刷新页面，新的 CSS 样式已经修复了布局问题。

## 🆘 获取帮助

如果遇到问题：

1. 检查浏览器控制台的错误信息
2. 确认环境变量配置正确
3. 参考 `SETUP_GUIDE.md` 详细文档
4. 查看 `database-setup.sql` 数据库脚本

---

💡 **提示**: 如果只是想快速体验功能，直接运行 `npm run dev` 即可，系统会自动进入演示模式！
