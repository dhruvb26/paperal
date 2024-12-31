
from baml_client.types import Paper
from openai import OpenAI
import os
from dotenv import load_dotenv
from baml_client import reset_baml_env_vars

load_dotenv()

from baml_client.sync_client import b
reset_baml_env_vars(dict(os.environ))
OpenAI.api_key = os.getenv("OPENAI_API_KEY")

def example(raw_text: str)-> Paper: 

  response = b.ExtractPaper(raw_text)
  
  return response

if __name__ == "__main__":
  x = example("Hello, this is a test")
  print(x)