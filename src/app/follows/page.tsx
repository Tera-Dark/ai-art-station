'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { followService, FollowUser } from '@/lib/services/follow.service'
import { Users, UserPlus, UserMinus, ArrowLeft, Heart } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

type TabType = 'followers' | 'following'

export default function FollowsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('followers')
  const [followers, setFollowers] = useState<FollowUser[]>([])
  const [following, setFollowing] = useState<FollowUser[]>([])
  const [loading, setLoading] = useState(true)
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (user) {
      loadFollowData()
    }
  }, [user])

  const loadFollowData = async () => {
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
  }

  const handleFollow = async (userId: string) => {
    const isCurrentlyFollowing = followingStatus[userId]

    const success = isCurrentlyFollowing
      ? await followService.unfollowUser(userId)
      : await followService.followUser(userId)

    if (success) {
      setFollowingStatus(prev => ({
        ...prev,
        [userId]: !isCurrentlyFollowing,
      }))

      // 如果取消关注，从关注列表中移除
      if (isCurrentlyFollowing && activeTab === 'following') {
        setFollowing(prev => prev.filter(u => u.id !== userId))
      }
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
                {currentList.map(user => (
                  <div key={user.id} className='user-card'>
                    <div className='user-info'>
                      <div className='user-avatar'>
                        {user.avatar_url ? (
                          <Image
                            src={user.avatar_url}
                            alt={user.username || '用户'}
                            width={48}
                            height={48}
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <div className='avatar-placeholder'>
                            {(user.username || user.display_name || '用户').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className='user-details'>
                        <h4 className='user-name'>
                          {user.display_name || user.username || '匿名用户'}
                        </h4>
                        <div className='user-stats'>
                          <span>{user.followers_count} 粉丝</span>
                          {user.following_count !== undefined && (
                            <>
                              <span className='stats-divider'>·</span>
                              <span>{user.following_count} 关注</span>
                            </>
                          )}
                        </div>
                        <div className='follow-date'>
                          {activeTab === 'followers' ? '关注了你' : '关注于'}{' '}
                          {new Date(user.followed_at).toLocaleDateString('zh-CN')}
                        </div>
                      </div>
                    </div>

                    {/* 关注按钮 */}
                    {user.id !== user.id && ( // 不显示自己
                      <button
                        className={`follow-button ${followingStatus[user.id] ? 'following' : ''}`}
                        onClick={() => handleFollow(user.id)}
                      >
                        {followingStatus[user.id] ? (
                          <>
                            <UserMinus size={16} />
                            <span>取消关注</span>
                          </>
                        ) : (
                          <>
                            <UserPlus size={16} />
                            <span>关注</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
