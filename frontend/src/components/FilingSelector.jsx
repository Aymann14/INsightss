import React, { useState } from 'react';
import { ingestFiling } from '../api';
import { FileText, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

const FILING_TYPES = ['10-K', '10-Q', '8-K', 'DEF 14A'];

export default function FilingSelector({ company, onFilingIngested, onGenerateInsights }) {
  const [selectedType, setSelectedType] = useState(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestedTypes, setIngestedTypes] = useState(new Set());
  const [error, setError] = useState('');

  const handleSelect = async (type) => {
    setSelectedType(type);
    setError('');
    
    // If we already ingested this type for this company, no need to do it again in UI
    if (ingestedTypes.has(type)) {
      onFilingIngested(type);
      return;
    }

    setIsIngesting(true);
    try {
      await ingestFiling(company.ticker, type);
      setIngestedTypes(prev => new Set(prev).add(type));
      onFilingIngested(type);
    } catch (err) {
      console.error(err);
      setError(`Failed to fetch ${type}. The SEC might not have this filing available or we are rate-limited.`);
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 mb-8 fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-charcoal-800/10">
        
        {/* Company Header */}
        <div className="flex-1">
          <h2 className="text-4xl font-serif font-medium text-charcoal-900 mb-2">
            {company.name}
          </h2>
          <div className="flex items-center gap-2">
            <span className="font-sans text-sm font-semibold tracking-wider text-charcoal-800/60 uppercase">
              {company.ticker}
            </span>
            <span className="text-charcoal-800/20">•</span>
            <span className="font-sans text-sm text-charcoal-800/40">
              CIK: {company.cik}
            </span>
          </div>
        </div>

        {/* Action Button */}
        {ingestedTypes.has(selectedType) && (
          <button
            onClick={() => onGenerateInsights(selectedType)}
            className="group relative inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-charcoal-900 text-cream-50 font-sans font-medium rounded-full overflow-hidden transition-all hover:bg-ochre-500 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            <Sparkles className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span>Generate Insights</span>
          </button>
        )}
      </div>

      {/* Filing Type Selector */}
      <div className="mt-8">
        <p className="font-sans text-sm font-medium text-charcoal-800/60 uppercase tracking-widest mb-4">
          Select Filing Document
        </p>
        <div className="flex flex-wrap gap-3">
          {FILING_TYPES.map(type => {
            const isSelected = selectedType === type;
            const isIngested = ingestedTypes.has(type);
            
            return (
              <button
                key={type}
                onClick={() => handleSelect(type)}
                disabled={isIngesting && !isSelected}
                className={clsx(
                  "relative flex items-center gap-2 px-6 py-3 rounded-full font-sans text-sm font-medium transition-all duration-200 border-2",
                  isSelected 
                    ? "bg-cream-100 border-ochre-500 text-charcoal-900 shadow-sm"
                    : "bg-white border-transparent text-charcoal-800/60 hover:bg-cream-100 hover:text-charcoal-900",
                  (isIngesting && !isSelected) && "opacity-50 cursor-not-allowed"
                )}
              >
                {isSelected && isIngesting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-ochre-500" />
                ) : isIngested ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                {type}
              </button>
            )
          })}
        </div>
        
        {/* Status Messages */}
        <div className="mt-4 min-h-[1.5rem]">
          {isIngesting && (
            <p className="text-sm font-sans text-charcoal-800/60 flex items-center gap-2 animate-pulse">
              Fetching and processing {selectedType} from SEC EDGAR...
            </p>
          )}
          {error && (
            <p className="text-sm font-sans text-red-600">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
