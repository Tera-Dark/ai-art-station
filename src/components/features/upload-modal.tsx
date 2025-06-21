'use client'

import { useState, useEffect } from 'react'
import { X, Upload, Image as ImageIcon, Tag, FileText } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Artwork } from '@/types/artwork'
import { supabase } from '@/lib/services/supabase.service'
import { createArtwork, updateArtwork } from '@/lib/services/artwork.service'
import { storageConfig, supabaseConfig } from '@/lib/constants/config'

const AI_MODELS = [
  'Midjourney v6',
  'Midjourney v5.2',
  'Niji Journey v6',
  'Niji Journey v5',
  'DALL-E 3',
  'Stable Diffusion 3',
  'Stable Diffusion XL',
]
const SAMPLERS = ['DPM++ 2M Karras', 'Euler a', 'Euler', 'LMS', 'DPM2 Karras', 'DDIM']

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: (artwork: Artwork) => void
  onUpdateSuccess: (artwork: Artwork) => void
  artworkToEdit: Artwork | null
}

const initialFormData = {
  title: '',
  prompt: '',
  description: '',
  tags: '',
  model: AI_MODELS[0],
  steps: 50,
  cfg_scale: 7.5,
  sampler: SAMPLERS[0],
  seed: Math.floor(Math.random() * 1000000000),
}

