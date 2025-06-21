-- AI Art Station - 完整数据库设置脚本
-- 包含表结构、策略、函数、触发器的完整设置
-- 执行顺序：此文件包含所有必要的设置

-- ====================================
-- 第一步：清理和重置（可选）
-- ====================================

-- 如果需要重置，可以取消注释以下行
-- DROP SCHEMA IF EXISTS public CASCADE;
-- CREATE SCHEMA public;
-- GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
-- GRANT ALL ON SCHEMA public TO postgres, service_role;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
-- GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;

-- ====================================
-- 第二步：创建所有表
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

-- 收藏表 (bookmarks)
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    artwork_id BIGINT REFERENCES artworks(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(user_id, artwork_id)
);

-- 用户收藏表 (user_favorites)
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    artwork_id BIGINT REFERENCES artworks(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(user_id, artwork_id)
);

-- ====================================
-- 第三步：创建索引
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

-- ====================================
-- 第四步：启用RLS
-- ====================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- ====================================
-- 第五步：创建安全策略
-- ====================================

-- 用户资料表策略
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 用户设置表策略
DROP POLICY IF EXISTS "User settings are viewable by owner" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;

CREATE POLICY "User settings are viewable by owner" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- 作品表策略
DROP POLICY IF EXISTS "Artworks are viewable by everyone" ON artworks;
DROP POLICY IF EXISTS "Users can insert their own artworks" ON artworks;
DROP POLICY IF EXISTS "Users can update their own artworks" ON artworks;
DROP POLICY IF EXISTS "Users can delete their own artworks" ON artworks;

CREATE POLICY "Artworks are viewable by everyone" ON artworks
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own artworks" ON artworks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own artworks" ON artworks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own artworks" ON artworks
    FOR DELETE USING (auth.uid() = user_id);

-- 评论表策略
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

CREATE POLICY "Comments are viewable by everyone" ON comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments" ON comments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own comments" ON comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON comments
    FOR DELETE USING (auth.uid() = user_id);

-- 点赞表策略
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON likes;
DROP POLICY IF EXISTS "Authenticated users can insert likes" ON likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON likes;

CREATE POLICY "Likes are viewable by everyone" ON likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert likes" ON likes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own likes" ON likes
    FOR DELETE USING (auth.uid() = user_id);

-- 评论点赞表策略
DROP POLICY IF EXISTS "Comment likes are viewable by everyone" ON comment_likes;
DROP POLICY IF EXISTS "Authenticated users can insert comment likes" ON comment_likes;
DROP POLICY IF EXISTS "Users can delete their own comment likes" ON comment_likes;

CREATE POLICY "Comment likes are viewable by everyone" ON comment_likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comment likes" ON comment_likes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own comment likes" ON comment_likes
    FOR DELETE USING (auth.uid() = user_id);

-- 收藏表策略
DROP POLICY IF EXISTS "Bookmarks are viewable by owner" ON bookmarks;
DROP POLICY IF EXISTS "Authenticated users can insert bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON bookmarks;

CREATE POLICY "Bookmarks are viewable by owner" ON bookmarks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert bookmarks" ON bookmarks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" ON bookmarks
    FOR DELETE USING (auth.uid() = user_id);

-- 用户收藏表策略
DROP POLICY IF EXISTS "User favorites are viewable by owner" ON user_favorites;
DROP POLICY IF EXISTS "Authenticated users can insert favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON user_favorites;

CREATE POLICY "User favorites are viewable by owner" ON user_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert favorites" ON user_favorites
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON user_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- ====================================
-- 第六步：创建函数
-- ====================================

-- 自动更新 updated_at 字段的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND NEW IS NOT NULL THEN
        BEGIN
            NEW.updated_at = NOW();
        EXCEPTION WHEN undefined_column THEN
            NULL;
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 用户注册时自动创建 profile 的函数 (修复版)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    username_val text;
    full_name_val text;
    avatar_url_val text;
BEGIN
    -- 安全获取用户元数据
    username_val := COALESCE(new.raw_user_meta_data->>'username', '');
    full_name_val := COALESCE(new.raw_user_meta_data->>'full_name', '');
    avatar_url_val := COALESCE(new.raw_user_meta_data->>'avatar_url', '');
    
    -- 如果用户名为空，生成默认用户名
    IF username_val = '' OR username_val IS NULL THEN
        username_val := 'user_' || substring(new.id::text from 1 for 8);
    END IF;
    
    -- 处理可能的用户名冲突
    BEGIN
        INSERT INTO public.profiles (id, username, full_name, avatar_url, created_at, updated_at)
        VALUES (
            new.id,
            username_val,
            full_name_val,
            avatar_url_val,
            NOW(),
            NOW()
        );
    EXCEPTION WHEN unique_violation THEN
        -- 如果用户名冲突，添加随机后缀
        INSERT INTO public.profiles (id, username, full_name, avatar_url, created_at, updated_at)
        VALUES (
            new.id,
            username_val || '_' || floor(random() * 10000)::text,
            full_name_val,
            avatar_url_val,
            NOW(),
            NOW()
        );
    END;
    
    -- 同时创建用户设置
    BEGIN
        INSERT INTO public.user_settings (user_id, created_at, updated_at)
        VALUES (new.id, NOW(), NOW());
    EXCEPTION WHEN unique_violation THEN
        -- 如果设置已存在，忽略错误
        NULL;
    END;
    
    RETURN new;
EXCEPTION WHEN OTHERS THEN
    -- 记录错误但不阻止用户注册
    RAISE LOG 'Error creating profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 计数更新函数
CREATE OR REPLACE FUNCTION update_artwork_comments_count()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE artworks 
        SET comments_count = comments_count + 1 
        WHERE id = NEW.artwork_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE artworks 
        SET comments_count = GREATEST(0, comments_count - 1)
        WHERE id = OLD.artwork_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_artwork_likes_count()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE artworks 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.artwork_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE artworks 
        SET likes_count = GREATEST(0, likes_count - 1)
        WHERE id = OLD.artwork_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE comments 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE comments 
        SET likes_count = GREATEST(0, likes_count - 1)
        WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- 第七步：创建触发器
-- ====================================

-- 用户注册触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 自动更新时间戳触发器
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_artworks_updated_at ON artworks;
CREATE TRIGGER update_artworks_updated_at
    BEFORE UPDATE ON artworks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 计数自动更新触发器
DROP TRIGGER IF EXISTS comments_count_trigger ON comments;
CREATE TRIGGER comments_count_trigger
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_artwork_comments_count();

DROP TRIGGER IF EXISTS likes_count_trigger ON likes;
CREATE TRIGGER likes_count_trigger
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW EXECUTE FUNCTION update_artwork_likes_count();

DROP TRIGGER IF EXISTS comment_likes_count_trigger ON comment_likes;
CREATE TRIGGER comment_likes_count_trigger
    AFTER INSERT OR DELETE ON comment_likes
    FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- ====================================
-- 完成提示
-- ====================================

SELECT '🎉 AI Art Station 数据库设置完成！' AS status,
       '✅ 所有表、索引、策略、函数、触发器已创建' AS details,
       '🔧 包含用户注册修复和点赞冲突处理' AS fixes; 