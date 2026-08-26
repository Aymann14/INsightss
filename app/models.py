from pydantic import BaseModel
from typing import List, Optional

class IngestRequest(BaseModel):
    ticker: str
    filing_type: str = "10-K"

class IngestResponse(BaseModel):
    status: str
    message: str
    chunks_processed: int

class AskRequest(BaseModel):
    question: str
    tickers: Optional[List[str]] = []
    conversation_id: Optional[str] = None

class Citation(BaseModel):
    source_chunk: str
    chunk_index: int

class AskResponse(BaseModel):
    answer: str
    citations: List[Citation]
    conversation_id: str

class SearchResult(BaseModel):
    name: str
    ticker: str
    cik: str

class SearchResponse(BaseModel):
    results: List[SearchResult]

class InsightGroup(BaseModel):
    section: str
    points: List[str]

class InsightsResponse(BaseModel):
    insights: List[InsightGroup]
