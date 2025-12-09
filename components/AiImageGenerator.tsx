import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Loader2, Sparkles, Download, CheckCircle, Grid, Type, Copy, RefreshCw, Layers, Code } from 'lucide-react';
import { generateImage, generateAltText } from '../services/geminiService';
import { base64ToBlobUrl } from '../utils/seoUtils';

interface AiImageGeneratorProps {
  currentTitle: string;
  onUpdateFeaturedImage: (base64: string) => void;
}

interface GeneratedImage {
  id: string;
  url: string;
  alt: string;
}

const AiImageGenerator: React.FC<AiImageGeneratorProps> = ({ currentTitle, onUpdateFeaturedImage }) => {
  const [activeTab, setActiveTab] = useState<'cover' | 'assets'>('cover');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [imageCount, setImageCount] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  // Auto-fill prompt only when switching to cover mode if empty
  useEffect(() => {
    if (activeTab === 'cover' && currentTitle) {
        setPrompt(`Photorealistic photography of ${currentTitle}, cinematic lighting, 8k resolution`);
        setAspectRatio('16:9');
        setImageCount(1);
    } else if (activeTab === 'assets') {
        setPrompt('');
        setImageCount(2); // Default for batch
    }
  }, [activeTab, currentTitle]);

  const handleGenerate = async () => {
      if (!prompt) return;
      setLoading(true);
      setGeneratedImages([]); // Clear previous
      
      try {
          // Create array of promises based on count
          const promises = Array.from({ length: imageCount }).map(async (_, idx) => {
              const base64 = await generateImage(prompt, aspectRatio);
              const alt = await generateAltText(prompt); // Generate unique Alt text logic
              if (base64) {
                  return {
                      id: `img-${Date.now()}-${idx}`,
                      url: base64ToBlobUrl(base64),
                      alt: alt
                  };
              }
              return null;
          });

          const results = await Promise.all(promises);
          const validResults = results.filter((img): img is GeneratedImage => img !== null);
          setGeneratedImages(validResults);
          
          // If in cover mode, auto-set the first result as featured if successful
          if (activeTab === 'cover' && validResults.length > 0) {
              onUpdateFeaturedImage(validResults[0].url);
          }

      } catch (e) {
          console.error(e);
          alert("Failed to generate one or more images.");
      } finally {
          setLoading(false);
      }
  };

  const handleSetFeatured = (url: string) => {
      onUpdateFeaturedImage(url);
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-stone-300 shadow-sm space-y-4">
         
         {/* Tab Switcher */}
         <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 mb-2">
             <button 
                onClick={() => setActiveTab('cover')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'cover' ? 'bg-white text-orange-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
             >
                <RefreshCw className="w-3.5 h-3.5" /> Regenerate Cover
             </button>
             <button 
                onClick={() => setActiveTab('assets')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'assets' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
             >
                <Layers className="w-3.5 h-3.5" /> Content Assets
             </button>
         </div>

         {/* Contextual Header */}
         <div className="flex justify-between items-center px-1">
             <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                 {activeTab === 'cover' ? 'Target: Featured Image (16:9)' : 'Target: Batch Assets'}
             </span>
             
             {activeTab === 'assets' && (
                 <div className="flex items-center gap-2">
                     <div className="flex bg-stone-100 p-0.5 rounded border border-stone-200">
                         <button onClick={() => setAspectRatio('16:9')} className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${aspectRatio === '16:9' ? 'bg-white shadow text-stone-900' : 'text-stone-400'}`}>16:9</button>
                         <button onClick={() => setAspectRatio('1:1')} className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${aspectRatio === '1:1' ? 'bg-white shadow text-stone-900' : 'text-stone-400'}`}>1:1</button>
                     </div>
                     <select 
                        value={imageCount}
                        onChange={(e) => setImageCount(Number(e.target.value))}
                        className="bg-stone-100 border border-stone-200 text-[9px] font-bold rounded px-1 py-0.5 outline-none"
                     >
                         <option value={1}>1x</option>
                         <option value={2}>2x</option>
                         <option value={4}>4x</option>
                     </select>
                 </div>
             )}
         </div>

         <div className="space-y-3">
             <textarea 
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5 text-xs font-medium text-stone-700 focus:border-orange-500 outline-none resize-none"
                placeholder={activeTab === 'cover' ? "Edit prompt for cover image..." : "Describe the images you need..."}
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
             />

             <button 
                onClick={handleGenerate}
                disabled={loading || !prompt}
                className={`w-full py-2.5 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'cover' ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-stone-900 hover:bg-black text-white'}`}
            >
                {loading ? (
                    <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin"/>
                        {activeTab === 'cover' ? 'Creating Cover...' : `Generating ${imageCount} Images...`}
                    </>
                ) : (
                    <>
                        <Sparkles className="w-3.5 h-3.5"/>
                        {activeTab === 'cover' ? 'Generate New Cover' : 'Generate Assets'}
                    </>
                )}
            </button>
         </div>

        {/* Results Grid */}
        {generatedImages.length > 0 && (
            <div className={`mt-4 grid gap-4 animate-fadeUp ${generatedImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {generatedImages.map((img) => (
                    <div key={img.id} className="space-y-2">
                        <div className="rounded-lg overflow-hidden border border-stone-200 shadow-sm group relative">
                            <img src={img.url} alt={img.alt} className="w-full h-auto object-cover" />
                        </div>
                        
                        {/* Generated Alt Text Field */}
                        <div className="bg-stone-50 rounded-md border border-stone-200 px-2 py-2 flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                                <Type className="w-3 h-3 text-stone-400 shrink-0" />
                                <span className="text-[9px] font-bold text-stone-500 uppercase">Alt Text</span>
                            </div>
                            <div className="flex items-start gap-1">
                                <p className="text-[10px] text-stone-700 font-medium leading-tight flex-1 italic">{img.alt}</p>
                                <button 
                                    onClick={() => navigator.clipboard.writeText(img.alt)}
                                    className="text-stone-400 hover:text-stone-600"
                                >
                                    <Copy className="w-3 h-3"/>
                                </button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-1.5">
                            {activeTab === 'assets' && (
                                <button 
                                    onClick={() => handleSetFeatured(img.url)}
                                    className="flex-1 py-1.5 bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 rounded-md text-[9px] font-bold flex items-center justify-center gap-1"
                                    title="Set as Featured Image"
                                >
                                    <CheckCircle className="w-3 h-3 text-orange-500"/> Cover
                                </button>
                            )}
                            <button 
                                onClick={() => navigator.clipboard.writeText(`![${img.alt}](${img.url})`)}
                                className="flex-1 py-1.5 bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200 rounded-md text-[9px] font-bold flex items-center justify-center gap-1"
                                title="Copy Markdown for Content"
                            >
                                <Code className="w-3 h-3"/> Markdown
                            </button>
                            <a 
                                href={img.url} 
                                download={`img-${img.id}.png`}
                                className="flex-1 py-1.5 bg-stone-800 text-white border border-stone-900 hover:bg-black rounded-md text-[9px] font-bold flex items-center justify-center gap-1"
                            >
                                <Download className="w-3 h-3"/> Save
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

export default AiImageGenerator;