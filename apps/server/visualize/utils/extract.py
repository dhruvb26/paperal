from langchain_community.document_loaders import PyPDFLoader


def extract_pdf_sections(pdf_url: str, headings: list[str]) -> dict[str, str]:
    """
    Extract sections from a PDF file based on provided headings.

    Args:
        pdf_url (str): URL of the PDF file
        headings (list[str]): List of headings to extract

    Returns:
        dict[str, str]: Dictionary mapping headings to their content
    """
    # Load and split PDF
    loader = PyPDFLoader(pdf_url)
    pages = loader.load_and_split()

    # Dictionary to store heading content
    heading_contents = {}
    total_content = ""

    # Process each page
    for page in pages:
        page_content = page.page_content.strip()
        total_content += page_content + "\n"  # Add newline between pages

    # Process each heading
    for i, heading in enumerate(headings):
        start_index = total_content.find(heading)

        if start_index != -1:
            content_start = start_index + len(heading)

            # Get content until next heading or end of document
            if i == len(headings) - 1:
                content = total_content[content_start:]
            else:
                next_heading = headings[i + 1]
                end_index = total_content.find(next_heading, start_index + len(heading))
                content = (
                    total_content[content_start:]
                    if end_index == -1
                    else total_content[content_start:end_index]
                )

            # Clean and store the content
            content = content.strip()
            if content:
                if heading not in heading_contents:
                    heading_contents[heading] = ""
                heading_contents[heading] += content + " "

    return heading_contents


if __name__ == "__main__":
    # PDF URL
    pdf_url = "https://arxiv.org/pdf/2406.06443"

    # List of headings to extract
    headings = [
        "Introduction",
        "Background and Baselines",
        "Metrics for LLM Membership Inference",
        "Problem Setup",
        "Failure of Membership Inference",
        "LLM Dataset Inference",
        "Procedure for the LLM Dataset Inference",
        "Assumptions for Dataset Inference",
        "Experimental Details",
        "Analysis and Results with Dataset Inference",
        "Discussions",
        "Acknowledgements",
        "Broader Impact",
        "Compute",
        "Additional Experiments",
    ]

    # Print results
    print("\n=== Final Results ===")
    for heading, content in extract_pdf_sections(pdf_url, headings).items():
        print(f"\n=== {heading} ===")
        print(f"Content length: {len(content)}")
        print(content[:200] + "...")
