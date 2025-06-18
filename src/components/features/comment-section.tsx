'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Send, Heart, Reply, MoreHorizontal } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Comment } from '@/types/artwork'
import { supabase } from '@/lib/services/supabase.service'
import { likeService } from '@/lib/services/likes.service'
import Image from 'next/image'

interface CommentSectionProps {
  artworkId: string
  onCommentCountChange?: (count: number) => void
}

export function CommentSection({ artworkId, onCommentCountChange }: CommentSectionProps) {
  const { user, isAuthenticated } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // 获取评论数据
  useEffect(() => {
    fetchComments()
  }, [artworkId])

  const fetchComments = async () => {
    setLoading(true)
    try {
      console.log('开始获取评论，作品ID:', artworkId)

      // 简化查询，先不使用关联查询
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('artwork_id', artworkId)
        .is('parent_id', null)
        .order('created_at', { ascending: false })

      if (commentsError) {
        console.error('获取主评论失败:', commentsError)
        console.error('错误详情:', {
          message: commentsError.message,
          details: commentsError.details,
          hint: commentsError.hint,
          code: commentsError.code,
        })
        return
      }

      console.log('主评论数据:', commentsData)

      // 获取回复
      const { data: repliesData, error: repliesError } = await supabase
        .from('comments')
        .select('*')
        .eq('artwork_id', artworkId)
        .not('parent_id', 'is', null)
        .order('created_at', { ascending: true })

      if (repliesError) {
        console.error('获取回复失败:', repliesError)
        return
      }

      console.log('回复数据:', repliesData)

      // 获取所有相关用户的信息
      const userIds = [
        ...(commentsData?.map(c => c.user_id) || []),
        ...(repliesData?.map(r => r.user_id) || []),
      ].filter(Boolean)

      let usersData: any[] = []
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds)

        if (profilesError) {
          console.error('获取用户信息失败:', profilesError)
        } else {
          usersData = profiles || []
        }
      }

      console.log('用户信息:', usersData)

      // 组织评论数据结构
      const commentsWithReplies =
        commentsData?.map(comment => {
          const userInfo = usersData.find(u => u.id === comment.user_id)
          return {
            id: comment.id,
            content: comment.content,
            author: userInfo?.username || '匿名用户',
            avatar: userInfo?.avatar_url,
            created_at: comment.created_at,
            likes: comment.likes_count || 0,
            isLiked: false,
            replies:
              repliesData
                ?.filter(reply => reply.parent_id === comment.id)
                .map(reply => {
                  const replyUserInfo = usersData.find(u => u.id === reply.user_id)
                  return {
                    id: reply.id,
                    content: reply.content,
                    author: replyUserInfo?.username || '匿名用户',
                    avatar: replyUserInfo?.avatar_url,
                    created_at: reply.created_at,
                    likes: reply.likes_count || 0,
                    isLiked: false,
                    parent_id: reply.parent_id,
                  }
                }) || [],
          }
        }) || []

      console.log('最终评论数据:', commentsWithReplies)
      setComments(commentsWithReplies)

      // 更新评论总数
      const totalComments = commentsWithReplies.length + (repliesData?.length || 0)
      onCommentCountChange?.(totalComments)
    } catch (error) {
      console.error('获取评论时出错:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault()
    if (!replyText.trim() || !user || submitting) return

    setSubmitting(true)
    try {
      const { error } = await supabase.from('comments').insert({
        artwork_id: artworkId,
        user_id: user.id,
        content: replyText.trim(),
        parent_id: parentId,
      })

      if (error) {
        console.error('提交回复失败:', error)
        alert('提交回复失败，请重试')
        return
      }

      setReplyText('')
      setReplyingTo(null)
      fetchComments() // 重新获取评论
    } catch (error) {
      console.error('提交回复时出错:', error)
      alert('提交回复失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLike = async (commentId: string) => {
    if (!user) {
      alert('请先登录后再点赞')
      return
    }

    try {
      const success = await likeService.toggleCommentLike(user.id, commentId)
      if (success) {
        // 重新获取评论以更新点赞状态和数量
        fetchComments()
      } else {
        alert('操作失败，请稍后重试')
      }
    } catch (error) {
      console.error('点赞操作失败:', error)
      alert('操作失败，请稍后重试')
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`

    return date.toLocaleDateString('zh-CN')
  }

  const generateAvatar = (username: string) => {
    return username.charAt(0).toUpperCase()
  }

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`comment-item ${isReply ? 'reply' : ''}`}>
      <div className='comment-avatar'>
        {comment.avatar ? (
          <Image src={comment.avatar} alt={comment.author} width={40} height={40} />
        ) : (
          <span>{generateAvatar(comment.author)}</span>
        )}
      </div>

      <div className='comment-content'>
        <div className='comment-header'>
          <span className='comment-author'>{comment.author}</span>
          <span className='comment-time'>{formatTime(comment.created_at)}</span>
        </div>

        <div className='comment-text'>{comment.content}</div>

        <div className='comment-actions'>
          <button
            className={`comment-action ${comment.isLiked ? 'liked' : ''}`}
            onClick={() => handleLike(comment.id)}
          >
            <Heart size={14} fill={comment.isLiked ? 'currentColor' : 'none'} />
            {comment.likes > 0 && <span>{comment.likes}</span>}
          </button>

          {!isReply && (
            <button
              className='comment-action'
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            >
              <Reply size={14} />
              <span>回复</span>
            </button>
          )}

          <button className='comment-action'>
            <MoreHorizontal size={14} />
          </button>
        </div>

        {/* 回复表单 */}
        {replyingTo === comment.id && !isReply && isAuthenticated && (
          <form className='reply-form' onSubmit={e => handleSubmitReply(e, comment.id)}>
            <div className='reply-input-wrapper'>
              <div className='reply-user-avatar'>
                {user?.user_metadata?.avatar_url ? (
                  <Image
                    src={user.user_metadata.avatar_url}
                    alt='用户头像'
                    width={32}
                    height={32}
                  />
                ) : (
                  <span>
                    {user
                      ? generateAvatar(
                          user.user_metadata?.username || user.email?.split('@')[0] || '用户'
                        )
                      : ''}
                  </span>
                )}
              </div>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder={`回复 ${comment.author}...`}
                className='reply-input'
                rows={2}
                maxLength={500}
              />
            </div>
            <div className='reply-form-actions'>
              <button type='button' className='reply-cancel' onClick={() => setReplyingTo(null)}>
                取消
              </button>
              <button
                type='submit'
                className='reply-submit'
                disabled={!replyText.trim() || submitting}
              >
                <Send size={14} />
                {submitting ? '发送中...' : '回复'}
              </button>
            </div>
          </form>
        )}

        {/* 显示回复 */}
        {comment.replies && comment.replies.length > 0 && (
          <div className='replies-list'>
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} isReply={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className='comment-section'>
      <div className='comment-header-section'>
        <h3>
          <MessageCircle size={20} />
          <span>
            评论 (
            {loading
              ? '...'
              : comments.reduce((total, comment) => total + 1 + (comment.replies?.length || 0), 0)}
            )
          </span>
        </h3>
      </div>

      {/* 评论列表 */}
      <div className='comments-list'>
        {loading ? (
          <div className='comments-loading'>
            <p>加载评论中...</p>
          </div>
        ) : comments.length > 0 ? (
          comments.map(comment => <CommentItem key={comment.id} comment={comment} />)
        ) : (
          <div className='comments-empty'>
            <p>还没有评论，来发表第一条评论吧！</p>
          </div>
        )}
      </div>
    </div>
  )
}
