class ReferenceObject {
    text string
    url string
}

class References {
    references ReferenceObject[]
}

function ExtractReferences(paper: string[]) -> References {
    client "openai/gpt-3.5-turbo"
    prompt #"
        Extract all citations/references, inlcuding the author names from the given text.

        {{ paper }}

        {{ ctx.output_format }}
    "#
}

test reference_map_test {
    functions [ExtractReferences]
    args {
        paper #"
        "#
    }
}