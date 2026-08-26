import requests
from app.config import settings
import logging

def get_sec_headers():
    user_agent = settings.sec_user_agent or "INsightss Admin admin@insightss.local"
    return {
        "User-Agent": user_agent,
        "Accept-Encoding": "gzip, deflate"
    }
import logging

logger = logging.getLogger(__name__)

# Cache of companies: list of dicts {"name": ..., "ticker": ..., "cik": ...}
_companies_cache = []

def load_companies():
    global _companies_cache
    if _companies_cache:
        return
        
    logger.info("Loading company tickers from SEC...")
    url = "https://www.sec.gov/files/company_tickers.json"
    try:
        resp = requests.get(url, headers=get_sec_headers())
        resp.raise_for_status()
        data = resp.json()
        
        for item in data.values():
            _companies_cache.append({
                "name": item["title"],
                "ticker": item["ticker"],
                "cik": str(item["cik_str"]).zfill(10)
            })
        logger.info(f"Loaded {len(_companies_cache)} companies.")
    except Exception as e:
        logger.error(f"Failed to load company tickers: {e}")

def search_companies(query: str) -> list[dict]:
    if not query or len(query) < 2:
        return []
        
    query_lower = query.lower()
    
    exact_matches = []
    name_matches = []
    
    for comp in _companies_cache:
        ticker = comp["ticker"].lower()
        name = comp["name"].lower()
        
        if ticker == query_lower:
            exact_matches.append(comp)
        elif query_lower in ticker or query_lower in name:
            name_matches.append(comp)
            
    results = exact_matches + name_matches
    return results[:10]
