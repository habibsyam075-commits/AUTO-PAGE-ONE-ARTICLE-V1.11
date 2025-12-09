import React, { useState } from 'react';
import { Type, Loader2, Lightbulb } from 'lucide-react';
import { generateH1Suggestions } from '../services/geminiService';
import { Language, ArticleData } from '../types';

interface SeoH1OptimizerProps {
  data: ArticleData;
  onUpdateTitle: (title: string) => void;
  language: Language;
  onShowToast: (msg: string) => void;
}

const SeoH1Optimizer: React.FC<SeoH1OptimizerProps> = ({ data, onUpdateTitle, language, onShowToast }) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleSuggestH1 = async () => {
    if (!data.title) return onShowToast("Enter a title first to get variations.");
    setLoading(true);
    try {
        const h1s = await generateH1Suggestions(data, language);
        setSuggestions(h1s);
    } catch (e) { 
        console.error(e); 
        onShowToast("Failed to generate H1 suggestions");
    } finally { 
        setLoading(false); 
    }
  };

  return (
    <div className="border-t border-stone-200 pt-6">
        <h3 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Type className="w-3.5 h-3.5 text-orange-600" /> H1 Title Optimizer
        </h3>
        <p className="text-[10px] text-stone-500 mb-3">
            Current H1: <strong className="text-stone-700">{data.title || "No title set"}</strong>
        </p>
        <button 
            onClick={handleSuggestH1}
            disabled={loading || !data.title}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-stone-300 hover:border-orange-500 hover:text-orange-600 rounded-lg text-xs font-bold text-stone-700 shadow-sm transition-all"
        >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Lightbulb className="w-3.5 h-3.5"/>}
            Get H1 Variations
        </button>

        {suggestions.length > 0 && (
            <div className="mt-3 space-y-2">
                {suggestions.map((t, i) => (
                    <button 
                        key={i} 
                        onClick={() => { onUpdateTitle(t); setSuggestions([]); }}
                        className="block w-full text-left p-3 bg-stone-50 hover:bg-orange-50 border border-stone-200 rounded-lg text-xs text-stone-800 font-medium transition-colors leading-snug"
                    >
                        {t}
                    </button>
                ))}
            </div>
        )}
    </div>
  );
};

export default SeoH1Optimizer;