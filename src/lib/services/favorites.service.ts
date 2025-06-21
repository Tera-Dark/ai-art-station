import { supabase } from './supabase.service'
import { Artwork } from '@/types/artwork'

export interface FavoriteService {
  addToFavorites: (userId: string, artworkId: string) => Promise<boolean>
  removeFromFavorites: (userId: string, artworkId: string) => Promise<boolean>
  checkIsFavorited: (userId: string, artworkId: string) => Promise<boolean>
  getUserFavorites: (userId: string) => Promise<string[]>
}

export const favoriteService: FavoriteService = {
  // 添加到收藏
  async addToFavorites(userId: string, artworkId: string): Promise<boolean> {
    try {
      console.log('添加收藏:', { userId, artworkId })

      // 确保artworkId是数字格式
      const artworkIdNumber = parseInt(artworkId, 10)
      if (isNaN(artworkIdNumber)) {
        console.error('作品ID格式无效:', { artworkId, artworkIdNumber })
        return false
      }

      const { error } = await supabase.from('user_favorites').insert({
        user_id: userId,
        artwork_id: artworkIdNumber,
        created_at: new Date().toISOString(),
      })

      if (error) {
        console.error('添加收藏失败:', error)
        return false
      }

      console.log('收藏添加成功:', { userId, artworkId, artworkIdNumber })
      return true
    } catch (error) {
      console.error('添加收藏时出错:', error)
      return false
    }
  },

  // 从收藏中移除
  async removeFromFavorites(userId: string, artworkId: string): Promise<boolean> {
    try {
      console.log('移除收藏:', { userId, artworkId })

      // 确保artworkId是数字格式
      const artworkIdNumber = parseInt(artworkId, 10)
      if (isNaN(artworkIdNumber)) {
        console.error('作品ID格式无效:', { artworkId, artworkIdNumber })
        return false
      }

      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('artwork_id', artworkIdNumber)

      if (error) {
        console.error('移除收藏失败:', error)
        return false
      }

      console.log('收藏移除成功:', { userId, artworkId, artworkIdNumber })
      return true
    } catch (error) {
      console.error('移除收藏时出错:', error)
      return false
    }
  },

  // 检查是否已收藏
  async checkIsFavorited(userId: string, artworkId: string): Promise<boolean> {
    try {
      console.log('检查收藏状态:', { userId, artworkId, artworkIdType: typeof artworkId })

      // 参数验证
      if (!userId || !artworkId) {
        console.warn('检查收藏状态：参数无效', { userId, artworkId })
        return false
      }

      // 确保artworkId是数字格式（数据库中artwork_id是BIGINT）
      const artworkIdNumber = parseInt(artworkId, 10)
      if (isNaN(artworkIdNumber)) {
        console.error('作品ID格式无效:', { artworkId, artworkIdNumber })
        return false
      }

      // 先检查表是否存在
      const { data, error } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('artwork_id', artworkIdNumber)
        .maybeSingle()

      if (error) {
        console.error('检查收藏状态失败:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          userId,
          artworkId,
          artworkIdNumber,
        })

        // 如果是表不存在的错误，给出明确提示
        if (error.code === '42P01') {
          console.error(
            '❌ user_favorites 表不存在！请在 Supabase 中运行 additional-tables.sql 脚本'
          )
        }

        return false
      }

      const isFavorited = !!data
      console.log('收藏状态检查完成:', { userId, artworkId, artworkIdNumber, isFavorited })

      return isFavorited
    } catch (error) {
      console.error('检查收藏状态时出错:', error)
      return false
    }
  },

  // 获取用户所有收藏的作品ID
  async getUserFavorites(userId: string): Promise<string[]> {
    try {
      console.log('获取用户收藏:', { userId })

      const { data, error } = await supabase
        .from('user_favorites')
        .select('artwork_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('获取用户收藏失败:', error)
        return []
      }

      const favoriteIds = data?.map(item => item.artwork_id) || []
      console.log('用户收藏获取成功:', { userId, count: favoriteIds.length })

      return favoriteIds
    } catch (error) {
      console.error('获取用户收藏时出错:', error)
      return []
    }
  },
}

// 切换收藏状态的便捷函数
export async function toggleFavorite(userId: string, artworkId: string): Promise<boolean> {
  const isFavorited = await favoriteService.checkIsFavorited(userId, artworkId)

  if (isFavorited) {
    return await favoriteService.removeFromFavorites(userId, artworkId)
  } else {
    return await favoriteService.addToFavorites(userId, artworkId)
  }
}

// 获取用户的收藏作品
export async function getUserFavorites(userId: string): Promise<Artwork[]> {
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select(
        `
        artwork_id,
        created_at,
        artworks (
          *,
          profiles (
            username,
            avatar_url
          )
        )
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('获取收藏失败:', error)
      return []
    }

    // 直接返回作品数据
    return data?.map((item: any) => item.artworks as Artwork) || []
  } catch (error) {
    console.error('获取收藏时出错:', error)
    return []
  }
}

// 获取用户收藏的作品ID列表
export async function getUserFavoriteIds(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('artwork_id')
      .eq('user_id', userId)

    if (error) {
      console.error('获取收藏ID失败:', error)
      return []
    }

    return data?.map((item: any) => item.artwork_id) || []
  } catch (error) {
    console.error('获取收藏ID时出错:', error)
    return []
  }
}

// 测试收藏功能的调试函数
export async function debugFavorites() {
  console.log('🔍 开始调试收藏功能...')

  try {
    // 1. 测试 Supabase 连接
    const { data: testData, error: testError } = await supabase
      .from('user_favorites')
      .select('*')
      .limit(1)

    if (testError) {
      console.error('❌ Supabase 连接测试失败:', testError)

      if (testError.code === '42P01') {
        console.error('💡 解决方案：请在 Supabase SQL 编辑器中运行以下命令：')
        console.log(`
-- 创建 user_favorites 表
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    artwork_id BIGINT REFERENCES artworks(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(user_id, artwork_id)
);

-- 启用 RLS
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "User favorites are viewable by owner" ON user_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert favorites" ON user_favorites
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON user_favorites
    FOR DELETE USING (auth.uid() = user_id);
        `)
      }
    } else {
      console.log('✅ Supabase 连接正常')
      console.log('📊 user_favorites 表存在且可访问')
      console.log('🔍 测试数据:', testData)
    }

    // 2. 检查用户认证状态
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error('❌ 获取用户信息失败:', authError)
    } else if (!user) {
      console.warn('⚠️ 用户未登录')
    } else {
      console.log('✅ 用户已登录:', user.id)
    }
  } catch (error) {
    console.error('❌ 调试过程中出错:', error)
  }

  console.log('🔍 收藏功能调试完成')
}
