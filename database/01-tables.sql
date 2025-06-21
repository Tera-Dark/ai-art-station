-- AI Art Station - 基础表结构
-- 第1步：创建所有数据库表（不包含策略和触发器）

-- ====================================
-- 用户相关表
-- ====================================

-- 用户资料表
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    location TEXT,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 通知设置
    email_notifications BOOLEAN DEFAULT true,
    like_notifications BOOLEAN DEFAULT true,
    comment_notifications BOOLEAN DEFAULT true,
    follow_notifications BOOLEAN DEFAULT true,
    
    -- 隐私设置
    profile_public BOOLEAN DEFAULT true,
    show_liked_artworks BOOLEAN DEFAULT true,
    show_email BOOLEAN DEFAULT false,
    
    -- 显示设置
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    language TEXT DEFAULT 'zh-CN',
    items_per_page INTEGER DEFAULT 20,
    
    -- 内容设置
    content_filter BOOLEAN DEFAULT false,
    show_nsfw BOOLEAN DEFAULT false
);

-- ====================================
-- 作品相关表
-- ====================================

-- 作品表
CREATE TABLE IF NOT EXISTS artworks (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title TEXT NOT NULL,
    description TEXT,
    prompt TEXT NOT NULL,
    image_url TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    model TEXT,
    steps INTEGER,
    cfg_scale NUMERIC,
    sampler TEXT,
    seed BIGINT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    likes_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0
);

-- ====================================
-- 交互相关表
-- ====================================

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    content TEXT NOT NULL,
    artwork_id BIGINT REFERENCES artworks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0
);

-- 点赞表
CREATE TABLE IF NOT EXISTS likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    artwork_id BIGINT REFERENCES artworks(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(user_id, artwork_id)
);

-- 评论点赞表
CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(user_id, comment_id)
);

-- 收藏表 (bookmarks - 数据库中原有的表)
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    artwork_id BIGINT REFERENCES artworks(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(user_id, artwork_id)
);

-- 用户收藏表 (user_favorites - 代码中使用的表)
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    artwork_id BIGINT REFERENCES artworks(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(user_id, artwork_id)
);

-- ====================================
-- 社交功能表
-- ====================================

-- 关注表
CREATE TABLE IF NOT EXISTS follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- ====================================
-- 创建性能优化索引
-- ====================================

-- 用户相关索引
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);
CREATE INDEX IF NOT EXISTS user_settings_user_id_idx ON user_settings(user_id);

-- 作品相关索引
CREATE INDEX IF NOT EXISTS artworks_user_id_idx ON artworks(user_id);
CREATE INDEX IF NOT EXISTS artworks_created_at_idx ON artworks(created_at DESC);
CREATE INDEX IF NOT EXISTS artworks_tags_idx ON artworks USING GIN(tags);

-- 交互相关索引
CREATE INDEX IF NOT EXISTS comments_artwork_id_idx ON comments(artwork_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON comments(user_id);
CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON comments(parent_id);
CREATE INDEX IF NOT EXISTS likes_artwork_id_idx ON likes(artwork_id);
CREATE INDEX IF NOT EXISTS likes_user_id_idx ON likes(user_id);
CREATE INDEX IF NOT EXISTS comment_likes_comment_id_idx ON comment_likes(comment_id);

-- 收藏相关索引
CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS bookmarks_artwork_id_idx ON bookmarks(artwork_id);
CREATE INDEX IF NOT EXISTS user_favorites_user_id_idx ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS user_favorites_artwork_id_idx ON user_favorites(artwork_id);

-- 社交功能索引
CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON follows(following_id);

-- 完成提示
SELECT '✅ 基础表结构创建完成！包含 9 个主要表和所有性能索引。' AS result; 