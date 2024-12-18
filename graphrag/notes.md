# Random notes on graphrag

## Init a graphrag:

* Install: `pip install graphrag`
* Make a dir for it to work in, and an input loc: `mkdir -p ./ragtest/input`
* Populate the input folder with a .txt or .csv: `curl https://www.gutenberg.org/cache/epub/24022/pg24022.txt -o ./ragtest/input/book.txt`
* Setup env vars: `graphrag init --root ./ragtest`
* Set your openai key env var (called GRAPHRAG_API_KEY): `GRAPHRAG_API_KEY=sk...`
* Run the pipeline to index the content as nodes in graph: `graphrag index --root ./ragtest`

# Querying


# Gephi Visualization Tool:
* Basic setup: https://microsoft.github.io/graphrag/visualization_guide/