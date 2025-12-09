import React from 'react';
import { SeoCheckResult, AnalysisStatus } from '../types';
import { Check, X, AlertCircle, Wand2, Loader2, Minus, ArrowRight } from 'lucide-react';

interface AnalysisResultProps {
  checks: SeoCheckResult[];
  onFix?: (id: string) => void;
  fixingId?: string | null;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ checks, onFix, fixingId }) => {
  return (
    <div className="space-y-4">
      {checks.map((check) => (
        <div 
          key={check.id} 
          className={`flex gap-4 p-5 rounded-xl border bg-white shadow-sm transition-all group items-start ${
             check.status === AnalysisStatus.BAD ? 'border-rose-100 hover:border-rose-300' :
             check.status === AnalysisStatus.OK ? 'border-amber-100 hover:border-amber-300' :
             'border-stone-200 hover:border-stone-400'
          }`}
        >
          {/* Solid Status Icons for better visibility */}
          <div className="mt-0.5 flex-shrink-0">
            {check.status === AnalysisStatus.GOOD && (
              <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-sm">
                  <Check className="w-4 h-4 stroke-[4]" />
              </div>
            )}
            {check.status === AnalysisStatus.OK && (
               <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-sm">
                  <Minus className="w-4 h-4 stroke-[4]" />
               </div>
            )}
            {check.status === AnalysisStatus.BAD && (
               <div className="w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center text-white shadow-sm">
                  <X className="w-4 h-4 stroke-[4]" />
               </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
                <span className={`text-sm font-bold tracking-tight ${
                    check.status === AnalysisStatus.GOOD ? 'text-stone-900' : 'text-stone-900'
                }`}>
                  {check.label}
                </span>
                
                {/* Fix Button: Always visible, High Contrast */}
                {check.status !== AnalysisStatus.GOOD && check.fixable && onFix && (
                    <button 
                        onClick={() => onFix(check.id)}
                        disabled={!!fixingId}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-orange-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-stone-300 ml-3 shrink-0"
                    >
                        {fixingId === check.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <>
                                AI Fix
                                <Wand2 className="w-3.5 h-3.5" />
                            </>
                        )}
                    </button>
                )}
            </div>
            
            <p className="text-xs text-stone-600 font-medium leading-relaxed">
                {check.message}
            </p>
          </div>
        </div>
      ))}
      
      {checks.length === 0 && (
         <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-stone-300">
             <div className="w-14 h-14 bg-stone-50 rounded-full mx-auto mb-3 flex items-center justify-center text-stone-400 border border-stone-200">
                 <AlertCircle className="w-7 h-7" />
             </div>
             <p className="text-sm font-bold text-stone-500">Add a keyword & content to start analysis</p>
         </div>
      )}
    </div>
  );
};

export default AnalysisResult;