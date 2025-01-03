def sanitize_text(text: str) -> str:
    """Remove null characters and sanitize the text."""
    return text.replace("\u0000", "").strip()
