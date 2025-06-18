'use client'

import { useState, useEffect } from 'react'
import { debugFavorites } from '@/lib/services/favorites.service'
import { supabase } from '@/lib/services/supabase.service'

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [user, setUser] = useState<any>(null)

  // 重写 console.log 来捕获日志
  useEffect(() => {
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn

    console.log = (...args) => {
      setLogs(prev => [...prev, `LOG: ${args.join(' ')}`])
      originalLog(...args)
    }

    console.error = (...args) => {
      setLogs(prev => [...prev, `ERROR: ${args.join(' ')}`])
      originalError(...args)
    }

    console.warn = (...args) => {
      setLogs(prev => [...prev, `WARN: ${args.join(' ')}`])
      originalWarn(...args)
    }

    return () => {
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  }, [])

  // 获取当前用户
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const runDebug = async () => {
    setLogs([])
    await debugFavorites()
  }

  const testSupabaseConnection = async () => {
    setLogs([])
    try {
      // 测试基本连接
      const { data, error } = await supabase.from('artworks').select('*').limit(1)
      
      if (error) {
        console.error('数据库连接失败:', error)
      } else {
        console.log('数据库连接成功，artworks表存在')
        console.log('测试数据:', data)
      }

      // 测试 user_favorites 表
      const { data: favData, error: favError } = await supabase
        .from('user_favorites')
        .select('*')
        .limit(1)
      
      if (favError) {
        console.error('user_favorites 表访问失败:', favError)
      } else {
        console.log('user_favorites 表访问成功')
        console.log('收藏表测试数据:', favData)
      }

    } catch (error) {
      console.error('测试过程中出错:', error)
    }
  }

  const createUserFavoritesTable = async () => {
    setLogs([])
    console.log('准备创建 user_favorites 表...')
    
    const sql = `
-- 创建 user_favorites 表
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    artwork_id BIGINT REFERENCES artworks(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(user_id, artwork_id)
);

-- 启用 RLS
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- 创建策略
DROP POLICY IF EXISTS "User favorites are viewable by owner" ON user_favorites;
CREATE POLICY "User favorites are viewable by owner" ON user_favorites
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can insert favorites" ON user_favorites;
CREATE POLICY "Authenticated users can insert favorites" ON user_favorites
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own favorites" ON user_favorites;
CREATE POLICY "Users can delete their own favorites" ON user_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- 创建索引
CREATE INDEX IF NOT EXISTS user_favorites_user_id_idx ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS user_favorites_artwork_id_idx ON user_favorites(artwork_id);
    `
    
    console.log('SQL 脚本已准备完成，请复制以下内容到 Supabase SQL 编辑器中执行：')
    console.log(sql)
    console.log('执行完成后，请重新测试收藏功能')
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-8">收藏功能调试工具</h1>
        
        {/* 用户状态 */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">用户状态</h2>
          {user ? (
            <div>
              <p className="text-green-600">✅ 用户已登录</p>
              <p>用户ID: {user.id}</p>
              <p>邮箱: {user.email}</p>
            </div>
          ) : (
            <p className="text-red-600">❌ 用户未登录</p>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={runDebug}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
          >
            运行收藏功能调试
          </button>
          
          <button
            onClick={testSupabaseConnection}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            测试 Supabase 连接
          </button>
          
          <button
            onClick={createUserFavoritesTable}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            生成建表脚本
          </button>
          
          <button
            onClick={() => setLogs([])}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            清空日志
          </button>
        </div>

        {/* 日志显示 */}
        <div className="bg-black text-gray-300 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4 text-white">调试日志</h2>
          <div className="font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">暂无日志，请点击上方按钮开始调试</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`mb-1 ${
                  log.startsWith('ERROR:') ? 'text-red-400' : 
                  log.startsWith('WARN:') ? 'text-yellow-400' : 
                  log.startsWith('LOG:') ? 'text-green-400' : 'text-gray-300'
                }`}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 说明文档 */}
        <div className="mt-8 bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">问题排查步骤</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>首先检查用户是否已登录</li>
            <li>测试 Supabase 连接是否正常</li>
            <li>运行收藏功能调试，查看具体错误信息</li>
            <li>如果出现 "表不存在" 错误（42P01），点击 "生成建表脚本" 并在 Supabase 中执行</li>
            <li>检查 .env.local 文件中的 Supabase 配置是否正确</li>
            <li>确认 Supabase 项目中的 RLS 策略是否正确设置</li>
          </ol>
        </div>

        {/* 常见问题 */}
        <div className="mt-6 bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-400">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">常见问题解决方案</h3>
          <div className="text-yellow-700 space-y-2">
            <p><strong>错误代码 42P01:</strong> 表不存在，需要运行建表脚本</p>
            <p><strong>RLS 策略错误:</strong> 检查 Row Level Security 策略是否正确设置</p>
            <p><strong>连接超时:</strong> 检查网络连接和 Supabase 配置</p>
            <p><strong>权限不足:</strong> 确认用户已登录且有相应权限</p>
          </div>
        </div>
      </div>
    </div>
  )
} 