import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Command, MenuListProps } from './types'
import { CommandButton } from './command-button'

export const MenuList = React.forwardRef((props: MenuListProps, ref) => {
  const scrollContainer = useRef<HTMLDivElement>(null)
  const activeItem = useRef<HTMLButtonElement>(null)
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0)
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0)

  // Anytime the groups change, i.e. the user types to narrow it down, we want to
  // reset the current selection to the first menu item
  useEffect(() => {
    setSelectedGroupIndex(0)
    setSelectedCommandIndex(0)
  }, [props.items])

  const selectItem = useCallback(
    (groupIndex: number, commandIndex: number) => {
      const command = props.items[groupIndex].commands[commandIndex]
      props.command(command)
    },
    [props]
  )

  const handleMouseEnter = useCallback(
    (groupIndex: number, commandIndex: number) => {
      setSelectedGroupIndex(groupIndex)
      setSelectedCommandIndex(commandIndex)
    },
    []
  )

  React.useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: React.KeyboardEvent }) => {
      if (event.key === 'ArrowDown') {
        if (!props.items.length) {
          return false
        }

        const commands = props.items[selectedGroupIndex].commands

        let newCommandIndex = selectedCommandIndex + 1
        let newGroupIndex = selectedGroupIndex

        if (commands.length - 1 < newCommandIndex) {
          newCommandIndex = 0
          newGroupIndex = selectedGroupIndex + 1
        }

        if (props.items.length - 1 < newGroupIndex) {
          newGroupIndex = 0
        }

        setSelectedCommandIndex(newCommandIndex)
        setSelectedGroupIndex(newGroupIndex)

        return true
      }

      if (event.key === 'ArrowUp') {
        if (!props.items.length) {
          return false
        }

        let newCommandIndex = selectedCommandIndex - 1
        let newGroupIndex = selectedGroupIndex

        if (newCommandIndex < 0) {
          newGroupIndex = selectedGroupIndex - 1
          newCommandIndex = props.items[newGroupIndex]?.commands.length - 1 || 0
        }

        if (newGroupIndex < 0) {
          newGroupIndex = props.items.length - 1
          newCommandIndex = props.items[newGroupIndex].commands.length - 1
        }

        setSelectedCommandIndex(newCommandIndex)
        setSelectedGroupIndex(newGroupIndex)

        return true
      }

      if (event.key === 'Enter') {
        if (
          !props.items.length ||
          selectedGroupIndex === -1 ||
          selectedCommandIndex === -1
        ) {
          return false
        }

        selectItem(selectedGroupIndex, selectedCommandIndex)

        return true
      }

      return false
    },
  }))

  useEffect(() => {
    if (activeItem.current && scrollContainer.current) {
      const offsetTop = activeItem.current.offsetTop
      const offsetHeight = activeItem.current.offsetHeight

      scrollContainer.current.scrollTop = offsetTop - offsetHeight
    }
  }, [selectedCommandIndex, selectedGroupIndex])

  const createCommandClickHandler = useCallback(
    (groupIndex: number, commandIndex: number) => {
      return () => {
        selectItem(groupIndex, commandIndex)
      }
    },
    [selectItem]
  )

  if (!props.items.length) {
    return null
  }

  return (
    <div
      ref={scrollContainer}
      className="z-50 min-w-[12rem] overflow-auto max-h-[min(80vh,24rem)] rounded-md border bg-popover p-1 text-popover-foreground shadow-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
    >
      <div className="grid grid-cols-1 gap-0.5">
        {props.items.map((group, groupIndex: number) => (
          <div key={group.title}>
            {group.commands.map((command: Command, commandIndex: number) => (
              <CommandButton
                key={command.label}
                icon={command.icon}
                ref={
                  selectedGroupIndex === groupIndex &&
                  selectedCommandIndex === commandIndex
                    ? activeItem
                    : null
                }
                isActive={
                  selectedGroupIndex === groupIndex &&
                  selectedCommandIndex === commandIndex
                }
                onClick={createCommandClickHandler(groupIndex, commandIndex)}
                onMouseEnter={() => handleMouseEnter(groupIndex, commandIndex)}
                title={command.label}
                description={command.description}
              >
                {command.label}
              </CommandButton>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
})

MenuList.displayName = 'MenuList'

export default MenuList
