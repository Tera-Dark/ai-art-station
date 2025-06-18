'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  X,
  Heart,
  MessageCircle,
  Share2,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bookmark,
  Maximize,
  Send,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react'
import { Artwork } from '@/types/artwork'
import { CommentSection } from './comment-section'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/services/supabase.service'

interface ImageGalleryModalProps {
  artwork: Artwork | null
  isOpen: boolean
  onClose: () => void
  initialImageIndex?: number
}

export function ImageGalleryModal({
  artwork,
  isOpen,
  onClose,
  initialImageIndex = 0,
}: ImageGalleryModalProps) {
  const { user, isAuthenticated } = useAuth()
  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)
  const [isParametersExpanded, setIsParametersExpanded] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  
  // 图片缩放和移动状态
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // 刷新评论区的key，用于强制重新渲染
  const [commentSectionKey, setCommentSectionKey] = useState(0)

  // 处理多图片
  const images =
    artwork?.images && artwork.images.length > 0
      ? artwork.images.map(img => img.url)
      : artwork?.image_url
        ? [artwork.image_url]
        : []

  // 重置所有状态
  const resetModalState = useCallback(() => {
    setIsFullscreen(false)
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setIsDragging(false)
    setCurrentImageIndex(initialImageIndex)
    setIsParametersExpanded(false)
    setIsInputFocused(false)
    setCommentText('')
  }, [initialImageIndex])

  useEffect(() => {
    if (isOpen) {
      resetModalState()
      if (artwork) {
        setLikesCount(artwork.likes_count || 0)
        setCommentCount(artwork.comments_count || 0)
      }
    }
  }, [isOpen, artwork, resetModalState])

  // 处理滚轮缩放
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!isFullscreen || !imageContainerRef.current) return
    
    e.preventDefault()
    
    const container = imageContainerRef.current
    const rect = container.getBoundingClientRect()
    
    // 鼠标相对于容器的位置
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    const delta = e.deltaY * -0.001
    const newScale = Math.min(Math.max(0.1, scale + delta), 5)
    
    if (newScale !== scale) {
      // 计算缩放中心点
      const scaleChange = newScale / scale
      
      setPosition(prev => ({
        x: mouseX - (mouseX - prev.x) * scaleChange,
        y: mouseY - (mouseY - prev.y) * scaleChange,
      }))
      
      setScale(newScale)
    }
  }, [scale, isFullscreen])

  // 处理拖拽
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isFullscreen) return
    
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }, [isFullscreen, position])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // 绑定事件监听器
  useEffect(() => {
    if (isFullscreen) {
      const container = imageContainerRef.current
      if (container) {
        container.addEventListener('wheel', handleWheel, { passive: false })
      }
      
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        if (container) {
          container.removeEventListener('wheel', handleWheel)
        }
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isFullscreen, handleWheel, handleMouseMove, handleMouseUp])

  // 处理键盘事件
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          if (isFullscreen) {
            setIsFullscreen(false)
          } else if (isInputFocused) {
            setIsInputFocused(false)
            setCommentText('')
          } else {
            onClose()
          }
          break
        case 'ArrowLeft':
          if (!isInputFocused && currentImageIndex > 0) {
            setCurrentImageIndex(prev => prev - 1)
          }
          break
        case 'ArrowRight':
          if (!isInputFocused && currentImageIndex < images.length - 1) {
            setCurrentImageIndex(prev => prev + 1)
          }
          break
        case 'Enter':
          if (isInputFocused && commentText.trim()) {
            handleSubmitComment()
          }
          break
        case 'f':
        case 'F':
          if (!isInputFocused) {
            setIsFullscreen(!isFullscreen)
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isOpen, onClose, currentImageIndex, images.length, isInputFocused, commentText, isFullscreen])

  // 防止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !artwork || images.length === 0) return null

  const currentImage = images[currentImageIndex]
  const hasMultipleImages = images.length > 1

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikesCount(prev => (isLiked ? prev - 1 : prev + 1))
    // TODO: 实际的点赞API调用
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    // TODO: 实际的收藏API调用
  }



  const handleShare = async () => {
    if (navigator.share && artwork) {
      try {
        await navigator.share({
          title: artwork.title,
          text: artwork.description || '',
          url: window.location.href,
        })
      } catch (err) {
        console.error('分享失败:', err)
      }
    } else {
      // 降级到复制链接
      try {
        await navigator.clipboard.writeText(window.location.href)
        // TODO: 显示复制链接成功提示
      } catch (err) {
        console.error('复制链接失败:', err)
      }
    }
  }

  const handleDownload = () => {
    if (currentImage) {
      const link = document.createElement('a')
      link.href = currentImage
      link.download = `${artwork?.title || 'artwork'}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleInputClick = () => {
    if (!isAuthenticated) {
      // 可以在这里触发登录弹窗
      alert('请先登录后再发表评论')
      return
    }
    setIsInputFocused(true)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  const handleInputBlur = () => {
    if (!commentText.trim()) {
      setIsInputFocused(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !user || !artwork || isSubmittingComment) return

    setIsSubmittingComment(true)
    try {
      const insertData = {
        artwork_id: Number(artwork.id),
        user_id: user.id,
        content: commentText.trim(),
        parent_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('comments').insert(insertData)

      if (error) {
        console.error('提交评论失败:', error)
        alert('提交评论失败，请重试')
        return
      }

      setCommentText('')
      setIsInputFocused(false)
      setCommentCount(prev => prev + 1)
      setCommentSectionKey(prev => prev + 1)
    } catch (error) {
      console.error('提交评论时出错:', error)
      alert('提交评论失败，请重试')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const resetZoom = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const zoomIn = () => {
    const newScale = Math.min(scale + 0.1, 5)
    setScale(newScale)
  }

  const zoomOut = () => {
    const newScale = Math.max(scale - 0.1, 0.1)
    setScale(newScale)
  }

  return (
    <div className='image-gallery-modal' onClick={onClose}>
      {/* 背景遮罩 */}
      <div className={`modal-backdrop ${isFullscreen ? 'fullscreen-backdrop' : ''}`} />

      {/* 顶部关闭按钮 - 独立定位 */}
      <button className='modal-close' onClick={onClose}>
        <X size={16} />
      </button>

      {isFullscreen ? (
        /* 全屏模式 - 重新设计 */
        <div className='fullscreen-viewer' onClick={resetZoom}>
          {/* 顶部控制栏 */}
          <div className='fullscreen-controls' onClick={e => e.stopPropagation()}>
            <div className='control-group left'>
              <button
                className='control-btn'
                onClick={() => setIsFullscreen(false)}
                title='退出全屏 (ESC)'
              >
                <X size={18} />
              </button>
            </div>
            
            <div className='control-group center'>
              <button
                className='control-btn'
                onClick={zoomOut}
                title='缩小 (10%)'
                disabled={scale <= 0.1}
              >
                <ZoomOut size={18} />
              </button>
              <button
                className='control-btn'
                onClick={resetZoom}
                title='重置缩放'
                disabled={scale === 1}
              >
                <RotateCcw size={18} />
              </button>
              <div className='zoom-info'>
                {Math.round(scale * 100)}%
              </div>
              <button
                className='control-btn'
                onClick={zoomIn}
                title='放大 (10%)'
                disabled={scale >= 5}
              >
                <ZoomIn size={18} />
              </button>
            </div>
            
            <div className='control-group right'>
              <button className='control-btn download-btn' onClick={handleDownload} title='下载图片'>
                <Download size={18} />
                <span>下载</span>
              </button>
            </div>
          </div>

          {/* 全屏图片容器 */}
          <div 
            ref={imageContainerRef}
            className='fullscreen-image-container'
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            {/* 图片导航 - 左 */}
            {hasMultipleImages && currentImageIndex > 0 && (
              <button
                className='fullscreen-nav prev'
                onClick={e => {
                  e.stopPropagation()
                  setCurrentImageIndex(prev => prev - 1)
                  resetZoom()
                }}
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* 全屏图片 */}
            <div 
              className='fullscreen-image-wrapper'
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: '0 0',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              }}
              onMouseDown={handleMouseDown}
              onClick={e => e.stopPropagation()}
            >
              <img
                ref={imageRef}
                src={currentImage || '/placeholder.svg'}
                alt={artwork.title || ''}
                className='fullscreen-image'
                style={{
                  maxWidth: 'none',
                  maxHeight: 'none',
                  objectFit: 'contain',
                }}
                onDragStart={e => e.preventDefault()}
              />
            </div>

            {/* 图片导航 - 右 */}
            {hasMultipleImages && currentImageIndex < images.length - 1 && (
              <button
                className='fullscreen-nav next'
                onClick={e => {
                  e.stopPropagation()
                  setCurrentImageIndex(prev => prev + 1)
                  resetZoom()
                }}
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* 底部指示器 */}
          {hasMultipleImages && (
            <div className='fullscreen-indicators' onClick={e => e.stopPropagation()}>
              {images.map((_, index) => (
                <button
                  key={index}
                  className={`fullscreen-indicator ${index === currentImageIndex ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentImageIndex(index)
                    resetZoom()
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* 普通模式 - 优化布局 */
        <div className='modal-container' onClick={e => e.stopPropagation()}>
          {/* 左侧图片区域 */}
          <div className='modal-image-section'>
            <div className='modal-image-container'>
              {/* 图片导航 - 左 */}
              {hasMultipleImages && currentImageIndex > 0 && (
                <button
                  className='image-nav prev'
                  onClick={() => setCurrentImageIndex(prev => prev - 1)}
                >
                  <ChevronLeft size={16} />
                </button>
              )}

              {/* 主图片 */}
              <div className='image-wrapper' onClick={toggleFullscreen}>
                <img
                  src={currentImage || '/placeholder.svg'}
                  alt={artwork.title || ''}
                  className='modal-image'
                  style={{
                    objectFit: 'contain',
                  }}
                />
                <div className='image-overlay'>
                  <div className='zoom-hint'>
                    <ZoomIn size={20} />
                    <span>点击查看大图</span>
                  </div>
                </div>
              </div>

              {/* 图片导航 - 右 */}
              {hasMultipleImages && currentImageIndex < images.length - 1 && (
                <button
                  className='image-nav next'
                  onClick={() => setCurrentImageIndex(prev => prev + 1)}
                >
                  <ChevronRight size={16} />
                </button>
              )}
            </div>

            {/* 全屏按钮 */}
            <button className='fullscreen-toggle' onClick={toggleFullscreen} title='全屏查看'>
              <Maximize size={14} />
            </button>

            {/* 图片指示器 */}
            {hasMultipleImages && (
              <div className='image-indicators'>
                {images.map((_, index) => (
                  <button
                    key={index}
                    className={`indicator-dot ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 右侧详情面板 */}
          <div className='modal-details-section'>
            {/* 详情头部 */}
            <div className='modal-details-header'>
              {/* 作者信息 */}
              <div className='author-info'>
                <div className='author-avatar-wrapper'>
                  {artwork.profiles?.avatar_url ? (
                    <img
                      src={artwork.profiles.avatar_url}
                      alt={artwork.profiles.username || '用户'}
                      className='author-avatar'
                    />
                  ) : (
                    <div className='avatar-placeholder'>
                      {(artwork.profiles?.username || '用户').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className='author-details'>
                  <h4>{artwork.profiles?.username || '匿名艺术家'}</h4>
                  <div className='publish-date'>
                    {new Date(artwork.created_at).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
                <button className='follow-button'>关注</button>
              </div>

              <h1 className='artwork-title'>{artwork.title}</h1>
            </div>

            <div className='modal-details-content'>
              {/* 作品描述 */}
              {artwork.description && (
                <p className='artwork-description'>{artwork.description}</p>
              )}

              {/* AI参数面板 */}
              {(artwork.model ||
                artwork.steps ||
                artwork.cfg_scale ||
                artwork.sampler ||
                artwork.seed) && (
                <div className='ai-parameters'>
                  <div 
                    className='parameters-header'
                    onClick={() => setIsParametersExpanded(!isParametersExpanded)}
                  >
                    <span className='parameters-title'>
                      生成参数
                    </span>
                    <div className={`parameters-toggle ${isParametersExpanded ? 'expanded' : ''}`}>
                      <ChevronDown size={16} />
                    </div>
                  </div>
                  {isParametersExpanded && (
                    <div className='parameters-content'>
                      {artwork.model && (
                        <div className='parameter-item'>
                          <div className='parameter-label'>AI模型</div>
                          <div className='parameter-value'>{artwork.model}</div>
                        </div>
                      )}
                      {artwork.steps && (
                        <div className='parameter-item'>
                          <div className='parameter-label'>步数</div>
                          <div className='parameter-value'>{artwork.steps}</div>
                        </div>
                      )}
                      {artwork.cfg_scale && (
                        <div className='parameter-item'>
                          <div className='parameter-label'>CFG Scale</div>
                          <div className='parameter-value'>{artwork.cfg_scale}</div>
                        </div>
                      )}
                      {artwork.sampler && (
                        <div className='parameter-item'>
                          <div className='parameter-label'>采样器</div>
                          <div className='parameter-value'>{artwork.sampler}</div>
                        </div>
                      )}
                      {artwork.seed && (
                        <div className='parameter-item'>
                          <div className='parameter-label'>种子</div>
                          <div className='parameter-value'>{artwork.seed}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 评论区域 */}
              <div className='comments-section'>
                <h3 className='comments-header'>
                  <MessageCircle size={16} />
                  评论 ({commentCount})
                </h3>

                {/* 评论输入框 */}
                <div className='comment-input-container'>
                  <div className='comment-avatar-wrapper'>
                    {isAuthenticated && user ? (
                      <div className='comment-avatar'>
                        {user.user_metadata?.avatar_url ? (
                          <img
                            src={user.user_metadata.avatar_url}
                            alt='用户头像'
                            className='comment-avatar'
                          />
                        ) : (
                          <div className='avatar-placeholder'>
                            {(user.user_metadata?.username || '用户').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className='comment-avatar'>
                        <div className='avatar-placeholder'>?</div>
                      </div>
                    )}
                  </div>
                  <textarea
                    ref={inputRef}
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onClick={handleInputClick}
                    onBlur={handleInputBlur}
                    className='comment-input'
                    placeholder='写下你的想法...'
                    disabled={!isAuthenticated || isSubmittingComment}
                  />
                  {isInputFocused && (
                    <button
                      onClick={handleSubmitComment}
                      disabled={!commentText.trim() || isSubmittingComment}
                      className='comment-submit'
                    >
                      <Send size={14} />
                    </button>
                  )}
                </div>

                                 {/* 评论列表 */}
                 <CommentSection key={commentSectionKey} artworkId={artwork.id.toString()} />
              </div>
            </div>

            {/* 底部操作栏 */}
            <div className='modal-bottom-actions'>
              <button
                className={`action-button ${isLiked ? 'liked' : ''}`}
                onClick={handleLike}
                title='点赞'
              >
                <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
                <span>{likesCount}</span>
              </button>
              <button
                className={`action-button ${isBookmarked ? 'bookmarked' : ''}`}
                onClick={handleBookmark}
                title='收藏'
              >
                <Bookmark size={14} fill={isBookmarked ? 'currentColor' : 'none'} />
              </button>
              <button className='action-button' onClick={handleShare} title='分享'>
                <Share2 size={14} />
              </button>
              <button className='action-button download-action' onClick={handleDownload} title='下载'>
                <Download size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
