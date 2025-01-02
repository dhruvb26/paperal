import json
import os
import time

import fitz
import matplotlib.patches as patches
import matplotlib.pyplot as plt
from langchain_community.document_loaders import PyPDFLoader
from langchain_unstructured import UnstructuredLoader
from PIL import Image
from server.baml_connect.baml_client.types import References

start_time = time.time()

# def plot_pdf_with_boxes(pdf_page, segments):
#     pix = pdf_page.get_pixmap()
#     pil_image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

#     fig, ax = plt.subplots(1, figsize=(10, 10))
#     ax.imshow(pil_image)
#     categories = set()
#     category_to_color = {
#         "Title": "orchid",
#         "Image": "forestgreen",
#         "Table": "tomato",
#     }
#     for segment in segments:
#         points = segment["coordinates"]["points"]
#         layout_width = segment["coordinates"]["layout_width"]
#         layout_height = segment["coordinates"]["layout_height"]
#         scaled_points = [
#             (x * pix.width / layout_width, y * pix.height / layout_height)
#             for x, y in points
#         ]
#         box_color = category_to_color.get(segment["category"], "deepskyblue")
#         categories.add(segment["category"])
#         rect = patches.Polygon(
#             scaled_points, linewidth=1, edgecolor=box_color, facecolor="none"
#         )
#         ax.add_patch(rect)

#     # Make legend
#     legend_handles = [patches.Patch(color="deepskyblue", label="Text")]
#     for category in ["Title", "Image", "Table"]:
#         if category in categories:
#             legend_handles.append(
#                 patches.Patch(color=category_to_color[category], label=category)
#             )
#     ax.axis("off")
#     ax.legend(handles=legend_handles, loc="upper right")
#     plt.tight_layout()
#     plt.show()

# def render_page(doc_list: list, page_number: int, save_to_file=False) -> None:
#     pdf_page = fitz.open(file_path).load_page(page_number - 1)
#     page_docs = [
#         doc for doc in doc_list if doc.metadata.get("page_number") == page_number
#     ]
#     segments = [doc.metadata for doc in page_docs]

#     if save_to_file:
#         # Create directories if they don't exist
#         os.makedirs("pages_content", exist_ok=True)
#         os.makedirs("pages_metadata", exist_ok=True)

#         with open(f"pages_content/page_{page_number}.json", "w") as f:
#             json.dump([doc.page_content for doc in page_docs], f)

#         with open(f"pages_metadata/page_{page_number}.json", "w") as f:
#             json.dump([doc.metadata for doc in page_docs], f)


file_path = "Removed Document (1).pdf"
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

print(pages)

# Replace single render_page call with loop through all pages
# for page_num in range(1, total_pages + 1):
#     render_page(pages, page_num, save_to_file=True)

end_time = time.time()
execution_time = end_time - start_time
print(
    f"\nTotal execution time: {execution_time:.2f} seconds ({execution_time/60:.2f} minutes)"
)