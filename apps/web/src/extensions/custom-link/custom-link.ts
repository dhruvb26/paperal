import Link from "@tiptap/extension-link";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";
import { useSidebarStore } from "@/store/sidebar-store";

export const CustomLink = Link.extend({
  addProseMirrorPlugins() {
    const plugins = this.parent?.() || [];

    // Remove the default click handler plugin
    const filteredPlugins = plugins.filter(
      (plugin) => !(plugin as any)?.key?.includes("handleClick")
    );

    // Add our custom click handler plugin
    const customClickHandler = new Plugin({
      key: new PluginKey("customLinkClickHandler"),
      props: {
        handleClick(view: EditorView, pos: number, event: MouseEvent) {
          const { state } = view;
          const link = state.doc.nodeAt(pos);
          const attrs = link?.marks[0]?.attrs;

          if (attrs?.href) {
            event.preventDefault();

            // Create and show popover
            const popover = window.document.createElement("div");
            popover.className = "link-popover";

            // Calculate position
            const viewportHeight = window.innerHeight;
            const popoverHeight = 200; // Approximate height of popover
            let topPosition = event.pageY + 20;

            // If popover would overflow bottom of screen, show it above the link instead
            if (topPosition + popoverHeight > viewportHeight) {
              topPosition = event.pageY - popoverHeight - 10;
            }

            popover.style.cssText = `
              position: absolute;
              left: ${event.pageX}px;
              top: ${topPosition}px;
              background: hsl(var(--background)); 
              border: 1px solid hsl(var(--border));
              border-radius: 4px;
              padding: 8px;
              z-index: 1000;
              width: 450px;
            `;

            // Remove existing popovers
            window.document
              .querySelectorAll(".link-popover")
              .forEach((el: Element) => el.remove());

            // Add new popover
            window.document.body.appendChild(popover);

            // Show skeleton loading state
            popover.innerHTML = `
              <div class="flex flex-col items-start gap-2 p-2">
                <div class="flex flex-col space-y-1 items-start w-full">
                  <div class="animate-pulse rounded-md bg-primary/10 h-4 w-3/4"></div>
                  <div class="animate-pulse rounded-md bg-primary/10 h-4 w-1/2"></div>
                  <div class="animate-pulse rounded-md bg-primary/10 h-4 w-1/4"></div>
                </div>
                <div class="flex items-center justify-between w-full mt-2">
                  <div class="animate-pulse rounded-md bg-primary/10 h-4 w-16"></div>
                  <div class="animate-pulse rounded-md bg-primary/10 h-4 w-16"></div>
                </div>
              </div>
            `;

            // Close popover when clicking outside
            const closePopover = (e: MouseEvent) => {
              if (!popover.contains(e.target as Node)) {
                popover.remove();
                window.document.removeEventListener("click", closePopover);
              }
            };

            setTimeout(() => {
              window.document.addEventListener("click", closePopover);
            }, 0);

            const doc = view.state.doc;
            const linkPos = pos;
            let sentenceStartPos = linkPos;
            let sentenceEndPos = linkPos;

            // Find the start of the sentence containing the link
            while (sentenceStartPos > 0) {
              const prevChar = doc.textBetween(
                sentenceStartPos - 1,
                sentenceStartPos
              );
              const prevPrevChar =
                sentenceStartPos > 1
                  ? doc.textBetween(sentenceStartPos - 2, sentenceStartPos - 1)
                  : "";
              const textBefore = doc.textBetween(
                Math.max(0, sentenceStartPos - 20),
                sentenceStartPos
              );

              // Look for sentence starters like "Additionally, ", "Moreover, ", "Furthermore, " etc.
              if (
                (prevChar === "." && /\.\s+[A-Z]/.test(textBefore)) ||
                (prevChar === " " && /\.\s+$/.test(textBefore)) ||
                sentenceStartPos === 1
              ) {
                break;
              }
              sentenceStartPos--;
            }

            // Find the end of the sentence by looking specifically for the citation's end
            while (sentenceEndPos < doc.content.size) {
              const textAhead = doc.textBetween(
                sentenceEndPos,
                Math.min(sentenceEndPos + 50, doc.content.size)
              );

              // Look for citation pattern and stop right after it
              if (/\([^)]+\)\.\s*/.test(textAhead)) {
                const match = textAhead.match(/\([^)]+\)\.\s*/);
                if (match) {
                  sentenceEndPos += match[0].length;
                  break;
                }
              }
              sentenceEndPos++;
            }

            // Get the complete sentence containing the link and clean it up
            const sentence = doc
              .textBetween(sentenceStartPos, sentenceEndPos)
              .trim()
              .replace(/^\s*[.!?]\s*/, "") // Remove leading punctuation and spaces
              .replace(/\s+/g, " "); // Normalize whitespace

            fetch(`/api/library/${encodeURIComponent(attrs.href)}`, {
              method: "GET",
            })
              .then((response) => {
                if (!response.ok) {
                  throw new Error(
                    `Failed to fetch document: ${response.statusText}`
                  );
                }
                return response.json();
              })
              .then((document: any) => {
                // Function to get current citation type from the link text
                const getCurrentCitationType = (linkText: string) => {
                  const inTextCitation =
                    document.metadata?.citations?.["in-text"] || document.title;
                  return linkText === inTextCitation ? "in-text" : "after-text";
                };

                // Get the current link text
                const linkText = state.doc.textBetween(pos, pos + 1);
                const initialCitationType = getCurrentCitationType(linkText);

                // Add both citation formats to the popover with a toggle switch
                popover.innerHTML = `
                  <div class="flex flex-col items-start gap-2 p-2 citation-div">
                    <div class="flex flex-col space-y-1 items-start text-xs w-full">
                      <span class="text-xs whitespace-break-spaces w-full truncate text-ellipsis line-clamp-2">${
                        document.title
                      }</span>
                      <span class="text-xs w-full overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground">
                        ${document.metadata?.authors?.join(", ") || ""}
                      </span>
                      <span class="text-xs text-muted-foreground italic">
                        ${document.metadata?.year || ""}
                      </span>
                      <span class="text-xs line-clamp-2 text-muted-foreground mt-2">
                        ${document.description || ""}
                         <span className="text-xs text-muted-foreground font-medium">
                            see more
                          </span>
                      </span>
                    </div>
                    <div class="flex items-center justify-between w-full">
                      <div class="flex items-center gap-2">
                        <button 
                          disabled={true}
                          class="citation-toggle flex items-center gap-2 px-2 py-1 rounded-md bg-muted hover:bg-muted/80"
                        >
                          <span class="text-xs current-citation-type">
                            ${
                              initialCitationType === "in-text"
                                ? "After-text"
                                : "In-text"
                            }
                          </span>
                          
                        </button>
                        <button 
                          class="flex text-xs items-center gap-1 hover:underline text-foreground"
                          onclick="window.open('${attrs.href}', '${
                  attrs.target || "_blank"
                }')"
                        >
                          <svg width="12" height="12" viewBox="0 0 256 256">
                            <path fill="currentColor" d="M200 64v104a8 8 0 0 1-16 0V83.31L69.66 197.66a8 8 0 0 1-11.32-11.32L172.69 72H88a8 8 0 0 1 0-16h104a8 8 0 0 1 8 8Z"/>
                          </svg>
                          View
                        </button>
                        <button 
                          class="explain-btn flex text-xs items-center gap-1 hover:underline text-foreground"
                        >
                          <svg width="12" height="12" viewBox="0 0 256 256">
                            <path fill="currentColor" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm0 192a88 88 0 1 1 88-88a88.1 88.1 0 0 1-88 88Zm16-40a8 8 0 0 1-8 8h-8a8 8 0 0 1-8-8v-48a8 8 0 0 1 0-16h8a8 8 0 0 1 8 8v48a8 8 0 0 1 8 8Zm-24-84a12 12 0 1 1 12 12a12 12 0 0 1-12-12Z"/>
                          </svg>
                          Explain
                        </button>
                      </div>
                      <div class="flex items-center gap-2 text-muted-foreground">
                          <span class="text-xs italic">
                          ${document.isInLibrary ? "Library" : "Discover"}
                        </span>
                      </div>
                    </div>
                  </div>
                `;

                // Function to replace citation text without closing popover
                const replaceCitation = (newText: string) => {
                  const linkMark = link?.marks.find(
                    (mark) => mark.type.name === "link"
                  );
                  if (linkMark) {
                    let from = pos;
                    let to = pos;

                    const doc = view.state.doc;
                    while (
                      from > 0 &&
                      doc.rangeHasMark(from - 1, from, linkMark.type)
                    ) {
                      from--;
                    }
                    while (
                      to < doc.content.size &&
                      doc.rangeHasMark(to, to + 1, linkMark.type)
                    ) {
                      to++;
                    }

                    const tr = view.state.tr;
                    tr.removeMark(from, to, linkMark.type);
                    tr.delete(from, to);

                    const newContent = view.state.schema.text(newText, [
                      linkMark,
                    ]);
                    tr.insert(from, newContent);

                    view.dispatch(tr);
                  }
                };

                // Add click handler for the citation toggle
                const citationToggle =
                  popover.querySelector(".citation-toggle");
                const currentCitationTypeSpan = popover.querySelector(
                  ".current-citation-type"
                );

                if (citationToggle && currentCitationTypeSpan) {
                  citationToggle.addEventListener("click", () => {
                    const currentType = currentCitationTypeSpan.textContent
                      ?.trim()
                      .toLowerCase();
                    const newType =
                      currentType === "in-text" ? "after-text" : "in-text";
                    const newText =
                      document.metadata?.citations?.[
                        newType === "in-text" ? "in-text" : "after-text"
                      ] || document.title;

                    replaceCitation(newText);
                    currentCitationTypeSpan.textContent =
                      newType === "in-text" ? "In-text" : "After-text";
                  });
                }

                // After setting up the popover HTML, add the explain button click handler:
                const explainButton = popover.querySelector(".explain-btn");
                if (explainButton) {
                  explainButton.addEventListener("click", () => {
                    // Store the selected link data with the complete sentence
                    const linkData = {
                      href: attrs.href,
                      title: document.title,
                      description: document.description,
                      authors: document.metadata?.authors,
                      year: document.metadata?.year,
                      sentence: sentence, // Use the complete sentence here
                    };

                    // Update the store
                    const sidebarStore = useSidebarStore.getState();
                    sidebarStore.setSelectedLink(linkData);
                    if (!sidebarStore.isRightSidebarOpen) {
                      sidebarStore.toggleRightSidebar();
                    }

                    // Close the popover
                    popover.remove();
                    window.document.removeEventListener("click", closePopover);
                  });
                }
              })
              .catch((error) => {
                popover.innerHTML = `
                  <div class="flex flex-col items-start gap-2 p-2">
                    <span class="text-xs text-destructive">Error loading document details</span>
                    <button 
                      class="flex text-xs items-center gap-1 hover:underline text-foreground"
                      onclick="window.open('${attrs.href}', '${
                  attrs.target || "_blank"
                }')"
                    >
                      Open Link
                    </button>
                  </div>
                `;
              });

            return true;
          }

          return false;
        },
      },
    });

    return [...filteredPlugins, customClickHandler];
  },
});
