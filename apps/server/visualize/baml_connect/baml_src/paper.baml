class CitationObject {
    in_text string
    complete_reference string
    url string
}

class Section {
    title string
    content string
    references CitationObject[]
}

class Page {
    sections Section[]  
}


function ExtractPaperContent(references: string, page_content: string[]) -> Page {

    client "openai/gpt-4o"  
    prompt #"
        Extract appropriate headings and all content of the sections from the research paper. Also, extract the unique in-text references of that section if any. Make sure to only include the unique references. Also, map the references to the full-citation index from the list below:

        {{ references }}
  
        Make sure to include the content of the section in the output.

        {{ page_content }}

        {{ ctx.output_format }}
    "#
}

test paper_test {
    functions [ExtractPaper]
    args {
        references #"
        "#
     
        page_content #"

        "#
    }
}