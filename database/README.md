# AI Art Station 数据库配置

这个目录包含了 AI Art Station 项目的完整数据库配置文件，支持 Supabase PostgreSQL 数据库。

## 📁 文件结构

```
database/
├── 00-complete-setup.sql    # 🎯 一键完整配置（推荐）
├── 01-tables.sql           # 📋 数据表结构
├── 02-policies.sql         # 🔒 RLS 安全策略
├── 03-functions.sql        # ⚙️ 数据库函数和触发器
├── 04-storage.sql          # 📁 存储配置
├── 05-fixes.sql           # 🔧 修复和故障排除
└── README.md              # 📖 说明文档
```

## 🚀 快速开始

### 方案1: 一键配置（推荐）

```sql
-- 在 Supabase SQL 编辑器中执行
\i 00-complete-setup.sql
```

### 方案2: 分步配置

```sql
-- 按顺序执行以下文件
\i 01-tables.sql
\i 02-policies.sql
\i 03-functions.sql
\i 04-storage.sql
```

### 方案3: 修复现有问题

```sql
-- 如果遇到权限或配置问题
\i 05-fixes.sql
```

## 📋 数据表结构

### 核心表

- **profiles** - 用户资料
- **artworks** - 艺术作品
- **comments** - 评论系统
- **likes** - 点赞系统
- **follows** - 关注系统 ✨ (已优化)
- **user_favorites** - 收藏系统

### 扩展表

- **user_settings** - 用户设置
- **comment_likes** - 评论点赞
- **bookmarks** - 书签功能

## 🔒 安全策略 (RLS)

### Row Level Security 配置

所有表都启用了 RLS，确保数据安全：

- **公开可见**: `artworks`, `comments`, `profiles`, `follows`
- **私有数据**: `user_settings`, `user_favorites`, `bookmarks`
- **混合权限**: `likes`, `comment_likes`

### 最新优化 ✨

#### 关注功能权限修复 (2025-01-27)

- **问题**: `follows` 表权限冲突，导致 403 Forbidden 错误
- **修复**: 统一所有配置文件中的策略命名和逻辑
- **优化**:
  - 清除所有可能冲突的旧策略
  - 使用一致的策略命名: `follows_select_policy`, `follows_insert_policy`, `follows_delete_policy`
  - 添加防止自关注的检查: `follower_id != following_id`
  - 增强权限验证: 确保只有认证用户可以操作

```sql
-- 新的统一策略
CREATE POLICY "follows_select_policy" ON follows
    FOR SELECT USING (true);

CREATE POLICY "follows_insert_policy" ON follows
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
        AND auth.uid() = follower_id
        AND follower_id != following_id
    );

CREATE POLICY "follows_delete_policy" ON follows
    FOR DELETE USING (
        auth.role() = 'authenticated'
        AND auth.uid() = follower_id
    );
```

## ⚙️ 数据库函数

### 自动触发器

- **用户注册**: 自动创建 profile 和 settings
- **计数更新**: 自动维护点赞数、评论数、关注数
- **时间戳**: 自动更新 `updated_at` 字段

### 查询函数

- `get_user_followers(user_id)` - 获取粉丝列表
- `get_user_following(user_id)` - 获取关注列表
- `get_artworks_with_profiles()` - 获取作品和用户信息

## 📁 存储配置

### Supabase Storage

- **bucket**: `artworks` - 存储用户上传的图片
- **策略**: 认证用户可上传，所有人可查看
- **格式**: 支持 JPG, PNG, WebP, GIF
- **大小**: 最大 10MB

## 🔧 故障排除

### 常见问题

#### 1. RLS 权限错误

```
ERROR: permission denied for table xxx
```

**解决方案**: 执行 `05-fixes.sql` 中的相应修复

#### 2. 关注功能 403 错误 ✨

```
GET /rest/v1/follows 403 (Forbidden)
```

**解决方案**: 已在所有配置文件中修复，执行任一配置文件即可

#### 3. 策略冲突

```
ERROR: policy "xxx" already exists
```

**解决方案**: 配置文件已包含 `DROP POLICY IF EXISTS` 清理语句

### 紧急修复选项

如果遇到严重权限问题，可以临时禁用 RLS：

```sql
-- 🚨 紧急情况：完全禁用 RLS
ALTER TABLE follows DISABLE ROW LEVEL SECURITY;

-- 或者使用超级宽松策略
CREATE POLICY "emergency_policy" ON follows
    FOR ALL USING (true) WITH CHECK (true);
```

## 📊 数据迁移

### 版本更新

- **v1.0**: 基础表结构
- **v1.1**: 添加关注系统
- **v1.2**: 优化 RLS 策略 ✨
- **v1.3**: 修复权限冲突，统一策略命名

### 备份建议

在执行重大更新前，建议：

1. 导出现有数据
2. 在测试环境验证
3. 逐步迁移到生产环境

## 🤝 贡献指南

### 添加新表

1. 在 `01-tables.sql` 中定义表结构
2. 在 `02-policies.sql` 中添加 RLS 策略
3. 更新 `00-complete-setup.sql` 以包含新配置
4. 在 `05-fixes.sql` 中添加故障排除选项

### 策略命名规范 ✨

- 格式: `{table_name}_{operation}_policy`
- 示例: `follows_select_policy`, `artworks_insert_policy`
- 确保在所有文件中保持一致

## 📞 支持

如果遇到数据库配置问题：

1. 查看 `QUICK_FIX_GUIDE.md` 中的解决方案
2. 执行 `05-fixes.sql` 中的修复脚本
3. 检查 Supabase 控制台的错误日志

---

**最后更新**: 2025年1月27日  
**版本**: v1.3 (关注功能权限优化版)
