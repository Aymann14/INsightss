from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.models import IngestRequest, IngestResponse, AskRequest, AskResponse, SearchResponse, InsightsResponse
from app.edgar import fetch_latest_filing
from app.processing import clean_text, chunk_text
from app.retrieval import store
from app.rag import run_rag, generate_insights
from app.company_lookup import load_companies, search_companies
from app.database import Base, engine, User, SessionLocal, Conversation, ChatMessage
import logging
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Header, Depends, HTTPException
from sqlalchemy.orm import Session

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SEC Filings RAG API", version="0.1")

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Initialize DB schemas
    logger.info("Initializing database schemas...")
    
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()
        
    Base.metadata.create_all(bind=engine)

    # Load company tickers cache in the background
    import threading
    threading.Thread(target=load_companies, daemon=True).start()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(x_user_email: str = Header(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == x_user_email).first()
    if not user:
        user = User(email=x_user_email, hits_count=0)
        db.add(user)
        db.commit()
        db.refresh(user)
        
    if x_user_email.lower() != "aymankazi2000@gmail.com":
        if user.hits_count >= 10:
            raise HTTPException(status_code=429, detail="Free limit reached (10 hits).")
            
    # Increment hits count
    user.hits_count += 1
    db.commit()
    return user

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/search", response_model=SearchResponse)
def search_company(q: str = ""):
    results = search_companies(q)
    return SearchResponse(results=results)

@app.post("/ingest", response_model=IngestResponse)
def ingest_filing_endpoint(request: IngestRequest, user: User = Depends(get_current_user)):
    try:
        filing_id = f"{request.ticker}_{request.filing_type}"
        if store.is_ingested(filing_id):
            return IngestResponse(
                status="success",
                message=f"Already ingested {request.filing_type} for {request.ticker}",
                chunks_processed=0
            )

        logger.info(f"Fetching {request.filing_type} for {request.ticker}")
        raw_html = fetch_latest_filing(request.ticker, request.filing_type)
        
        logger.info("Cleaning extracted text")
        cleaned_text = clean_text(raw_html)
        
        logger.info("Chunking text")
        chunks = chunk_text(cleaned_text)
        
        logger.info(f"Embedding and storing {len(chunks)} chunks")
        store.add_chunks(filing_id, request.ticker, request.filing_type, chunks)
        
        return IngestResponse(
            status="success",
            message=f"Successfully ingested {request.filing_type} for {request.ticker}",
            chunks_processed=len(chunks)
        )
    except Exception as e:
        logger.error(f"Error during ingestion: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def _internal_ingest_filing(request: IngestRequest):
    filing_id = f"{request.ticker}_{request.filing_type}"
    from app.edgar import fetch_latest_filing
    from app.processing import clean_text, chunk_text
    
    html_content = fetch_latest_filing(request.ticker, request.filing_type)
    cleaned_text = clean_text(html_content)
    chunks = chunk_text(cleaned_text)
    
    logger.info(f"Embedding and storing {len(chunks)} chunks")
    store.add_chunks(filing_id, request.ticker, request.filing_type, chunks)

@app.post("/ask", response_model=AskResponse)
def ask_question(request: AskRequest, user: User = Depends(get_current_user)):
    try:
        return run_rag(request.question, request.conversation_id, request.tickers, user.email)
    except Exception as e:
        logger.error(f"Error in RAG: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/insights", response_model=InsightsResponse)
def get_insights(request: IngestRequest, user: User = Depends(get_current_user)):
    try:
        filing_id = f"{request.ticker}_{request.filing_type}"
        if not store.is_ingested(filing_id):
            logger.info(f"Filing not found in cache. Ingesting first: {filing_id}")
            _internal_ingest_filing(request)
            
        insights = generate_insights(request.ticker, request.filing_type)
        return insights
    except Exception as e:
        logger.error(f"Error generating insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/conversations")
def get_conversations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Fetch all conversations for this user
    convs = db.query(Conversation).filter(Conversation.user_email == user.email).order_by(Conversation.created_at.desc()).all()
    results = []
    for c in convs:
        # Get the first message as a summary
        first_msg = db.query(ChatMessage).filter(ChatMessage.conversation_id == c.id).order_by(ChatMessage.created_at.asc()).first()
        title = first_msg.content[:50] + "..." if first_msg else "New Chat"
        results.append({"id": c.id, "title": title, "created_at": c.created_at})
    return {"conversations": results}

@app.get("/conversations/{conv_id}")
def get_conversation_history(conv_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conv_id, Conversation.user_email == user.email).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    messages = db.query(ChatMessage).filter(ChatMessage.conversation_id == conv_id).order_by(ChatMessage.created_at.asc()).all()
    return {"id": conv.id, "messages": [{"role": m.role, "content": m.content, "created_at": m.created_at} for m in messages]}
