'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/services/supabase.service'
import { getArtworks } from '@/lib/services/artwork.service'
import { likeService } from '@/lib/services/likes.service'
import { favoriteService, debugFavorites } from '@/lib/services/favorites.service'

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [user, setUser] = useState<any>(null)
  const [debugInfo, setDebugInfo] = useState<string>('')
  const [loading, setLoading] = useState(false)

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
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const runSimpleTest = async () => {
    setLoading(true)
    setDebugInfo('开始简单测试...\n')

    try {
      // 1. 测试基本数据库连接
      setDebugInfo(prev => prev + '1. 测试基本数据库连接...\n')
      const { data: testData, error: testError } = await supabase
        .from('artworks')
        .select('id, title, user_id')
        .limit(1)

      if (testError) {
        setDebugInfo(prev => prev + `❌ 数据库连接失败:\n`)
        setDebugInfo(prev => prev + `   错误代码: ${testError.code || 'N/A'}\n`)
        setDebugInfo(prev => prev + `   错误信息: ${testError.message || 'N/A'}\n`)
        setDebugInfo(prev => prev + `   详细信息: ${testError.details || 'N/A'}\n`)
        setDebugInfo(prev => prev + `   提示信息: ${testError.hint || 'N/A'}\n`)
        setDebugInfo(prev => prev + `   完整错误: ${JSON.stringify(testError, null, 2)}\n`)
        return
      }

      setDebugInfo(prev => prev + `✅ 数据库连接成功，获取到 ${testData?.length || 0} 条数据\n`)

      // 2. 测试表是否存在
      setDebugInfo(prev => prev + '\n2. 测试表结构...\n')
      const tables = ['profiles', 'artworks', 'comments', 'likes', 'user_favorites']

      for (const table of tables) {
        try {
          const { error: tableError } = await supabase.from(table).select('*').limit(1)

          if (tableError) {
            setDebugInfo(prev => prev + `❌ 表 ${table} 查询失败: ${tableError.message}\n`)
          } else {
            setDebugInfo(prev => prev + `✅ 表 ${table} 存在且可访问\n`)
          }
        } catch (error) {
          setDebugInfo(prev => prev + `❌ 表 ${table} 测试异常: ${error}\n`)
        }
      }

      // 3. 测试作品服务
      setDebugInfo(prev => prev + '\n3. 测试作品服务...\n')
      try {
        const artworks = await getArtworks()
        setDebugInfo(prev => prev + `✅ 作品服务测试成功，获取到 ${artworks.length} 个作品\n`)

        if (artworks.length > 0) {
          const firstArtwork = artworks[0]
          if (firstArtwork) {
            setDebugInfo(
              prev => prev + `   第一个作品: ID=${firstArtwork.id}, 标题="${firstArtwork.title}"\n`
            )
          }
        }
      } catch (serviceError) {
        setDebugInfo(prev => prev + `❌ 作品服务测试失败: ${serviceError}\n`)
      }

      // 4. 测试用户信息
      if (user) {
        setDebugInfo(prev => prev + '\n4. 测试用户信息...\n')
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          setDebugInfo(prev => prev + `⚠️ 用户信息获取失败: ${profileError.message}\n`)
          setDebugInfo(prev => prev + `   错误代码: ${profileError.code}\n`)

          // 尝试创建用户资料
          setDebugInfo(prev => prev + '   尝试创建用户资料...\n')
          const { error: insertError } = await supabase.from('profiles').insert({
            id: user.id,
            username: 'JustFruitPie',
            display_name: 'JustFruitPie',
            avatar_url: null,
          })

          if (insertError) {
            setDebugInfo(prev => prev + `❌ 创建用户资料失败: ${insertError.message}\n`)
          } else {
            setDebugInfo(prev => prev + `✅ 用户资料创建成功\n`)
          }
        } else {
          setDebugInfo(prev => prev + `✅ 用户信息获取成功: ${profile?.username || '未设置'}\n`)
        }
      }

      setDebugInfo(prev => prev + '\n🎉 简单测试完成！\n')
    } catch (error) {
      setDebugInfo(prev => prev + `❌ 测试过程出错: ${error}\n`)
      setDebugInfo(prev => prev + `   错误类型: ${typeof error}\n`)
      setDebugInfo(prev => prev + `   错误对象: ${JSON.stringify(error, null, 2)}\n`)
    } finally {
      setLoading(false)
    }
  }

  const runDebug = async () => {
    setLogs([])
    await debugFavorites()
  }

  const testSupabaseRaw = async () => {
    setLoading(true)
    setDebugInfo('开始原始Supabase测试...\n')

    try {
      // 测试最基本的连接
      setDebugInfo(prev => prev + '1. 测试Supabase客户端初始化...\n')
      setDebugInfo(
        prev => prev + `   Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || '未设置'}\n`
      )
      setDebugInfo(
        prev =>
          prev +
          `   Supabase Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '已设置' : '未设置'}\n`
      )

      // 测试auth状态
      setDebugInfo(prev => prev + '\n2. 测试认证状态...\n')
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        setDebugInfo(prev => prev + `❌ 认证检查失败: ${authError.message}\n`)
      } else {
        setDebugInfo(prev => prev + `✅ 认证状态: ${authUser ? '已登录' : '未登录'}\n`)
        if (authUser) {
          setDebugInfo(prev => prev + `   用户ID: ${authUser.id}\n`)
          setDebugInfo(prev => prev + `   邮箱: ${authUser.email}\n`)
        }
      }

      // 测试最简单的查询
      setDebugInfo(prev => prev + '\n3. 测试最简单的数据库查询...\n')
      try {
        const { data, error, status, statusText } = await supabase
          .from('artworks')
          .select('count(*)', { count: 'exact', head: true })

        setDebugInfo(prev => prev + `   HTTP状态: ${status} ${statusText}\n`)

        if (error) {
          setDebugInfo(prev => prev + `❌ 查询失败:\n`)
          setDebugInfo(prev => prev + `   错误代码: ${error.code}\n`)
          setDebugInfo(prev => prev + `   错误信息: ${error.message}\n`)
          setDebugInfo(prev => prev + `   详细信息: ${error.details}\n`)
          setDebugInfo(prev => prev + `   提示: ${error.hint}\n`)
        } else {
          setDebugInfo(prev => prev + `✅ 查询成功，artworks表记录数: ${data || 0}\n`)
        }
      } catch (queryError) {
        setDebugInfo(prev => prev + `❌ 查询异常: ${queryError}\n`)
      }

      // 测试所有表的存在性
      setDebugInfo(prev => prev + '\n4. 测试所有表的存在性...\n')
      const allTables = ['profiles', 'artworks', 'comments', 'likes', 'user_favorites', 'follows']

      for (const tableName of allTables) {
        try {
          const { error: tableError } = await supabase
            .from(tableName)
            .select('count(*)', { count: 'exact', head: true })

          if (tableError) {
            setDebugInfo(prev => prev + `❌ 表 ${tableName}: ${tableError.message}\n`)
          } else {
            setDebugInfo(prev => prev + `✅ 表 ${tableName}: 存在\n`)
          }
        } catch (tableTestError) {
          setDebugInfo(prev => prev + `❌ 表 ${tableName}: 测试异常 ${tableTestError}\n`)
        }
      }

      setDebugInfo(prev => prev + '\n🎉 原始Supabase测试完成！\n')
    } catch (error) {
      setDebugInfo(prev => prev + `❌ 测试过程出错: ${error}\n`)
    } finally {
      setLoading(false)
    }
  }

  const testLikeService = async () => {
    setLoading(true)
    setDebugInfo('开始测试点赞服务...\n')

    try {
      // 1. 获取当前用户
      setDebugInfo(prev => prev + '1. 获取当前用户...\n')
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setDebugInfo(prev => prev + `用户未登录或获取失败: ${JSON.stringify(userError)}\n`)
        return
      }

      setDebugInfo(prev => prev + `用户ID: ${user.id}\n`)

      // 2. 获取第一个作品
      setDebugInfo(prev => prev + '\n2. 获取测试作品...\n')
      const artworks = await getArtworks()

      if (artworks.length === 0) {
        setDebugInfo(prev => prev + '没有找到任何作品\n')
        return
      }

      const testArtwork = artworks[0]
      if (!testArtwork) {
        setDebugInfo(prev => prev + '无法获取测试作品\n')
        return
      }

      setDebugInfo(
        prev => prev + `测试作品ID: ${testArtwork.id} (类型: ${typeof testArtwork.id})\n`
      )
      setDebugInfo(prev => prev + `作品标题: ${testArtwork.title}\n`)

      // 3. 测试点赞状态检查
      setDebugInfo(prev => prev + '\n3. 测试点赞状态检查...\n')
      const isLiked = await likeService.checkArtworkLiked(user.id, testArtwork.id.toString())
      setDebugInfo(prev => prev + `点赞状态: ${isLiked}\n`)

      // 4. 测试收藏状态检查
      setDebugInfo(prev => prev + '\n4. 测试收藏状态检查...\n')
      const isFavorited = await favoriteService.checkIsFavorited(user.id, testArtwork.id.toString())
      setDebugInfo(prev => prev + `收藏状态: ${isFavorited}\n`)

      // 5. 测试点赞数获取
      setDebugInfo(prev => prev + '\n5. 测试点赞数获取...\n')
      const likesCount = await likeService.getArtworkLikesCount(testArtwork.id.toString())
      setDebugInfo(prev => prev + `点赞数: ${likesCount}\n`)

      setDebugInfo(prev => prev + '\n✅ 点赞服务测试完成\n')
    } catch (error) {
      setDebugInfo(prev => prev + `测试过程出错: ${JSON.stringify(error)}\n`)
    } finally {
      setLoading(false)
    }
  }

  const testCommentService = async () => {
    setLoading(true)
    setDebugInfo('开始测试评论服务...\n')

    try {
      // 1. 测试获取评论
      setDebugInfo(prev => prev + '1. 测试获取评论...\n')
      const { data: comments, error: fetchError } = await supabase
        .from('comments')
        .select('*')
        .limit(5)

      if (fetchError) {
        setDebugInfo(prev => prev + `❌ 获取评论失败: ${JSON.stringify(fetchError)}\n`)
        return
      }

      setDebugInfo(prev => prev + `✅ 获取评论成功: ${comments?.length || 0} 条\n`)

      // 2. 测试数据类型转换
      setDebugInfo(prev => prev + '\n2. 测试数据类型转换...\n')
      const testArtworkId = '1'
      const artworkIdNumber = parseInt(testArtworkId, 10)

      if (isNaN(artworkIdNumber)) {
        setDebugInfo(prev => prev + '❌ 数据类型转换失败\n')
        return
      }

      setDebugInfo(prev => prev + `✅ 数据类型转换成功: ${testArtworkId} -> ${artworkIdNumber}\n`)

      // 3. 测试按作品ID查询评论
      setDebugInfo(prev => prev + '\n3. 测试按作品ID查询评论...\n')
      const { data: artworkComments, error: artworkError } = await supabase
        .from('comments')
        .select('*')
        .eq('artwork_id', artworkIdNumber)
        .is('parent_id', null)

      if (artworkError) {
        setDebugInfo(prev => prev + `❌ 按作品ID查询评论失败: ${JSON.stringify(artworkError)}\n`)
        return
      }

      setDebugInfo(prev => prev + `✅ 按作品ID查询评论成功: ${artworkComments?.length || 0} 条\n`)

      // 4. 测试获取回复
      setDebugInfo(prev => prev + '\n4. 测试获取回复...\n')
      const { data: replies, error: repliesError } = await supabase
        .from('comments')
        .select('*')
        .eq('artwork_id', artworkIdNumber)
        .not('parent_id', 'is', null)

      if (repliesError) {
        setDebugInfo(prev => prev + `❌ 获取回复失败: ${JSON.stringify(repliesError)}\n`)
        return
      }

      setDebugInfo(prev => prev + `✅ 获取回复成功: ${replies?.length || 0} 条\n`)

      // 5. 测试获取用户信息
      if (comments && comments.length > 0) {
        setDebugInfo(prev => prev + '\n5. 测试获取用户信息...\n')
        const userIds = comments.map(c => c.user_id).filter(Boolean)

        if (userIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', userIds)

          if (profilesError) {
            setDebugInfo(prev => prev + `❌ 获取用户信息失败: ${JSON.stringify(profilesError)}\n`)
          } else {
            setDebugInfo(prev => prev + `✅ 获取用户信息成功: ${profiles?.length || 0} 条\n`)
          }
        }
      }

      setDebugInfo(prev => prev + '\n✅ 评论服务测试完成\n')
    } catch (error) {
      setDebugInfo(prev => prev + `❌ 测试过程出错: ${JSON.stringify(error)}\n`)
    } finally {
      setLoading(false)
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

  const clearDebugInfo = () => {
    setDebugInfo('')
  }

  const checkEnvironment = () => {
    setDebugInfo('检查环境变量配置...\n')

    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NODE_ENV: process.env.NODE_ENV,
    }

    setDebugInfo(prev => prev + '\n环境变量状态:\n')

    Object.entries(envVars).forEach(([key, value]) => {
      if (value) {
        if (key.includes('KEY') || key.includes('SECRET')) {
          setDebugInfo(prev => prev + `✅ ${key}: 已设置 (${value.substring(0, 10)}...)\n`)
        } else {
          setDebugInfo(prev => prev + `✅ ${key}: ${value}\n`)
        }
      } else {
        setDebugInfo(prev => prev + `❌ ${key}: 未设置\n`)
      }
    })

    // 检查关键配置
    const criticalMissing: string[] = []
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) criticalMissing.push('NEXT_PUBLIC_SUPABASE_URL')
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      criticalMissing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')

    if (criticalMissing.length > 0) {
      setDebugInfo(prev => prev + `\n🚨 缺少关键环境变量: ${criticalMissing.join(', ')}\n`)
      setDebugInfo(prev => prev + '请检查 .env.local 文件是否存在并正确配置。\n')
    } else {
      setDebugInfo(prev => prev + '\n✅ 关键环境变量配置完整\n')
    }
  }

  return (
    <div className='min-h-screen bg-white p-8'>
      <div className='mx-auto max-w-4xl'>
        <h1 className='mb-8 text-3xl font-bold text-black'>收藏功能调试工具</h1>

        {/* 用户状态 */}
        <div className='mb-6 rounded-lg bg-gray-50 p-4'>
          <h2 className='mb-4 text-xl font-semibold'>用户状态</h2>
          {user ? (
            <div>
              <p className='text-green-600'>✅ 用户已登录</p>
              <p>用户ID: {user.id}</p>
              <p>邮箱: {user.email}</p>
            </div>
          ) : (
            <p className='text-red-600'>❌ 用户未登录</p>
          )}
        </div>

        {/* 操作按钮 */}
        <div className='mb-6 flex flex-wrap gap-4'>
          <button
            onClick={checkEnvironment}
            className='rounded bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700'
          >
            检查环境变量
          </button>

          <button
            onClick={testSupabaseRaw}
            disabled={loading}
            className='rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50'
          >
            {loading ? '测试中...' : '原始连接测试'}
          </button>

          <button
            onClick={runSimpleTest}
            disabled={loading}
            className='rounded bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 disabled:opacity-50'
          >
            {loading ? '测试中...' : '运行简单测试'}
          </button>

          <button
            onClick={runDebug}
            className='rounded bg-black px-4 py-2 text-white transition-colors hover:bg-gray-800'
          >
            运行收藏功能调试
          </button>

          <button
            onClick={testLikeService}
            disabled={loading}
            className='rounded bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 disabled:opacity-50'
          >
            {loading ? '测试中...' : '测试点赞服务'}
          </button>

          <button
            onClick={testCommentService}
            disabled={loading}
            className='rounded bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700 disabled:opacity-50'
          >
            {loading ? '测试中...' : '测试评论服务'}
          </button>

          <button
            onClick={createUserFavoritesTable}
            className='rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700'
          >
            生成建表脚本
          </button>

          <button
            onClick={clearDebugInfo}
            className='rounded bg-gray-500 px-4 py-2 text-white transition-colors hover:bg-gray-600'
          >
            清除日志
          </button>
        </div>

        {/* 日志显示 */}
        <div className='rounded-lg bg-black p-4 text-gray-300'>
          <h2 className='mb-4 text-lg font-semibold text-white'>调试日志</h2>
          <div className='max-h-96 overflow-y-auto font-mono text-sm'>
            {logs.length === 0 ? (
              <p className='text-gray-500'>暂无日志，请点击上方按钮开始调试</p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`mb-1 ${
                    log.startsWith('ERROR:')
                      ? 'text-red-400'
                      : log.startsWith('WARN:')
                        ? 'text-yellow-400'
                        : log.startsWith('LOG:')
                          ? 'text-green-400'
                          : 'text-gray-300'
                  }`}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 调试信息 */}
        <div className='mt-8 rounded-lg bg-gray-50 p-6'>
          <h2 className='mb-4 text-xl font-semibold'>调试信息</h2>
          <pre className='max-h-96 overflow-auto rounded border bg-white p-4 text-sm whitespace-pre-wrap'>
            {debugInfo || '点击"测试 Supabase 连接"开始调试...'}
          </pre>
        </div>

        {/* 说明文档 */}
        <div className='mt-8 rounded-lg bg-gray-50 p-6'>
          <h2 className='mb-4 text-xl font-semibold'>问题排查步骤</h2>
          <ol className='list-inside list-decimal space-y-2 text-gray-700'>
            <li>首先检查用户是否已登录</li>
            <li>测试 Supabase 连接是否正常</li>
            <li>运行收藏功能调试，查看具体错误信息</li>
            <li>
              如果出现 &quot;表不存在&quot; 错误（42P01），点击 &quot;生成建表脚本&quot; 并在
              Supabase 中执行
            </li>
            <li>检查 .env.local 文件中的 Supabase 配置是否正确</li>
            <li>确认 Supabase 项目中的 RLS 策略是否正确设置</li>
          </ol>
        </div>

        {/* 常见问题 */}
        <div className='mt-6 rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-6'>
          <h3 className='mb-2 text-lg font-semibold text-yellow-800'>常见问题解决方案</h3>
          <div className='space-y-2 text-yellow-700'>
            <p>
              <strong>错误代码 42P01:</strong> 表不存在，需要运行建表脚本
            </p>
            <p>
              <strong>RLS 策略错误:</strong> 检查 Row Level Security 策略是否正确设置
            </p>
            <p>
              <strong>连接超时:</strong> 检查网络连接和 Supabase 配置
            </p>
            <p>
              <strong>权限不足:</strong> 确认用户已登录且有相应权限
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
