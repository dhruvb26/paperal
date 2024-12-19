import os
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI
from langchain_community.vectorstores import SupabaseVectorStore
from langchain_openai import OpenAIEmbeddings

import supabase_embeddings as supabase_embeddings
import tiktoken
import logging
import baml_main as baml_main
from tavily_test import getURL
from pydantic import BaseModel
from openai import OpenAI
import requests
from fastapi.middleware.cors import CORSMiddleware
from langchain.schema import Document
import fitz

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
    subheading: Optional[str]


class StoreResearchRequest(BaseModel):
    research_urls: dict


# Utility function
def sanitize_text(text: str) -> str:
    """Remove null characters and sanitize the text."""
    return text.replace("\u0000", "").strip()


# Agents
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
        truncated_tokens = tokens[:1000]
        truncated_text = tokenizer.decode(truncated_tokens)
        sanitized_text = sanitize_text(truncated_text)
        logging.info("Getting response from baml_main...")
        response = baml_main.example(sanitized_text)
        return response
    except Exception as e:
        logging.error(f"Error in ExtractPaperAgent: {e}")
        return ""


def StoreResearchPaperAgent(research_url: dict) -> bool:
    """
    Stores research papers embeddings in the database.
    """
    try:
        if not research_url:
            logging.warning("No URLs provided.")
            return False

        supabase = supabase_embeddings.create_supabase_client()
        embeddings = OpenAIEmbeddings(api_key=os.getenv("OPENAI_API_KEY"))

        for url in research_url["url_list"]:
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
            docum = Document(page_content=text)
            docs = supabase_embeddings.split_documents([docum])
            supabase_embeddings.add_metadata(docs, url, extracted_info.author, extracted_info.title)
            supabase_embeddings.create_vector_store(docs, embeddings, supabase)

        logging.info("Research papers stored successfully.")
        return True
    except Exception as e:
        logging.error(f"Error in StoreResearchPaperAgent: {e}")
        return False


def SentenceGeneratorAgent(previous_text: str, heading: str, subheading: Optional[str]) -> str:
    """
    Generates a sentence based on the given context and heading.
    """
    try:
        logging.info("Generating sentence...")
        supabase = supabase_embeddings.create_supabase_client()
        embeddings = OpenAIEmbeddings(api_key=os.getenv("OPENAI_API_KEY"))
        vector_store = SupabaseVectorStore(
            client=supabase,
            embedding=embeddings,
            table_name="documents",
            query_name="match_documents",
        )

        matched_docs = vector_store.similarity_search_with_relevance_scores(previous_text)
        if not matched_docs:
            logging.warning("No matching documents found.")
            return ""

        paper_content = matched_docs[0][0].page_content
        author = matched_docs[0][0].metadata.get("author", "Unknown")

        context = f"""
        text to generate sentence from: {paper_content}
        Previous text: {previous_text}
        Heading: {heading}
        Subheading: {subheading if subheading else 'None'}
        Author: {author}

        You are writing a research paper on the topic of {heading}. Suggest the next line that would be appropriate for this section of a research paper:
        1. Topical relevance to the heading/subheading
        2. Logical connection to the previous text
        3. Information value and contribution to the topic

        Respond with a sentence that maintains coherent flow with the previous text. Follow APA 7 style in-text citation format.
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
        logging.info("Sentence generated successfully.")
        return response.choices[0].message.content.strip()
    except Exception as e:
        logging.error(f"Error in SentenceGeneratorAgent: {e}")
        return ""


# API Endpoints
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
    success = StoreResearchPaperAgent(request.research_urls)
    return {"success": success}


@app.post("/generate")
async def generate_sentence(request: SentenceRequest):
    """Endpoint to generate a sentence based on the given context."""
    logging.info("Received request to generate sentence.")
    sentence = SentenceGeneratorAgent(request.previous_text, request.heading, request.subheading)
    return sentence


@app.get("/")
async def root():
    return {"message": "Hello World"}


# Example usage
if __name__ == "__main__":
    logging.info("Starting example usage.")
    query_results = TavilySearchAgent("RAG")
    StoreResearchPaperAgent(query_results)
