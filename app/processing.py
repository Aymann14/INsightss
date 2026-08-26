import re

def clean_text(text: str) -> str:
    """Clean the text returned from edgartools."""
    if not text:
        return ""
        
    # Clean up excessive newlines and spaces
    # Collapse 3 or more newlines into double newlines (paragraph breaks)
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Clean up excessive spaces
    text = re.sub(r'[ \t]+', ' ', text)
    
    # Remove lines that are mostly non-alphanumeric (often page numbers, line artifacts)
    clean_lines = []
    for line in text.split('\n'):
        line = line.strip()
        if not line:
            continue
        # If the line is extremely short and just numbers/symbols, skip it
        if len(line) < 5 and not re.search(r'[A-Za-z]', line):
            continue
        clean_lines.append(line)
        
    return '\n'.join(clean_lines).strip()

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 150) -> list[str]:
    """Chunk text into overlapping windows for better context retention."""
    chunks = []
    start = 0
    text_length = len(text)
    
    while start < text_length:
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
        
    return chunks
