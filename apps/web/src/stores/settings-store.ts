import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  showAiSuggestions: boolean
  toggleAiSuggestions: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      showAiSuggestions: true,
      toggleAiSuggestions: () =>
        set((state) => ({ showAiSuggestions: !state.showAiSuggestions })),
    }),
    {
      name: 'user-settings',
    }
  )
)
