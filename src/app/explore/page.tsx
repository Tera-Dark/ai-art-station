'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { ArtworkGrid } from '@/components/features/artwork-grid'
import { UploadModal } from '@/components/features/upload-modal'
import { AuthModal } from '@/components/features/auth-modal'
import { ImageGalleryModal } from '@/components/features/image-gallery-modal'
import { Artwork } from '@/types/artwork'
import { supabase } from '@/lib/services/supabase.service'
import { User } from '@supabase/supabase-js'

const AI_MODELS = [
  { id: 'all', name: '全部模型', icon: '🎨' },
  { id: 'midjourney', name: 'Midjourney', icon: '🌙' },
  { id: 'dall-e', name: 'DALL-E', icon: '🤖' },
  { id: 'stable-diffusion', name: 'Stable Diffusion', icon: '🔮' },
  { id: 'firefly', name: 'Adobe Firefly', icon: '🔥' },
  { id: 'leonardo', name: 'Leonardo AI', icon: '🎭' },
]

export default function Explore() {
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [filteredArtworks, setFilteredArtworks] = useState<Artwork[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // 获取作品数据
  useEffect(() => {
    fetchArtworks()
  }, [])

  const fetchArtworks = async () => {
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
        .order('created_at', { ascending: false })

      if (error) {
        console.error('获取作品失败:', error)
        return
      }

      const artworksWithCounts = await Promise.all(
        (data || []).map(async artwork => {
          // 获取点赞数
          const { count: likesCount } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('artwork_id', artwork.id)

          // 获取评论数
          const { count: commentsCount } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('artwork_id', artwork.id)

          return {
            ...artwork,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            views_count: Math.floor(Math.random() * 1000) + 100, // 临时模拟浏览量
          }
        })
      )

      setArtworks(artworksWithCounts)
      setFilteredArtworks(artworksWithCounts)
    } catch (error) {
      console.error('获取作品时出错:', error)
    } finally {
      setLoading(false)
    }
  }

  // 筛选作品
  useEffect(() => {
    let filtered = artworks

    // 按AI模型筛选
    if (selectedModel !== 'all') {
      filtered = filtered.filter(artwork => {
        if (!artwork.model) return false
        return artwork.model.toLowerCase().includes(selectedModel.toLowerCase())
      })
    }

    // 按搜索词筛选
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        artwork =>
          artwork.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          artwork.prompt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          artwork.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
          artwork.profiles?.username?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredArtworks(filtered)
  }, [selectedModel, searchQuery, artworks])

  // 计算各模型作品数量并安全更新
  const modelCategories = AI_MODELS.map(model => {
    let count = 0
    if (model.id === 'all') {
      count = artworks.length
    } else if (model.id === 'midjourney') {
      count = artworks.filter(a => a.model?.toLowerCase().includes('midjourney')).length
    } else if (model.id === 'dall-e') {
      count = artworks.filter(a => a.model?.toLowerCase().includes('dall')).length
    } else if (model.id === 'stable-diffusion') {
      count = artworks.filter(a => a.model?.toLowerCase().includes('stable')).length
    } else if (model.id === 'firefly') {
      count = artworks.filter(a => a.model?.toLowerCase().includes('firefly')).length
    } else if (model.id === 'leonardo') {
      count = artworks.filter(a => a.model?.toLowerCase().includes('leonardo')).length
    }

    return {
      ...model,
      count,
    }
  })

  const handleArtworkClick = (artwork: Artwork) => {
    console.log('查看作品:', artwork)
    setSelectedArtwork(artwork)
    setIsDetailModalOpen(true)
  }

  const handleLoginSuccess = (_loggedInUser: User) => {
    setShowAuthModal(false)
  }

  const handleUploadSuccess = () => {
    fetchArtworks() // 重新获取作品列表
    setIsUploadModalOpen(false)
  }

  if (loading) {
    return (
      <div className='container'>
        <div className='loading-container'>
          <div className='loading-spinner' />
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='page-container'>
      {/* Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onUploadClick={() => setIsUploadModalOpen(true)}
      />

      <div className='container'>
        {/* 页面头部 - 改进设计 */}
        <div className='explore-hero'>
          <div className='hero-background'>
            <div className='hero-content'>
              <div className='hero-icon'>
                <span className='icon-gradient'>🔍</span>
              </div>
              <h1 className='hero-title'>探索精彩AI艺术</h1>
              <p className='hero-subtitle'>发现来自全球创作者的创意作品，感受AI艺术的无限可能</p>
              <div className='hero-stats'>
                <div className='stat-item'>
                  <span className='stat-number'>{artworks.length}</span>
                  <span className='stat-label'>精选作品</span>
                </div>
                <div className='stat-divider'>·</div>
                <div className='stat-item'>
                  <span className='stat-number'>{AI_MODELS.length - 1}</span>
                  <span className='stat-label'>AI模型</span>
                </div>
                <div className='stat-divider'>·</div>
                <div className='stat-item'>
                  <span className='stat-number'>∞</span>
                  <span className='stat-label'>创意无限</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI模型分类 - 改进设计 */}
        <div className='models-section'>
          <div className='section-header'>
            <h2 className='section-title'>AI模型工坊</h2>
            <p className='section-subtitle'>选择您感兴趣的AI创作工具</p>
          </div>
          <div className='models-grid'>
            {modelCategories.map(model => (
              <button
                key={model.id}
                className={`model-card ${selectedModel === model.id ? 'active' : ''}`}
                onClick={() => setSelectedModel(model.id)}
              >
                <div className='model-card-header'>
                  <span className='model-icon-large'>{model.icon}</span>
                  <div className='model-badge'>
                    <span className='badge-count'>{model.count}</span>
                  </div>
                </div>
                <div className='model-card-content'>
                  <h3 className='model-title'>{model.name}</h3>
                  <p className='model-description'>
                    {model.count} 件{model.id === 'all' ? '精选' : ''}作品
                  </p>
                </div>
                <div className='model-card-footer'>
                  <span className='view-text'>查看作品</span>
                  <span className='arrow'>→</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 作品展示区域 */}
        <div className='artworks-section'>
          <div className='section-header'>
            <h2 className='section-title'>
              {selectedModel === 'all' 
                ? '全部作品' 
                : `${AI_MODELS.find(m => m.id === selectedModel)?.name} 作品`}
            </h2>
            <div className='results-info'>
              <span className='results-count'>{filteredArtworks.length} 件作品</span>
              {searchQuery && (
                <span className='search-info'>包含 &ldquo;{searchQuery}&rdquo;</span>
              )}
            </div>
          </div>
          
          <ArtworkGrid artworks={filteredArtworks} onArtworkClick={handleArtworkClick} />
        </div>
      </div>

      {/* 上传模态框 */}
      {isUploadModalOpen && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUploadSuccess={handleUploadSuccess}
          onUpdateSuccess={() => {}}
          artworkToEdit={null}
        />
      )}

      {/* 登录模态框 */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* 详情模态框 */}
      {selectedArtwork && (
        <ImageGalleryModal
          artwork={selectedArtwork}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false)
            setSelectedArtwork(null)
          }}
        />
      )}
    </div>
  )
}
