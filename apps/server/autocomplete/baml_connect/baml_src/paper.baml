class CitationObject {
    in_text string
    complete_reference string
    url string
}

class Section {
    title string
    content string
    references CitationObject[]
    is_finished bool
}

class Page {
    sections Section[]  
}


function ExtractPaperContent(references: string, page_content: string[]) -> Page {

    client "openai/gpt-4o"  
    prompt #"
        Extract the sections and unique in-text references that section from the content below. If the section is not finished, set the is_finished flag to false. Section
        is considered finished if the title of the subsequent section is found. Also, map the references to the full-citation index from the list below:

        {{ references }}
  
        Make sure to parse the entire content without changing or missing any information. 

        The titles of the paper are Abstract, Introduction, Background and Baselines. 
        If a title is not found, don't include it in the output. 

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