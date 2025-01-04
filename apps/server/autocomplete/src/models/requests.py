from typing import Optional
from pydantic import BaseModel


class SentenceRequest(BaseModel):
    previous_text: str
    heading: str
    subheading: Optional[str] = None
    user_id: Optional[str] = None


class StoreResearchRequest(BaseModel):
    research_urls: list[str]
    user_id: Optional[str] = None
    is_public: Optional[bool] = True
