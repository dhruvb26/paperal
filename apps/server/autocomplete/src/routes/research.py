from fastapi import APIRouter
from agents.research import TavilySearchAgent
import logging

router = APIRouter()

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s", force=True
)


@router.post("/search")
async def search_tavily(query: str):
    """Endpoint to search Tavily database."""
    logging.info("Received search request.")
    try:
        results = TavilySearchAgent(query)
        return {"results": results}
    except Exception as e:
        logging.error(f"Error in search_tavily: {str(e)}", exc_info=True)
        raise e
