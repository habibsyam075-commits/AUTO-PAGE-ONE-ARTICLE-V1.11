import { GoogleGenAI, Type } from "@google/genai";
import { ArticleData, AiDetectionResult, Language } from "../types";
import { slugify, base64ToBlobUrl } from "../utils/seoUtils";

const MODEL_NAME = 'gemini-2.5-flash';
const IMAGE_MODEL_NAME = 'gemini-2.5-flash-image';

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const getLangInstruction = (lang: Language) => {
  return lang === 'id' 
    ? "IMPORTANT: Output strictly in Indonesian (Bahasa Indonesia). Use informal, natural, and engaging language (Bahasa gaul/santai permissible for flow). Avoid baku/robotic phrasing."
    : "IMPORTANT: Output strictly in International English. Use contractions and colloquialisms.";
};

// SYNCED EXACTLY WITH SEOUTILS.TS TO PASS TONE CHECK
// EXPANDED TO CATCH SUBTLE AI TELLS
const BANNED_WORDS = [
    "crazy", "insane", "beast", "buttery smooth", "trust us", "trust me",
    "game changer", "game-changer", "delve", "unleash", "unlock", "realm", 
    "tapestry", "landscape", "testament", "dive in", "in conclusion",
    "bustling", "vibrant", "elevate", "revolutionize", "cutting-edge", "imagine",
    "picture this", "let's face it", "bottom line", "overall,", "moreover", "furthermore",
    "it is important to note", "crucial", "essential", "dynamic", "evolving",
    "digital world", "today's world", "rapidly", "seamlessly", "harness", "foster",
    "keen", "myriad", "plethora", "pivotal", "paramount", "navigating", "embarked",
    "beacon", "symphony", "nuance", "underscores", "multifaceted", "intersection",
    "groundbreaking", "unparalleled", "unprecedented", "epitome", "enrich", "transformative"
];

// --- SHARED HUMANIZER STYLE GUIDE (ZERO DETECT) ---
const HUMAN_STYLE_GUIDE = `
CRITICAL HUMANIZATION RULES (GOAL: 0% AI DETECTION SCORE):
1. **EXTREME BURSTINESS**: Write a 40-word complex sentence followed immediately by a 3-word fragment. This variation breaks AI detection.
2. **USE FRAGMENTS**: Use incomplete sentences for effect. Like this. Seriously.
3. **CONVERSATIONAL IMPERFECTION**: Start sentences with "And", "But", "So", "Look,".
4. **CONTRACTIONS ONLY**: NEVER say "It is" or "We are". Say "It's", "We're".
5. **REMOVE ACADEMIC FLUFF**: Delete "In this article", "Let's explore", "It is worth noting". Just say the fact.
6. **OPINIONATED TONE**: Don't be neutral. Be helpful and direct. Use "I" or "We" to express opinion.
7. **BANNED WORDS**: ${BANNED_WORDS.join(", ")}. IF YOU USE THESE, YOU FAIL.
8. **PRESERVE MARKDOWN**: Keep all #, ##, -, and **bolding**.
9. **PRESERVE IMAGES**: Keep "![...](__IMG_MARKER_x__)" tags exact.
10. **PRESERVE SEO HEADERS**: If a Header (##) contains the Keyword, DO NOT REWRITE IT.
11. **MANDATORY CONTENT**: NEVER leave a Header empty. Always write at least 2 paragraphs under every ## Heading.
`;

// --- HELPERS FOR TOKEN OPTIMIZATION ---
const stripImages = (content: string): { cleaned: string, map: Map<string, string> } => {
  const map = new Map<string, string>();
  let counter = 0;
  // Replace base64 AND blob images with small markers
  const cleaned = content.replace(/!\[(.*?)\]\((data:image\/[^)]+|blob:[^)]+)\)/g, (match, alt, url) => {
    const placeholder = `__IMG_MARKER_${counter}__`;
    map.set(placeholder, url);
    counter++;
    return `![${alt}](${placeholder})`;
  });
  return { cleaned, map };
};

