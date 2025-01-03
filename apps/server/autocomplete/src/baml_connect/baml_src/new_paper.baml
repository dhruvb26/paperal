class NewCitationObject {
    in_text string
    complete_reference string
}

class NewSection {
    title string
    content string
    references CitationObject[]
    is_finished bool
}

class NewPage {
    sections Section[]  
}

function ExtractNewPaperContent(previous_section: string, references: string, page_content: string[]) -> NewPage {

    client "openai/gpt-4o"  
    prompt #"
        You are an expert at extracting sections and references from a paper. 
        You are going to continue extracting the paper from the previous page's unfinished section. 

        The previous page's unfinished section is: {{ previous_section }}

        Continue extracting the previous section and unique in-text references from the content below. If the section is still not finished, set the is_finished flag to false. Section
        is considered finished if the title of the subsequent section is found. Also, map the references to the full-citation index from the list below:

        {{ references }}
  
        Make sure to parse the entire content without changing or missing any information. 

        The titles on this page are Assumptions for Dataset Inference, Experimental Details, and Results with Dataset Inference.
        If a title is not found, don't include it in the output. 

        If the section is finished, set the is_finished flag to true. And set the title of the next section and the content of the next section.
        Keep in mind all the content is considered of the same section until the title of the next section is found. Titles are marked by ##.

        Until you see the next ##, keep adding the content to the current section.


        {{ page_content }}

        {{ ctx.output_format }}
    "#
}



test new_paper_test {
    functions [ExtractNewPaperContent]
    args {
        references #"
        "#
     
        page_content #"

        "#
    }
}