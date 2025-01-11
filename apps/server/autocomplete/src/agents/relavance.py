from openai import OpenAI
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")


def select_most_relevant_sentence(
    context: str, sentence: str, previous_text: str
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

    prompt = f"""Given the following context and the sentence generated using the context,
    Determine if the sentence is relevant to the context and the previous text.
    If the sentence is not relevant, return "No".
    If the sentence is relevant, return "Yes".

    Context: {context}

    Sentence: {sentence}
    Previous Text: {previous_text}

    Is the sentence relevant to the context?"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1,
    )

    choice = response.choices[0].message.content.strip()

    return choice == "Yes"
