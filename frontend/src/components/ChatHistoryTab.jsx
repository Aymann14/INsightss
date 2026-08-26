import React, { useState, useEffect } from 'react';
import { getConversations } from '../api';
import { History, X, MessageSquare } from 'lucide-react';
import clsx from 'clsx';

export default function ChatHistoryTab({ onSelectConversation }) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (id) => {
    setIsOpen(false);
    onSelectConversation(id);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={clsx(
          "fixed bottom-6 right-6 z-40 w-14 h-14 bg-charcoal-900 text-cream-50 rounded-full flex items-center justify-center shadow-2xl hover:bg-ochre-500 hover:-translate-y-1 transition-all duration-300",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      >
        <History className="w-6 h-6" />
      </button>

      {/* Overlay for clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/5 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Genie Effect Panel */}
      <div 
        className={clsx(
          "fixed bottom-6 right-6 z-50 w-80 max-h-[70vh] bg-white rounded-3xl shadow-2xl border border-charcoal-800/10 flex flex-col overflow-hidden origin-bottom-right transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-0 opacity-0 translate-y-20 pointer-events-none"
        )}
      >
        <div className="px-6 py-4 bg-cream-50 border-b border-charcoal-800/10 flex justify-between items-center">
          <h3 className="font-serif font-medium text-lg text-charcoal-900 flex items-center gap-2">
            <History className="w-5 h-5 text-ochre-500" />
            Chat History
          </h3>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-full text-charcoal-800/40 hover:text-charcoal-900 hover:bg-charcoal-800/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="w-6 h-6 border-2 border-ochre-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center p-8 text-charcoal-800/40 font-sans text-sm">
              No previous chats found.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelect(conv.id)}
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-cream-100 transition-colors flex items-start gap-3 group"
                >
                  <MessageSquare className="w-4 h-4 mt-1 text-charcoal-800/30 group-hover:text-ochre-500 transition-colors shrink-0" />
                  <div>
                    <p className="font-serif text-charcoal-900 line-clamp-2 leading-snug">
                      {conv.title}
                    </p>
                    <p className="font-sans text-xs text-charcoal-800/40 mt-1">
                      {new Date(conv.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
