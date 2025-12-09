import React from 'react';
import { ScanFace, Check, FileText, Code } from 'lucide-react';
import { ArticleData, Language, SeoCheckResult } from '../types';
import SeoScoreCard from './SeoScoreCard';
import SnippetPreview from './SnippetPreview';
import SeoH1Optimizer from './SeoH1Optimizer';
import SeoContentAudit from './SeoContentAudit';
import SeoMetaTitle from './SeoMetaTitle';
import SeoMetaDescription from './SeoMetaDescription';
import SeoSlug from './SeoSlug';
import SeoSchema from './SeoSchema';
import SeoTags from './SeoTags';
import AnalysisResult from './AnalysisResult';

interface SeoPanelProps {
  data: ArticleData;
  onUpdate: (field: keyof ArticleData, value: any) => void;
  language: Language;
  score: number;
  checks: SeoCheckResult[];
  onFixSeo: (id: string) => void;
  fixingId: string | null;
  onShowToast: (msg: string) => void;
}

const SeoPanel: React.FC<SeoPanelProps> = ({ 
  data, 
  onUpdate, 
  language, 
  score, 
  checks, 
  onFixSeo, 
  fixingId,
  onShowToast
}) => {
  return (
    <div className="space-y-8 animate-slideIn">
        
        {/* Score Card */}
        <SeoScoreCard score={score} />

        <SnippetPreview data={data} />

        {/* Focus Keyword */}
        <div>
            <label className="flex items-center gap-2 text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">
                <ScanFace className="w-3.5 h-3.5" /> Focus Keyword
            </label>
            <div className="relative">
                <input 
                    className="w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-sm font-bold text-stone-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none placeholder:text-stone-300" 
                    placeholder="e.g. AI Trends"
                    value={data.focusKeyword}
                    onChange={(e) => onUpdate('focusKeyword', e.target.value)}
                />
            </div>
        </div>

        {/* H1 Title Optimizer */}
        <SeoH1Optimizer 
            data={data}
            onUpdateTitle={(title) => onUpdate('title', title)}
            language={language}
            onShowToast={onShowToast}
        />

        {/* Content Audit (AI/Humanize) */}
        <SeoContentAudit 
            data={data}
            language={language}
            onUpdateContent={(content) => onUpdate('content', content)}
            onShowToast={onShowToast}
        />

        {/* Metadata Section - Separated Components (Without Schema) */}
        <div className="border-t border-stone-200 pt-6 space-y-4">
            <h3 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-orange-600" /> Metadata
            </h3>
            
            <SeoMetaTitle 
                data={data} 
                onUpdate={onUpdate} 
                language={language} 
                onShowToast={onShowToast} 
            />
            
            <SeoMetaDescription 
                data={data} 
                onUpdate={onUpdate} 
                language={language} 
                onShowToast={onShowToast} 
            />
            
            <SeoSlug 
                data={data} 
                onUpdate={onUpdate} 
            />
            
            <SeoTags 
                data={data} 
                onUpdate={onUpdate} 
                language={language} 
                onShowToast={onShowToast} 
            />
        </div>

        {/* Structured Data (Schema) - NEW SEPARATED SECTION */}
        <div className="border-t border-stone-200 pt-6">
            <h3 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Code className="w-3.5 h-3.5 text-orange-600" /> Structured Data
            </h3>
            <SeoSchema 
                data={data} 
                onUpdate={onUpdate} 
                language={language} 
                onShowToast={onShowToast} 
            />
        </div>

        {/* Checklist */}
        <div className="border-t border-stone-200 pt-6">
            <h3 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-orange-600" /> SEO Checklist
            </h3>
            <AnalysisResult 
                checks={checks} 
                onFix={onFixSeo} 
                fixingId={fixingId}
            />
        </div>
    </div>
  );
};

export default SeoPanel;