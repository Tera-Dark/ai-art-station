import { supabase } from './supabase.service'
import { BaseService } from './base.service'
import { Artwork } from '@/types/artwork'
import { Logger, DataValidator } from '@/lib/utils/error-handler'

export interface ArtworkService {
  getArtworks(): Promise<Artwork[]>
  getArtworksByUser(userId: string): Promise<Artwork[]>
  createArtwork(artworkData: Partial<Artwork>): Promise<Artwork | null>
  updateArtwork(id: number, artworkData: Partial<Artwork>): Promise<Artwork | null>
  deleteArtwork(id: number): Promise<boolean>
}

class ArtworkServiceImpl extends BaseService implements ArtworkService {
  /**
   * 获取所有作品（带用户信息和统计数据）
   */
  async getArtworks(): Promise<Artwork[]> {
    try {
      Logger.info('开始获取作品列表')

      // 1. 获取基本作品数据
      const artworksResult = await this.safeQuery(async () => {
        const result = await supabase
          .from('artworks')
          .select('*')
          .order('created_at', { ascending: false })
        return result
      }, '获取作品列表')

      if (!artworksResult.success || !artworksResult.data) {
        Logger.error('获取作品列表失败', artworksResult.error)
        return []
      }

      const artworks = artworksResult.data as any[]

      if (!artworks || artworks.length === 0) {
        Logger.info('没有找到任何作品')
        return []
      }

      Logger.success(`获取到 ${artworks.length} 个作品`)

      // 2. 批量获取用户信息
      const userIds = [...new Set(artworks.map(artwork => artwork.user_id).filter(Boolean))]
      const profiles = await this.getUserProfiles(userIds)

      // 3. 批量获取统计数据
      const artworkIds = artworks.map(artwork => artwork.id)
      const [likesData, commentsData] = await Promise.all([
        this.getArtworkLikes(artworkIds),
        this.getArtworkComments(artworkIds),
      ])

      // 4. 合并数据
      const artworksWithData = artworks.map(artwork => {
        // 获取用户信息
        let profileInfo = profiles.find(p => p.id === artwork.user_id)
        if (!profileInfo) {
          profileInfo = {
            id: artwork.user_id,
            username: 'JustFruitPie',
            display_name: 'JustFruitPie',
            avatar_url: null,
          }
          // 异步创建默认profile
          this.createDefaultProfile(artwork.user_id)
        }

        // 获取统计数据
        const likesCount = likesData.find(l => l.artwork_id === artwork.id)?.count || 0
        const commentsCount = commentsData.find(c => c.artwork_id === artwork.id)?.count || 0

        return {
          ...artwork,
          profiles: profileInfo,
          likes_count: likesCount,
          comments_count: commentsCount,
          views_count: artwork.views_count || Math.floor(Math.random() * 1000) + 100,
        }
      })

      Logger.success('作品数据处理完成')
      return artworksWithData as Artwork[]
    } catch (error) {
      Logger.error('获取作品时出错', error)
      return []
    }
  }

  /**
   * 获取特定用户的作品
   */
  async getArtworksByUser(userId: string): Promise<Artwork[]> {
    try {
      const validUserId = DataValidator.validateUserId(userId)
      Logger.info(`开始获取用户 ${validUserId} 的作品`)

      // 1. 获取用户作品
      const artworksResult = await this.safeQuery(async () => {
        const result = await supabase
          .from('artworks')
          .select('*')
          .eq('user_id', validUserId)
          .order('created_at', { ascending: false })
        return result
      }, `获取用户 ${validUserId} 的作品`)

      if (!artworksResult.success || !artworksResult.data) {
        Logger.error('获取用户作品失败', artworksResult.error)
        return []
      }

      const artworks = artworksResult.data as any[]

      if (!artworks || artworks.length === 0) {
        Logger.info(`用户 ${validUserId} 没有作品`)
        return []
      }

      Logger.success(`获取到用户 ${validUserId} 的 ${artworks.length} 个作品`)

      // 2. 获取用户信息
      const profileInfo = await this.getOrCreateUserProfile(validUserId)

      // 3. 获取统计数据
      const artworkIds = artworks.map(artwork => artwork.id)
      const [likesData, commentsData] = await Promise.all([
        this.getArtworkLikes(artworkIds),
        this.getArtworkComments(artworkIds),
      ])

      // 4. 合并数据
      const artworksWithData = artworks.map(artwork => {
        const likesCount = likesData.find(l => l.artwork_id === artwork.id)?.count || 0
        const commentsCount = commentsData.find(c => c.artwork_id === artwork.id)?.count || 0

        return {
          ...artwork,
          profiles: profileInfo,
          likes_count: likesCount,
          comments_count: commentsCount,
          views_count: artwork.views_count || Math.floor(Math.random() * 1000) + 100,
        }
      })

      Logger.success('用户作品数据处理完成')
      return artworksWithData as Artwork[]
    } catch (error) {
      Logger.error('获取用户作品时出错', error)
      return []
    }
  }

