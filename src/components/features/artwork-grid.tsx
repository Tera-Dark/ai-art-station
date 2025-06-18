'use client'

import { ArtworkCard } from './artwork-card'
import { Artwork } from '@/types/artwork'

interface ArtworkGridProps {
  artworks: Artwork[]
  onArtworkClick?: (artwork: Artwork) => void
  onArtworkLike?: (artworkId: string) => void
  onArtworkBookmark?: (artworkId: string) => void
}

export function ArtworkGrid({
  artworks,
  onArtworkClick,
  onArtworkLike,
  onArtworkBookmark,
}: ArtworkGridProps) {
  const handleLike = (artworkId: string) => {
    console.log('点赞作品:', artworkId)
    onArtworkLike?.(artworkId)
  }

  const handleBookmark = (artworkId: string) => {
    console.log('收藏作品:', artworkId)
    onArtworkBookmark?.(artworkId)
  }

  const handleView = (artwork: Artwork) => {
    console.log('查看作品:', artwork.title)
    onArtworkClick?.(artwork)
  }

  return (
    <div className='artwork-grid'>
      {artworks.map(artwork => (
        <ArtworkCard
          key={artwork.id}
          artwork={artwork}
          onLike={handleLike}
          onBookmark={handleBookmark}
          onView={handleView}
        />
      ))}
    </div>
  )
}
