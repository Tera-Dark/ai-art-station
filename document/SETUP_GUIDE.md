# AI Art Station 设置指南

本指南将帮助您设置 AI Art Station 项目所需的所有环境变量和服务。

## 1. Supabase 设置

### 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com/) 并登录或注册
2. 创建一个新项目
3. 记下您的项目 URL 和匿名密钥（anon key）

### 设置存储桶

1. 在 Supabase 控制台中，转到 **Storage** 部分
2. 创建两个存储桶：
   - `artworks` - 用于存储用户上传的作品
   - `avatars` - 用于存储用户头像
3. 设置存储桶权限：
   - 对于 `artworks` 和 `avatars` 存储桶，设置为公开访问（Public）
   - 在 **Policies** 部分，添加适当的权限策略：
     - 允许已认证用户上传文件
     - 允许所有用户查看文件

> **注意**：如果您没有手动创建存储桶，应用会尝试自动创建，但需要确保您的 Supabase 服务角色密钥（Service Role Key）具有足够权限。

### 设置数据库表

本项目需要以下数据库表：

1. `profiles` - 用户个人资料
2. `artworks` - 艺术作品
3. `likes` - 点赞记录
4. `bookmarks` - 收藏记录
5. `comments` - 评论

您可以通过 SQL 编辑器或界面创建这些表。

## 2. 图片上传备选方案

本项目实现了多级图片上传备选方案，以确保在各种环境下都能正常工作：

### 2.1 Cloudinary 设置（可选）

1. 访问 [Cloudinary](https://cloudinary.com/) 并创建一个账户
2. 在控制台中，获取您的 Cloud Name、API Key 和 API Secret
3. 创建一个上传预设（Upload Preset）：
   - 名称设为 `ai_art_station` 或自定义名称
   - 设置为 `Unsigned`（无需签名）

### 2.2 ImgBB 设置（推荐备选方案）

1. 访问 [ImgBB](https://api.imgbb.com/) 并注册一个账户
2. 获取您的 API 密钥
3. 将 API 密钥添加到环境变量中

## 3. 环境变量设置

1. 复制 `env.example` 文件并重命名为 `.env.local`
2. 填入您的服务凭据：

```
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudinary 配置（可选）
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# ImgBB 配置（推荐备选方案）
NEXT_PUBLIC_IMGBB_API_KEY=your-imgbb-api-key

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 4. 启动应用

设置完成后，您可以启动应用：

```bash
npm install
npm run dev
```

访问 http://localhost:3000 查看您的应用。

## 5. 故障排除

### 图片上传问题

本项目实现了三级图片上传方案：

1. **Supabase Storage**（首选）：需要正确配置存储桶
2. **ImgBB API**（备选）：当Supabase上传失败时自动尝试
3. **本地URL**（最终备选）：仅用于演示目的，页面刷新后图片将丢失

#### "Bucket not found" 错误

如果您看到 "Bucket not found" 错误：

1. 确认您已在 Supabase 中创建了 `artworks` 和 `avatars` 存储桶
2. 检查存储桶名称是否完全匹配（区分大小写）
3. 确认您的 Supabase URL 和密钥正确无误
4. 查看应用启动日志中的存储桶初始化信息

#### 上传失败

如果图片上传失败：

1. 检查浏览器控制台中的错误信息
2. 确认您的 Supabase 存储桶权限设置正确
3. 尝试使用较小的图片文件（<10MB）
4. 确保您已配置 ImgBB API 密钥作为备选方案

### 其他问题

如果您遇到其他问题，请查看浏览器控制台中的错误信息，这些信息通常会指出问题所在。
