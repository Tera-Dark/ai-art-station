// AI Art Station - 简化部署检查脚本
/* eslint-disable no-console */

const fs = require('fs')

console.log('🔍 AI Art Station - 部署前检查\n')

let hasErrors = false

// 检查必需文件
const requiredFiles = ['package.json', 'next.config.ts', 'env.example', 'README.md']

console.log('📋 检查必需文件...')
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`)
  } else {
    console.error(`❌ 缺少文件: ${file}`)
    hasErrors = true
  }
})

// 检查 package.json
console.log('\n📦 检查 package.json 配置...')
if (fs.existsSync('package.json')) {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

  const requiredScripts = ['build', 'start', 'lint']
  requiredScripts.forEach(script => {
    if (pkg.scripts?.[script]) {
      console.log(`✅ 脚本: ${script}`)
    } else {
      console.error(`❌ 缺少脚本: ${script}`)
      hasErrors = true
    }
  })
}

// 检查 Next.js 配置
console.log('\n⚙️ 检查 Next.js 配置...')
if (fs.existsSync('next.config.ts')) {
  console.log('✅ Next.js 配置文件存在')
} else {
  console.warn('⚠️ Next.js 配置文件不存在')
}

// 检查数据库文件
console.log('\n🗄️ 检查数据库配置...')
if (fs.existsSync('database/')) {
  const files = fs.readdirSync('database/')
  console.log(`✅ 数据库目录存在 (${files.length} 个文件)`)
} else {
  console.warn('⚠️ 数据库目录不存在')
}

// 显示结果
console.log('\n' + '='.repeat(50))
if (hasErrors) {
  console.error('❌ 发现错误，请修复后再部署')
  process.exit(1)
} else {
  console.log('🎉 基础检查通过！')
  console.log('\n🚀 部署步骤:')
  console.log('1. 确保环境变量已配置 (参考 vercel-env.example)')
  console.log('2. 运行: npm run build (本地测试)')
  console.log('3. 运行: vercel --prod (部署)')
  console.log('\n📖 详细指南: VERCEL_DEPLOYMENT.md')
}
