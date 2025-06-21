# AI Art Station 数据库配置文件

## 📁 文件结构说明

这个文件夹包含 AI Art Station 项目的所有 Supabase 数据库配置文件，已按功能模块化重新整理：

### 📋 执行顺序 (推荐)

1. **🚀 一键完整设置 (推荐)**

   - `00-complete-setup.sql` - **完整设置脚本，包含所有功能**

2. **📦 分步骤设置 (可选)**
   - `01-tables.sql` - 基础表结构 + 索引
   - `02-policies.sql` - 行级安全策略 (RLS)
   - `03-functions.sql` - 函数和触发器
   - `04-storage.sql` - 存储桶和文件策略
   - `05-fixes.sql` - 修复脚本和数据维护

---

## 🎯 使用方法

### 方法一：一键设置 (推荐) ⭐

```sql
-- 在 Supabase SQL 编辑器中运行
-- 包含完整的数据库设置 + 验证
\i 00-complete-setup.sql
```

### 方法二：分步设置

```sql
-- 按顺序执行以下文件：
\i 01-tables.sql      -- 创建表结构
\i 02-policies.sql    -- 设置安全策略
\i 03-functions.sql   -- 创建函数和触发器
\i 04-storage.sql     -- 配置文件存储
\i 05-fixes.sql       -- 修复和维护（可选）
```

---

## 📊 包含的功能

### 🗄️ 数据表 (9个)

| 表名             | 用途        | 主要字段                                                                  |
| ---------------- | ----------- | ------------------------------------------------------------------------- |
| `profiles`       | 用户资料    | username, display_name, avatar_url, bio, followers_count, following_count |
| `user_settings`  | 用户设置    | 通知、隐私、显示、内容设置                                                |
| `artworks`       | 作品信息    | title, description, prompt, image_url, tags                               |
| `comments`       | 评论系统    | content, artwork_id, user_id, parent_id                                   |
| `likes`          | 作品点赞    | user_id, artwork_id                                                       |
| `comment_likes`  | 评论点赞    | user_id, comment_id                                                       |
| `bookmarks`      | 收藏 (原始) | user_id, artwork_id                                                       |
| `user_favorites` | 收藏 (代码) | user_id, artwork_id                                                       |
| `follows`        | 关注关系    | follower_id, following_id                                                 |

### 🔒 安全功能

- **行级安全策略 (RLS)** - 保护用户数据
- **访问控制** - 精确的权限管理
- **数据验证** - 确保数据完整性

### ⚡ 自动化功能

- **自动计数** - 点赞数、评论数、关注统计自动更新
- **时间戳** - 自动更新 `updated_at` 字段
- **用户注册** - 自动创建用户资料
- **关注统计** - 自动维护关注者和被关注者计数

### 📁 文件存储

- **作品存储桶** (`artworks`) - 上传的作品图片
- **头像存储桶** (`avatars`) - 用户头像
- **访问策略** - 公开读取、私有写入

### 🚀 性能优化

- **数据库索引** - 优化查询性能
- **GIN 索引** - 支持标签数组搜索
- **时间排序** - 按创建时间快速排序

---

## 🛠️ 文件说明

### `00-complete-setup.sql` ⭐

**完整的一键设置脚本**

- 包含所有表、策略、函数、触发器
- 内置验证和错误检查
- **新增RLS故障排除专区**（已注释，按需启用）
- 推荐用于初次设置和重置

### `01-tables.sql`

**基础表结构**

- 创建 8 个主要数据表
- 添加性能优化索引
- 不包含安全策略

### `02-policies.sql`

**安全策略配置**

- 启用所有表的 RLS
- 配置精确的访问权限
- 保护用户数据安全
- **内置RLS故障排除选项** (已注释，按需启用)

### `03-functions.sql`

**函数和触发器**

- 自动更新字段功能
- 计数统计功能
- 用户注册自动化

### `04-storage.sql`

**存储桶配置**

- 创建文件存储桶
- 配置访问策略
- 支持图片上传

### `05-fixes.sql`

**修复脚本和数据维护**

- 用户Profile修复
- 统计数据修复
- 数据完整性检查
- 缺失字段补充
- **RLS故障排除专区** (包含两种修复方案)
  - 方案A：超级宽松策略修复（备选）
  - 方案B：紧急RLS完全禁用（⭐推荐，已启用）

---

## ✅ 验证步骤

### 1. 检查表创建

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'user_settings', 'artworks', 'comments', 'likes', 'comment_likes', 'bookmarks', 'user_favorites', 'follows');
```

### 2. 检查存储桶

```sql
SELECT name, public
FROM storage.buckets
WHERE name IN ('artworks', 'avatars');
```

### 3. 检查策略

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

---

## 🔧 故障排除

### 常见问题

1. **🚨 RLS权限错误** (最常见)

   - **错误信息**：`"query would be affected by row-level security policy"`
   - **解决方案**：
     - **🎯 推荐方案**：在 `05-fixes.sql` 中取消注释"方案B"（RLS完全禁用）
     - **备选方案**：在 `05-fixes.sql` 中取消注释"方案A"（超级宽松策略）
     - **一体化解决**：可在 `00-complete-setup.sql` 末尾使用RLS故障排除专区
     - **预防措施**：可在 `02-policies.sql` 中使用内置的故障排除选项

2. **收藏功能报错**

   - 原因：缺少 `user_favorites` 表
   - 解决：运行 `00-complete-setup.sql`

3. **文件上传失败**

   - 原因：存储桶未创建或策略配置错误
   - 解决：检查 `04-storage.sql` 是否执行成功

4. **用户设置无法保存**
   - 原因：缺少 `user_settings` 表
   - 解决：确认 `01-tables.sql` 已执行

### 重置数据库

如需完全重置：

```sql
-- 删除所有表 (谨慎操作!)
DROP TABLE IF EXISTS user_favorites, bookmarks, comment_likes, likes, comments, artworks, user_settings, profiles CASCADE;

-- 删除存储桶
DELETE FROM storage.buckets WHERE name IN ('artworks', 'avatars');

-- 重新运行完整设置
\i 00-complete-setup.sql
```

---

## 📝 更新日志

- **v2.0** - 重新模块化设计，功能明确分工，无重复内容
- **v1.0** - 初始版本，包含所有基础功能

---

## 💡 使用建议

1. **首次设置**：直接使用 `00-complete-setup.sql`
2. **问题修复**：根据具体问题选择对应的模块文件
3. **功能扩展**：在对应的模块文件中添加新功能
4. **备份还原**：定期备份数据库结构和数据

⚠️ **注意**：在生产环境中执行任何 SQL 脚本前，请务必先备份数据库！
