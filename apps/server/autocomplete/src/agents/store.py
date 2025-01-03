import asyncio
import io
import logging
import os
from typing import Optional

import aiohttp
from utils.pdf_pages import check_pdf_pages
import fitz
from langchain.schema import Document
from langchain_openai import OpenAIEmbeddings
from supabase.client import create_client
import database
from utils.text import sanitize_text
from agents.generate import ExtractPaperAgent, generate_in_text_citation

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
except Exception as e:
    logging.error("Error initializing supabase client")
    raise


async def StoreResearchPaperAgent(
    research_url: list[str], user_id: Optional[str] = None
) -> bool:
    try:
        if not research_url:
            logging.warning("No URLs provided.")
            return False

        async with aiohttp.ClientSession() as session:

            for url in research_url:
                try:
                    async with session.get(url) as response:
                        if response.status != 200:
                            logging.warning(
                                f"Failed to fetch PDF. Status code: {response.status}"
                            )
                            continue

                        logging.info(f"Downloading PDF from URL: {url}")
                        pdf_data = await response.read()
                        pdf_content = io.BytesIO(pdf_data)
                        page_count = check_pdf_pages(pdf_content)

                        # Skip if PDF is invalid or too long
                        if not (0 < page_count <= 30):
                            logging.warning(
                                f"Skipping PDF with {page_count} pages: {url}"
                            )
                            continue
                        # Check if already stored
                        # Check if already stored
                        checker = database.query_metadata(
                            "fileUrl", url, supabase_client, user_id
                        )
                        if len(checker.data) != 0:
                            logging.warning(f"Research paper already stored: {url}")
                            continue
                        # Process valid PDF
                        # Process valid PDF
                        pdf_document = fitz.open(stream=pdf_data, filetype="pdf")
                        text = await asyncio.to_thread(
                            lambda: "".join(page.get_text() for page in pdf_document)
                        )
                        text = sanitize_text(text)
                        # Extract and store document
                        extracted_info = await ExtractPaperAgent(text)
                        docum = Document(page_content=text)
                        docs = database.split_documents([docum])
                        logging.info("Created document")
                        # Store in
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
                            "is_public": user_id is None,
                        }

                        library_response = (
                            supabase_client.table("library").insert(data).execute()
                        )
                        library_id = library_response.data[0]["id"]

                        database.add_metadata(
                            docs,
                            url,
                            extracted_info.author,
                            extracted_info.title,
                            extracted_info.year,
                            user_id,
                            library_id,
                        )

                        vector_store = database.create_vector_store(supabase_client)
                        vector_store.add_documents(docs)

                        logging.info(f"Successfully stored paper: {url}")

                except Exception as e:
                    logging.error(f"Error processing URL: {e}")
                    continue

        return True
    except Exception as e:
        logging.error(f"Error in StoreResearchPaperAgent: {e}")
        return False
