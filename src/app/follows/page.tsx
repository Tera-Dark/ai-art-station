'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { followService, FollowUser } from '@/lib/services/follow.service'
import { Users, UserPlus, UserMinus, ArrowLeft, Heart, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

type TabType = 'followers' | 'following'

// 底部提示消息组件
interface ToastProps {
  message: string
  isVisible: boolean
  type: 'success' | 'error'
}

function Toast({ message, isVisible, type }: ToastProps) {
  if (!isVisible) return null

  return (
    <div className={`toast ${type} ${isVisible ? 'show' : ''}`}>
      <span>{message}</span>
    </div>
  )
}

export default function FollowsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('followers')
  const [followers, setFollowers] = useState<FollowUser[]>([])
  const [following, setFollowing] = useState<FollowUser[]>([])
  const [loading, setLoading] = useState(true)
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({})

  // 底部提示状态
  const [toast, setToast] = useState({
    message: '',
    isVisible: false,
    type: 'success' as 'success' | 'error',
  })

  const loadFollowData = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      const [followersData, followingData] = await Promise.all([
        followService.getFollowers(user.id),
        followService.getFollowing(user.id),
      ])

      setFollowers(followersData)
      setFollowing(followingData)

      // 获取当前用户对所有显示用户的关注状态
      const allUserIds = [...followersData.map(u => u.id), ...followingData.map(u => u.id)]

      if (allUserIds.length > 0) {
        const status: Record<string, boolean> = {}
        for (const userId of allUserIds) {
          status[userId] = await followService.isFollowing(userId)
        }
        setFollowingStatus(status)
      }
    } catch (error) {
      console.error('加载关注数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadFollowData()
    }
  }, [user, loadFollowData])

  // 显示提示消息
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, isVisible: true, type })
    setTimeout(() => {
      setToast(prev => ({ ...prev, isVisible: false }))
    }, 3000)
  }

  // 跳转到用户主页
  const handleUserClick = (_userId: string) => {
    // 暂时跳转到主页，后续可以扩展为用户个人主页
    // TODO: 创建动态路由 /users/[userId] 来查看其他用户的个人主页
    router.push('/')
  }

  const handleFollow = async (userId: string) => {
    const isCurrentlyFollowing = followingStatus[userId]

    try {
      const success = isCurrentlyFollowing
        ? await followService.unfollowUser(userId)
        : await followService.followUser(userId)

      if (success) {
        setFollowingStatus(prev => ({
          ...prev,
          [userId]: !isCurrentlyFollowing,
        }))

        // 显示成功提示
        const action = isCurrentlyFollowing ? '取消关注' : '关注'
        showToast(`${action}成功`, 'success')

        // 如果是在关注页面取消关注，更新粉丝数量但保持用户在列表中
        if (isCurrentlyFollowing && activeTab === 'following') {
          setFollowing(prev =>
            prev.map(u =>
              u.id === userId ? { ...u, followers_count: Math.max(0, u.followers_count - 1) } : u
            )
          )
        } else if (!isCurrentlyFollowing && activeTab === 'followers') {
          // 如果是在粉丝页面关注用户，更新粉丝数量
          setFollowers(prev =>
            prev.map(u => (u.id === userId ? { ...u, followers_count: u.followers_count + 1 } : u))
          )
        }
      } else {
        showToast('操作失败，请稍后重试', 'error')
      }
    } catch (error) {
      console.error('关注操作失败:', error)
      showToast('操作失败，请稍后重试', 'error')
    }
  }

  const handleBack = () => {
    router.back()
  }

  if (!user) {
    return (
      <div className='page-container'>
        <div className='container'>
          <div className='loading-container'>
            <p>请先登录</p>
          </div>
        </div>
      </div>
    )
  }

  const currentList = activeTab === 'followers' ? followers : following

  return (
    <div className='page-container'>
      {/* 顶部导航 */}
      <div className='follows-nav'>
        <button className='nav-back-button' onClick={handleBack}>
          <ArrowLeft size={20} />
          <span>返回</span>
        </button>
        <h1 className='nav-title'>关注列表</h1>
      </div>

      <div className='container'>
        <div className='follows-page'>
          {/* 标签切换 */}
          <div className='follows-tabs'>
            <button
              className={`tab-button ${activeTab === 'followers' ? 'active' : ''}`}
              onClick={() => setActiveTab('followers')}
            >
              <Users size={18} />
              <span>粉丝</span>
              <span className='tab-count'>({followers.length})</span>
            </button>
            <button
              className={`tab-button ${activeTab === 'following' ? 'active' : ''}`}
              onClick={() => setActiveTab('following')}
            >
              <Heart size={18} />
              <span>关注</span>
              <span className='tab-count'>({following.length})</span>
            </button>
          </div>

          {/* 内容区域 */}
          <div className='follows-content'>
            {loading ? (
              <div className='loading-state'>
                <div className='loading-spinner'></div>
                <p>加载中...</p>
              </div>
            ) : currentList.length === 0 ? (
              <div className='empty-state'>
                <div className='empty-icon'>
                  {activeTab === 'followers' ? <Users size={48} /> : <Heart size={48} />}
                </div>
                <h3>{activeTab === 'followers' ? '还没有粉丝' : '还没有关注任何人'}</h3>
                <p>
                  {activeTab === 'followers'
                    ? '发布优质作品来吸引更多粉丝吧！'
                    : '去发现一些优秀的创作者并关注他们吧！'}
                </p>
              </div>
            ) : (
              <div className='users-list'>
                {currentList.map(listUser => (
                  <div key={listUser.id} className='user-card'>
                    {/* 可点击的用户信息区域 */}
                    <div
                      className='user-info clickable'
                      onClick={() => handleUserClick(listUser.id)}
                    >
                      <div className='user-avatar'>
                        {listUser.avatar_url ? (
                          <Image
                            src={listUser.avatar_url}
                            alt={listUser.username || '用户'}
                            width={48}
                            height={48}
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <div className='avatar-placeholder'>
                            {(listUser.username || listUser.display_name || '用户')
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className='user-details'>
                        <div className='user-name-row'>
                          <h4 className='user-name'>
                            {listUser.display_name || listUser.username || '匿名用户'}
                          </h4>
                          <ExternalLink size={14} className='external-link-icon' />
                        </div>
                        <div className='user-stats'>
                          <span>{listUser.followers_count} 粉丝</span>
                          {listUser.following_count !== undefined && (
                            <>
                              <span className='stats-divider'>·</span>
                              <span>{listUser.following_count} 关注</span>
                            </>
                          )}
                        </div>
                        <div className='follow-date'>
                          {activeTab === 'followers' ? '关注了你' : '关注于'}{' '}
                          {new Date(listUser.followed_at).toLocaleDateString('zh-CN')}
                        </div>
                      </div>
                    </div>

                    {/* 关注/取关按钮 */}
                    {user &&
                      user.id !== listUser.id && ( // 不显示自己的按钮
                        <div className='user-actions'>
                          <button
                            className={`follow-button ${followingStatus[listUser.id] ? 'following' : ''}`}
                            onClick={e => {
                              e.stopPropagation()
                              handleFollow(listUser.id)
                            }}
                          >
                            {followingStatus[listUser.id] ? (
                              <>
                                <UserMinus size={16} />
                                <span>取关</span>
                              </>
                            ) : (
                              <>
                                <UserPlus size={16} />
                                <span>关注</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部提示消息 */}
      <Toast message={toast.message} isVisible={toast.isVisible} type={toast.type} />
    </div>
  )
}
