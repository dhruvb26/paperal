from openai import OpenAI
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")


def select_most_relevant_sentence(context: str, sentence1: str, sentence2: str) -> int:
    """
    Uses OpenAI to determine which of two sentences is more relevant given the context.

    Args:
        context: The preceding text/context
        sentence1: First sentence option
        sentence2: Second sentence option

    Returns:
        The more relevant sentence between the two options
    """
    client = OpenAI(api_key=api_key)

    prompt = f"""Given the following context, compare these two sentences and determine which one follows the context better.
    If the sentences are similar, return "1".
    Only respond with "1" or "2" to indicate which sentence is more relevant.

    Context: {context}

    Sentence 1: {sentence1}
    Sentence 2: {sentence2}

    Which sentence (1 or 2) follows the context better?"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1,
    )

    choice = response.choices[0].message.content.strip()

    return 1 if choice == "1" else 2
