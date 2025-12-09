import React from 'react';
import { Copy, Edit3, Eye, LayoutTemplate, X } from 'lucide-react';

interface HeaderProps {
  isPreviewMode: boolean;
  setIsPreviewMode: (v: boolean) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (v: boolean) => void;
  onCopyHtml: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  isPreviewMode, 
  setIsPreviewMode, 
  isSidebarOpen, 
  setIsSidebarOpen, 
  onCopyHtml 
}) => {
  return (
    <header className="fixed top-4 left-4 right-4 md:left-8 md:right-8 h-16 bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-stone-300 z-40 flex items-center justify-between px-4 md:px-6 transition-all">
       {/* Logo */}
       <div className="flex items-center gap-3">
           <div className="w-9 h-9 bg-stone-900 rounded-lg flex items-center justify-center text-white shadow-lg shadow-stone-400/50 transform rotate-2 shrink-0">
              <span className="font-sans font-black text-xl italic text-orange-500 tracking-tighter">A1</span>
           </div>
           <div className="hidden md:flex flex-col">
              <span className="font-black text-stone-900 leading-none text-base tracking-tight uppercase">AUTO PAGE ONE</span>
              <span className="text-[9px] font-bold text-stone-500 tracking-[0.2em] uppercase">The First Page Engine</span>
           </div>
       </div>

       {/* Central Toggle Pill */}
       <div className="flex bg-stone-100 p-1 rounded-xl absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-stone-200">
            <button 
                onClick={() => setIsPreviewMode(false)}
                className={`flex items-center gap-2 px-3 md:px-6 py-1.5 md:py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${!isPreviewMode ? 'bg-white text-stone-900 shadow-sm border border-stone-200' : 'text-stone-500 hover:text-stone-700'}`}
            >
                <Edit3 className="w-3.5 h-3.5" /> <span className="hidden md:inline">Write</span>
            </button>
            <button 
                onClick={() => setIsPreviewMode(true)}
                className={`flex items-center gap-2 px-3 md:px-6 py-1.5 md:py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${isPreviewMode ? 'bg-white text-stone-900 shadow-sm border border-stone-200' : 'text-stone-500 hover:text-stone-700'}`}
            >
                <Eye className="w-3.5 h-3.5" /> <span className="hidden md:inline">Preview</span>
            </button>
       </div>

       {/* Right Actions */}
       <div className="flex items-center gap-2 md:gap-3">
           <button 
               onClick={onCopyHtml} 
               className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-all active:scale-95 border border-stone-200"
           >
               <Copy className="w-3.5 h-3.5" />
               Copy HTML
           </button>
           <button 
               onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
               className={`p-2.5 rounded-xl transition-all border ${isSidebarOpen ? 'bg-stone-900 text-white border-stone-900 shadow-lg' : 'bg-white border-stone-300 text-stone-500 hover:bg-stone-50'}`}
           >
               {isSidebarOpen ? <X className="w-5 h-5" /> : <LayoutTemplate className="w-5 h-5" />}
           </button>
       </div>
    </header>
  );
};

export default Header;