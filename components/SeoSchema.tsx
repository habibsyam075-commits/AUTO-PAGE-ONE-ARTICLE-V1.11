import React, { useState } from 'react';
import { Loader2, Code, Copy } from 'lucide-react';
import { ArticleData, Language } from '../types';
import { generateJsonLd } from '../services/geminiService';

interface SeoSchemaProps {
  data: ArticleData;
  onUpdate: (field: keyof ArticleData, value: any) => void;
  language: Language;
  onShowToast: (msg: string) => void;
}

const SeoSchema: React.FC<SeoSchemaProps> = ({ data, onUpdate, language, onShowToast }) => {
  const [loading, setLoading] = useState(false);

  const handleGenerateJsonLd = async () => {
    if (!data.content) return onShowToast("Content required for Schema.");
    setLoading(true);
    try {
        const schema = await generateJsonLd(data, language);
        onUpdate('jsonLd', schema);
        onShowToast("JSON-LD Schema Generated!");
    } catch (e: any) { 
        console.error(e); 
        onShowToast(e.message || "Failed to generate Schema"); 
    } finally { 
        setLoading(false); 
    }
  };

  const handleCopyJsonLd = () => {
     if (!data.jsonLd) return;
     navigator.clipboard.writeText(data.jsonLd).then(() => onShowToast("Schema copied!"));
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-semibold text-stone-500 uppercase">JSON-LD Schema</label>
            <button 
                onClick={handleGenerateJsonLd}
                disabled={loading}
                className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
                {loading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Code className="w-3 h-3"/>}
                Generate JSON-LD
            </button>
        </div>
        {data.jsonLd && (
            <div className="relative group">
            <textarea 
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-[10px] font-mono text-stone-600 outline-none resize-none" 
                rows={4}
                readOnly
                value={data.jsonLd}
            />
            <button 
                onClick={handleCopyJsonLd}
                className="absolute top-2 right-2 p-1.5 bg-white border border-stone-200 rounded hover:bg-stone-100 text-stone-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                title="Copy Schema"
            >
                <Copy className="w-3 h-3" />
            </button>
            </div>
        )}
    </div>
  );
};

export default SeoSchema;