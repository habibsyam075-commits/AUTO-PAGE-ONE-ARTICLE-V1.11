import React from 'react';
import { ArticleData } from '../types';

interface SnippetPreviewProps {
  data: ArticleData;
}

const SnippetPreview: React.FC<SnippetPreviewProps> = ({ data }) => {
  const displayTitle = data.metaTitle || data.title || "Your Article Title Goes Here";
  const displaySlug = data.slug || "your-clean-slug";
  const displayMeta = data.metaDescription || "This is how your article will appear in Google search results. Make it catchy and relevant to improve your CTR.";

  const truncatedTitle = displayTitle.length > 60 ? displayTitle.substring(0, 57) + '...' : displayTitle;
  const truncatedMeta = displayMeta.length > 160 ? displayMeta.substring(0, 157) + '...' : displayMeta;

  return (
    <div className="bg-white p-5 rounded-xl border border-stone-300 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1.5">
           <span className="w-2 h-2 rounded-full bg-blue-500"></span>
           Google Preview
        </h3>
      </div>
      
      <div className="font-sans select-none pointer-events-none p-1">
        <div className="flex items-center gap-3 mb-2">
           <div className="w-7 h-7 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center overflow-hidden shrink-0">
             {data.featuredImage ? (
                <img src={data.featuredImage} alt="Icon" className="w-full h-full object-cover" />
             ) : (
                <div className="w-full h-full bg-stone-900 flex items-center justify-center">
                    <span className="text-[10px] font-black text-orange-500 italic">A1</span>
                </div>
             )}
           </div>
           <div className="flex flex-col justify-center">
              <span className="text-[12px] text-stone-900 font-bold leading-none mb-0.5">AutoPageOne</span>
              <span className="text-[11px] text-stone-600 leading-none">autopageone.com › blog › {displaySlug}</span>
           </div>
        </div>
        <div className="block text-[#1a0dab] text-xl leading-snug font-medium hover:underline mb-1.5 truncate cursor-pointer font-sans tracking-tight">
          {truncatedTitle}
        </div>
        <p className="text-sm text-[#4d5156] leading-relaxed line-clamp-2">
          {truncatedMeta}
        </p>
      </div>
    </div>
  );
};

export default SnippetPreview;