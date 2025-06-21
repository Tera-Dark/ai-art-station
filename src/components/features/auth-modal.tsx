'use client'

import { useState } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/services/supabase.service'
import { User } from '@supabase/supabase-js'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess: (user: User) => void
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
              full_name: formData.username, // 使用用户名作为默认全名
              display_name: formData.username,
            },
          },
        })

        if (error) {
          // 处理具体的错误类型
          if (error.message.includes('User already registered')) {
            throw new Error('该邮箱已被注册，请直接登录或使用其他邮箱')
          } else if (error.message.includes('Invalid email')) {
            throw new Error('邮箱格式不正确，请检查后重试')
          } else if (error.message.includes('Password')) {
            throw new Error('密码不符合要求，请设置6位以上的强密码')
          } else if (error.message.includes('rate limit')) {
            throw new Error('操作过于频繁，请稍后再试')
          } else {
            throw new Error(`注册失败：${error.message}`)
          }
        }

        if (data.user) {
          // 等待一下让后台触发器完成
          await new Promise(resolve => setTimeout(resolve, 1000))

          // 显示成功消息
          setAuthError('注册成功！您可以立即开始使用。')

          // 自动登录
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          })

          if (loginError) {
            // 如果自动登录失败，提示手动登录
            setAuthError('注册成功！请手动登录。')
            setMode('login')
          } else if (loginData.user) {
            onLoginSuccess(loginData.user)
            onClose()
          }
        }
      } else {
        // 登录模式
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (error) {
          // 处理登录错误
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('邮箱或密码错误，请检查后重试')
          } else if (error.message.includes('too many requests')) {
            throw new Error('登录尝试过于频繁，请稍后再试')
          } else {
            throw new Error(`登录失败：${error.message}`)
          }
        }

        if (data.user) {
          onLoginSuccess(data.user)
          onClose()
        }
      }
    } catch (error: unknown) {
      console.error('认证错误:', error)
      const errorMessage = error instanceof Error ? error.message : '操作失败，请重试'
      setAuthError(errorMessage)
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
