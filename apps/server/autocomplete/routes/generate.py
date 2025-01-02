from fastapi import APIRouter
import json
import logging
from models.requests import SentenceRequest
from utils.markdown import json_to_markdown
from agents.generate import generate_ai_sentence, generate_referenced_sentence

router = APIRouter()


@router.post("/generate")
async def generate_sentence(request: SentenceRequest):
    """Endpoint to generate a sentence based on the given context."""
    logging.info("Received request to generate sentence.")

    # Handle the previous_text parsing more gracefully
    json_text = request.previous_text
    if request.previous_text:
        try:
            parsed_text = json.loads(request.previous_text)
            json_text = json_to_markdown(parsed_text)
        except json.JSONDecodeError:
            logging.warning("Failed to parse JSON, using raw text")
            json_text = request.previous_text

    # Generate non-referenced sentence
    ai_generated = await generate_ai_sentence(
        json_text, request.heading, request.subheading, request.user_id
    )

    sentence = {}
    for doc in ai_generated.get("similar_documents", []):
        print(doc["score"])
        if doc["score"] > 0.0196078:
            sentence = generate_referenced_sentence(
                json_text, request.heading, doc["content"]
            )
            break

    return {
        "ai_sentence": ai_generated.get("sentence", None),
        "referenced_sentence": sentence.get("sentence", None) if sentence else None,
        "is_referenced": True if sentence else False,
        "author": doc["metadata"].get("author", None) if sentence else None,
        "url": doc["metadata"].get("url", None) if sentence else None,
        "title": doc["metadata"].get("title", None) if sentence else None,
        "library_id": doc["metadata"].get("library_id", None) if sentence else None,
    }