import React from "react";
import { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 right-4 z-50"
        >
          <Gear className="text-muted-foreground" weight="fill" size={20} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Versioning</DialogTitle>
          <DialogDescription>
            Make adjustments to the document to manually save a new version.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            disabled={!hasChanges}
            placeholder="Name"
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
      </DialogContent>
    </Dialog>
  );
};
