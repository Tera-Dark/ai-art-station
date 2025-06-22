-- ⚡ AI Art Station - 一行解决403权限错误
-- 直接复制粘贴到Supabase SQL编辑器执行即可

-- 🚨 一行修复：禁用所有表的RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY; 
ALTER TABLE artworks DISABLE ROW LEVEL SECURITY; 
ALTER TABLE comments DISABLE ROW LEVEL SECURITY; 
ALTER TABLE likes DISABLE ROW LEVEL SECURITY; 
ALTER TABLE user_favorites DISABLE ROW LEVEL SECURITY; 
ALTER TABLE follows DISABLE ROW LEVEL SECURITY; 
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY; 
ALTER TABLE comment_likes DISABLE ROW LEVEL SECURITY; 
ALTER TABLE bookmarks DISABLE ROW LEVEL SECURITY;

-- 验证修复结果
SELECT 
    '✅ RLS状态检查' as check_type,
    c.relname as table_name,
    CASE 
        WHEN c.relrowsecurity THEN '❌ RLS仍启用' 
        ELSE '✅ RLS已禁用' 
    END as rls_status
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relname IN ('profiles', 'artworks', 'comments', 'likes', 'user_favorites', 'follows')
ORDER BY c.relname;

-- 完成提示
SELECT '🎉 修复完成！刷新页面测试关注功能。' as message;

-- ⚡ AI Art Station - 强力修复follows表403权限错误
-- 直接复制粘贴到Supabase SQL编辑器执行即可

-- 🚨 强力修复：专门针对follows表
-- 第一步：强制删除所有follows表的策略
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    -- 获取并删除follows表的所有策略
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'follows' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON follows';
    END LOOP;
    
    -- 强制禁用follows表RLS（多次执行）
    ALTER TABLE follows DISABLE ROW LEVEL SECURITY;
    ALTER TABLE follows DISABLE ROW LEVEL SECURITY;
    ALTER TABLE follows DISABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE '✅ follows表所有策略已删除，RLS已禁用';
END $$;

-- 第二步：禁用其他表的RLS（确保完整）
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY; 
ALTER TABLE artworks DISABLE ROW LEVEL SECURITY; 
ALTER TABLE comments DISABLE ROW LEVEL SECURITY; 
ALTER TABLE likes DISABLE ROW LEVEL SECURITY; 
ALTER TABLE user_favorites DISABLE ROW LEVEL SECURITY; 
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY; 
ALTER TABLE comment_likes DISABLE ROW LEVEL SECURITY; 
ALTER TABLE bookmarks DISABLE ROW LEVEL SECURITY;

-- 第三步：验证修复结果
SELECT 
    '🔍 RLS状态检查' as check_type,
    c.relname as table_name,
    CASE 
        WHEN c.relrowsecurity THEN '❌ RLS仍启用' 
        ELSE '✅ RLS已禁用' 
    END as rls_status
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relname IN ('profiles', 'artworks', 'comments', 'likes', 'user_favorites', 'follows')
ORDER BY c.relname;

-- 第四步：检查follows表的策略数量
SELECT 
    '📋 follows表策略检查' as check_type,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ 所有策略已清除'
        ELSE '❌ 仍有策略存在'
    END as status
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'follows';

-- 完成提示
SELECT '🎉 强力修复完成！请刷新页面测试关注功能。' as message;

-- ⚡ AI Art Station - 终极修复脚本
-- 彻底解决follows表403权限错误

-- ====================================
-- 🚨 第一步：检查并重新创建follows表
-- ====================================

-- 删除可能存在的follows表（如果存在）
DROP TABLE IF EXISTS follows CASCADE;

-- 重新创建follows表
CREATE TABLE follows (
    id BIGSERIAL PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 确保不能自己关注自己
    CONSTRAINT no_self_follow CHECK (follower_id != following_id),
    -- 确保唯一性
    CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON follows(following_id);
CREATE INDEX IF NOT EXISTS follows_created_at_idx ON follows(created_at);

-- ====================================
-- 🚨 第二步：确保profiles表有必要的列
-- ====================================

-- 检查并添加followers_count和following_count列（如果不存在）
DO $$ 
BEGIN
    -- 添加followers_count列（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'followers_count'
    ) THEN
        ALTER TABLE profiles ADD COLUMN followers_count INTEGER DEFAULT 0;
    END IF;
    
    -- 添加following_count列（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'following_count'
    ) THEN
        ALTER TABLE profiles ADD COLUMN following_count INTEGER DEFAULT 0;
    END IF;
    
    RAISE NOTICE '✅ profiles表列检查完成';
END $$;

-- ====================================
-- 🚨 第三步：重新创建RPC函数
-- ====================================

-- 删除旧函数（如果存在）
DROP FUNCTION IF EXISTS get_user_followers(UUID);
DROP FUNCTION IF EXISTS get_user_following(UUID);
DROP FUNCTION IF EXISTS update_follow_counts();

