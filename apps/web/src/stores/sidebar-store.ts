import { create } from 'zustand'

interface LinkData {
  href: string
  title: string
  description?: string
  authors?: string[]
  year?: string
  sentence?: string
}

interface SidebarState {
  isRightSidebarOpen: boolean
  selectedLink: LinkData | null
  toggleRightSidebar: () => void
  setSelectedLink: (link: LinkData | null) => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isRightSidebarOpen: false,
  selectedLink: null,
  toggleRightSidebar: () =>
    set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen })),
  setSelectedLink: (link) => set({ selectedLink: link }),
}))
