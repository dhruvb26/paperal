import os
from typing import Optional

from baml_connect.baml_client.types import Paper
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

OpenAI.api_key = os.getenv("OPENAI_API_KEY")

# Global variable to hold the client
_baml_client: Optional[object] = None


def get_baml_client():
    """Get or create the BAML client."""
    global _baml_client
    
    if _baml_client is None:
        # Import the client directly - environment variables are already loaded
        from baml_connect.baml_client.sync_client import b
        _baml_client = b
    
    return _baml_client


def example(raw_text: str) -> Paper:
    client = get_baml_client()
    response = client.ExtractPaper(raw_text)
    return response


if __name__ == "__main__":
    x = example("Hello, this is a test")
    print(x)
