# 🚨 AI Art Station 紧急修复指南

## 问题症状

- 控制台出现"获取作品失败: [object Object]"
- 页面显示"获取作品失败"错误
- 点赞、评论、收藏功能不工作
- RLS策略权限错误 (42501)

## 🔧 快速修复步骤

### 第1步：执行数据库修复脚本

1. **登录Supabase控制台**

   - 访问 [supabase.com](https://supabase.com)
   - 进入你的项目

2. **打开SQL编辑器**

   - 点击左侧菜单的"SQL Editor"
   - 创建新查询

3. **执行修复脚本**

   - 复制 `database/05-fixes.sql` 文件的全部内容
   - 粘贴到SQL编辑器中
   - 点击"Run"按钮执行

4. **验证执行结果**
   - 查看执行结果，应该显示表创建成功
   - 最后应该看到"🎉 数据库修复完成！"消息

### 第2步：测试应用功能

1. **访问调试页面**

   ```
   http://localhost:3000/debug
   ```

2. **运行简单测试**

   - 点击"运行简单测试"按钮
   - 检查是否有错误信息
   - 确认数据库连接正常

3. **测试主要功能**
   - 访问主页，确认作品列表加载
   - 测试点赞功能
   - 测试评论功能
   - 测试收藏功能

## 📋 修复脚本内容概览

修复脚本会执行以下操作：

1. **重新创建表结构**

   - profiles (用户资料)
   - artworks (作品)
   - comments (评论)
   - likes (点赞)
   - user_favorites (收藏)
   - follows (关注)

2. **重置RLS策略**

   - 清理旧策略
   - 创建新的安全策略
   - 确保权限正确

3. **创建索引**

   - 优化查询性能
   - 加速数据检索

4. **插入测试数据**
   - 创建默认用户资料
   - 插入示例作品（如果需要）

## ⚠️ 注意事项

1. **备份数据**

   - 执行修复前建议备份重要数据
   - 可以通过Supabase控制台导出数据

2. **权限确认**

   - 确保你有数据库管理权限
   - 某些操作需要超级用户权限

3. **环境变量**
   - 确认 `.env.local` 文件配置正确
   - 检查Supabase连接信息

## 🔍 故障排除

### 如果修复脚本执行失败

1. **检查错误信息**

   - 查看具体错误代码
   - 记录错误详情

2. **分段执行**

   - 将脚本分成小段执行
   - 逐步定位问题

3. **权限问题**
   ```sql
   -- 如果遇到权限问题，可能需要先执行：
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
   ```

### 如果应用仍有问题

1. **清除缓存**

   - 重启开发服务器
   - 清除浏览器缓存

2. **检查网络连接**

   - 确认能访问Supabase
   - 检查API密钥是否正确

3. **查看控制台日志**
   - 打开浏览器开发者工具
   - 查看Network和Console标签

## 📞 获取帮助

如果修复后仍有问题，请提供以下信息：

1. 具体错误信息
2. 浏览器控制台截图
3. 修复脚本执行结果
4. 应用版本和环境信息

## ✅ 修复成功标志

修复成功后，你应该看到：

- ✅ 主页作品列表正常加载
- ✅ 无控制台错误信息
- ✅ 点赞、评论、收藏功能正常
- ✅ 用户资料显示正确
- ✅ 调试页面测试全部通过

## 📋 已修复的问题

### ✅ 2025年1月28日 - 回复输入框文本覆盖问题

**问题描述：**

- 评论区的回复输入框输入文字时，只能输入一个字母就被覆盖
- 用户无法正常输入完整的回复内容

**根本原因：**

- `CommentSection` 组件中所有回复输入框共享同一个 `replyText` 状态
- 当有多个回复框时，它们之间会相互覆盖输入内容

**修复方案：**

1. **状态管理重构**：

   - 将 `replyText: string` 改为 `replyTexts: { [commentId: string]: string }`
   - 每个评论的回复框都有独立的文本状态

2. **输入框处理**：

   ```typescript
   // 修复前
   value={replyText}
   onChange={e => setReplyText(e.target.value)}

   // 修复后
   value={replyTexts[comment.id] || ''}
   onChange={e => setReplyTexts(prev => ({ ...prev, [comment.id]: e.target.value }))}
   ```

3. **提交逻辑优化**：

   ```typescript
   // 修复前
   if (!replyText.trim() || !user || submitting) return

   // 修复后
   const currentReplyText = replyTexts[parentId] || ''
   if (!currentReplyText.trim() || !user || submitting) return
   ```

4. **清理机制**：
   ```typescript
   // 提交成功后清空对应评论的回复文本
   setReplyTexts(prev => ({ ...prev, [parentId]: '' }))
   ```

**文件修改：**

- `src/components/features/comment-section.tsx`

**测试结果：**

- ✅ 构建成功，无类型错误
- ✅ 每个回复框可以独立输入文字
- ✅ 不再出现文字覆盖问题

### ✅ 2025年1月28日 - 回复输入框焦点丢失问题

**问题描述：**

- 回复输入框每输入一个字符就失去焦点
- 用户需要重复点击才能继续输入，体验很差

**根本原因：**

- `CommentItem` 组件每次渲染都被重新创建
- 其他依赖函数也没有使用 `useCallback` 优化
- React 认为是新组件，导致输入框失去焦点

**修复方案：**

1. **组件优化**：

   ```typescript
   // 为所有函数添加 useCallback 优化
   const fetchComments = useCallback(async () => { ... }, [artworkId, onCommentCountChange])
   const handleSubmitReply = useCallback(async (e, parentId) => { ... }, [replyTexts, user, submitting, artworkId, fetchComments])
   const handleLike = useCallback(async (commentId) => { ... }, [user, fetchComments])
   const formatTime = useCallback((dateString) => { ... }, [])
   const generateAvatar = useCallback((username) => { ... }, [])
   const CommentItem = useCallback(({ comment, isReply }) => { ... }, [相关依赖])
   ```

2. **输入框优化**：
   ```typescript
   // 添加唯一 key 和自动聚焦
   <textarea
     key={`reply-input-${comment.id}`}
     value={replyTexts[comment.id] || ''}
     onChange={...}
     autoFocus
   />
   ```

**文件修改：**

- `src/components/features/comment-section.tsx`

**测试结果：**

- ✅ 构建成功，优化了依赖关系
- ✅ 回复输入框保持焦点状态
- ✅ 输入体验流畅，无需重复点击

### ✅ 2025年1月28日 - AI模型预设大幅更新

**新增内容：**

- 新增 45+ 个2025年最新AI模型
- 新增 Flux、NovelAI、Lumina、Noob 等热门系列
- 新增 13 个高级采样器
- 新增 7 个最新AI工具

**详细内容参见：** `AI_MODELS_UPDATE.md`

---

## 🛠️ 修复工具和方法

### 状态管理问题诊断

1. **检查组件状态共享**：确认是否多个组件实例共享同一状态
2. **输入框 value/onChange 检查**：确保每个输入框有独立的状态管理
3. **useEffect 依赖检查**：确保状态更新不会意外触发

### 输入框最佳实践

1. **独立状态管理**：每个输入框应该有自己的状态或状态键
2. **受控组件模式**：使用 `value + onChange` 模式
3. **防抖优化**：对于实时搜索等场景考虑防抖

### 调试技巧

1. **控制台状态监控**：`console.log(states)` 查看状态变化
2. **React Developer Tools**：查看组件状态和props
3. **类型检查**：使用 TypeScript 预防类型相关错误

---

## 📚 相关文档

- [AI模型更新文档](./AI_MODELS_UPDATE.md)
- [项目优化计划](./PROJECT_OPTIMIZATION.md)
- [数据库修复记录](./database/CHANGELOG.md)

---

_最后更新：2025年1月28日_

## 数据库权限问题修复

### 问题: 多个表出现 403 权限错误

**现象**:

```
GET https://xxx.supabase.co/rest/v1/follows 403 (Forbidden)
GET https://xxx.supabase.co/rest/v1/likes 403 (Forbidden)
GET https://xxx.supabase.co/rest/v1/user_favorites 403 (Forbidden)
检查关注状态失败、检查点赞状态失败、检查收藏状态失败
```

**原因**: Supabase RLS (Row Level Security) 策略配置错误或冲突

### 🚨 一键修复方案（推荐）

#### 方案1: 执行05-fixes.sql ⭐ **最简单最有效**

在Supabase SQL编辑器中执行 `database/05-fixes.sql`

- ✅ 文件开头已包含所有403权限修复
- ✅ 自动禁用所有表的RLS
- ✅ 清除所有冲突策略
- ✅ 包含验证和测试

#### 方案2: 执行00-complete-setup.sql（完整重建）

在Supabase SQL编辑器中执行 `database/00-complete-setup.sql`

- ✅ 文件开头已包含紧急权限修复
- ✅ 完整的数据库结构重建

### 📋 快速操作步骤

1. **登录Supabase控制台**
2. **进入SQL编辑器**
3. **复制粘贴** `database/05-fixes.sql` 中的全部内容
4. **点击执行** ▶️
5. **等待执行完成**（看到绿色的成功提示）
6. **刷新应用页面** - 所有403错误都应该消失了！

### 💡 如果仍有问题

如果执行后仍有403错误，请在Supabase SQL编辑器中再执行一次：

```sql
ALTER TABLE follows DISABLE ROW LEVEL SECURITY;
```

### 🔧 如果方案1无效

执行 `database/00-complete-setup.sql` 进行完整重建

### ✅ 验证修复效果

执行修复后，在浏览器控制台应该看到：

- ✅ 关注功能正常工作
- ✅ 点赞功能正常工作
- ✅ 收藏功能正常工作
- ❌ 不再出现403权限错误

### 验证修复

1. 在浏览器控制台检查是否还有403错误
2. 测试关注/取消关注功能
3. 检查关注状态是否正确显示

**修复相关文件**:

- `database/00-complete-setup.sql` - 完整数据库配置
- `database/02-policies.sql` - RLS策略配置
- `database/05-fixes.sql` - 修复和故障排除
- `src/lib/services/follow.service.ts` - 关注服务逻辑

## 数据库权限问题

### 常见RLS错误

如果遇到其他表的权限问题，可以参考以下模式：

```sql
-- 检查当前策略
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'your_table_name';

-- 删除冲突策略
DROP POLICY IF EXISTS "old_policy_name" ON your_table_name;

-- 创建新策略
CREATE POLICY "new_policy_name" ON your_table_name
    FOR SELECT USING (true);
```

### 紧急RLS完全禁用

```sql
-- 对所有表禁用RLS（仅用于紧急情况）
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE artworks DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE follows DISABLE ROW LEVEL SECURITY;
```

## 部署相关问题

### Vercel部署前检查

1. 确保 `npm run build` 无错误
2. 检查环境变量配置
3. 验证数据库连接

### 常用命令

```bash
# 构建检查
npm run build

# 代码质量检查
npm run lint

# 类型检查
npx tsc --noEmit
```

## 最新修复记录

### 2025-01-27: 关注功能权限修复

- **问题**: follows表权限错误，403 Forbidden
- **修复**: 优化了所有数据库配置文件中的follows策略，统一策略命名和逻辑
- **修改文件**: `00-complete-setup.sql`, `02-policies.sql`, `05-fixes.sql`
- **状态**: ✅ 数据库配置已整合优化，删除冲突策略，统一权限配置

### 2025-01-27: 评论系统修复

- **问题**: 回复输入框文本覆盖和焦点丢失
- **修复**: 使用独立状态管理和useCallback优化
- **状态**: ✅ 已完成并测试

---

**注意**: 对于数据库相关的修复，建议先在测试环境中验证，然后再应用到生产环境。

## 🚨 紧急修复：403权限错误

### ⚡ 超级简单一行修复（推荐）

**直接复制以下SQL到Supabase SQL编辑器执行：**

```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY; ALTER TABLE artworks DISABLE ROW LEVEL SECURITY; ALTER TABLE comments DISABLE ROW LEVEL SECURITY; ALTER TABLE likes DISABLE ROW LEVEL SECURITY; ALTER TABLE user_favorites DISABLE ROW LEVEL SECURITY; ALTER TABLE follows DISABLE ROW LEVEL SECURITY; ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY; ALTER TABLE comment_likes DISABLE ROW LEVEL SECURITY; ALTER TABLE bookmarks DISABLE ROW LEVEL SECURITY;
```

**执行后刷新页面，403错误立即解决！**

---

## 其他修复方案

### 方案1：执行完整修复脚本

```sql
-- 在Supabase SQL编辑器中执行
-- 复制database/05-fixes.sql的内容
```

### 方案2：执行完整数据库配置

```sql
-- 在Supabase SQL编辑器中执行
-- 复制database/00-complete-setup.sql的内容
```

## 🔍 问题排查步骤

### 1. 确认问题

控制台出现类似错误：

```
GET /rest/v1/follows 403 (Forbidden)
permission denied for table follows
```

### 2. 执行修复

- 打开 [Supabase Dashboard](https://supabase.com/dashboard)
- 进入你的项目
- 点击左侧 "SQL Editor"
- 粘贴上面的一行修复SQL
- 点击 "Run" 执行

### 3. 验证修复

- 刷新你的应用页面
- 检查控制台是否还有403错误
- 测试关注功能是否正常

## 📋 常见问题

### Q: 为什么要禁用RLS？

A: 在开发环境中，RLS权限配置复杂，容易出现冲突。禁用RLS可以快速解决权限问题，专注于功能开发。

### Q: 生产环境安全吗？

A: 本修复主要用于开发环境。生产环境建议重新配置适当的RLS策略。

### Q: 如何重新启用RLS？

A: 执行以下SQL：

```sql
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
-- 然后重新创建相应的策略
```

## 🎯 修复成功标志

执行修复后，你应该看到：

- ✅ 控制台没有403错误
- ✅ 关注功能正常工作
- ✅ 其他功能不受影响

---

_最后更新: 2025-01-27_
