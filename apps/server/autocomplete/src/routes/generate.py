from fastapi import APIRouter
import orjson as json
import logging
from models.requests import SentenceRequest
from utils.markdown import json_to_markdown
from agents.generate import (
    generate_ai_sentence,
    generate_referenced_sentence,
    find_similar_documents,
)
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
    # try:
    #     json_text = json_to_markdown(json.loads(request.previous_text))
    # except json.JSONDecodeError:
    #     logging.warning("Failed to parse JSON, using raw text")
    #     json_text = request.previous_text

    # Generate non-referenced sentence
    ai_generated = await generate_ai_sentence(
        request.previous_text, request.heading, request.user_id
    )
    similar_docs = await find_similar_documents(request.previous_text, request.heading)
    # Only process similar documents if they exist and have valid scores
    if similar_docs[0]["score"] >= 0.039:

        sentence = generate_referenced_sentence(
            request.previous_text, request.heading, similar_docs[0]["content"]
        )

        if (
            sentence
            and select_most_relevant_sentence(
                request.previous_text,
                sentence.get("sentence"),
                ai_generated.get("sentence"),
            )
            == 1
        ):

            return {
                "ai_sentence": None,
                "referenced_sentence": sentence.get("sentence"),
                "is_referenced": True,
                "author": similar_docs[0]["metadata"].get("author"),
                "url": similar_docs[0]["metadata"].get("url"),
                "title": similar_docs[0]["metadata"].get("title"),
                "library_id": similar_docs[0]["metadata"].get("library_id"),
                "context": similar_docs[0]["content"],
                "score": similar_docs[0]["score"],
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
        "context": None,
        "score": None,
    }
