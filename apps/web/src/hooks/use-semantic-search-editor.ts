import { EditorEvents } from "@tiptap/core";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export const useSemanticSearchEditor = ({
  onCreate,
  onUpdate,
}: {
  onCreate?: (props: EditorEvents["create"]) => void;
  onUpdate?: (props: EditorEvents["update"]) => void;
}) => {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: `
      <h3>
        How to integrate OpenAI in your Tiptap Editor
      </h3>
      <p></p>
      <ol>
        <li>Create a Tiptap Cloud account and choose a plan that fit’s your needs.</li>
        <li>You also need to create an account on OpenAI and get your API key.</li>
        <li>…</li>
      </ol>

    `,
    onCreate: (props) => onCreate && onCreate(props),
    onUpdate: (props) => onUpdate && onUpdate(props),
  });

  return { editor };
};
