# Database Plan

We have a shit ton of papers, all the papers' metadata on ArXiv can be downloaded [here](https://www.kaggle.com/datasets/Cornell-University/arxiv). Thats 1.7 million papers (updated weekly).

Here's my plan for building a large scale database that would set our lit review and rag systems apart.

---

**Structure:** Graph + Vector

We build a massive graph index containing:
- **Entities:** `Author`, `Paper`, `Subcategory`, `Category`
    - In addition to other metadata, the papers have an embedding prop of the abstract embedding, used for vector search.
- **Relationships:**  `AUTHORED`, `BELONGS_TO`, `HAS_SUBCATEGORY`, `REFERENCES`
    - We can use these to walk through related entities after preforming a vector search, to find more relevant info.

### How to Build the DB:
1. We need to do build and test all the different setup steps on subsets of the ds.
    - Download dataset -> process into graph entities -> add to neo4j
    - Create vector index
    - Process refrences sections to generate relationships between papers
2. Once we know it'll all work, we need to load neo4j into a docker container and set it up to run on a server.
    - This is bc their pricing gets expensive with their hosting at larger sizes.
3. One personal machine should run the populate.py code, to initially fill it with records.
    - This step will need to run for about **7 days** (with my current dev machine). 
4. We should all run our seperate machines to process the refrences sections.
    - Need to make sure the server isn't a bottleneck.
    - With 3 machines running 20 workers, that should take **10 days**.


