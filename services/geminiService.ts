import { GoogleGenAI, Type } from "@google/genai";
import { TranslationStyle, PdfStructure, PdfTextItem, PdfPage, PdfTableItem } from "../types";

/**
 * Custom error class for categorization
 */
class GeminiError extends Error {
  constructor(public message: string, public code?: string, public originalError?: any) {
    super(message);
    this.name = "GeminiError";
  }
}

/**
 * Maps raw API errors to user-friendly descriptive messages.
 */
function mapGeminiError(err: any): string {
  const status = err?.status || err?.error?.code || err?.response?.status;
  const rawMessage = err?.message || err?.error?.message || JSON.stringify(err);
  const msg = rawMessage.toLowerCase();

  // 1. Authentication & Permissions
  if (status === 401 || msg.includes("api key") || msg.includes("unauthorized")) {
    return "Authentication Failed: The API key provided is invalid or expired. Please check your credentials.";
  }
  if (status === 403 || msg.includes("permission denied")) {
    return "Access Denied: The API key does not have permission to access the requested model or project.";
  }

  // 2. Resource & Quota Limits
  if (status === 429 || msg.includes("quota") || msg.includes("rate limit") || msg.includes("exhausted") || msg.includes("too many requests")) {
    return "Rate Limit Exceeded: The system is experiencing high traffic. Please wait a moment before trying again.";
  }
  if (status === 404 || msg.includes("not found")) {
    return "Model Unavailable: The requested AI model version is currently unavailable or deprecated.";
  }

  // 3. Server-Side Issues
  if (status === 503 || status === 502 || status === 500 || msg.includes("overloaded") || msg.includes("unavailable") || msg.includes("internal server error")) {
    return "Service Overloaded: Gemini servers are currently busy. Retrying your request...";
  }

  // 4. Safety & Content Policies
  if (msg.includes("safety") || msg.includes("blocked") || msg.includes("harmful") || err?.response?.promptFeedback?.blockReason) {
    return "Content Filtered: The document contains text that triggers AI safety filters (e.g., harassment, hate speech) and cannot be processed.";
  }
  
  // 5. Data & Parsing Errors
  if (msg.includes("json") || msg.includes("syntax") || msg.includes("unexpected token") || msg.includes("parse")) {
    return "Processing Error: The AI returned an invalid response format. Please try again.";
  }

  // 6. Network Errors
  if (msg.includes("network") || msg.includes("fetch") || msg.includes("connection")) {
    return "Connection Error: Unable to reach the AI service. Please check your internet connection.";
  }

  return `System Error: ${err.message || "An unexpected error occurred during processing."}`;
}

/**
 * Sanitizes a AI response string by removing markdown code block wrappers if present.
 */
