def json_to_markdown(json_data, level: int = 0) -> str:
    """Convert a JSON object to markdown format."""
    # Pre-calculate indent string
    indent = "  " * level

    # Use list comprehension and join instead of string concatenation
    if isinstance(json_data, list):
        return "".join(
            f"{indent}- "
            + (
                "\n" + json_to_markdown(item, level + 1)
                if isinstance(item, (dict, list))
                else f"{item}\n"
            )
            for item in json_data
        )

    elif isinstance(json_data, dict):
        return "".join(
            f"{indent}- **{key}**:"
            + (
                "\n" + json_to_markdown(value, level + 1)
                if isinstance(value, (dict, list))
                else f" {value}\n"
            )
            for key, value in json_data.items()
        )

    return ""
