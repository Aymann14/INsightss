from sentence_transformers import SentenceTransformer
from app.database import SessionLocal, Filing, DocumentChunk
from sqlalchemy import select
from typing import List, Dict

class PostgresStore:
    def __init__(self):
        # Lazy loading for the model so it doesn't block startup unnecessarily
        self._model = None
        
    @property
    def model(self):
        if self._model is None:
            # Using a fast, small model for v0.1 suitable for running locally
            self._model = SentenceTransformer("all-MiniLM-L6-v2")
        return self._model

    def is_ingested(self, filing_id: str) -> bool:
        with SessionLocal() as db:
            result = db.query(Filing).filter(Filing.id == filing_id).first()
            return result is not None

    def add_chunks(self, filing_id: str, ticker: str, filing_type: str, chunks: List[str]):
        if not chunks:
            return
            
        embeddings = self.model.encode(chunks)
        
        from sqlalchemy.exc import IntegrityError
        
        with SessionLocal() as db:
            try:
                # 1. Create Filing record
                filing = Filing(id=filing_id, ticker=ticker, filing_type=filing_type)
                db.add(filing)
                db.flush()
                
                # 2. Add all DocumentChunks
                doc_chunks = []
                for i, chunk_text in enumerate(chunks):
                    doc_chunks.append(DocumentChunk(
                        filing_id=filing_id,
                        text=chunk_text,
                        embedding=embeddings[i]
                    ))
                
                db.bulk_save_objects(doc_chunks)
                db.commit()
            except IntegrityError:
                # Another concurrent request already inserted this filing.
                # Rollback this transaction and return gracefully (avoiding duplicate chunks).
                db.rollback()
                return

    def search(self, query: str, tickers: List[str] = None, top_k: int = 5) -> List[Dict]:
        query_embedding = self.model.encode([query])[0]
        
        with SessionLocal() as db:
            stmt = select(DocumentChunk)
            
            if tickers:
                # Assuming top_k is higher if multiple tickers to get fair representation
                if len(tickers) > 1 and top_k == 5:
                    top_k = 10 
                stmt = stmt.join(Filing).filter(Filing.ticker.in_(tickers))
                
            # pgvector's cosine_distance returns (1 - cosine_similarity), so order by ASC
            stmt = stmt.order_by(DocumentChunk.embedding.cosine_distance(query_embedding)).limit(top_k)
            
            results = []
            rows = db.scalars(stmt).all()
            
            for row in rows:
                results.append({
                    "chunk": row.text,
                    "index": row.id,
                    "score": 0.0 # Could calculate 1 - distance if needed
                })
                
            return results

# Singleton store for v0.1
store = PostgresStore()
