"use client";
import SlashCommand from "@/extensions/slash-command/slash-command";
import "./styles.scss";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, { useCallback, useEffect, useState } from "react";
import DragHandle from "@tiptap-pro/extension-drag-handle-react";
import Placeholder from "@tiptap/extension-placeholder";
import { AiAutocompleteExtension } from "@/extensions/ai-autocomplete/ai-autocomplete";
import Highlight from "@tiptap/extension-highlight";
import { FloatingMenuBar } from "./floating-menu-bar";
import { Plus, Gear, Clock } from "@phosphor-icons/react";
import { TiptapCollabProvider } from "@hocuspocus/provider";
import CollaborationHistory from "@tiptap-pro/extension-collaboration-history";
import * as Y from "yjs";
import { renderDate } from "@/utils/render-date";
import { VersioningModal } from "./versioning-modal";
import { Collaboration } from "@tiptap/extension-collaboration";
import { VersioningSidebar } from "./versioning-sidebar";
import { Button } from "../ui/button";

const doc = new Y.Doc();
const date = new Date();

const provider = new TiptapCollabProvider({
  appId: "y9dr6egm",
  name: `room-collab-history-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
  document: doc,
  user: "some name",
  token:
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3MzQ2MjU0NjIsIm5iZiI6MTczNDYyNTQ2MiwiZXhwIjoxNzM0NzExODYyLCJpc3MiOiJodHRwczovL2Nsb3VkLnRpcHRhcC5kZXYiLCJhdWQiOiJ5OWRyNmVnbSJ9.8eicXQcgjOoNtOYUrqvdfdoAFk8CwLRZHWs3-E_DoU8",
});

// Set to 30 seconds
const ydoc = provider.configuration.document;
ydoc.getMap<number>("__tiptapcollab__config").set("intervalSeconds", 30);

export default () => {
  const [latestVersion, setLatestVersion] = useState<number | null>(null);
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);
  const [isAutoVersioning, setIsAutoVersioning] = useState<boolean>(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [versioningModalOpen, setVersioningModalOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [commitDescription, setCommitDescription] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // history: false,
      }),
      Collaboration.configure({
        document: doc,
      }),
      CollaborationHistory.configure({
        provider,
        onUpdate: (data) => {
          setVersions(data.versions);
          setIsAutoVersioning(data.versioningEnabled);
          setLatestVersion(data.version);
          setCurrentVersion(data.currentVersion);
        },
      }),
      SlashCommand,
      AiAutocompleteExtension,
      Highlight,
      Placeholder.configure({
        placeholder: ({ node }) => {
          return "Press '/' for commands";
        },
      }),
      Underline,
    ],
    content: `
    <p>
      Welcome to feather.ai!
      
    </p>
    `,
  });

  useEffect(() => {
    doc.on("update", () => {
      setHasChanges(true);
    });

    provider.on("synced", () => {
      // Handle synced event if needed
    });

    return () => {
      provider.off("synced");
      // doc.off("update");
    };
  }, [doc]);

  const showVersioningModal = useCallback(() => {
    setVersioningModalOpen(true);
  }, []);

  const handleCommitDescriptionChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCommitDescription(event.target.value);
  };

  const handleNewVersion = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (!commitDescription) return;
      editor?.commands.saveVersion(commitDescription);
      setCommitDescription("");
      alert(`Version ${commitDescription} created!`);
      setHasChanges(false);
    },
    [editor, commitDescription]
  );

  const handleVersioningClose = useCallback(() => {
    setVersioningModalOpen(false);
  }, []);

  const handleRevert = useCallback(
    (version: any, versionData: any) => {
      const versionTitle = versionData
        ? versionData.name || renderDate(versionData.date)
        : version;

      editor?.commands.revertToVersion(
        version,
        `Revert to ${versionTitle}`,
        `Unsaved changes before revert to ${versionTitle}`
      );
    },
    [editor]
  );

  const handlePlusClick = () => {
    if (editor) {
      // Move cursor to end of document
      editor.commands.selectParentNode();
      editor.commands.setTextSelection(editor.state.doc.content.size);

      // Create a new paragraph
      editor.chain().insertContent("<p>/</p>").focus().run();
    }
  };

  if (!editor) return null;

  return (
    <>
      {editor && <FloatingMenuBar editor={editor} />}
      <div className="flex items-center">
        <DragHandle editor={editor}>
          <button
            onClick={handlePlusClick}
            className="p-1.5 text-base hover:bg-muted rounded-sm mr-[3.25rem] text-black/50 z-10 relative"
          >
            <Plus weight="bold" size={12} />
          </button>
        </DragHandle>
      </div>
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={showVersioningModal}
          className="mr-10"
        >
          <Clock size={20} />
        </Button>
        <VersioningSidebar
          isAutoVersioning={isAutoVersioning}
          hasChanges={hasChanges}
          commitDescription={commitDescription}
          editor={editor}
          onCommitDescriptionChange={handleCommitDescriptionChange}
          onNewVersion={handleNewVersion}
          showVersioningModal={showVersioningModal}
        />
      </div>
      <VersioningModal
        versions={versions}
        isOpen={versioningModalOpen}
        onClose={handleVersioningClose}
        onRevert={handleRevert}
        currentVersion={currentVersion}
        latestVersion={latestVersion}
        provider={provider}
      />
      <EditorContent editor={editor} className="text-sm py-36 px-12" />
    </>
  );
};
