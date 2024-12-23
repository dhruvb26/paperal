#### This file is for creating relationships between papers based on their refrerences.
# It's meant to run on a database that has already been populated, so it can find matches between the db paper entities and refrences.
# Each paper takes about 30 seconds to process... we can run with 10-20 threads to speed up the process.
# Still, at full db scale (1.7m papers), it would take about 1 month to process all papers.
# Having these relationships is great though, because we can score paper suggestions by how many other papers reference them.

import os
import re
import requests
from PyPDF2 import PdfReader
from io import BytesIO
from neo4j import GraphDatabase
from langchain_openai import OpenAIEmbeddings
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed

load_dotenv()

def download_pdf(arxiv_id):
    url = f"https://arxiv.org/pdf/{arxiv_id}.pdf"
    response = requests.get(url)
    if response.status_code == 200:
        return BytesIO(response.content)
    else:
        raise Exception(f"Failed to download PDF for arxiv ID {arxiv_id}")

def extract_references(pdf_content):
    reader = PdfReader(pdf_content)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    
    # try to find references section
    references_section = re.split(r'\b(?:References|Bibliography|Works Cited)\b', text, flags=re.IGNORECASE)[-1]
    references = re.findall(r'\[.*?\](.*?)\n', references_section)
    return references

def find_referenced_papers(tx, reference_text):
    search_query = """
    MATCH (p:Paper)
    WHERE apoc.text.levenshteinSimilarity(p.title, $reference_text) > 0.5
    RETURN p.id AS id, p.title AS title, [(a)-[:AUTHORED]->(p) | a.name] AS authors
    """
    result = tx.run(search_query, reference_text=reference_text)
    return [(record['id'], record['title'], record['authors']) for record in result]

def add_reference_relationship(tx, paper_id, referenced_paper_id):
    relationship_query = """
    MATCH (p1:Paper {id: $paper_id}), (p2:Paper {id: $referenced_paper_id})
    MERGE (p1)-[:REFERENCES]->(p2)
    """
    tx.run(relationship_query, paper_id=paper_id, referenced_paper_id=referenced_paper_id)

# main function to process a paper's refrences section
def process_single_paper(driver, paper_id, paper_title):
    with driver.session() as session:
        pdf_content = download_pdf(paper_id)
        references = extract_references(pdf_content)
        print(f"Processing reference: {paper_title}")

        for reference in references:
            referenced_papers = session.execute_read(find_referenced_papers, reference)
            
            for ref_id, ref_title, ref_authors in referenced_papers:
                print(f"\nref title: {reference}")
                print(f"db title: {ref_title}")
                session.execute_write(add_reference_relationship, paper_id, ref_id)

def process_references():
    driver = GraphDatabase.driver("neo4j+s://2d574420.databases.neo4j.io", auth=("neo4j", os.getenv("NEO4J_PASSWORD")))
    with driver.session() as session:
        papers = session.run("MATCH (p:Paper) RETURN p.id AS id, p.title AS title")
        paper_list = [(record['id'], record['title']) for record in papers]

    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(process_single_paper, driver, paper_id, paper_title) for paper_id, paper_title in paper_list]
        for future in as_completed(futures):
            try:
                future.result()
            except Exception as e:
                print(f"Error processing paper: {e}")

if __name__ == "__main__":
    process_references()
