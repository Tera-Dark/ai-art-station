'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { AuthModal } from '@/components/features/auth-modal'
import { UserMenu } from './user-menu'
import { User } from '@supabase/supabase-js'
import { usePathname } from 'next/navigation'

interface HeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onUploadClick: () => void
}

export function Header({ searchQuery, onSearchChange, onUploadClick }: HeaderProps) {
  const { isAuthenticated, user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const pathname = usePathname()

  const handleLoginSuccess = (_loggedInUser: User) => {
    setShowAuthModal(false)
  }

  const handleUploadAttempt = () => {
    if (isAuthenticated) {
      onUploadClick()
    } else {
      setShowAuthModal(true)
    }
  }

  return (
    <>
      <header className='header'>
        <nav className='nav'>
          <Link href='/' className='logo'>
            AI Art Station
          </Link>

          <ul className='nav-links'>
            <li>
              <Link href='/' className={pathname === '/' ? 'active' : ''}>
                首页
              </Link>
            </li>
            <li>
              <Link href='/explore' className={pathname === '/explore' ? 'active' : ''}>
                探索
              </Link>
            </li>
            <li>
              <Link href='/masters' className={pathname === '/masters' ? 'active' : ''}>
                大神
              </Link>
            </li>
            <li>
              <Link href='/tools' className={pathname === '/tools' ? 'active' : ''}>
                工具
              </Link>
            </li>
          </ul>

          <div className='nav-actions'>
            {isAuthenticated && user ? (
              <UserMenu onUploadClick={handleUploadAttempt} user={user} />
            ) : (
              <button className='upload-btn' onClick={handleUploadAttempt}>
                登录 / 注册
              </button>
            )}
          </div>
        </nav>

        {/* 搜索栏 */}
        <div className='search-header'>
          <div className='search-container'>
            <div className='search-box'>
              <Search className='search-icon' size={20} />
              <input
                type='text'
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                placeholder='搜索AI艺术作品、风格、艺术家...'
                className='search-input'
              />
            </div>
          </div>
        </div>
      </header>

      {/* 认证模态框 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  )
}
