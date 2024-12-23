import json
import os

import kagglehub
import neo4j
from dotenv import load_dotenv
from langchain.vectorstores import VectorStore
from langchain_openai import OpenAIEmbeddings
from neo4j import GraphDatabase

load_dotenv()


def download_dataset():
    path = kagglehub.dataset_download("Cornell-University/arxiv")
    print("Path to dataset files:", path)
    return path


def create_vector_index(tx):
    vector_index_query = """
    CREATE VECTOR INDEX `paper-abstract-embeddings`
    FOR (p:Paper) ON (p.embedding)
    OPTIONS {indexConfig: {
     `vector.dimensions`: 1536,
     `vector.similarity_function`: 'cosine'
    }};
    """
    tx.run(vector_index_query)


def set_paper_embedding(tx, paper_id, embedding):
    embedding_query = """
    MATCH (p:Paper {id: $id})
    CALL db.create.setNodeVectorProperty(p, 'embedding', $embedding)
    """
    tx.run(embedding_query, id=paper_id, embedding=embedding)


def process_paper_record(tx, record):
    # process categories and subcategories
    categories = record["categories"].split()
    for category in categories:
        main_category, sub_category = category.split(".") if "." in category else (category, None)

        # create or find main category entity
        main_category_query = """
        MERGE (mc:Category {name: $main_category})
        RETURN mc
        """
        tx.run(main_category_query, main_category=main_category)

        if sub_category:
            # create or find subcategory entity
            sub_category_query = """
            MERGE (sc:SubCategory {name: $sub_category})
            RETURN sc
            """
            tx.run(sub_category_query, sub_category=sub_category)

            # create relationship between main category and subcategory
            category_relationship_query = """
            MATCH (mc:Category {name: $main_category}), (sc:SubCategory {name: $sub_category})
            MERGE (mc)-[:HAS_SUBCATEGORY]->(sc)
            """
            tx.run(
                category_relationship_query, main_category=main_category, sub_category=sub_category
            )

    # create paper entity with embedding
    paper_query = """
    MERGE (p:Paper {id: $id})
    SET p.submitter = $submitter, p.title = $title, p.comments = $comments,
        p.journal_ref = $journal_ref, p.doi = $doi, p.report_no = $report_no,
        p.license = $license, p.abstract = $abstract, p.update_date = $update_date
    RETURN p
    """
    tx.run(
        paper_query,
        id=record["id"],
        submitter=record["submitter"],
        title=record["title"],
        comments=record["comments"],
        journal_ref=record["journal-ref"],
        doi=record["doi"],
        report_no=record["report-no"],
        license=record["license"],
        abstract=record["abstract"],
        update_date=record["update_date"],
    )

    # create relationships between paper and subcategories
    for category in categories:
        main_category, sub_category = category.split(".") if "." in category else (category, None)

        if sub_category:
            paper_subcategory_query = """
            MATCH (p:Paper {id: $id}), (sc:SubCategory {name: $sub_category})
            MERGE (p)-[:BELONGS_TO]->(sc)
            """
            tx.run(paper_subcategory_query, id=record["id"], sub_category=sub_category)
        else:
            paper_category_query = """
            MATCH (p:Paper {id: $id}), (mc:Category {name: $main_category})
            MERGE (p)-[:BELONGS_TO]->(mc)
            """
            tx.run(paper_category_query, id=record["id"], main_category=main_category)

    # process authors (create entities and relationships to this paper and others)
    for author in record["authors_parsed"]:
        # create or find author entity
        author_query = """
        MERGE (a:Author {last_name: $last_name, first_name: $first_name, middle_name: $middle_name})
        RETURN a
        """
        tx.run(author_query, last_name=author[0], first_name=author[1], middle_name=author[2])

        # create relationships between author and paper
        paper_author_query = """
        MATCH (p:Paper {id: $id}), (a:Author {last_name: $last_name, first_name: $first_name, middle_name: $middle_name})
        MERGE (a)-[:AUTHORED]->(p)
        """
        tx.run(
            paper_author_query,
            id=record["id"],
            last_name=author[0],
            first_name=author[1],
            middle_name=author[2],
        )


def populate_database(path):
    driver = GraphDatabase.driver(
        "neo4j+s://2d574420.databases.neo4j.io", auth=("neo4j", os.getenv("NEO4J_PASSWORD"))
    )
    embeddings = OpenAIEmbeddings()
    with driver.session() as session:
        try:
            session.execute_write(create_vector_index)
        except neo4j.exceptions.ClientError as e:
            if "EquivalentSchemaRuleAlreadyExists" in str(e):
                print("Vector index already exists.")
            else:
                raise e
        for filename in os.listdir(path):
            file_path = os.path.join(path, filename)
            if os.path.isfile(file_path) and filename.endswith(".json"):
                with open(file_path, "r") as file:
                    for line in file:
                        record = json.loads(line)
                        session.execute_write(process_paper_record, record)
                        embedding = embeddings.embed_query(record["abstract"])
                        session.execute_write(set_paper_embedding, record["id"], embedding)


def clear_database():
    driver = GraphDatabase.driver(
        "neo4j+s://2d574420.databases.neo4j.io", auth=("neo4j", os.getenv("NEO4J_PASSWORD"))
    )
    with driver.session() as session:
        session.run("MATCH (n) DETACH DELETE n")


def search_similar_papers(query_text, top_k=10):
    driver = GraphDatabase.driver(
        "neo4j+s://2d574420.databases.neo4j.io", auth=("neo4j", os.getenv("NEO4J_PASSWORD"))
    )
    embeddings = OpenAIEmbeddings()
    query_embedding = embeddings.embed_query(query_text)
    with driver.session() as session:
        search_query = """
        CALL db.index.vector.queryNodes('paper-abstract-embeddings', $top_k, $embedding)
        YIELD node AS paper, score
        RETURN paper.title AS title, paper.abstract AS abstract, score
        ORDER BY score DESC
        """
        result = session.run(search_query, top_k=top_k, embedding=query_embedding)
        return [(record["title"], record["abstract"], record["score"]) for record in result]


if __name__ == "__main__":
    clear_database()
    dataset_path = download_dataset()
    populate_database(dataset_path)
    similar_papers = search_similar_papers("Large language models")
    for title, abstract, score in similar_papers:
        print(f"Title: {title}, Score: {score}\nAbstract: {abstract}\n")
