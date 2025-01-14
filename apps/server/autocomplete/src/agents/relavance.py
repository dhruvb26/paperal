from openai import OpenAI
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")


def select_most_relevant_sentence(
    sentence1: str, sentence2: str, previous_text: str
) -> bool:
    """
    Uses OpenAI to determine which of two sentences is more relevant given the context.

    Args:
        context: The preceding text/context
        sentence1: First sentence option


    Returns:
        The more relevant sentence between the two options
    """
    client = OpenAI(api_key=api_key)

    prompt = f"""Given the following sentences and previous text,
    Determine which sentence follows the previous text best.
    Return "1" if sentence1 follows the previous text best.
    Return "2" if sentence2 follows the previous text best.

    If the sentences are similar, return "2".

    Sentence 1: {sentence1}
    Sentence 2: {sentence2}
    Previous Text: {previous_text}

    Which sentence follows the previous text best?"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1,
    )

    choice = response.choices[0].message.content.strip()
    if choice == "2" or choice == "Both":
        return True
    return False
