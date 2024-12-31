class ReferenceObject {
    text string
    url string
}

class References {
    references ReferenceObject[]
}

function ExtractReferences(paper: string[]) -> References {
    client "openai/gpt-4o"
    prompt #"
        Extract the references from the references section of the paper. Also, extract the url if any for each reference.

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