export function UploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
  onUpdateSuccess,
  artworkToEdit,
}: UploadModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [formData, setFormData] = useState(initialFormData)
  const [customModel, setCustomModel] = useState('')
  const [customSampler, setCustomSampler] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditMode = artworkToEdit !== null

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && artworkToEdit) {
        // 编辑模式: 填充表单
        const model =
          artworkToEdit.model && AI_MODELS.includes(artworkToEdit.model)
            ? artworkToEdit.model
            : 'CUSTOM'
        const sampler =
          artworkToEdit.sampler && SAMPLERS.includes(artworkToEdit.sampler)
            ? artworkToEdit.sampler
            : 'CUSTOM'

        setFormData({
          title: artworkToEdit.title || '',
          prompt: artworkToEdit.prompt || '',
          description: artworkToEdit.description || '',
          tags: artworkToEdit.tags?.join(', ') || '',
          model,
          steps: artworkToEdit.steps || 50,
          cfg_scale: artworkToEdit.cfg_scale || 7.5,
          sampler,
          seed: artworkToEdit.seed || 0,
        })

        if (model === 'CUSTOM') setCustomModel(artworkToEdit.model || '')
        if (sampler === 'CUSTOM') setCustomSampler(artworkToEdit.sampler || '')

        setPreviewUrl(artworkToEdit.image_url || null)
        setSelectedFile(null) // 在编辑模式开始时不要求新文件
      } else {
        // 上传模式: 重置表单
        resetForm()
      }
    }
  }, [isOpen, artworkToEdit, isEditMode])

  const resetForm = () => {
    setFormData(initialFormData)
    setCustomModel('')
    setCustomSampler('')
    setSelectedFile(null)
    setPreviewUrl(null)
    setErrors({})
    setLoading(false)
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrors({ ...errors, file: '请选择图片文件' })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      // 10MB
      setErrors({ ...errors, file: '图片大小不能超过10MB' })
      return
    }
    setSelectedFile(file)
    setErrors(prev => ({ ...prev, file: '' }))
    const reader = new FileReader()
    reader.onload = e => setPreviewUrl(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = '请输入作品标题'
    // 只有在创建模式下才强制要求上传图片
    if (!isEditMode && !selectedFile) newErrors.file = '请选择要上传的图片'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm() || !user) return
    setLoading(true)
    setErrors({})

    try {
      let imageUrl = artworkToEdit?.image_url || ''
      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)
      const finalModel = formData.model === 'CUSTOM' ? customModel : formData.model
      const finalSampler = formData.sampler === 'CUSTOM' ? customSampler : formData.sampler

      const artworkData = {
        title: formData.title,
        prompt: formData.prompt,
        description: formData.description,
        tags: tagsArray,
        model: finalModel || null,
        steps: formData.steps,
        cfg_scale: formData.cfg_scale,
        sampler: finalSampler || null,
        seed: formData.seed,
        user_id: user.id,
      }

      // 如果有新文件被选中，上传它
      if (selectedFile) {
        try {
          console.log('开始上传图片...')

          let uploadSuccess = false

          // 1. 尝试 Supabase 上传
          try {
            const fileExt = selectedFile.name.split('.').pop()
            const fileName = `${crypto.randomUUID()}-${Date.now()}.${fileExt}`
            const filePath = `${storageConfig.paths.public}${fileName}`

            console.log('准备上传到 Supabase 存储...')
            console.log('存储桶:', storageConfig.buckets.artworks)
            console.log('文件路径:', filePath)

            // 上传到 Supabase 存储
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from(storageConfig.buckets.artworks)
              .upload(filePath, selectedFile, { upsert: true })

            if (uploadError) {
              throw new Error(`Supabase 上传失败: ${uploadError.message}`)
            }

            console.log('Supabase 上传成功:', uploadData)

            // 获取公共URL
            const {
              data: { publicUrl },
            } = supabase.storage.from(storageConfig.buckets.artworks).getPublicUrl(filePath)

            imageUrl = publicUrl
            console.log('Supabase 公共URL:', imageUrl)
            uploadSuccess = true
          } catch (supabaseError) {
            console.warn('Supabase 上传失败，尝试备选服务:', supabaseError)

            // 2. 如果 Supabase 失败，尝试简化的图片服务
            try {
              // 导入简化的图片服务
              const { uploadToSimpleService } = await import('@/lib/services/simple-image.service')
              imageUrl = await uploadToSimpleService(selectedFile)
              console.log('备选服务上传成功:', imageUrl)
              uploadSuccess = true
            } catch (serviceError) {
              console.warn('备选服务上传失败:', serviceError)
            }
          }

          // 3. 如果所有服务都失败，使用临时本地URL
          if (!uploadSuccess) {
            // 创建临时本地URL (仅用于演示，实际生产环境不应使用)
            imageUrl = URL.createObjectURL(selectedFile)
            console.log('使用临时本地URL:', imageUrl)

            // 友好的提示信息
            const isDemo = !supabaseConfig.isValid()
            if (isDemo) {
              alert('演示模式：图片使用临时URL。要获得完整功能，请配置 Supabase 或 ImgBB 服务。')
            } else {
              alert('注意：图片使用临时URL，页面刷新后将无法访问。建议配置图片存储服务。')
            }
          }

          // 2. 如果是编辑模式，删除旧图片（仅当使用Supabase时）
          if (isEditMode && artworkToEdit?.image_url && uploadSuccess) {
            try {
              // 检查是否是Supabase存储的图片
              if (artworkToEdit.image_url.includes(supabaseConfig.url)) {
                const oldUrl = new URL(artworkToEdit.image_url)
                const oldFilePath = oldUrl.pathname
                  .split(`/${storageConfig.buckets.artworks}/`)
                  .pop()
                if (oldFilePath) {
                  console.log('删除旧图片:', oldFilePath)
                  await supabase.storage.from(storageConfig.buckets.artworks).remove([oldFilePath])
                }
              } else {
                console.log('旧图片不是存储在Supabase中，跳过删除')
              }
            } catch (deleteError) {
              console.warn('删除旧图片失败，但将继续更新记录:', deleteError)
            }
          }

          // 确保我们有图片URL
          if (!imageUrl) {
            throw new Error('无法获取有效的图片URL')
          }
        } catch (imageError: any) {
          console.error('图片处理错误:', imageError)
          setErrors({ file: `图片处理错误: ${imageError.message}` })
          setLoading(false)
          return
        }
      }

      console.log('准备保存到数据库...')
      console.log('图片URL:', imageUrl)

      if (isEditMode && artworkToEdit) {
        // 更新模式
        const updatedArtwork = await updateArtwork(artworkToEdit.id, {
          ...artworkData,
          image_url: imageUrl,
        })

        if (!updatedArtwork) {
          throw new Error('作品更新失败')
        }

        console.log('作品更新成功:', updatedArtwork)
        onUpdateSuccess(updatedArtwork)
      } else {
        // 创建模式
        const newArtwork = await createArtwork({ ...artworkData, image_url: imageUrl })

        if (!newArtwork) {
          throw new Error('数据写入失败')
        }

        console.log('作品创建成功:', newArtwork)
        onUploadSuccess(newArtwork)
      }

      onClose()
      resetForm()
    } catch (error: any) {
      console.error('上传/更新过程中出错:', error)
      setErrors({ general: error.message || `${isEditMode ? '更新' : '上传'}失败，请重试` })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className='upload-overlay' onClick={onClose}>
      <div className='upload-modal' onClick={e => e.stopPropagation()}>
        <button className='upload-close' onClick={onClose}>
          <X size={20} />
        </button>

        <div className='upload-header'>
          <h2>{isEditMode ? '编辑作品' : '上传AI艺术作品'}</h2>
          <p>
            {isEditMode
              ? '修改作品信息，分享你的更新'
              : '分享您的AI创作，与社区一起探索艺术的无限可能'}
          </p>
        </div>

        <form className='upload-form' onSubmit={handleSubmit}>
          {errors.general && <div className='upload-error-general'>{errors.general}</div>}

          <div className='upload-content'>
            <div className='upload-left'>
              <div className='upload-section'>
                <label className='upload-label'>作品图片 {isEditMode ? '' : '*'}</label>
                <div
                  className={`upload-dropzone ${dragActive ? 'active' : ''} ${previewUrl ? 'has-file' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  {previewUrl ? (
                    <div className='upload-preview'>
                      <img src={previewUrl} alt='预览' />
                      <div className='upload-preview-overlay'>
                        <Upload size={24} />
                        <span>点击或拖拽替换图片</span>
                      </div>
                    </div>
                  ) : (
                    <div className='upload-placeholder'>
                      <ImageIcon size={48} />
                      <h3>上传作品图片</h3>
                      <p>点击选择或拖拽图片到此处</p>
                      <small>支持 JPG、PNG、GIF，最大 10MB</small>
                    </div>
                  )}
                  <input
                    id='file-input'
                    type='file'
                    accept='image/*'
                    onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                </div>
                {errors.file && <span className='upload-error'>{errors.file}</span>}
              </div>
            </div>

            <div className='upload-right'>
              <div className='upload-field'>
                <label className='upload-label'>作品标题 *</label>
                <input
                  type='text'
                  value={formData.title}
                  onChange={e => handleInputChange('title', e.target.value)}
                  placeholder='给您的作品起个好听的名字'
                  className={`upload-input ${errors.title ? 'error' : ''}`}
                  maxLength={100}
                />
                {errors.title && <span className='upload-error'>{errors.title}</span>}
              </div>

              <div className='upload-field'>
                <label className='upload-label'>
                  <FileText size={16} /> AI提示词
                </label>
                <textarea
                  value={formData.prompt}
                  onChange={e => handleInputChange('prompt', e.target.value)}
                  placeholder='输入生成这个作品的AI提示词（可选）'
                  className='upload-textarea'
                  rows={3}
                  maxLength={1000}
                />
              </div>

              <div className='upload-field'>
                <label className='upload-label'>作品描述</label>
                <textarea
                  value={formData.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                  placeholder='描述您的创作思路、风格特点等（可选）'
                  className='upload-textarea'
                  rows={2}
                  maxLength={500}
                />
              </div>

              <div className='upload-field'>
                <label className='upload-label'>
                  <Tag size={16} /> 标签
                </label>
                <input
                  type='text'
                  value={formData.tags}
                  onChange={e => handleInputChange('tags', e.target.value)}
                  placeholder='用逗号分隔，如：科幻, 未来主义, 机器人'
                  className='upload-input small'
                  maxLength={200}
                />
              </div>

              <div className='upload-params'>
                <h4>AI参数（可选）</h4>
                <div className='params-grid'>
                  <div className='param-field'>
                    <label>AI模型</label>
                    <select
                      value={formData.model}
                      onChange={e => handleInputChange('model', e.target.value)}
                      className='upload-select'
                    >
                      {AI_MODELS.map(model => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                      <option value='CUSTOM'>自定义...</option>
                    </select>
                    {formData.model === 'CUSTOM' && (
                      <input
                        type='text'
                        value={customModel}
                        onChange={e => setCustomModel(e.target.value)}
                        placeholder='输入自定义模型名称'
                        className='upload-input'
                        style={{ marginTop: '8px' }}
                      />
                    )}
                  </div>

                  <div className='param-field'>
                    <label>步数</label>
                    <input
                      type='number'
                      value={formData.steps}
                      onChange={e => handleInputChange('steps', parseInt(e.target.value) || 0)}
                      min='1'
                      max='150'
                      className='upload-input'
                    />
                  </div>

                  <div className='param-field'>
                    <label>CFG Scale</label>
                    <input
                      type='number'
                      value={formData.cfg_scale}
                      onChange={e =>
                        handleInputChange('cfg_scale', parseFloat(e.target.value) || 0)
                      }
                      min='1'
                      max='30'
                      step='0.1'
                      className='upload-input'
                    />
                  </div>

                  <div className='param-field'>
                    <label>采样器</label>
                    <select
                      value={formData.sampler}
                      onChange={e => handleInputChange('sampler', e.target.value)}
                      className='upload-select'
                    >
                      {SAMPLERS.map(sampler => (
                        <option key={sampler} value={sampler}>
                          {sampler}
                        </option>
                      ))}
                      <option value='CUSTOM'>自定义...</option>
                    </select>
                    {formData.sampler === 'CUSTOM' && (
                      <input
                        type='text'
                        value={customSampler}
                        onChange={e => setCustomSampler(e.target.value)}
                        placeholder='输入自定义采样器名称'
                        className='upload-input'
                        style={{ marginTop: '8px' }}
                      />
                    )}
                  </div>

                  <div className='param-field'>
                    <label>种子值</label>
                    <input
                      type='number'
                      value={formData.seed}
                      onChange={e => handleInputChange('seed', parseInt(e.target.value) || 0)}
                      min='0'
                      max='9999999999'
                      className='upload-input'
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='upload-actions'>
            <button type='button' className='upload-cancel' onClick={onClose} disabled={loading}>
              取消
            </button>
            <button type='submit' className='upload-submit' disabled={loading}>
              {loading
                ? isEditMode
                  ? '更新中...'
                  : '上传中...'
                : isEditMode
                  ? '更新作品'
                  : '发布作品'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
