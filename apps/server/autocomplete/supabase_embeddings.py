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
    Returns a list of tuples (Document, score) sorted by relevance.
    """
    logging.info(f"Querying vector store for: {query}")

    try:
        # Get initial results
        results = vector_store.similarity_search_with_relevance_scores(
            query, 
            k=k * 4  # Get more initial results for better diversity
        )
        logging.info(f"Initial search returned {len(results)} results")

        if not results:
            logging.warning("No results found in vector store")
            return []

        # Group results by document metadata to ensure diversity
        doc_groups = {}
        for doc, score in results:
            # Create a key from the document's metadata
            doc_key = (
                doc.metadata.get('library_id', ''),  # Using library_id as the primary grouping key
                doc.metadata.get('title', '')        # Title as secondary grouping key
            )
            if doc_key not in doc_groups:
                doc_groups[doc_key] = []
            doc_groups[doc_key].append((doc, score))

        # Take top results from each document
        diverse_results = []
        for group in doc_groups.values():
            # Sort each group by score and take top 2
            sorted_group = sorted(group, key=lambda x: x[1], reverse=True)
            diverse_results.extend(sorted_group[:2])

        # Rerank the diverse results
        pairs = [(query, doc.page_content) for doc, _ in diverse_results]
        rerank_scores = _reranker.predict(pairs)

        # Combine reranker scores with documents and sort
        final_results = sorted(
            zip(diverse_results, rerank_scores),
            key=lambda x: x[1],  # Sort by reranker score
            reverse=True
        )

        # Return top k results in the original (Document, score) format
        print(final_results)
        return [(doc, score) for (doc, _), score in final_results[:k]]

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
