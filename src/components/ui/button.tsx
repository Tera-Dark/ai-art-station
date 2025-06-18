import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'text'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        className={cn(
          // 基础样式
          'inline-flex items-center justify-center font-medium transition-all duration-200 ease-in-out',
          'focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-none',
          'disabled:pointer-events-none disabled:opacity-50',

          // 尺寸样式
          {
            'rounded-md px-3 py-1.5 text-sm': size === 'sm',
            'rounded-lg px-4 py-2 text-base': size === 'md',
            'rounded-lg px-6 py-3 text-lg': size === 'lg',
          },

          // 变体样式
          {
            // 主要按钮：黑底白字
            'bg-black text-white hover:opacity-80 active:opacity-90': variant === 'primary',

            // 次要按钮：白底黑边
            'border border-gray-300 bg-white text-black hover:bg-gray-50 active:bg-gray-100':
              variant === 'secondary',

            // 幽灵按钮：透明背景
            'bg-transparent text-black hover:bg-gray-100 active:bg-gray-200': variant === 'ghost',

            // 文字按钮：无背景
            'bg-transparent text-black hover:opacity-70 active:opacity-80': variant === 'text',
          },

          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }
