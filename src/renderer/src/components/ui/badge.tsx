import * as React from 'react'
import { cn } from '@renderer/lib/utils'

const Badge = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'secondary' | 'destructive' | 'outline' }
>(({ className, variant = 'default', ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors',
        variant === 'default' && 'bg-primary/20 text-primary',
        variant === 'secondary' && 'bg-secondary text-secondary-foreground',
        variant === 'destructive' && 'bg-destructive/20 text-red-400',
        variant === 'outline' && 'border border-border text-foreground',
        className
      )}
      {...props}
    />
  )
})
Badge.displayName = 'Badge'

export { Badge }
