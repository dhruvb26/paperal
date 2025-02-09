from fastapi import APIRouter
import logging
from models.requests import SentenceRequest
from agents.generate import (
    generate_ai_sentence,
    generate_referenced_sentence,
    find_similar_documents,
)
from agents.relavance import select_most_relevant_sentence
from agents.introduction import suggest_opening_statement
import os
from dotenv import load_dotenv
import database
import asyncio

load_dotenv()

router = APIRouter()

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s", force=True
)


@router.post("/generate")
async def generate_sentence(request: SentenceRequest):
    """Endpoint to generate a sentence based on the given context."""
    logging.info("Received request to generate sentence.")
    # get heading from table documents
    heading = (
        database.supabase_client.table("documents")
        .select("*")
        .eq("id", request.document_id)
        .execute()
    )
    heading = heading.data[0]["prompt"]

    # Early return for empty previous_text

    if request.previous_text.strip() == heading.strip():
        ai_generated_opening = suggest_opening_statement(heading)
        return {
            "text": ai_generated_opening,
            "is_referenced": False,
            "citations": None,
            "href": None,
            "context": None,
        }

    similar_docs = await find_similar_documents(request.previous_text[:200], heading)
    ai_generated = await generate_ai_sentence(request.previous_text, heading)
    # Only process similar documents if they exist and have valid scores
    if len(similar_docs) > 0:
        sentence = generate_referenced_sentence(
            request.previous_text, heading, similar_docs[0]["content"]
        )
        print(sentence)
        print(similar_docs[0]["score"])
        if similar_docs[0]["score"] > 0.05:
            citation = (
                database.supabase_client.table("library")
                .select("*")
                .eq("id", similar_docs[0]["metadata"].get("library_id"))
                .execute()
            )

            return {
                "text": sentence.get("sentence"),
                "is_referenced": True,
                "citations": similar_docs[0]["metadata"].get(
                    "citations",
                    {
                        "in-text": citation.data[0]["metadata"]["citations"]["in-text"],
                    },
                ),
                "href": similar_docs[0]["metadata"].get("url"),
                "context": similar_docs[0]["content"],
            }

        if (
            sentence
            and select_most_relevant_sentence(
                # similar_docs[0]["content"],
                ai_generated.get("sentence"),
                sentence.get("sentence"),
                request.previous_text[:500],
            )
            == True
        ):

            # query library table for citation
            citation = (
                database.supabase_client.table("library")
                .select("*")
                .eq("id", similar_docs[0]["metadata"].get("library_id"))
                .execute()
            )

            return {
                "text": sentence.get("sentence"),
                "is_referenced": True,
                "citations": similar_docs[0]["metadata"].get(
                    "citations",
                    {
                        "in-text": citation.data[0]["metadata"]["citations"]["in-text"],
                    },
                ),
                "href": similar_docs[0]["metadata"].get("url"),
                "context": similar_docs[0]["content"],
            }
    # Generate non-referenced sentence
    # ai_generated = await generate_ai_sentence(
    #     request.previous_text, heading, request.user_id
    # )

    # Return non-referenced sentence if no suitable reference found
    return {"text": ai_generated.get("sentence"), "is_referenced": False, "href": None}
