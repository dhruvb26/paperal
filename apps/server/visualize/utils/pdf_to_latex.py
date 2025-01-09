from pdfminer.high_level import extract_text, extract_pages
from pdfminer.layout import LAParams, LTTextContainer, LTChar
import re


def pdf_to_latex(pdf_path, output_path):
    # Extract text from PDF
    text = extract_text(pdf_path, laparams=LAParams())

    # Create a set of bold lines by checking font information
    bold_lines = set()
    for page_layout in extract_pages(pdf_path):
        for element in page_layout:
            if isinstance(element, LTTextContainer):
                for text_line in element:
                    if isinstance(text_line, LTChar) and "Bold" in text_line.fontname:
                        bold_lines.add(element.get_text().strip())
                        break

    # Basic cleanup
    text = text.strip()

    # Enhanced LaTeX document structure with research paper packages
    latex_content = [
        "\\documentclass[12pt]{article}",
        "\\usepackage[utf8]{inputenc}",
        "\\usepackage{amsmath,amssymb}",
        "\\usepackage{graphicx}",
        "\\usepackage[hidelinks]{hyperref}",
        "\\usepackage{natbib}",
        "\\usepackage{geometry}",
        "\\usepackage{bm}",
        "\\usepackage{textbf}",
        "\\geometry{margin=1in}",
        "",
        "\\title{Converted PDF Document}",
        "\\author{}",
        "\\date{}",
        "",
        "\\begin{document}",
        "\\maketitle",
        "",
    ]

    # Initialize dictionary to store sections
    sections_dict = {}
    current_section = None
    KEYWORDS = [
        "abstract",
        "introduction",
        "methodology",
        "results",
        "discussion",
        "conclusion",
        "acknowledgments",
        "acknowledgment",
        "references",
    ]

    # Process text into sections and paragraphs
    paragraphs = text.split("\n\n")
    for paragraph in paragraphs:
        # Clean up the paragraph
        paragraph = paragraph.strip()
        if not paragraph:
            continue

        # Detect if the first line is bold using the new bold_lines set
        first_line = paragraph.split("\n")[0].strip()
        is_bold = (
            first_line in bold_lines
            or first_line.isupper()
            or re.match(r"^[0-9]+\.?[0-9]*\s+[A-Z]", first_line)
        )

        if is_bold or first_line.lower() in [k.lower() for k in KEYWORDS]:
            title = paragraph.split("\n")[0].strip()
            content = "\n".join(paragraph.split("\n")[1:]).strip()

            if re.match(r"^[0-9]", title) or any(
                keyword.lower() == title.lower().strip() for keyword in KEYWORDS
            ):
                if re.match(r"^[0-9]+\.[0-9]+\s+[A-Z]", title):
                    # This is a subsection
                    if current_section:
                        if "subsections" not in sections_dict[current_section]:
                            sections_dict[current_section]["subsections"] = {}

                        sections_dict[current_section]["subsections"][title] = {
                            "content": content
                        }
                    latex_content.append(f"\\subsection{{{title}}}\n\n{content}")
                else:
                    # This is a main section
                    current_section = title
                    sections_dict[title] = {"content": content, "subsections": {}}
                    latex_content.append(f"\\section{{{title}}}\n\n{content}")
            continue

        # If we're in a section, append to section content
        if current_section and current_section in sections_dict:
            sections_dict[current_section]["content"] += f"\n\n{paragraph}"

        # Regular paragraph handling
        latex_content.append(paragraph + "\n\n")

        # Escape special LaTeX characters
        paragraph = paragraph.replace("\\", "\\textbackslash")
        paragraph = paragraph.replace("&", "\\&")
        paragraph = paragraph.replace("%", "\\%")
        paragraph = paragraph.replace("$", "\\$")
        paragraph = paragraph.replace("#", "\\#")
        paragraph = paragraph.replace("_", "\\_")
        paragraph = paragraph.replace("{", "\\{")
        paragraph = paragraph.replace("}", "\\}")
        paragraph = paragraph.replace("~", "\\textasciitilde")
        paragraph = paragraph.replace("^", "\\textasciicircum")

        # Detect potential equations (basic detection)
        if re.search(r"[=<>≈≤≥±∑∏∫]", paragraph):
            paragraph = f"\\begin{{equation}}\n{paragraph}\n\\end{{equation}}"

        # Add paragraph to LaTeX content
        latex_content.append(paragraph + "\n\n")

    # Close document
    latex_content.append("\\end{document}")

    # Write to output file
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(latex_content))

    return sections_dict


if __name__ == "__main__":
    # Example usage
    input_pdf = "coMAL.pdf"
    output_latex = "output.tex"
    sections = pdf_to_latex(input_pdf, output_latex)
    print(sections)
