'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { ArtworkGrid } from '@/components/features/artwork-grid'

import { UploadModal } from '@/components/features/upload-modal'
import { Artwork } from '@/types/artwork'
import { supabase } from '@/lib/services/supabase.service'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'

export default function MyWorksPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')

  // 控制上传/编辑模态框
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [artworkToEdit, setArtworkToEdit] = useState<Artwork | null>(null)

  const { isAuthenticated, user } = useAuth()
  const router = useRouter()

  // 如果用户未登录，重定向到首页
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push('/')
    }
  }, [isAuthenticated, loading, router])

  // 获取用户作品
  useEffect(() => {
    const fetchUserArtworks = async () => {
      if (!user) return

      setLoading(true)
      setError(null)

      try {
        const { data, error } = await supabase
          .from('artworks')
          .select(
            `
            *,
            profiles (
              username,
              avatar_url
            )
          `
          )
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        if (data) {
          setArtworks(data as Artwork[])
        }
      } catch (err: any) {
        setError(err.message || '获取作品失败')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchUserArtworks()
    }
  }, [user])

  const handleUploadSuccess = (newArtwork: Artwork) => {
    setArtworks(prev => [newArtwork, ...prev])
  }

  const handleUpdateSuccess = (updatedArtwork: Artwork) => {
    setArtworks(prev => prev.map(art => (art.id === updatedArtwork.id ? updatedArtwork : art)))
    setArtworkToEdit(null)
    setIsUploadModalOpen(false)
  }

  const openUploadModal = () => {
    setArtworkToEdit(null) // 确保是上传而不是编辑
    setIsUploadModalOpen(true)
  }

  // 根据标签筛选作品
  const filteredArtworks = artworks.filter(artwork => {
    // 基本搜索过滤
    const matchesSearch =
      searchQuery === '' ||
      artwork.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artwork.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (artwork.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ?? false)

    // 根据标签页筛选
    if (activeTab === 'all') {
      return matchesSearch
    } else if (activeTab === 'popular') {
      return matchesSearch && artwork.likes_count > 0
    } else if (activeTab === 'recent') {
      // 最近7天的作品
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      return matchesSearch && new Date(artwork.created_at) >= oneWeekAgo
    }

    return matchesSearch
  })

  // 如果未登录，显示加载状态
  if (!isAuthenticated && !user) {
    return (
      <div>
        <Header searchQuery='' onSearchChange={() => {}} onUploadClick={() => {}} />
        <main className='main'>
          <div className='loading-container'>
            <Loader2 className='animate-spin' size={32} />
            <p>正在检查登录状态...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className='page-container'>
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onUploadClick={openUploadModal}
      />

      <main className='container'>
        {/* 页面英雄区 */}
        <div className='my-works-hero'>
          <div className='hero-background-gradient'>
            <div className='hero-content-center'>
              <div className='hero-icon-wrapper'>
                <span className='hero-icon-large'>🎨</span>
              </div>
              <h1 className='hero-title-large'>我的创作空间</h1>
              <p className='hero-subtitle-detailed'>管理您的AI艺术作品，展示创意成果</p>
              
              {/* 统计信息卡片 */}
              <div className='stats-grid'>
                <div className='stat-card modern'>
                  <div className='stat-icon'>📊</div>
                  <div className='stat-content'>
                    <span className='stat-number'>{artworks.length}</span>
                    <span className='stat-label'>总作品数</span>
                  </div>
                </div>
                <div className='stat-card modern'>
                  <div className='stat-icon'>❤️</div>
                  <div className='stat-content'>
                    <span className='stat-number'>
                      {artworks.reduce((sum, artwork) => sum + (artwork.likes_count || 0), 0)}
                    </span>
                    <span className='stat-label'>总获赞数</span>
                  </div>
                </div>
                <div className='stat-card modern'>
                  <div className='stat-icon'>👁️</div>
                  <div className='stat-content'>
                    <span className='stat-number'>
                      {artworks.reduce((sum, artwork) => sum + (artwork.views_count || 0), 0)}
                    </span>
                    <span className='stat-label'>总浏览量</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 导航标签页 */}
        <div className='content-section'>
          <div className='tabs-container'>
            <div className='tabs-wrapper'>
              <button
                className={`tab-button modern ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                <span className='tab-icon'>📋</span>
                <span>全部作品</span>
                <span className='tab-count'>{artworks.length}</span>
              </button>
              <button
                className={`tab-button modern ${activeTab === 'popular' ? 'active' : ''}`}
                onClick={() => setActiveTab('popular')}
              >
                <span className='tab-icon'>🔥</span>
                <span>热门作品</span>
                <span className='tab-count'>
                  {artworks.filter(a => (a.likes_count || 0) > 0).length}
                </span>
              </button>
              <button
                className={`tab-button modern ${activeTab === 'recent' ? 'active' : ''}`}
                onClick={() => setActiveTab('recent')}
              >
                <span className='tab-icon'>🕒</span>
                <span>最近作品</span>
                <span className='tab-count'>
                  {artworks.filter(a => {
                    const oneWeekAgo = new Date()
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
                    return new Date(a.created_at) >= oneWeekAgo
                  }).length}
                </span>
              </button>
            </div>
          </div>

          {/* 作品展示区域 */}
          <div className='artworks-display-section'>
            <div className='section-header-modern'>
              <h2 className='section-title-modern'>
                {activeTab === 'all' && '全部作品'}
                {activeTab === 'popular' && '热门作品'}
                {activeTab === 'recent' && '最近作品'}
              </h2>
              <div className='results-info-modern'>
                <span className='results-count-modern'>{filteredArtworks.length} 件作品</span>
                {searchQuery && (
                  <span className='search-info-modern'>匹配 &ldquo;{searchQuery}&rdquo;</span>
                )}
              </div>
            </div>

            {/* 状态消息 */}
            {loading && (
              <div className='status-card loading'>
                <Loader2 className='status-icon animate-spin' size={24} />
                <span>正在加载作品...</span>
              </div>
            )}
            
            {error && (
              <div className='status-card error'>
                <AlertCircle className='status-icon' size={24} />
                <span>{error}</span>
              </div>
            )}

            {/* 作品网格或空状态 */}
            {!loading && !error && (
              <>
                {filteredArtworks.length > 0 ? (
                  <ArtworkGrid 
                    artworks={filteredArtworks} 
                    onArtworkClick={(artwork) => console.log('查看作品:', artwork)}
                  />
                ) : (
                  <div className='empty-state-modern'>
                    <div className='empty-icon-large'>🎭</div>
                    <h3 className='empty-title'>
                      {activeTab === 'all' && '还没有作品'}
                      {activeTab === 'popular' && '暂无热门作品'}
                      {activeTab === 'recent' && '最近没有新作品'}
                    </h3>
                    <p className='empty-description'>
                      {activeTab === 'all' && '开始您的第一个AI艺术创作吧！'}
                      {activeTab === 'popular' && '努力创作更多优质作品，获得更多点赞'}
                      {activeTab === 'recent' && '最近7天内没有新作品，来创作一些新的吧'}
                    </p>
                    {activeTab === 'all' && (
                      <button className='cta-button' onClick={openUploadModal}>
                        <span>开始创作</span>
                        <span className='button-icon'>✨</span>
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* 上传/编辑模态框 */}
      {isUploadModalOpen && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => {
            setIsUploadModalOpen(false)
            setArtworkToEdit(null)
          }}
          onUploadSuccess={handleUploadSuccess}
          onUpdateSuccess={handleUpdateSuccess}
          artworkToEdit={artworkToEdit}
        />
      )}
    </div>
  )
}
