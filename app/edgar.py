import logging
from app.config import settings
from edgar import Company, set_identity

logger = logging.getLogger(__name__)

def fetch_latest_filing(ticker: str, filing_type: str = "10-K") -> str:
    # Set the identity for SEC requests
    user_agent = settings.sec_user_agent or "INsightss Admin admin@insightss.local"
    set_identity(user_agent)
    
    logger.info(f"Fetching {filing_type} for {ticker} using edgartools")
    try:
        company = Company(ticker)
        filings = company.get_filings(form=filing_type)
        if not filings:
            raise ValueError(f"No {filing_type} found for {ticker}")
            
        latest_filing = filings[0]
        # Get clean text directly from the filing
        clean_text = latest_filing.text()
        return clean_text
    except Exception as e:
        logger.error(f"Error fetching filing via edgartools: {e}")
        raise ValueError(f"Failed to fetch {filing_type} for {ticker}: {e}")
