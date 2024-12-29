import os
import dotenv
import logging
from langchain_community.vectorstores import SupabaseVectorStore
from langchain_openai import OpenAIEmbeddings
from supabase.client import Client, create_client
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.schema import Document
from typing import Optional, List
import re
from sentence_transformers import CrossEncoder
from openai import OpenAI

# Configure logging
logging.basicConfig(
    level=logging.INFO,
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
    logging.info(f"Loaded {len(documents)} pages")
    return documents


def split_documents(documents: List[Document]) -> List[Document]:
    logging.info("Splitting documents...")
    # Using RecursiveCharacterTextSplitter for better semantic splitting
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,  
        chunk_overlap=0,
    )
    split_docs = text_splitter.split_documents(documents)
    logging.info(f"Split into {len(split_docs)} chunk(s).")
    return split_docs


def add_metadata(
    docs: List[Document],
    url: str,
    author: str,
    title: str,
    year: int,
    user_id: Optional[str] = None,
    library_id: Optional[str] = None,
):
    logging.info("Adding metadata to documents...")
    for doc in docs:
        doc.metadata["source"] = url
        doc.metadata["author"] = author
        doc.metadata["title"] = title
        doc.metadata["year"] = year
        doc.metadata["user_id"] = user_id
        doc.metadata["library_id"] = library_id
    logging.info("Metadata added.")


def query_metadata(field, value, supabase, user_id: Optional[str] = None):
    logging.info(f"Querying : {field} = {value}")
    field = f"metadata->>{field}"
    if user_id:
        response = (
            supabase.from_("library").select("*").eq(field, value).eq("user_id", user_id).execute()
        )
    else:
        response = (
            supabase.from_("library").select("*").eq(field, value).is_("user_id", None).execute()
        )
    logging.info(f"Query returned {len(response.data)} result(s).")
    return response


def query_vector_store(
    query: str,
  
) -> List[Document]:
    """
    Optimized vector store query with reranking.
    """
    logging.info(f"Querying vector store for: {query}")

    try:
        supabase_client = create_supabase_client()
        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    # Generate embedding for the query
        embedding_response = openai_client.embeddings.create(
            model="text-embedding-3-large",
            input=query,
            dimensions=1536
        )
    
        embedding = embedding_response.data[0].embedding

        # Call hybrid_search function via RPC with all required parameters
        documents = supabase_client.rpc(
            'hybrid_search',
            {
                'query_text': query,
                'query_embedding': embedding,
                'match_count': 10,
                
            }
        ).execute()
        # json.stringify(documents)
    
        return documents

    except Exception as e:
        logging.error(f"Error in query_vector_store: {str(e)}", exc_info=True)
        raise


def create_vector_store(embeddings, supabase: Client) -> SupabaseVectorStore:
    logging.info("Creating vector store...")

    vector_store = SupabaseVectorStore(
        client=supabase,
        embedding=embeddings,
        table_name="embeddings",  # your table name
        query_name="hybrid_search" # your search function name
    )
    logging.info("Vector store created successfully.")
    return vector_store


if __name__ == "__main__":
    logging.info("Starting script...")
    try:
        supabase = create_supabase_client()
        embeddings = OpenAIEmbeddings(api_key=os.getenv("OPENAI_API_KEY"))
        documents = load_documents("attention.pdf")
        docs = split_documents(documents)
        add_metadata(docs, "Attention url", "John Doe", "Attention is all you need", 2021)
        vector_store = create_vector_store(docs, embeddings, supabase)
        # print(
        #     query_vector_store(
        #         "Moreover, this investigation can aid in identifying scenarios where smaller datasets may suffice, or where expanding the dataset size is necessary to achieve desired levels of accuracy and reliability in inferential outcomes.",
        #         vector_store,
        #     )
        # )
    except Exception as e:
        logging.error(f"An error occurred: {e}")
