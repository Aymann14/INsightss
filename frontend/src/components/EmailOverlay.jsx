import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight } from 'lucide-react';

export default function EmailOverlay({ onComplete }) {
  const [email, setEmail] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('insightss_user_email');
    if (saved) {
      setIsVisible(false);
      onComplete();
    }
  }, [onComplete]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim() && email.includes('@')) {
      localStorage.setItem('insightss_user_email', email.trim());
      setIsVisible(false);
      onComplete();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Liquid Glass Background */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-xl animate-in fade-in duration-1000"></div>
      
      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-md bg-white/60 backdrop-blur-2xl border border-white/50 shadow-2xl rounded-3xl p-10 animate-in slide-in-from-bottom-8 fade-in duration-700">
        <div className="text-center mb-8">
          <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-3">Welcome to INsightss</h2>
          <p className="font-sans text-charcoal-800/60 leading-relaxed">
            Please enter your email to start exploring. You'll receive 10 free AI interactions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-800/40">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full h-14 pl-12 pr-4 bg-white/50 border-2 border-white/60 rounded-2xl outline-none focus:border-ochre-500 focus:bg-white/80 transition-all font-sans text-charcoal-900 placeholder-charcoal-800/30 shadow-inner"
            />
          </div>
          <button
            type="submit"
            className="w-full h-14 flex items-center justify-center gap-2 bg-charcoal-900 text-cream-50 rounded-2xl font-sans font-medium hover:bg-ochre-500 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
