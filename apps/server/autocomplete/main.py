import logging
import os
from functools import lru_cache
from typing import Optional

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


@lru_cache()
def get_supabase_client():
    """Cached Supabase client to avoid repeated connections"""
    return supabase_embeddings.create_supabase_client()


@lru_cache()
def get_embeddings_model():
    """Cached embeddings model"""
    return OpenAIEmbeddings(api_key=os.getenv("OPENAI_API_KEY"))


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

        supabase = get_supabase_client()
        embeddings = get_embeddings_model()

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
    """
    try:
        supabase = get_supabase_client()
        embeddings = get_embeddings_model()
        vector_store = SupabaseVectorStore(
            client=supabase,
            embedding=embeddings,
            table_name="embeddings",
            query_name="match_documents",
        )
        # Search for similar documents
        matched_docs = query_vector_store(generated_sentence, vector_store)
        # Filter documents based on user_id
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
                    },
                }
            )
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
        Context for Sentence Generation:
        - Research Topic: {heading}
        - Current Section: {subheading if subheading else None}
        - Previous Text: {previous_text}

        Task:
        Generate 1 sentence that naturally follow the previous text.

        Guidelines:
        - Ensure logical flow from the previous text
        - Don't use words like "Our research shows that..." or "According to our research..." or "In our research...".
        - Focus on creating cohesive transitions between ideas
        - Avoid making specific claims that would require citations
        """

        client = OpenAI()
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a research paper writing assistant."},
                {"role": "user", "content": context},
            ],
            temperature=0.3,
        )

        generated_sentence = response.choices[0].message.content.strip()
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
        Context for Sentence Generation:
        - Research Topic: {heading}
        - Current Section: {subheading if subheading else None}
        - Previous Text: {previous_text}
        - Reference Material: {paper_content}
        

        Task:
        Generate 1 sentence that takes inspiration from the reference material.

        Guidelines:
        - Use information from the provided reference material
        - Don't use words like "Our research shows that..." or "According to our research..." or "In our research...".
        - Ensure logical flow from the previous text
        """

        client = OpenAI()
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a research paper writing assistant."},
                {"role": "user", "content": context},
            ],
            temperature=0.2,
        )
        logging.info("Sentence generated successfully.")
        res = {
            "sentence": response.choices[0].message.content.strip(),
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
        # print(doc)
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
        "ai_sentence": (None if sentence else ai_generated.get("sentence", None)),
        "referenced_sentence": sentence.get("sentence", None) if sentence else None,
        "is_referenced": True if sentence else False,
        "author": doc["metadata"].get("author", None) if sentence else None,
        "url": doc["metadata"].get("url", None) if sentence else None,
        "title": doc["metadata"].get("title", None) if sentence else None,
        "library_id": doc["metadata"].get("library_id", None) if sentence else None,
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
