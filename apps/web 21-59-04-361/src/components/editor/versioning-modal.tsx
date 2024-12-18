import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { watchPreviewContent } from "@tiptap-pro/extension-collaboration-history";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TiptapCollabProvider } from "@hocuspocus/provider";
import { THistoryVersion } from "@hocuspocus/provider";

import { VersionItem } from "./version-item";

interface VersioningModalProps {
  versions: any[];
  isOpen: boolean;
  onClose: () => void;
  onRevert: (version: any, versionData: any) => void;
  currentVersion: number | null;
  latestVersion: number | null;
  provider: TiptapCollabProvider;
}
const getVersionName = (version: THistoryVersion): string => {
  if (version.name) {
    return version.name;
  }

  if (version.version === 0) {
    return "Initial version";
  }

  return `Version ${version.version}`;
};

export const VersioningModal = memo(
  ({ versions, isOpen, onClose, onRevert, provider }: VersioningModalProps) => {
    const [currentVersionId, setCurrentVersionId] = useState<number | null>(
      null
    );
    const isCurrentVersion =
      versions && versions.length > 0
        ? currentVersionId === versions.at(-1)?.version
        : false;

    const editor = useEditor({
      editable: false,
      content: "",
      extensions: [StarterKit],
    });

    const reversedVersions = useMemo(
      () => versions.slice().reverse(),
      [versions]
    );

    const handleVersionChange = useCallback(
      (newVersion: number) => {
        setCurrentVersionId(newVersion);

        provider.sendStateless(
          JSON.stringify({
            action: "version.preview",
            version: newVersion,
          })
        );
      },
      [provider]
    );

    const versionData = useMemo(() => {
      if (!versions.length) {
        return null;
      }

      return versions.find((v) => v.version === currentVersionId) || null;
    }, [currentVersionId, versions]);

    useEffect(() => {
      if (isOpen && currentVersionId === null && versions.length > 0) {
        const initialVersion = versions.at(-1)?.version;

        if (initialVersion !== undefined) {
          setCurrentVersionId(initialVersion);

          provider.sendStateless(
            JSON.stringify({
              action: "version.preview",
              version: initialVersion,
            })
          );
        }
      }
    }, [currentVersionId, versions, isOpen, provider]);

    useEffect(() => {
      if (isOpen) {
        const unbindContentWatcher = watchPreviewContent(
          provider,
          (content) => {
            if (editor) {
              editor.commands.setContent(content);
            }
          }
        );

        return () => {
          unbindContentWatcher();
        };
      }
    }, [isOpen, provider, editor]);

    const handleClose = useCallback(() => {
      onClose();
      setCurrentVersionId(null);
      editor?.commands.clearContent();
    }, [onClose, editor]);

    const handleRevert = useCallback(() => {
      const accepted = confirm(
        "Are you sure you want to revert to this version? Any changes not versioned will be lost."
      );

      if (accepted && currentVersionId !== null) {
        onRevert(currentVersionId, versionData);
        onClose();
      }
    }, [onRevert, currentVersionId, versionData, onClose]);

    if (!isOpen) {
      return null;
    }

    return (
      <Dialog open={isOpen} onOpenChange={() => handleClose()}>
        <DialogContent className="flex gap-4 max-w-4xl">
          <div className="flex-1">
            <EditorContent editor={editor} />
          </div>
          <div className="w-72 flex flex-col gap-4">
            <h3 className="font-semibold">
              History ({reversedVersions.length} versions)
            </h3>
            <ScrollArea className="flex-1">
              <div className="flex flex-col gap-1">
                {reversedVersions.map((v) => (
                  <VersionItem
                    date={v.date}
                    title={getVersionName(v)}
                    onClick={() => handleVersionChange(v.version)}
                    isActive={currentVersionId === v.version}
                    key={`version_item_${v.version}`}
                  />
                ))}
              </div>
            </ScrollArea>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button
                disabled={!versionData || isCurrentVersion}
                onClick={handleRevert}
              >
                Restore
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

VersioningModal.displayName = "VersioningModal";
