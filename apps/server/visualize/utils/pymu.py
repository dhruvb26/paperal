import pdfplumber

with pdfplumber.open("2402.pdf") as pdf:
    for page in pdf.pages:
        text = page.filter(
            lambda obj: not (obj["object_type"] == "char" and "Bold" in obj["fontname"])
        )
        print(text.extract_text())
