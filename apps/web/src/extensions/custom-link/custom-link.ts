import Link from "@tiptap/extension-link";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";

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
            popover.style.cssText = `
              position: absolute;
              left: ${event.pageX}px;
              top: ${event.pageY + 20}px;
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
