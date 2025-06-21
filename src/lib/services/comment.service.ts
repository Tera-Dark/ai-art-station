import { supabase } from './supabase.service'
import { BaseService } from './base.service'
import { Comment } from '@/types/artwork'
import { Logger, DataValidator } from '@/lib/utils/error-handler'

export interface CommentService {
  getCommentsByArtwork(artworkId: string): Promise<Comment[]>
  createComment(
    artworkId: string,
    userId: string,
    content: string,
    parentId?: string
  ): Promise<Comment | null>
  updateComment(commentId: string, content: string): Promise<Comment | null>
  deleteComment(commentId: string): Promise<boolean>
  getCommentReplies(commentId: string): Promise<Comment[]>
}

class CommentServiceImpl extends BaseService implements CommentService {
  /**
   * 获取作品的所有评论（包含回复）
   */
  async getCommentsByArtwork(artworkId: string): Promise<Comment[]> {
    try {
      const validArtworkId = DataValidator.validateArtworkId(artworkId)
      Logger.info(`获取作品 ${validArtworkId} 的评论`)

      // 1. 获取主评论
      const { data: mainComments, error: mainError } = await supabase
        .from('comments')
        .select('*')
        .eq('artwork_id', validArtworkId)
        .is('parent_id', null)
        .order('created_at', { ascending: false })

      if (mainError) {
        Logger.error('获取主评论失败', mainError)
        return []
      }

      if (!mainComments || mainComments.length === 0) {
        Logger.info(`作品 ${validArtworkId} 没有评论`)
        return []
      }

      // 2. 获取所有回复
      const { data: replies, error: repliesError } = await supabase
        .from('comments')
        .select('*')
        .eq('artwork_id', validArtworkId)
        .not('parent_id', 'is', null)
        .order('created_at', { ascending: true })

      if (repliesError) {
        Logger.error('获取回复失败', repliesError)
        // 即使回复获取失败，也返回主评论
      }

      // 3. 获取所有相关用户信息
      const allComments = [...mainComments, ...(replies || [])]
      const userIds = [...new Set(allComments.map(c => c.user_id).filter(Boolean))]
      const profiles = await this.getUserProfiles(userIds)

      // 4. 组织数据结构
      const commentsWithReplies = mainComments.map(comment => {
        const userInfo = profiles.find(p => p.id === comment.user_id)

        return {
          id: comment.id,
          content: comment.content,
          author: userInfo?.username || userInfo?.display_name || '匿名用户',
          avatar: userInfo?.avatar_url,
          created_at: comment.created_at,
          likes: comment.likes_count || 0,
          isLiked: false, // 需要单独查询
          replies:
            replies
              ?.filter(reply => reply.parent_id === comment.id)
              .map(reply => {
                const replyUserInfo = profiles.find(p => p.id === reply.user_id)
                return {
                  id: reply.id,
                  content: reply.content,
                  author: replyUserInfo?.username || replyUserInfo?.display_name || '匿名用户',
                  avatar: replyUserInfo?.avatar_url,
                  created_at: reply.created_at,
                  likes: reply.likes_count || 0,
                  isLiked: false,
                  parent_id: reply.parent_id,
                }
              }) || [],
        }
      })

      Logger.success(
        `获取到 ${commentsWithReplies.length} 条主评论，${replies?.length || 0} 条回复`
      )
      return commentsWithReplies
    } catch (error) {
      Logger.error('获取评论时出错', error)
      return []
    }
  }

  /**
   * 创建评论或回复
   */
  async createComment(
    artworkId: string,
    userId: string,
    content: string,
    parentId?: string
  ): Promise<Comment | null> {
    try {
      const validArtworkId = DataValidator.validateArtworkId(artworkId)
      const validUserId = DataValidator.validateUserId(userId)

      if (!content || content.trim().length === 0) {
        Logger.error('评论内容不能为空')
        return null
      }

      if (content.trim().length > 500) {
        Logger.error('评论内容过长')
        return null
      }

      let validParentId: string | null = null
      if (parentId) {
        validParentId = DataValidator.validateCommentId(parentId)
      }

      Logger.info(`创建${parentId ? '回复' : '评论'}`)

      // 1. 插入评论
      const { data: newComment, error: insertError } = await supabase
        .from('comments')
        .insert({
          artwork_id: validArtworkId,
          user_id: validUserId,
          content: content.trim(),
          parent_id: validParentId,
          likes_count: 0,
        })
        .select('*')
        .single()

      if (insertError) {
        Logger.error('创建评论失败', insertError)
        return null
      }

      if (!newComment) {
        Logger.error('创建评论失败：没有返回数据')
        return null
      }

      // 2. 获取用户信息
      const userInfo = await this.getOrCreateUserProfile(validUserId)

      // 3. 返回完整的评论数据
      const result = {
        id: newComment.id,
        content: newComment.content,
        author: userInfo?.username || userInfo?.display_name || '匿名用户',
        avatar: userInfo?.avatar_url,
        created_at: newComment.created_at,
        likes: 0,
        isLiked: false,
        replies: [],
        parent_id: newComment.parent_id,
      }

      Logger.success('评论创建成功')
      return result
    } catch (error) {
      Logger.error('创建评论时出错', error)
      return null
    }
  }

