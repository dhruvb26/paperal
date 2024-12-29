"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettingsStore } from "@/stores/settings-store";

export function AiSettings() {
  const { showAiSuggestions, toggleAiSuggestions } = useSettingsStore();

  return (
    <div className="space-y-6 max-w-lg min-h-screen z-0">
      <div className="flex flex-row items-center justify-between p-4">
        <div className="">
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
    </div>
  );
}
