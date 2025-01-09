# Import the OpenAI client
from openai import OpenAI

# Initialize the client (you'll need your API key)
client = OpenAI(api_key="")  # Assumes OPENAI_API_KEY environment variable is set

# Upload a file with an "assistants" purpose
file = client.files.create(
    file=open("2402.pdf", "rb"),
    purpose='assistants'
)

# Create an assistant using the file ID
assistant = client.beta.assistants.create(
    name="Extract PDF",  # Optional but recommended
    instructions="You are a PDF extractor. You will be given a PDF and you will extract the sections and sub-sections of the PDF. Only return the list and no other text.",
    model="gpt-4o",  # Corrected model name
    tools=[{"type": "code_interpreter"}],
    tool_resources={
        "code_interpreter": {
            "file_ids": [file.id]
        }
    }
)

# Create a thread
thread = client.beta.threads.create()

# Add a message to the thread
message = client.beta.threads.messages.create(
    thread_id=thread.id,
    role="user",
    content="Return the list of sections and sub-sections of the PDF. For example: sections could be Abstract, Introduction, Methods, Results, Discussion, etc."
)

# Run the assistant
run = client.beta.threads.runs.create(
    thread_id=thread.id,
    assistant_id=assistant.id
)

# Wait for the run to complete
import time
start_time = time.time()
while True:
    run = client.beta.threads.runs.retrieve(
        thread_id=thread.id,
        run_id=run.id
    )
    if run.status == "completed":
        break
    time.sleep(1)

# Get the assistant's response
messages = client.beta.threads.messages.list(
    thread_id=thread.id
)
print(messages.data[0].content[0].text.value)
print(f"Time taken: {time.time() - start_time} seconds")
