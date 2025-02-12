import io
import logging
import os
from typing import Optional
from utils.pdf_pages import check_pdf_pages
import fitz
from langchain.schema import Document
import database
from agents.generate import ExtractPaperAgent
from datetime import datetime
import requests
import re
from agents.store_pinecone import process_documents_batch


# Add logging configuration at the start of the file
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)


def generate_in_text_citation(authors: list[str], year: str) -> str:
    """
    Generate APA-style in-text citation given authors and year.

    Args:
        authors: List of author names
        year: Publication year

    Returns:
        str: Formatted in-text citation

    Examples:
        >>> generate_in_text_citation(["Smith"], "2020")
        "Smith (2020)"
        >>> generate_in_text_citation(["Smith", "Jones"], "2020")
        "Smith & Jones (2020)"
        >>> generate_in_text_citation(["Smith", "Jones", "Williams"], "2020")
        "Smith et al. (2020)"
    """
    if not authors or not year:
        return ""
    if not year.isdigit() or len(year) != 4:
        year = ""

    if len(authors) == 1 and year:
        return f"({authors[0]},{year})"
    elif len(authors) == 2 and year:
        return f"({authors[0]} & {authors[1]},{year})"
    elif year == "" and authors != []:
        return f"({authors[0]} et al.)"
    elif authors == [] and year == "":
        return ""
    elif authors == [] and year != "":
        return f"({year})"
    else:
        return f"({authors[0]} et al.,{year})"


def store_research_paper_agent(
    research_url: list[str],
    user_id: Optional[str] = None,
    is_public: Optional[bool] = True,
) -> bool:
    try:
        if not research_url:
            logging.warning("No URLs provided.")
            return False

        print(datetime.now())

        for url in research_url:
            try:
                response = requests.get(url)
                if response.status_code != 200:
                    logging.warning(
                        f"Failed to fetch PDF. Status code: {response.status_code}"
                    )
                    continue

                logging.info(f"Downloading PDF from URL: {url}")
                pdf_data = response.content
                pdf_content = io.BytesIO(pdf_data)
                page_count = check_pdf_pages(pdf_content)

                # Skip if PDF is invalid or too long
                if not (0 < page_count <= 30):
                    logging.warning(f"Skipping PDF with {page_count} pages: {url}")
                    continue

                # Process valid PDF
                pdf_document = fitz.open(stream=pdf_data, filetype="pdf")
                text = ""
                for page in pdf_document:
                    text += page.get_text()

                # Extract and store document
                extracted_info = ExtractPaperAgent(text[:1200])
                if extracted_info.year == "":
                    # Try to extract year from URL using regex pattern for 4 digits

                    year_match = re.search(r"/(\d{4})/", url)
                    extracted_info.year = year_match.group(1) if year_match else ""
                docum = Document(page_content=text)

                # Ensure user_id is a string or empty string instead of None
                safe_user_id = str(user_id) if user_id is not None else ""

                # logging.info("Created document")
                # docs = database.split_documents([docum])
                # logging.info("Split documents")

                # Store in database
                metadata_for_library = {
                    "fileUrl": url,
                    "authors": extracted_info.author,
                    "year": extracted_info.year,
                    "citations": {
                        "in-text": generate_in_text_citation(
                            extracted_info.author, extracted_info.year
                        ),
                    },
                }

                data = {
                    "title": extracted_info.title,
                    "description": extracted_info.abstract,
                    "user_id": user_id if user_id else None,
                    "metadata": metadata_for_library,
                    "is_public": is_public,
                }

                library_response = (
                    database.supabase_client.table("library").insert(data).execute()
                )
                library_id = library_response.data[0]["id"]
                print(url)

                process_documents_batch(
                    [docum],
                    metadata={
                        "url": url,
                        "authors": extracted_info.author,
                        "title": extracted_info.title,
                        "year": extracted_info.year,
                        "user_id": safe_user_id,
                        "library_id": library_id,
                        "is_public": is_public,
                    },
                )

                # embeddings table
                # database.add_metadata(
                #     docs,
                #     url,
                #     extracted_info.author,
                #     extracted_info.title,
                #     extracted_info.year,
                #     safe_user_id,
                #     library_id,
                #     is_public,
                # )

                # database.vector_store.add_documents(docs)

                logging.info(f"Successfully stored paper: {url}")

            except Exception as e:
                logging.error(f"Error processing URL: {e}")
                continue

        print(datetime.now())
        return True
    except Exception as e:
        logging.error(f"Error in StoreResearchPaperAgent: {e}")
        return False
