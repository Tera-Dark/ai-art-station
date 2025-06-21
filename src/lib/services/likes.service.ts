import { supabase } from './supabase.service'

export interface LikeService {
  // 作品点赞功能
  likeArtwork(userId: string, artworkId: string): Promise<boolean>
  unlikeArtwork(userId: string, artworkId: string): Promise<boolean>
  checkArtworkLiked(userId: string, artworkId: string): Promise<boolean>
  getArtworkLikesCount(artworkId: string): Promise<number>

  // 评论点赞功能
  likeComment(userId: string, commentId: string): Promise<boolean>
  unlikeComment(userId: string, commentId: string): Promise<boolean>
  checkCommentLiked(userId: string, commentId: string): Promise<boolean>
  getCommentLikesCount(commentId: string): Promise<number>

  // 切换点赞状态
  toggleArtworkLike(userId: string, artworkId: string): Promise<boolean>
  toggleCommentLike(userId: string, commentId: string): Promise<boolean>
}

export const likeService: LikeService = {
  // ==================== 作品点赞功能 ====================

  async likeArtwork(userId: string, artworkId: string): Promise<boolean> {
    try {
      // 使用 upsert 避免重复插入导致的冲突
      const { error } = await supabase.from('likes').upsert(
        {
          user_id: userId,
          artwork_id: artworkId,
          created_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,artwork_id',
          ignoreDuplicates: true,
        }
      )

      if (error) {
        console.error('点赞作品失败:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('点赞作品时出错:', error)
      return false
    }
  },

  async unlikeArtwork(userId: string, artworkId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', userId)
        .eq('artwork_id', artworkId)

      if (error) {
        console.error('取消点赞作品失败:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('取消点赞作品时出错:', error)
      return false
    }
  },

  async checkArtworkLiked(userId: string, artworkId: string): Promise<boolean> {
    try {
      if (!userId || !artworkId) {
        console.warn('检查作品点赞状态：参数无效', { userId, artworkId })
        return false
      }

      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', userId)
        .eq('artwork_id', artworkId)
        .maybeSingle()

      if (error) {
        console.error('检查作品点赞状态失败:', error)
        return false
      }

      return !!data
    } catch (error) {
      console.error('检查作品点赞状态时出错:', error)
      return false
    }
  },

  async getArtworkLikesCount(artworkId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('artwork_id', artworkId)

      if (error) {
        console.error('获取作品点赞数失败:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('获取作品点赞数时出错:', error)
      return 0
    }
  },

  // ==================== 评论点赞功能 ====================

  async likeComment(userId: string, commentId: string): Promise<boolean> {
    try {
      // 使用 upsert 避免重复插入导致的冲突
      const { error } = await supabase.from('comment_likes').upsert(
        {
          user_id: userId,
          comment_id: commentId,
          created_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,comment_id',
          ignoreDuplicates: true,
        }
      )

      if (error) {
        console.error('点赞评论失败:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('点赞评论时出错:', error)
      return false
    }
  },

  async unlikeComment(userId: string, commentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('user_id', userId)
        .eq('comment_id', commentId)

      if (error) {
        console.error('取消点赞评论失败:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('取消点赞评论时出错:', error)
      return false
    }
  },

  async checkCommentLiked(userId: string, commentId: string): Promise<boolean> {
    try {
      if (!userId || !commentId) {
        console.warn('检查评论点赞状态：参数无效', { userId, commentId })
        return false
      }

      const { data, error } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('user_id', userId)
        .eq('comment_id', commentId)
        .maybeSingle()

      if (error) {
        console.error('检查评论点赞状态失败:', error)
        return false
      }

      return !!data
    } catch (error) {
      console.error('检查评论点赞状态时出错:', error)
      return false
    }
  },

  async getCommentLikesCount(commentId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('comment_likes')
        .select('*', { count: 'exact', head: true })
        .eq('comment_id', commentId)

      if (error) {
        console.error('获取评论点赞数失败:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('获取评论点赞数时出错:', error)
      return 0
    }
  },

  // ==================== 切换点赞状态便捷方法 ====================

  async toggleArtworkLike(userId: string, artworkId: string): Promise<boolean> {
    const isLiked = await this.checkArtworkLiked(userId, artworkId)

    if (isLiked) {
      return await this.unlikeArtwork(userId, artworkId)
    } else {
      return await this.likeArtwork(userId, artworkId)
    }
  },

  async toggleCommentLike(userId: string, commentId: string): Promise<boolean> {
    const isLiked = await this.checkCommentLiked(userId, commentId)

    if (isLiked) {
      return await this.unlikeComment(userId, commentId)
    } else {
      return await this.likeComment(userId, commentId)
    }
  },
}

// 导出便捷函数
export const toggleArtworkLike = (userId: string, artworkId: string) =>
  likeService.toggleArtworkLike(userId, artworkId)

export const toggleCommentLike = (userId: string, commentId: string) =>
  likeService.toggleCommentLike(userId, commentId)
