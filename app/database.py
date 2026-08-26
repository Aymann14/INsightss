import uuid
from datetime import datetime
from sqlalchemy import create_engine, Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from pgvector.sqlalchemy import Vector
from app.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Filing(Base):
    __tablename__ = "filings"
    
    id = Column(String, primary_key=True, index=True) # e.g. "AAPL_10-K"
    ticker = Column(String, index=True)
    filing_type = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    
    id = Column(Integer, primary_key=True, index=True)
    filing_id = Column(String, ForeignKey("filings.id"))
    text = Column(Text)
    # MiniLM-L6-v2 produces 384-dimensional vectors
    embedding = Column(Vector(384))
    
    filing = relationship("Filing")

class User(Base):
    __tablename__ = "users"
    email = Column(String, primary_key=True, index=True)
    hits_count = Column(Integer, default=0)

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(String, primary_key=True, index=True)
    user_email = Column(String, ForeignKey("users.email"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    messages = relationship("ChatMessage", back_populates="conversation", order_by="ChatMessage.created_at")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(String, ForeignKey("conversations.id"))
    role = Column(String) # "user" or "assistant"
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    conversation = relationship("Conversation", back_populates="messages")
