import tiktoken
import json
def num_tokens_from_string(string: str, encoding_name: str) -> int:
    encoding = tiktoken.encoding_for_model(encoding_name)
    num_tokens = len(encoding.encode(string))
    return num_tokens

with open("page_14.json", "r") as f:
    pages_content = json.load(f)

# pages_content is a list of strings based on the file context
total_tokens = 0
for content in pages_content:
    total_tokens += num_tokens_from_string(content, "gpt-4o")

print(f"Total tokens: {total_tokens}")