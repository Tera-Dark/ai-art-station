'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import {
  ChevronDown,
  Upload,
  User as UserIcon,
  Star,
  Settings,
  LogOut,
  Image as ImageIcon,
} from 'lucide-react'
import Image from 'next/image'
import { User } from '@supabase/supabase-js'

interface UserMenuProps {
  onUploadClick: () => void
  user: User
}

export function UserMenu({ onUploadClick, user }: UserMenuProps) {
  const { logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = async () => {
    await logout()
    // 页面会自动刷新或通过 AuthContext 更新状态
  }

  // 从 user.user_metadata 中获取用户名
  const username = user.user_metadata?.username || user.email?.split('@')[0] || '用户'
  const avatarUrl = user.user_metadata?.avatar_url

  return (
    <div className='user-menu' ref={menuRef}>
      <button className='user-menu-trigger' onClick={() => setIsOpen(!isOpen)}>
        <div className='user-avatar'>
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={username}
              layout='fill'
              objectFit='cover'
              className='avatar-image'
            />
          ) : (
            <span>{username.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <ChevronDown size={18} className={`menu-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className='user-menu-dropdown'>
          <div className='menu-header'>
            <div className='menu-header-avatar'>
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={username}
                  layout='fill'
                  objectFit='cover'
                  className='avatar-image'
                />
              ) : (
                <span>{username.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className='menu-header-info'>
              <div className='menu-username'>{username}</div>
              <div className='menu-email'>{user.email}</div>
            </div>
          </div>

          <div className='menu-actions'>
            <button className='menu-item' onClick={onUploadClick}>
              <Upload size={16} />
              <span>上传作品</span>
            </button>
            <Link href='/my-works' className='menu-item'>
              <ImageIcon size={16} />
              <span>我的作品</span>
            </Link>
            <Link href='/profile' className='menu-item'>
              <UserIcon size={16} />
              <span>个人资料</span>
            </Link>
            <Link href='/favorites' className='menu-item'>
              <Star size={16} />
              <span>我的收藏</span>
            </Link>
          </div>

          <div className='menu-footer'>
            <Link href='/settings' className='menu-item'>
              <Settings size={16} />
              <span>设置</span>
            </Link>
            <button className='menu-item' onClick={handleLogout}>
              <LogOut size={16} />
              <span>退出登录</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
