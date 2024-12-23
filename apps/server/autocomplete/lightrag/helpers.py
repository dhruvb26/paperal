import os
from lightrag import LightRAG
from lightrag.llm import gpt_4o_complete
from dotenv import load_dotenv

load_dotenv()
WORKING_DIR = "./workdir" 

# process text into kg
def process_text_into_neo4j(text): # text can be a string or a list of strings, to add with the same 
    if not os.path.exists(WORKING_DIR):
        os.mkdir(WORKING_DIR)
    else:
        os.rmdir(WORKING_DIR)
        os.mkdir(WORKING_DIR)

    # create a LightRAG instance, tell it to use neo4j
    rag = LightRAG(
        working_dir=WORKING_DIR,
        llm_model_func=gpt_4o_complete, # they have implementations for pretty much anything you can thing of. Openai, ollama, even directly from hf
        graph_storage="Neo4JStorage", # makes sure it stores in neo4j, have to define ENV vars: NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD
        log_level="DEBUG"
    )

    # index entities and relationships, store in neo4j
    res = rag.insert(text)

    # should return none if successful
    if res: return False
    else: return True

# query? we can use neo4j directly, or use lightrag to query