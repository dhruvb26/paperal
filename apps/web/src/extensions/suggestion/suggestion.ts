import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import { Editor } from "@tiptap/core";

import { MentionList } from "./mention-list";

interface SuggestionProps {
  query: string;
  editor: Editor;
  clientRect: (() => DOMRect) | null;
  event?: KeyboardEvent;
}

export default {
  items: async () => {
    try {
      const response = await fetch("/api/library/documents");
      const documents: LibraryDocument[] = await response.json();
      return documents;
    } catch (error) {
      console.error("Error fetching library documents:", error);
      return [];
    }
  },

  render: () => {
    let reactRenderer: ReactRenderer | null = null;
    let popup: ReturnType<typeof tippy> | null = null;

    return {
      onStart: (props: SuggestionProps) => {
        if (!props.clientRect) {
          return;
        }

        reactRenderer = new ReactRenderer(MentionList, {
          props: {
            ...props,
            command: ({
              id,
              href,
              citations,
            }: {
              id: string;
              href: string;
              citations?: {
                "in-text"?: string;
                "after-text"?: string;
              };
            }) => {
              const citation = citations?.["in-text"];
              props.editor
                .chain()
                .focus()
                .command(({ tr }) => {
                  const start =
                    tr.selection.$from.pos - (props.query.length + 1);
                  const end = tr.selection.$from.pos;
                  tr.delete(start, end);
                  return true;
                })
                .insertContent([
                  {
                    type: "text",
                    text: "  ", // Add two spaces before
                  },
                  {
                    type: "text",
                    marks: [
                      {
                        type: "link",
                        attrs: { href },
                      },
                    ],
                    text: citation,
                  },
                  {
                    type: "text",
                    text: "  ", // Add two spaces after
                  },
                ])
                .run();

              if (popup?.[0]) {
                popup[0].hide();
              }
            },
          },
          editor: props.editor,
        });

        popup = tippy("body", {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: reactRenderer.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
          theme: "custom",
          arrow: false,
          offset: [0, 10],
          maxWidth: 500,
          animation: "shift-away",
          popperOptions: {
            strategy: "fixed",
            modifiers: [
              {
                name: "preventOverflow",
                options: {
                  padding: 8,
                },
              },
            ],
          },
        });
      },

      onUpdate(props: SuggestionProps) {
        if (!reactRenderer || !popup) return;

        reactRenderer.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown(props: SuggestionProps) {
        if (!popup || !reactRenderer) return false;

        if (props.event?.key === "Escape") {
          popup[0].hide();
          return true;
        }

        return (
          (
            reactRenderer.ref as {
              onKeyDown: (props: SuggestionProps) => boolean;
            }
          )?.onKeyDown(props) || false
        );
      },

      onExit() {
        if (popup) {
          popup[0].destroy();
        }
        if (reactRenderer) {
          reactRenderer.destroy();
        }
      },
    };
  },
};
