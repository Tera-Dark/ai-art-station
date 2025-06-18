import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import '@/styles/globals.css'
import { AuthProvider } from '@/contexts/auth-context'
import { ensureStorageBuckets } from '@/lib/services/supabase.service'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

// 初始化存储桶
ensureStorageBuckets()
  .then(success => {
    if (success) {
      console.log('Supabase 存储桶初始化成功')
    } else {
      console.warn('Supabase 存储桶初始化失败，可能会影响上传功能')
    }
  })
  .catch(error => {
    console.error('Supabase 存储桶初始化出错:', error)
  })

export const metadata: Metadata = {
  title: 'AI Art Station - AI艺术作品展示平台',
  description: '探索和分享最新的AI生成艺术作品',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='zh-CN'>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
