import { ArticleData, SeoCheckResult, AnalysisStatus } from '../types';

export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-');  // Replace multiple - with single -
};

export const countWords = (text: string): number => {
  if (!text) return 0;
  // Clean markdown for accurate word count
  const plainText = text
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[#*`_~]/g, ' ');
  return plainText.trim().split(/\s+/).length;
};

export const base64ToBlobUrl = (base64: string): string => {
  try {
    // Check if it's already a blob or http url
    if (!base64.startsWith('data:')) return base64;

    const byteString = atob(base64.split(',')[1]);
    const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error("Error converting base64 to blob", e);
    return base64; // Fallback
  }
};

export const cleanContent = (text: string): string => {
  // Matches "Final Human Checklist" (case insensitive) and EVERYTHING after it until the end of the string.
  const killListRegex = /(?:^|\n)(?:#{1,6}\s*)?(?:\*\*|__)?(?:📝|:pencil:)?\s*(?:Final\s*Human\s*Checklist|All instructions followed|Chaos Mode syntax implemented)[\s\S]*$/i;
  
  let cleaned = text.replace(killListRegex, '');
  // Remove any trailing AI meta lines
  cleaned = cleaned.replace(/(?:^|\n)(?:All instructions followed|Chaos Mode syntax implemented)[\s\S]*$/i, '');
  
  // Also hide JSON-LD script tags from visual preview
  cleaned = cleaned.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");
  
  return cleaned.trim();
};

export const calculateSeoScore = (checks: SeoCheckResult[]): number => {
  if (!checks || checks.length === 0) return 0;
  
  // Critical failure: If keyword is missing, score is 0 regardless of other checks
  if (checks.some(c => c.id === 'keyword_missing')) return 0;

  let score = 0;
  const weight = 100 / checks.length;

  checks.forEach(check => {
      if (check.status === AnalysisStatus.GOOD) score += weight;
      if (check.status === AnalysisStatus.OK) score += (weight / 2);
  });

  return Math.round(score);
};

export const analyzeSeo = (data: ArticleData): SeoCheckResult[] => {
  const checks: SeoCheckResult[] = [];
  const keyword = data.focusKeyword.toLowerCase().trim();
  const titleLower = data.title.toLowerCase();
  const slugLower = data.slug.toLowerCase();
  
  // Pre-process content for accurate text analysis
  // 1. Remove images completely to avoid matching alt text/urls as body content
  // 2. Flatten links to anchor text
  // 3. Remove markdown symbols
  const contentLower = data.content.toLowerCase();
  const plainText = contentLower
      .replace(/!\[.*?\]\(.*?\)/g, '')   
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') 
      .replace(/[#*`_~>]/g, ' ')        
      .replace(/\s+/g, ' ')               
      .trim();

  const wordCount = plainText.split(/\s+/).length;

  // --- 1. KEYWORD EXISTENCE ---
  if (!keyword) {
    checks.push({ id: 'keyword_missing', label: 'Focus Keyword', status: AnalysisStatus.BAD, message: 'Please set a focus keyword to start the SEO analysis.', fixable: false });
    return checks; // Stop if no keyword
  }

  // --- 2. CONTENT DEPTH (Page One Standard) ---
  if (wordCount === 0) {
    checks.push({ id: 'length', label: 'Content Depth', status: AnalysisStatus.BAD, message: 'Please add some content.', fixable: false });
  } else if (wordCount < 1000) {
    checks.push({ id: 'length', label: 'Content Depth', status: AnalysisStatus.OK, message: `Text is ${wordCount} words. To rank on Page One, aim for 1,000+ comprehensive words.`, fixable: true });
  } else {
    checks.push({ id: 'length', label: 'Content Depth', status: AnalysisStatus.GOOD, message: 'Excellent! Content depth (1,000+ words) is suitable for competitive ranking.' });
  }

  // Escape keyword for regex usage
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const strictKeywordRegex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');

  // --- 3. KEYWORD IN H1 TITLE ---
  if (titleLower.includes(keyword)) {
    if (titleLower.startsWith(keyword)) {
        checks.push({ id: 'keyword_in_title', label: 'H1 Title Optimization', status: AnalysisStatus.GOOD, message: 'The focus keyphrase appears at the beginning of the H1 Title.' });
    } else {
        checks.push({ id: 'keyword_in_title', label: 'H1 Title Optimization', status: AnalysisStatus.GOOD, message: 'The focus keyphrase appears in the H1 Title.' });
    }
  } else {
    checks.push({ id: 'keyword_in_title', label: 'H1 Title Optimization', status: AnalysisStatus.BAD, message: 'The focus keyphrase does not appear in the H1 Title.', fixable: true });
  }

  // --- 4. CLEAN URL SLUG ---
  const keywordSlug = slugify(keyword);
  if (slugLower === keywordSlug || (slugLower.includes(keywordSlug) && slugLower.length < 50)) {
      checks.push({ id: 'keyword_in_slug', label: 'Clean URL Slug', status: AnalysisStatus.GOOD, message: 'URL is short, clean, and contains the keyword.' });
  } else if (!slugLower.includes(keywordSlug)) {
      checks.push({ id: 'keyword_in_slug', label: 'Clean URL Slug', status: AnalysisStatus.BAD, message: 'URL Slug does not contain the keyword.', fixable: true });
  } else {
      checks.push({ id: 'keyword_in_slug', label: 'Clean URL Slug', status: AnalysisStatus.OK, message: 'URL contains keyword but is too long. Keep it short.', fixable: true });
  }

  // --- 5. KEYWORD IN INTRO (First 100 Words) ---
  const first100Words = plainText.split(' ').slice(0, 100).join(' ');
  
  if (strictKeywordRegex.test(first100Words)) {
    checks.push({ id: 'keyword_in_intro', label: 'Keyphrase in Introduction', status: AnalysisStatus.GOOD, message: 'Your keyphrase appears in the first 100 words.' });
  } else {
    checks.push({ id: 'keyword_in_intro', label: 'Keyphrase in Introduction', status: AnalysisStatus.BAD, message: 'Your keyphrase must appear in the first 100 words.', fixable: true });
  }

  // --- 6. SUBHEADINGS CHECK ---
  const headings: string[] = data.content.match(/^#{2,3}\s.*$/gm) || [];
  if (headings.length === 0) {
       checks.push({ id: 'subheadings', label: 'Heading Hierarchy', status: AnalysisStatus.OK, message: 'You are not using any subheadings (H2, H3).', fixable: true });
  } else {
      const keywordInHeadings = headings.some(h => h.toLowerCase().includes(keyword));
      if (keywordInHeadings) {
          checks.push({ id: 'keyword_in_subheading', label: 'Keyphrase in Subheadings', status: AnalysisStatus.GOOD, message: 'Your keyphrase appears in H2 or H3 subheadings.' });
      } else {
          checks.push({ id: 'keyword_in_subheading', label: 'Keyphrase in Subheadings', status: AnalysisStatus.OK, message: 'Use your keyphrase in at least one subheading for better ranking.', fixable: true });
      }
  }

  // --- 7. INTERNAL LINKING & ANCHOR TEXT ---
  const linkMatches = [...data.content.matchAll(/\[(.*?)\]\(.*?\)/g)];
  if (linkMatches.length === 0) {
      checks.push({ id: 'links', label: 'Internal Linking', status: AnalysisStatus.BAD, message: 'No internal links found. Links are the "Spider Web" of SEO.', fixable: false });
  } else {
      // Check for bad anchor text
      const badAnchors = ['click here', 'read more', 'klik di sini', 'baca selengkapnya'];
      const hasBadAnchor = linkMatches.some(m => badAnchors.includes(m[1].toLowerCase()));
      
      if (hasBadAnchor) {
          checks.push({ id: 'links', label: 'Link Anchor Text', status: AnalysisStatus.OK, message: 'Avoid generic anchors like "Click Here". Use descriptive keywords.', fixable: false });
      } else {
          checks.push({ id: 'links', label: 'Internal Linking', status: AnalysisStatus.GOOD, message: 'Great! You have links with descriptive anchor text.' });
      }
  }

  // --- 8. META DESCRIPTION ---
  const metaLen = data.metaDescription.length;
  if (metaLen === 0) {
    checks.push({ id: 'meta_len', label: 'Meta Description', status: AnalysisStatus.BAD, message: 'No meta description specified.', fixable: true });
  } else if (metaLen < 120 || metaLen > 160) {
    checks.push({ id: 'meta_len', label: 'Meta Description', status: AnalysisStatus.OK, message: 'Meta description length should be between 120-160 characters.', fixable: true });
  } else {
     if (data.metaDescription.toLowerCase().includes(keyword)) {
        checks.push({ id: 'meta_keyword', label: 'Meta Description', status: AnalysisStatus.GOOD, message: 'Meta description is optimized and contains keyphrase.' });
     } else {
        checks.push({ id: 'meta_keyword', label: 'Meta Description', status: AnalysisStatus.OK, message: 'Meta description exists but is missing the keyphrase.', fixable: true });
     }
  }

  // --- 9. SCHEMA MARKUP (AEO) ---
  if (data.jsonLd && data.jsonLd.trim().length > 10) {
    checks.push({ id: 'schema_markup', label: 'AEO Schema Markup', status: AnalysisStatus.GOOD, message: 'Valid JSON-LD Schema generated.' });
  } else {
    checks.push({ id: 'schema_markup', label: 'AEO Schema Markup', status: AnalysisStatus.BAD, message: 'Missing JSON-LD Schema. Use the "Generate JSON-LD" tool.', fixable: true });
  }

  // --- 10. HYPE / SPAM TONE CHECK ---
  // Fix: Clean content first to avoid matching words in URLs/images
  // We use plainText which is already cleaned above
  
  const spamWords = ['crazy', 'insane', 'beast', 'buttery smooth', 'trust us', 'game changer', 'game-changer', 'delve', 'unleash', 'unlock', 'realm'];
  const foundSpam = spamWords.filter(word => plainText.includes(word));
  
  if (foundSpam.length > 0) {
      checks.push({ 
          id: 'tone_check', 
          label: 'Tone & Quality Check', 
          status: AnalysisStatus.OK, 
          message: `Found hype/AI words: "${foundSpam.slice(0,3).join(', ')}". Replace with grounded language.`, 
          fixable: true 
      });
  } else {
       checks.push({ 
          id: 'tone_check', 
          label: 'Tone & Quality Check', 
          status: AnalysisStatus.GOOD, 
          message: `Tone is grounded and professional. No hype words found.`, 
      });
  }

  return checks;
};

export const getOverallScore = (checks: SeoCheckResult[]): AnalysisStatus => {
    if (checks.length === 0) return AnalysisStatus.BAD;
    
    const badCount = checks.filter(c => c.status === AnalysisStatus.BAD).length;
    const okCount = checks.filter(c => c.status === AnalysisStatus.OK).length;
    
    if (badCount > 1) return AnalysisStatus.BAD;
    if (badCount > 0 || okCount > 3) return AnalysisStatus.OK;
    return AnalysisStatus.GOOD;
}