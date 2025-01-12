import logging

import logging
import os

from dotenv import load_dotenv
from openai import OpenAI
from tavily import TavilyClient

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s", force=True
)

load_dotenv()
# Initialize Tavily client
try:
    tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
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


def getURL(research_sentence: str) -> list:
    """
    Fetches URLs of research papers based on a topic using Tavily API.

    Args:
        research_topic: Topic to search for.

    Returns:
        list: A list of URLs.
    """
    if not tavily_client:
        logging.error("Tavily client is not initialized.")
        return {}
    # use openai to extract important words from the research_sentence

    # prompt = f"""Extract important words from the following research sentence: {research_sentence}
    # Return only the important words as a comma separated string.
    # """
    # client = OpenAI()
    # response = client.chat.completions.create(
    #     model="gpt-3.5-turbo",
    #     messages=[
    #         {
    #             "role": "system",
    #             "content": "You are a world class researcher. Extract important words from the given research sentence.",
    #         },
    #         {"role": "user", "content": prompt},
    #     ],
    #     temperature=0.3,
    # )
    # research_topic = response.choices[0].message.content.strip()

    # # research_topic = research_sentence
    # logging.info(f"Searching for research papers on: {research_topic}")
    url_list = []

    # Search parameters
    query = f"peer reviewed papers on {research_sentence} filetype:pdf"
    search_params = {
        "query": query,
        "max_results": 20,
        "exclude_domains": ["reddit.com", "wikipedia.org", "ieeexplore.ieee.org/"],
        # some other good domains
        # "include_domains": ["arxiv.org", "aclanthology.org"],
        "search_depth": "advanced",
        "filter_language": "en",
    }
    try:
        response = tavily_client.search(**search_params)
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


def TavilySearchAgent(query: str) -> dict:
    """Agent to search the Tavily database for relevant information."""
    try:
        logging.info(f"Searching Tavily for query: {query}")
        return getURL(query)
    except Exception as e:
        logging.error(f"Error in TavilySearchAgent: {e}")
        return {}
