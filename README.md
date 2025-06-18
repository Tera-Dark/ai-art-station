# AI Art Station

一个极简风格的AI艺术作品展示平台，采用黑白灰设计理念，专注于内容展示。

## 🎨 设计特色

- **极简美学**: 黑白灰配色方案，去除一切不必要的装饰
- **响应式设计**: 适配桌面端、平板和移动设备
- **瀑布流布局**: 类似Pinterest的瀑布流展示方式
- **优雅交互**: 简洁的悬浮效果和平滑过渡动画

## 🛠️ 技术栈

- **前端**: Next.js 14 + TypeScript + Tailwind CSS
- **UI组件**: 自定义组件库（黑白灰主题）
- **图标**: Lucide React
- **数据库**: Supabase (PostgreSQL)
- **图片存储**: Supabase Storage + ImgBB/本地URL (多级备选方案)
- **部署**: Vercel

## 📦 功能特性

### 已实现

- ✅ 响应式导航栏
- ✅ 搜索功能
- ✅ 标签筛选
- ✅ 作品卡片展示
- ✅ 瀑布流布局
- ✅ 加载状态处理
- ✅ 空状态展示
- ✅ 首页（热门作品）
- ✅ 探索页（按模型分类）
- ✅ 大神页（热门创作者）
- ✅ 工具页（AI绘画工具链接）
- ✅ 我的作品页（管理个人作品）
- ✅ 作品上传功能
- ✅ 作品详情查看
- ✅ 评论系统
- ✅ 多级备选图片上传方案

### 计划中

- ⏳ 完善用户认证系统
- ⏳ 点赞收藏系统
- ⏳ 用户个人中心
- ⏳ 作品数据分析
- ⏳ 社区互动功能

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd ai-art-station
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp env.example .env.local
```

然后编辑 `.env.local` 文件，填入你的服务配置。详细设置请参考 [设置指南](SETUP_GUIDE.md)。

### 4. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## ⚙️ 设置指南

详细的设置说明，包括 Supabase 存储桶配置和环境变量设置，请查看 [设置指南](SETUP_GUIDE.md)。

### 图片上传故障排除

本项目实现了三级图片上传方案：

1. **Supabase Storage**: 首选方案，需要正确配置存储桶
2. **ImgBB API**: 备选方案，当Supabase上传失败时自动尝试
3. **本地URL**: 最终备选方案，仅用于演示目的（页面刷新后图片将丢失）

如果您遇到"Bucket not found"错误，请确保：

1. 在Supabase控制台中创建了名为"artworks"和"avatars"的存储桶
2. 存储桶设置为公开访问
3. 您的应用有足够的权限访问和创建存储桶
4. 环境变量中的Supabase URL和密钥正确配置

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── explore/           # 探索页面
│   ├── masters/           # 大神页面
│   ├── my-works/          # 我的作品页面
│   ├── tools/             # 工具页面
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── components/            # 组件库
│   ├── ui/               # 基础UI组件
│   │   ├── button.tsx    # 按钮组件
│   │   └── input.tsx     # 输入框组件
│   ├── artwork-card.tsx  # 作品卡片
│   ├── artwork-grid.tsx  # 作品网格
│   ├── image-gallery-modal.tsx  # 小红书风格图片浏览模态框
│   ├── comment-section.tsx # 评论区组件
│   ├── filter-tags.tsx   # 筛选标签
│   ├── header.tsx        # 导航栏
│   ├── upload-modal.tsx  # 上传模态框
│   └── user-menu.tsx     # 用户菜单
└── lib/                   # 工具库
    ├── image-service.ts  # 图片服务配置
    ├── config.ts         # 应用配置
    ├── mock-data.ts      # 模拟数据
    ├── supabase.ts       # Supabase配置
    └── utils.ts          # 工具函数
```

## 🎯 设计系统

### 色彩规范

```css
--primary-black: #000000 /* 主要文字 */ --primary-white: #ffffff /* 背景色 */
  --primary-gray: #808080 /* 次要文字 */ --light-gray: #f5f5f5 /* 分割线/背景 */
  --medium-gray: #cccccc /* 边框 */ --dark-gray: #333333 /* 重要文字 */;
```

### 间距系统

基于 8px 网格系统：`8px, 16px, 24px, 32px, 48px, 64px`

### 字体规范

- **中文**: 思源黑体 CN / 苹方 / 微软雅黑
- **英文**: Inter / Helvetica Neue / Arial
- **字重**: 300 (Light), 400 (Regular), 600 (SemiBold)

## 📱 响应式断点

- **移动端**: < 640px (1列)
- **平板端**: 640px - 1024px (2-3列)
- **桌面端**: > 1024px (4列)

## 🔧 开发指南

### 组件开发

- 使用 TypeScript 确保类型安全
- 遵循极简设计原则
- 保持组件的单一职责
- 使用 Tailwind CSS 进行样式设计

### 样式规范

- 优先使用 Tailwind CSS 类名
- 避免自定义 CSS（除非必要）
- 保持设计的一致性
- 注重可访问性

### Git 提交规范

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 样式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具相关
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

如有问题，请提交 Issue 或联系开发者。