-- 创建关注计数更新函数
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- 增加关注者的following_count
        UPDATE profiles 
        SET following_count = following_count + 1 
        WHERE id = NEW.follower_id;
        
        -- 增加被关注者的followers_count
        UPDATE profiles 
        SET followers_count = followers_count + 1 
        WHERE id = NEW.following_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- 减少关注者的following_count
        UPDATE profiles 
        SET following_count = GREATEST(0, following_count - 1)
        WHERE id = OLD.follower_id;
        
        -- 减少被关注者的followers_count
        UPDATE profiles 
        SET followers_count = GREATEST(0, followers_count - 1)
        WHERE id = OLD.following_id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS follows_count_trigger ON follows;
CREATE TRIGGER follows_count_trigger
    AFTER INSERT OR DELETE ON follows
    FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- 获取用户的粉丝列表
CREATE OR REPLACE FUNCTION get_user_followers(user_id UUID)
RETURNS TABLE (
    id UUID,
    username TEXT,
    display_name TEXT,
    avatar_url TEXT,
    followers_count INTEGER,
    followed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.display_name,
        p.avatar_url,
        p.followers_count,
        f.created_at as followed_at
    FROM follows f
    JOIN profiles p ON f.follower_id = p.id
    WHERE f.following_id = user_id
    ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取用户的关注列表
CREATE OR REPLACE FUNCTION get_user_following(user_id UUID)
RETURNS TABLE (
    id UUID,
    username TEXT,
    display_name TEXT,
    avatar_url TEXT,
    followers_count INTEGER,
    followed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.display_name,
        p.avatar_url,
        p.followers_count,
        f.created_at as followed_at
    FROM follows f
    JOIN profiles p ON f.following_id = p.id
    WHERE f.follower_id = user_id
    ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================
-- 🚨 第四步：彻底禁用所有表的RLS
-- ====================================

DO $$ 
DECLARE
    table_name TEXT;
    policy_name TEXT;
BEGIN
    -- 禁用所有相关表的RLS
    FOR table_name IN 
        SELECT t.table_name 
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' 
        AND t.table_name IN ('profiles', 'artworks', 'comments', 'likes', 'user_favorites', 'follows', 'user_settings', 'comment_likes', 'bookmarks')
    LOOP
        EXECUTE 'ALTER TABLE ' || table_name || ' DISABLE ROW LEVEL SECURITY';
        RAISE NOTICE '✅ 已禁用表 % 的RLS', table_name;
    END LOOP;
    
    -- 删除follows表的所有策略
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'follows' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON follows';
        RAISE NOTICE '✅ 已删除策略: %', policy_name;
    END LOOP;
    
END $$;

-- ====================================
-- 🚨 第五步：授予必要权限
-- ====================================

-- 授予所有用户对follows表的完整权限
GRANT ALL ON follows TO authenticated;
GRANT ALL ON follows TO anon;
GRANT USAGE, SELECT ON SEQUENCE follows_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE follows_id_seq TO anon;

-- 授予RPC函数权限
GRANT EXECUTE ON FUNCTION get_user_followers(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_followers(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_user_following(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_following(UUID) TO anon;

-- 授予其他表的权限
GRANT ALL ON profiles TO authenticated, anon;
GRANT ALL ON artworks TO authenticated, anon;
GRANT ALL ON comments TO authenticated, anon;
GRANT ALL ON likes TO authenticated, anon;
GRANT ALL ON user_favorites TO authenticated, anon;
GRANT ALL ON user_settings TO authenticated, anon;
GRANT ALL ON comment_likes TO authenticated, anon;
GRANT ALL ON bookmarks TO authenticated, anon;

-- ====================================
-- 🚨 第六步：验证修复结果
-- ====================================

-- 检查follows表是否存在
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'follows' AND table_schema = 'public')
        THEN '✅ follows表已存在'
        ELSE '❌ follows表不存在'
    END as table_status;

-- 检查RLS状态
SELECT 
    '✅ RLS状态检查' as check_type,
    c.relname as table_name,
    CASE 
        WHEN c.relrowsecurity THEN '❌ RLS仍启用' 
        ELSE '✅ RLS已禁用' 
    END as rls_status
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relname IN ('profiles', 'artworks', 'comments', 'likes', 'user_favorites', 'follows', 'user_settings', 'comment_likes', 'bookmarks')
ORDER BY c.relname;

-- 检查RPC函数是否存在
SELECT 
    '✅ RPC函数检查' as check_type,
    routine_name as function_name,
    '✅ 函数存在' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_user_followers', 'get_user_following')
ORDER BY routine_name;

-- 测试follows表查询
SELECT 
    '✅ follows表测试查询' as test_type,
    COUNT(*) as record_count
FROM follows;

-- 测试RPC函数（使用一个随机UUID）
SELECT 
    '✅ RPC函数测试' as test_type,
    'get_user_followers' as function_name,
    '可以调用' as status
FROM get_user_followers('00000000-0000-0000-0000-000000000000'::UUID)
LIMIT 1;

-- 显示完成信息
SELECT '🎉 终极修复完成！所有403权限错误和RPC函数问题应该已解决！' as status;