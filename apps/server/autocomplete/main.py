import logging
import os
from functools import lru_cache
from typing import Optional
from contextlib import contextmanager
import atexit

import baml_main as baml_main
import fitz
import requests
import supabase_embeddings as supabase_embeddings
import tiktoken

# graphrag (lightrag)
# from backend.lightrag_implement.helpers import process_text_into_neo4j
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langchain.schema import Document
from langchain_community.vectorstores import SupabaseVectorStore
from langchain_openai import OpenAIEmbeddings
from openai import OpenAI
from pydantic import BaseModel
from supabase_embeddings import query_vector_store
from tavily_test import getURL, generate_research_topic

# Load environment variables
load_dotenv()

# Logging setup
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request models
class SentenceRequest(BaseModel):
    previous_text: str
    heading: str
    subheading: Optional[str] = None
    user_id: Optional[str] = None


class StoreResearchRequest(BaseModel):
    research_urls: list[str]
    user_id: Optional[str] = None


class SuggestStructureRequest(BaseModel):
    heading: str
    content: str


# Global client storage
_supabase_client = None
_embeddings_model = None

@contextmanager
def get_clients():
    """Context manager to handle client lifecycle"""
    try:
        # Get or create clients
        global _supabase_client, _embeddings_model
        if _supabase_client is None:
            _supabase_client = supabase_embeddings.create_supabase_client()
        if _embeddings_model is None:
            _embeddings_model = OpenAIEmbeddings(api_key=os.getenv("OPENAI_API_KEY"))
        
        yield _supabase_client, _embeddings_model
    except Exception as e:
        logging.error(f"Error creating clients: {e}")
        raise
    finally:
        # Resources will be cleaned up at program exit
        pass

def cleanup_clients():
    """Cleanup function to be called at program exit"""
    global _supabase_client, _embeddings_model
    if _supabase_client:
        try:
            _supabase_client.close()
        except:
            pass
        _supabase_client = None
    if _embeddings_model:
        try:
            _embeddings_model.client.close()
        except:
            pass
        _embeddings_model = None

# Register cleanup function
atexit.register(cleanup_clients)

# Utility function
def sanitize_text(text: str) -> str:
    """Remove null characters and sanitize the text."""
    return text.replace("\u0000", "").strip()


# Agents


def research_topic_agent(query: str) -> dict:
    """
    Agent to generate a research topic.
    """
    return generate_research_topic(query)


def TavilySearchAgent(query: str) -> dict:
    """
    Agent to search the Tavily database for relevant information.
    """
    try:
        logging.info(f"Searching Tavily for query: {query}")
        return getURL(query)
    except Exception as e:
        logging.error(f"Error in TavilySearchAgent: {e}")
        return {}


