from openai import OpenAI
from typing import Optional
from extract import extract_pdf_sections
import os
from dotenv import load_dotenv

load_dotenv()


def generate_content_summary(content: str) -> Optional[str]:
    """
    Generate a summary of the provided content using OpenAI's API.

    Args:
        content (str): The text content to summarize
        max_tokens (int): Maximum length of the summary in tokens

    Returns:
        Optional[str]: Generated summary or None if the API call fails
    """
    try:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": """You are a helpful assistant that creates concise summaries. Always include the in-text citations in the summary. 
                    - Everything must be wrapped in a single <body> tag
                    - Use semantic HTML elements like <p>, <h1>, <span> for structure
                    - Use inline CSS for styling and colors to enhance readability
                    - Use blue for in-text citations and enclose them in parentheses
                    - If no citations are present, don't include them in the summary
                    - Only return the HTML summary, no additional text or markdown
                    - Keep the summary clear and well-organized
                    """,
                },
                {
                    "role": "user",
                    "content": f"Please summarize the following content in a clear and concise way: {content}",
                },
            ],
            temperature=0.7,
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"Error generating summary: {str(e)}")
        return None


if __name__ == "__main__":
    content = extract_pdf_sections(
        "https://arxiv.org/pdf/1706.03762",
        [
            "Introduction",
            "Background",
            "Model Architecture",
            "Encoder and Decoder Stacks",
            "Attention",
            "Scaled Dot-Product Attention",
            "Multi-Head Attention",
            "Application of Attention in our Model",
            "Position-wise Feed-Forward Networks",
            "Embeddings and Softmax",
            "Positional Encoding",
            # "Acknowledgements",
            # "Broader Impact",
            # "Compute",
            # "Additional Experiments",
        ],
    )
    for heading, content in content.items():
        summary = generate_content_summary(content[:2000])
        print(f"\n=== {heading} ===")
        # summary = summary.split("<body>")[1]
        # summary = summary.split("</body>")[0]
        print(summary.strip())
