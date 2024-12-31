class CitationObject {
    in_text string
    complete_reference string
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
        Extract the sections and unique in-text references from the paper. Make sure to only include the unique references. Also, map the references to the full-citation index from the list below:

        If a section has no title, understand the section and give it a title accordingly.

        {{ references }}
  
        Make sure to include the full content of the section in the output. 

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