const restoreImages = (content: string, map: Map<string, string>): string => {
  if (!content) return "";
  let restored = content;
  for (const [placeholder, dataUrl] of map.entries()) {
    restored = restored.split(placeholder).join(dataUrl);
  }
  return restored;
};

// --- CLEANING UTILS ---
const cleanAiArtifacts = (text: string): string => {
    let cleaned = text;

    // 1. Remove standard AI meta-commentary
    const metaTalkRegex = /^(?:Okay|Sure|Here is|Here's|Certainly|I have|As an AI|Note:|Please note|The rewritten|Below is|Here is the|I have rewritten|Understood|Next|In this article|Title:|Markdown:|Status:).*?(?:\n|$)/gim;
    cleaned = cleaned.replace(metaTalkRegex, '');

    // 2. Remove Markdown separators (horizontal rules) STRICTLY
    cleaned = cleaned.replace(/^[-*_]{3,}\s*$/gm, ''); // Remove --- on a line
    cleaned = cleaned.replace(/^-{2,}\s*$/gm, ''); // Remove -- on a line
    cleaned = cleaned.replace(/\n-{2,}\n/g, '\n'); 
    
    // 3. Remove "AI-style" double dashes in text (often used instead of em-dash)
    cleaned = cleaned.replace(/ -- /g, ' — '); 

    // 4. AGGRESSIVE REMOVAL OF CHECKLIST & REPORTS
    const killListRegex = /(?:^|\n)(?:#{1,6}\s*)?(?:\*\*|__)?(?:📝|:pencil:)?\s*(?:Final\s*Human\s*Checklist|All instructions followed|Chaos Mode syntax implemented|Word count check)[\s\S]*$/i;
    cleaned = cleaned.replace(killListRegex, '');

    // 5. Cleanup stray lines and multiple newlines
    cleaned = cleaned.replace(/Checklist preserved\.?/gi, '');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Max 2 newlines
    
    // 6. FINAL SANITY CHECK FOR BANNED WORDS (CASE INSENSITIVE)
    // We try to replace the most egregious ones if they slipped through
    const commonHype = ['crazy', 'insane', 'unleash', 'unlock', 'delve', 'realm', 'game changer', 'landscape', 'tapestry'];
    commonHype.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        // Replace with simpler words based on context, or just 'this'/'the'
        cleaned = cleaned.replace(regex, 'the'); 
    });

    return cleaned.trim();
};

// --- CORE GENERATION LOGIC ---

