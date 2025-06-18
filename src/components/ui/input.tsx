import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'search'
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = 'default', type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // 基础样式
          'flex w-full rounded-lg border border-gray-300 bg-white px-4 py-2',
          'text-base text-black placeholder:text-gray-500',
          'transition-colors duration-200',
          'focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',

          // 变体样式
          {
            'hover:border-gray-400': variant === 'default',
            'rounded-xl px-6 py-3 text-lg': variant === 'search',
          },

          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
