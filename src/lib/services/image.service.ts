// 客户端配置
export const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo',
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ai-art-uploads',
}

// ImgBB配置
export const imgbbConfig = {
  apiKey: process.env.NEXT_PUBLIC_IMGBB_API_KEY || '', // 移除硬编码密钥
}

// 图片变换参数
export const imageTransforms = {
  thumbnail: {
    width: 400,
    height: 300,
    crop: 'fill',
    quality: 'auto',
    format: 'webp',
  },
  medium: {
    width: 800,
    height: 600,
    crop: 'limit',
    quality: 'auto',
    format: 'webp',
  },
  large: {
    width: 1200,
    height: 900,
    crop: 'limit',
    quality: 'auto',
    format: 'webp',
  },
}

// 构建图片URL
export function buildImageUrl(publicId: string, transform: keyof typeof imageTransforms) {
  const baseUrl = `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload`
  const transformParams = imageTransforms[transform]
  const paramString = Object.entries(transformParams)
    .map(([key, value]) => `${key}_${value}`)
    .join(',')

  return `${baseUrl}/${paramString}/${publicId}`
}

// 上传图片到ImgBB
export async function uploadToImgBB(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('image', file)

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbConfig.apiKey}`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`ImgBB上传失败: ${response.statusText}`)
  }

  const data = await response.json()
  if (data.success) {
    return data.data.url
  } else {
    throw new Error('ImgBB上传返回失败状态')
  }
}
