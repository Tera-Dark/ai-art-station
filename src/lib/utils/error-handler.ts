/**
 * 统一错误处理工具
 */

export interface ApiError {
  code?: string
  message: string
  details?: any
  hint?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
}

/**
 * 包装异步函数，统一处理错误
 */
export function withErrorHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorMessage: string = '操作失败'
): (...args: T) => Promise<ApiResponse<R>> {
  return async (...args: T): Promise<ApiResponse<R>> => {
    try {
      const result = await fn(...args)
      return {
        success: true,
        data: result,
      }
    } catch (error: any) {
      console.error(`${errorMessage}:`, error)

      // 处理 Supabase 错误
      if (error?.code && error?.message) {
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

      // 处理普通错误
      return {
        success: false,
        error: {
          message: error?.message || errorMessage,
          details: error,
        },
      }
    }
  }
}

/**
 * 数据类型验证和转换
 */
export class DataValidator {
  /**
   * 验证并转换作品ID
   */
  static validateArtworkId(artworkId: string | number): number {
    const id = typeof artworkId === 'string' ? parseInt(artworkId, 10) : artworkId

    if (isNaN(id) || id <= 0) {
      throw new Error(`无效的作品ID: ${artworkId}`)
    }

    return id
  }

  /**
   * 验证用户ID
   */
  static validateUserId(userId: string): string {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error(`无效的用户ID: ${userId}`)
    }

    return userId.trim()
  }

  /**
   * 验证评论ID
   */
  static validateCommentId(commentId: string): string {
    if (!commentId || typeof commentId !== 'string' || commentId.trim().length === 0) {
      throw new Error(`无效的评论ID: ${commentId}`)
    }

    return commentId.trim()
  }
}

/**
 * 错误信息格式化工具
 */
class ErrorFormatter {
  /**
   * 格式化错误对象为可读字符串
   */
  static formatError(error: any): string {
    if (!error) return 'Unknown error'

    // 如果是字符串，直接返回
    if (typeof error === 'string') return error

    // 如果有message属性，优先使用
    if (error.message) return error.message

    // 如果是Supabase错误对象
    if (error.code || error.details || error.hint) {
      const parts = []
      if (error.code) parts.push(`Code: ${error.code}`)
      if (error.message) parts.push(`Message: ${error.message}`)
      if (error.details) parts.push(`Details: ${error.details}`)
      if (error.hint) parts.push(`Hint: ${error.hint}`)
      return parts.join(', ')
    }

    // 尝试JSON序列化
    try {
      return JSON.stringify(error, null, 2)
    } catch {
      return String(error)
    }
  }
}

/**
 * 日志工具
 */
export class Logger {
  private static isDevelopment = process.env.NODE_ENV === 'development'

  static info(message: string, data?: any) {
    if (this.isDevelopment) {
      const formattedData = data ? ErrorFormatter.formatError(data) : ''
      console.log(`ℹ️ ${message}`, formattedData)
    }
  }

  static warn(message: string, data?: any) {
    if (this.isDevelopment) {
      const formattedData = data ? ErrorFormatter.formatError(data) : ''
      console.warn(`⚠️ ${message}`, formattedData)
    }
  }

  static error(message: string, error?: any) {
    const formattedError = error ? ErrorFormatter.formatError(error) : ''
    console.error(`❌ ${message}`, formattedError)

    // 在开发环境下，也输出原始错误对象以便调试
    if (this.isDevelopment && error) {
      console.error('原始错误对象:', error)
    }
  }

  static success(message: string, data?: any) {
    if (this.isDevelopment) {
      const formattedData = data ? ErrorFormatter.formatError(data) : ''
      console.log(`✅ ${message}`, formattedData)
    }
  }
}

/**
 * 重试机制
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      Logger.warn(`操作失败，第 ${i + 1}/${maxRetries} 次重试`, error)

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}
