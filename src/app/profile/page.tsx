'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/services/supabase.service'
import { 
  User, 
  Camera, 
  Save, 
  MapPin, 
  Calendar, 
  Globe, 
  ArrowLeft, 
  LogOut,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  const [profile, setProfile] = useState({
    username: '',
    display_name: '',
    bio: '',
    location: '',
    website: '',
    avatar_url: '',
    created_at: '',
  })

  // 加载用户资料
  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()

      if (error && error.code !== 'PGRST116') {
        console.error('加载用户资料失败:', error)
        return
      }

      // 如果没有找到资料，使用默认值
      if (data) {
        setProfile({
          username: data.username || '',
          display_name: data.display_name || '',
          bio: data.bio || '',
          location: data.location || '',
          website: data.website || '',
          avatar_url: data.avatar_url || '',
          created_at: data.created_at || user.created_at,
        })
      } else {
        setProfile({
          username: user.user_metadata?.username || user.email?.split('@')[0] || '',
          display_name: user.user_metadata?.display_name || '',
          bio: '',
          location: '',
          website: '',
          avatar_url: user.user_metadata?.avatar_url || '',
          created_at: user.created_at,
        })
      }
    } catch (error) {
      console.error('加载用户资料时出错:', error)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    setMessage('')

    try {
      const { error } = await supabase.from('profiles').upsert(
        {
          id: user.id,
          username: profile.username,
          display_name: profile.display_name,
          bio: profile.bio,
          location: profile.location,
          website: profile.website,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'id',
        }
      )

      if (error) {
        console.error('保存失败:', error)
        setMessage('保存失败，请重试')
        setMessageType('error')
        return
      }

      setMessage('资料保存成功！')
      setMessageType('success')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('保存时出错:', error)
      setMessage('保存失败，请重试')
      setMessageType('error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    const fileExt = file.name.split('.').pop()
    const fileName = `avatar-${user.id}-${Math.random()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    try {
      // 上传到 Supabase Storage
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)

      if (uploadError) {
        console.error('头像上传失败:', uploadError)
        setMessage('头像上传失败')
        setMessageType('error')
        return
      }

      // 获取公开URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath)

      setProfile(prev => ({
        ...prev,
        avatar_url: publicUrl,
      }))

      setMessage('头像上传成功！记得点击保存')
      setMessageType('success')
    } catch (error) {
      console.error('头像上传时出错:', error)
      setMessage('头像上传失败')
      setMessageType('error')
    }
  }

  const handleBack = () => {
    router.back()
  }

  const handleSignOut = async () => {
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('退出登录失败:', error)
      setMessage('退出登录失败')
      setMessageType('error')
    }
  }

  if (!user) {
    return (
      <div className='page-container'>
        <div className='container'>
          <div className='loading-container'>
            <p>请先登录</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='page-container'>
      {/* 顶部导航栏 */}
      <div className='profile-nav'>
        <button className='nav-back-button' onClick={handleBack}>
          <ArrowLeft size={20} />
          <span>返回</span>
        </button>
        <h1 className='nav-title'>个人资料</h1>
        <button className='nav-signout-button' onClick={handleSignOut}>
          <LogOut size={18} />
          <span>退出登录</span>
        </button>
      </div>

      <div className='container'>
        <div className='profile-page-modern'>
          {/* 状态消息 */}
          {message && (
            <div className={`message-card ${messageType}`}>
              {messageType === 'success' ? (
                <CheckCircle className='message-icon' size={20} />
              ) : (
                <AlertCircle className='message-icon' size={20} />
              )}
              <span>{message}</span>
            </div>
          )}

          {/* 主要内容区域 */}
          <div className='profile-content-modern'>
            {/* 头像和基础信息 */}
            <div className='profile-header-card'>
              <div className='avatar-section'>
                <div className='avatar-container-large'>
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt='头像'
                      width={120}
                      height={120}
                      className='avatar-image'
                    />
                  ) : (
                    <div className='avatar-placeholder-large'>
                      <User size={48} />
                    </div>
                  )}
                  <label className='avatar-upload-overlay'>
                    <Camera size={20} />
                    <input
                      type='file'
                      accept='image/*'
                      onChange={handleImageUpload}
                      className='hidden-input'
                    />
                  </label>
                </div>
                <div className='user-basic-info'>
                  <h2 className='user-display-name'>
                    {profile.display_name || profile.username || '未设置昵称'}
                  </h2>
                  <p className='user-email'>{user.email}</p>
                  <div className='user-meta'>
                    <div className='meta-item'>
                      <Calendar size={14} />
                      <span>加入于 {new Date(profile.created_at).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 编辑表单 */}
            <div className='profile-form-card'>
              <h3 className='form-section-title'>编辑资料</h3>
              
              <div className='form-grid'>
                <div className='form-group'>
                  <label className='form-label'>
                    <User size={16} />
                    用户名
                  </label>
                  <input
                    type='text'
                    className='form-input modern'
                    value={profile.username}
                    onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                    placeholder='设置您的用户名'
                  />
                </div>

                <div className='form-group'>
                  <label className='form-label'>
                    <User size={16} />
                    显示名称
                  </label>
                  <input
                    type='text'
                    className='form-input modern'
                    value={profile.display_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                    placeholder='您的显示名称'
                  />
                </div>

                <div className='form-group full-width'>
                  <label className='form-label'>
                    <FileText size={16} />
                    个人简介
                  </label>
                  <textarea
                    className='form-textarea modern'
                    value={profile.bio}
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder='简单介绍一下自己...'
                    rows={4}
                  />
                </div>

                <div className='form-group'>
                  <label className='form-label'>
                    <MapPin size={16} />
                    所在地
                  </label>
                  <input
                    type='text'
                    className='form-input modern'
                    value={profile.location}
                    onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                    placeholder='您的所在地'
                  />
                </div>

                <div className='form-group'>
                  <label className='form-label'>
                    <Globe size={16} />
                    个人网站
                  </label>
                  <input
                    type='url'
                    className='form-input modern'
                    value={profile.website}
                    onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                    placeholder='https://...'
                  />
                </div>
              </div>

              {/* 保存按钮 */}
              <div className='form-actions'>
                <button 
                  className='save-button modern'
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className='animate-spin' size={18} />
                      <span>保存中...</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      <span>保存资料</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
