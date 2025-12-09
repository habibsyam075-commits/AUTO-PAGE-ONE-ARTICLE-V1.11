import React, { useState } from 'react';
import { FileText, Loader2, Lightbulb, RefreshCw, Code, Copy, Hash, Sparkles } from 'lucide-react';
import { ArticleData, Language } from '../types';
import { generateTitleSuggestions, generateMetaDescription, generateJsonLd, generateSeoTags } from '../services/geminiService';
import { slugify } from '../utils/seoUtils';

interface SeoMetadataProps {
  data: ArticleData;
  onUpdate: (field: keyof ArticleData, value: any) => void;
  language: Language;
  onShowToast: (msg: string) => void;
}

const SeoMetadata: React.FC<SeoMetadataProps> = ({ data, onUpdate, language, onShowToast }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);

  const handleSuggestTitles = async () => {
    if (!data.focusKeyword) return onShowToast("Enter focus keyword first.");
    setLoading('titles');
    try {
      const titles = await generateTitleSuggestions(data, language);
      setTitleSuggestions(titles);
    } catch (e) { console.error(e); } finally { setLoading(null); }
  };

  const handleGenerateMeta = async () => {
    if (!data.focusKeyword) return onShowToast("Enter focus keyword first.");
    setLoading('meta');
    try {
      const meta = await generateMetaDescription(data, language);
      onUpdate('metaDescription', meta);
    } catch (e) { console.error(e); } finally { setLoading(null); }
  };

  const handleGenerateJsonLd = async () => {
    if (!data.content) return onShowToast("Content required for Schema.");
    setLoading('jsonld');
    try {
        const schema = await generateJsonLd(data, language);
        onUpdate('jsonLd', schema);
        onShowToast("JSON-LD Schema Generated!");
    } catch (e: any) { 
        console.error(e); 
        onShowToast(e.message || "Failed to generate Schema"); 
    } finally { 
        setLoading(null); 
    }
  };

  const handleGenerateTags = async () => {
      if (!data.focusKeyword) return onShowToast("Focus keyword required.");
      setLoading('tags');
      try {
          const tags = await generateSeoTags(data.content, data.focusKeyword, language);
          onUpdate('tags', tags);
          onShowToast("SEO Tags Generated!");
      } catch (e) { console.error(e); } finally { setLoading(null); }
  };

  const handleCopyJsonLd = () => {
     if (!data.jsonLd) return;
     navigator.clipboard.writeText(data.jsonLd).then(() => onShowToast("Schema copied!"));
  };

  return (
    <div className="border-t border-stone-200 pt-6 space-y-4">
        <h3 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-orange-600" /> Metadata
        </h3>

        {/* Meta Title */}
        <div>
            <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-semibold text-stone-500 uppercase">Meta Title</label>
                <button 
                  onClick={handleSuggestTitles}
                  disabled={loading === 'titles'}
                  className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  {loading === 'titles' ? <Loader2 className="w-3 h-3 animate-spin"/> : <Lightbulb className="w-3 h-3"/>}
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

        {/* Meta Description */}
        <div>
            <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-semibold text-stone-500 uppercase">Meta Description</label>
                <button 
                  onClick={handleGenerateMeta}
                  disabled={loading === 'meta'}
                  className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  {loading === 'meta' ? <Loader2 className="w-3 h-3 animate-spin"/> : <RefreshCw className="w-3 h-3"/>}
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
        
        {/* Slug */}
        <div>
            <label className="block text-[10px] font-semibold text-stone-500 uppercase mb-1">Slug</label>
            <input 
                className="w-full bg-stone-100 border border-stone-200 rounded-lg px-3 py-2 text-xs font-mono text-stone-600 focus:border-orange-500 outline-none" 
                value={data.slug}
                onChange={(e) => onUpdate('slug', slugify(e.target.value))}
            />
        </div>

        {/* JSON-LD Schema */}
        <div>
            <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-semibold text-stone-500 uppercase">JSON-LD Schema</label>
                <button 
                  onClick={handleGenerateJsonLd}
                  disabled={loading === 'jsonld'}
                  className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  {loading === 'jsonld' ? <Loader2 className="w-3 h-3 animate-spin"/> : <Code className="w-3 h-3"/>}
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

        {/* SEO Tags */}
        <div>
            <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-semibold text-stone-500 uppercase flex items-center gap-1">
                    <Hash className="w-3 h-3"/> High SEO Tags
                </label>
                <button 
                  onClick={handleGenerateTags}
                  disabled={loading === 'tags'}
                  className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  {loading === 'tags' ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
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
    </div>
  );
};

export default SeoMetadata;