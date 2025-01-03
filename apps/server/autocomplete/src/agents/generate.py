import logging
from typing import Optional
import tiktoken
from openai import OpenAI
from database import query_vector_store
from utils.text import sanitize_text
import baml_connect.baml_main as baml_main

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)


async def ExtractPaperAgent(text: str) -> str:
    """
    Extracts text from a PDF file and processes it for further use.
    """
    try:
        logging.info("Extracting text from PDF...")
        tokenizer = tiktoken.get_encoding("cl100k_base")

        tokens = tokenizer.encode(text)
        truncated_tokens = tokens[:1000]
        truncated_text = tokenizer.decode(truncated_tokens)
        sanitized_text = sanitize_text(truncated_text)
        logging.info("Getting response from baml_main...")
        response = baml_main.example(sanitized_text)
        return response
    except Exception as e:
        logging.error(f"Error in ExtractPaperAgent: {e}")
        return ""


def generate_in_text_citation(
    author: str,
    year: Optional[str] = None,
) -> dict:
    """
    Generates a citation for the research paper.
    """
    try:
        prompt = f"""
        Generate in-text citiation for the following research paper:
        Author: {author}
        Year: {year}

        The citation should follow the following format:
        If one author is provided, the citation should be: (Author(last name), Year)
        if two authors are provided, the citation should be: (Author1(last name) & Author2(last name), Year)
        If multiple authors are provided, the citation should be: (Author1(last name) et al., Year)
        If no author is provided, the citation should be: (Year)

        Only return the in-text citation, no other text.
        """
        client = OpenAI()
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a research paper writing assistant.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.9,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logging.error(f"Error in generate_citation: {e}")
        return {}


# Global variable to track the last used document
last_used_document_source = None


async def find_similar_documents(
    generated_sentence: str, user_id: Optional[str] = None
) -> list:
    """
    Queries the vector database to find documents similar to the generated sentence.
    """

    generated_question = await generate_question_for_RAG(generated_sentence)
    global last_used_document_source

    try:

        matched_docs = query_vector_store(generated_question)
        # Filter documents based on user_id and last used document
        if user_id:
            filtered_docs = [
                doc
                for doc in matched_docs.data
                if doc.get("metadata").get("user_id") in {user_id, None}
                and doc.get("metadata").get("library_id") != last_used_document_source
            ]
        else:
            filtered_docs = [
                doc
                for doc in matched_docs.data
                if doc.get("metadata").get("user_id") is None
                and doc.get("metadata").get("library_id") != last_used_document_source
            ]

        # If no documents found after filtering, remove the last_used_document constraint
        if not filtered_docs:
            if user_id:
                filtered_docs = [
                    doc
                    for doc in matched_docs.data
                    if doc.get("metadata").get("user_id") in {user_id, None}
                ]
            else:
                filtered_docs = [
                    doc
                    for doc in matched_docs.data
                    if doc.get("metadata").get("user_id") is None
                ]

        results = []
        for doc in filtered_docs:
            results.append(
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
            )

        if results:
            last_used_document_source = results[0]["metadata"]["library_id"]

        return results
    except Exception as e:
        logging.error(f"Error in find_similar_documents: {e}")
        return []


async def generate_question_for_RAG(text: str):
    context = """
        You are an expert question generator.
        You are give a text and you need to generate a question from the text which can be used to generate a RAG.

        The question should be a single sentence and should be a good question for a RAG.
        Only return the question, no other text.
    """
    client = OpenAI()
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": context},
            {
                "role": "user",
                "content": f"Here is the text to generate the question from: {text}",
            },
        ],
    )

    generated_question = response.choices[0].message.content.strip()

    return generated_question


async def generate_ai_sentence(
    previous_text: str,
    heading: str,
    subheading: Optional[str] = None,
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

        client = OpenAI()
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

        generated_sentence = (
            response.choices[0].message.content.strip().split("\n\n")[-1]
        )
        similar_docs = await find_similar_documents(generated_sentence, user_id)

        return {"sentence": generated_sentence, "similar_documents": similar_docs}
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
        logging.info("Generating referenced sentence...")

        prompt = f"""
        You are an expert academic writer tasked with generating the next sentence for a research paper. Your goal is to produce a single, coherent sentence that logically follows the previous content and fits seamlessly into the paper's structure.

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

        client = OpenAI()
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