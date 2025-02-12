import os
from pinecone import Pinecone
from langchain_openai import OpenAIEmbeddings
from dotenv import load_dotenv
from langchain_core.documents import Document
from typing import List, Optional
import logging
import tiktoken
from dataclasses import dataclass
import requests
import fitz
from uuid import uuid4
from functools import lru_cache

load_dotenv()

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
EMBEDDINGS = OpenAIEmbeddings(
    api_key=os.getenv("OPENAI_API_KEY"), model="text-embedding-3-large"
)
index = pc.Index("paperal-index")


def load_pdf_from_url(urls: List[str]) -> Optional[List[Document]]:
    documents = []

    for url in urls:
        try:
            response = requests.get(url, timeout=5)
            response.raise_for_status()

            logging.info(f"Downloading PDF from URL: {url}")
            pdf_data = response.content
            pdf_document = fitz.open(stream=pdf_data, filetype="pdf")

            # Extract text from all pages
            for page_num, page in enumerate(pdf_document):
                text = page.get_text()

                document = Document(
                    page_content=text,
                    metadata={
                        "source": url,
                    },
                )
                print(document.metadata)
                documents.append(document)

        except requests.RequestException as e:
            logging.error(f"Network error downloading PDF from URL {url}: {str(e)}")
            return None
        except fitz.FileDataError as e:
            logging.error(f"Error parsing PDF from URL {url}: {str(e)}")
            return None
        except Exception as e:
            logging.error(f"Unexpected error processing URL {url}: {str(e)}")
            return None

    if not documents:
        logging.warning("No documents were successfully loaded")
        return None

    logging.info(f"Successfully loaded {len(documents)} documents")
    return documents


@dataclass
class TextChunk:
    text: str
    metadata: dict


@lru_cache(maxsize=None)
def get_tokenizer(model: str = "text-embedding-3-large"):
    """Cached tokenizer retrieval."""
    try:
        encoding = tiktoken.encoding_for_model(model)
    except KeyError:
        encoding = tiktoken.get_encoding("cl100k_base")
    return encoding


def clean_text(text: str) -> str:
    """Optimized text cleaning."""
    text = " ".join(text.replace("\n", " ").split())
    return text


def split_documents(
    documents: List[Document], chunk_size: int = 512
) -> List[TextChunk]:
    """Split documents into chunks based on token count with overlap."""
    logging.info("Splitting documents using token-based sliding windows...")

    tokenizer = get_tokenizer()
    chunks = []

    for doc in documents:
        # Clean the text before tokenization
        cleaned_text = clean_text(doc.page_content)

        # Get token integers for the cleaned text
        tokens = tokenizer.encode(cleaned_text)

        for i in range(0, len(tokens), chunk_size):
            chunk_tokens = tokens[i : i + chunk_size]
            chunk_text = tokenizer.decode(chunk_tokens)
            print()

            chunk = TextChunk(
                text=chunk_text,
                metadata={
                    "source": doc.metadata.get("source", "unknown"),
                },
            )
            chunks.append(chunk)

    logging.info(f"Split into {len(chunks)} chunks with {chunk_size} tokens each.")
    return chunks


def generate_embeddings(
    chunks: List[TextChunk], batch_size: int = 100
) -> List[List[float]]:
    logging.info("Generating embeddings...")
    try:
        # Extract just the text from each TextChunk
        texts = [chunk.text for chunk in chunks]
        embeddings = []

        # Process documents in batches
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            batch_embeddings = EMBEDDINGS.embed_documents(batch)
            embeddings.extend(batch_embeddings)

        logging.info(f"Generated {len(embeddings)} embeddings.")
        return embeddings
    except Exception as e:
        logging.error(f"Error generating embeddings: {str(e)}")
        raise


def process_documents_batch(
    docs: List[Document], batch_size: int = 100, metadata: dict = {}
):
    """Process documents and add them to Pinecone with UUIDs"""
    # Process all documents at once
    split_docs = split_documents(docs)

    # Process in smaller batches to optimize memory usage
    for i in range(0, len(split_docs), batch_size):
        batch = split_docs[i : i + batch_size]
        embeddings = generate_embeddings(batch, batch_size=min(100, len(batch)))

        vectors_to_upsert = [
            {
                "id": str(uuid4()),
                "values": embedding,
                "metadata": {
                    "text": chunk.text,
                    **metadata,
                },
            }
            for chunk, embedding in zip(batch, embeddings)
        ]

        if vectors_to_upsert:
            index.upsert(vectors=vectors_to_upsert)
            logging.info(
                f"Upserted batch of {len(vectors_to_upsert)} vectors to Pinecone"
            )


def get_query_embeddings(query: str) -> list[float]:
    return EMBEDDINGS.embed_query(query)


def query_pinecone_index(
    query_embeddings: list, top_k: int = 2, include_metadata: bool = True
) -> dict[str, any]:
    query_response = index.query(
        vector=query_embeddings, top_k=top_k, include_metadata=include_metadata
    )
    return query_response


def delete_pinecone_data():
    index.delete(delete_all=True)


if __name__ == "__main__":
    # logging.basicConfig(
    #     level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
    # )

    # urls = ["https://arxiv.org/pdf/1706.03762"]

    # try:
    #     # documents = load_pdf_from_url(urls)
    #     # if documents:
    #     #     process_documents_batch(documents)

    #     logging.info("Querying Pinecone index...")
    #     query_embeddings = get_query_embeddings(query="attention, multi-head")
    #     query_response = query_pinecone_index(query_embeddings)

    #     logging.info("Query response: %s", query_response)
    # except Exception as e:
    #     logging.error(f"Error in main execution: {str(e)}")
    delete_pinecone_data()
