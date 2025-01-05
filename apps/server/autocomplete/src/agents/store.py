import io
import logging
import os
from typing import Optional
from utils.pdf_pages import check_pdf_pages
import fitz
from langchain.schema import Document
from supabase.client import create_client
import database
from agents.generate import ExtractPaperAgent, generate_in_text_citation
from datetime import datetime
import requests

# Add logging configuration at the start of the file
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)


try:
    logging.info("Creating Supabase client...")
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    if not supabase_url or not supabase_key:
        logging.error(
            "Supabase URL or Service Key is missing in environment variables."
        )
        raise ValueError("Supabase URL or Service Key is not set.")
    supabase_client = create_client(supabase_url, supabase_key)
    logging.info("Supabase client created successfully.")
except Exception as e:
    logging.error(f"Error creating Supabase client: {e}")


def StoreResearchPaperAgent(
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

                # Check if already stored
                checker = database.query_metadata(
                    "fileUrl", url, supabase_client, user_id
                )
                if len(checker.data) != 0:
                    logging.warning(f"Research paper already stored: {url}")
                    continue

                # Process valid PDF
                pdf_document = fitz.open(stream=pdf_data, filetype="pdf")
                text = "".join(page.get_text() for page in pdf_document)
                # Extract and store document
                extracted_info = ExtractPaperAgent(text)
                docum = Document(page_content=text)
                docs = database.split_documents([docum])
                logging.info("Created document")

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
                    "user_id": user_id,
                    "metadata": metadata_for_library,
                    "is_public": is_public,
                }

                library_response = (
                    supabase_client.table("library").insert(data).execute()
                )
                library_id = library_response.data[0]["id"]

                # embeddings table
                database.add_metadata(
                    docs,
                    url,
                    extracted_info.author,
                    extracted_info.title,
                    extracted_info.year,
                    user_id,
                    library_id,
                    is_public,
                )

                vector_store = database.create_vector_store(supabase_client)
                vector_store.add_documents(docs)

                logging.info(f"Successfully stored paper: {url}")

            except Exception as e:
                logging.error(f"Error processing URL: {e}")
                continue

        print(datetime.now())
        return True
    except Exception as e:
        logging.error(f"Error in StoreResearchPaperAgent: {e}")
        return False
