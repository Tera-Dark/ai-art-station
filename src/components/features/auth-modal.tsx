'use client'

import { useState } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/services/supabase.service'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess: (user: any) => void // 暂时保留any，因为Supabase User类型可能不完全匹配
}

export function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [authError, setAuthError] = useState<string | null>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // 清除错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    if (authError) setAuthError(null)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.email.includes('@')) {
      newErrors.email = '请输入有效的邮箱地址'
    }
    if (formData.password.length < 6) {
      newErrors.password = '密码长度不能少于6位'
    }
    if (mode === 'register' && !formData.username.trim()) {
      newErrors.username = '请输入用户名'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setAuthError(null)

    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              username: formData.username,
              // 您可以在这里添加其他元数据，如头像URL
              // avatar_url: `https://api.dicebear.com/8.x/initials/svg?seed=${formData.username}`
            },
          },
        })

        if (error) throw error

        if (data.user) {
          // Supabase默认需要邮箱验证，这里为了简化，我们直接模拟登录成功
          // 在生产环境中，您应该提示用户检查邮箱
          alert('注册成功！请登录。')
          setMode('login')
        }
      } else {
        // 登录模式
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (error) throw error

        if (data.user) {
          onLoginSuccess(data.user)
          onClose()
        }
      }
    } catch (error: any) {
      setAuthError(error.message || '操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className='auth-overlay' onClick={onClose}>
      <div className='auth-modal' onClick={e => e.stopPropagation()}>
        {/* 关闭按钮 */}
        <button className='auth-close' onClick={onClose}>
          <X size={20} />
        </button>

        {/* 标题 */}
        <div className='auth-header'>
          <h2>{mode === 'login' ? '登录' : '注册'} AI Art Station</h2>
          <p>
            {mode === 'login' ? '欢迎回来！探索无限AI艺术可能' : '加入我们，开启您的AI艺术创作之旅'}
          </p>
        </div>

        {/* 表单 */}
        <form className='auth-form' onSubmit={handleSubmit}>
          {authError && <div className='auth-error-main'>{authError}</div>}

          {mode === 'register' && (
            <div className='auth-field-horizontal'>
              <label htmlFor='username'>用户名</label>
              <input
                id='username'
                type='text'
                value={formData.username}
                onChange={e => handleInputChange('username', e.target.value)}
                placeholder='设置您的昵称'
                className={errors.username ? 'error' : ''}
              />
              {errors.username && <span className='auth-error'>{errors.username}</span>}
            </div>
          )}

          <div className='auth-field-horizontal'>
            <label htmlFor='email'>邮箱地址</label>
            <input
              id='email'
              type='email'
              value={formData.email}
              onChange={e => handleInputChange('email', e.target.value)}
              placeholder='you@example.com'
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className='auth-error'>{errors.email}</span>}
          </div>

          <div className='auth-field-horizontal'>
            <label htmlFor='password'>密码</label>
            <div className='password-wrapper'>
              <input
                id='password'
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={e => handleInputChange('password', e.target.value)}
                placeholder='输入您的密码'
                className={errors.password ? 'error' : ''}
              />
              <button
                type='button'
                className='password-toggle'
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <span className='auth-error'>{errors.password}</span>}
          </div>

          {/* 提交按钮 */}
          <button type='submit' className='auth-submit' disabled={loading}>
            {loading ? '处理中...' : mode === 'login' ? '登 录' : '注 册'}
          </button>
        </form>

        {/* 切换模式 */}
        <div className='auth-footer'>
          <p>
            {mode === 'login' ? '还没有账户？ ' : '已有账户？ '}
            <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? '立即注册' : '直接登录'}
            </button>
          </p>
        </div>

        {/* 第三方登录（预留） */}
        <div className='auth-divider'>
          <span>或</span>
        </div>

        <div className='social-login'>
          <button className='social-login-btn' disabled>
            GitHub 登录
            <small>(即将上线)</small>
          </button>
        </div>
      </div>
    </div>
  )
}
