from fastapi import APIRouter
from agents.research import TavilySearchAgent
import logging

router = APIRouter()

logging = logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s", force=True
)


@router.post("/search")
async def search_tavily(query: str):
    """Endpoint to search Tavily database."""
    logging.info("Received search request.")
    results = TavilySearchAgent(query)
    return {"results": results}
