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

