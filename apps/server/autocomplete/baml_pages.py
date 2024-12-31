from openai import OpenAI
from baml_client.types import Page
import os
from dotenv import load_dotenv
from baml_client import reset_baml_env_vars
import json
import pathlib
from pathlib import Path

load_dotenv()

from baml_client.sync_client import b
reset_baml_env_vars(dict(os.environ))
OpenAI.api_key = os.getenv("OPENAI_API_KEY")

def extract_pages(references: str, page_content: list[str]) -> Page:
    response = b.ExtractPaperContent(references, page_content)
    return response

if __name__ == "__main__":
    # Load references
    with open("reference_results/combined_references.json", "r") as f:
        references = json.load(f)
    
    # Create output directory if it doesn't exist
    output_dir = Path("extracted_pages_output")
    output_dir.mkdir(exist_ok=True)
    
    # Loop through specified range of pages
    pages_dir = Path("pages_content")
    start_page = 1  # Define your start page
    end_page = 11  # Define your end page
    
    for page_num in range(start_page, end_page + 1):
        page_file = pages_dir / f"page_{page_num}.json"
        
        # Skip if file doesn't exist
        if not page_file.exists():
            print(f"Skipping page {page_num} - file not found")
            continue
        
        # Load page content
        with open(page_file, "r") as f:
            page_content = json.load(f)

        references_str = json.dumps(references)
        
        # Process the page
        response = extract_pages(references_str, page_content)
        
        # Save the output
        output_file = output_dir / f"extracted_page_{page_num}.json"
        with open(output_file, "w") as f:
            json.dump(response.model_dump(), f, indent=2)
        print(f"Processed page {page_num}")
        