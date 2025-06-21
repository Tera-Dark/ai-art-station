-- AI Art Station - 函数和触发器
-- 第3步：创建自动化函数和触发器

-- ====================================
-- 辅助函数
-- ====================================

-- 自动更新 updated_at 字段的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    -- 确保NEW记录存在且有updated_at字段
    IF TG_OP = 'UPDATE' AND NEW IS NOT NULL THEN
        -- 检查表是否有updated_at列
        BEGIN
            NEW.updated_at = NOW();
        EXCEPTION WHEN undefined_column THEN
            -- 如果没有updated_at列，就忽略这个错误
            NULL;
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 用户注册时自动创建 profile 的函数
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

-- ====================================
-- 计数自动更新函数
-- ====================================

-- 更新作品评论数
CREATE OR REPLACE FUNCTION update_artwork_comments_count()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- 增加评论数
        UPDATE artworks 
        SET comments_count = comments_count + 1 
        WHERE id = NEW.artwork_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- 减少评论数
        UPDATE artworks 
        SET comments_count = GREATEST(0, comments_count - 1)
        WHERE id = OLD.artwork_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 更新作品点赞数
CREATE OR REPLACE FUNCTION update_artwork_likes_count()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- 增加点赞数
        UPDATE artworks 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.artwork_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- 减少点赞数
        UPDATE artworks 
        SET likes_count = GREATEST(0, likes_count - 1)
        WHERE id = OLD.artwork_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 更新评论点赞数
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- 增加评论点赞数
        UPDATE comments 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- 减少评论点赞数
        UPDATE comments 
        SET likes_count = GREATEST(0, likes_count - 1)
        WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 更新关注统计
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS trigger AS $$
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

-- ====================================
-- 关注相关RPC函数
-- ====================================

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
-- 创建触发器
-- ====================================

-- 用户注册时自动创建 profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 自动更新 updated_at 字段的触发器
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

-- 关注统计触发器
DROP TRIGGER IF EXISTS follow_counts_trigger ON follows;
CREATE TRIGGER follow_counts_trigger
    AFTER INSERT OR DELETE ON follows
    FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- 完成提示
SELECT '✅ 函数和触发器创建完成！包含自动更新字段、计数统计、关注统计等自动化功能。' AS result; 