export const generateFullArticle = async (
  topic: string, 
  keyword: string, 
  tone: string, 
  lang: Language,
  imageCount: number, // Changed from boolean to number
  audience: string = '26-40',
  wordCount: string = '800-1200',
  includeHowTo: boolean = false
): Promise<{ title: string, content: string }> => {
  try {
    const ai = getClient();
    
    // Parse word count range for validation
    const minWords = parseInt(wordCount.split('-')[0]);
    const maxWords = parseInt(wordCount.split('-')[1]) || 2500;

    let structureInstruction = "";
    
    // CALCULATE SECTION LIMITS TO MATHEMATICALLY GUARANTEE TOTAL
    // FORCE KEYWORD INTO H2s FOR SEO SCORE
    
    if (wordCount === '500-800') {
        // Target: ~600 words
        structureInstruction = `
        STRICT STRUCTURE (Short - Goal 600 Words):
        1. Intro (Max 50 words) - Must include "${keyword}".
        2. H2: What is ${keyword}? -> Write a detailed definition (Max 120 words).
        3. H2: Benefits of ${keyword} -> Write 3-4 key benefits (Max 120 words).
        4. H2: Key Features of ${keyword} -> Explain the main features (Max 120 words).
        5. Conclusion (Max 50 words).
        6. FAQ (Strictly 3 Questions, ~30 words each).
        
        RULE: You must write full paragraphs for every section above.
        `;
    } else if (wordCount === '1200-2000') {
        // Target: ~1400 words
        structureInstruction = `
        STRICT STRUCTURE (Long - Goal 1400 Words):
        1. Intro (Max 80 words) - Must include "${keyword}".
        2. H2: The Story Behind ${keyword} -> Write the background (Max 130 words).
        3. H2: Technical Details of ${keyword} -> Explain how it works (Max 130 words).
        4. H2: Pros & Cons -> Detailed list (Max 130 words).
        5. H2: Expert Opinions on ${keyword} -> what do pros say? (Max 130 words).
        6. H2: Real-World Examples -> Give case studies (Max 130 words).
        7. H2: How to Implement ${keyword} -> Step by step (Max 130 words).
        8. H2: Future Trends for ${keyword} -> What is next? (Max 130 words).
        9. H2: Buying Guide for ${keyword} -> What to look for (Max 150 words).
        10. H2: Comparison Table (Markdown Table, 5 rows).
        11. Conclusion (Max 60 words).
        12. FAQ (Strictly 6 Questions, ~30 words each).
        
        RULE: You must write full paragraphs for every section above.
        `;
    } else {
        // Medium: 800-1200
        // Target: ~950 words
        structureInstruction = `
        STRICT STRUCTURE (Medium - Goal 950 Words):
        1. Intro (Max 70 words) - Must include "${keyword}".
        2. H2: Understanding ${keyword} -> Detailed explanation (Max 110 words).
        3. H2: Why ${keyword} Matters -> Why is it important? (Max 110 words).
        4. H2: Top Strategies for ${keyword} -> List actionable strategies (Max 110 words).
        5. H2: Common Mistakes with ${keyword} -> What to avoid (Max 110 words).
        6. H2: Advanced Tips for ${keyword} -> Pro tips (Max 110 words).
        7. H2: Buying Guide: Choosing the Best ${keyword} -> Selection criteria (Max 140 words).
        8. Conclusion (Max 60 words).
        9. FAQ (Strictly 5 Questions, ~30 words each).
        
        RULE: You must write full paragraphs for every section above.
        `;
    }
    
    // STEP 1: DRAFT GENERATION
    const draftPrompt = `
      ROLE: Senior SEO Writer with Real-Time Web Access.
      TASK: Write a comprehensive, up-to-date article based on the structure below.
      
      CRITICAL RULE: YOU MUST WRITE CONTENT FOR EVERY SINGLE SECTION. DO NOT LEAVE ANY HEADING EMPTY.
      
      TOPIC: "${topic}"
      KEYWORD: "${keyword}"
      TONE: ${tone} (Grounded, Professional)
      LANGUAGE: ${lang === 'id' ? 'Indonesian' : 'English'}
      
      STRICT STRUCTURE TO FOLLOW:
      ${structureInstruction}

      RESEARCH INSTRUCTIONS (USE GOOGLE SEARCH):
      1. SEARCH for the latest statistics, trends, and news (2024-2025) related to the topic.
      2. INTEGRATE real-world data and recent examples into the content.
      3. ENSURE any "Future Trends" or "News" sections are based on actual recent events.

      RULES:
      1. STOP WORDS (BAN): ${BANNED_WORDS.slice(0, 15).join(", ")}.
      2. ${includeHowTo ? 'MUST include a "Buying Guide" section.' : ''}
      3. ${imageCount > 0 ? `Insert exactly ${imageCount} unique [[IMAGE_PROMPT: visual description in English]] tags distributed evenly throughout the article.` : 'DO NOT insert any image prompts.'}
      4. NO "---" or "--".
      5. CRITICAL: The exact keyword "${keyword}" MUST appear in at least 3 Subheadings (H2).
      6. CRITICAL: DO NOT output an outline. Output the FULL ARTICLE text.

      OUTPUT: Markdown.
    `;

    let draftText = "";
    
    try {
        // ATTEMPT 1: Try to use Google Search Grounding
        const draftResponse = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: draftPrompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        draftText = draftResponse.text || "";
    } catch (err) {
        console.warn("Google Search generation failed, falling back to standard generation.", err);
        // FALLBACK: If Search fails (e.g. quota or timeout), generate without tools
        // We modify the prompt slightly to remove strict search commands to avoid confusion, though model handles it well.
        const fallbackResponse = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: draftPrompt.replace("RESEARCH INSTRUCTIONS (USE GOOGLE SEARCH):", "RESEARCH INSTRUCTIONS:"),
        });
        draftText = fallbackResponse.text || "";
    }

    // STEP 2: HUMANIZER ENGINE (ZERO DETECT)
    const humanizePrompt = `
      ROLE: Opinionated Blogger / Expert (Human).
      TASK: Rewrite this draft to completely bypass AI detection (Score must be 0%).
      
      CONTEXT: We are fixing an SEO article.
      KEYWORD: "${keyword}" (DO NOT REMOVE THIS FROM HEADERS).
      
      STRATEGY (IMPERFECTION IS KEY):
      - Start sentences unexpectedly (e.g., "And here's the thing...").
      - Use rhetorical questions to engage the reader.
      - Use short, punchy sentences. "Really." "Trust me." (But don't use "Trust me" as a phrase, just the vibe).
      - Be slightly imperfect. Academic writing is too perfect.
      - Inject personal opinion ("I found that...", "We believe...").
      - PRESERVE FACTS: Keep the statistics/facts found in the draft, but rewrite the surrounding text.
      
      CRITICAL:
      - DO NOT SHORTEN the content significantly. We need depth.
      - DO NOT USE HYPE WORDS: "Crazy", "Insane", "Unleash", "Unlock", "Delve", "Landscape".
      - IF A HEADER (##) CONTAINS "${keyword}", KEEP IT EXACTLY AS IS.
      - ENSURE EVERY HEADER HAS CONTENT AFTER IT. DO NOT LEAVE EMPTY HEADERS.
      - PRESERVE [[IMAGE_PROMPT: ...]] TAGS.
      
      ${HUMAN_STYLE_GUIDE}
      
      WORD COUNT GOAL: Keep it between ${minWords} and ${maxWords} words.
      
      DRAFT TO REWRITE:
      ${draftText}
    `;

    const humanizeResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: humanizePrompt,
    });
    
    let finalContent = cleanAiArtifacts(humanizeResponse.text || draftText);
    
    // Extract title
    const titleMatch = finalContent.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].replace(/\*\*/g, '').trim() : topic;
    finalContent = finalContent.replace(/^#\s+.+$/m, '').trim();

    return { title, content: finalContent };

  } catch (error) {
    console.error("Article Generation Error:", error);
    throw error;
  }
};

