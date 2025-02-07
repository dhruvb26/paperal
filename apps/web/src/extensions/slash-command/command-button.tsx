import { forwardRef } from 'react'
import { Command } from 'lucide-react'
import { cn } from '@/lib/utils'

export type CommandButtonProps = {
  active?: boolean
  description: string
  onClick: () => void
  onMouseEnter: () => void
  children: React.ReactNode
  isActive: boolean
  title: string
  icon: React.ReactNode
}

export const CommandButton = forwardRef<HTMLButtonElement, CommandButtonProps>(
  (
    {
      active,
      icon,
      onClick,
      onMouseEnter,
      children,
      description,
      title,
      isActive,
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        className={cn(
          'relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full',
          isActive && 'bg-accent'
        )}
      >
        <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-background text-foreground border">
          {icon}
        </div>
        <div className="flex flex-col items-start justify-start w-full">
          <span className="font-medium text-sm">{title}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {description}
          </span>
        </div>
      </button>
    )
  }
)

CommandButton.displayName = 'CommandButton'
