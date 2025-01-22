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

    // Add our custom hover handler plugin
    const customHoverHandler = new Plugin({
      key: new PluginKey("customLinkHoverHandler"),
      props: {
        handleDOMEvents: {
          mouseover(view: EditorView, event: MouseEvent) {
            const pos = view.posAtDOM(event.target as Node, 0);
            const { state } = view;
            const link = state.doc.nodeAt(pos);
            const attrs = link?.marks[0]?.attrs;

            if (attrs?.href) {
              // Create and show popover
              const popover = window.document.createElement("div");
              popover.className = "link-popover";

              // Calculate position
              const viewportHeight = window.innerHeight;
              const viewportWidth = window.innerWidth;
              const popoverHeight = 200; // Approximate height of popover
              const popoverWidth = 450; // Width of popover

              let topPosition = event.pageY + 20;
              let leftPosition = event.pageX;

              // If popover would overflow bottom of screen, show it above the link instead
              if (topPosition + popoverHeight > viewportHeight) {
                topPosition = event.pageY - popoverHeight - 10;
              }

              // If popover would overflow right side of screen, align it to the right
              if (leftPosition + popoverWidth > viewportWidth) {
                leftPosition = viewportWidth - popoverWidth - 20;
              }

              popover.style.cssText = `
                position: absolute;
                left: ${leftPosition}px;
                top: ${topPosition}px;
                background: hsl(var(--background)); 
                border: 1px solid hsl(var(--accent));
                border-radius: 0.375rem;
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
                    <div class="animate-pulse rounded-md bg-accent h-8 w-full"></div>
                    <div class="animate-pulse rounded-md bg-accent h-4 w-full"></div>
                    <div class="animate-pulse rounded-md bg-accent h-4 w-3/4"></div>
                    <div class="animate-pulse rounded-md bg-accent h-8 mt-1 w-full"></div>
                    <div class="animate-pulse rounded-md bg-accent h-9 w-full"></div>
                </div>
              `;

              // Flag to track if mouse is over popover
              let isPopoverHovered = false;

              // Close popover when clicking outside
              const closePopover = (e: MouseEvent) => {
                if (!popover.contains(e.target as Node)) {
                  popover.remove();
                  window.document.removeEventListener("click", closePopover);
                }
              };

              window.document.addEventListener("click", closePopover);

              // Handle mouse enter and leave on popover
              popover.addEventListener("mouseenter", () => {
                isPopoverHovered = true;
              });

              popover.addEventListener("mouseleave", () => {
                isPopoverHovered = false;
                // Delay removal to allow potential re-entry
                setTimeout(() => {
                  if (!isPopoverHovered) {
                    popover.remove();
                    window.document.removeEventListener("click", closePopover);
                  }
                }, 200);
              });

              // Handle mouse leave on the link
              const linkElement = event.target as HTMLElement;
              linkElement.addEventListener("mouseleave", () => {
                // Delay removal to allow mouse to enter popover
                setTimeout(() => {
                  if (!isPopoverHovered) {
                    popover.remove();
                    window.document.removeEventListener("click", closePopover);
                  }
                }, 100);
              });

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
                    ? doc.textBetween(
                        sentenceStartPos - 2,
                        sentenceStartPos - 1
                      )
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
                      document.metadata?.citations?.["in-text"] ||
                      document.title;
                    return linkText === inTextCitation
                      ? "in-text"
                      : "after-text";
                  };

                  // Get the current link text
                  const linkText = state.doc.textBetween(pos, pos + 1);
                  const initialCitationType = getCurrentCitationType(linkText);

                  // Add both citation formats to the popover with a toggle switch
                  popover.innerHTML = `
                    <div class="flex flex-col items-start gap-2 p-2 citation-div">
                      <div class="flex flex-col space-y-1 items-start text-xs w-full h-fit">
                        <a href="${
                          attrs.href
                        }" target="_blank" class="text-xs whitespace-break-spaces w-full truncate text-ellipsis line-clamp-2 hover:text-blue-700 text-accent-foreground">${
                    document.title
                  }</a>
                        <span class="text-xs w-full overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground">
                          ${document.metadata?.authors?.join(", ") || ""}
                        </span>
                        <span class="text-xs text-muted-foreground italic">
                          ${document.metadata?.year || ""}
                        </span>
                        <div class="text-xs text-muted-foreground p-1 relative">
                        
                          <div class="line-clamp-2">
                            ${document.description || ""}
                          </div>
                          ${document.description?.length > 100 ? "" : ""}
                        </div>
                      </div>
                      <div class="flex items-center justify-between w-full">
                        <div class="flex items-center gap-2">
                          <button 
                            class="explain-btn text-primary underline-offset-4 hover:underline h-8 rounded-md px-3 text-xs inline-flex items-center justify-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#2563eb" viewBox="0 0 256 256"><path d="M48,64a8,8,0,0,1,8-8H72V40a8,8,0,0,1,16,0V56h16a8,8,0,0,1,0,16H88V88a8,8,0,0,1-16,0V72H56A8,8,0,0,1,48,64ZM184,192h-8v-8a8,8,0,0,0-16,0v8h-8a8,8,0,0,0,0,16h8v8a8,8,0,0,0,16,0v-8h8a8,8,0,0,0,0-16Zm56-48H224V128a8,8,0,0,0-16,0v16H192a8,8,0,0,0,0,16h16v16a8,8,0,0,0,16,0V160h16a8,8,0,0,0,0-16ZM219.31,80,80,219.31a16,16,0,0,1-22.62,0L36.68,198.63a16,16,0,0,1,0-22.63L176,36.69a16,16,0,0,1,22.63,0l20.68,20.68A16,16,0,0,1,219.31,80Zm-54.63,32L144,91.31l-96,96L68.68,208ZM208,68.69,187.31,48l-32,32L176,100.69Z"></path></svg>
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
                      window.document.removeEventListener(
                        "click",
                        closePopover
                      );
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
          // Removed the mouseout handler to prevent immediate popover removal
          // mouseout(view: EditorView, event: MouseEvent) {
          //   // Remove popover when mouse leaves the link
          //   window.document
          //     .querySelectorAll(".link-popover")
          //     .forEach((el: Element) => el.remove());
          //   return false;
          // },
        },
      },
    });

    return [...filteredPlugins, customHoverHandler];
  },
});
