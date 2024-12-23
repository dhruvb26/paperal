import { Node } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { slashCommandPluginKey } from "../slash-command/slash-command";

function debounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timer: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve, reject) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          const output = callback(...args);
          resolve(output);
        } catch (err) {
          reject(err);
        }
      }, delay);
    });
  };
}

export const AiAutocompleteExtension = Node.create<
  {
    applySuggestionKey: string;
    suggestionDebounce: number;
  },
  {
    getSuggestion:
      | ((
          previousText: string,
          cb: (suggestion: string | null) => void
        ) => void)
      | undefined;
    suggestion: string | null;
  }
>({
  name: "ai-autocomplete",
  priority: 101,
  addOptions() {
    return {
      applySuggestionKey: "ArrowRight",
      suggestionDebounce: 1500,
      previousTextLength: 4000,
    };
  },
  addProseMirrorPlugins() {
    const pluginKey = new PluginKey<DecorationSet>("suggestion");

    const getSuggestion = debounce(
      async (previousText: string, cb: (suggestion: string | null) => void) => {
        const suggestion = await fetch("/api/suggest", {
          method: "POST",
          body: JSON.stringify({ previousText }),
        });
        const data = await suggestion.json();
        console.log(data);
        cb(data as string);
      },
      this.options.suggestionDebounce
    );

    return [
      new Plugin({
        key: pluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, oldValue) {
            if (tr.getMeta(pluginKey)) {
              // Update the decoration state based on the async data
              const { decorations } = tr.getMeta(pluginKey);
              return decorations;
            }
            return tr.docChanged ? oldValue.map(tr.mapping, tr.doc) : oldValue;
          },
        },
        view() {
          return {
            update(view, prevState) {
              if (view.state.doc.textContent.trim().length === 0) {
                return;
              }

              const selection = view.state.selection;
              const cursorPos = selection.$head.pos;
              const nextNode = view.state.doc.nodeAt(cursorPos);

              // If the cursor is not at the end of the block and we have a suggestion => hide the suggestion
              if (
                nextNode &&
                !nextNode.isBlock &&
                pluginKey.getState(view.state)?.find().length
              ) {
                const tr = view.state.tr;
                tr.setMeta("addToHistory", false);
                tr.setMeta(pluginKey, { decorations: DecorationSet.empty });
                view.dispatch(tr);
                return;
              }

              // If the document didn't change, do nothing
              if (prevState && prevState.doc.eq(view.state.doc)) {
                return;
              }

              // reset the suggestion before fetching a new one
              setTimeout(() => {
                const tr = view.state.tr;
                tr.setMeta("addToHistory", false);
                tr.setMeta(pluginKey, { decorations: DecorationSet.empty });
                view.dispatch(tr);
              }, 0);

              // fetch a new suggestion
              const previousText = view.state.doc
                .textBetween(0, view.state.doc.content.size, " ")
                .slice(-4000);
              getSuggestion(previousText, (suggestion) => {
                if (!suggestion) return;

                const updatedState = view.state;

                const cursorPos = updatedState.selection.$head.pos;
                const nextNode = view.state.doc.nodeAt(cursorPos);
                const suggestionDecoration = Decoration.widget(
                  cursorPos,
                  () => {
                    const container = document.createElement("span");
                    container.classList.add(
                      "autocomplete-suggestion-container"
                    );

                    const suggestionSpan = document.createElement("span");
                    const addSpace = nextNode && nextNode.isText ? " " : "";
                    suggestionSpan.innerHTML = `${addSpace}${suggestion}`;
                    suggestionSpan.classList.add("autocomplete-suggestion");

                    const shortcuts = document.createElement("div");
                    shortcuts.classList.add("autocomplete-shortcuts");

                    const acceptButton = document.createElement("button");
                    acceptButton.innerHTML = "→ to accept";
                    acceptButton.classList.add("shortcut-button");
                    acceptButton.onclick = (e) => {
                      e.preventDefault();
                      const tr = view.state.tr.insertText(
                        suggestionSpan.textContent || ""
                      );
                      view.dispatch(tr);

                      const clearTr = view.state.tr;
                      clearTr.setMeta(pluginKey, {
                        decorations: DecorationSet.empty,
                      });
                      view.dispatch(clearTr);
                    };

                    const newSuggestionButton =
                      document.createElement("button");
                    newSuggestionButton.innerHTML = "Shift + → for new";
                    newSuggestionButton.classList.add("shortcut-button");
                    newSuggestionButton.onclick = (e) => {
                      e.preventDefault();
                      const previousText = view.state.doc
                        .textBetween(0, view.state.doc.content.size, " ")
                        .slice(-4000);

                      // Reset and request new suggestion
                      const clearTr = view.state.tr;
                      clearTr.setMeta(pluginKey, {
                        decorations: DecorationSet.empty,
                      });
                      view.dispatch(clearTr);

                      getSuggestion(previousText, (newSuggestion) => {
                        if (!newSuggestion) return;

                        const cursorPos = view.state.selection.$head.pos;
                        const nextNode = view.state.doc.nodeAt(cursorPos);
                        const suggestionDecoration = Decoration.widget(
                          cursorPos,
                          () => {
                            const container = document.createElement("span");
                            container.classList.add(
                              "autocomplete-suggestion-container"
                            );

                            const suggestionSpan =
                              document.createElement("span");
                            const addSpace =
                              nextNode && nextNode.isText ? " " : "";
                            suggestionSpan.innerHTML = `${addSpace}${newSuggestion}`;
                            suggestionSpan.classList.add(
                              "autocomplete-suggestion"
                            );

                            const shortcuts = document.createElement("div");
                            shortcuts.classList.add("autocomplete-shortcuts");
                            shortcuts.innerHTML =
                              "→ to accept | Shift + → for new suggestion";

                            container.appendChild(suggestionSpan);
                            container.appendChild(shortcuts);
                            return container;
                          },
                          { side: 1 }
                        );

                        const decorations = DecorationSet.create(
                          view.state.doc,
                          [suggestionDecoration]
                        );
                        const tr = view.state.tr;
                        tr.setMeta("addToHistory", false);
                        tr.setMeta(pluginKey, { decorations });
                        view.dispatch(tr);
                      });
                    };

                    shortcuts.appendChild(acceptButton);
                    shortcuts.appendChild(newSuggestionButton);
                    container.appendChild(suggestionSpan);
                    container.appendChild(shortcuts);
                    return container;
                  },
                  { side: 1 }
                );

                const decorations = DecorationSet.create(updatedState.doc, [
                  suggestionDecoration,
                ]);
                const tr = view.state.tr;
                tr.setMeta("addToHistory", false);
                tr.setMeta(pluginKey, { decorations });
                view.dispatch(tr);
              });
            },
          };
        },
        props: {
          decorations(editorState) {
            return pluginKey.getState(editorState);
          },
          handleKeyDown(view, event) {
            // Handle suggestion acceptance with ArrowRight
            if (event.key === "ArrowRight" && !event.shiftKey) {
              const decorationSet = pluginKey.getState(view.state);
              if (decorationSet?.find().length) {
                const suggestionEl = document.querySelector(
                  ".autocomplete-suggestion"
                );
                if (suggestionEl) {
                  const suggestion = suggestionEl.textContent || "";
                  const tr = view.state.tr.insertText(suggestion);
                  view.dispatch(tr);

                  const clearTr = view.state.tr;
                  clearTr.setMeta(pluginKey, {
                    decorations: DecorationSet.empty,
                  });
                  view.dispatch(clearTr);

                  event.preventDefault();
                  return true;
                }
              }
            }

            // Handle new suggestion request with Shift + ArrowRight
            if (event.key === "ArrowRight" && event.shiftKey) {
              const previousText = view.state.doc
                .textBetween(0, view.state.doc.content.size, " ")
                .slice(-4000);

              // Reset current suggestion
              const clearTr = view.state.tr;
              clearTr.setMeta(pluginKey, { decorations: DecorationSet.empty });
              view.dispatch(clearTr);

              // Request new suggestion
              getSuggestion(previousText, (suggestion) => {
                if (!suggestion) return;

                const cursorPos = view.state.selection.$head.pos;
                const nextNode = view.state.doc.nodeAt(cursorPos);
                const suggestionDecoration = Decoration.widget(
                  cursorPos,
                  () => {
                    const container = document.createElement("span");
                    container.classList.add(
                      "autocomplete-suggestion-container"
                    );

                    const suggestionSpan = document.createElement("span");
                    const addSpace = nextNode && nextNode.isText ? " " : "";
                    suggestionSpan.innerHTML = `${addSpace}${suggestion}`;
                    suggestionSpan.classList.add("autocomplete-suggestion");

                    const shortcuts = document.createElement("div");
                    shortcuts.classList.add("autocomplete-shortcuts");
                    shortcuts.innerHTML =
                      "→ to accept | Shift + → for new suggestion";

                    container.appendChild(suggestionSpan);
                    container.appendChild(shortcuts);
                    return container;
                  },
                  { side: 1 }
                );

                const decorations = DecorationSet.create(view.state.doc, [
                  suggestionDecoration,
                ]);
                const tr = view.state.tr;
                tr.setMeta("addToHistory", false);
                tr.setMeta(pluginKey, { decorations });
                view.dispatch(tr);
              });

              event.preventDefault();
              return true;
            }

            return false;
          },
        },
      }),
    ];
  },
});
