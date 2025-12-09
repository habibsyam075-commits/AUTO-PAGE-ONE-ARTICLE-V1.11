import React, { useState, useEffect } from 'react';
import { ArticleData, Language } from '../types';
import { generateFullArticle, generateImage, processInlineImages } from '../services/geminiService';
import { base64ToBlobUrl } from '../utils/seoUtils';
import { Sparkles, Loader2, Check, Users, BookOpen, Scale, Image } from 'lucide-react';

interface AiArticleGeneratorProps {
  data: ArticleData;
  language: Language;
  onUpdateContent: (title: string, content: string, keyword: string) => void;
  onUpdateFeaturedImage: (base64: string) => void;
}

const AiArticleGenerator: React.FC<AiArticleGeneratorProps> = ({ 
  data, 
  language, 
  onUpdateContent, 
  onUpdateFeaturedImage 
}) => {
  const [loading, setLoading] = useState<string | null>(null);

  // Generator State
  const [genTopic, setGenTopic] = useState('');
  const [genKeyword, setGenKeyword] = useState('');
  const [genTone, setGenTone] = useState('Professional');
  
  // Advanced Strategy Inputs
  const [genAudience, setGenAudience] = useState('26-40');
  const [genWordCount, setGenWordCount] = useState('800-1200'); 
  const [includeHowTo, setIncludeHowTo] = useState(false);
  
  // Image Generation Settings (Integrated for workflow, but separated in logic)
  const [autoGenerateFeatured, setAutoGenerateFeatured] = useState(true);
  const [inlineImageCount, setInlineImageCount] = useState<number>(0); // 0, 2, 4, 6

  // Sync inputs with data
  useEffect(() => {
    if (data.focusKeyword) setGenKeyword(data.focusKeyword);
    if (data.title && !genTopic) setGenTopic(data.title);
  }, [data.focusKeyword, data.title]);

  const handleGenerateArticle = async () => {
    if (!genTopic || !genKeyword) {
      alert("Title and Keyword required.");
      return;
    }
    if (data.content.length > 50 && !confirm("Overwrite current content?")) return;

    setLoading('article');
    try {
      // 1. Generate Text
      const articlePromise = generateFullArticle(
        genTopic, 
        genKeyword, 
        genTone, 
        language, 
        inlineImageCount, // Pass number of images
        genAudience,
        genWordCount,
        includeHowTo
      );
      
      // 2. Parallel: Generate Featured Image if requested
      let featuredImagePromise: Promise<string | null> = Promise.resolve(null);
      if (autoGenerateFeatured) {
          featuredImagePromise = generateImage(genTopic, '16:9');
      }

      const [articleResult, featuredImageResult] = await Promise.all([articlePromise, featuredImagePromise]);
      let finalContent = articleResult.content;

      // 3. Process Inline Images if requested
      if (inlineImageCount > 0) {
         setLoading('images'); // Update status to show we are now rendering images
         finalContent = await processInlineImages(finalContent);
      }

      // Update Parent
      const finalTitle = articleResult.title || genTopic;
      onUpdateContent(finalTitle, finalContent, genKeyword);
      
      if (featuredImageResult) {
          const blobUrl = base64ToBlobUrl(featuredImageResult);
          onUpdateFeaturedImage(blobUrl);
      }
    } catch (e) {
      console.error(e);
      alert("Generation failed. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-stone-300 shadow-sm space-y-4">
        <div>
            <label className="block text-[10px] font-semibold text-stone-500 uppercase mb-1">Article Title (H1)</label>
            <input 
                className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none placeholder:text-stone-300" 
                placeholder="Paste your researched title here..."
                value={genTopic}
                onChange={(e) => setGenTopic(e.target.value)}
            />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-[10px] font-semibold text-stone-500 uppercase mb-1">Focus Keyword</label>
                <input 
                    className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-900 focus:border-orange-500 outline-none placeholder:text-stone-300" 
                    placeholder="e.g. AI Trends"
                    value={genKeyword}
                    onChange={(e) => setGenKeyword(e.target.value)}
                />
            </div>
            <div>
                <label className="block text-[10px] font-semibold text-stone-500 uppercase mb-1">Tone</label>
                <select 
                    className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-900 focus:border-orange-500 outline-none"
                    value={genTone}
                    onChange={(e) => setGenTone(e.target.value)}
                >
                    <option>Professional</option>
                    <option>Casual</option>
                    <option>Persuasive</option>
                    <option>Informatif</option>
                    <option>Santai</option>
                </select>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-[10px] font-semibold text-stone-500 uppercase mb-1 flex items-center gap-1">
                    <Users className="w-3 h-3"/> Audience Age
                </label>
                <select 
                    className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-900 focus:border-orange-500 outline-none"
                    value={genAudience}
                    onChange={(e) => setGenAudience(e.target.value)}
                >
                    <option>18-25</option>
                    <option>26-40</option>
                    <option>41-60</option>
                    <option>60+</option>
                </select>
            </div>
            <div>
                <label className="block text-[10px] font-semibold text-stone-500 uppercase mb-1 flex items-center gap-1">
                    <Scale className="w-3 h-3"/> Length
                </label>
                <select 
                    className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-900 focus:border-orange-500 outline-none"
                    value={genWordCount}
                    onChange={(e) => setGenWordCount(e.target.value)}
                >
                    <option value="500-800">Short (600w)</option>
                    <option value="800-1200">Medium (1000w)</option>
                    <option value="1200-2000">Deep (1500w+)</option>
                </select>
            </div>
        </div>

        <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-3">
             <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={includeHowTo} 
                        onChange={(e) => setIncludeHowTo(e.target.checked)}
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-stone-300"
                    />
                    <BookOpen className="w-3.5 h-3.5" />
                    Include "Buying Guide" Section
                </label>
             </div>
             
             <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={autoGenerateFeatured} 
                        onChange={(e) => setAutoGenerateFeatured(e.target.checked)}
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-stone-300"
                    />
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                    Generate Featured Image
                </label>
             </div>

             <div className="pt-2 border-t border-stone-200">
                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-bold text-stone-700">
                        <Image className="w-3.5 h-3.5" />
                        Inline Images
                    </label>
                    <div className="flex bg-white rounded-lg border border-stone-300 p-0.5">
                        {[0, 2, 4, 6].map(num => (
                            <button
                                key={num}
                                onClick={() => setInlineImageCount(num)}
                                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${inlineImageCount === num ? 'bg-orange-500 text-white shadow-sm' : 'text-stone-500 hover:bg-stone-100'}`}
                            >
                                {num === 0 ? 'None' : num}
                            </button>
                        ))}
                    </div>
                </div>
             </div>
        </div>

        <button 
            onClick={handleGenerateArticle}
            disabled={!!loading}
            className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-extrabold tracking-wide shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
        >
            {loading === 'article' ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Writing Article...
                </>
            ) : loading === 'images' ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Visuals...
                </>
            ) : (
                <>
                    <Sparkles className="w-4 h-4" />
                    GENERATE FULL ARTICLE
                </>
            )}
        </button>
    </div>
  );
};

export default AiArticleGenerator;