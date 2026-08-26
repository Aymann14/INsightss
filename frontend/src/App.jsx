import React, { useState } from 'react';
import SearchBar from './components/SearchBar';
import FilingSelector from './components/FilingSelector';
import InsightsPanel from './components/InsightsPanel';
import ChatInterface from './components/ChatInterface';
import EmailOverlay from './components/EmailOverlay';
import ChatHistoryTab from './components/ChatHistoryTab';
import { BookMarked } from 'lucide-react';

export default function App() {
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedFiling, setSelectedFiling] = useState(null);
  const [showInsights, setShowInsights] = useState(false);
  const [insightsReady, setInsightsReady] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);

  const handleSelectCompany = (company) => {
    setSelectedCompany(company);
    setSelectedFiling(null);
    setShowInsights(false);
    setInsightsReady(false);
    setActiveConversationId(null);
  };

  const handleFilingIngested = (type) => {
    setSelectedFiling(type);
  };

  const handleGenerateInsights = (type) => {
    setShowInsights(true);
    setInsightsReady(false);
  };

  const handleReset = () => {
    setSelectedCompany(null);
    setSelectedFiling(null);
    setShowInsights(false);
    setInsightsReady(false);
    setActiveConversationId(null);
  };

  const handleSelectConversation = (id) => {
    setActiveConversationId(id);
    // If they load a conversation, ensure chat is visible. 
    // They might not have a company selected, so we mock one if needed, 
    // but usually they load history to just chat.
    if (!selectedCompany) {
      setSelectedCompany({ name: "Archived Conversation", ticker: "History", cik: "N/A" });
      setInsightsReady(true);
    } else {
      setInsightsReady(true);
    }
  };

  return (
    <div className="min-h-screen selection:bg-ochre-500/30 selection:text-charcoal-900">
      <EmailOverlay onComplete={() => setIsEmailVerified(true)} />
      
      {isEmailVerified && <ChatHistoryTab onSelectConversation={handleSelectConversation} />}

      <main className="px-4 py-12 md:py-20 max-w-6xl mx-auto">
        
        {/* Centered, Refined Header & Intro */}
        <div className="text-center max-w-3xl mx-auto mb-16 fade-in">
          <div 
            onClick={handleReset}
            className="inline-flex flex-col items-center justify-center cursor-pointer group mb-10"
          >
            <div className="w-16 h-16 bg-charcoal-900 text-cream-50 rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-105 group-hover:bg-ochre-500 transition-all duration-300">
              <BookMarked className="w-8 h-8" />
            </div>
            <h1 className="font-serif text-5xl md:text-6xl font-bold tracking-tight text-charcoal-900 group-hover:text-ochre-600 transition-colors">
              INsightss
            </h1>
          </div>

          {!selectedCompany && (
            <>
              <p className="font-serif text-xl text-charcoal-800/60 mb-12">
                Uncover the story behind the numbers. Search any public company to generate executive summaries and chat directly with their historical documents.
              </p>
              <SearchBar onSelectCompany={handleSelectCompany} />
            </>
          )}
        </div>

        {/* Selected Company Flow */}
        {selectedCompany && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-center mb-12">
              <SearchBar onSelectCompany={handleSelectCompany} />
            </div>

            {/* Only show filing selector if it's a real company search */}
            {selectedCompany.ticker !== "History" && (
              <FilingSelector 
                company={selectedCompany} 
                onFilingIngested={handleFilingIngested}
                onGenerateInsights={handleGenerateInsights}
              />
            )}

            {showInsights && selectedFiling && selectedCompany.ticker !== "History" && (
              <InsightsPanel 
                company={selectedCompany} 
                filingType={selectedFiling} 
                onInsightsReady={() => setInsightsReady(true)}
              />
            )}

            {insightsReady && (
              <ChatInterface 
                tickers={selectedCompany.ticker !== "History" ? [selectedCompany.ticker] : ["Archived Context"]} 
                initialConversationId={activeConversationId} 
              />
            )}
          </div>
        )}

      </main>
    </div>
  );
}
