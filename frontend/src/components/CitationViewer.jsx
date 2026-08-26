import React from 'react';
import { X, BookOpen, ExternalLink } from 'lucide-react';
import clsx from 'clsx';

export default function CitationViewer({ activeCitation, onClose }) {
  const isOpen = !!activeCitation;

  return (
    <>
      {/* Overlay */}
      <div 
        className={clsx(
          "fixed inset-0 z-50 bg-charcoal-900/10 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Side Panel */}
      <div 
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-full max-w-md bg-white shadow-2xl border-r border-charcoal-800/10 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-6 py-5 bg-cream-50 border-b border-charcoal-800/10 flex justify-between items-center shrink-0">
          <h3 className="font-sans font-semibold text-sm uppercase tracking-widest text-charcoal-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-ochre-500" />
            Source Extract {isOpen && `[${activeCitation.chunk_index}]`}
          </h3>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-charcoal-800/40 hover:text-charcoal-900 hover:bg-charcoal-800/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-white">
          <div className="mb-6 flex items-center justify-between">
            <span className="font-serif italic text-charcoal-800/50">From ingested SEC filing</span>
            <span className="px-2.5 py-1 bg-ochre-500/10 text-ochre-600 rounded text-xs font-bold uppercase tracking-wider font-sans">
              Matched Context
            </span>
          </div>
          
          {isOpen && (
            <div className="relative">
              {/* Highlight styling to look like a scanned document highlight */}
              <div className="font-serif text-lg leading-loose text-charcoal-900 bg-ochre-500/10 p-6 rounded-r-xl border-l-4 border-ochre-500">
                {activeCitation.source_chunk}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-charcoal-800/10 bg-cream-50 shrink-0">
          <p className="text-xs font-sans text-charcoal-800/40 text-center flex items-center justify-center gap-1">
            <ExternalLink className="w-3 h-3" />
            Extracted via AI from raw EDGAR HTML
          </p>
        </div>
      </div>
    </>
  );
}
