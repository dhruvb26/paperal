from fastapi import APIRouter
from functools import lru_cache
import os
from supabase.client import create_client
import logging
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv(override=True)


router = APIRouter()

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s", force=True
)



@lru_cache
def _cached_client_openai():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        logging.error("OpenAI API key is not configured")
        return None
    return OpenAI(api_key=api_key)


@router.get("/vector_query")
async def vector_query(query: str, num_results: int = 2) -> dict:
    """
    Optimized vector store query with reranking and caching.
    """
    logging.info(f"Querying vector store for: {query}")

    try:
        # Use cached embedding
        openai_client = _cached_client_openai()
        if not openai_client:
            logging.error("OpenAI client is not available")
            return {"error": "OpenAI client not configured"}
            
        embedding_response = openai_client.embeddings.create(
            model="text-embedding-3-large", input=query, dimensions=1536
        )
        embedding = embedding_response.data[0].embedding

        # Call hybrid_search function via RPC with all required parameters
        # score is between 0 and 0.0392
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if not supabase_url or not supabase_key:
            logging.error("Supabase credentials are not configured")
            return {"error": "Supabase client not configured - missing credentials"}
            
        supabase_client = create_client(supabase_url, supabase_key)
        if not supabase_client:
            logging.error("Supabase client is not available")
            return {"error": "Supabase client not configured"}
            
        documents = supabase_client.rpc(
            "hybrid_search",
            {
                "query_text": query,
                "query_embedding": embedding,
                "match_count": num_results,
                "semantic_weight": 2,
                "full_text_weight": 1,
                # "rrf_k": 0,
            },
        ).execute()
        results = {}
        for doc in documents.data:
            print(doc["similarity"])
            results[doc["id"]] = [doc["content"], doc["similarity"]]
        return results

    except Exception as e:
        logging.error(f"Error in query_vector_store: {str(e)}", exc_info=True)
        return {"error": f"Query failed: {str(e)}"}
