import fitz
import time
import json
import re

def convert_to_markdown(text):
    # Get the text with formatting information
    blocks = page.get_text("dict")["blocks"]
    
    # Find the most common font size
    font_sizes = []
    for block in blocks:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                font_sizes.append(span["size"])
    
    if not font_sizes:
        return text
    
    most_common_size = max(set(font_sizes), key=font_sizes.count)
    
    # Convert text with font information to markdown
    md_lines = []
    for block in blocks:
        for line in block.get("lines", []):
            line_text = ""
            is_header = False
            
            for span in line.get("spans", []):
                if span["size"] > most_common_size:
                    is_header = True
                line_text += span["text"]
            
            if line_text.strip():
                if is_header:
                    md_lines.append(f"## {line_text.strip()}\n")
                else:
                    md_lines.append(line_text.strip() + "\n")
    
    md_text = "".join(md_lines)
    
    # Convert lists (lines starting with numbers or bullets)
    md_text = re.sub(r'^\s*[\d]+\.\s+', '1. ', md_text, flags=re.MULTILINE)
    md_text = re.sub(r'^\s*[•∙●]\s+', '* ', md_text, flags=re.MULTILINE)
    
    # Convert references
    md_text = re.sub(r'\[(\d+)\]', r'[^\1]', md_text)
    
    return md_text

start_time = time.time()

file_path = "Removed Document (1).pdf"
folder_path = "pages_content/"

# Open the PDF with fitz
doc = fitz.open(file_path)
combined_content = ""


# Print page-wise data
references_found = False
for i in range(len(doc)):
    page = doc[i]

    
    
    text = page.get_text()
    combined_content += text
    # markdown_text = convert_to_markdown(text)
    
    # If references section is found, only save content before it
    if "Abstract" in text:
        print("Abstract found")
        text = text.split("Abstract")[1]
        text = "Abstract\n" + text
    if "References" in text:
        
        text = text.split("References")[0]
        print(f"\nPage {i}: References section found, saving content before references")
        
        with open(f'{folder_path}page_{i}.md', 'w', encoding='utf-8') as f:
            f.write(text)
        
        with open(f'{folder_path}page_{i}.json', 'w') as f:
            json.dump([text], f)
            
        references_found = True
        break
        
    
    print(f"\nPage {i}:")
    print(f"Content: {text[:200]}...")  # First 200 chars

    with open(f'{folder_path}page_{i}.md', 'w', encoding='utf-8') as f:
        f.write(text)
    
    with open(f'{folder_path}page_{i}.json', 'w') as f:
        json.dump([text], f)

print(references_found)
# extract references
for i in range(len(doc)):
    page = doc[i]
    text = page.get_text()
    combined_content += text
if "References" in combined_content:
    references = combined_content.split("References")[1]
    with open('extracted_references.json', 'w') as f:
        json.dump([references], f)
        


doc.close()

end_time = time.time()
execution_time = end_time - start_time
print(f"\nTotal execution time: {execution_time:.2f} seconds ({execution_time/60:.2f} minutes)")

