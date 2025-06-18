import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from '../constants/config'

// 检查环境变量是否设置
if (!supabaseConfig.isValid()) {
  console.error('Supabase 环境变量未正确设置，请检查 .env.local 文件')
}

// 创建 Supabase 客户端
export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey)

// 初始化存储桶
export async function ensureStorageBuckets() {
  try {
    // 检查存储桶是否存在
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.warn('无法检查存储桶:', listError)
      return false
    }

    const artworksBucketExists = buckets?.some(bucket => bucket.name === 'artworks')

    if (!artworksBucketExists) {
      console.log('创建 artworks 存储桶...')
      const { error: createError } = await supabase.storage.createBucket('artworks', {
        public: true,
      })

      if (createError) {
        console.warn('创建存储桶失败:', createError)
        return false
      }
    }

    // 测试连接（简化版检查）
    const { error: healthError } = await supabase.from('_rpc').select('*').limit(1)

    if (healthError) {
      console.warn('数据库连接测试失败:', healthError)
      return false
    }

    console.log('Supabase 初始化成功')
    return true
  } catch (error) {
    console.error('Supabase 初始化失败:', error)
    return false
  }
}

// 数据库类型定义
export interface ArtworkType {
  id: string
  title: string
  description: string
  prompt: string
  image_url: string
  thumbnail_url: string
  ai_model: string
  parameters: Record<string, unknown>
  tags: string[]
  likes_count: number
  bookmarks_count: number
  views_count: number
  user_id: string
  created_at: string
  updated_at: string
}

export interface UserType {
  id: string
  email: string
  username: string
  avatar_url: string
  created_at: string
  updated_at: string
}

export interface LikeType {
  id: string
  user_id: string
  artwork_id: string
  created_at: string
}

export interface BookmarkType {
  id: string
  user_id: string
  artwork_id: string
  created_at: string
}
