import { supabase } from './supabase.service'

// 关注相关的类型定义
export interface FollowUser {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  followers_count: number
  following_count?: number
  followed_at: string
}

export interface FollowService {
  followUser: (userId: string) => Promise<boolean>
  unfollowUser: (userId: string) => Promise<boolean>
  isFollowing: (userId: string) => Promise<boolean>
  getFollowers: (userId: string) => Promise<FollowUser[]>
  getFollowing: (userId: string) => Promise<FollowUser[]>
  getFollowStats: (userId: string) => Promise<{ followers: number; following: number }>
}

export const followService: FollowService = {
  // 关注用户
  async followUser(userId: string): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        console.error('用户未登录')
        return false
      }

      if (user.id === userId) {
        console.error('不能关注自己')
        return false
      }

      const { error } = await supabase.from('follows').insert({
        follower_id: user.id,
        following_id: userId,
      })

      if (error) {
        console.error('关注失败:', error)
        return false
      }

      console.log('关注成功')
      return true
    } catch (error) {
      console.error('关注过程中出错:', error)
      return false
    }
  },

  // 取消关注
  async unfollowUser(userId: string): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        console.error('用户未登录')
        return false
      }

      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId)

      if (error) {
        console.error('取消关注失败:', error)
        return false
      }

      console.log('取消关注成功')
      return true
    } catch (error) {
      console.error('取消关注过程中出错:', error)
      return false
    }
  },

  // 检查是否已关注
  async isFollowing(userId: string): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        return false
      }

      if (user.id === userId) {
        return false // 自己不能关注自己
      }

      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('检查关注状态失败:', error)
        return false
      }

      return !!data
    } catch (error) {
      console.error('检查关注状态时出错:', error)
      return false
    }
  },

  // 获取用户的粉丝列表
  async getFollowers(userId: string): Promise<FollowUser[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_followers', { user_id: userId })

      if (error) {
        console.error('获取粉丝列表失败:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('获取粉丝列表时出错:', error)
      return []
    }
  },

  // 获取用户的关注列表
  async getFollowing(userId: string): Promise<FollowUser[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_following', { user_id: userId })

      if (error) {
        console.error('获取关注列表失败:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('获取关注列表时出错:', error)
      return []
    }
  },

  // 获取关注统计
  async getFollowStats(userId: string): Promise<{ followers: number; following: number }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('followers_count, following_count')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('获取关注统计失败:', error)
        return { followers: 0, following: 0 }
      }

      return {
        followers: data?.followers_count || 0,
        following: data?.following_count || 0,
      }
    } catch (error) {
      console.error('获取关注统计时出错:', error)
      return { followers: 0, following: 0 }
    }
  },
}

// 批量检查关注状态
export async function checkFollowingStatus(userIds: string[]): Promise<Record<string, boolean>> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || userIds.length === 0) {
      return {}
    }

    const { data, error } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
      .in('following_id', userIds)

    if (error) {
      console.error('批量检查关注状态失败:', error)
      return {}
    }

    const followingSet = new Set(data?.map(item => item.following_id) || [])
    const result: Record<string, boolean> = {}

    userIds.forEach(userId => {
      result[userId] = followingSet.has(userId)
    })

    return result
  } catch (error) {
    console.error('批量检查关注状态时出错:', error)
    return {}
  }
}
