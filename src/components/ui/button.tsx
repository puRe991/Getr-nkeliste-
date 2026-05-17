import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-glow hover:bg-red-500',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-slate-700',
        ghost: 'hover:bg-secondary text-muted-foreground hover:text-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-red-600',
        outline: 'border border-border bg-transparent hover:bg-secondary',
      },
      size: { default: 'h-12 px-4 py-3', sm: 'h-10 px-3', lg: 'h-14 px-6 text-base', icon: 'h-12 w-12' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
