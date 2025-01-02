import logging
import os
from typing import List, Optional

import dotenv
from langchain.schema import Document
from langchain_community.vectorstores import SupabaseVectorStore
from langchain_openai import OpenAIEmbeddings
from openai import OpenAI
from supabase.client import Client, create_client
from utils.docs import split_documents, load_documents

# Configure logging
logger = logging.getLogger(__name__)

dotenv.load_dotenv()

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
    logging.error(f"Failed to create Supabase client: {str(e)}")
    raise


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
            supabase.from_("library")
            .select("*")
            .eq(field, value)
            .eq("user_id", user_id)
            .execute()
        )
    else:
        response = (
            supabase.from_("library")
            .select("*")
            .eq(field, value)
            .is_("user_id", None)
            .execute()
        )
    logging.info(f"Query returned {len(response.data)} result(s).")
    return response


def query_vector_store(query: str) -> List[Document]:
    """
    Optimized vector store query with reranking.
    """
    logging.info(f"Querying vector store for: {query}")

    try:

        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        # Generate embedding for the query
        embedding_response = openai_client.embeddings.create(
            model="text-embedding-3-large", input=query, dimensions=1536
        )

        embedding = embedding_response.data[0].embedding

        # Call hybrid_search function via RPC with all required parameters
        # score is between 0 and 0.0392
        documents = supabase_client.rpc(
            "hybrid_search",
            {
                "query_text": query,
                "query_embedding": embedding,
                "match_count": 10,
            },
        ).execute()
        return documents

    except Exception as e:
        logging.error(f"Error in query_vector_store: {str(e)}", exc_info=True)
        raise


def create_vector_store(supabase: Client) -> SupabaseVectorStore:
    logging.info("Creating vector store...")
    embeddings = OpenAIEmbeddings(
        model="text-embedding-3-large",
        dimensions=1536,
        api_key=os.getenv("OPENAI_API_KEY"),
    )

    vector_store = SupabaseVectorStore(
        client=supabase,
        embedding=embeddings,
        table_name="embeddings",
        query_name="hybrid_search",
    )
    logging.info("Vector store created successfully.")
    return vector_store


if __name__ == "__main__":

    def main():
        logging.info("Starting script...")
        try:
            documents = load_documents("attention.pdf")
            docs = split_documents(documents)
            add_metadata(
                docs, "Attention url", "John Doe", "Attention is all you need", 2021
            )
            vector_store = create_vector_store(supabase_client)
            vector_store.add_documents(docs)
        except Exception as e:
            logging.error(f"An error occurred: {e}")

    # Run the async main function
    main()