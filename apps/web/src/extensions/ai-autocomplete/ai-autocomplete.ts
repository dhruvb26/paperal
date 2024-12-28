import { Node } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

function debounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timer: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise<ReturnType<T>>((resolve, reject) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          const output = callback(...args);
          resolve(output);
        } catch (err) {
          reject(err);
        }
      }, delay);
    }).catch((error) => {
      console.error("Error in debounced function:", error);
      throw error; // Re-throw the error if you want it to propagate
    });
  };
}

interface CallbackInput {
  text: string;
  is_referenced: boolean;
  citations?: {
    "in-text"?: string;
    "after-text"?: string;
  };
  href?: string;
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
      async (
        previousText: string,
        documentId: string,
        cb: (suggestion: string | null, data?: CallbackInput) => void
      ) => {
        try {
          const pathDocumentId = window.location.pathname.split("/editor/")[1];

          const suggestion = await fetch("/api/suggest", {
            method: "POST",
            body: JSON.stringify({
              previousText,
              documentId: pathDocumentId || documentId,
            }),
          });
          const data = (await suggestion.json()) as CallbackInput;
          const string = data.text;
          cb(string, data);
        } catch (error) {
          console.error(error);
          cb(null);
        }
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
          let isTyping = false;
          let typingTimer: NodeJS.Timeout;
          let hasPendingSuggestion = false;

          return {
            update(view, prevState) {
              // Check if document is empty
              if (view.state.doc.textContent.trim().length === 0) {
                return;
              }

              if (prevState && !prevState.doc.eq(view.state.doc)) {
                const existingSuggestion = pluginKey
                  .getState(view.state)
                  ?.find().length;
                if (existingSuggestion) {
                  const tr = view.state.tr;
                  tr.setMeta("addToHistory", false);
                  tr.setMeta(pluginKey, { decorations: DecorationSet.empty });
                  view.dispatch(tr);
                  hasPendingSuggestion = false;
                  return;
                }
              }
              const selection = view.state.selection;
              const cursorPos = selection.$head.pos;
              const nextNode = view.state.doc.nodeAt(cursorPos);

              // If there's a pending suggestion, don't make new requests
              if (hasPendingSuggestion) {
                return;
              }

              // Clear existing suggestion if cursor is not at end of block
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

              // Set typing flag and clear previous timer
              clearTimeout(typingTimer);
              isTyping = true;

              // Wait for user to stop typing for 1 second
              typingTimer = setTimeout(() => {
                isTyping = false;

                const documentId = view.state.doc.attrs.id;
                const previousText = JSON.stringify(view.state.doc.toJSON());

                // Only proceed if there's actual content and user isn't typing
                if (previousText.trim().length > 0 && !isTyping) {
                  hasPendingSuggestion = true;

                  // Reset the suggestion before fetching a new one
                  const tr = view.state.tr;
                  tr.setMeta("addToHistory", false);
                  tr.setMeta(pluginKey, { decorations: DecorationSet.empty });
                  view.dispatch(tr);

                  getSuggestion(
                    previousText,
                    documentId,
                    (suggestion, data) => {
                      hasPendingSuggestion = false;
                      if (!suggestion || !data) return;

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
                          const addSpace =
                            nextNode && nextNode.isText ? " " : "";

                          // Format the suggestion to place citation before the period
                          let formattedSuggestion = suggestion;
                          if (data.citations?.["in-text"]) {
                            // Remove any trailing period
                            formattedSuggestion = suggestion.replace(/\.$/, "");
                            // Add citation and period
                            formattedSuggestion = `${formattedSuggestion} ${data.citations["in-text"]}.`;
                          }

                          suggestionSpan.innerHTML = `${addSpace}${formattedSuggestion}`;
                          suggestionSpan.classList.add(
                            "autocomplete-suggestion"
                          );
                          suggestionSpan.setAttribute(
                            "data-response-data",
                            JSON.stringify(data)
                          );

                          const shortcuts = document.createElement("div");
                          shortcuts.classList.add("autocomplete-shortcuts");

                          const acceptButton = document.createElement("button");
                          acceptButton.innerHTML = "→ to accept";
                          acceptButton.classList.add("shortcut-button");
                          acceptButton.onclick = (e) => {
                            e.preventDefault();
                            const tr = view.state.tr;
                            const responseData = JSON.parse(
                              suggestionSpan.getAttribute(
                                "data-response-data"
                              ) || "{}"
                            );

                            if (responseData.citations?.["in-text"]) {
                              const schema = view.state.schema;
                              const text = suggestionSpan.textContent || "";
                              const lastPeriodIndex = text.lastIndexOf(".");

                              if (lastPeriodIndex !== -1) {
                                // Remove the citation from the suggestion text (it's added twice currently)
                                const textWithoutCitation = text
                                  .replace(
                                    responseData.citations["in-text"],
                                    ""
                                  )
                                  .trim();
                                // Split at the last period
                                const beforePeriod =
                                  textWithoutCitation.substring(
                                    0,
                                    textWithoutCitation.lastIndexOf(".")
                                  );

                                tr.replaceWith(
                                  tr.selection.from,
                                  tr.selection.from,
                                  [
                                    schema.text(beforePeriod + " "),
                                    schema.text(
                                      responseData.citations["in-text"],
                                      [
                                        schema.marks.link.create({
                                          href: responseData.href,
                                        }),
                                      ]
                                    ),
                                    schema.text(". "),
                                  ]
                                );
                              } else {
                                // If no period, just append citation before adding one
                                const textWithoutCitation = text
                                  .replace(
                                    responseData.citations["in-text"],
                                    ""
                                  )
                                  .trim();
                                tr.replaceWith(
                                  tr.selection.from,
                                  tr.selection.from,
                                  [
                                    schema.text(textWithoutCitation + " "),
                                    schema.text(
                                      responseData.citations["in-text"],
                                      [
                                        schema.marks.link.create({
                                          href: responseData.href,
                                        }),
                                      ]
                                    ),
                                    schema.text(". "),
                                  ]
                                );
                              }
                            } else {
                              tr.insertText(suggestionSpan.textContent || "");
                            }

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
                            const previousText = JSON.stringify(
                              view.state.doc.toJSON()
                            );

                            // Reset and request new suggestion
                            const clearTr = view.state.tr;
                            clearTr.setMeta(pluginKey, {
                              decorations: DecorationSet.empty,
                            });
                            view.dispatch(clearTr);

                            getSuggestion(
                              previousText,
                              documentId,
                              (newSuggestion, newData) => {
                                if (!newSuggestion || !newData) return;

                                const cursorPos =
                                  view.state.selection.$head.pos;
                                const nextNode =
                                  view.state.doc.nodeAt(cursorPos);
                                const suggestionDecoration = Decoration.widget(
                                  cursorPos,
                                  () => {
                                    const container =
                                      document.createElement("span");
                                    container.classList.add(
                                      "autocomplete-suggestion-container"
                                    );

                                    const suggestionSpan =
                                      document.createElement("span");
                                    const addSpace =
                                      nextNode && nextNode.isText ? " " : "";
                                    const citationText = newData.citations?.[
                                      "in-text"
                                    ]
                                      ? ` ${newData.citations["in-text"]}`
                                      : "";
                                    suggestionSpan.innerHTML = `${addSpace}${newSuggestion}${citationText}`;
                                    suggestionSpan.classList.add(
                                      "autocomplete-suggestion"
                                    );
                                    suggestionSpan.setAttribute(
                                      "data-response-data",
                                      JSON.stringify(newData)
                                    );

                                    const shortcuts =
                                      document.createElement("div");
                                    shortcuts.classList.add(
                                      "autocomplete-shortcuts"
                                    );
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
                              }
                            );
                          };

                          shortcuts.appendChild(acceptButton);
                          shortcuts.appendChild(newSuggestionButton);
                          container.appendChild(suggestionSpan);
                          container.appendChild(shortcuts);
                          return container;
                        },
                        { side: 1 }
                      );

                      const decorations = DecorationSet.create(
                        updatedState.doc,
                        [suggestionDecoration]
                      );
                      const tr = view.state.tr;
                      tr.setMeta("addToHistory", false);
                      tr.setMeta(pluginKey, { decorations });
                      view.dispatch(tr);
                    }
                  );
                }
              }, 1000); // 1 second delay
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
                ) as HTMLElement;
                if (suggestionEl) {
                  const tr = view.state.tr;
                  const responseData = JSON.parse(
                    suggestionEl.getAttribute("data-response-data") || "{}"
                  );

                  if (responseData.citations?.["in-text"]) {
                    const schema = view.state.schema;
                    const text = suggestionEl.textContent || "";
                    const lastPeriodIndex = text.lastIndexOf(".");

                    if (lastPeriodIndex !== -1) {
                      // Remove the citation from the suggestion text (it's added twice currently)
                      const textWithoutCitation = text
                        .replace(responseData.citations["in-text"], "")
                        .trim();
                      // Split at the last period
                      const beforePeriod = textWithoutCitation.substring(
                        0,
                        textWithoutCitation.lastIndexOf(".")
                      );

                      tr.replaceWith(tr.selection.from, tr.selection.from, [
                        schema.text(beforePeriod + ""),
                        schema.text(responseData.citations["in-text"], [
                          schema.marks.link.create({
                            href: responseData.href,
                          }),
                        ]),
                        schema.text(". "),
                      ]);
                    } else {
                      // If no period, just append citation before adding one
                      const textWithoutCitation = text
                        .replace(responseData.citations["in-text"], "")
                        .trim();
                      tr.replaceWith(tr.selection.from, tr.selection.from, [
                        schema.text(textWithoutCitation + ""),
                        schema.text(responseData.citations["in-text"], [
                          schema.marks.link.create({
                            href: responseData.href,
                          }),
                        ]),
                        schema.text(". "),
                      ]);
                    }
                  } else {
                    tr.insertText(suggestionEl.textContent || "");
                  }

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
              const previousText = JSON.stringify(view.state.doc.toJSON());

              const pathDocumentId =
                window.location.pathname.split("/editor/")[1];

              // Reset current suggestion
              const clearTr = view.state.tr;
              clearTr.setMeta(pluginKey, { decorations: DecorationSet.empty });
              view.dispatch(clearTr);

              // Request new suggestion with actual documentId
              getSuggestion(
                previousText,
                pathDocumentId || "",
                (suggestion, data) => {
                  if (!suggestion || !data) return;

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
                      const citationText = data.citations?.["in-text"]
                        ? ` ${data.citations["in-text"]}`
                        : "";
                      suggestionSpan.innerHTML = `${addSpace}${suggestion}${citationText}`;
                      suggestionSpan.classList.add("autocomplete-suggestion");
                      suggestionSpan.setAttribute(
                        "data-response-data",
                        JSON.stringify(data)
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

                  const decorations = DecorationSet.create(view.state.doc, [
                    suggestionDecoration,
                  ]);
                  const tr = view.state.tr;
                  tr.setMeta("addToHistory", false);
                  tr.setMeta(pluginKey, { decorations });
                  view.dispatch(tr);
                }
              );

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
