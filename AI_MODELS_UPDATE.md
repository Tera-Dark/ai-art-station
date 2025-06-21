# AI模型预设更新 - 2025年版本

## 📋 更新概览

本次更新为AI Art Station项目添加了最新的2025年AI模型预设，大幅扩展了支持的AI生成工具范围，让用户能够使用最前沿的AI技术创作艺术作品。

## 🎨 新增AI模型

### Flux系列 (Black Forest Labs - 2024-2025新兴)

- Flux.1 Pro
- Flux.1 Dev
- Flux.1 Schnell
- Flux.1 Redux
- Flux.1 Fill
- Flux Realism

### NovelAI系列 (动漫特化)

- NovelAI Diffusion V3
- NovelAI Diffusion V2
- NAI Diffusion Anime V3
- NAI Diffusion Furry

### Lumina系列 (2024-2025新模型)

- Lumina Next T2I
- Lumina T2I
- Lumina Image 2

### Stable Diffusion扩展

- Stable Diffusion 3.5
- SDXL Turbo
- SD3 Medium

### 动漫/插画专用模型

- Noob SDXL
- Noob Epsilon
- Animagine XL 3.1
- Pony Diffusion XL

### 其他2025新模型

- Adobe Firefly 3
- Leonardo AI Phoenix
- Playground v2.5
- Ideogram v2
- Recraft V3
- Aurora (xAI)
- Kolors
- Hunyuan DiT

## ⚙️ 采样器更新

### 新增高级采样器

- DPM++ 2M SDE Karras
- DPM++ 3M SDE
- DPM++ 2S a Karras
- DPM++ SDE Karras
- UniPC
- PLMS
- DPM adaptive
- LCM
- DDIM CFG++
- DPM++ 2M SGM Uniform
- Restart
- Heun
- DDPM

## 🏠 首页模型分类更新

新增了以下模型分类：

- **NovelAI** - 动漫风格AI生成
- **Flux** - 新兴高质量模型

## 🔍 探索页面增强

### 新的模型分类

- NovelAI (📚)
- Flux (⚡)
- Lumina (✨)
- 其他模型 (🚀)

### 智能筛选

- 支持NovelAI/NAI关键词匹配
- "其他模型"自动识别未分类模型
- 更精准的模型匹配算法

## 🛠️ 工具页面扩展

### 新增AI工具

- **Flux.1** - Black Forest Labs的新兴模型
- **NovelAI** - 动漫风格专用工具
- **Lumina T2I** - 基于Flow的扩散变换器
- **Ideogram v2** - 新一代文本理解模型
- **Recraft V3** - 专业级AI设计工具
- **Sora** - OpenAI的视频生成模型
- **Automatic1111** - 经典SD Web界面

## 📝 技术实现

### 1. 上传模态框 (`upload-modal.tsx`)

- 扩展AI_MODELS数组至45+个模型
- 按系列分组组织（Midjourney、Flux、NovelAI等）
- 保持向下兼容性

### 2. 探索页面 (`explore/page.tsx`)

- 新增模型分类和图标
- 智能筛选逻辑
- "其他模型"自动计算

### 3. 首页 (`page.tsx`)

- 添加NovelAI和Flux分类
- 支持关键词匹配

### 4. 工具页面 (`tools/page.tsx`)

- 扩展到16个AI工具
- 更详细的工具描述
- 最新工具链接

## 🎯 用户体验提升

1. **更全面的模型选择** - 覆盖2025年主流AI模型
2. **智能分类** - 自动识别和归类不同模型
3. **向下兼容** - 老用户数据无缝迁移
4. **实时更新** - 支持最新AI技术趋势

## 🔄 兼容性说明

- 现有作品数据完全兼容
- 自定义模型功能保留
- 筛选逻辑向下兼容
- 数据库结构无需变更

## 📊 统计信息

- **AI模型总数**: 45+ (原7个)
- **采样器总数**: 19个 (原6个)
- **工具页面**: 16个工具 (原9个)
- **新增分类**: 4个模型分类

---

这次更新让AI Art Station成为了真正与2025年AI技术同步的平台，为用户提供最前沿的AI创作工具支持！🎨✨
