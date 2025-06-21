import { supabase } from './supabase.service'
import { Artwork } from '@/types/artwork'

export interface ArtworkService {
  getArtworks(): Promise<Artwork[]>
  getArtworksByUser(userId: string): Promise<Artwork[]>
  createArtwork(artworkData: Partial<Artwork>): Promise<Artwork | null>
  updateArtwork(id: number, artworkData: Partial<Artwork>): Promise<Artwork | null>
  deleteArtwork(id: number): Promise<boolean>
}

export const artworkService: ArtworkService = {
  // 获取所有作品（带用户信息）
  async getArtworks(): Promise<Artwork[]> {
    try {
      // 1. 先获取作品数据
      const { data: artworks, error: artworksError } = await supabase
        .from('artworks')
        .select('*')
        .order('created_at', { ascending: false })

      if (artworksError) {
        console.error('获取作品失败:', artworksError)
        return []
      }

      if (!artworks || artworks.length === 0) {
        return []
      }

      // 2. 获取所有涉及的用户ID
      const userIds = [...new Set(artworks.map(artwork => artwork.user_id))]

      // 3. 批量获取用户信息
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds)

      if (profilesError) {
        console.warn('获取用户信息失败:', profilesError)
      }

      // 4. 合并数据
      const artworksWithProfiles = artworks.map(artwork => ({
        ...artwork,
        profiles: profiles?.find(profile => profile.id === artwork.user_id) || null,
      }))

      return artworksWithProfiles as Artwork[]
    } catch (error) {
      console.error('获取作品时出错:', error)
      return []
    }
  },

  // 获取特定用户的作品
  async getArtworksByUser(userId: string): Promise<Artwork[]> {
    try {
      // 1. 获取作品数据
      const { data: artworks, error: artworksError } = await supabase
        .from('artworks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (artworksError) {
        console.error('获取用户作品失败:', artworksError)
        return []
      }

      if (!artworks || artworks.length === 0) {
        return []
      }

      // 2. 获取用户信息
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.warn('获取用户信息失败:', profileError)
      }

      // 3. 合并数据
      const artworksWithProfile = artworks.map(artwork => ({
        ...artwork,
        profiles: profile || null,
      }))

      return artworksWithProfile as Artwork[]
    } catch (error) {
      console.error('获取用户作品时出错:', error)
      return []
    }
  },

  // 创建作品
  async createArtwork(artworkData: Partial<Artwork>): Promise<Artwork | null> {
    try {
      // 1. 插入作品数据（不包含profiles字段）
      const { data: newArtwork, error: insertError } = await supabase
        .from('artworks')
        .insert({
          title: artworkData.title,
          description: artworkData.description,
          prompt: artworkData.prompt,
          image_url: artworkData.image_url,
          tags: artworkData.tags,
          model: artworkData.model,
          steps: artworkData.steps,
          cfg_scale: artworkData.cfg_scale,
          sampler: artworkData.sampler,
          seed: artworkData.seed,
          user_id: artworkData.user_id,
          likes_count: artworkData.likes_count || 0,
          views_count: artworkData.views_count || 0,
          comments_count: artworkData.comments_count || 0,
        })
        .select('*')
        .single()

      if (insertError) {
        console.error('创建作品失败:', insertError)
        return null
      }

      if (!newArtwork) {
        return null
      }

      // 2. 获取用户信息
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', newArtwork.user_id)
        .single()

      if (profileError) {
        console.warn('获取用户信息失败:', profileError)
      }

      // 3. 返回完整的作品数据
      return {
        ...newArtwork,
        profiles: profile || null,
      } as Artwork
    } catch (error) {
      console.error('创建作品时出错:', error)
      return null
    }
  },

  // 更新作品
  async updateArtwork(id: number, artworkData: Partial<Artwork>): Promise<Artwork | null> {
    try {
      // 1. 更新作品数据
      const { data: updatedArtwork, error: updateError } = await supabase
        .from('artworks')
        .update({
          title: artworkData.title,
          description: artworkData.description,
          prompt: artworkData.prompt,
          image_url: artworkData.image_url,
          tags: artworkData.tags,
          model: artworkData.model,
          steps: artworkData.steps,
          cfg_scale: artworkData.cfg_scale,
          sampler: artworkData.sampler,
          seed: artworkData.seed,
          likes_count: artworkData.likes_count,
          views_count: artworkData.views_count,
          comments_count: artworkData.comments_count,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single()

      if (updateError) {
        console.error('更新作品失败:', updateError)
        return null
      }

      if (!updatedArtwork) {
        return null
      }

      // 2. 获取用户信息
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', updatedArtwork.user_id)
        .single()

      if (profileError) {
        console.warn('获取用户信息失败:', profileError)
      }

      // 3. 返回完整的作品数据
      return {
        ...updatedArtwork,
        profiles: profile || null,
      } as Artwork
    } catch (error) {
      console.error('更新作品时出错:', error)
      return null
    }
  },

  // 删除作品
  async deleteArtwork(id: number): Promise<boolean> {
    try {
      const { error } = await supabase.from('artworks').delete().eq('id', id)

      if (error) {
        console.error('删除作品失败:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('删除作品时出错:', error)
      return false
    }
  },
}

// 导出便捷函数
export const getArtworks = () => artworkService.getArtworks()
export const getArtworksByUser = (userId: string) => artworkService.getArtworksByUser(userId)
export const createArtwork = (artworkData: Partial<Artwork>) =>
  artworkService.createArtwork(artworkData)
export const updateArtwork = (id: number, artworkData: Partial<Artwork>) =>
  artworkService.updateArtwork(id, artworkData)
export const deleteArtwork = (id: number) => artworkService.deleteArtwork(id)
