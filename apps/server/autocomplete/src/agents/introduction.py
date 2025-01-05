from openai import OpenAI
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()


def suggest_opening_statement(heading: str, client: Optional[OpenAI] = None) -> str:
    """
    Generates an opening statement for a research paper based on the given heading.

    Args:
        heading (str): The heading/title of the research paper
        client (Optional[OpenAI]): OpenAI client instance. If None, creates a new one.

    Returns:
        str: Generated opening statement for the research paper
    """
    if client is None:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    prompt = f"""Given the research paper heading: "{heading}"
    Generate a compelling opening statement that:
    1. Introduces the topic broadly
    2. Establishes the importance of the research
    3. Is approximately 20-25 words long
    4. Uses academic language
    5. Only return the opening statement without any additional commentary or markdown.
    """

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {
                "role": "system",
                "content": "You are an academic writing assistant specializing in research paper introductions.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=200,
    )

    return response.choices[0].message.content.strip()
