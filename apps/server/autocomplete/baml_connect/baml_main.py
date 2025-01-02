import os

from baml_connect.baml_client import reset_baml_env_vars
from baml_connect.baml_client.types import Paper
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

from baml_connect.baml_client.sync_client import b

reset_baml_env_vars(dict(os.environ))
OpenAI.api_key = os.getenv("OPENAI_API_KEY")


def example(raw_text: str) -> Paper:

    response = b.ExtractPaper(raw_text)

    return response


if __name__ == "__main__":
    x = example("Hello, this is a test")
    print(x)
