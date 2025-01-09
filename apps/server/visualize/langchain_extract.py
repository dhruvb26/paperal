from langchain_community.document_loaders import PyPDFLoader
import fitz
import matplotlib.patches as patches
from langchain_unstructured import UnstructuredLoader
import matplotlib.pyplot as plt
from PIL import Image
import json
import os
import time
import re

start_time = time.time()


def plot_pdf_with_boxes(pdf_page, segments):
    pix = pdf_page.get_pixmap()
    pil_image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

    fig, ax = plt.subplots(1, figsize=(10, 10))
    ax.imshow(pil_image)
    categories = set()
    category_to_color = {
        "Title": "orchid",
        "Image": "forestgreen",
        "Table": "tomato",
        "Equation": "gold",
    }
    for segment in segments:
        points = segment["coordinates"]["points"]
        layout_width = segment["coordinates"]["layout_width"]
        layout_height = segment["coordinates"]["layout_height"]
        scaled_points = [
            (x * pix.width / layout_width, y * pix.height / layout_height)
            for x, y in points
        ]
        box_color = category_to_color.get(segment["category"], "deepskyblue")
        categories.add(segment["category"])
        rect = patches.Polygon(
            scaled_points, linewidth=1, edgecolor=box_color, facecolor="none"
        )
        ax.add_patch(rect)

    # Make legend
    legend_handles = [patches.Patch(color="deepskyblue", label="Text")]
    for category in ["Title", "Image", "Table", "Equation"]:
        if category in categories:
            legend_handles.append(
                patches.Patch(color=category_to_color[category], label=category)
            )
    ax.axis("off")
    ax.legend(handles=legend_handles, loc="upper right")
    plt.tight_layout()
    plt.show()


def is_likely_heading(text):
    text = text.strip()
    
    # Pattern 1: All caps with numbers before them (e.g., "1. INTRODUCTION", "2.1 METHODS")
    pattern1 = r'^\d+(?:\.\d+)*\s+[A-Z][A-Z\s\d]+$'
    
    # Pattern 2: All caps with Roman numerals (e.g., "III. STATISTICALLY UNSOUND TRAINING DATA PROOFS")
    pattern2 = r'^(?:I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)\.?\s+[A-Z][A-Z\s\d]+$'
    
    # Pattern 3: Title case starting with numbers (e.g., "1.2 Machine Learning Methods")
    pattern3 = r'^\d+(?:\.\d+)*\s+(?:[A-Z][a-z\d]+\s*)+$'
    
    # Pattern 4: Short all-caps phrases (e.g., "INTRODUCTION", "METHODS AND RESULTS")
    pattern4 = r'^[A-Z][A-Z\s\d]{2,30}$'
    
    # Pattern 5: Title case phrases without numbers (e.g., "Machine Learning Methods")
    pattern5 = r'^(?:[A-Z][a-z\d]+\s*){2,}$'
    
    # Pattern 6: Mixed case with common title words
    common_title_words = r'(?:Introduction|Abstract|Conclusion|Discussion|Results|Methods|Background|References)'
    pattern6 = f'^{common_title_words}(?:\s+|$)'
    
    return bool(
        re.match(pattern1, text) or 
        re.match(pattern2, text) or 
        re.match(pattern3, text) or
        re.match(pattern4, text) or
        re.match(pattern5, text) or
        re.search(pattern6, text, re.IGNORECASE)
    )


def is_likely_equation(text):
    # Common mathematical symbols and patterns
    math_symbols = r'[+\-=×÷∫∑∏√∆∇∈∉≠≈≤≥±∞∂]'
    greek_letters = r'[αβγδεζηθικλμνξπρστυφχψω]'
    
    # Patterns that suggest equations:
    # 1. Contains multiple mathematical symbols
    # 2. Contains numbers and variables with subscripts/superscripts
    # 3. Contains Greek letters
    patterns = [
        r'.*' + math_symbols + r'.*' + math_symbols + r'.*',  # Multiple math symbols
        r'\d+[a-zA-Z]',  # Numbers followed by variables
        r'.*' + greek_letters + r'.*',  # Contains Greek letters
        r'.*[_\^]\{.*\}.*',  # LaTeX-style subscripts/superscripts
        r'\$.*\$'  # LaTeX equation delimiters
    ]
    
    return any(re.search(pattern, text, re.IGNORECASE) for pattern in patterns)


def render_page(doc_list: list, page_number: int, save_to_file=False) -> None:
    pdf_page = fitz.open(file_path).load_page(page_number - 1)
    page_docs = [
        doc for doc in doc_list if doc.metadata.get("page_number") == page_number
    ]

    # Get the page as a PIL Image
    pix = pdf_page.get_pixmap()
    pil_image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

    # Extract images from green boxes
    if save_to_file:
        os.makedirs("extracted_images", exist_ok=True)
        for idx, doc in enumerate(page_docs):
            if doc.metadata["category"] == "Image":
                points = doc.metadata["coordinates"]["points"]
                layout_width = doc.metadata["coordinates"]["layout_width"]
                layout_height = doc.metadata["coordinates"]["layout_height"]

                # Scale the points to match the actual image dimensions
                scaled_points = [
                    (
                        int(x * pix.width / layout_width),
                        int(y * pix.height / layout_height),
                    )
                    for x, y in points
                ]

                # Get bounding box coordinates
                left = min(p[0] for p in scaled_points)
                top = min(p[1] for p in scaled_points)
                right = max(p[0] for p in scaled_points)
                bottom = max(p[1] for p in scaled_points)

                # Crop the image
                cropped_image = pil_image.crop((left, top, right, bottom))
                # Save the cropped image
                cropped_image.save(
                    f"extracted_images/page_{page_number}_image_{idx}.png"
                )

    # Update segments with new heading and equation detection
    for doc in page_docs:
        if doc.metadata.get('category') == 'Text':
            if is_likely_heading(doc.page_content):
                doc.metadata['category'] = 'Title'
            elif is_likely_equation(doc.page_content):
                doc.metadata['category'] = 'Equation'
    
    segments = [doc.metadata for doc in page_docs]

    # Add this section to print titles
    titles = [doc.page_content for doc in page_docs if doc.metadata["category"] == "Title"]
    if titles:
        print(f"\nTitles found on page {page_number}:")
        for title in titles:
            print(f"- {title}")

    plot_pdf_with_boxes(pdf_page, segments)

    if save_to_file:
        # Create directories if they don't exist
        os.makedirs("pages_content", exist_ok=True)
        os.makedirs("pages_metadata", exist_ok=True)

        with open(f"pages_content/page_{page_number}.json", "w") as f:
            json.dump([doc.page_content for doc in page_docs], f)

        with open(f"pages_metadata/page_{page_number}.json", "w") as f:
            json.dump([doc.metadata for doc in page_docs], f)


file_path = "2310.17623 Paper_removed.pdf"
pdf_document = fitz.open(file_path)
total_pages = pdf_document.page_count
pdf_document.close()

loader = UnstructuredLoader(
    file_path=file_path,
    strategy="hi_res",
)
pages = []
for page in loader.lazy_load():
    pages.append(page)

# Replace single render_page call with loop through all pages
for page_num in range(1, total_pages + 1):
    render_page(pages, page_num, save_to_file=True)

# render_page(pages, 2, save_to_file=False)

end_time = time.time()
execution_time = end_time - start_time
print(
    f"\nTotal execution time: {execution_time:.2f} seconds ({execution_time/60:.2f} minutes)"
)
