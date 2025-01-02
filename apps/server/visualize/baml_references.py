import json
import os
import pathlib

from dotenv import load_dotenv
from openai import OpenAI
from baml_connect.baml_client import reset_baml_env_vars
from baml_connect.baml_client.types import References

load_dotenv()

from baml_connect.baml_client.sync_client import b

reset_baml_env_vars(dict(os.environ))
OpenAI.api_key = os.getenv("OPENAI_API_KEY")


def extract_references(raw_text: list[str]) -> References:
    response = b.ExtractReferences(raw_text)
    return response


if __name__ == "__main__":
    output_dir = pathlib.Path("reference_results")
    output_dir.mkdir(exist_ok=True)

    # Initialize list to store all references
    all_references = []

    with open("extracted_references.json", "r") as f:
        extracted_references = json.load(f)
    all_references.append(extracted_references)
    response = extract_references(all_references)
    # for page_num in range(11, 15):
    #     input_file = f"pages_content/page_{page_num}.json"

    #     with open(input_file, "r") as f:
    #         pages_content = json.load(f)

    #     response = extract_references(pages_content)
    #     # Extract references from response and extend the list
    #     all_references.extend(response.model_dump()["references"])

    # Write combined references to a single output file
    final_output = {"references": response.model_dump()["references"]}
    with open(output_dir / "combined_references.json", "w") as f:
        json.dump(final_output, f, indent=2)
