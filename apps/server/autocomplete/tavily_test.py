import os
from dotenv import load_dotenv
from tavily import TavilyClient
import requests
from typing import Optional
from PyPDF2 import PdfReader
import io
import logging
from openai import OpenAI


# Configure logging
logging.basicConfig(
    level=logging.INFO,  # Set to DEBUG for more detailed logs
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)

load_dotenv()


def check_pdf_pages(pdf_content) -> int:
    """Returns the number of pages in a PDF"""
    try:
        pdf = PdfReader(pdf_content)
        page_count = len(pdf.pages)
        logging.debug(f"PDF has {page_count} pages.")
        return page_count
    except Exception as e:
        logging.error(f"Error checking PDF pages: {e}")
        return 0


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


def generate_research_topic(text: str) -> list:
    """
    Generates a research topic from a given text using the OpenAI API.

    Args:
        text: The text to generate a research topic from.

    Returns:
        list: A list of keywords extracted from the text.
    """
    if not openai_client:
        logging.error("OpenAI client is not initialized.")
        return []

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "Generate a short research topic from the given text. Return only the research topic as a string.",
                },
                {"role": "user", "content": text},
            ],
        )
        # Parse the comma-separated keywords into a list
        research_topic = response.choices[0].message.content.strip()
        logging.info(f"Generated research topic: {research_topic}")
        return research_topic
    except Exception as e:
        logging.error(f"Error generating research topic: {e}")
        return ""


def getURL(research_sentence: str) -> dict:
    """
    Fetches URLs of research papers based on a topic using Tavily API.

    Args:
        research_topic: Topic to search for.

    Returns:
        dict: A dictionary containing the research topic and a list of URLs.
    """
    if not tavily_client:
        logging.error("Tavily client is not initialized.")
        return {}
    research_topic = generate_research_topic(research_sentence)
    logging.info(f"Searching for research papers on: {research_topic}")
    url_list = []
    result = {}

    # Search parameters
    query = f"peer reviewed research papers on {research_topic} filetype:pdf"
    search_params = {
        "query": query,
        "max_results": 10,
        # "include_domains": ["arxiv.org"],
        "search_depth": "advanced",
        "filter_language": "en",
    }
    try:
        response = tavily_client.search(**search_params)
        for result in response["results"]:
            pdf_url = result["url"]
            logging.info(f"Found URL: {pdf_url}")

            # Download the PDF and check the page count
            try:
                pdf_response = requests.get(pdf_url, timeout=30)
                if pdf_response.status_code == 200:
                    pdf_content = io.BytesIO(pdf_response.content)
                    page_count = check_pdf_pages(pdf_content)
                    if page_count > 0 and page_count < 30:
                        url_list.append(pdf_url)
                        logging.info(f"Valid PDF with {page_count} pages: {pdf_url}")
                    else:
                        logging.warning(f"Skipping PDF with {page_count} pages: {pdf_url}")
                else:
                    logging.warning(f"Failed to download PDF: HTTP {pdf_response.status_code}")
            except Exception as download_error:
                logging.error(f"Error downloading or processing PDF: {download_error}")
        if len(url_list) >= 4:
            result = {"research_topic": research_topic, "url_list": url_list[:4]}
        else:
            result = {"research_topic": research_topic, "url_list": url_list}
        logging.info(f"Search result: {result}")
    except Exception as e:
        logging.error(f"Error during Tavily search: {e}")
        result = {"research_topic": research_topic, "url_list": []}

    return result


if __name__ == "__main__":
    logging.info("Script started.")
    try:
        query = "a paper on dataset inference in terms of language models with specific focus on the dataset size"
        logging.info(f"Searching Tavily for query: {query}")

        search_result = getURL(query)
        logging.info(f"Search completed: {search_result}")
    except Exception as e:
        logging.error(f"An error occurred: {e}")
