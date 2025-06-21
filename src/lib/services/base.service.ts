/**
 * 服务基类 - 提供统一的数据操作接口
 */

import { supabase } from './supabase.service'
import { Logger, DataValidator, ApiResponse } from '@/lib/utils/error-handler'

export abstract class BaseService {
  protected logger = Logger
  protected validator = DataValidator

  /**
   * 安全的数据库查询
   */
  protected async safeQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: any; count?: number | null }>,
    errorMessage: string = '查询失败'
  ): Promise<ApiResponse<T>> {
    try {
      Logger.info(`开始执行查询: ${errorMessage}`)

      const { data, error } = await queryFn()

      if (error) {
        Logger.error(`查询失败: ${errorMessage}`, error)
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          },
        }
      }

      Logger.success(`查询成功: ${errorMessage}`, { count: Array.isArray(data) ? data.length : 1 })

      return {
        success: true,
        data: data as T,
      }
    } catch (error: any) {
      Logger.error(`查询异常: ${errorMessage}`, error)
      return {
        success: false,
        error: {
          message: error?.message || errorMessage,
          details: error,
        },
      }
    }
  }

  /**
   * 安全的数据库操作（插入、更新、删除）
   */
  protected async safeOperation<T>(
    operationFn: () => Promise<{ data: T | null; error: any }>,
    errorMessage: string = '操作失败'
  ): Promise<ApiResponse<T>> {
    try {
      Logger.info(`开始执行操作: ${errorMessage}`)

      const { data, error } = await operationFn()

      if (error) {
        Logger.error(`操作失败: ${errorMessage}`, error)
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          },
        }
      }

      Logger.success(`操作成功: ${errorMessage}`)

      return {
        success: true,
        data: data as T,
      }
    } catch (error: any) {
      Logger.error(`操作异常: ${errorMessage}`, error)
      return {
        success: false,
        error: {
          message: error?.message || errorMessage,
          details: error,
        },
      }
    }
  }

  /**
   * 批量获取用户信息
   */
  protected async getUserProfiles(userIds: string[]) {
    if (userIds.length === 0) return []

    const uniqueUserIds = [...new Set(userIds)]
    Logger.info('获取用户信息', { count: uniqueUserIds.length })

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', uniqueUserIds)

      if (error) {
        Logger.error('获取用户信息失败', error)
        return []
      }

      return data || []
    } catch (error) {
      Logger.error('获取用户信息异常', error)
      return []
    }
  }

  /**
   * 创建默认用户信息
   */
  protected async createDefaultProfile(userId: string) {
    const defaultProfile = {
      id: userId,
      username: 'JustFruitPie',
      display_name: 'JustFruitPie',
      avatar_url: null,
    }

    Logger.info(`为用户 ${userId} 创建默认profile`)

    // 异步创建，不阻塞主流程
    setTimeout(async () => {
      try {
        await supabase.from('profiles').upsert({
          id: userId,
          username: defaultProfile.username,
          display_name: defaultProfile.display_name,
          avatar_url: defaultProfile.avatar_url,
          updated_at: new Date().toISOString(),
        })
        Logger.success(`为用户 ${userId} 创建默认profile成功`)
      } catch (error) {
        Logger.error(`为用户 ${userId} 创建默认profile失败`, error)
      }
    }, 0)

    return defaultProfile
  }

  /**
   * 获取或创建用户信息
   */
  protected async getOrCreateUserProfile(userId: string) {
    const profiles = await this.getUserProfiles([userId])

    if (profiles.length > 0) {
      return profiles[0]
    }

    // 创建默认profile
    return await this.createDefaultProfile(userId)
  }

  /**
   * 统计计数查询
   */
  protected async getCount(
    table: string,
    column: string,
    value: any,
    errorMessage: string = '获取计数'
  ): Promise<number> {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq(column, value)

      if (error) {
        Logger.error(errorMessage, error)
        return 0
      }

      return count || 0
    } catch (error) {
      Logger.error(`${errorMessage}异常`, error)
      return 0
    }
  }
}
