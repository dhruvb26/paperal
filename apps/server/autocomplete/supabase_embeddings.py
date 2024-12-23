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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)

dotenv.load_dotenv()

_reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")


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
        chunk_size=500,  # Smaller chunks for better context
        chunk_overlap=50,
        length_function=len,
        separators=["\n\n", "\n", ".", "!", "?", " ", ""],  # Hierarchical splitting
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
    vector_store: SupabaseVectorStore,
    k: int = 5,
) -> List[Document]:
    """
    Query the vector store with improved filtering and reranking.
    """
    logging.info(f"Querying vector store for: {query}")

    try:
        # results = vector_store.similarity_search(
        #     query, k=k * 2  # Get more results initially for reranking
        # )
        results = vector_store.similarity_search(query, k=k)
        logging.info(f"Initial search returned {len(results)} results")

        if not results:
            logging.warning("No results found in vector store")
            return []

        # Filter by similarity threshold
        filtered_results = [doc for doc in results]

        if not filtered_results:
            logging.warning("No results passed similarity threshold")
            return []

        # Rerank results using global cross-encoder instance
        pairs = [(query, doc.page_content) for doc in filtered_results]
        rerank_scores = _reranker.predict(pairs)

        # Sort by reranker scores and take top k
        reranked_pairs = sorted(zip(rerank_scores, filtered_results), reverse=True)
        final_results = [(doc, score) for score, doc in reranked_pairs[:k]]

        logging.info(f"Final reranked results: {len(final_results)} documents")
        return final_results

    except Exception as e:
        logging.error(f"Error in query_vector_store: {str(e)}", exc_info=True)
        raise


def create_vector_store(docs: List[Document], embeddings, supabase: Client) -> SupabaseVectorStore:
    logging.info("Creating vector store...")

    vector_store = SupabaseVectorStore.from_documents(
        docs,
        embeddings,
        client=supabase,
        table_name="embeddings",
        query_name="match_documents",
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
