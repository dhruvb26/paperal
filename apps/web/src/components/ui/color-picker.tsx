'use client'

import { forwardRef, useMemo, useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import { cn } from '@/lib/utils'
import { useForwardedRef } from '@/lib/use-forwarded-ref'
import type { ButtonProps } from '@/components/ui/button'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'

interface ColorPickerProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
}

const ColorPicker = forwardRef<
  HTMLInputElement,
  Omit<ButtonProps, 'value' | 'onChange' | 'onBlur'> & ColorPickerProps
>(
  (
    { disabled, value, onChange, onBlur, name, className, ...props },
    forwardedRef
  ) => {
    const ref = useForwardedRef(forwardedRef)
    const [open, setOpen] = useState(false)

    const parsedValue = useMemo(() => {
      return value || '#FFFFFF'
    }, [value])

    return (
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger
          className="w-full"
          asChild
          disabled={disabled}
          onBlur={onBlur}
        >
          <Button
            {...props}
            className={cn(
              'w-full flex items-center text-center px-4',
              className
            )}
            name={name}
            onClick={() => {
              setOpen(true)
            }}
            variant="outline"
          >
            <div
              className="w-4 h-4 rounded-full border border-input"
              style={{
                backgroundColor: parsedValue,
              }}
            />
            <span className="text-xs font-normal flex-1 uppercase">
              {parsedValue}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full custom-pointers">
          <HexColorPicker color={parsedValue} onChange={onChange} />
          <Input
            className="mt-4 uppercase text-center"
            maxLength={7}
            onChange={(e) => {
              onChange(e?.currentTarget?.value)
            }}
            ref={ref}
            value={parsedValue}
          />
        </PopoverContent>
      </Popover>
    )
  }
)
ColorPicker.displayName = 'ColorPicker'

export { ColorPicker }
