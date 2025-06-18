// 简化的图片上传服务，提供多种备选方案

// 使用免费的图片托管服务 - imgbb
export async function uploadToSimpleService(file: File): Promise<string> {
  // 检查文件大小和类型
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('图片大小不能超过10MB')
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('只支持图片格式')
  }

  try {
    // 方案1: 使用 imgbb (需要API key)
    const imgbbApiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY
    if (imgbbApiKey && imgbbApiKey !== 'your_imgbb_api_key') {
      return await uploadToImgBB(file, imgbbApiKey)
    }

    // 方案2: 使用 imgur (匿名上传)
    try {
      return await uploadToImgur(file)
    } catch (imgurError) {
      console.warn('Imgur 上传失败:', imgurError)
    }

    // 方案3: 转换为 base64 (仅用于小文件和演示)
    if (file.size < 1024 * 1024) {
      // 小于1MB
      console.warn('使用 base64 存储，仅适用于演示环境')
      return await convertToBase64(file)
    }

    // 方案4: 创建临时 blob URL
    const blobUrl = URL.createObjectURL(file)
    console.warn('使用临时 blob URL，页面刷新后将丢失')
    return blobUrl
  } catch (error) {
    console.error('所有上传方案都失败了:', error)
    throw new Error('图片上传失败，请稍后重试')
  }
}

// ImgBB 上传
async function uploadToImgBB(file: File, apiKey: string): Promise<string> {
  const formData = new FormData()
  formData.append('image', file)

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`ImgBB 上传失败: ${response.statusText}`)
  }

  const data = await response.json()
  if (data.success) {
    return data.data.url
  } else {
    throw new Error('ImgBB 返回失败状态')
  }
}

// Imgur 匿名上传
async function uploadToImgur(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('image', file)

  const response = await fetch('https://api.imgur.com/3/image', {
    method: 'POST',
    headers: {
      Authorization: 'Client-ID 546c25a59c58ad7', // 这是 Imgur 的示例 Client ID
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Imgur 上传失败: ${response.statusText}`)
  }

  const data = await response.json()
  if (data.success) {
    return data.data.link
  } else {
    throw new Error('Imgur 返回失败状态')
  }
}

// 转换为 base64 (仅适用于小文件)
async function convertToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('转换为 base64 失败'))
      }
    }
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsDataURL(file)
  })
}

// 验证图片 URL 是否有效
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    const contentType = response.headers.get('content-type')
    return response.ok && (contentType?.startsWith('image/') ?? false)
  } catch {
    return false
  }
}

// 创建图片预览 URL
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file)
}

// 清理临时 URL
export function revokePreviewUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}
