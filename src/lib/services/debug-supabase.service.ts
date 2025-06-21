import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from '../constants/config'

// 创建调试用的Supabase客户端，使用Service Role Key
export const debugSupabase = createClient(
  supabaseConfig.url,
  supabaseConfig.serviceRoleKey || supabaseConfig.anonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// 调试连接测试
export async function testDebugConnection() {
  console.log('🔍 开始调试连接测试...')

  try {
    // 测试基本连接
    console.log('📡 测试基本连接...')
    const { error: healthError } = await debugSupabase.from('artworks').select('count').limit(1)

    if (healthError) {
      console.error('❌ 基本连接失败:', healthError)
      return false
    }

    console.log('✅ 基本连接成功')

    // 测试表访问
    console.log('📊 测试表访问...')
    const tests = [
      { table: 'artworks', name: '作品表' },
      { table: 'user_favorites', name: '收藏表' },
      { table: 'profiles', name: '用户表' },
    ]

    for (const test of tests) {
      try {
        const { data, error } = await debugSupabase.from(test.table).select('*').limit(1)

        if (error) {
          console.error(`❌ ${test.name}访问失败:`, error)
        } else {
          console.log(`✅ ${test.name}访问成功, 数据条数: ${data?.length || 0}`)
        }
      } catch (err) {
        console.error(`❌ ${test.name}访问异常:`, err)
      }
    }

    return true
  } catch (error) {
    console.error('❌ 调试连接测试失败:', error)
    return false
  }
}

// 测试权限
export async function testPermissions() {
  console.log('🔐 开始权限测试...')

  try {
    // 测试读取权限
    const { error: readError } = await debugSupabase.from('artworks').select('id, title').limit(1)

    if (readError) {
      console.error('❌ 读取权限测试失败:', readError)
      return { read: false, write: false }
    }

    console.log('✅ 读取权限正常')

    // 获取当前用户ID或使用默认ID
    const {
      data: { user },
    } = await debugSupabase.auth.getUser()
    const userId = user?.id || 'dc9b2295-4c63-4ad5-af6d-f0f339258a8c' // 使用实际登录用户ID

    // 测试写入权限
    const testData = {
      title: '权限测试作品',
      prompt: '这是一个权限测试',
      image_url: 'https://example.com/test.jpg',
      user_id: userId,
    }

    const { data: writeTest, error: writeError } = await debugSupabase
      .from('artworks')
      .insert(testData)
      .select()
      .single()

    if (writeError) {
      console.error('❌ 写入权限测试失败:', writeError)
      return { read: true, write: false }
    }

    console.log('✅ 写入权限正常')

    // 清理测试数据
    if (writeTest?.id) {
      await debugSupabase.from('artworks').delete().eq('id', writeTest.id)
      console.log('🧹 测试数据已清理')
    }

    return { read: true, write: true }
  } catch (error) {
    console.error('❌ 权限测试异常:', error)
    return { read: false, write: false }
  }
}
