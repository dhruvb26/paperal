import logging
from pypdf import PdfReader 

logger = logging.getLogger(__name__)


def check_pdf_pages(pdf_content) -> int:
    """Returns the number of pages in a PDF"""
    try:
        pdf = PdfReader(pdf_content)
        page_count = len(pdf.pages)
        logging.debug(f"PDF has {page_count} pages.")
        return page_count
    except Exception as e:
        logging.error(f"Error checking PDF pages: {e}")
        return 0
