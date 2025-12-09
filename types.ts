

export interface ArticleData {
  title: string; // H1
  metaTitle: string; // SERP Title (<title>)
  slug: string;
  content: string;
  focusKeyword: string;
  metaDescription: string;
  featuredImage?: string; // Base64 data URL
  jsonLd?: string; // Stored separate Schema markup
  tags?: string[]; // High SEO Tags
}

export type Language = 'id' | 'en';

export enum AnalysisStatus {
  GOOD = 'good',
  OK = 'ok',
  BAD = 'bad',
}

export interface SeoCheckResult {
  id: string;
  label: string;
  status: AnalysisStatus;
  message: string;
  fixable?: boolean;
}

export interface SeoScore {
  score: number; // 0 to 100
  checks: SeoCheckResult[];
}

export interface AISuggestion {
  type: 'meta' | 'title' | 'content';
  text: string;
}

export interface AiDetectionResult {
  score: number; // 0 to 100 (where 100 is highly likely AI)
  isHuman: boolean;
  reasoning: string;
}

export interface GeminiConfig {
  apiKey?: string;
}