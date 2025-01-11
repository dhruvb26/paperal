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

    # Process each page first
    for page in pages:
        page_content = page.page_content.strip()
        total_content += page_content + "\n"

    remaining_content = total_content
    # Process each heading
    for i, heading in enumerate(headings):
        # Look for both numbered and non-numbered versions of the heading
        # Pattern: optional number (e.g., "3", "3.2", etc.) followed by heading
        start_index = -1
        heading_variations = [
            heading,  # Original heading
            r"\d+\s*" + heading,  # Single number (e.g., "3 Introduction")
            r"\d+\.\d+\s*" + heading,  # Decimal number (e.g., "3.2 Introduction")
        ]

        for variation in heading_variations:
            found_index = remaining_content.find(variation)
            if found_index != -1:
                start_index = found_index
                break

        if start_index != -1:
            # Skip content before the heading
            remaining_content = remaining_content[start_index:]

            # Extract content after heading
            content_start = len(heading)

            # Find next heading if it exists
            next_start = -1
            for next_heading in headings[i + 1 :]:
                next_start = remaining_content.find(next_heading)
                if next_start != -1:
                    break

            # Extract content
            if next_start != -1:
                content = remaining_content[content_start:next_start]
                # Update remaining content for next iteration
                remaining_content = remaining_content[next_start:]
            else:
                content = remaining_content[content_start:]
                remaining_content = ""

            # Clean and store the content
            content = content.strip()
            if content:
                heading_contents[heading] = content

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
