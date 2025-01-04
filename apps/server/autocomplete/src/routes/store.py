from models.requests import StoreResearchRequest
from agents.store import StoreResearchPaperAgent
from fastapi import APIRouter, BackgroundTasks
import logging

logging = logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s", force=True
)

router = APIRouter()


@router.post("/store")
async def store_research_papers(
    request: StoreResearchRequest, background_tasks: BackgroundTasks
):
    """Endpoint to store research papers in the database."""
    logging.info("Received request to store research papers.")
    background_tasks.add_task(
        StoreResearchPaperAgent,
        request.research_urls,
        request.user_id,
        request.is_public,
    )
    return {"success": True}
