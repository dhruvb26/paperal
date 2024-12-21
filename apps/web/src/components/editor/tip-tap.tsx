"use client";
import SlashCommand from "@/extensions/slash-command/slash-command";
import "./styles.scss";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, { useCallback, useState } from "react";
import DragHandle from "@tiptap-pro/extension-drag-handle-react";
import Placeholder from "@tiptap/extension-placeholder";
import { AiAutocompleteExtension } from "@/extensions/ai-autocomplete/ai-autocomplete";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import { Mention } from "@tiptap/extension-mention";
import { FloatingMenuBar } from "./floating-menu-bar";
import { Plus, Clock } from "@phosphor-icons/react";
import { TiptapCollabProvider } from "@hocuspocus/provider";
import CollaborationHistory from "@tiptap-pro/extension-collaboration-history";
import * as Y from "yjs";
import { renderDate } from "@/utils/render-date";
import { VersioningModal } from "./versioning-modal";
import { Collaboration } from "@tiptap/extension-collaboration";
import { VersioningSidebar } from "./versioning-sidebar";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";
import suggestion from "@/extensions/suggestion/suggestion";
import { saveDocument } from "@/app/editor/actions";

interface TiptapProps {
  documentId: string;
}

export default ({ documentId }: TiptapProps) => {
  const { user } = useUser();
  const { toast } = useToast();
  const [latestVersion, setLatestVersion] = useState<number | null>(null);
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);
  const [isAutoVersioning, setIsAutoVersioning] = useState<boolean>(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [versioningModalOpen, setVersioningModalOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [commitDescription, setCommitDescription] = useState("");

  const [provider] = useState(() => {
    const doc = new Y.Doc();
    return new TiptapCollabProvider({
      appId: "y9dr6egm",
      name: `document-${documentId}`,
      document: doc,
      user: user?.fullName || user?.username || "anonymous",
      token:
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3MzQ3NDY0MTksIm5iZiI6MTczNDc0NjQxOSwiZXhwIjoxNzM0ODMyODE5LCJpc3MiOiJodHRwczovL2Nsb3VkLnRpcHRhcC5kZXYiLCJhdWQiOiJ5OWRyNmVnbSJ9.6gV5UtuX4j8LJ1UDStn_Mxz6DT0lvbS-gc9ZOqfWf6Y",
    });
  });

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      Collaboration.configure({
        document: provider.configuration.document,
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
      Mention.configure({
        HTMLAttributes: {
          class: "mention",
        },
        suggestion: suggestion as any,
      }),
      SlashCommand,
      // AiAutocompleteExtension,
      Highlight,
      Placeholder.configure({
        placeholder: ({ node }) => {
          return "Enter a heading or press '/' for commands";
        },
      }),
      Underline,
      Link.configure({
        openOnClick: true,
        autolink: true,
        defaultProtocol: "https",
        protocols: ["http", "https"],
        isAllowedUri: (url, ctx) => {
          try {
            const parsedUrl = url.includes(":")
              ? new URL(url)
              : new URL(`${ctx.defaultProtocol}://${url}`);

            if (!ctx.defaultValidate(parsedUrl.href)) {
              return false;
            }

            const disallowedProtocols = ["ftp", "file", "mailto"];
            const protocol = parsedUrl.protocol.replace(":", "");

            if (disallowedProtocols.includes(protocol)) {
              return false;
            }

            const allowedProtocols = ctx.protocols.map((p) =>
              typeof p === "string" ? p : p.scheme
            );
            if (!allowedProtocols.includes(protocol)) {
              return false;
            }

            const disallowedDomains = [
              "example-phishing.com",
              "malicious-site.net",
            ];
            if (disallowedDomains.includes(parsedUrl.hostname)) {
              return false;
            }

            return true;
          } catch (error) {
            return false;
          }
        },
        shouldAutoLink: (url) => {
          try {
            const parsedUrl = url.includes(":")
              ? new URL(url)
              : new URL(`https://${url}`);
            const disallowedDomains = [
              "example-no-autolink.com",
              "another-no-autolink.com",
            ];
            return !disallowedDomains.includes(parsedUrl.hostname);
          } catch (error) {
            return false;
          }
        },
      }),
    ],
    onUpdate: ({ editor }) => {
      setHasChanges(true);
    },
  });

  const showVersioningModal = useCallback(() => {
    setVersioningModalOpen(true);
  }, []);

  const handleCommitDescriptionChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCommitDescription(event.target.value);
  };

  const handleNewVersion = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (!commitDescription) return;
      editor?.commands.saveVersion(commitDescription);
      setCommitDescription("");
      toast({
        title: "Document saved",
        description: `Version ${commitDescription} created`,
      });
      setHasChanges(false);
      if (editor) {
        await saveDocument(
          documentId,
          JSON.parse(JSON.stringify(editor.getJSON()))
        );
      }
    },
    [editor, commitDescription]
  );

  const handleVersioningClose = useCallback(() => {
    setVersioningModalOpen(false);
  }, []);

  const handleRevert = useCallback(
    async (version: any, versionData: any) => {
      const versionTitle = versionData
        ? versionData.name || renderDate(versionData.date)
        : version;

      editor?.commands.revertToVersion(
        version,
        `Revert to ${versionTitle}`,
        `Unsaved changes before revert to ${versionTitle}`
      );

      // Save the document after reverting
      if (editor) {
        await saveDocument(
          documentId,
          JSON.parse(JSON.stringify(editor.getJSON()))
        );
      }
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
      <div className="fixed top-4 right-4 flex items-center justify-end gap-4 w-[300px]">
        <Button
          onClick={async () => {
            try {
              await saveDocument(
                documentId,
                JSON.parse(JSON.stringify(editor.getJSON()))
              );
              setHasChanges(false);
              toast({
                title: "Changes saved",
                description: "Your document has been saved successfully",
              });
            } catch (error) {
              console.error("Save error:", error);
              toast({
                title: "Error saving document",
                description: "Your changes could not be saved",
                variant: "destructive",
              });
            }
          }}
          disabled={!hasChanges}
        >
          Save
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={showVersioningModal}
          className="mr-10"
        >
          <Clock weight="fill" className="text-muted-foreground" size={20} />
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
