// import type { User } from "@clerk/nextjs/server";

interface LatexUser {
  firstName: string;
  lastName: string;
}

interface LatexConverterOptions {
  documentClass?: string;
  additionalPackages?: string[];
  bibliographyFile?: string;
  user?: LatexUser;
  date?: string;
  abstract?: string;
}

export const convertToLatex = (
  json: any,
  options: LatexConverterOptions = {}
): string => {
  const {
    documentClass = "article",
    additionalPackages = [],
    bibliographyFile,
    user,
    date = new Date().toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
    abstract,
  } = options;

  // Extract title from the first heading level 1
  const getDocTitle = (content: any[]): string => {
    const firstHeading = content.find(
      (node: any) => node.type === "heading" && node.attrs.level === 1
    );
    return firstHeading?.content?.[0]?.text || "Untitled Document";
  };

  let isFirstH1 = true; // Flag to track if we've seen the first h1

  const processNode = (node: any): string => {
    switch (node.type) {
      case "paragraph":
        return node.content
          ? node.content.map(processNode).join("") + "\n\n"
          : "\n";
      case "heading":
        const headingLevel = node.attrs.level as 1 | 2 | 3;

        // If this is a level 1 heading and it's the first one,
        // skip it since it's already used as the title
        if (headingLevel === 1 && isFirstH1) {
          isFirstH1 = false;
          return ""; // Don't create a section for the title
        }

        const headingCommands = {
          1: "\\section{",
          2: "\\subsection{",
          3: "\\subsubsection{",
        } as const;
        const headingCommand = headingCommands[headingLevel] || "\\paragraph{";
        return `${headingCommand}${node.content
          ?.map(processNode)
          .join("")}}\n\n`;
      case "text":
        let text = node.text;
        if (node.marks) {
          node.marks.forEach((mark: any) => {
            switch (mark.type) {
              case "bold":
                text = `\\textbf{${text}}`;
                break;
              case "italic":
                text = `\\textit{${text}}`;
                break;
              case "underline":
                text = `\\underline{${text}}`;
                break;
              case "highlight":
                text = `\\hl{${text}}`;
                break;
              case "citation":
                text = `\\textcolor{blue}{\\cite{${text}}}`;
                break;
              case "superscript":
                text = `\\textsuperscript{${text}}`;
                break;
              case "subscript":
                text = `\\textsubscript{${text}}`;
                break;
            }
          });
        }
        return text;
      case "figure":
        return `\\begin{figure}[htbp]
    \\centering
    \\includegraphics[width=${node.attrs?.width || "0.8"}\\textwidth]{${
          node.attrs?.src
        }}
    \\caption{${node.attrs?.caption || ""}}
    \\label{fig:${node.attrs?.label || "figure"}}
\\end{figure}\n\n`;
      case "table":
        const cols = node.attrs?.columns || 1;
        return `\\begin{table}[htbp]
    \\centering
    \\begin{tabular}{${"|c".repeat(cols)}|}
    \\hline
    ${node.content?.map(processNode).join("")}
    \\end{tabular}
    \\caption{${node.attrs?.caption || ""}}
    \\label{tab:${node.attrs?.label || "table"}}
\\end{table}\n\n`;
      case "tableRow":
        return `${node.content?.map(processNode).join(" & ")} \\\\ \\hline\n`;
      case "tableCell":
        return node.content?.map(processNode).join("") || "";
      case "equation":
        return `\\begin{equation}
    ${node.content || ""}
    \\label{eq:${node.attrs?.label || "equation"}}
\\end{equation}\n\n`;
      case "code":
        return `\\begin{lstlisting}[language=${node.attrs?.language || "text"}]
${node.content || ""}
\\end{lstlisting}\n\n`;
      case "bulletList":
        return (
          "\\begin{itemize}\n" +
          (node.content?.map(processNode).join("") || "") +
          "\\end{itemize}\n\n"
        );
      case "orderedList":
        return (
          "\\begin{enumerate}\n" +
          (node.content?.map(processNode).join("") || "") +
          "\\end{enumerate}\n\n"
        );
      case "listItem":
        return (
          "\\item " + (node.content?.map(processNode).join("") || "") + "\n"
        );
      default:
        return node.content ? node.content.map(processNode).join("") : "";
    }
  };

  // Enhanced default packages with biblatex
  const defaultPackages = [
    "\\usepackage{soul}", // For highlighting
    "\\usepackage{xcolor}", // For colored text
    "\\usepackage{hyperref}", // For links
    "\\usepackage{graphicx}", // For images
    "\\usepackage{amsmath}", // For advanced math
    "\\usepackage{listings}", // For code blocks
    "\\usepackage[style=apa,backend=biber]{biblatex}", // APA style citations
  ];
  const packages = [...defaultPackages, ...additionalPackages].join("\n");

  // Build the document
  let document = `\\documentclass{${documentClass}}\n${packages}\n\n`;

  // Add bibliography resource if specified
  if (bibliographyFile) {
    document += `\\addbibresource{${bibliographyFile}}\n\n`;
  }

  // Add document metadata
  document += "\\begin{document}\n\n";

  // Extract and add title from first h1
  const content = json.content || [];
  const title = getDocTitle(content);
  document += `\\title{${title}}\n`;

  if (user) {
    const authorName = `${user.firstName} ${user.lastName}`;
    document += `\\author{${authorName}}\n`;
  }

  document += `\\date{${date}}\n`;
  document += "\\maketitle\n\n";

  if (abstract) {
    document += `\\begin{abstract}\n${abstract}\n\\end{abstract}\n\n`;
  }

  // Process content
  const latex = content.map(processNode).join("");
  document += latex;

  // Add bibliography printing command at the end
  if (bibliographyFile) {
    document += "\n\\printbibliography\n";
  }

  document += "\\end{document}";

  return document;
};

export const downloadLatex = (
  latex: string,
  filename: string = "document.tex"
): void => {
  const blob = new Blob([latex], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
