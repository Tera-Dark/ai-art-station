// 用户的公开信息
export interface Profile {
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

// 图片信息类型
export interface ArtworkImage {
  id?: string
  url: string
  alt?: string
  width?: number
  height?: number
  order?: number
}

// 作品数据类型，对应数据库的 artworks 表
export interface Artwork {
  id: number
  created_at: string
  title: string
  prompt: string
  description: string | null
  image_url: string // 主图片URL，保持向后兼容
  images?: ArtworkImage[] // 多图支持
  tags: string[] | null
  model: string | null
  steps: number | null
  cfg_scale: number | null
  sampler: string | null
  seed: number | null
  user_id: string
  likes_count: number
  views_count: number
  comments_count: number
  // 通过联表查询（JOIN）从 profiles 表获取用户信息
  profiles: Profile | null
}

// 评论数据类型
export interface Comment {
  id: string
  content: string
  author: string
  avatar?: string
  created_at: string
  likes: number
  isLiked?: boolean
  replies?: Comment[]
  parent_id?: string
}
