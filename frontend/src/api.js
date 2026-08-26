import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const email = localStorage.getItem('insightss_user_email');
  if (email) {
    config.headers['X-User-Email'] = email;
  }
  return config;
});

export const searchCompanies = async (query) => {
  const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
  return response.data.results || [];
};

export const ingestFiling = async (ticker, filing_type) => {
  const response = await api.post('/ingest', { ticker, filing_type });
  return response.data;
};

export const getInsights = async (ticker, filing_type) => {
  const response = await api.post('/insights', { ticker, filing_type });
  return response.data;
};

export const askQuestion = async (question, tickers, conversation_id = null) => {
  const payload = { question, tickers };
  if (conversation_id) {
    payload.conversation_id = conversation_id;
  }
  const response = await api.post('/ask', payload);
  return response.data;
};

export const getConversations = async () => {
  const response = await api.get('/conversations');
  return response.data.conversations;
};

export const getConversation = async (id) => {
  const response = await api.get(`/conversations/${id}`);
  return response.data;
};

export default api;
