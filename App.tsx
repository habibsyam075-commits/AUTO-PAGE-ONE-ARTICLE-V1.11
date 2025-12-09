import React, { useState, useEffect, useMemo } from 'react';
import { ArticleData, Language } from './types';
import { analyzeSeo, calculateSeoScore, slugify, base64ToBlobUrl, cleanContent } from './utils/seoUtils';
import { fixSeoIssue } from './services/geminiService';
import AiTools from './components/AiTools';
import Header from './components/Header';
import Editor from './components/Editor';
import SeoPanel from './components/SeoPanel';
import { Sparkles, Activity } from 'lucide-react';

// @ts-ignore
import { parse } from 'marked';

const App: React.FC = () => {
  const [data, setData] = useState<ArticleData>({
    title: '',
    metaTitle: '', 
    slug: '',
    content: '',
    focusKeyword: '',
    metaDescription: '',
    featuredImage: '',
    jsonLd: '',
    tags: []
  });

  const [activeTab, setActiveTab] = useState<'seo' | 'ai'>('seo');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [language, setLanguage] = useState<Language>('id'); 
  const [toast, setToast] = useState<{show: boolean, message: string}>({ show: false, message: '' });
  const [fixingId, setFixingId] = useState<string | null>(null);

  useEffect(() => {
    if (!data.slug && data.title) {
        setData(prev => ({ ...prev, slug: slugify(prev.title) }));
    }
  }, [data.title]);

  const seoChecks = useMemo(() => analyzeSeo(data), [data]);
  const numericScore = useMemo(() => calculateSeoScore(seoChecks), [seoChecks]);

  const handleInputChange = (field: keyof ArticleData, value: any) => {
    // If setting image directly via other means, try to blob it
    if (field === 'featuredImage' && typeof value === 'string') {
        value = base64ToBlobUrl(value);
    }
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleAiContentUpdate = (title: string, content: string, keyword: string) => {
    setData(prev => ({ ...prev, title, content, focusKeyword: keyword }));
    setActiveTab('seo'); 
    setIsPreviewMode(true);
  };
  
  const showToast = (message: string) => {
      setToast({ show: true, message });
      setTimeout(() => setToast({ show: false, message: '' }), 4000);
  };

  const handleFixSeo = async (issueId: string) => {
      setFixingId(issueId);
      try {
          const updates = await fixSeoIssue(issueId, data, language);
          setData(prev => ({ ...prev, ...updates }));
          showToast("AI Fix Applied");
      } catch (error: any) {
          console.error(error);
          showToast(error.message || "Could not apply fix");
      } finally {
          setFixingId(null);
      }
  };

  const handleCopyHtml = () => {
      try {
          const cleanedContent = cleanContent(data.content);
          // Ensure Title is included as H1 in the exported HTML
          const fullMarkdown = data.title ? `# ${data.title}\n\n${cleanedContent}` : cleanedContent;
          const htmlContent = parse(fullMarkdown || '') as string;
          navigator.clipboard.writeText(htmlContent).then(() => {
              showToast("HTML copied to clipboard");
          });
      } catch (e) {
          showToast("Error copying HTML");
      }
  };

  return (
    <div className="flex h-screen w-full font-sans bg-[#e7e5e4] overflow-hidden selection:bg-orange-500 selection:text-white">
      
      {/* --- FLOATING HEADER --- */}
      <Header 
        isPreviewMode={isPreviewMode}
        setIsPreviewMode={setIsPreviewMode}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        onCopyHtml={handleCopyHtml}
      />

      {/* --- MAIN EDITOR CANVAS --- */}
      <div className="flex-1 flex pt-24 pb-8 px-4 md:px-8 overflow-hidden relative">
          
          <main className={`flex-1 overflow-y-auto scroll-smooth no-scrollbar flex justify-center transition-all duration-500 ease-in-out ${isSidebarOpen ? 'mr-0 md:mr-[400px]' : ''}`}>
              <Editor 
                 data={data}
                 onChange={handleInputChange}
                 isPreviewMode={isPreviewMode}
              />
          </main>

          {/* --- SIDEBAR PANEL --- */}
          <aside className={`fixed top-24 right-4 md:right-8 bottom-8 w-full md:w-[400px] bg-white rounded-2xl shadow-2xl shadow-stone-400/20 border border-stone-300 transform transition-transform duration-300 z-50 overflow-hidden flex flex-col ${isSidebarOpen ? 'translate-x-0' : 'translate-x-[110%]'}`}>
              
              {/* Sidebar Header/Tabs */}
              <div className="flex items-center justify-between p-2 m-2 bg-stone-100 rounded-xl border border-stone-200">
                  <button 
                     onClick={() => setActiveTab('seo')}
                     className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all ${activeTab === 'seo' ? 'bg-white text-stone-900 shadow-sm border border-stone-200' : 'text-stone-500 hover:text-stone-700'}`}
                  >
                     <Activity className="w-3.5 h-3.5" /> Analysis
                  </button>
                  <button 
                     onClick={() => setActiveTab('ai')}
                     className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all ${activeTab === 'ai' ? 'bg-white text-stone-900 shadow-sm border border-stone-200' : 'text-stone-500 hover:text-stone-700'}`}
                  >
                     <Sparkles className="w-3.5 h-3.5 text-orange-600" /> Creation
                  </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto p-5 scroll-smooth space-y-8">
                  {activeTab === 'seo' ? (
                      <SeoPanel 
                          data={data}
                          onUpdate={handleInputChange}
                          language={language}
                          score={numericScore}
                          checks={seoChecks}
                          onFixSeo={handleFixSeo}
                          fixingId={fixingId}
                          onShowToast={showToast}
                      />
                  ) : (
                      <AiTools 
                          data={data} 
                          language={language}
                          onLanguageChange={setLanguage}
                          onUpdateContent={handleAiContentUpdate}
                          onUpdateFeaturedImage={(img) => handleInputChange('featuredImage', img)}
                      />
                  )}
              </div>
          </aside>
      </div>

      {toast.show && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-stone-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 animate-fadeUp z-[60]">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-bold tracking-wide">{toast.message}</span>
          </div>
      )}
    </div>
  );
};

export default App;