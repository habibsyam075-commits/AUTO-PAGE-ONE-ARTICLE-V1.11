import React, { useRef, useEffect } from 'react';
import { ArticleData } from '../types';
import { Download, X } from 'lucide-react';
import { cleanContent, slugify } from '../utils/seoUtils';
// @ts-ignore
import { parse } from 'marked';

interface EditorProps {
  data: ArticleData;
  onChange: (field: keyof ArticleData, value: string) => void;
  isPreviewMode: boolean;
}

const Editor: React.FC<EditorProps> = ({ data, onChange, isPreviewMode }) => {
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isPreviewMode && titleTextareaRef.current) {
        titleTextareaRef.current.style.height = 'auto';
        titleTextareaRef.current.style.height = titleTextareaRef.current.scrollHeight + 'px';
    }
  }, [data.title, isPreviewMode]);

  const handleDownloadImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!data.featuredImage) return;
    
    const a = document.createElement('a');
    a.href = data.featuredImage;
    a.download = `featured-image-${slugify(data.title || 'image')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getPreviewHtml = () => {
    const cleaned = cleanContent(data.content || '');
    return parse(cleaned) as string;
  };

  return (
    <div className="w-full max-w-3xl pb-32 animate-fadeUp">
        {/* Paper Sheet */}
        <div className={`relative bg-white transition-all duration-300 min-h-[85vh] p-8 md:p-20 ${isPreviewMode ? 'shadow-none bg-transparent' : 'shadow-xl shadow-stone-900/5 rounded-2xl border border-stone-200'}`}>
            
            {data.featuredImage && (
                  <div className="mb-12">
                      <div className="relative group rounded-xl overflow-hidden shadow-md border border-stone-100 bg-stone-50">
                          <img src={data.featuredImage} alt="Featured" className="w-full h-auto max-h-[500px] object-cover" />
                          
                          {/* Delete Button - Absolute */}
                          {!isPreviewMode && (
                              <button onClick={() => onChange('featuredImage', '')} className="absolute top-4 right-4 bg-white/80 hover:bg-white p-2 rounded-full shadow-sm text-stone-500 hover:text-rose-600 transition-all z-10 backdrop-blur-sm">
                                  <X className="w-5 h-5" />
                              </button>
                          )}
                      </div>
                      {/* Download Button - Below Image */}
                      <div className="flex justify-end mt-3">
                          <button 
                            onClick={handleDownloadImage}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-700 hover:bg-stone-50 hover:border-stone-400 transition-all shadow-sm"
                          >
                             <Download className="w-3.5 h-3.5" />
                             Download High-Res
                          </button>
                      </div>
                  </div>
             )}

            {isPreviewMode ? (
                <div className="animate-fadeIn">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-stone-900 mb-6 leading-[1.1] tracking-tight">{data.title || "Untitled Article"}</h1>
                    <div className="flex items-center gap-4 mb-12 text-xs font-bold text-stone-500 uppercase tracking-widest border-b-2 border-stone-100 pb-6">
                        <span>{new Date().toLocaleDateString()}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                        <span>{data.content.split(/\s+/).filter(w => w.length > 0).length} Words</span>
                    </div>
                    <article className="prose prose-stone prose-lg max-w-none font-serif-pro" dangerouslySetInnerHTML={{ __html: getPreviewHtml() }} />
                </div>
            ) : (
                <div className="space-y-8">
                     <textarea 
                          ref={titleTextareaRef}
                          placeholder="The Headline" 
                          className="w-full text-4xl md:text-5xl font-extrabold text-stone-900 placeholder:text-stone-300 border-none outline-none bg-transparent resize-none overflow-hidden leading-[1.1] tracking-tight"
                          rows={1}
                          value={data.title}
                          onChange={(e) => onChange('title', e.target.value)}
                     />
                     <textarea 
                          placeholder="Start writing your masterpiece..." 
                          className="w-full h-full min-h-[500px] text-lg leading-relaxed text-stone-700 placeholder:text-stone-300 border-none outline-none bg-transparent resize-none font-serif-pro"
                          value={data.content}
                          onChange={(e) => onChange('content', e.target.value)}
                     />
                </div>
            )}
        </div>
    </div>
  );
};

export default Editor;