  /**
   * 更新评论
   */
  async updateComment(commentId: string, content: string): Promise<Comment | null> {
    try {
      const validCommentId = DataValidator.validateCommentId(commentId)

      if (!content || content.trim().length === 0) {
        Logger.error('评论内容不能为空')
        return null
      }

      if (content.trim().length > 500) {
        Logger.error('评论内容过长')
        return null
      }

      Logger.info(`更新评论 ${validCommentId}`)

      // 1. 更新评论
      const { data: updatedComment, error: updateError } = await supabase
        .from('comments')
        .update({
          content: content.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', validCommentId)
        .select('*')
        .single()

      if (updateError) {
        Logger.error('更新评论失败', updateError)
        return null
      }

      if (!updatedComment) {
        Logger.error('更新评论失败：没有返回数据')
        return null
      }

      // 2. 获取用户信息
      const userInfo = await this.getOrCreateUserProfile(updatedComment.user_id)

      // 3. 返回完整的评论数据
      const result = {
        id: updatedComment.id,
        content: updatedComment.content,
        author: userInfo?.username || userInfo?.display_name || '匿名用户',
        avatar: userInfo?.avatar_url,
        created_at: updatedComment.created_at,
        likes: updatedComment.likes_count || 0,
        isLiked: false,
        replies: [],
        parent_id: updatedComment.parent_id,
      }

      Logger.success('评论更新成功')
      return result
    } catch (error) {
      Logger.error('更新评论时出错', error)
      return null
    }
  }

  /**
   * 删除评论
   */
  async deleteComment(commentId: string): Promise<boolean> {
    try {
      const validCommentId = DataValidator.validateCommentId(commentId)
      Logger.info(`删除评论 ${validCommentId}`)

      const { error } = await supabase.from('comments').delete().eq('id', validCommentId)

      if (error) {
        Logger.error('删除评论失败', error)
        return false
      }

      Logger.success('评论删除成功')
      return true
    } catch (error) {
      Logger.error('删除评论时出错', error)
      return false
    }
  }

  /**
   * 获取评论的回复
   */
  async getCommentReplies(commentId: string): Promise<Comment[]> {
    try {
      const validCommentId = DataValidator.validateCommentId(commentId)
      Logger.info(`获取评论 ${validCommentId} 的回复`)

      // 1. 获取回复
      const { data: replies, error: repliesError } = await supabase
        .from('comments')
        .select('*')
        .eq('parent_id', validCommentId)
        .order('created_at', { ascending: true })

      if (repliesError) {
        Logger.error('获取回复失败', repliesError)
        return []
      }

      if (!replies || replies.length === 0) {
        Logger.info(`评论 ${validCommentId} 没有回复`)
        return []
      }

      // 2. 获取用户信息
      const userIds = [...new Set(replies.map(r => r.user_id).filter(Boolean))]
      const profiles = await this.getUserProfiles(userIds)

      // 3. 组织数据
      const repliesWithUserInfo = replies.map(reply => {
        const userInfo = profiles.find(p => p.id === reply.user_id)

        return {
          id: reply.id,
          content: reply.content,
          author: userInfo?.username || userInfo?.display_name || '匿名用户',
          avatar: userInfo?.avatar_url,
          created_at: reply.created_at,
          likes: reply.likes_count || 0,
          isLiked: false,
          replies: [],
          parent_id: reply.parent_id,
        }
      })

      Logger.success(`获取到 ${repliesWithUserInfo.length} 条回复`)
      return repliesWithUserInfo
    } catch (error) {
      Logger.error('获取回复时出错', error)
      return []
    }
  }
}

// 创建服务实例
export const commentService = new CommentServiceImpl()

// 导出便捷函数
export const getCommentsByArtwork = (artworkId: string) =>
  commentService.getCommentsByArtwork(artworkId)
export const createComment = (
  artworkId: string,
  userId: string,
  content: string,
  parentId?: string
) => commentService.createComment(artworkId, userId, content, parentId)
export const updateComment = (commentId: string, content: string) =>
  commentService.updateComment(commentId, content)
export const deleteComment = (commentId: string) => commentService.deleteComment(commentId)
export const getCommentReplies = (commentId: string) => commentService.getCommentReplies(commentId)
