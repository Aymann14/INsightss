import React, { useState, useEffect } from 'react';
import { getInsights } from '../api';
import { Sparkles, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function InsightsPanel({ company, filingType, onInsightsReady }) {
  const [insightsData, setInsightsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchInsights = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await getInsights(company.ticker, filingType);
        if (isMounted) {
          setInsightsData(data.insights);
          onInsightsReady();
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError('Failed to generate insights. The LLM might be overloaded.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchInsights();
    return () => { isMounted = false; };
  }, [company.ticker, filingType, onInsightsReady]);

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-12 mb-16 bg-white p-10 md:p-14 rounded-2xl shadow-sm border border-charcoal-800/5">
        <div className="flex items-center gap-3 mb-10 text-ochre-500">
          <Sparkles className="w-6 h-6 animate-pulse" />
          <h3 className="font-serif text-2xl font-medium animate-pulse">Analyzing {filingType}...</h3>
        </div>
        
        <div className="space-y-12">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-6 bg-cream-200 w-1/3 rounded mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-cream-100 w-full rounded"></div>
                <div className="h-4 bg-cream-100 w-11/12 rounded"></div>
                <div className="h-4 bg-cream-100 w-4/5 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-12 p-8 bg-red-50 rounded-2xl text-red-700 font-sans">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 mb-16 bg-white p-10 md:p-14 rounded-2xl shadow-sm border border-charcoal-800/5 fade-in">
      <div className="flex items-center justify-between mb-12 border-b border-charcoal-800/10 pb-6">
        <div>
          <h3 className="font-serif text-3xl font-medium text-charcoal-900 mb-2">
            Executive Summary
          </h3>
          <p className="font-sans text-charcoal-800/60">
            AI-generated insights from {company.name}'s {filingType}
          </p>
        </div>
        <div className="hidden sm:flex items-center justify-center w-12 h-12 bg-ochre-500/10 rounded-full text-ochre-600">
          <Sparkles className="w-6 h-6" />
        </div>
      </div>

      <div className="space-y-12">
        {insightsData && insightsData.map((group, idx) => (
          <div key={idx} className="prose prose-charcoal max-w-none">
            <h4 className="font-sans text-sm font-bold tracking-widest uppercase text-ochre-600 mb-6 flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              {group.section}
            </h4>
            <ul className="space-y-4 m-0 p-0 list-none">
              {group.points.map((point, pIdx) => (
                <li key={pIdx} className="font-serif text-lg leading-relaxed text-charcoal-800 pl-6 relative">
                  <span className="absolute left-0 top-3 w-1.5 h-1.5 rounded-full bg-ochre-500"></span>
                  <ReactMarkdown components={{ p: ({node, ...props}) => <span {...props} /> }}>
                    {point}
                  </ReactMarkdown>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
