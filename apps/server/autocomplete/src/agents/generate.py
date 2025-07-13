import logging
from typing import Optional
from openai import OpenAI
from database import query_vector_store
import baml_connect.baml_main as baml_main
from baml_connect.baml_client.types import Paper
from agents.store_pinecone import get_query_embeddings, query_pinecone_index

logging.basicConfig(
    level=logging.WARNING,  # Reduce logging overhead
    format="%(levelname)s - %(message)s",
    force=True,
)

client = OpenAI()


def ExtractPaperAgent(text: str) -> Paper:
    """
    Extracts text from a PDF file and processes it for further use.
    """
    try:
        response = baml_main.example(text)
        return response
    except Exception as e:
        logging.error(f"Error in ExtractPaperAgent: {e}")
        # Return a default Paper object with empty values
        return Paper(
            author=[],
            title="",
            year="",
            abstract=""
        )


# Global variable to track the last used document
last_used_document_source = None


async def find_similar_documents(
    generated_sentence: str, heading: str, user_id: Optional[str] = None
) -> list:
    """
    Queries the vector database to find documents similar to the generated sentence.
    """
    global last_used_document_source

    try:
        similar_keywords = await generate_question_for_RAG(generated_sentence, heading)
        query_embeddings = get_query_embeddings(query=similar_keywords)
        query_response = query_pinecone_index(query_embeddings)

        if not query_response or not query_response.matches:
            return []
        results = query_response.matches
        user_filtered_docs = []

        for doc in results:
            user_filtered_docs.append(
                {
                    "content": str(doc.get("metadata", {}).get("text")),
                    "score": float(doc.get("score", 0.0)),
                    "metadata": {
                        "title": str(doc.get("metadata", {}).get("title")),
                        "url": str(doc["metadata"]["url"]),
                        "library_id": str(doc.get("metadata", {}).get("library_id")),
                    },
                }
            )

        return user_filtered_docs

    except Exception as e:
        logging.error(f"Error in find_similar_documents: {e}")
        return []


# Simplified RAG prompt
_RAG_SYSTEM_PROMPT = """Expert keyword generator. Generate 3 keywords from the text for RAG.
Return only space-separated keywords."""


async def generate_question_for_RAG(text: str, heading: str):
    context = _RAG_SYSTEM_PROMPT

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": context},
            {
                "role": "user",
                "content": f"Here is the text to generate the keywords from: {text} and the heading of the paper is: {heading}",
            },
        ],
    )

    generated_question = response.choices[0].message.content.strip()
    return generated_question


# Simplified sentence generation prompt
async def generate_ai_sentence(previous_text: str, heading: str) -> dict:
    context = f"""Academic writer generating next paper sentence. Paper heading: {heading}
    Rules:
    - 20-25 words
    - Grammatically correct
    - Coherent flow
    - Meaningful advancement
    - Avoid Moreover, Additionally"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": context},
                {
                    "role": "user",
                    "content": f"Here is the previous content of the paper:\n"
                    f"{previous_text}",
                },
            ],
        )

        generated_sentence = response.choices[0].message.content.strip()

        return {"sentence": generated_sentence}
    except Exception as e:
        logging.error(f"Error in generate_ai_sentence: {e}")
        return {}


async def generate_referenced_sentence(
    previous_text: str, heading: str, paper_content: str
) -> dict:
    """
    Generates a sentence using referenced materials from the vector store.
    """
    try:

        prompt = f"""
        You are an expert academic writer tasked with generating the next sentence for a research paper. Your goal is to produce a single, coherent sentence that logically follows the previous content and fits seamlessly into the paper's structure.
        Only use the context provided to generate the sentence.

        Here is the heading of the paper:
        <paper_heading>
        {heading}
        </paper_heading>

        Here is the context to use: 
        <context>
        {paper_content}
        </context>

        Please follow these steps to generate the next sentence:

        1. Analyze the paper heading and previous content to understand the context and current section of the paper.
        2. Consider how the next sentence should logically flow from the existing content.
        3. You will recieve the previous content of the paper in <previous_content> tags.
        4. If the <context> includes an in-text citation, don't include it in the final response.
        3. Generate a sentence that meets the following criteria:
        - Contains between 20 to 25 words
        - Is grammatically correct
        - Fits coherently with the previous content and overall paper structure
        - Advances the argument or discussion in a meaningful way
        - Try not to use words like Moreover, Additionally, etc.
        """

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": prompt},
                {
                    "role": "user",
                    "content": f"Here is the previous content of the paper:\n"
                    f"<previous_content>{previous_text}</previous_content>",
                },
            ],
        )
        logging.info("Sentence generated successfully.")
        res = {
            "sentence": response.choices[0].message.content.strip(),
        }
        return res
    except Exception as e:
        logging.error(f"Error in generate_referenced_sentence: {e}")
        return {}
