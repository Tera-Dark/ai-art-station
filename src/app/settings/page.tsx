'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/services/supabase.service'
import { Settings, Bell, Palette, Shield, Globe, Moon, Sun, Monitor } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [settings, setSettings] = useState({
    // 通知设置
    email_notifications: true,
    like_notifications: true,
    comment_notifications: true,
    follow_notifications: true,

    // 隐私设置
    profile_public: true,
    show_liked_artworks: true,
    show_email: false,

    // 显示设置
    theme: 'system', // light, dark, system
    language: 'zh-CN',
    items_per_page: 20,

    // 内容设置
    content_filter: false,
    show_nsfw: false,
  })

  // 加载用户设置
  useEffect(() => {
    if (user) {
      loadSettings()
    }
  }, [user])

  const loadSettings = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('加载设置失败:', error)
        return
      }

      // 如果找到设置，则更新状态
      if (data) {
        setSettings(prev => ({
          ...prev,
          email_notifications: data.email_notifications ?? prev.email_notifications,
          like_notifications: data.like_notifications ?? prev.like_notifications,
          comment_notifications: data.comment_notifications ?? prev.comment_notifications,
          follow_notifications: data.follow_notifications ?? prev.follow_notifications,
          profile_public: data.profile_public ?? prev.profile_public,
          show_liked_artworks: data.show_liked_artworks ?? prev.show_liked_artworks,
          show_email: data.show_email ?? prev.show_email,
          theme: data.theme || prev.theme,
          language: data.language || prev.language,
          items_per_page: data.items_per_page ?? prev.items_per_page,
          content_filter: data.content_filter ?? prev.content_filter,
          show_nsfw: data.show_nsfw ?? prev.show_nsfw,
        }))
      }
    } catch (error) {
      console.error('加载设置时出错:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    setMessage('')

    try {
      const { error } = await supabase.from('user_settings').upsert(
        {
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )

      if (error) {
        console.error('保存设置失败:', error)
        setMessage('保存失败，请重试')
        return
      }

      setMessage('设置保存成功！')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('保存设置时出错:', error)
      setMessage('保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }))
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
      <div className='container'>
        <div className='settings-page'>
          <div className='page-header'>
            <h1>
              <Settings size={28} />
              设置
            </h1>
            <p>管理您的偏好设置和隐私选项</p>
          </div>

          {message && (
            <div className={`status-message ${message.includes('失败') ? 'error' : ''}`}>
              {message}
            </div>
          )}

          <div className='settings-content'>
            {/* 通知设置 */}
            <div className='settings-section'>
              <div className='section-header'>
                <Bell size={20} />
                <h3>通知设置</h3>
              </div>

              <div className='setting-item'>
                <div className='setting-info'>
                  <label>邮件通知</label>
                  <span>接收重要的邮件通知</span>
                </div>
                <label className='toggle-switch'>
                  <input
                    type='checkbox'
                    checked={settings.email_notifications}
                    onChange={e => updateSetting('email_notifications', e.target.checked)}
                  />
                  <span className='toggle-slider'></span>
                </label>
              </div>

              <div className='setting-item'>
                <div className='setting-info'>
                  <label>点赞通知</label>
                  <span>当有人点赞您的作品时通知您</span>
                </div>
                <label className='toggle-switch'>
                  <input
                    type='checkbox'
                    checked={settings.like_notifications}
                    onChange={e => updateSetting('like_notifications', e.target.checked)}
                  />
                  <span className='toggle-slider'></span>
                </label>
              </div>

              <div className='setting-item'>
                <div className='setting-info'>
                  <label>评论通知</label>
                  <span>当有人评论您的作品时通知您</span>
                </div>
                <label className='toggle-switch'>
                  <input
                    type='checkbox'
                    checked={settings.comment_notifications}
                    onChange={e => updateSetting('comment_notifications', e.target.checked)}
                  />
                  <span className='toggle-slider'></span>
                </label>
              </div>

              <div className='setting-item'>
                <div className='setting-info'>
                  <label>关注通知</label>
                  <span>当有人关注您时通知您</span>
                </div>
                <label className='toggle-switch'>
                  <input
                    type='checkbox'
                    checked={settings.follow_notifications}
                    onChange={e => updateSetting('follow_notifications', e.target.checked)}
                  />
                  <span className='toggle-slider'></span>
                </label>
              </div>
            </div>

            {/* 隐私设置 */}
            <div className='settings-section'>
              <div className='section-header'>
                <Shield size={20} />
                <h3>隐私设置</h3>
              </div>

              <div className='setting-item'>
                <div className='setting-info'>
                  <label>公开个人资料</label>
                  <span>让其他用户可以查看您的个人资料</span>
                </div>
                <label className='toggle-switch'>
                  <input
                    type='checkbox'
                    checked={settings.profile_public}
                    onChange={e => updateSetting('profile_public', e.target.checked)}
                  />
                  <span className='toggle-slider'></span>
                </label>
              </div>

              <div className='setting-item'>
                <div className='setting-info'>
                  <label>显示点赞的作品</label>
                  <span>在您的个人资料中显示点赞的作品</span>
                </div>
                <label className='toggle-switch'>
                  <input
                    type='checkbox'
                    checked={settings.show_liked_artworks}
                    onChange={e => updateSetting('show_liked_artworks', e.target.checked)}
                  />
                  <span className='toggle-slider'></span>
                </label>
              </div>

              <div className='setting-item'>
                <div className='setting-info'>
                  <label>显示邮箱地址</label>
                  <span>在个人资料中显示您的邮箱地址</span>
                </div>
                <label className='toggle-switch'>
                  <input
                    type='checkbox'
                    checked={settings.show_email}
                    onChange={e => updateSetting('show_email', e.target.checked)}
                  />
                  <span className='toggle-slider'></span>
                </label>
              </div>
            </div>

            {/* 显示设置 */}
            <div className='settings-section'>
              <div className='section-header'>
                <Palette size={20} />
                <h3>显示设置</h3>
              </div>

              <div className='setting-item'>
                <div className='setting-info'>
                  <label>主题模式</label>
                  <span>选择您偏好的主题外观</span>
                </div>
                <div className='theme-options'>
                  <label className={`theme-option ${settings.theme === 'light' ? 'active' : ''}`}>
                    <input
                      type='radio'
                      name='theme'
                      value='light'
                      checked={settings.theme === 'light'}
                      onChange={e => updateSetting('theme', e.target.value)}
                    />
                    <Sun size={16} />
                    <span>浅色</span>
                  </label>
                  <label className={`theme-option ${settings.theme === 'dark' ? 'active' : ''}`}>
                    <input
                      type='radio'
                      name='theme'
                      value='dark'
                      checked={settings.theme === 'dark'}
                      onChange={e => updateSetting('theme', e.target.value)}
                    />
                    <Moon size={16} />
                    <span>深色</span>
                  </label>
                  <label className={`theme-option ${settings.theme === 'system' ? 'active' : ''}`}>
                    <input
                      type='radio'
                      name='theme'
                      value='system'
                      checked={settings.theme === 'system'}
                      onChange={e => updateSetting('theme', e.target.value)}
                    />
                    <Monitor size={16} />
                    <span>跟随系统</span>
                  </label>
                </div>
              </div>

              <div className='setting-item'>
                <div className='setting-info'>
                  <label>语言</label>
                  <span>选择界面显示语言</span>
                </div>
                <select
                  value={settings.language}
                  onChange={e => updateSetting('language', e.target.value)}
                  className='setting-select'
                >
                  <option value='zh-CN'>简体中文</option>
                  <option value='zh-TW'>繁體中文</option>
                  <option value='en-US'>English</option>
                  <option value='ja-JP'>日本語</option>
                </select>
              </div>

              <div className='setting-item'>
                <div className='setting-info'>
                  <label>每页显示数量</label>
                  <span>设置每页显示的作品数量</span>
                </div>
                <select
                  value={settings.items_per_page}
                  onChange={e => updateSetting('items_per_page', parseInt(e.target.value))}
                  className='setting-select'
                >
                  <option value={12}>12 个</option>
                  <option value={20}>20 个</option>
                  <option value={30}>30 个</option>
                  <option value={50}>50 个</option>
                </select>
              </div>
            </div>

            {/* 内容设置 */}
            <div className='settings-section'>
              <div className='section-header'>
                <Globe size={20} />
                <h3>内容设置</h3>
              </div>

              <div className='setting-item'>
                <div className='setting-info'>
                  <label>内容过滤</label>
                  <span>启用智能内容过滤</span>
                </div>
                <label className='toggle-switch'>
                  <input
                    type='checkbox'
                    checked={settings.content_filter}
                    onChange={e => updateSetting('content_filter', e.target.checked)}
                  />
                  <span className='toggle-slider'></span>
                </label>
              </div>

              <div className='setting-item'>
                <div className='setting-info'>
                  <label>显示敏感内容</label>
                  <span>显示可能包含敏感内容的作品</span>
                </div>
                <label className='toggle-switch'>
                  <input
                    type='checkbox'
                    checked={settings.show_nsfw}
                    onChange={e => updateSetting('show_nsfw', e.target.checked)}
                  />
                  <span className='toggle-slider'></span>
                </label>
              </div>
            </div>

            <div className='settings-actions'>
              <button
                className='save-settings-btn'
                onClick={handleSave}
                disabled={isSaving || isLoading}
              >
                <Settings size={16} />
                {isSaving ? '保存中...' : '保存设置'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
