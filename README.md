# INsightss 

An advanced, full-stack AI platform designed to automate the ingestion, analysis, and extraction of actionable insights from complex SEC financial filings (10-K, 10-Q) using cutting-edge Retrieval-Augmented Generation (RAG) and Large Language Models.

Built for financial analysts and investors, INsightss drastically reduces the time required to read hundreds of pages of SEC boilerplate by parsing out dense financial data and delivering instant, accurate, and citable insights.
<img width="2400" height="1320" alt="image" src="https://github.com/user-attachments/assets/30492db4-5fd5-4de1-96e3-d80d6c00732d" />

<img width="2940" height="1378" alt="image" src="https://github.com/user-attachments/assets/acb832be-61aa-4a69-b1b0-d11bf4cfde8c" />
<img width="1826" height="1526" alt="image" src="https://github.com/user-attachments/assets/9dcbfdb7-c48c-44a3-aba7-3d262b3ee5a4" />


## ✨ Key Features

- **Automated SEC EDGAR Ingestion**: Instantly fetch, clean, and chunk massive 10-K and 10-Q HTML filings in seconds using `edgartools`.
- **Intelligent Vector RAG Search**: Leverages `sentence-transformers` and PostgreSQL's `pgvector` extension to perform semantic search over financial documents.
- **Cross-Contamination Prevention**: Sandboxed vector retrieval ensures data from different companies never bleeds into each other during analysis.
- **AI-Powered Executive Summaries**: Automatically generates comprehensive summaries of Key Financial Highlights, Risk Factors, and Executive Compensation using DeepSeek models.
- **Conversational Financial Analyst**: Chat directly with the filing. Ask specific questions (e.g., "What was the total related-party revenue?") and receive highly accurate answers with direct source citations.

## 🛠️ Tech Stack

**Frontend:**
- React (Vite)
- TailwindCSS & Typography (for beautiful Markdown rendering)
- Lucide React (Icons)

**Backend:**
- FastAPI (Python)
- PostgreSQL (with `pgvector` for vector storage)
- SQLAlchemy (ORM)
- Sentence-Transformers (Local embedding generation)
- DeepSeek API (LLM for text generation and reasoning)
- SEC EDGAR API (`edgartools`)

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js & npm
- PostgreSQL running locally with the `pgvector` extension installed.

### 1. Database Setup
Create a local PostgreSQL database and user:
```sql
CREATE DATABASE rag_db;
CREATE USER rag_user WITH ENCRYPTED PASSWORD 'rag_pass';
GRANT ALL PRIVILEGES ON DATABASE rag_db TO rag_user;
```

### 2. Backend Setup
Navigate to the root directory and install dependencies:
```bash
pip install -r requirements.txt
```
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```
Add your DeepSeek API key to `.env`. 

Run the FastAPI server:
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup
Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
npm install
npm run dev
```
The application will be running at `http://localhost:5173`.

## 🧠 System Architecture

1. **Ingestion Pipeline**: Raw HTML filings are fetched from the SEC EDGAR database. The text is stripped of boilerplate HTML, cleaned, and chunked into 1000-character blocks.
2. **Embedding**: Each chunk is embedded using a lightweight local `sentence-transformer` model (`all-MiniLM-L6-v2`) to preserve privacy and reduce API costs.
3. **Storage**: Vectors and metadata are stored in PostgreSQL using `pgvector`.
4. **Retrieval**: When a query is made, the backend performs a cosine-similarity search against the vector database, applying strict ticker filters to prevent data leakage.
5. **Generation**: The top `k` chunks are injected into a highly engineered prompt and sent to the LLM (DeepSeek) to generate factual, grounded answers with strict citation rules.

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
