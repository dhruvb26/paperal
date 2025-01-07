from pydantic import BaseModel


class VisualizeRequest(BaseModel):
    pdf_url: str
