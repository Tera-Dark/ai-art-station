'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/services/supabase.service'
import { ArtworkGrid } from '@/components/features/artwork-grid'
import { FilterTags } from '@/components/ui/filter-tags'
import { Heart, Filter, SortAsc, Grid3X3, List, Bookmark } from 'lucide-react'
import { Artwork } from '@/types/artwork'
import Link from 'next/link'

export default function FavoritesPage() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<Artwork[]>([])
  const [filteredFavorites, setFilteredFavorites] = useState<Artwork[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'popular'>('latest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // 获取收藏的作品
  useEffect(() => {
    if (user) {
      loadFavorites()
    }
  }, [user])

  // 应用筛选和排序
  useEffect(() => {
    let filtered = [...favorites]

    // 按标签筛选
    if (selectedTag) {
      filtered = filtered.filter(artwork => artwork.tags?.includes(selectedTag))
    }

    // 排序
    switch (sortBy) {
      case 'latest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'popular':
        filtered.sort((a, b) => Number(b.likes_count || 0) - Number(a.likes_count || 0))
        break
    }

    setFilteredFavorites(filtered)
  }, [favorites, selectedTag, sortBy])

  const loadFavorites = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // 查询用户的收藏记录
      const { data: favoriteRecords, error: favError } = await supabase
        .from('user_favorites')
        .select('artwork_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (favError) {
        console.error('获取收藏记录失败:', favError)
        return
      }

      if (!favoriteRecords || favoriteRecords.length === 0) {
        setFavorites([])
        return
      }

      // 获取收藏的作品详情
      const artworkIds = favoriteRecords.map(record => record.artwork_id)
      const { data: artworks, error: artError } = await supabase
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
        .in('id', artworkIds)

      if (artError) {
        console.error('获取作品详情失败:', artError)
        return
      }

      setFavorites(artworks || [])
    } catch (error) {
      console.error('加载收藏作品时出错:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 获取所有标签用于筛选
  const allTags = Array.from(new Set(favorites.flatMap(artwork => artwork.tags || [])))

  if (!user) {
    return (
      <div className='page-container'>
        <div className='container'>
          <div className='favorites-empty-state'>
            <div className='empty-state-icon'>
              <Bookmark size={64} />
            </div>
            <h2>请先登录</h2>
            <p>登录后即可查看您收藏的作品</p>
            <Link href='/login' className='primary-button'>
              立即登录
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='page-container'>
      <div className='container'>
        <div className='favorites-page-modern'>
          {/* 现代化头部 */}
          <div className='favorites-header'>
            <div className='header-main'>
              <div className='header-info'>
                <div className='header-icon'>
                  <Bookmark size={32} />
                </div>
                <div className='header-text'>
                  <h1>我的收藏</h1>
                  <p>
                    您收藏的精选作品 · 共 <span className='count'>{favorites.length}</span> 件
                  </p>
                </div>
              </div>

              <div className='header-controls'>
                <div className='view-mode-toggle'>
                  <button
                    className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                    title='网格视图'
                  >
                    <Grid3X3 size={16} />
                  </button>
                  <button
                    className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                    title='列表视图'
                  >
                    <List size={16} />
                  </button>
                </div>

                <div className='sort-control'>
                  <SortAsc size={16} />
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as 'latest' | 'oldest' | 'popular')}
                    className='sort-select-modern'
                  >
                    <option value='latest'>最新收藏</option>
                    <option value='oldest'>最早收藏</option>
                    <option value='popular'>最受欢迎</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 标签筛选 */}
          {allTags.length > 0 && (
            <div className='filter-section-modern'>
              <div className='filter-header-modern'>
                <Filter size={18} />
                <span>按标签筛选</span>
                {selectedTag && (
                  <button className='clear-filter-btn' onClick={() => setSelectedTag(null)}>
                    清除筛选
                  </button>
                )}
              </div>
              <FilterTags tags={allTags} selectedTag={selectedTag} onTagSelect={setSelectedTag} />
            </div>
          )}

          {/* 内容区域 */}
          <div className='favorites-content-modern'>
            {isLoading ? (
              <div className='loading-state'>
                <div className='loading-spinner'></div>
                <p>加载收藏作品中...</p>
              </div>
            ) : filteredFavorites.length > 0 ? (
              <div className={`artwork-container ${viewMode}`}>
                <ArtworkGrid artworks={filteredFavorites} />
              </div>
            ) : favorites.length > 0 ? (
              <div className='empty-filter-state'>
                <div className='empty-state-icon'>
                  <Filter size={48} />
                </div>
                <h3>没有匹配的作品</h3>
                <p>尝试调整筛选条件或清除标签筛选</p>
                <button className='clear-filters-btn-large' onClick={() => setSelectedTag(null)}>
                  清除所有筛选
                </button>
              </div>
            ) : (
              <div className='favorites-empty-state'>
                <div className='empty-state-icon'>
                  <Heart size={64} />
                </div>
                <h3>还没有收藏任何作品</h3>
                <p>浏览发现页面，给喜欢的作品点个收藏吧！</p>
                <Link href='/explore' className='explore-btn-large'>
                  去发现好作品
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
