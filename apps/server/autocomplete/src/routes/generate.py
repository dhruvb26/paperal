from fastapi import APIRouter, HTTPException
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
from datetime import datetime

load_dotenv()

router = APIRouter()

logging.basicConfig(
    level=logging.WARNING,  # Reduce logging overhead
    format="%(levelname)s - %(message)s",  # Simpler format
    force=True,
)


@router.post("/generate")
async def generate_sentence(request: SentenceRequest):
    """Endpoint to generate a sentence based on the given context."""
    logging.info("Received request to generate sentence.")

    # Get heading from table documents with error handling
    try:
        if not database.supabase_client:
            logging.error("Supabase client is not available")
            raise HTTPException(status_code=500, detail="Database connection not available")
            
        heading_result = (
            database.supabase_client.table("documents")
            .select("*")
            .eq("id", request.document_id)
            .execute()
        )
        if not heading_result.data:
            logging.error(f"No document found with id: {request.document_id}")
            raise HTTPException(status_code=404, detail="Document not found")

        heading = heading_result.data[0]["prompt"]
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching document: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching document")

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

    # Run similar docs search and AI generation in parallel
    print("start time", datetime.now(), "\n")
    # similar_docs, ai_generated = await asyncio.gather(
    #     find_similar_documents(request.previous_text[:150], heading),
    #     generate_ai_sentence(request.previous_text, heading),
    # )

    similar_docs = await find_similar_documents(request.previous_text[:150], heading)
    ai_generated = await generate_ai_sentence(request.previous_text, heading)
    print(ai_generated)

    print("end time", datetime.now(), "\n")
    sentence = await generate_referenced_sentence(
        request.previous_text, heading, similar_docs[0]["content"]
    )
    print(sentence)
    if sentence and select_most_relevant_sentence(
        ai_generated.get("sentence"),
        sentence.get("sentence"),
        request.previous_text[:150],
    ):
        # Get citation data
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

    return {"text": ai_generated.get("sentence"), "is_referenced": False, "href": None}
