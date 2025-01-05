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
    ai_generated = {}
    sentence = {}
    ai_generated_opening = None
    if request.previous_text == "":
        ai_generated_opening = suggest_opening_statement(request.heading)
    else:
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

        sentence = None
        for doc in ai_generated.get("similar_documents", []):
            logging.info(f"Similar document score: {doc['score']}")
            if doc["score"] > 0.039:

                sentence = generate_referenced_sentence(
                    json_text, request.heading, doc["content"]
                )
                print("referenced sentence", sentence)

                relavance_sentence = select_most_relevant_sentence(
                    json_text,
                    ai_generated.get("sentence", None),
                    sentence.get("sentence", None),
                )
                print(relavance_sentence)
                if relavance_sentence == ai_generated.get("sentence", None):
                    sentence = None
                break

    return {
        "ai_sentence": (
            ai_generated.get("sentence", None)
            if ai_generated.get("sentence", None)
            else ai_generated_opening
        ),
        "referenced_sentence": sentence.get("sentence", None) if sentence else None,
        "is_referenced": True if sentence else False,
        "author": doc["metadata"].get("author", None) if sentence else None,
        "url": doc["metadata"].get("url", None) if sentence else None,
        "title": doc["metadata"].get("title", None) if sentence else None,
        "library_id": doc["metadata"].get("library_id", None) if sentence else None,
    }
