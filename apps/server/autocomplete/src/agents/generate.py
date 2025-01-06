import logging
from typing import Optional, Tuple
import tiktoken
from openai import OpenAI
from database import query_vector_store
import baml_connect.baml_main as baml_main

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

client = OpenAI()


def ExtractPaperAgent(text: str) -> str:
    """
    Extracts text from a PDF file and processes it for further use.
    """
    try:

        response = baml_main.example(text)
        return response
    except Exception as e:
        logging.error(f"Error in ExtractPaperAgent: {e}")
        return ""


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
        matched_docs = query_vector_store(similar_keywords)
        if not matched_docs.data:
            return []

        # First filter by user_id
        user_filtered_docs = [
            doc
            for doc in matched_docs.data
            if (user_id is None and doc.get("metadata", {}).get("user_id") is None)
            or (user_id and doc.get("metadata", {}).get("user_id") in {user_id, None})
        ]

        if not user_filtered_docs:
            return []

        # Find the first document that's different from the last used one
        filtered_docs = []
        for doc in user_filtered_docs:
            if doc["metadata"]["library_id"] != last_used_document_source:
                filtered_docs = [doc]
                last_used_document_source = doc["metadata"]["library_id"]
                break

        # If no different document found, return empty list
        if not filtered_docs:
            return []
        print(filtered_docs)

        # Create results for the selected document
        results = [
            {
                "content": str(doc["content"]),
                "score": float(doc["similarity"]),
                "metadata": {
                    "author": str(doc["metadata"]["author"]),
                    "title": str(doc["metadata"]["title"]),
                    "url": str(doc["metadata"]["source"]),
                    "library_id": str(doc["metadata"]["library_id"]),
                },
            }
            for doc in filtered_docs
        ]

        return results

    except Exception as e:
        logging.error(f"Error in find_similar_documents: {e}")
        return []


_RAG_SYSTEM_PROMPT = """
You are an expert keyword generator.
You are give a text and you need to generate keywords from the text which can be used to generate a RAG.

Generate 3 trivial keywords.
Only return the keywords separated by commas, no other text.
"""


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


async def generate_ai_sentence(
    previous_text: str,
    heading: str,
    user_id: Optional[str] = None,
) -> dict:
    """
    Generates a sentence using AI without referencing external materials.
    """
    try:
        context = f"""
        You are an expert academic writer tasked with generating the next sentence for a research paper. Your goal is to produce a single, coherent sentence that logically follows the previous content and fits seamlessly into the paper's structure.

        Here is the heading of the paper:
        <paper_heading>
        {heading}
        </paper_heading>

        Please follow these steps to generate the next sentence:

        1. Analyze the paper heading and previous content to understand the context and current section of the paper.
        2. Consider how the next sentence should logically flow from the existing content.
        3. You will recieve the previous content of the paper in <previous_content> tags.
        3. Generate a sentence that meets the following criteria:
        - Contains between 20 to 25 words
        - Is grammatically correct
        - Fits coherently with the previous content and overall paper structure
        - Advances the argument or discussion in a meaningful way
        """

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": context},
                {
                    "role": "user",
                    "content": f"Here is the previous content of the paper:\n"
                    f"<previous_content>{previous_text}</previous_content>",
                },
            ],
        )

        generated_sentence = response.choices[0].message.content.strip()

        return {"sentence": generated_sentence}
    except Exception as e:
        logging.error(f"Error in generate_ai_sentence: {e}")
        return {}


def generate_referenced_sentence(
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