  /**
   * 创建作品
   */
  async createArtwork(artworkData: Partial<Artwork>): Promise<Artwork | null> {
    try {
      Logger.info('开始创建作品')

      // 验证必要字段
      if (
        !artworkData.title ||
        !artworkData.prompt ||
        !artworkData.image_url ||
        !artworkData.user_id
      ) {
        Logger.error('创建作品失败：缺少必要字段')
        return null
      }

      const validUserId = DataValidator.validateUserId(artworkData.user_id)

      // 1. 插入作品数据
      const insertResult = await this.safeOperation(async () => {
        const result = await supabase
          .from('artworks')
          .insert({
            title: artworkData.title,
            description: artworkData.description,
            prompt: artworkData.prompt,
            image_url: artworkData.image_url,
            tags: artworkData.tags || [],
            model: artworkData.model,
            steps: artworkData.steps,
            cfg_scale: artworkData.cfg_scale,
            sampler: artworkData.sampler,
            seed: artworkData.seed,
            user_id: validUserId,
            likes_count: 0,
            views_count: 0,
            comments_count: 0,
          })
          .select('*')
          .single()
        return result
      }, '创建作品')

      if (!insertResult.success || !insertResult.data) {
        Logger.error('创建作品失败', insertResult.error)
        return null
      }

      const newArtwork = insertResult.data as any

      // 2. 获取用户信息
      const profileInfo = await this.getOrCreateUserProfile(validUserId)

      // 3. 返回完整的作品数据
      const result = {
        ...newArtwork,
        profiles: profileInfo,
        likes_count: 0,
        comments_count: 0,
        views_count: 0,
      } as Artwork

      Logger.success('作品创建成功')
      return result
    } catch (error) {
      Logger.error('创建作品时出错', error)
      return null
    }
  }

  /**
   * 更新作品
   */
  async updateArtwork(id: number, artworkData: Partial<Artwork>): Promise<Artwork | null> {
    try {
      const validId = DataValidator.validateArtworkId(id)
      Logger.info(`开始更新作品 ${validId}`)

      // 1. 更新作品数据
      const updateResult = await this.safeOperation(async () => {
        const result = await supabase
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
            updated_at: new Date().toISOString(),
          })
          .eq('id', validId)
          .select('*')
          .single()
        return result
      }, `更新作品 ${validId}`)

      if (!updateResult.success || !updateResult.data) {
        Logger.error('更新作品失败', updateResult.error)
        return null
      }

      const updatedArtwork = updateResult.data as any

      // 2. 获取用户信息
      const profileInfo = await this.getOrCreateUserProfile(updatedArtwork.user_id)

      // 3. 获取统计数据
      const [likesCount, commentsCount] = await Promise.all([
        this.getCount('likes', 'artwork_id', validId, '获取点赞数'),
        this.getCount('comments', 'artwork_id', validId, '获取评论数'),
      ])

      // 4. 返回完整的作品数据
      const result = {
        ...updatedArtwork,
        profiles: profileInfo,
        likes_count: likesCount,
        comments_count: commentsCount,
        views_count: updatedArtwork.views_count || 0,
      } as Artwork

      Logger.success('作品更新成功')
      return result
    } catch (error) {
      Logger.error('更新作品时出错', error)
      return null
    }
  }

  /**
   * 删除作品
   */
  async deleteArtwork(id: number): Promise<boolean> {
    try {
      const validId = DataValidator.validateArtworkId(id)
      Logger.info(`开始删除作品 ${validId}`)

      const deleteResult = await this.safeOperation(async () => {
        const result = await supabase.from('artworks').delete().eq('id', validId)
        return result
      }, `删除作品 ${validId}`)

      if (!deleteResult.success) {
        Logger.error('删除作品失败', deleteResult.error)
        return false
      }

      Logger.success('作品删除成功')
      return true
    } catch (error) {
      Logger.error('删除作品时出错', error)
      return false
    }
  }

  /**
   * 批量获取作品点赞数
   */
  private async getArtworkLikes(
    artworkIds: number[]
  ): Promise<Array<{ artwork_id: number; count: number }>> {
    if (artworkIds.length === 0) return []

    try {
      const likesResult = await this.safeQuery(async () => {
        const result = await supabase
          .from('likes')
          .select('artwork_id')
          .in('artwork_id', artworkIds)
        return result
      }, '获取点赞数据')

      if (!likesResult.success || !likesResult.data) {
        Logger.error('获取点赞数据失败', likesResult.error)
        return []
      }

      const data = likesResult.data as any[]

      // 统计每个作品的点赞数
      const likesCount = artworkIds.map(id => ({
        artwork_id: id,
        count: data?.filter(like => like.artwork_id === id).length || 0,
      }))

      return likesCount
    } catch (error) {
      Logger.error('获取点赞数据异常', error)
      return []
    }
  }

  /**
   * 批量获取作品评论数
   */
  private async getArtworkComments(
    artworkIds: number[]
  ): Promise<Array<{ artwork_id: number; count: number }>> {
    if (artworkIds.length === 0) return []

    try {
      const commentsResult = await this.safeQuery(async () => {
        const result = await supabase
          .from('comments')
          .select('artwork_id')
          .in('artwork_id', artworkIds)
        return result
      }, '获取评论数据')

      if (!commentsResult.success || !commentsResult.data) {
        Logger.error('获取评论数据失败', commentsResult.error)
        return []
      }

      const data = commentsResult.data as any[]

      // 统计每个作品的评论数
      const commentsCount = artworkIds.map(id => ({
        artwork_id: id,
        count: data?.filter(comment => comment.artwork_id === id).length || 0,
      }))

      return commentsCount
    } catch (error) {
      Logger.error('获取评论数据异常', error)
      return []
    }
  }
}

// 创建服务实例
const artworkService = new ArtworkServiceImpl()

// 导出服务方法
export const getArtworks = () => artworkService.getArtworks()
export const getArtworksByUser = (userId: string) => artworkService.getArtworksByUser(userId)
export const createArtwork = (artworkData: Partial<Artwork>) =>
  artworkService.createArtwork(artworkData)
export const updateArtwork = (id: number, artworkData: Partial<Artwork>) =>
  artworkService.updateArtwork(id, artworkData)
export const deleteArtwork = (id: number) => artworkService.deleteArtwork(id)
