import logging
import os

from dotenv import load_dotenv
from openai import OpenAI
from tavily import TavilyClient

# Configure logging
logger = logging.getLogger(__name__)

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

    prompt = f"""Extract important words from the following research sentence: {research_sentence}
    Return only the important words as a comma separated string.
    """
    client = OpenAI()
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": "You are a world class researcher. Extract important words from the given research sentence.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.8,
    )
    research_topic = response.choices[0].message.content.strip()

    # research_topic = research_sentence
    logging.info(f"Searching for research papers on: {research_sentence}")
    url_list = []

    # Search parameters
    query = f"peer reviewed papers on {research_topic}"
    search_params = {
        "query": query,
        "max_results": 15,
        "exclude_domains": ["reddit.com", "wikipedia.org", "ieeexplore.ieee.org/"],
        # some other good domains
        "include_domains": ["arxiv.org", "aclanthology.org"],
        "search_depth": "advanced",
        "filter_language": "en",
    }
    try:
        response = tavily_client.search(**search_params)
        for result in response["results"]:
            pdf_url = result["url"]
            logging.info(f"Found URL: {pdf_url}")

            try:

                if "arxiv.org/abs" in pdf_url:
                    pdf_url = pdf_url.replace("abs", "pdf")
                    # pdf_response = requests.get(pdf_url, timeout=30)
                elif "arxiv.org/html" in pdf_url:
                    pdf_url = pdf_url.replace("html", "pdf")
                    # pdf_response = requests.get(pdf_url, timeout=30)
                elif "aclanthology.org" in pdf_url and ".pdf" not in pdf_url:
                    # replace the last / with .pdf
                    pdf_url = pdf_url.rsplit("/", 1)[0] + ".pdf"

                else:
                    pdf_url = pdf_url
                url_list.append(pdf_url)

            except Exception as url_error:
                logging.error(f"Error with URL: {url_error}")

        logging.info(f"Search result: {url_list}")
    except Exception as e:
        logging.error(f"Error during Tavily search: {e}")
        url_list = []

    return url_list
