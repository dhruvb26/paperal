class Paper {
    author string[]
    title string
    year string
    abstract string
    
}


function ExtractPaper(paper: string) -> Paper {

    client "openai/gpt-4o"  
    prompt #"
        Extract the authors,title,the year of publication and abstract from the following content:
        {{ paper }}

        {{ ctx.output_format }}
    "#
}

test paper_test {
    functions [ExtractPaper]
    args {
        paper #"
            Author: John Doe
            Title: The Future of AI
            Year: 2024
            Abstract: This paper explores the potential impact of AI on society.
        "#
    }
}