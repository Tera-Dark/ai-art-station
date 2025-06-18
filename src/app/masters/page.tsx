'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { UserMenu } from '@/components/layout/user-menu'
import { useAuth } from '@/contexts/auth-context'
import { AuthModal } from '@/components/features/auth-modal'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/services/supabase.service'
import { ArtworkGrid } from '@/components/features/artwork-grid'
import { Artwork } from '@/types/artwork'

interface Creator {
  id: string
  username: string
  avatar_url: string | null
  worksCount: number
  likesCount: number
  artworks: Artwork[]
}

export default function MastersPage() {
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated, user } = useAuth()
  const pathname = usePathname()

  // 从数据库获取创作者数据
  useEffect(() => {
    const fetchCreators = async () => {
      setLoading(true)
      setError(null)

      try {
        // 1. 获取所有作品及其创作者信息
        const { data: artworksData, error: artworksError } = await supabase
          .from('artworks')
          .select(
            `
            *,
            profiles (
              id,
              username,
              avatar_url
            )
          `
          )
          .order('created_at', { ascending: false })

        if (artworksError) throw artworksError

        if (!artworksData) {
          setCreators([])
          return
        }

        // 2. 按创作者分组，计算每个创作者的作品数和总点赞数
        const creatorsMap: Record<string, Creator> = {}

        artworksData.forEach(artwork => {
          if (!artwork.profiles || !artwork.user_id) return

          const creatorId = artwork.user_id

          if (!creatorsMap[creatorId]) {
            creatorsMap[creatorId] = {
              id: creatorId,
              username: artwork.profiles.username || '匿名用户',
              avatar_url: artwork.profiles.avatar_url,
              worksCount: 0,
              likesCount: 0,
              artworks: [],
            }
          }

          creatorsMap[creatorId].worksCount++
          creatorsMap[creatorId].likesCount += artwork.likes_count || 0

          // 每个创作者最多保存前8个作品作为预览
          if (creatorsMap[creatorId].artworks.length < 8) {
            creatorsMap[creatorId].artworks.push(artwork as Artwork)
          }
        })

        // 3. 转换为数组并按热度排序
        const creatorsArray = Object.values(creatorsMap)
          .filter(creator => creator.worksCount >= 2) // 至少有2个作品的创作者
          .sort((a, b) => b.likesCount - a.likesCount) // 按点赞数排序
          .slice(0, 20) // 只显示前20个热门创作者

        setCreators(creatorsArray)
      } catch (err: any) {
        setError(err.message || '获取创作者数据失败')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchCreators()
  }, [])

  const handleCreatorClick = (creator: Creator) => {
    setSelectedCreator(creator)
  }

  const handleBackToList = () => {
    setSelectedCreator(null)
  }

  const handleLoginSuccess = (_loggedInUser: User) => {
    setShowAuthModal(false)
  }

  // 创作者详情页面
  if (selectedCreator) {
    return (
      <div className='page-container'>
        {/* 简化的头部导航 */}
        <header className='header'>
          <nav className='nav'>
            <Link href='/' className='logo'>
              AI Art Station
            </Link>

            <ul className='nav-links'>
              <li>
                <Link href='/' className={pathname === '/' ? 'active' : ''}>
                  首页
                </Link>
              </li>
              <li>
                <Link href='/explore' className={pathname === '/explore' ? 'active' : ''}>
                  探索
                </Link>
              </li>
              <li>
                <Link href='/masters' className={pathname === '/masters' ? 'active' : ''}>
                  大神
                </Link>
              </li>
              <li>
                <Link href='/tools' className={pathname === '/tools' ? 'active' : ''}>
                  工具
                </Link>
              </li>
            </ul>

            <div className='nav-actions'>
              {isAuthenticated && user ? (
                <UserMenu onUploadClick={() => {}} user={user} />
              ) : (
                <button className='upload-btn' onClick={() => setShowAuthModal(true)}>
                  登录 / 注册
                </button>
              )}
            </div>
          </nav>
        </header>

        {/* 创作者详情页 */}
        <div className='creator-detail'>
          <div className='creator-header'>
            <button className='back-button' onClick={handleBackToList}>
              ← 返回
            </button>
            <div className='creator-profile'>
              <div className='creator-avatar large'>
                {selectedCreator.avatar_url ? (
                  <Image
                    src={selectedCreator.avatar_url}
                    alt={selectedCreator.username}
                    width={80}
                    height={80}
                  />
                ) : (
                  <div className='avatar-placeholder large'>
                    {selectedCreator.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className='creator-info'>
                <h1 className='creator-name'>{selectedCreator.username}</h1>
                <div className='creator-stats'>
                  <span>{selectedCreator.worksCount} 作品</span>
                  <span>{selectedCreator.likesCount} 点赞</span>
                </div>
              </div>
            </div>
          </div>

          <div className='section-title'>作品展示</div>
          {selectedCreator.artworks.length > 0 ? (
            <ArtworkGrid
              artworks={selectedCreator.artworks}
              onArtworkClick={() => {}} // 可以在这里添加查看详情功能
            />
          ) : (
            <div className='empty-state'>
              <h3>暂无作品</h3>
              <p>该创作者还没有发布作品</p>
            </div>
          )}
        </div>

        {/* 认证模态框 */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    )
  }

  // 创作者列表页面
  return (
    <div className='page-container'>
      {/* 简化的头部导航 */}
      <header className='header'>
        <nav className='nav'>
          <Link href='/' className='logo'>
            AI Art Station
          </Link>

          <ul className='nav-links'>
            <li>
              <Link href='/' className={pathname === '/' ? 'active' : ''}>
                首页
              </Link>
            </li>
            <li>
              <Link href='/explore' className={pathname === '/explore' ? 'active' : ''}>
                探索
              </Link>
            </li>
            <li>
              <Link href='/masters' className={pathname === '/masters' ? 'active' : ''}>
                大神
              </Link>
            </li>
            <li>
              <Link href='/tools' className={pathname === '/tools' ? 'active' : ''}>
                工具
              </Link>
            </li>
          </ul>

          <div className='nav-actions'>
            {isAuthenticated && user ? (
              <UserMenu onUploadClick={() => {}} user={user} />
            ) : (
              <button className='upload-btn' onClick={() => setShowAuthModal(true)}>
                登录 / 注册
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* 页面头部 */}
      <header className='page-header'>
        <h1>推荐大神</h1>
        <p>发现优秀的AI艺术创作者</p>
      </header>

      <div className='container'>
        {/* 加载状态 */}
        {loading && <div className='status-message'>正在加载创作者数据...</div>}

        {/* 错误状态 */}
        {error && <div className='status-message error'>{error}</div>}

        {/* 创作者网格 */}
        {!loading && !error && (
          <>
            {creators.length > 0 ? (
              <div className='creators-grid'>
                {creators.map(creator => (
                  <div
                    key={creator.id}
                    className='creator-card'
                    onClick={() => handleCreatorClick(creator)}
                  >
                    <div className='creator-avatar'>
                      {creator.avatar_url ? (
                        <Image
                          src={creator.avatar_url}
                          alt={creator.username}
                          width={64}
                          height={64}
                        />
                      ) : (
                        <div className='avatar-placeholder'>
                          {creator.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className='creator-info'>
                      <h3 className='creator-name'>{creator.username}</h3>
                      <div className='creator-stats'>
                        <span>{creator.worksCount} 作品</span>
                        <span>{creator.likesCount} 点赞</span>
                      </div>
                    </div>
                    <div className='creator-preview'>
                      {creator.artworks.slice(0, 4).map((artwork, _index) => (
                        <div key={artwork.id} className='preview-thumbnail'>
                          <Image
                            src={artwork.image_url}
                            alt={artwork.title}
                            width={60}
                            height={60}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='empty-state'>
                <h3>暂无推荐创作者</h3>
                <p>目前还没有足够的数据来推荐创作者</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* 认证模态框 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  )
}