def ExtractPaperAgent(text: str) -> str:
    """
    Extracts text from a PDF file and processes it for further use.
    """
    try:
        logging.info("Extracting text from PDF...")
        tokenizer = tiktoken.get_encoding("cl100k_base")

        tokens = tokenizer.encode(text)
        truncated_tokens = tokens[:1500]
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
                {"role": "system", "content": "You are a research paper writing assistant."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.9,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logging.error(f"Error in generate_citation: {e}")
        return {}


def StoreResearchPaperAgent(research_url: list[str], user_id: Optional[str] = None) -> bool:
    """
    Stores research papers embeddings in the database.
    """
    try:
        if not research_url:
            logging.warning("No URLs provided.")
            return False

        with get_clients() as (supabase, embeddings):
            for url in research_url:
                text = ""
                response = requests.get(url)

                if response.status_code == 200:
                    logging.info(f"Downloading PDF from URL: {url}")
                    pdf_data = response.content
                    pdf_document = fitz.open(stream=pdf_data, filetype="pdf")

                    for page_number in range(len(pdf_document)):
                        page = pdf_document[page_number]
                        text += page.get_text()
                else:
                    logging.warning(f"Failed to fetch PDF. Status code: {response.status_code}")
                    continue
                text = sanitize_text(text)
                extracted_info = ExtractPaperAgent(text)
                checker = supabase_embeddings.query_metadata("fileUrl", url, supabase, user_id)
                if len(checker.data) != 0:
                    logging.warning(f"Research paper already stored: {url}")
                    continue
                docum = Document(page_content=text)
                docs = supabase_embeddings.split_documents([docum])

                metadata_for_library = {
                    "fileUrl": url,
                    "authors": extracted_info.author,
                    "year": extracted_info.year,
                    "citations": {
                        "in-text": generate_in_text_citation(
                            extracted_info.author, extracted_info.year
                        ),
                        # "after-text citation": generate_after_text_citation(
                        #     extracted_info.author, extracted_info.year
                        # ),
                    },
                }

                data = {
                    "title": extracted_info.title,
                    "description": extracted_info.abstract,
                    "user_id": user_id,
                    "metadata": metadata_for_library,
                    "is_public": True if user_id == None else False,
                }
                # add library_id to metadata
                library_id = supabase.table("library").insert(data).execute()
                print(library_id)
                print(library_id.data[0]["id"])
                supabase_embeddings.add_metadata(
                    docs,
                    url,
                    extracted_info.author,
                    extracted_info.title,
                    extracted_info.year,
                    user_id,
                    library_id.data[0]["id"],
                )
                supabase_embeddings.create_vector_store(docs, embeddings, supabase)

                logging.info("Research papers stored successfully.")
        return True
    except Exception as e:
        logging.error(f"Error in StoreResearchPaperAgent: {e}")
        return False


# Global variable to track the last used document
last_used_document_source = None


def find_similar_documents(generated_sentence: str, user_id: Optional[str] = None) -> list:
    """
    Queries the vector database to find documents similar to the generated sentence.
    Avoids using the same document consecutively.
    """
    global last_used_document_source
    try:
        with get_clients() as (supabase, embeddings):
            vector_store = SupabaseVectorStore(
                client=supabase,
                embedding=embeddings,
                table_name="embeddings",
                query_name="match_documents",
            )
            
            # Search for similar documents
            matched_docs = query_vector_store(generated_sentence, vector_store)
            
            # Filter documents based on user_id and last used document
            if user_id:
                filtered_docs = [
                    (doc, float(score))
                    for doc, score in matched_docs
                    if doc.metadata.get("user_id") in {user_id, None}
                    and doc.metadata.get("library_id") != last_used_document_source
                ]
            else:
                filtered_docs = [
                    (doc, float(score))
                    for doc, score in matched_docs
                    if doc.metadata.get("user_id") is None
                    and doc.metadata.get("library_id") != last_used_document_source
                ]

            # If no documents found after filtering, remove the last_used_document constraint
            if not filtered_docs:
                if user_id:
                    filtered_docs = [
                        (doc, float(score))
                        for doc, score in matched_docs
                        if doc.metadata.get("user_id") in {user_id, None}
                    ]
                else:
                    filtered_docs = [
                        (doc, float(score))
                        for doc, score in matched_docs
                        if doc.metadata.get("user_id") is None
                    ]

            # Format results with native Python types
            results = []
            for doc, score in filtered_docs:
                results.append(
                    {
                        "content": str(doc.page_content),
                        "score": float(score),
                        "metadata": {
                            "author": str(doc.metadata.get("author", "Unknown")),
                            "title": str(doc.metadata.get("title", "Unknown")),
                            "url": str(doc.metadata.get("source", "Unknown")),
                            "library_id": str(doc.metadata.get("library_id", "Unknown")),
                        },
                    }
                )

            # Update last_used_document_source if we found results
            if results:
                last_used_document_source = results[0]["metadata"]["library_id"]
            
            return results
    except Exception as e:
        logging.error(f"Error in find_similar_documents: {e}")
        return []


def suggest_structure_helper(heading: str, content: str) -> str:
    prompt = f"""
    You are given a research paper - {content} and a user query - {heading}.
    You are to suggest a subheading for the research paper based on the provided content and user query.
    Make sure the subheading flows logically with the previous content and pertains to the user query.
    The subheading should be very short and concise something like Abstract, Conclusion, Methodology, etc.
    Only return the subheading, no other text.
    """
    try:
        client = OpenAI()
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a research paper writing assistant."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.6,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logging.error(f"Error in suggest_structure: {e}")
        return ""


def generate_ai_sentence(
    # improve prompt
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
        You are an advanced AI research paper writing assistant. Your task is to generate a single, academically-styled sentence that continues the narrative flow of a research paper. You will be provided with context about the paper and must adhere to specific guidelines to ensure high-quality, coherent output.

First, carefully review the following context:

<research_topic>
{heading}
</research_topic>

<current_section>
{subheading if subheading else None}
</current_section>

<previous_text>
{previous_text}
</previous_text>

Before generating the sentence, wrap your analysis in <analysis> tags. Consider the following:

1. Identify the current section of the paper (Introduction, Body, or Conclusion).
2. Identify key themes or concepts from the research topic and current section.
3. Note any important terminology or jargon that should be incorporated.
4. Analyze the previous text to determine the last concept discussed.
5. Plan how to continue the narrative flow while adhering to the section-specific guidelines.
6. Consider how the new sentence can build upon or transition from the last concept in the previous text.
7. Consider potential transition words or phrases if needed.
8. Count the words in each potential sentence to ensure they meet the length requirement. Do this by numbering each word, e.g., "1. This 2. sentence 3. has 4. four 5. words."
9. Brainstorm 2-3 potential sentences, including a word count for each to ensure they're not too long or short.

After your analysis, generate a single sentence that meets the following criteria:

Example output format:
<sentence_planning>
[Your analysis and planning process here]
</sentence_planning>

[Your single, academically-styled sentence here]

Remember, the final output should only include the generated sentence, without the sentence_planning tags or any other text.
        """

        client = OpenAI()
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a research paper writing assistant."},
                {"role": "user", "content": context},
            ],
            temperature=0.8,
        )

        generated_sentence = response.choices[0].message.content.strip().split("\n\n")[-1]
        similar_docs = find_similar_documents(generated_sentence, user_id)

        return {"sentence": generated_sentence, "similar_documents": similar_docs}
    except Exception as e:
        logging.error(f"Error in generate_ai_sentence: {e}")
        return {}


def generate_referenced_sentence(
    previous_text: str,
    heading: str,
    paper_content: str,
    subheading: Optional[str] = None,
) -> dict:
    """
    Generates a sentence using referenced materials from the vector store.
    """
    global last_used_document_source
    try:
        res = {}
        logging.info("Generating referenced sentence...")

        context = f"""
        You are an advanced academic writing assistant tasked with generating a single, academically-styled sentence that integrates information from reference material while maintaining flow with existing text. Your goal is to help researchers seamlessly incorporate new information into their papers.

Here is the context for the academic writing task:

Research Topic:
<research_topic>
{heading}
</research_topic>

Current Section:
<current_section>
{subheading if subheading else None}
</current_section>

Previous Text:
<previous_text>
{previous_text}
</previous_text>

Reference Material:
<reference_material>
{paper_content}
</reference_material>

Your task is to generate one academically-styled sentence that integrates information from the reference material while maintaining flow with the previous text. Before providing the final sentence, wrap your analysis and planning process inside sentence_planning tags.

Instructions for the sentence planning process:
1. Summarize the key points from the research topic and current section.
2. Review the previous text to ensure logical flow.
3. List 2-3 relevant quotes from the reference material that are pertinent to the current section.
4. Brainstorm 2-3 potential sentence structures that adhere to the following requirements:
   - Length: 15-25 words
   - Use precise academic vocabulary
   - Maintain third-person perspective
   - Avoid passive voice unless necessary
   - Include appropriate citation markers (e.g., "Research has shown that...")
5. Count the words in each potential sentence to ensure they meet the length requirement. Do this by numbering each word, e.g., "1. This 2. sentence 3. has 4. four 5. words."
6. Consider how to integrate this information while maintaining academic objectivity and formal tone.
7. Ensure the sentence doesn't violate any of these prohibitions:
   - No first-person references (we, our, us)
   - No direct quotes from the reference material
   - No self-referential phrases ("this research," "our study," etc.)
   - No speculative or unsupported claims
   - No informal language or colloquialisms

After your sentence planning process, provide only the generated sentence, with no additional text or explanations.

Example output format:
<sentence_planning>
[Your analysis and planning process here]
</sentence_planning>

[Your single, academically-styled sentence here]

Remember, the final output should only include the generated sentence, without the sentence_planning tags,references or any other text.
        """

        client = OpenAI()
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a research paper writing assistant."},
                {"role": "user", "content": context},
            ],
            temperature=0.6,
        )
        logging.info("Sentence generated successfully.")
        res = {
            "sentence": response.choices[0].message.content.strip().split("\n\n")[-1],
        }
        return res
    except Exception as e:
        logging.error(f"Error in generate_referenced_sentence: {e}")
        return {}


# API Endpoints


# create new endpoint that only sends research topic
@app.post("/research_topic")
async def research_topic(query: str):
    """Endpoint to generate a sentence based on the given context."""
    logging.info("Received request to generate topic.")
    result = research_topic_agent(query)

    return {"research_topic": result}


@app.post("/search")
async def search_tavily(query: str):
    """Endpoint to search Tavily database."""
    logging.info("Received search request.")
    results = TavilySearchAgent(query)
    return {"results": results}


@app.post("/store")
async def store_research_papers(request: StoreResearchRequest):
    """Endpoint to store research papers in the database."""
    logging.info("Received request to store research papers.")
    success = StoreResearchPaperAgent(request.research_urls, request.user_id)
    return {"success": success}


@app.post("/generate")
async def generate_sentence(request: SentenceRequest):
    """Endpoint to generate a sentence based on the given context."""
    logging.info("Received request to generate sentence.")

    # Generate non-referenced sentence
    ai_generated = generate_ai_sentence(request.previous_text, request.heading, request.subheading)

    sentence = {}
    for doc in ai_generated.get("similar_documents", []):
        if doc["score"] > 0.5:
            # add user_id
            sentence = generate_referenced_sentence(
                request.previous_text,
                request.heading,
                doc["content"],
                request.subheading,
            )
        break

    return {
        "ai_sentence": ai_generated.get("sentence", None),
        "referenced_sentence": sentence.get("sentence", None) if sentence else None,
        "is_referenced": True if sentence else False,
        "author": doc["metadata"].get("author", None) if sentence else None,
        "url": doc["metadata"].get("url", None) if sentence else None,
        "title": doc["metadata"].get("title", None) if sentence else None,
        "library_id": doc["metadata"].get("library_id", None) if sentence else None,  # Ensure this line correctly references the 'id'
    }


@app.post("/suggest_structure")
async def suggest_structure(request: SuggestStructureRequest):
    """Endpoint to suggest a subheading for the research paper."""
    logging.info("Received request to suggest a subheading.")
    subheading = suggest_structure_helper(request.heading, request.content)
    return {"subheading": subheading}


# process a string into a kg, stored in neo4j
# might be more practical to take a pdf input and extract the text all witin this function
# @app.post("/create_document_kg")
# async def create_document_kg(request: SentenceRequest):
#     """Endpoint to process text into a knowledge graph."""
#     logging.info("Received request to process text into a knowledge graph.")

#     # use lightrag to process text into a kg
#     res = process_text_into_neo4j(request.text)

#     # we're not returning it here, if the playground wants to call the kg we'll have a dif endpoint for that
#     if res:
#         response = {"success": True}
#     else:
#         response = {"success": False}

#     return response


# should add an endpoint for returning a kg for a "project" or "document" in our app.
# That's something we'll need to manually keep track of with metadata in the nodes
# Unless we can find a way to assign nodes in neo4j to namespaces, Not sure if they have that built in'
# this endpoint will also involve some parsing to get the data out of neo4j, so that we have a list of nodes, and a list or relationships to pass into react flow


@app.get("/")
async def root():
    return {"message": "Hello World"}


# Example usage
if __name__ == "__main__":
    logging.info("Starting example usage.")
    query_results = TavilySearchAgent("RAG")
    StoreResearchPaperAgent(query_results)
