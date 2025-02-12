import logging

import logging
import os

from dotenv import load_dotenv
from openai import OpenAI
from tavily import AsyncTavilyClient

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s", force=True
)

load_dotenv()
# Initialize Tavily client
try:
    tavily_client = AsyncTavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
    logging.info("Tavily client initialized successfully.")
except Exception as e:
    logging.error(f"Error initializing Tavily client: {e}")
    tavily_client = None

# Initialize OpenAI client
try:
    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    logging.info("OpenAI client initialized successfully.")
except Exception as e:
    logging.error(f"Error initializing OpenAI client: {e}")
    openai_client = None


async def getURL(research_sentence: str) -> list:
    """
    Fetches URLs of research papers based on a topic using Tavily API.

    Args:
        research_topic: Topic to search for.

    Returns:
        list: A list of URLs.
    """
    if not tavily_client:
        logging.error("Tavily client is not initialized.")
        return []

    url_list = []

    # Search parameters
    query = f"peer reviewed papers on {research_sentence} filetype:pdf"
    search_params = {
        "query": query,
        "max_results": 20,
        "exclude_domains": ["reddit.com", "wikipedia.org", "ieeexplore.ieee.org/"],
        "search_depth": "advanced",
        "filter_language": "en",
    }
    try:
        response = await tavily_client.search(**search_params)
        url_list = []

        # Simplified URL processing
        for result in response["results"]:
            pdf_url = result["url"]
            if "arxiv.org/" in pdf_url:
                pdf_url = pdf_url.replace("/abs/", "/pdf/").replace("/html/", "/pdf/")
            elif "aclanthology.org" in pdf_url and not pdf_url.endswith(".pdf"):
                pdf_url = f"{pdf_url.rstrip('/')}.pdf"

            url_list.append(pdf_url)
            logging.info(f"Found URL: {pdf_url}")

        return url_list

    except Exception as e:
        logging.error(f"Error during Tavily search: {e}")
        return []


async def TavilySearchAgent(query: str) -> list:
    """Agent to search the Tavily database for relevant information."""
    try:
        logging.info(f"Searching Tavily for query: {query}")
        url_list = await getURL(query)
        return url_list
    except Exception as e:
        logging.error(f"Error in TavilySearchAgent: {e}")
        return []
