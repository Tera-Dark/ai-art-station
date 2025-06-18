// 应用配置

// Supabase配置
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // 检查配置是否有效
  isValid: () => {
    return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  },
}

// 存储配置
export const storageConfig = {
  // 存储桶名称
  buckets: {
    artworks: 'artworks',
    avatars: 'avatars',
  },

  // 文件路径前缀
  paths: {
    public: 'public/',
    private: 'private/',
  },
}

// 应用配置
export const appConfig = {
  name: 'AI Art Station',
  description: 'AI艺术作品展示与分享平台',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  // 图片上传配置
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    defaultThumbnail: '/placeholder.svg',
  },
}
