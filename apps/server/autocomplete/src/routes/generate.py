from fastapi import APIRouter
import orjson as json
import logging
from models.requests import SentenceRequest
from utils.markdown import json_to_markdown
from agents.generate import generate_ai_sentence, generate_referenced_sentence
from agents.relavance import select_most_relevant_sentence
from agents.introduction import suggest_opening_statement
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s", force=True
)


@router.post("/generate")
async def generate_sentence(request: SentenceRequest):
    """Endpoint to generate a sentence based on the given context."""
    logging.info("Received request to generate sentence.")

    # Early return for empty previous_text
    if request.previous_text == "":
        ai_generated_opening = suggest_opening_statement(request.heading)
        return {
            "ai_sentence": ai_generated_opening,
            "referenced_sentence": None,
            "is_referenced": False,
            "author": None,
            "url": None,
            "title": None,
            "library_id": None,
        }

    # Parse JSON once and handle error early
    try:
        json_text = json_to_markdown(json.loads(request.previous_text))
    except json.JSONDecodeError:
        logging.warning("Failed to parse JSON, using raw text")
        json_text = request.previous_text

    # Generate non-referenced sentence
    ai_generated = await generate_ai_sentence(
        json_text, request.heading, request.subheading, request.user_id
    )

    # Only process similar documents if they exist and have valid scores
    similar_docs = ai_generated.get("similar_documents", [])
    for doc in similar_docs:
        if doc["score"] <= 0.039:
            continue

        sentence = generate_referenced_sentence(
            json_text, request.heading, doc["content"]
        )

        if sentence and select_most_relevant_sentence(
            json_text, ai_generated.get("sentence"), sentence.get("sentence")
        ) != ai_generated.get("sentence"):
            return {
                "ai_sentence": ai_generated.get("sentence"),
                "referenced_sentence": sentence.get("sentence"),
                "is_referenced": True,
                "author": doc["metadata"].get("author"),
                "url": doc["metadata"].get("url"),
                "title": doc["metadata"].get("title"),
                "library_id": doc["metadata"].get("library_id"),
            }

    # Return non-referenced sentence if no suitable reference found
    return {
        "ai_sentence": ai_generated.get("sentence"),
        "referenced_sentence": None,
        "is_referenced": False,
        "author": None,
        "url": None,
        "title": None,
        "library_id": None,
    }
