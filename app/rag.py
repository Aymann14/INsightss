from app.retrieval import store
from app.llm import get_llm_provider
from app.models import Citation, AskResponse, InsightGroup, InsightsResponse
from app.database import SessionLocal, Conversation, ChatMessage
import uuid
from typing import List

def run_rag(question: str, conversation_id: str = None, tickers: List[str] = None, user_email: str = None) -> AskResponse:
    # Handle conversation
    if not conversation_id:
        conversation_id = str(uuid.uuid4())
        with SessionLocal() as db:
            # Create a new conversation if it doesn't exist
            conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
            if not conv:
                conv = Conversation(id=conversation_id, user_email=user_email)
                db.add(conv)
                db.commit()
    else:
        with SessionLocal() as db:
            conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
            if not conv:
                # Fallback if someone sends a bogus ID
                conv = Conversation(id=conversation_id, user_email=user_email)
                db.add(conv)
                db.commit()

    # 1. Retrieve top most relevant chunks
    top_results = store.search(question, tickers=tickers, top_k=5)
    
    if not top_results:
        return AskResponse(
            answer="no source available",
            citations=[],
            conversation_id=conversation_id
        )
        
    # 2. Build the context and prompt
    context_text = ""
    citations = []
    
    for i, res in enumerate(top_results):
        context_text += f"\n--- Source {i} ---\n{res['chunk']}\n"
        citations.append(Citation(
            source_chunk=res["chunk"],
            chunk_index=res["index"]
        ))
        
    # Fetch chat history
    history_text = ""
    with SessionLocal() as db:
        messages = db.query(ChatMessage).filter(ChatMessage.conversation_id == conversation_id).order_by(ChatMessage.created_at).all()
        for msg in messages:
            history_text += f"{msg.role.upper()}: {msg.content}\n"
            
    if tickers:
        context_instruction = f"The user is asking a question specifically related to these companies: {', '.join(tickers)}. Please ensure your answer accurately reflects the provided sources and citations for them."
    else:
        context_instruction = "Answer the user's question ONLY using the provided source chunks below."

    prompt = f"""You are a financial research assistant that answers questions about SEC filings. You are precise, grounded, and honest about the limits of what you can see.

You will be given:
- Retrieved excerpts from a specific SEC filing (the CONTEXT), each tagged with its source section.
- A user QUESTION about that filing.

Rules you must follow without exception:

1. GROUNDING: Answer ONLY using information present in the provided CONTEXT. Never use outside knowledge about the company, and never infer facts that are not explicitly supported by the excerpts.

2. NO FABRICATION: If the answer is not contained in the CONTEXT, say clearly: "I couldn't find that in the retrieved sections of this filing." Do not guess, approximate, or fill gaps with general knowledge. A truthful "not found" is more valuable than a plausible guess.

3. CITATIONS: For every factual claim, cite the source section it came from (e.g. "(Item 7, MD&A)"). If a specific figure is stated, quote it exactly as it appears — do not round or reword numbers.

4. PRECISION: Prefer specific figures, dates, and named facts over vague summary. If the user asks about revenue, give the actual number and period, not "revenues grew." Distinguish clearly between fiscal periods when the filing covers more than one.

5. UNCERTAINTY: If the CONTEXT is ambiguous or the excerpts seem incomplete for the question, say so plainly rather than papering over it.

6. TONE: Clear, concise, professional. Use plain language a non-specialist investor can follow, but never at the cost of accuracy. Do not editorialize, give investment advice, or make predictions.

Format: a direct answer first, then supporting detail with inline section citations. Use short paragraphs or bullets where it aids clarity..
{context_instruction}

CHAT HISTORY:
{history_text if history_text else "No prior history."}

SOURCES:
{context_text}

QUESTION:
{question}
"""
    
    # 3. Call the LLM provider
    provider = get_llm_provider()
    try:
        answer = provider.generate(prompt)
    except Exception as e:
        answer = f"Error calling LLM: {str(e)}"
        
    # 4. Save the turns to the database
    with SessionLocal() as db:
        user_msg = ChatMessage(conversation_id=conversation_id, role="user", content=question)
        asst_msg = ChatMessage(conversation_id=conversation_id, role="assistant", content=answer)
        db.add(user_msg)
        db.add(asst_msg)
        db.commit()
        
    # 5. Return answer + citations
    return AskResponse(
        answer=answer,
        citations=citations,
        conversation_id=conversation_id
    )

def generate_insights(ticker: str, filing_type: str) -> InsightsResponse:
    # We query the store to extract insights.
    # Note: For v0.1, the store is global. We rely on the top hits.
    insight_queries = [
        "key financial highlights",
        "main risk factors",
        "significant changes this period",
        "executive compensation and governance",
        "outlook and guidance"
    ]
    
    insights = []
    provider = get_llm_provider()
    
    for query in insight_queries:
        top_results = store.search(query, tickers=[ticker], top_k=3)
        if not top_results:
            continue
            
        context_text = ""
        for i, res in enumerate(top_results):
            context_text += f"\n--- Source {i} ---\n{res['chunk']}\n"
            
        prompt = f"""You are a financial analyst generating a concise executive summary of a specific SEC filing, for an investor who wants the most important, decision-relevant information fast.

You will be given retrieved excerpts from the filing (the CONTEXT), each tagged with its source section, grouped under summary dimensions (e.g. financial highlights, risk factors, outlook).

Rules you must follow without exception:

1. GROUNDING: Every point must be directly supported by the provided CONTEXT. Do not use outside knowledge about the company or its industry. Do not infer beyond what the excerpts state.

2. SUBSTANCE OVER BOILERPLATE: Prioritize specific, material, company-particular facts — actual figures, real changes, concrete risks unique to this company. Explicitly avoid generic boilerplate that could appear in any filing (e.g. "results may fluctuate due to various factors," "we operate in a competitive industry"). If an excerpt is boilerplate, do not surface it. A shorter summary of real substance beats a longer one padded with generic statements.

3. SPECIFICITY: Where the CONTEXT contains figures — revenue, net income/loss, cash position, growth rates, segment data — lead with them, quoted exactly and with their period. Numbers are the point of a financial summary.

4. CITATIONS: Tag each point with its source section where available (e.g. "— Item 8, Financial Statements").

5. NO FABRICATION: If a summary dimension has no substantive supporting content in the CONTEXT, omit that dimension entirely rather than inventing filler. Never manufacture a "highlight."

6. STRUCTURE: Organize into clear, scannable grouped bullets under short section headers. Each bullet is one concise, information-dense point. No preamble, no conclusion, no hedging language.

7. TONE: Neutral, factual, analytical. No investment advice, no predictions, no editorializing about whether results are "good" or "bad" — state what the filing says and let the facts speak.

Your goal: someone reading your summary should walk away knowing the genuinely important, specific things about this filing in under a minute.
SOURCES:
{context_text}
"""
        try:
            answer = provider.generate(prompt).strip()
            if answer != "NOT_FOUND" and "NOT_FOUND" not in answer:
                points = []
                for line in answer.split('\n'):
                    line = line.strip()
                    if line.startswith('-'):
                        points.append(line[1:].strip())
                
                if points:
                    insights.append(InsightGroup(
                        section=query.title(),
                        points=points
                    ))
        except Exception as e:
            # Silently skip failed insight queries for robustness
            print(f"Error generating insight for {query}: {e}")
            continue
            
    return InsightsResponse(insights=insights)
