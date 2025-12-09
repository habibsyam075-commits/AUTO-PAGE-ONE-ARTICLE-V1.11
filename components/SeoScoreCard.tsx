import React from 'react';
import { Zap } from 'lucide-react';

interface SeoScoreCardProps {
  score: number;
}

const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-rose-400';
};

const getScoreGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 50) return 'C';
    return 'F';
};

const SeoScoreCard: React.FC<SeoScoreCardProps> = ({ score }) => {
  return (
    <div className="relative overflow-hidden bg-stone-900 text-white p-6 rounded-2xl shadow-lg flex items-center justify-between">
         <div className="absolute top-0 right-0 p-8 opacity-10">
             <Zap className="w-24 h-24" />
         </div>
         <div>
             <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">SEO Score</div>
             <div className={`text-4xl font-black tracking-tighter ${getScoreColor(score)}`}>
                 {score}
                 <span className="text-lg text-stone-500 font-bold ml-1">/100</span>
             </div>
         </div>
         {/* Circular Progress */}
         <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-stone-800" />
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" 
                      className={score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-rose-500'}
                      strokeDasharray={175.9}
                      strokeDashoffset={175.9 - (175.9 * score) / 100}
                      strokeLinecap="round"
                  />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-bold text-sm">
                  {getScoreGrade(score)}
              </div>
         </div>
    </div>
  );
};

export default SeoScoreCard;