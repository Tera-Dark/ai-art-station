/**
 * 验证邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证密码强度
 */
export function isValidPassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('密码长度至少8位')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('密码需包含至少一个大写字母')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('密码需包含至少一个小写字母')
  }

  if (!/\d/.test(password)) {
    errors.push('密码需包含至少一个数字')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * 验证用户名格式
 */
export function isValidUsername(username: string): boolean {
  // 用户名只能包含字母、数字、下划线，长度3-20位
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  return usernameRegex.test(username)
}

/**
 * 验证文件类型
 */
export function isValidImageFile(file: File): boolean {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  return allowedTypes.includes(file.type)
}

/**
 * 验证文件大小
 */
export function isValidFileSize(file: File, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024
  return file.size <= maxSizeInBytes
}

/**
 * 验证URL格式
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 清理和验证HTML内容
 */
export function sanitizeHTML(html: string): string {
  // 基础的HTML清理，实际项目中建议使用专门的库如DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
}

/**
 * 验证手机号格式（中国大陆）
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

/**
 * 验证作品标题
 */
export function isValidArtworkTitle(title: string): boolean {
  return title.trim().length >= 1 && title.length <= 100
}

/**
 * 验证作品描述
 */
export function isValidArtworkDescription(description: string): boolean {
  return description.length <= 1000
}
