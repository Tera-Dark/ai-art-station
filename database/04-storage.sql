-- AI Art Station - 存储配置
-- 第4步：创建存储桶和文件访问策略

-- ====================================
-- 创建存储桶
-- ====================================

-- 创建作品图片存储桶
INSERT INTO storage.buckets (id, name, public) 
VALUES ('artworks', 'artworks', true)
ON CONFLICT (id) DO NOTHING;

-- 创建用户头像存储桶
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 作品存储桶策略
-- ====================================

-- 清除旧的 artworks 存储策略
DROP POLICY IF EXISTS "Public artworks access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload artworks" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own artworks" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own artworks" ON storage.objects;

-- 作品存储桶新策略
CREATE POLICY "Public artworks access" ON storage.objects
    FOR SELECT USING (bucket_id = 'artworks');

CREATE POLICY "Authenticated users can upload artworks" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'artworks' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own artworks" ON storage.objects
    FOR DELETE USING (bucket_id = 'artworks' AND auth.uid()::text = owner::text);

CREATE POLICY "Users can update own artworks" ON storage.objects
    FOR UPDATE USING (bucket_id = 'artworks' AND auth.uid()::text = owner::text);

-- ====================================
-- 头像存储桶策略  
-- ====================================

-- 清除旧的 avatars 存储策略
DROP POLICY IF EXISTS "Public avatars access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- 头像存储桶新策略
CREATE POLICY "Public avatars access" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own avatar" ON storage.objects
    FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar" ON storage.objects
    FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ====================================
-- 验证存储桶创建
-- ====================================

-- 检查存储桶是否创建成功
DO $$
DECLARE
    bucket_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO bucket_count 
    FROM storage.buckets 
    WHERE name IN ('artworks', 'avatars');
    
    IF bucket_count = 2 THEN
        RAISE NOTICE '✅ 存储桶创建成功: artworks, avatars';
    ELSE
        RAISE WARNING '⚠️ 存储桶创建可能失败，请手动检查 Storage 部分';
    END IF;
END $$;

-- 完成提示
SELECT '✅ 存储配置完成！创建了 artworks 和 avatars 存储桶及其访问策略。' AS result; 