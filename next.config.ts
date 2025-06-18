import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    domains: [
      // Supabase 存储域名
      'mlprsbxtnzoblimthrkm.supabase.co',
      // 根据你的 Supabase URL 调整，格式：your-project-id.supabase.co

      // 图片上传服务域名
      'i.ibb.co', // ImgBB
      'i.imgur.com', // Imgur
      'res.cloudinary.com', // Cloudinary
      'cdn.jsdelivr.net', // JSDelivr CDN for icons

      // 本地开发
      'localhost',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
        pathname: '/**',
      },
    ],
    // 添加这些配置来改善图片处理
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // 图片质量和尺寸配置
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 图片格式
    formats: ['image/webp'],
    // 缓存时间
    minimumCacheTTL: 60,
  },
  // 改善热重载
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
}

export default nextConfig
