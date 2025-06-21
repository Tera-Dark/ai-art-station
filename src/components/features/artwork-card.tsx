'use client'

import { useState, useEffect } from 'react'
import { Heart, MessageCircle, Eye, Bookmark, UserPlus, UserMinus } from 'lucide-react'
import Image from 'next/image'
import { Artwork } from '@/types/artwork'
import { ImageGalleryModal } from './image-gallery-modal'
import { useAuth } from '@/contexts/auth-context'
import { favoriteService } from '@/lib/services/favorites.service'
import { likeService } from '@/lib/services/likes.service'
import { followService } from '@/lib/services/follow.service'

interface ArtworkCardProps {
  artwork: Artwork
  onLike?: (id: string) => void
  onBookmark?: (id: string) => void
  onView?: (artwork: Artwork) => void
}

export function ArtworkCard({ artwork, onLike, onBookmark, onView }: ArtworkCardProps) {
  const { user } = useAuth()
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [isCheckingFavorite, setIsCheckingFavorite] = useState(false)
  const [, setIsCheckingLike] = useState(false)
  const [likesCount, setLikesCount] = useState(artwork.likes_count || 0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isCheckingFollow, setIsCheckingFollow] = useState(false)

  // 检查收藏、点赞和关注状态
  useEffect(() => {
    const checkUserInteractions = async () => {
      if (user && artwork.id) {
        setIsCheckingFavorite(true)
        setIsCheckingLike(true)
        setIsCheckingFollow(true)
        try {
          // 并行检查收藏、点赞和关注状态
          const [isFavorited, isArtworkLiked, isFollowingAuthor] = await Promise.all([
            favoriteService.checkIsFavorited(user.id, artwork.id.toString()),
            likeService.checkArtworkLiked(user.id, artwork.id.toString()),
            artwork.user_id ? followService.isFollowing(artwork.user_id) : Promise.resolve(false),
          ])

          setIsBookmarked(isFavorited)
          setIsLiked(isArtworkLiked)
          setIsFollowing(isFollowingAuthor)
        } catch (error) {
          console.error('检查用户交互状态失败:', error)
        } finally {
          setIsCheckingFavorite(false)
          setIsCheckingLike(false)
          setIsCheckingFollow(false)
        }
      }
    }

    checkUserInteractions()
  }, [user, artwork.id, artwork.user_id])

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!user) {
      alert('请先登录后再点赞')
      return
    }

    try {
      const newLikedState = !isLiked
      setIsLiked(newLikedState)

      // 立即更新UI中的点赞数
      const newLikesCount = newLikedState ? likesCount + 1 : Math.max(0, likesCount - 1)
      setLikesCount(newLikesCount)

      const success = await likeService.toggleArtworkLike(user.id, artwork.id.toString())

      if (!success) {
        // 如果操作失败，恢复状态
        setIsLiked(!newLikedState)
        setLikesCount(likesCount)
        alert('操作失败，请稍后重试')
      } else {
        onLike?.(artwork.id.toString())
      }
    } catch (error) {
      console.error('点赞操作失败:', error)
      setIsLiked(!isLiked)
      setLikesCount(likesCount)
      alert('操作失败，请稍后重试')
    }
  }

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!user) {
      // 提示用户登录
      alert('请先登录后再收藏作品')
      return
    }

    try {
      const newBookmarkState = !isBookmarked
      setIsBookmarked(newBookmarkState)

      let success = false
      if (newBookmarkState) {
        success = await favoriteService.addToFavorites(user.id, artwork.id.toString())
      } else {
        success = await favoriteService.removeFromFavorites(user.id, artwork.id.toString())
      }

      if (!success) {
        // 如果操作失败，恢复状态
        setIsBookmarked(!newBookmarkState)
        alert('操作失败，请稍后重试')
      } else {
        onBookmark?.(artwork.id.toString())
      }
    } catch (error) {
      console.error('收藏操作失败:', error)
      setIsBookmarked(!isBookmarked)
      alert('操作失败，请稍后重试')
    }
  }

  const handleImageClick = () => {
    setIsGalleryOpen(true)
    onView?.(artwork)
  }

  const handleImageError = () => {
    setImageError(true)
  }

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!user) {
      alert('请先登录后再关注用户')
      return
    }

    if (!artwork.user_id) {
      return
    }

    if (user.id === artwork.user_id) {
      return // 不能关注自己
    }

    try {
      const newFollowState = !isFollowing
      setIsFollowing(newFollowState)

      const success = newFollowState
        ? await followService.followUser(artwork.user_id)
        : await followService.unfollowUser(artwork.user_id)

      if (!success) {
        setIsFollowing(!newFollowState)
        alert('操作失败，请稍后重试')
      }
    } catch (error) {
      console.error('关注操作失败:', error)
      setIsFollowing(!isFollowing)
      alert('操作失败，请稍后重试')
    }
  }

  return (
    <>
      <div className='artwork-card' onClick={handleImageClick}>
        <div className='artwork-image'>
          {!imageError && artwork.image_url ? (
            <Image
              src={artwork.image_url}
              alt={artwork.title}
              fill
              style={{ objectFit: 'cover' }}
              onError={handleImageError}
              sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
            />
          ) : (
            <div className='artwork-image-placeholder'>
              <div className='placeholder-content'>
                <div className='placeholder-icon'>🎨</div>
                <span className='placeholder-text'>图片加载失败</span>
              </div>
            </div>
          )}

          {/* 悬浮操作栏 */}
          <div className='artwork-overlay'>
            <div className='artwork-stats'>
              <div className='stat-item'>
                <Eye size={16} />
                <span>{artwork.views_count || 0}</span>
              </div>
              <div className='stat-item'>
                <Heart size={16} />
                <span>{artwork.likes_count || 0}</span>
              </div>
              <div className='stat-item'>
                <MessageCircle size={16} />
                <span>{artwork.comments_count || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className='artwork-info'>
          {/* 顶部标题和操作按钮 */}
          <div className='artwork-header'>
            <h3 className='artwork-title'>{artwork.title}</h3>
            <div className='action-buttons'>
              <button
                className={`action-button ${isLiked ? 'liked' : ''}`}
                onClick={handleLike}
                title='点赞'
              >
                <Heart size={18} fill={isLiked ? '#ff4757' : 'none'} />
              </button>
              <button
                className={`action-button bookmark ${isBookmarked ? 'bookmarked' : ''} ${isCheckingFavorite ? 'loading' : ''}`}
                onClick={handleBookmark}
                title={isBookmarked ? '取消收藏' : '收藏'}
                disabled={isCheckingFavorite}
              >
                <Bookmark size={18} fill={isBookmarked ? '#333' : 'none'} />
              </button>
            </div>
          </div>

          {/* 描述文字 */}
          {artwork.description && (
            <p className='artwork-description'>
              {artwork.description.length > 60
                ? `${artwork.description.slice(0, 60)}...`
                : artwork.description}
            </p>
          )}

          {/* 标签 */}
          {artwork.tags && artwork.tags.length > 0 && (
            <div className='artwork-tags'>
              {artwork.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className='tag-item'>
                  {tag}
                </span>
              ))}
              {artwork.tags.length > 3 && (
                <span className='tag-more'>+{artwork.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* 底部作者信息 - 简约优雅设计 */}
          <div className='artwork-footer-modern'>
            <div className='author-info-modern'>
              <div className='author-avatar-modern'>
                {artwork.profiles?.avatar_url ? (
                  <Image
                    src={artwork.profiles.avatar_url}
                    alt={
                      artwork.profiles.display_name || artwork.profiles.username || 'JustFruitPie'
                    }
                    width={36}
                    height={36}
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <span className='avatar-placeholder-modern'>
                    {(
                      artwork.profiles?.display_name ||
                      artwork.profiles?.username ||
                      'JustFruitPie'
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
              </div>
              <div className='author-details-modern'>
                <span className='author-name-modern'>
                  {artwork.profiles?.display_name || artwork.profiles?.username || 'JustFruitPie'}
                </span>
                <div className='artwork-meta-modern'>
                  <span className='meta-item'>
                    <Heart size={12} />
                    {likesCount}
                  </span>
                  <span className='meta-divider'>·</span>
                  <span className='meta-item'>
                    <MessageCircle size={12} />
                    {artwork.comments_count || 0}
                  </span>
                  <span className='meta-divider'>·</span>
                  <span className='date-modern'>
                    {new Date(artwork.created_at).toLocaleDateString('zh-CN', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* 关注按钮 - 只在不是自己的作品时显示 */}
            {user && artwork.user_id && user.id !== artwork.user_id && (
              <button
                className={`follow-button-mini ${isFollowing ? 'following' : ''} ${isCheckingFollow ? 'loading' : ''}`}
                onClick={handleFollow}
                disabled={isCheckingFollow}
                title={isFollowing ? '取消关注' : '关注'}
              >
                {isFollowing ? <UserMinus size={14} /> : <UserPlus size={14} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 小红书风格图片浏览器 */}
      <ImageGalleryModal
        artwork={artwork}
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
      />
    </>
  )
}
