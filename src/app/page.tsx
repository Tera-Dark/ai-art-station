'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { ArtworkGrid } from '@/components/features/artwork-grid'
import { UploadModal } from '@/components/features/upload-modal'
import { ImageGalleryModal } from '@/components/features/image-gallery-modal'
import { Artwork } from '@/types/artwork'
import { getArtworks } from '@/lib/services/artwork.service'
import { supabase } from '@/lib/services/supabase.service'

export default function Home() {
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [filteredArtworks, setFilteredArtworks] = useState<Artwork[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  // 获取作品数据
  useEffect(() => {
    fetchArtworks()
  }, [])

  const fetchArtworks = async () => {
    try {
      console.log('开始获取作品数据...')
      const artworksData = await getArtworks()
      console.log('获取到作品数据:', artworksData.length, '条')

      if (artworksData.length === 0) {
        console.log('没有获取到任何作品数据')
        setArtworks([])
        setFilteredArtworks([])
        return
      }

      console.log('开始获取统计数据...')
      const artworksWithCounts = await Promise.all(
        artworksData.map(async artwork => {
          try {
            // 获取点赞数
            const { count: likesCount, error: likesError } = await supabase
              .from('likes')
              .select('*', { count: 'exact', head: true })
              .eq('artwork_id', artwork.id)

            if (likesError) {
              console.warn(`获取作品 ${artwork.id} 点赞数失败:`, likesError)
            }

            // 获取评论数
            const { count: commentsCount, error: commentsError } = await supabase
              .from('comments')
              .select('*', { count: 'exact', head: true })
              .eq('artwork_id', artwork.id)

            if (commentsError) {
              console.warn(`获取作品 ${artwork.id} 评论数失败:`, commentsError)
            }

            return {
              ...artwork,
              likes_count: likesCount || 0,
              comments_count: commentsCount || 0,
              views_count: Math.floor(Math.random() * 1000) + 100, // 临时模拟浏览量
            }
          } catch (error) {
            console.error(`处理作品 ${artwork.id} 统计数据时出错:`, error)
            return {
              ...artwork,
              likes_count: 0,
              comments_count: 0,
              views_count: Math.floor(Math.random() * 1000) + 100,
            }
          }
        })
      )

      console.log('作品数据处理完成，设置状态...')
      setArtworks(artworksWithCounts)
      setFilteredArtworks(artworksWithCounts)
      console.log('作品数据设置完成')
    } catch (error) {
      console.error('获取作品失败:', error)
      // 提供更详细的错误信息
      if (error instanceof Error) {
        console.error('错误详情:', error.message)
        console.error('错误堆栈:', error.stack)
      }
      setArtworks([])
      setFilteredArtworks([])
    } finally {
      setLoading(false)
    }
  }

  // 筛选作品
  useEffect(() => {
    let filtered = artworks

    // 按分类筛选
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(artwork => {
        if (selectedCategory === 'popular') {
          return (artwork.likes_count || 0) > 5
        }
        if (selectedCategory === 'recent') {
          const isRecent =
            new Date(artwork.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          return isRecent
        }
        if (selectedCategory === 'novelai') {
          return (
            artwork.model?.toLowerCase().includes('novelai') ||
            artwork.model?.toLowerCase().includes('nai')
          )
        }
        return artwork.model?.toLowerCase().includes(selectedCategory.toLowerCase())
      })
    }

    // 按搜索词筛选
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        artwork =>
          artwork.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          artwork.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
          artwork.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
          artwork.profiles?.username?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredArtworks(filtered)
  }, [selectedCategory, searchQuery, artworks])

  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const handleArtworkClick = (artwork: Artwork) => {
    console.log('查看作品:', artwork)
    setSelectedArtwork(artwork)
    setIsDetailModalOpen(true)
  }

  const categories = [
    { id: 'all', name: '全部', count: artworks.length },
    { id: 'popular', name: '热门', count: artworks.filter(a => (a.likes_count || 0) > 5).length },
    {
      id: 'recent',
      name: '最新',
      count: artworks.filter(
        a => new Date(a.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length,
    },
    {
      id: 'midjourney',
      name: 'Midjourney',
      count: artworks.filter(a => a.model?.toLowerCase().includes('midjourney')).length,
    },
    {
      id: 'stable-diffusion',
      name: 'Stable Diffusion',
      count: artworks.filter(a => a.model?.toLowerCase().includes('stable')).length,
    },
    {
      id: 'novelai',
      name: 'NovelAI',
      count: artworks.filter(
        a => a.model?.toLowerCase().includes('novelai') || a.model?.toLowerCase().includes('nai')
      ).length,
    },
    {
      id: 'flux',
      name: 'Flux',
      count: artworks.filter(a => a.model?.toLowerCase().includes('flux')).length,
    },
  ]

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
        {/* Hero Section */}
        <section className='hero-section'>
          <div className='hero-content'>
            <h1 className='hero-title'>AI 艺术作品展示</h1>
            <p className='hero-subtitle'>
              探索由人工智能创作的精美艺术作品，感受科技与创意的完美融合
            </p>
            <button className='cta-button' onClick={() => setIsUploadModalOpen(true)}>
              <span>上传你的作品</span>
            </button>
          </div>
        </section>

        {/* Filter Section */}
        <div className='filter-tags'>
          <div className='filter-container'>
            {categories.map(category => (
              <button
                key={category.id}
                className={`filter-tag ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <span>
                  {category.name} ({category.count})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Artworks Grid */}
        {filteredArtworks.length > 0 ? (
          <ArtworkGrid
            artworks={filteredArtworks}
            onArtworkClick={handleArtworkClick}
            onArtworkBookmark={artworkId => {
              console.log('收藏作品:', artworkId)
              // 收藏逻辑已在 ArtworkCard 中实现
            }}
          />
        ) : (
          <div className='empty-state'>
            <p>没有找到符合条件的作品</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        onUpdateSuccess={handleUploadSuccess}
        artworkToEdit={null}
      />

      {/* Detail Modal */}
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
