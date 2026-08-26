import React, { useState, useRef, useEffect } from 'react';
import { askQuestion, getConversation } from '../api';
import ReactMarkdown from 'react-markdown';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import CitationViewer from './CitationViewer';
import clsx from 'clsx';

export default function ChatInterface({ tickers, initialConversationId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(initialConversationId || null);
  const [activeCitation, setActiveCitation] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (initialConversationId) {
      setConversationId(initialConversationId);
      loadExistingConversation(initialConversationId);
    } else {
      setMessages([]);
      setConversationId(null);
    }
  }, [initialConversationId]);

  const loadExistingConversation = async (id) => {
    setIsLoading(true);
    try {
      const data = await getConversation(id);
      if (data && data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await askQuestion(userMessage.content, tickers, conversationId);
      
      // Save conversation ID for context memory
      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
      }

      const aiMessage = {
        role: 'assistant',
        content: data.answer,
        citations: data.citations
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error while processing your request.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 mb-32 bg-white rounded-2xl shadow-sm border border-charcoal-800/10 flex flex-col overflow-hidden h-[600px] fade-in">
      {/* Chat Header */}
      <div className="bg-cream-100 px-6 py-4 border-b border-charcoal-800/10 flex items-center justify-between">
        <h3 className="font-serif font-medium text-lg text-charcoal-900">Research Assistant</h3>
        <span className="font-sans text-xs font-semibold uppercase tracking-wider text-charcoal-800/50">
          Context: {tickers.join(', ')}
        </span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-cream-50/30">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-charcoal-800/40 font-sans text-center">
            <Bot className="w-12 h-12 mb-4 text-charcoal-800/20" />
            <p>Ask a question to dive deeper into the filings.</p>
            <p className="text-sm mt-2">Example: "What are the main risk factors mentioned?"</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={clsx(
            "flex gap-4 max-w-[85%]",
            msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
          )}>
            {/* Avatar */}
            <div className={clsx(
              "shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
              msg.role === 'user' ? "bg-ochre-500 text-white" : "bg-charcoal-900 text-cream-50"
            )}>
              {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>

            {/* Bubble */}
            <div className={clsx(
              "px-6 py-4 rounded-2xl font-serif text-[1.05rem] leading-relaxed shadow-sm",
              msg.role === 'user' 
                ? "bg-ochre-500 text-white rounded-tr-sm" 
                : "bg-white border border-charcoal-800/5 text-charcoal-900 rounded-tl-sm"
            )}>
              {msg.content === "no source available" ? (
                <p className="italic opacity-80">No source available in the ingested filings to answer this question.</p>
              ) : (
                <div className="prose prose-sm md:prose-base prose-charcoal max-w-none">
                  <ReactMarkdown
                    components={{
                      a: ({ node, ...props }) => {
                        if (props.href?.startsWith('#citation-')) {
                          const cIdx = parseInt(props.href.replace('#citation-', ''), 10);
                          return (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (msg.citations && msg.citations[cIdx]) {
                                  setActiveCitation(msg.citations[cIdx]);
                                }
                              }}
                              className="inline-flex items-center justify-center w-5 h-5 mx-0.5 text-[0.65rem] font-bold bg-ochre-500/10 text-ochre-600 rounded-full hover:bg-ochre-500 hover:text-white transition-colors align-super"
                            >
                              {cIdx}
                            </button>
                          );
                        }
                        return <a {...props} className="text-ochre-600 hover:underline" />;
                      }
                    }}
                  >
                    {msg.content.replace(/\[(\d+)\]/g, '[$1](#citation-$1)')}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-4 max-w-[85%] animate-pulse">
            <div className="shrink-0 w-10 h-10 rounded-full bg-charcoal-900/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-charcoal-900/40" />
            </div>
            <div className="px-6 py-4 rounded-2xl bg-white border border-charcoal-800/5 rounded-tl-sm flex items-center gap-2 text-charcoal-800/40">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="font-sans text-sm font-medium">Researching...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-charcoal-800/10">
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2 max-w-3xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            className="w-full max-h-32 min-h-[56px] py-4 pl-6 pr-16 bg-cream-50 border border-charcoal-800/10 rounded-3xl outline-none focus:border-ochre-500 focus:ring-1 focus:ring-ochre-500 resize-none font-sans text-charcoal-900 placeholder-charcoal-800/30 transition-all"
            rows={1}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 p-2.5 bg-charcoal-900 text-white rounded-full hover:bg-ochre-500 disabled:opacity-50 disabled:hover:bg-charcoal-900 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-center mt-3 font-sans text-xs text-charcoal-800/40">
          AI can make mistakes. Check important info.
        </p>
      </div>
      
      {/* Document Viewer Sidebar */}
      <CitationViewer 
        activeCitation={activeCitation} 
        onClose={() => setActiveCitation(null)} 
      />
    </div>
  );
}
