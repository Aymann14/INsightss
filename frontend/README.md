# INsightss - Frontend

A beautiful, minimal frontend application built with React, Vite, and Tailwind CSS to interact with the INsightss SEC RAG backend.

## Design Aesthetic
This application features a calm, modern fintech aesthetic inspired by premium editorial platforms (like Substack). It uses a warm cream background, beautiful serif typography (Lora), and elegant ochre accents.

## Setup Instructions

1. **Install Dependencies**
   Make sure you have Node.js installed, then run:
   ```bash
   npm install
   ```

2. **Configure Environment**
   By default, the application expects the FastAPI backend to be running on `http://127.0.0.1:8000`. If your backend is hosted elsewhere, update the `.env` file:
   ```env
   VITE_API_BASE_URL=https://your-backend-url.com
   ```

3. **Run the Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## Component Architecture
- `SearchBar.jsx`: Handles debounce input and company lookup.
- `FilingSelector.jsx`: Lets users select a document type to ingest.
- `InsightsPanel.jsx`: Renders the AI-generated executive summary.
- `ChatInterface.jsx`: The core ChatGPT-style conversational UI with source citations.
