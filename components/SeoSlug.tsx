import React from 'react';
import { ArticleData } from '../types';
import { slugify } from '../utils/seoUtils';

interface SeoSlugProps {
  data: ArticleData;
  onUpdate: (field: keyof ArticleData, value: any) => void;
}

const SeoSlug: React.FC<SeoSlugProps> = ({ data, onUpdate }) => {
  return (
    <div>
        <label className="block text-[10px] font-semibold text-stone-500 uppercase mb-1">Slug</label>
        <input 
            className="w-full bg-stone-100 border border-stone-200 rounded-lg px-3 py-2 text-xs font-mono text-stone-600 focus:border-orange-500 outline-none" 
            value={data.slug}
            onChange={(e) => onUpdate('slug', slugify(e.target.value))}
        />
    </div>
  );
};

export default SeoSlug;