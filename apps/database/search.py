import os
from dotenv import load_dotenv
import neo4j
from neo4j import GraphDatabase
from langchain_openai import OpenAIEmbeddings
import json

load_dotenv()

def search_similar_papers_in_category(query_text, top_k_initial=5, top_k_final=25):
    driver = GraphDatabase.driver("neo4j+s://2d574420.databases.neo4j.io", auth=("neo4j", os.getenv("NEO4J_PASSWORD")))
    embeddings = OpenAIEmbeddings()
    query_embedding = embeddings.embed_query(query_text)
    with driver.session() as session:
        # Step 1: Find top_k_initial papers by similarity
        initial_search_query = """
        CALL db.index.vector.queryNodes('paper-abstract-embeddings', $top_k, $embedding)
        YIELD node AS paper, score
        RETURN DISTINCT paper.id AS id, paper.title AS title, paper.abstract AS abstract, score
        ORDER BY score DESC
        """
        initial_results = session.run(initial_search_query, top_k=top_k_initial, embedding=query_embedding)
        top_papers = [(record['id'], record['title'], record['abstract'], record['score']) for record in initial_results]

        # Step 2: Find the most common category or subcategory of the top k initial results
        category_counts = {}
        for paper_id, _, _, _ in top_papers:
            category_query = """
            MATCH (p:Paper {id: $id})-[:BELONGS_TO]->(c)
            RETURN c.name AS category, labels(c) AS labels
            LIMIT 1
            """
            category_result = session.run(category_query, id=paper_id).single()
            category_name = category_result['category']
            if category_name in category_counts:
                category_counts[category_name] += 1
            else:
                category_counts[category_name] = 1

        most_common_category = max(category_counts, key=category_counts.get)

        # Re-query to get the label of the most common category
        category_label_query = """
        MATCH (c {name: $category})
        RETURN labels(c) AS labels
        LIMIT 1
        """
        category_label_result = session.run(category_label_query, category=most_common_category).single()
        most_common_label = category_label_result['labels'][0]

        # Step 3: Vector search all papers in that category or subcategory
        if most_common_label == 'SubCategory':
            final_search_query = """
            MATCH (sc:SubCategory {name: $category})<-[:BELONGS_TO]-(p:Paper)
            CALL db.index.vector.queryNodes('paper-abstract-embeddings', $top_k, $embedding)
            YIELD node AS paper, score
            RETURN DISTINCT paper.title AS title, paper.abstract AS abstract, score
            ORDER BY score DESC
            LIMIT $top_k
            """
        else:
            final_search_query = """
            MATCH (mc:Category {name: $category})<-[:BELONGS_TO]-(p:Paper)
            CALL db.index.vector.queryNodes('paper-abstract-embeddings', $top_k, $embedding)
            YIELD node AS paper, score
            RETURN DISTINCT paper.title AS title, paper.abstract AS abstract, score
            ORDER BY score DESC
            LIMIT $top_k
            """
        final_results = session.run(final_search_query, category=most_common_category, embedding=query_embedding, top_k=top_k_final)
        return [(record['title'], record['abstract'], record['score']) for record in final_results]

results = search_similar_papers_in_category("Large language models, machine learning, transformers", top_k_initial=5, top_k_final=25)
print(json.dumps({"results": results}, indent=4))