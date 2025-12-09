import React, { useState } from 'react';
import { Loader2, Sparkles, Hash } from 'lucide-react';
import { ArticleData, Language } from '../types';
import { generateSeoTags } from '../services/geminiService';

interface SeoTagsProps {
  data: ArticleData;
  onUpdate: (field: keyof ArticleData, value: any) => void;
  language: Language;
  onShowToast: (msg: string) => void;
}

const SeoTags: React.FC<SeoTagsProps> = ({ data, onUpdate, language, onShowToast }) => {
  const [loading, setLoading] = useState(false);

  const handleGenerateTags = async () => {
      if (!data.focusKeyword) return onShowToast("Focus keyword required.");
      setLoading(true);
      try {
          const tags = await generateSeoTags(data.content, data.focusKeyword, language);
          onUpdate('tags', tags);
          onShowToast("SEO Tags Generated!");
      } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-semibold text-stone-500 uppercase flex items-center gap-1">
                <Hash className="w-3 h-3"/> High SEO Tags
            </label>
            <button 
                onClick={handleGenerateTags}
                disabled={loading}
                className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
                {loading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                Generate
            </button>
        </div>
        <div className="bg-white border border-stone-300 rounded-lg p-3 min-h-[80px]">
            {data.tags && data.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {data.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-stone-100 text-stone-700 text-[10px] font-bold rounded-md border border-stone-200">
                            {tag}
                        </span>
                    ))}
                </div>
            ) : (
                <div className="text-center text-[10px] text-stone-400 py-4 italic">
                    No tags generated yet.
                </div>
            )}
        </div>
        {data.tags && data.tags.length > 0 && (
            <button 
                onClick={() => {
                    navigator.clipboard.writeText(data.tags?.join(', ') || "");
                    onShowToast("All tags copied!");
                }}
                className="mt-2 w-full py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg text-[10px] font-bold text-stone-600 transition-all"
            >
                Copy All Tags
            </button>
        )}
    </div>
  );
};

export default SeoTags;