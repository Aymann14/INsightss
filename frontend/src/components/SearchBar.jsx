import React, { useState, useEffect, useRef, useCallback } from 'react';
import { searchCompanies } from '../api';
import debounce from 'lodash.debounce';
import { Search, Loader2 } from 'lucide-react';

export default function SearchBar({ onSelectCompany }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const fetchResults = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const data = await searchCompanies(searchQuery);
      setResults(data);
      setIsOpen(true);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce the API call so we don't spam the backend
  const debouncedSearch = useCallback(
    debounce((q) => fetchResults(q), 300),
    []
  );

  useEffect(() => {
    debouncedSearch(query);
    return debouncedSearch.cancel;
  }, [query, debouncedSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (company) => {
    onSelectCompany(company);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto">
      <div className="relative flex items-center w-full h-14 rounded-full border-2 border-charcoal-800/10 bg-white shadow-sm overflow-hidden focus-within:border-ochre-500 transition-colors">
        <div className="grid place-items-center h-full w-14 text-charcoal-800/40">
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
        </div>
        <input
          className="peer h-full w-full outline-none text-lg text-charcoal-900 bg-transparent font-sans placeholder-charcoal-800/30"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a company by name or ticker (e.g. Apple or AAPL)"
          onFocus={() => { if (results.length > 0) setIsOpen(true) }}
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-16 left-0 w-full bg-white rounded-xl shadow-lg border border-charcoal-800/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <ul>
            {results.map((company) => (
              <li 
                key={company.cik}
                onClick={() => handleSelect(company)}
                className="px-6 py-4 hover:bg-cream-100 cursor-pointer flex justify-between items-center border-b border-charcoal-800/5 last:border-0 transition-colors"
              >
                <span className="font-serif text-charcoal-900 font-medium text-lg">{company.name}</span>
                <span className="font-sans text-sm font-semibold bg-charcoal-800/5 text-charcoal-800 px-3 py-1 rounded-full">
                  {company.ticker}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
