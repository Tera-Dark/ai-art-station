// 应用基础配置
export const APP_CONFIG = {
  name: 'AI Art Station',
  description: '探索和分享最新的AI生成艺术作品',
  version: '1.0.0',
  author: 'AI Art Station Team',
} as const

// 路由常量
export const ROUTES = {
  HOME: '/',
  EXPLORE: '/explore',
  MASTERS: '/masters',
  TOOLS: '/tools',
  PROFILE: '/profile',
  FAVORITES: '/favorites',
  SETTINGS: '/settings',
  MY_WORKS: '/my-works',
} as const

// API端点
export const API_ENDPOINTS = {
  ARTWORKS: '/api/artworks',
  USERS: '/api/users',
  COMMENTS: '/api/comments',
  LIKES: '/api/likes',
  FAVORITES: '/api/favorites',
} as const

// 分页配置
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 10,
} as const

// 文件上传配置
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ACCEPTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_FILES: 5,
} as const

// AI模型常量
export const AI_MODELS = {
  MIDJOURNEY: 'midjourney',
  STABLE_DIFFUSION: 'stable-diffusion',
  DALL_E: 'dall-e',
  FIREFLY: 'firefly',
  LEONARDO: 'leonardo',
} as const

// 排序选项
export const SORT_OPTIONS = {
  LATEST: 'latest',
  OLDEST: 'oldest',
  POPULAR: 'popular',
  VIEWS: 'views',
} as const

// 状态常量
export const STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const

// 本地存储键
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  LANGUAGE: 'language',
  RECENT_SEARCHES: 'recent_searches',
} as const

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查您的网络连接',
  UNAUTHORIZED: '您需要登录才能执行此操作',
  FORBIDDEN: '您没有权限执行此操作',
  NOT_FOUND: '请求的资源不存在',
  SERVER_ERROR: '服务器内部错误，请稍后重试',
  VALIDATION_ERROR: '输入的信息不正确，请检查后重试',
  FILE_TOO_LARGE: '文件大小超过限制',
  INVALID_FILE_TYPE: '不支持的文件类型',
} as const

// 成功消息
export const SUCCESS_MESSAGES = {
  ARTWORK_UPLOADED: '作品上传成功！',
  ARTWORK_LIKED: '点赞成功！',
  ARTWORK_FAVORITED: '收藏成功！',
  COMMENT_POSTED: '评论发布成功！',
  PROFILE_UPDATED: '个人资料更新成功！',
  SETTINGS_SAVED: '设置保存成功！',
} as const
