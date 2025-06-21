// 统一错误处理工具

export interface ErrorInfo {
  message: string
  code?: string
  details?: string | undefined
}

export class AppError extends Error {
  public readonly code: string
  public readonly userMessage: string
  public readonly details: string | undefined

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    userMessage?: string,
    details?: string
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.userMessage = userMessage || message
    this.details = details
  }
}

/**
 * 处理未知错误，转换为友好的错误信息
 */
export function handleError(error: unknown): ErrorInfo {
  if (error instanceof AppError) {
    return {
      message: error.userMessage,
      code: error.code,
      details: error.details,
    }
  }

  if (error instanceof Error) {
    // 处理常见的错误类型
    if (error.message.includes('fetch')) {
      return {
        message: '网络连接失败，请检查网络后重试',
        code: 'NETWORK_ERROR',
      }
    }

    if (error.message.includes('unauthorized') || error.message.includes('401')) {
      return {
        message: '请先登录后再进行操作',
        code: 'UNAUTHORIZED',
      }
    }

    if (error.message.includes('forbidden') || error.message.includes('403')) {
      return {
        message: '您没有权限执行此操作',
        code: 'FORBIDDEN',
      }
    }

    if (error.message.includes('not found') || error.message.includes('404')) {
      return {
        message: '请求的资源不存在',
        code: 'NOT_FOUND',
      }
    }

    return {
      message: error.message,
      code: 'ERROR',
    }
  }

  // 处理字符串错误
  if (typeof error === 'string') {
    return {
      message: error,
      code: 'STRING_ERROR',
    }
  }

  // 未知错误类型
  return {
    message: '发生了未知错误，请稍后重试',
    code: 'UNKNOWN_ERROR',
    details: String(error),
  }
}

/**
 * 安全的日志记录
 */
export function logError(error: unknown, context?: string): void {
  const errorInfo = handleError(error)

  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context || 'Error'}]:`, {
      message: errorInfo.message,
      code: errorInfo.code,
      details: errorInfo.details,
      originalError: error,
    })
  } else {
    // 生产环境只记录基本信息
    console.error(`[${context || 'Error'}]: ${errorInfo.code} - ${errorInfo.message}`)
  }
}

/**
 * 创建用户友好的错误提示
 */
export function createUserFriendlyError(error: unknown, fallbackMessage?: string): string {
  const errorInfo = handleError(error)
  return errorInfo.message || fallbackMessage || '操作失败，请重试'
}

/**
 * 重试机制
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      if (attempt === maxRetries) {
        break
      }

      // 指数退避
      const waitTime = delay * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  throw lastError
}
