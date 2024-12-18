import React from "react";
import { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Gear } from "@phosphor-icons/react";

interface VersioningSidebarProps {
  isAutoVersioning: boolean;
  hasChanges: boolean;
  commitDescription: string;
  editor: Editor | null;
  onCommitDescriptionChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
  onNewVersion: (e: React.MouseEvent<HTMLButtonElement>) => void;
  showVersioningModal: () => void;
}

export const VersioningSidebar: React.FC<VersioningSidebarProps> = ({
  isAutoVersioning,
  hasChanges,
  commitDescription,
  editor,
  onCommitDescriptionChange,
  onNewVersion,
  showVersioningModal,
}) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 right-4 z-50"
        >
          <Gear size={20} />
        </Button>
      </SheetTrigger>
      <SheetContent overlay={false}>
        <SheetHeader>
          <SheetTitle>Document Settings</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 pt-6">
          <div className="space-y-2">
            <h3 className="font-medium">Auto versioning</h3>
            <RadioGroup
              defaultValue={isAutoVersioning ? "enable" : "disable"}
              onValueChange={(value) => {
                if (value === "enable" && !isAutoVersioning) {
                  editor?.commands.toggleVersioning();
                } else if (value === "disable" && isAutoVersioning) {
                  editor?.commands.toggleVersioning();
                }
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="enable" id="enable" />
                <Label htmlFor="enable">Enable</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="disable" id="disable" />
                <Label htmlFor="disable">Disable</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Manual versioning</h3>
              <p className="text-sm text-muted-foreground">
                Make adjustments to the document to manually save a new version.
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                disabled={!hasChanges}
                placeholder="Version name"
                value={commitDescription}
                onChange={onCommitDescriptionChange}
              />
              <Button
                disabled={!hasChanges || commitDescription.length === 0}
                onClick={onNewVersion}
              >
                Create
              </Button>
            </div>
          </div>

          <Separator />
        </div>
      </SheetContent>
    </Sheet>
  );
};
