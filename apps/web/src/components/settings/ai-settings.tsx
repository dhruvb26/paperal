'use client'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useSettingsStore } from '@/stores/settings-store'
import { ModeToggle } from '../mode-toggle'
import { Button } from '../ui/button'
import { useLoadingToast } from '@/hooks/use-loading-toast'

export function AiSettings() {
  const { showAiSuggestions, toggleAiSuggestions } = useSettingsStore()
  const { startLoadingToast } = useLoadingToast()
  return (
    <div className="max-w-lg z-0">
      <div className="flex flex-row items-center justify-between p-6">
        <div>
          <Label className="text-sm">AI Suggestions</Label>
          <div className="text-xs text-muted-foreground">
            Enable or disable AI-powered writing suggestions
          </div>
        </div>
        <Switch
          checked={showAiSuggestions}
          onCheckedChange={toggleAiSuggestions}
        />
      </div>
      {/* <div className="flex flex-row items-center justify-between p-4">
        <div>
          <Label className="text-sm">Theme</Label>
          <div className="text-xs text-muted-foreground">
            Change the theme of the app
          </div>
        </div>
        <ModeToggle />
      </div>
      <div className="flex flex-row items-center justify-between p-4">
        <Button
          variant="outline"
          onClick={() => startLoadingToast({ id: "test", message: "test" })}
        >
          Toast
        </Button>
      </div> */}
    </div>
  )
}