// Helper to generate a clean English prompt for images
const generateImagePrompt = async (subject: string): Promise<string> => {
    try {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `
            ROLE: Image Prompt Specialist.
            TASK: Create a stable diffusion style prompt for: "${subject}".
            RULES:
            1. English ONLY.
            2. No text/words in the image.
            3. Professional, clean, high-quality.
            4. Max 20 words.
            5. If topic is sensitive/medical, use abstract concepts (e.g. "blue DNA strand" instead of "surgery").
            OUTPUT: Just the prompt text.
            `
        });
        let text = response.text?.trim() || subject;
        // Clean potential quotes or markdown
        text = text.replace(/^["']|["']$/g, '').replace(/\*/g, '');
        return text;
    } catch (e) {
        return subject;
    }
}

// Helper to generate SEO Alt Text
export const generateAltText = async (subject: string, lang: Language = 'en'): Promise<string> => {
    try {
        const ai = getClient();
        const instruction = lang === 'id' ? 'Bahasa Indonesia' : 'English';
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `
            TASK: Write a short, descriptive SEO Alt Text for an image about: "${subject}".
            LANGUAGE: ${instruction}.
            RULES: Max 8 words. No "Image of" or "Picture of". Direct description only.
            `
        });
        return response.text?.trim().replace(/["']/g, '') || subject;
    } catch (e) {
        return subject;
    }
}

