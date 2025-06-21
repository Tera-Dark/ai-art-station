'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { UserMenu } from '@/components/layout/user-menu'
import { useAuth } from '@/contexts/auth-context'
import { AuthModal } from '@/components/features/auth-modal'
import { User } from '@supabase/supabase-js'

// AI工具数据
const aiTools = [
  {
    id: 1,
    name: 'Midjourney',
    category: '图像生成',
    description: '最受欢迎的AI艺术生成工具，擅长创意和艺术性图片',
    image: '/placeholder.svg',
    url: 'https://midjourney.com',
  },
  {
    id: 2,
    name: 'DALL·E 3',
    category: '图像生成',
    description: 'OpenAI开发的图像生成模型，文本理解能力强',
    image: '/placeholder.svg',
    url: 'https://openai.com/dall-e-3',
  },
  {
    id: 3,
    name: 'Stable Diffusion',
    category: '图像生成',
    description: '开源的图像生成模型，可本地部署',
    image: '/placeholder.svg',
    url: 'https://stability.ai',
  },
  {
    id: 4,
    name: 'Flux.1',
    category: '图像生成',
    description: '2024年新兴的高质量AI图像生成模型，由Black Forest Labs开发',
    image: '/placeholder.svg',
    url: 'https://blackforestlabs.ai',
  },
  {
    id: 5,
    name: 'NovelAI',
    category: '图像生成',
    description: '专注动漫风格的AI图像生成工具，深受二次元爱好者喜爱',
    image: '/placeholder.svg',
    url: 'https://novelai.net',
  },
  {
    id: 6,
    name: 'Lumina T2I',
    category: '图像生成',
    description: '基于Flow的扩散变换器，支持多种分辨率和长宽比',
    image: '/placeholder.svg',
    url: 'https://github.com/Alpha-VLLM/Lumina-T2X',
  },
  {
    id: 7,
    name: 'Leonardo AI',
    category: '图像生成',
    description: '专注游戏资产和角色设计的AI工具',
    image: '/placeholder.svg',
    url: 'https://leonardo.ai',
  },
  {
    id: 8,
    name: 'Adobe Firefly 3',
    category: '创意工具',
    description: 'Adobe最新的创意AI工具套件，集成到Creative Cloud',
    image: '/placeholder.svg',
    url: 'https://firefly.adobe.com',
  },
  {
    id: 9,
    name: 'Ideogram v2',
    category: '图像生成',
    description: '新一代文本理解能力强的AI图像生成工具',
    image: '/placeholder.svg',
    url: 'https://ideogram.ai',
  },
  {
    id: 10,
    name: 'Recraft V3',
    category: '图像生成',
    description: '专业级AI设计工具，支持矢量图和品牌一致性',
    image: '/placeholder.svg',
    url: 'https://www.recraft.ai',
  },
  {
    id: 11,
    name: 'RunwayML',
    category: '视频生成',
    description: 'AI视频生成和编辑平台',
    image: '/placeholder.svg',
    url: 'https://runwayml.com',
  },
  {
    id: 12,
    name: 'Sora',
    category: '视频生成',
    description: 'OpenAI开发的文本生成视频模型，质量极高',
    image: '/placeholder.svg',
    url: 'https://openai.com/sora',
  },
  {
    id: 13,
    name: 'ComfyUI',
    category: '工作流工具',
    description: '可视化的AI工作流构建工具，支持复杂的生成流程',
    image: '/placeholder.svg',
    url: 'https://github.com/comfyanonymous/ComfyUI',
  },
  {
    id: 14,
    name: 'Automatic1111',
    category: '工作流工具',
    description: 'Stable Diffusion的经典Web界面，功能丰富',
    image: '/placeholder.svg',
    url: 'https://github.com/AUTOMATIC1111/stable-diffusion-webui',
  },
  {
    id: 15,
    name: 'Civitai',
    category: '社区资源',
    description: 'AI模型和资源分享平台，有丰富的社区模型',
    image: '/placeholder.svg',
    url: 'https://civitai.com',
  },
  {
    id: 16,
    name: 'Hugging Face',
    category: '社区资源',
    description: 'AI模型和数据集托管平台，开源AI的中心',
    image: '/placeholder.svg',
    url: 'https://huggingface.co',
  },
]

// 工具分类
const categories = [
  { id: 'all', name: '全部工具' },
  { id: '图像生成', name: '图像生成' },
  { id: '视频生成', name: '视频生成' },
  { id: '创意工具', name: '创意工具' },
  { id: '工作流工具', name: '工作流工具' },
  { id: '社区资源', name: '社区资源' },
]

export default function ToolsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const pathname = usePathname()

  // 过滤工具
  const filteredTools =
    selectedCategory === 'all'
      ? aiTools
      : aiTools.filter(tool => tool.category === selectedCategory)

  const handleLoginSuccess = (_loggedInUser: User) => {
    setShowAuthModal(false)
  }

  return (
    <div className='page-container'>
      {/* 简化的头部导航 */}
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
              <UserMenu onUploadClick={() => {}} user={user} />
            ) : (
              <button className='upload-btn' onClick={() => setShowAuthModal(true)}>
                登录 / 注册
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* 页面头部 */}
      <header className='page-header'>
        <h1>AI 工具</h1>
        <p>发现最好用的AI创作工具</p>
      </header>

      <div className='container'>
        {/* 分类过滤器 */}
        <div className='category-filter'>
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* 工具网格 */}
        <div className='tools-grid'>
          {filteredTools.map(tool => (
            <Link
              key={tool.id}
              href={tool.url}
              target='_blank'
              rel='noopener noreferrer'
              className='tool-card'
            >
              <div className='tool-image'>
                <Image src={tool.image} alt={tool.name} width={80} height={80} />
              </div>
              <div className='tool-content'>
                <h3 className='tool-name'>{tool.name}</h3>
                <span className='tool-category'>{tool.category}</span>
                <p className='tool-description'>{tool.description}</p>
                <div className='tool-action'>
                  <span className='visit-link'>访问工具</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className='empty-state'>
            <h3>暂无工具</h3>
            <p>该分类下暂时没有工具</p>
          </div>
        )}
      </div>

      {/* 认证模态框 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  )
}
