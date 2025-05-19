import { useSidebarStore } from '@/stores/sidebar-store'
import { Button } from './ui/button'

export default function SelectedLinkPreview() {
  const selectedLink = useSidebarStore((state) => state.selectedLink)
  const setSelectedLink = useSidebarStore((state) => state.setSelectedLink)

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        className="absolute right-3 -top-1 h-4 w-4 rounded-full p-0 shadow-sm flex items-center justify-center"
        onClick={() => setSelectedLink(null)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-3 w-3"
        >
          <path
            d="M18 6L6 18M6 6l12 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </Button>
      <div className="flex flex-col gap-2 text-xs text-clip border text-start rounded-md p-2 mx-4">
        <p className="whitespace-nowrap overflow-hidden text-ellipsis">
          {selectedLink?.sentence}
        </p>
      </div>
    </div>
  )
}