function sanitizeJsonResponse(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
    cleaned = cleaned.replace(/\s*```$/, "");
  }
  return cleaned.trim();
}

/**
 * Delay helper for rate limiting and backoff.
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute a Gemini API call with aggressive exponential backoff for transient errors.
 */
async function callGeminiWithRetry(fn: () => Promise<any>, maxRetries = 5): Promise<any> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      
      const status = err?.status || err?.error?.code || err?.response?.status;
      const msg = (err?.message || err?.error?.message || "").toLowerCase();
      
      // FATAL: Don't retry on authentication, safety filters, or bad requests
      if (status === 401 || status === 403 || status === 400 || msg.includes("safety") || msg.includes("blocked")) {
        throw new GeminiError(mapGeminiError(err), "FATAL", err);
      }

      // RETRYABLE: Rate limits (429), Server errors (5xx), Network issues
      const isRateLimit = status === 429 || msg.includes("quota") || msg.includes("rate limit");
      const isServerIssue = status >= 500 || msg.includes("overloaded") || msg.includes("unavailable");
      const isNetwork = msg.includes("network") || msg.includes("fetch");
      
      if (isRateLimit || isServerIssue || isNetwork) {
        // Backoff: 2s, 4s, 8s, 16s... + jitter
        const baseDelay = isRateLimit ? 2000 : 1000;
        const waitTime = Math.pow(2, i) * baseDelay + Math.random() * 1000;
        
        console.warn(`[Gemini Retry] Attempt ${i + 1}/${maxRetries} failed. Retrying in ${Math.round(waitTime)}ms... (${mapGeminiError(err)})`);
        
        if (i === maxRetries - 1) break; 
        await delay(waitTime);
        continue;
      }
      
      // UNKNOWN: Retry limited times (e.g., 2) for weird transient errors, then fail
      if (i >= 2) throw new GeminiError(mapGeminiError(err), "ERROR", err);
      await delay(1000);
    }
  }
  throw new GeminiError(mapGeminiError(lastError), "RETRY_LIMIT_EXCEEDED", lastError);
}

/**
 * Quick local fallback for languages based on Unicode scripts.
 * Used when AI fails or text is too sparse for AI but has distinct script.
 */
function detectScriptBasedLanguage(text: string): string {
  const scripts = [
    { name: 'Hindi', regex: /[\u0900-\u097F]/, count: 0 }, // Devanagari (could be Marathi/Nepali, defaulting to Hindi)
    { name: 'Bengali', regex: /[\u0980-\u09FF]/, count: 0 },
    { name: 'Tamil', regex: /[\u0B80-\u0BFF]/, count: 0 },
    { name: 'Telugu', regex: /[\u0C00-\u0C7F]/, count: 0 },
    { name: 'Gujarati', regex: /[\u0A80-\u0AFF]/, count: 0 },
    { name: 'Malayalam', regex: /[\u0D00-\u0D7F]/, count: 0 },
    { name: 'Kannada', regex: /[\u0C80-\u0CFF]/, count: 0 },
    { name: 'Punjabi', regex: /[\u0A00-\u0A7F]/, count: 0 }, // Gurmukhi
    { name: 'Odia', regex: /[\u0B00-\u0B7F]/, count: 0 },
    { name: 'English', regex: /[a-zA-Z]/, count: 0 }, // Latin fallback
  ];

  // Check first 1000 valid chars (skip common symbols)
  const sample = text.replace(/[^a-zA-Z\u0900-\u0D7F]/g, '').slice(0, 1000);
  
  for (const char of sample) {
    for (const script of scripts) {
      if (script.regex.test(char)) script.count++;
    }
  }

  const best = scripts.sort((a, b) => b.count - a.count)[0];
  // If we found at least 5 characters of a specific script, return it
  if (best.count > 5) return best.name;
  
  return "Unknown";
}

/**
 * Detects language from a structure snippet.
 */
export async function detectLanguageFromStructure(structure: PdfStructure): Promise<{ language: string; confidence: number }> {
  // Improved sampling strategy:
  // 1. Look at first 4 pages to capture body text.
  // 2. Aggregate up to 4000 characters.
  // 3. Relaxed filter: Allow any text item, but we'll clean it later.
  
  let sample = "";
  const maxChars = 4000;
  
  // Safe navigation for pages
  const pagesToCheck = structure.pages ? structure.pages.slice(0, 4) : [];

  for (const page of pagesToCheck) {
    if (!page.items) continue;
    for (const item of page.items) {
      if (item.type === 'text' && item.text) { 
        // Simple heuristic to skip purely numeric/symbolic items from sample
        if (/[a-zA-Z\u0900-\u0D7F]/.test(item.text)) {
           sample += item.text + " ";
        }
      }
      if (sample.length >= maxChars) break;
    }
    if (sample.length >= maxChars) break;
  }
  
  sample = sample.trim();

  // If text is extremely sparse, try strict script detection or return unknown
  if (sample.length < 5) {
    console.warn("Insufficient text content for language detection");
    // Attempt detection even on tiny strings if they contain valid chars
    const scriptLang = detectScriptBasedLanguage(sample);
    if (scriptLang !== 'Unknown') return { language: scriptLang, confidence: 0.5 };
    return { language: "Unknown", confidence: 0 };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await callGeminiWithRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: "Analyze the following text sample and identify the primary language. Return valid JSON object with keys: 'language' (string, the full English name of the language, e.g., 'Hindi', 'English') and 'confidence' (number between 0 and 1)." },
          { text: `SAMPLE TEXT:\n${sample.slice(0, 4000)}` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            language: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ["language", "confidence"]
        }
      },
    }));
    
    if (!response.text) {
      throw new Error("Empty response from AI service");
    }

    const cleaned = sanitizeJsonResponse(response.text);
    const result = JSON.parse(cleaned);
    
    // If confidence is low or unknown, double check with script
    if (result.language === 'Unknown' || result.confidence < 0.4) {
         const scriptLang = detectScriptBasedLanguage(sample);
         if (scriptLang !== 'Unknown') {
             // Prefer script detection if AI is unsure
             return { language: scriptLang, confidence: 0.8 };
         }
    }
    
    return result;
  } catch (err: any) {
    console.error("AI Language detection failed, attempting local fallback:", err);
    // Fallback to script detection
    const scriptLang = detectScriptBasedLanguage(sample);
    if (scriptLang !== 'Unknown') {
        return { language: scriptLang, confidence: 0.7 };
    }
    
    // Return safe fallback
    return { language: "Unknown", confidence: 0 };
  }
}

/**
 * Translates the entire structure with optimized batching to minimize RPM (Requests Per Minute).
 */
export async function translatePdfStructure(
  structure: PdfStructure,
  targetLanguage: string,
  style: TranslationStyle = 'Formal',
  onProgress: (progress: number) => void
): Promise<PdfStructure> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const newPages: PdfPage[] = [];
  const totalPages = structure.pages.length;
  
  for (let pIdx = 0; pIdx < totalPages; pIdx++) {
    const page = structure.pages[pIdx];
    const pageItems = JSON.parse(JSON.stringify(page.items));
    
    const updateProgress = (step: number, totalSteps: number) => {
      const pageBase = pIdx / totalPages;
      const pageInner = (step / Math.max(1, totalSteps)) * (1 / totalPages);
      onProgress(Math.min(99, (pageBase + pageInner) * 100));
    };

    const textIndices: number[] = [];
    const textContents: string[] = [];
    pageItems.forEach((item: any, idx: number) => {
      if (item.type === 'text' && item.text.trim().length > 0) {
        textIndices.push(idx);
        textContents.push(item.text);
      }
    });

    const BATCH_SIZE = 40; // Slightly reduced batch size for reliability
    
    for (let i = 0; i < textContents.length; i += BATCH_SIZE) {
      const batch = textContents.slice(i, i + BATCH_SIZE);
      
      // Rate limit smoothing
      if (i > 0 || pIdx > 0) await delay(2000);

      try {
        const response = await callGeminiWithRetry(() => ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { text: `Translate these ${batch.length} text segments to ${targetLanguage}. Style: ${style}. Keep all formatting/placeholders. Return a JSON array of strings.` },
              { text: JSON.stringify(batch) }
            ]
          },
          config: {
            systemInstruction: `You are a professional translator. Output must be a valid JSON array of strings corresponding exactly to the input array. Do not add explanations.`,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }));
        
        if (!response.text) throw new Error("Empty response");

        const cleaned = sanitizeJsonResponse(response.text);
        let translatedBatch: string[];
        
        try {
          translatedBatch = JSON.parse(cleaned);
        } catch (parseErr) {
          throw new GeminiError("Response Parsing Error", "PARSE_ERROR", parseErr);
        }

        if (!Array.isArray(translatedBatch) || translatedBatch.length !== batch.length) {
          console.warn(`[Translation Warning] Batch length mismatch. Expected ${batch.length}, got ${translatedBatch?.length}. Using partial/fallback.`);
          // If mismatch, try to use what we have or fallback to original for safety
          if (Array.isArray(translatedBatch)) {
             translatedBatch.forEach((text, bIdx) => {
               if (bIdx < batch.length) {
                 const originalIdx = textIndices[i + bIdx];
                 if (originalIdx !== undefined) (pageItems[originalIdx] as PdfTextItem).text = text;
               }
             });
          }
        } else {
          translatedBatch.forEach((text, bIdx) => {
            const originalIdx = textIndices[i + bIdx];
            if (originalIdx !== undefined) {
              (pageItems[originalIdx] as PdfTextItem).text = text;
            }
          });
        }

      } catch (err: any) {
        console.error(`[Translation Failed] Page ${pIdx + 1}, Batch ${i}:`, err);
        // If it's a fatal error (like Auth or Safety), stop the entire process immediately.
        if (err instanceof GeminiError && err.code === "FATAL") {
           throw err;
        }
        // For non-fatal errors (e.g. specific batch parsing failure), we log and skip this batch
        // keeping the original text, allowing the rest of the document to be translated.
        // This is better than failing the whole document for one glitch.
      }
      updateProgress(i + BATCH_SIZE, textContents.length);
    }

    // 2. Table Translation
    // Re-run table loop properly with full implementation
    for (let i = 0; i < pageItems.length; i++) {
      const item = pageItems[i];
      if (item.type === 'table') {
        await delay(2000);
        try {
          const response = await callGeminiWithRetry(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { text: `Translate this table structure to ${targetLanguage} (${style}). Return JSON.` },
                    { text: JSON.stringify(item.rows) }
                ]
            },
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    cells: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          text: { type: Type.STRING },
                          isHeader: { type: Type.BOOLEAN },
                          colSpan: { type: Type.NUMBER },
                          rowSpan: { type: Type.NUMBER },
                          align: { type: Type.STRING }
                        },
                        required: ["text"]
                      }
                    }
                  }
                }
              }
            }
          }));
          const cleaned = sanitizeJsonResponse(response.text || "[]");
          (pageItems[i] as PdfTableItem).rows = JSON.parse(cleaned);
        } catch (err: any) {
           console.error("[Table Translation Error]:", err);
           if (err instanceof GeminiError && err.code === "FATAL") throw err;
        }
      }
    }

    newPages.push({ ...page, items: pageItems });
    onProgress(((pIdx + 1) / totalPages) * 100);
  }

  return { pages: newPages };
}
