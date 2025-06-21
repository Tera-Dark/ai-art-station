# 🚨 RLS权限错误快速修复指南

## 问题症状

```
❌ 查询失败: 获取作品列表 "query would be affected by row-level security policy for table \"artworks\""
```

## 🎯 立即解决方案

### 方法1：使用05-fixes.sql（推荐）⭐

1. 打开 `database/05-fixes.sql` 文件
2. 找到 **RLS故障排除专区**
3. 取消注释 **方案B** 的代码块（已经预设为启用状态）
4. 复制整个方案B的代码到Supabase SQL编辑器执行

### 方法2：直接复制执行

复制下面的代码到Supabase SQL编辑器中执行：

```sql
DO $$
BEGIN
    RAISE NOTICE '🚨 开始执行紧急RLS完全禁用...';

    -- 完全禁用所有表的RLS
    ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
    ALTER TABLE artworks DISABLE ROW LEVEL SECURITY;
    ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
    ALTER TABLE likes DISABLE ROW LEVEL SECURITY;
    ALTER TABLE user_favorites DISABLE ROW LEVEL SECURITY;
    ALTER TABLE follows DISABLE ROW LEVEL SECURITY;
    ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
    ALTER TABLE comment_likes DISABLE ROW LEVEL SECURITY;
    ALTER TABLE bookmarks DISABLE ROW LEVEL SECURITY;

    RAISE NOTICE '⚠️ 所有表的RLS已完全禁用！';
END $$;

-- 验证RLS状态
SELECT
    '📊 RLS状态检查' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE
        WHEN rowsecurity THEN '🔒 仍然启用'
        ELSE '✅ 已禁用'
    END as security_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'artworks', 'comments', 'likes', 'user_favorites', 'follows', 'user_settings', 'comment_likes', 'bookmarks')
ORDER BY tablename;

-- 测试查询
SELECT '🧪 测试artworks表查询...' as test_name, COUNT(*) as artwork_count FROM artworks;
SELECT '🎉 RLS禁用完成！所有表现在都可以正常访问。' as final_result;
```

## ✅ 执行步骤

1. **登录Supabase项目**
2. **进入SQL编辑器**
3. **粘贴上面的代码并执行**
4. **确认看到"✅ 已禁用"状态**
5. **回到网站刷新测试**

## 🔍 验证修复成功

执行完成后你应该看到：

- ✅ "所有表的RLS已完全禁用！" 通知
- 📊 所有表的状态显示为"✅ 已禁用"
- 🧪 artworks表查询成功，显示记录数量
- 🎉 "RLS禁用完成！"的最终确认

## ❓ 为什么推荐完全禁用RLS？

- **立即生效**：不依赖复杂的策略规则
- **彻底解决**：完全绕过权限检查机制
- **开发友好**：适合开发环境使用
- **可恢复**：生产环境时可重新启用

## 🚨 注意事项

- 此方案适用于开发环境
- 生产环境建议重新启用RLS并配置适当的策略
- 完全禁用RLS意味着所有用户都能访问所有数据

---

**💡 一旦执行成功，你的AI Art Station应该就能正常运行了！** 🚀
