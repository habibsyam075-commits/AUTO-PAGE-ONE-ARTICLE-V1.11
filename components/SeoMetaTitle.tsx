import React, { useState } from 'react';
import { Loader2, Lightbulb } from 'lucide-react';
import { ArticleData, Language } from '../types';
import { generateTitleSuggestions } from '../services/geminiService';

interface SeoMetaTitleProps {
  data: ArticleData;
  onUpdate: (field: keyof ArticleData, value: any) => void;
  language: Language;
  onShowToast: (msg: string) => void;
}

const SeoMetaTitle: React.FC<SeoMetaTitleProps> = ({ data, onUpdate, language, onShowToast }) => {
  const [loading, setLoading] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);

  const handleSuggestTitles = async () => {
    if (!data.focusKeyword) return onShowToast("Enter focus keyword first.");
    setLoading(true);
    try {
      const titles = await generateTitleSuggestions(data, language);
      setTitleSuggestions(titles);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-semibold text-stone-500 uppercase">Meta Title</label>
            <button 
                onClick={handleSuggestTitles}
                disabled={loading}
                className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
                {loading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Lightbulb className="w-3 h-3"/>}
                Suggest Ideas
            </button>
        </div>
        <input 
            className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs font-medium focus:border-orange-500 outline-none" 
            value={data.metaTitle}
            onChange={(e) => onUpdate('metaTitle', e.target.value)}
            placeholder={data.title}
        />
        {titleSuggestions.length > 0 && (
            <div className="mt-2 space-y-1">
                {titleSuggestions.map((t, i) => (
                    <button 
                        key={i} 
                        onClick={() => { onUpdate('metaTitle', t); setTitleSuggestions([]); }}
                        className="block w-full text-left px-3 py-2 bg-stone-50 hover:bg-orange-50 border border-stone-200 rounded-md text-[10px] text-stone-700 font-medium transition-colors"
                    >
                        {t}
                    </button>
                ))}
            </div>
        )}
    </div>
  );
};

export default SeoMetaTitle;