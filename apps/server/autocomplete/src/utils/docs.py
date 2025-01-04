import logging
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import List
from langchain.schema import Document

logger = logging.getLogger(__name__)


def load_documents(file_path):
    logging.info(f"Loading documents from file: {file_path}")
    loader = PyPDFLoader(file_path, extract_images=False)
    documents = loader.load()
    logging.info(f"Loaded {len(documents)} pages")
    return documents


def split_documents(documents: List[Document]) -> List[Document]:
    logging.info("Splitting documents...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=0,
        length_function=len,
        is_separator_regex=False,
    )
    split_docs = text_splitter.split_documents(documents)
    logging.info(f"Split into {len(split_docs)} chunk(s).")
    return split_docs
