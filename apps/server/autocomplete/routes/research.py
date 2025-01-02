from fastapi import APIRouter, BackgroundTasks
from agents.research import TavilySearchAgent
from models.requests import StoreResearchRequest
from agents.store import StoreResearchPaperAgent
import logging
import asyncio

router = APIRouter()


@router.post("/search")
async def search_tavily(query: str):
    """Endpoint to search Tavily database."""
    logging.info("Received search request.")
    results = TavilySearchAgent(query)
    return {"results": results}


@router.post("/store")
async def store_research_papers(
    request: StoreResearchRequest, background_tasks: BackgroundTasks
):
    """Endpoint to store research papers in the database."""
    logging.info("Received request to store research papers.")
    background_tasks.add_task(
        StoreResearchPaperAgent, request.research_urls, request.user_id
    )
    return {"success": True}
