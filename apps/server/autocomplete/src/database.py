import logging
import os
from typing import List, Optional
import time

from langchain.schema import Document
from langchain_community.vectorstores import SupabaseVectorStore
from langchain_openai import OpenAIEmbeddings
from openai import OpenAI
from supabase.client import Client, create_client
from utils.docs import split_documents, load_documents
from dotenv import load_dotenv


load_dotenv(override=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s", force=True
)


# Initialize clients with proper error handling
supabase_client = None
openai_client = None

try:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not supabase_url or not supabase_key:
        logging.warning("Supabase URL or Service Key is missing in environment variables.")
        logging.warning(f"SUPABASE_URL: {supabase_url}")
        logging.warning(f"SUPABASE_SERVICE_KEY: {'***' if supabase_key else 'None'}")
        logging.warning("Supabase client will be disabled. Vector search functionality will not work.")
        supabase_client = None
    else:
        # Validate the URL format
        if not supabase_url.startswith(('http://', 'https://')):
            logging.error(f"Invalid Supabase URL format: {supabase_url}")
            supabase_client = None
        else:
            supabase_client = create_client(supabase_url, supabase_key)
            logging.info("Supabase client created successfully.")
except Exception as e:
    logging.error(f"Error creating Supabase client: {e}")
    logging.error("Supabase client will be disabled. Vector search functionality will not work.")
    supabase_client = None

try:
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        logging.warning("OpenAI API key is missing in environment variables.")
        logging.warning("OpenAI client will be disabled. Embedding functionality will not work.")
        openai_client = None
    else:
        openai_client = OpenAI(api_key=openai_api_key)
        logging.info("OpenAI client created successfully.")
except Exception as e:
    logging.error(f"Error creating OpenAI client: {e}")
    logging.error("OpenAI client will be disabled. Embedding functionality will not work.")
    openai_client = None


def add_metadata(
    docs: List[Document],
    url: str,
    author: str,
    title: str,
    year: int,
    library_id: Optional[str] = None,
    is_public: Optional[bool] = True,
):
    logging.info("Adding metadata to documents...")
    for doc in docs:
        doc.metadata["source"] = url
        doc.metadata["author"] = author
        doc.metadata["title"] = title
        doc.metadata["year"] = year
        doc.metadata["library_id"] = library_id
        doc.metadata["is_public"] = is_public
    logging.info("Metadata added.")


def query_metadata(field, value, supabase):
    logging.info(f"Querying : {field} = {value}")
    field = f"metadata->>{field}"
    response = (
        supabase.from_("library")
        .select("*")
        .eq(field, value)
        .execute()
    )
    logging.info(f"Query returned {len(response.data)} result(s).")
    return response


def query_vector_store(query: str) -> List[Document]:
    """
    Optimized vector store query with reranking and caching.
    """
    logging.info(f"Querying vector store for: {query}")

    # Check if clients are available
    if not supabase_client:
        logging.error("Supabase client is not available. Cannot query vector store.")
        return []
    
    if not openai_client:
        logging.error("OpenAI client is not available. Cannot query vector store.")
        return []

    try:
        start_time = time.time()
        embedding_response = openai_client.embeddings.create(
            model="text-embedding-3-large", input=query, dimensions=1536
        )
        embedding = embedding_response.data[0].embedding
        end_time = time.time()
        logging.info(f"Embedding took {end_time - start_time} seconds")

        # Add timeout parameter and set statement_timeout
        start_time = time.time()
        try:
            # Set a longer statement timeout (e.g., 30 seconds)
            # supabase_client.postgrest.rpc("SET LOCAL statement_timeout = '30s'")

            documents = supabase_client.rpc(
                "hybrid_search",
                {
                    "query_text": query,
                    "query_embedding": embedding,
                    "match_count": 10,
                    "semantic_weight": 2,
                    "full_text_weight": 1,
                },
            ).execute()
        except Exception as e:
            logging.error(f"Error in query_vector_store: {str(e)}", exc_info=True)
            return []
        end_time = time.time()
        logging.info(f"Hybrid search took {end_time - start_time} seconds")
        return documents

    except Exception as e:
        logging.error(f"Error in query_vector_store: {str(e)}", exc_info=True)
        return []


def create_vector_store(supabase: Client) -> SupabaseVectorStore:
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
    return vector_store


vector_store = None
try:
    if supabase_client:
        vector_store = create_vector_store(supabase_client)
        logging.info("Vector store created successfully.")
    else:
        logging.warning("Supabase client not available, vector store not created.")
except Exception as e:
    logging.error(f"Error creating vector store: {e}")
    vector_store = None

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