export const generateImage = async (subject: string, aspectRatio: string = '16:9'): Promise<string | null> => {
  try {
    const ai = getClient();
    const cleanSubject = await generateImagePrompt(subject);
    
    try {
        const response = await ai.models.generateContent({
          model: IMAGE_MODEL_NAME,
          contents: {
            parts: [{ text: `${cleanSubject}, 4k resolution, cinematic lighting, professional photography.` }]
          },
          config: { imageConfig: { aspectRatio } }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
    } catch (err) {
        console.warn("Primary image generation failed. Retrying with fallback.", err);
        // Fallback: Very safe abstract prompt based on keyword if possible, or just generic
        const fallbackResponse = await ai.models.generateContent({
          model: IMAGE_MODEL_NAME,
          contents: {
            parts: [{ text: "Minimalist abstract business background, blue and orange themes, 4k, professional." }]
          },
          config: { imageConfig: { aspectRatio } }
        });
        
        for (const part of fallbackResponse.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
             return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
    }
    return null;
  } catch (error) {
    console.error("Image Gen Error:", error);
    return null;
  }
};

export const processInlineImages = async (content: string): Promise<string> => {
    let finalContent = content;
    const regex = /\[\[IMAGE_PROMPT: (.*?)\]\]/g;
    const matches = [...finalContent.matchAll(regex)];
    
    if (matches.length > 0) {
        // Use a concurrency limit or just map all? Map all usually fine for < 10 items
        const imageReplacements = await Promise.all(matches.map(async (match) => {
            try {
                const prompt = match[1];
                // Run generateImage and generateAltText in parallel
                const [imgData, altText] = await Promise.all([
                    generateImage(prompt, '16:9'),
                    generateAltText(prompt)
                ]);

                if (imgData) {
                    const blobUrl = base64ToBlobUrl(imgData);
                    return { original: match[0], replace: `\n\n![${altText}](${blobUrl})\n\n` };
                }
            } catch (e) {
                console.warn("Inline image gen failed", e);
            }
            return { original: match[0], replace: '' };
        }));
        
        imageReplacements.forEach(rep => {
            finalContent = finalContent.replace(rep.original, rep.replace);
        });
    }
    
    return finalContent;
};

export const fixSeoIssue = async (issueId: string, data: ArticleData, lang: Language): Promise<Partial<ArticleData>> => {
  const ai = getClient();
  const instruction = getLangInstruction(lang);
  let prompt = "";
  let useSearch = false; // Flag to enable search grounding
  
  if (issueId === 'meta_len' || issueId === 'meta_keyword') {
       prompt = `${instruction} Rewrite Meta Description for "${data.title}". Keyword: "${data.focusKeyword}". Max 150 chars. Natural voice.`;
       const response = await ai.models.generateContent({ model: MODEL_NAME, contents: prompt });
       return { metaDescription: response.text?.replace(/["\n]/g, '').trim() || "" };
  }

  if (issueId === 'keyword_in_title') {
      const prompt = `${instruction} Rewrite title "${data.title}" to include keyword "${data.focusKeyword}". Keep it punchy.`;
      const response = await ai.models.generateContent({ model: MODEL_NAME, contents: prompt });
      return { title: response.text?.replace(/["\n]/g, '').trim() || data.title };
  }

  if (issueId === 'keyword_in_slug') {
      return { slug: slugify(data.focusKeyword + "-" + (data.slug.split('-').pop() || 'guide')) };
  }

  if (issueId === 'schema_markup') {
       const json = await generateJsonLd(data, lang);
       return { jsonLd: json };
  }

  // Content Fixes
  const { cleaned, map } = stripImages(data.content);
  
  if (issueId === 'tone_check') {
       prompt = `
       ${instruction}
       Fix Tone. REMOVE HYPE WORDS: ${BANNED_WORDS.join(", ")}.
       Make it sound like a real human expert (Use "I" or "We").
       Text: ${cleaned}
       `;
  } else if (issueId === 'length') {
      prompt = `${instruction} Expand content by 250 words. USE GOOGLE SEARCH to find the LATEST statistics/examples to add value. No fluff. Text: ${cleaned}`;
      useSearch = true;
  } else if (issueId === 'keyword_missing' || issueId === 'keyword_in_intro') {
      prompt = `${instruction} Insert keyword "${data.focusKeyword}" into the first paragraph naturally. Text: ${cleaned}`;
  } else if (issueId === 'subheadings' || issueId === 'keyword_in_subheading') {
      // FORCE H2 UPDATE - STRICT
      prompt = `
      ${instruction} 
      TASK: Rewrite the Subheadings (H2) to explicitly include the keyword "${data.focusKeyword}".
      RULE: You MUST insert the exact keyword string "${data.focusKeyword}" into at least 2 H2 headers.
      Do not change the body text significantly, just headers.
      Text: ${cleaned}`;
  } else {
      prompt = `${instruction} Fix SEO issue "${issueId}". Text: ${cleaned}`;
  }

  // Try with search if requested, fallback to standard if fails
  try {
      if (useSearch) {
          const response = await ai.models.generateContent({
             model: MODEL_NAME,
             contents: prompt,
             config: { tools: [{ googleSearch: {} }] }
          });
          let fixedContent = cleanAiArtifacts(response.text || "");
          fixedContent = restoreImages(fixedContent, map);
          return { content: fixedContent };
      }
  } catch (err) {
      console.warn("Search fix failed, retrying without search", err);
  }
  
  // Fallback or Standard
  const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt
  });
  let fixedContent = cleanAiArtifacts(response.text || "");
  fixedContent = restoreImages(fixedContent, map);
  return { content: fixedContent };
};

export const detectAiPatterns = async (content: string, lang: Language): Promise<AiDetectionResult> => {
    const ai = getClient();
    // Adjusted detector to be more sensitive to human-like imperfections
    const prompt = `
    Analyze this text for AI generation patterns.
    Look for "Perfect Symmetry" and "Lack of Personality".
    
    If the text uses:
    - Sentence fragments ("Really.") -> Human.
    - Contractions ("It's") -> Human.
    - "I" or "We" -> Human.
    - "Delve", "Landscape", "Realm" -> AI.
    - Balanced, equal-length paragraphs -> AI.
    
    Content: ${content.substring(0, 2000)}...
    
    Determine score (0=Human, 100=AI), isHuman boolean, and reasoning.
    `;
    
    try {
        const response = await ai.models.generateContent({ 
            model: MODEL_NAME, 
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER, description: "0 (Human) to 100 (AI)" },
                        isHuman: { type: Type.BOOLEAN },
                        reasoning: { type: Type.STRING }
                    },
                    required: ["score", "isHuman", "reasoning"]
                }
            }
        });
        const text = response.text || "{}";
        const json = JSON.parse(text);
        return { score: json.score || 0, isHuman: json.isHuman ?? (json.score < 20), reasoning: json.reasoning || "Analyzed" };
    } catch (e) {
        return { score: 0, isHuman: true, reasoning: "Analysis Error" };
    }
};

export const humanizeContent = async (content: string, keyword: string, lang: Language): Promise<string> => {
    const ai = getClient();
    const { cleaned, map } = stripImages(content);
    
    const prompt = `
    ${getLangInstruction(lang)}
    ROLE: Expert Ghostwriter.
    TASK: Rewrite to be undetectable by AI scanners (Goal: 0% AI Score).
    
    TECHNIQUES (BURSTINESS):
    - Mix 1-line paragraphs with longer ones.
    - Use fragments. ("Why? Because it works.")
    - Use idioms.
    - Be specific, not vague.
    - START sentences with conjunctions (And, But, So).
    
    CRITICAL PRESERVATION:
    - If a header (H2/H3) contains "${keyword}", DO NOT CHANGE IT.
    
    STRICTLY AVOID:
    - ${BANNED_WORDS.join(", ")}
    - "In conclusion", "Moreover", "Furthermore".

    Input: ${cleaned}
    `;
    
    const response = await ai.models.generateContent({ model: MODEL_NAME, contents: prompt });
    const humanized = cleanAiArtifacts(response.text || "");
    return restoreImages(humanized, map);
};

export const generateMetaDescription = async (data: ArticleData, lang: Language): Promise<string> => {
    const ai = getClient();
    const prompt = `${getLangInstruction(lang)} Act as an SEO Expert. Write exactly one click-worthy Meta Description (max 155 chars) for the article title "${data.title}" targeting keyword "${data.focusKeyword}". Do not use quotes. Do not include labels like "Meta Description:". Return only the text.`;
    const response = await ai.models.generateContent({ model: MODEL_NAME, contents: prompt });
    
    let text = response.text || "";
    text = text.replace(/^Meta Description:\s*/i, '');
    text = text.replace(/["']/g, ''); // Remove quotes
    text = text.replace(/[\n\r]+/g, ' '); // Collapse newlines
    
    return text.trim().substring(0, 160) || "";
};

export const generateTitleSuggestions = async (data: ArticleData, lang: Language): Promise<string[]> => {
    const ai = getClient();
    const prompt = `${getLangInstruction(lang)} List 5 click-worthy SEO titles for "${data.focusKeyword}". No numbering.`;
    const response = await ai.models.generateContent({ model: MODEL_NAME, contents: prompt });
    return (response.text || "").split('\n').map(t => t.replace(/^\d+\.\s*/, '').replace(/["']/g, '').trim()).filter(t=>t).slice(0,5);
};

export const generateH1Suggestions = async (data: ArticleData, lang: Language): Promise<string[]> => {
    const ai = getClient();
    const prompt = `${getLangInstruction(lang)} List 5 engaging H1 headlines for "${data.focusKeyword}". No numbering.`;
    const response = await ai.models.generateContent({ model: MODEL_NAME, contents: prompt });
    return (response.text || "").split('\n').map(t => t.replace(/^\d+\.\s*/, '').replace(/["']/g, '').trim()).filter(t=>t).slice(0,5);
};

export const generateSeoTags = async (content: string, keyword: string, lang: Language): Promise<string[]> => {
  const ai = getClient();
  const langInstruction = lang === 'id' ? 'Bahasa Indonesia' : 'English';
  
  const prompt = `
  Context: Article about "${keyword}".
  Language: ${langInstruction}
  
  TASK: Buatkan saya 20 tag SEO yang relevan, memiliki CTR tinggi, mengandung keyword turunan, dan siap digunakan di WordPress. 
  Tampilkan dalam format dipisah koma saja (tanpa bullet), singkat, fokus pada keyword utama "${keyword}".
  `;
  
  const response = await ai.models.generateContent({ model: MODEL_NAME, contents: prompt });
  const text = response.text || "";
  
  return text.split(',')
    .map(t => t.replace(/^[0-9]+\.\s*/, '').replace(/^\s*-\s*/, '').trim())
    .filter(t => t.length > 0)
    .slice(0, 20);
};

export const generateJsonLd = async (data: ArticleData, lang: Language): Promise<string> => {
    const ai = getClient();
    
    // Truncate content for analysis context if too long, but keep start and end for FAQ/Intro
    const contentSample = data.content.length > 4000 
        ? data.content.substring(0, 2000) + "\n...[middle]...\n" + data.content.substring(data.content.length - 2000)
        : data.content;

    const prompt = `
    You are a Technical SEO Expert.
    
    TASK: Generate a complete, valid JSON-LD Schema Graph for this article.
    
    METADATA:
    - Title: "${data.title}"
    - Description: "${data.metaDescription}"
    - Author: "AutoPageOne"
    - Date: "${new Date().toISOString()}"
    - Image: "${data.featuredImage ? 'HAS_IMAGE' : ''}" (If HAS_IMAGE, use the placeholder 'https://yourdomain.com/image.jpg').
    
    CONTENT CONTEXT (Analyze for Schema types):
    ${contentSample}
    
    REQUIREMENTS:
    1. **BlogPosting**: Main entity.
    2. **FAQPage**: REQUIRED. Extract Question/Answer pairs from the "FAQ" section in the text.
    3. **HowTo**: Check if there is a "Buying Guide" or "How To" section. If yes, generate HowTo steps.
    4. **BreadcrumbList**: Standard hierarchy.
    
    OUTPUT FORMAT:
    Return ONLY the raw JSON code. Do not wrap in markdown.
    `;

    const response = await ai.models.generateContent({ model: MODEL_NAME, contents: prompt });
    let json = response.text || "{}";
    json = json.replace(/```json/g, '').replace(/```/g, '').trim();
    return json;
};