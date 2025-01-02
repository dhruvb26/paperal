from openai import OpenAI
from baml_connect.baml_client.types import NewPage
import os
from dotenv import load_dotenv
from baml_connect.baml_client.sync_client import b
from baml_connect.baml_client import reset_baml_env_vars
import json
import pathlib
from pathlib import Path

load_dotenv()

reset_baml_env_vars(dict(os.environ))
OpenAI.api_key = os.getenv("OPENAI_API_KEY")


def extract_pages(
    previous_section: str, references: str, page_content: list[str]
) -> NewPage:
    response = b.ExtractNewPaperContent(previous_section, references, page_content)
    return response


if __name__ == "__main__":
    # Create output directory if it doesn't exist
    output_dir = Path("extracted_pages_output")
    output_dir.mkdir(exist_ok=True)

    # Load references
    with open("reference_results/combined_references.json", "r") as f:
        references = json.load(f)
    references_str = json.dumps(references)

    previous_section = "Procedure for the LLM Dataset Inference"

    # Load page content
    with open("pages_content/page_9.json", "r") as f:
        page_content = json.load(f)

    # Process the page
    response = extract_pages(previous_section, references_str, page_content)

    # Save the output
    output_file = output_dir / "extracted_page_9.json"
    with open(output_file, "w") as f:
        json.dump(response.model_dump(), f, indent=2)
    print("Processed page 9")
