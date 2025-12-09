import React, { useState } from 'react';
import { ShieldCheck, Loader2, ScanFace, Wand2 } from 'lucide-react';
import { detectAiPatterns, humanizeContent } from '../services/geminiService';
import { AiDetectionResult, Language, ArticleData } from '../types';

interface SeoContentAuditProps {
  data: ArticleData;
  language: Language;
  onUpdateContent: (content: string) => void;
  onShowToast: (msg: string) => void;
}

const SeoContentAudit: React.FC<SeoContentAuditProps> = ({ data, language, onUpdateContent, onShowToast }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<AiDetectionResult | null>(null);

  const handleAiDetect = async () => {
    if (data.content.length < 100) return onShowToast("Content too short to detect.");
    setLoading('detect');
    try {
        const detectionResult = await detectAiPatterns(data.content, language);
        setResult(detectionResult);
    } catch (e) { 
        console.error(e); 
        onShowToast("Detection failed"); 
    } finally { 
        setLoading(null); 
    }
  };

  const handleHumanize = async () => {
      if (!data.focusKeyword) return onShowToast("Keyword required for humanization.");
      setLoading('humanize');
      try {
          const newContent = await humanizeContent(data.content, data.focusKeyword, language);
          onUpdateContent(newContent);
          // Auto re-detect after humanizing
          const detectionResult = await detectAiPatterns(newContent, language);
          setResult(detectionResult);
          onShowToast("Content Humanized!");
      } catch (e) { 
          console.error(e); 
          onShowToast("Humanization failed"); 
      } finally { 
          setLoading(null); 
      }
  };

  return (
    <div className="border-t border-stone-200 pt-6">
        <h3 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-orange-600" /> Content Audit
        </h3>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
            <button 
                onClick={handleAiDetect}
                disabled={loading === 'detect'}
                className="flex items-center justify-center gap-2 py-3 bg-white border border-stone-300 hover:border-stone-400 rounded-lg text-xs font-bold text-stone-700 shadow-sm transition-all"
            >
                {loading === 'detect' ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <ScanFace className="w-3.5 h-3.5"/>}
                Detect AI
            </button>
            <button 
                onClick={handleHumanize}
                disabled={loading === 'humanize'}
                className="flex items-center justify-center gap-2 py-3 bg-stone-900 hover:bg-black text-white rounded-lg text-xs font-bold shadow-sm transition-all"
            >
                {loading === 'humanize' ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Wand2 className="w-3.5 h-3.5"/>}
                Humanize
            </button>
        </div>

        {result && (
            <div className={`p-4 rounded-xl border mb-2 ${result.isHuman ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-stone-700">AI Probability Score</span>
                    <span className={`text-sm font-black ${result.isHuman ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {result.score}/100
                    </span>
                </div>
                <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-stone-200">
                    <div 
                        className={`h-full transition-all duration-1000 ${result.isHuman ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                        style={{width: `${result.score}%`}}
                    ></div>
                </div>
                <p className="text-[10px] mt-2 text-stone-600 font-medium leading-relaxed">{result.reasoning}</p>
            </div>
        )}
    </div>
  );
};

export default SeoContentAudit;