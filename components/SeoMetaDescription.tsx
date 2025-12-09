import React, { useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { ArticleData, Language } from '../types';
import { generateMetaDescription } from '../services/geminiService';

interface SeoMetaDescriptionProps {
  data: ArticleData;
  onUpdate: (field: keyof ArticleData, value: any) => void;
  language: Language;
  onShowToast: (msg: string) => void;
}

const SeoMetaDescription: React.FC<SeoMetaDescriptionProps> = ({ data, onUpdate, language, onShowToast }) => {
  const [loading, setLoading] = useState(false);

  const handleGenerateMeta = async () => {
    if (!data.focusKeyword) return onShowToast("Enter focus keyword first.");
    setLoading(true);
    try {
      const meta = await generateMetaDescription(data, language);
      onUpdate('metaDescription', meta);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-semibold text-stone-500 uppercase">Meta Description</label>
            <button 
                onClick={handleGenerateMeta}
                disabled={loading}
                className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
                {loading ? <Loader2 className="w-3 h-3 animate-spin"/> : <RefreshCw className="w-3 h-3"/>}
                Auto-Generate
            </button>
        </div>
        <textarea 
            className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs font-medium focus:border-orange-500 outline-none resize-none" 
            rows={3}
            value={data.metaDescription}
            onChange={(e) => onUpdate('metaDescription', e.target.value)}
        />
        <div className="flex justify-between mt-1">
            <span className={`text-[9px] font-bold ${data.metaDescription.length > 160 || data.metaDescription.length < 120 ? 'text-rose-500' : 'text-emerald-600'}`}>
                {data.metaDescription.length} chars (Target: 120-160)
            </span>
        </div>
    </div>
  );
};

export default SeoMetaDescription;