import React from 'react';
import { ArticleData, Language } from '../types';
import { Sparkles, Settings2 } from 'lucide-react';
import AiArticleGenerator from './AiArticleGenerator';
import AiImageGenerator from './AiImageGenerator';

interface AiToolsProps {
  data: ArticleData;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onUpdateContent: (title: string, content: string, keyword: string) => void;
  onUpdateFeaturedImage: (base64: string) => void;
}

const AiTools: React.FC<AiToolsProps> = ({ 
  data, 
  language, 
  onLanguageChange, 
  onUpdateContent, 
  onUpdateFeaturedImage 
}) => {
  return (
    <div className="space-y-6 animate-slideIn pb-20 font-sans">

      {/* Language Config */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-stone-300 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-stone-900 text-white rounded-lg">
                <Settings2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Settings</span>
          </div>
          <div className="flex bg-stone-100 p-1 rounded-lg border border-stone-200">
             <button 
                onClick={() => onLanguageChange('id')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${language === 'id' ? 'bg-white text-stone-900 shadow-sm border border-stone-200' : 'text-stone-400'}`}
             >
                ID
             </button>
             <button 
                onClick={() => onLanguageChange('en')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${language === 'en' ? 'bg-white text-stone-900 shadow-sm border border-stone-200' : 'text-stone-400'}`}
             >
                EN
             </button>
          </div>
      </div>

      {/* --- ARTICLE GENERATOR --- */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-stone-900 uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-600" />
            Content Engine
        </h3>
        
        <AiArticleGenerator 
            data={data}
            language={language}
            onUpdateContent={onUpdateContent}
            onUpdateFeaturedImage={onUpdateFeaturedImage}
        />
      </div>

      {/* --- SEPARATOR --- */}
      <div className="h-px bg-stone-200 w-full"></div>

      {/* --- IMAGE GENERATOR --- */}
      <div className="space-y-4">
        <AiImageGenerator 
            currentTitle={data.title}
            onUpdateFeaturedImage={onUpdateFeaturedImage}
        />
      </div>

    </div>
  );
};

export default AiTools;