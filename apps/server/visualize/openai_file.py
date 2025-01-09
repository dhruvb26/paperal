from openai import OpenAI
import os
from dotenv import load_dotenv
import time

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# Upload a file with an "assistants" purpose
file = client.files.create(file=open("swebench.pdf", "rb"), purpose="assistants")
print(f"File uploaded successfully with ID: {file.id}")

# Create an assistant using the file ID
assistant = client.beta.assistants.create(
    name="PDF Assistant",
    instructions="""You are a specialized PDF analysis assistant with expertise in extracting and organizing information from academic and technical documents. Your tasks include:

1. Accurately identifying and extracting document structure (headings, sections, figures, tables)
2. Summarizing key points and findings
3. Maintaining the original formatting and hierarchical structure when presenting information
4. Providing precise citations or page numbers when referencing specific content
5. Responding with well-organized, structured information

When extracting content:
- Preserve numerical section numbering (e.g., 1.1, 2.3.1)
- Maintain hierarchical relationships between sections
- Distinguish between main headings and subheadings
- Exclude author names, references, and citations unless specifically requested""",
    model="gpt-4o",
    tools=[{"type": "code_interpreter"}],
    tool_resources={"code_interpreter": {"file_ids": [file.id]}},
)

# Create a thread
thread = client.beta.threads.create()

# Add a message to the thread
message = client.beta.threads.messages.create(
    thread_id=thread.id,
    role="user",
    content="""Please extract all headings from the PDF file and present them in a hierarchical structure. Follow these guidelines:

1. Include all types of headings:
   - Main sections (e.g., Abstract, Introduction, Conclusion)
   - Numbered sections (e.g., 1, 2, 3)
   - Subsections (e.g., 1.1, 1.2, 2.1)
   - Deep subsections (e.g., 1.1.1, 2.1.2)

2. Format requirements:
   - Maintain the original numbering scheme
   - Present in sequential order
   - Preserve exact heading text
   - Include one heading per line
   - Exclude author names, affiliations, and paper title

3. Output format:
   Abstract
   1. Introduction
   2. Background
      2.1 First Subsection
      2.2 Second Subsection
         2.2.1 Detailed Point
   3. Methodology
   ...

Please extract and list all headings following this format.""",
)

# Run the assistant
run = client.beta.threads.runs.create(thread_id=thread.id, assistant_id=assistant.id)

# Wait for the run to complete
while True:
    run_status = client.beta.threads.runs.retrieve(thread_id=thread.id, run_id=run.id)
    if run_status.status == "completed":
        break

# Get the messages
messages = client.beta.threads.messages.list(thread_id=thread.id)
for message in messages.data:
    # Print role and actual content
    role = message.role
    for content in message.content:
        if content.type == "text":
            print(f"{role}: {content.text.value}")
