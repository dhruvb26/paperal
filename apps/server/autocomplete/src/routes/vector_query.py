from fastapi import APIRouter
from functools import lru_cache
import os
from supabase.client import create_client
import logging
from openai import OpenAI
from typing import List
from langchain.schema import Document

router = APIRouter()

logging = logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s", force=True
)


@lru_cache
def _cached_client_supabase():
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
        return supabase_client

    except Exception as e:
        logging.error(f"Error creating Supabase client: {e}")


@lru_cache
def _cached_client_openai():
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


@router.get("/vector_query")
async def vector_query(query: str) -> List[Document]:
    """
    Optimized vector store query with reranking and caching.
    """
    logging.info(f"Querying vector store for: {query}")

    try:
        # Use cached embedding
        openai_client = _cached_client_openai()
        embedding_response = openai_client.embeddings.create(
            model="text-embedding-3-large", input=query, dimensions=1536
        )
        embedding = embedding_response.data[0].embedding

        # Call hybrid_search function via RPC with all required parameters
        # score is between 0 and 0.0392
        supabase_client = _cached_client_supabase()
        documents = supabase_client.rpc(
            "hybrid_search",
            {
                "query_text": query,
                "query_embedding": embedding,
                "match_count": 2,
                # "rrf_k": 0,
            },
        ).execute()
        return documents

    except Exception as e:
        logging.error(f"Error in query_vector_store: {str(e)}", exc_info=True)
        raise e
