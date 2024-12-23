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

# graphrag (lightrag)
from knowledge_graphs.helpers import process_text_into_neo4j

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
    research_urls: dict
    user_id: Optional[str] = None


# for processing text into kg
class ProcessTextRequest(BaseModel):
    text: str


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


def StoreResearchPaperAgent(research_url: dict, user_id: Optional[str] = None) -> bool:
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
            checker = supabase_embeddings.query_metadata("source", url, supabase, user_id)
            if len(checker.data) != 0:
                logging.warning(f"Research paper already stored: {url}")
                continue
            docum = Document(page_content=text)
            docs = supabase_embeddings.split_documents([docum])
            supabase_embeddings.add_metadata(
                docs, url, extracted_info.author, extracted_info.title, user_id
            )
            supabase_embeddings.create_vector_store(docs, embeddings, supabase)

            logging.info("Research papers stored successfully.")
        return True
    except Exception as e:
        logging.error(f"Error in StoreResearchPaperAgent: {e}")
        return False


def SentenceGeneratorAgent(
    previous_text: str,
    heading: str,
    subheading: Optional[str] = None,
    user_id: Optional[str] = None,
) -> dict:
    """
    Generates a sentence based on the given context and heading.
    """
    try:
        res = {}
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
        # Filter documents based on user_id
        if user_id:
            # Access PDFs with the provided user_id and PDFs with no user_id
            filtered_docs = [
                doc for doc, score in matched_docs if doc.metadata.get("user_id") in {user_id, None}
            ]
        else:
            # Only access PDFs with no user_id
            filtered_docs = [
                doc for doc, score in matched_docs if doc.metadata.get("user_id") is None
            ]
            logging.info(f"Filtered documents based on no user_id: {len(filtered_docs)}")
        if not filtered_docs:
            logging.warning("No matching documents found based on user_id criteria.")
            return ""
        paper_content = filtered_docs[0].page_content
        author = filtered_docs[0].metadata.get("author", "Unknown")
        title = filtered_docs[0].metadata.get("title", "Unknown")
        url = filtered_docs[0].metadata.get("source", "Unknown")

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
        res = {
            "sentence": response.choices[0].message.content.strip(),
            "author": author,
            "url": url,
            "title": title,
        }
        return res
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
    success = StoreResearchPaperAgent(request.research_urls, request.user_id)
    return {"success": success}


@app.post("/generate")
async def generate_sentence(request: SentenceRequest):
    """Endpoint to generate a sentence based on the given context."""
    logging.info("Received request to generate sentence.")
    sentence = SentenceGeneratorAgent(
        request.previous_text, request.heading, request.subheading, request.user_id
    )
    return sentence

# process a string into a kg, stored in neo4j
# might be more practical to take a pdf input and extract the text all witin this function
@app.post("/create_document_kg")
async def create_document_kg(request: SentenceRequest):
    """Endpoint to process text into a knowledge graph."""
    logging.info("Received request to process text into a knowledge graph.")

    # use lightrag to process text into a kg
    res = process_text_into_neo4j(request.text)

    # we're not returning it here, if the playground wants to call the kg we'll have a dif endpoint for that
    if res:
        response = {"success": True}
    else:
        response = {"success": False}

    return response

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
