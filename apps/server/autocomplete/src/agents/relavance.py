from openai import OpenAI
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")


def select_most_relevant_sentence(context: str, sentence1: str, sentence2: str) -> str:
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

    prompt = f"""Given the following context and two possible next sentences, 
    determine which sentence is more relevant and natural to follow the context.
    Keep in mind the context is part of a larger document. 
    If the context is empty, then the output sentence should be the one which gives an introduction.
    If the two sentences are similar, then the output sentence should be sentence 2.
    Only respond with "1" or "2" to indicate your choice.

    Context: {context}

    Sentence 1: {sentence1}
    Sentence 2: {sentence2}

    Which sentence (1 or 2) is more relevant?"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1,
    )

    choice = response.choices[0].message.content.strip()

    return sentence1 if choice == "1" else sentence2
