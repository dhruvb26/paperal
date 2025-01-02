def json_to_markdown(json_data, level: int = 0) -> str:
    """Convert a JSON object to markdown format."""
    markdown = ""
    indent = "  " * level

    if isinstance(json_data, list):
        for item in json_data:
            markdown += f"{indent}- "
            if isinstance(item, (dict, list)):
                markdown += "\n" + json_to_markdown(item, level + 1)
            else:
                markdown += f"{item}\n"
    elif isinstance(json_data, dict):
        for key, value in json_data.items():
            if isinstance(value, (dict, list)):
                markdown += f"{indent}- **{key}**:\n"
                markdown += json_to_markdown(value, level + 1)
            else:
                markdown += f"{indent}- **{key}**: {value}\n"

    return markdown
