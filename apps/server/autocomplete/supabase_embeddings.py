import os
import dotenv
import logging
from langchain_community.vectorstores import SupabaseVectorStore
from langchain_openai import OpenAIEmbeddings
from supabase.client import Client, create_client
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import CharacterTextSplitter
from langchain.schema import Document
from typing import Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,  # Set to DEBUG for more detailed logs
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)

dotenv.load_dotenv()


def create_supabase_client():
    logging.info("Creating Supabase client...")
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    if not supabase_url or not supabase_key:
        logging.error("Supabase URL or Service Key is missing in environment variables.")
        raise ValueError("Supabase URL or Service Key is not set.")
    return create_client(supabase_url, supabase_key)


def load_documents(file_path):
    logging.info(f"Loading documents from file: {file_path}")
    loader = PyPDFLoader(file_path)
    documents = loader.load()
    logging.info(f"Loaded {len(documents)} document(s).")
    return documents


def split_documents(documents):
    logging.info("Splitting documents...")
    text_splitter = CharacterTextSplitter(
        chunk_size=2000,
        chunk_overlap=150,
        length_function=len,
        separator=" ",  # Split on spaces to avoid breaking words
        is_separator_regex=False,
    )
    split_docs = text_splitter.split_documents(documents)
    logging.info(f"Split into {len(split_docs)} chunk(s).")
    return split_docs


def split_text(text):
    """
    Splits input text into chunks using CharacterTextSplitter.

    Args:
        text (str): The text to be split into chunks.

    Returns:
        List[str]: A list of text chunks.
    """
    logging.info("Splitting text...")
    text_splitter = CharacterTextSplitter(
        chunk_size=2000,
        chunk_overlap=150,
        length_function=len,
        separator=" ",  # Split on spaces to avoid breaking words
        is_separator_regex=False,
    )
    split_texts = text_splitter.split_text(text)
    logging.info(f"Text split into {len(split_texts)} chunk(s).")
    return split_texts


def add_metadata(docs, source, author, title, user_id: Optional[str] = None):
    logging.info("Adding metadata to documents...")
    for doc in docs:
        doc.metadata["source"] = source
        doc.metadata["author"] = author
        doc.metadata["title"] = title
        doc.metadata["user_id"] = user_id
    logging.info("Metadata added.")


def query_metadata(field, value, supabase, user_id: Optional[str] = None):
    logging.info(f"Querying metadata: {field} = {value}")
    field = f"metadata->>{field}"
    response = (
        supabase.from_("documents")
        .select("*")
        .eq(field, value)
        .filter("metadata->>user_id", "is", "null")
        .execute()
    )
    logging.info(f"Query returned {len(response.data)} result(s).")
    return response


def create_vector_store(docs, embeddings, supabase):
    logging.info("Creating vector store...")
    vector_store = SupabaseVectorStore.from_documents(
        docs,
        embeddings,
        client=supabase,
        table_name="documents",
        query_name="match_documents",
        chunk_size=1000,
    )
    logging.info("Vector store created successfully.")
    return vector_store


# Example usage (commented out to avoid accidental execution):
# if __name__ == "__main__":
#     logging.info("Starting script...")
#     try:
#         supabase = create_supabase_client()
#         embeddings = OpenAIEmbeddings(api_key=os.getenv("OPENAI_API_KEY"))
#         documents = load_documents("attention.pdf")
#         docs = split_documents(documents)
#         add_metadata(docs, "Attention url", "John Doe", "Attention is all you need")
#         vector_store = create_vector_store(docs, embeddings, supabase)
#         logging.info("Script completed successfully.")
#     except Exception as e:
#         logging.error(f"An error occurred: {e}")
