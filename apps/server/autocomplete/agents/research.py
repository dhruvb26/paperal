import logging
from agents.tavily_func import getURL


def TavilySearchAgent(query: str) -> dict:
    """Agent to search the Tavily database for relevant information."""
    try:
        logging.info(f"Searching Tavily for query: {query}")
        return getURL(query)
    except Exception as e:
        logging.error(f"Error in TavilySearchAgent: {e}")
        return {}
