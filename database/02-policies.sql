-- AI Art Station - 安全策略设置
-- 第2步：设置行级安全策略 (RLS)

-- ====================================
-- 启用所有表的 RLS
-- ====================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- ====================================
-- 用户资料表策略
-- ====================================

-- 清除旧策略
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 新策略
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- ====================================
-- 用户设置表策略
-- ====================================

-- 清除旧策略
DROP POLICY IF EXISTS "User settings are viewable by owner" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;

-- 新策略
CREATE POLICY "User settings are viewable by owner" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- ====================================
-- 作品表策略
-- ====================================

-- 清除旧策略
DROP POLICY IF EXISTS "Artworks are viewable by everyone" ON artworks;
DROP POLICY IF EXISTS "Users can insert their own artworks" ON artworks;
DROP POLICY IF EXISTS "Users can update their own artworks" ON artworks;
DROP POLICY IF EXISTS "Users can delete their own artworks" ON artworks;

-- 新策略
CREATE POLICY "Artworks are viewable by everyone" ON artworks
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own artworks" ON artworks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own artworks" ON artworks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own artworks" ON artworks
    FOR DELETE USING (auth.uid() = user_id);

-- ====================================
-- 评论表策略
-- ====================================

-- 清除旧策略
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

-- 新策略
CREATE POLICY "Comments are viewable by everyone" ON comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments" ON comments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own comments" ON comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON comments
    FOR DELETE USING (auth.uid() = user_id);

-- ====================================
-- 点赞表策略
-- ====================================

-- 清除旧策略
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON likes;
DROP POLICY IF EXISTS "Authenticated users can insert likes" ON likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON likes;

-- 新策略
CREATE POLICY "Likes are viewable by everyone" ON likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert likes" ON likes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own likes" ON likes
    FOR DELETE USING (auth.uid() = user_id);

-- ====================================
-- 评论点赞表策略
-- ====================================

-- 清除旧策略
DROP POLICY IF EXISTS "Comment likes are viewable by everyone" ON comment_likes;
DROP POLICY IF EXISTS "Authenticated users can insert comment likes" ON comment_likes;
DROP POLICY IF EXISTS "Users can delete their own comment likes" ON comment_likes;

-- 新策略
CREATE POLICY "Comment likes are viewable by everyone" ON comment_likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comment likes" ON comment_likes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own comment likes" ON comment_likes
    FOR DELETE USING (auth.uid() = user_id);

-- ====================================
-- 收藏表策略 (bookmarks)
-- ====================================

-- 清除旧策略
DROP POLICY IF EXISTS "Bookmarks are viewable by owner" ON bookmarks;
DROP POLICY IF EXISTS "Authenticated users can insert bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON bookmarks;

-- 新策略
CREATE POLICY "Bookmarks are viewable by owner" ON bookmarks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert bookmarks" ON bookmarks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" ON bookmarks
    FOR DELETE USING (auth.uid() = user_id);

-- ====================================
-- 用户收藏表策略 (user_favorites)
-- ====================================

-- 清除旧策略
DROP POLICY IF EXISTS "User favorites are viewable by owner" ON user_favorites;
DROP POLICY IF EXISTS "Authenticated users can insert favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON user_favorites;

-- 新策略
CREATE POLICY "User favorites are viewable by owner" ON user_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert favorites" ON user_favorites
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON user_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- ====================================
-- 关注表策略 (follows) - 优化版
-- ====================================

-- 清除所有可能冲突的旧策略
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON follows;
DROP POLICY IF EXISTS "Authenticated users can insert follows" ON follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON follows;
DROP POLICY IF EXISTS "Enable read access for all users" ON follows;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON follows;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON follows;
DROP POLICY IF EXISTS "Allow all operations for follows" ON follows;
DROP POLICY IF EXISTS "follows_select_policy" ON follows;
DROP POLICY IF EXISTS "follows_insert_policy" ON follows;
DROP POLICY IF EXISTS "follows_delete_policy" ON follows;

-- 新的简化策略 - 解决权限冲突
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

-- ====================================
-- RLS 故障排除选项
-- ====================================

-- 🚨 如果遇到 "query would be affected by row-level security policy" 错误
-- 可以选择执行以下其中一个故障排除方案：

-- 方案1: 使用超级宽松的策略（推荐用于开发环境）
/*
-- 清理所有现有策略并创建宽松策略
DO $$
BEGIN
    -- 删除所有artworks策略
    DROP POLICY IF EXISTS "Artworks are viewable by everyone" ON artworks;
    DROP POLICY IF EXISTS "Users can insert their own artworks" ON artworks;
    DROP POLICY IF EXISTS "Users can update their own artworks" ON artworks;
    DROP POLICY IF EXISTS "Users can delete their own artworks" ON artworks;
    DROP POLICY IF EXISTS "Enable read access for all users" ON artworks;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON artworks;
    DROP POLICY IF EXISTS "Enable update for authenticated users only" ON artworks;
    DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON artworks;
    
    -- 创建超级宽松策略
    CREATE POLICY "Allow all operations for artworks" ON artworks
        FOR ALL USING (true) WITH CHECK (true);
        
    -- 对其他关键表执行相同操作
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Enable all access for profiles" ON profiles;
    
    CREATE POLICY "Allow all operations for profiles" ON profiles
        FOR ALL USING (true) WITH CHECK (true);
        
    DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
    DROP POLICY IF EXISTS "Authenticated users can insert comments" ON comments;
    DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
    DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;
    DROP POLICY IF EXISTS "Enable read access for all users" ON comments;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON comments;
    DROP POLICY IF EXISTS "Enable update for authenticated users only" ON comments;
    DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON comments;
    
    CREATE POLICY "Allow all operations for comments" ON comments
        FOR ALL USING (true) WITH CHECK (true);
        
    DROP POLICY IF EXISTS "Likes are viewable by everyone" ON likes;
    DROP POLICY IF EXISTS "Authenticated users can insert likes" ON likes;
    DROP POLICY IF EXISTS "Users can delete their own likes" ON likes;
    DROP POLICY IF EXISTS "Enable read access for all users" ON likes;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON likes;
    DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON likes;
    
    CREATE POLICY "Allow all operations for likes" ON likes
        FOR ALL USING (true) WITH CHECK (true);
        
    DROP POLICY IF EXISTS "User favorites are viewable by owner" ON user_favorites;
    DROP POLICY IF EXISTS "Authenticated users can insert favorites" ON user_favorites;
    DROP POLICY IF EXISTS "Users can delete their own favorites" ON user_favorites;
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON user_favorites;
    
    CREATE POLICY "Allow all operations for user_favorites" ON user_favorites
        FOR ALL USING (true) WITH CHECK (true);
END $$;
*/

-- 方案2: 完全禁用RLS（推荐用于开发环境和紧急情况）
/*
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
*/

-- 验证RLS状态查询（可以随时运行）
/*
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ RLS启用'
        ELSE '⚠️ RLS禁用'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'artworks', 'comments', 'likes', 'user_favorites', 'follows')
ORDER BY tablename;
*/

-- 完成提示
SELECT '✅ 安全策略设置完成！所有表已启用 RLS 并配置相应的访问策略。' AS result; 
SELECT '💡 如遇RLS权限问题，请查看文件末尾的故障排除选项。' AS troubleshooting_tip; 