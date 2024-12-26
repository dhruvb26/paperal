import React from "react";

interface LinkPopoverProps {
  document: any;
  href: string;
  target?: string;
  initialCitationType: string;
  onCitationTypeChange: (newText: string) => void;
}

export const LinkPopover = React.forwardRef<HTMLDivElement, LinkPopoverProps>(
  (
    {
      document,
      href,
      target = "_blank",
      initialCitationType,
      onCitationTypeChange,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className="flex flex-col items-start gap-2 p-2 citation-div"
      >
        <div className="flex flex-col space-y-1 items-start text-xs">
          <span className="text-xs truncate">{document.title}</span>
          <span className="text-xs truncate w-full text-muted-foreground">
            {document.metadata?.authors?.join(", ") || ""}
          </span>
          <span className="text-xs text-muted-foreground italic">
            {document.metadata?.year || ""}
          </span>
        </div>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <button
              className="citation-toggle flex items-center gap-2 px-2 py-1 rounded-md bg-muted hover:bg-muted/80"
              onClick={() => {
                const currentType = initialCitationType;
                const newType =
                  currentType === "in-text" ? "after-text" : "in-text";
                const newText =
                  document.metadata?.citations?.[newType] || document.title;
                onCitationTypeChange(newText);
              }}
            >
              <span className="text-xs">
                {initialCitationType === "in-text" ? "In-text" : "After-text"}
              </span>
            </button>
            <button
              className="flex text-xs items-center gap-1 hover:underline text-foreground"
              onClick={() => window.open(href, target)}
            >
              <svg width="12" height="12" viewBox="0 0 256 256">
                <path
                  fill="currentColor"
                  d="M200 64v104a8 8 0 0 1-16 0V83.31L69.66 197.66a8 8 0 0 1-11.32-11.32L172.69 72H88a8 8 0 0 1 0-16h104a8 8 0 0 1 8 8Z"
                />
              </svg>
              View
            </button>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-xs italic">Library</span>
          </div>
        </div>
      </div>
    );
  }
);
