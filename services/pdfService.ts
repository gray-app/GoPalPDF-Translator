// Use the global libraries from the window object
declare const jspdf: any;
declare const html2canvas: any;
declare const pdfjsLib: any;
declare const mammoth: any;

import { PdfFont, PdfFontSize, PdfLineSpacing, PdfStructure, PdfPage, PdfTextItem, PdfImageItem, PdfPathItem, PdfTableItem, PdfTableRow, PdfTableCell } from '../types';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface FontConfig {
  families: string[];
  sampleText: string;
  primaryFont: string;
}

// Mapping of languages to their specific Google Font requirements and warm-up characters
const LANGUAGE_FONT_MAP: Record<string, FontConfig> = {
  'Hindi': { 
    families: ['family=Noto+Sans+Devanagari:wght@400;700'], 
    sampleText: 'नमस्ते', 
    primaryFont: 'Noto Sans Devanagari' 
  },
  'Marathi': { 
    families: ['family=Noto+Sans+Devanagari:wght@400;700'], 
    sampleText: 'नमस्कार', 
    primaryFont: 'Noto Sans Devanagari' 
  },
  'Nepali': { 
    families: ['family=Noto+Sans+Devanagari:wght@400;700'], 
    sampleText: 'नमस्ते', 
    primaryFont: 'Noto Sans Devanagari' 
  },
  'Sanskrit': { 
    families: ['family=Noto+Sans+Devanagari:wght@400;700'], 
    sampleText: 'नमस्ते', 
    primaryFont: 'Noto Sans Devanagari' 
  },
  'Maithili': { 
    families: ['family=Noto+Sans+Devanagari:wght@400;700'], 
    sampleText: 'प्रणाम', 
    primaryFont: 'Noto Sans Devanagari' 
  },
  'Bodo': { 
    families: ['family=Noto+Sans+Devanagari:wght@400;700'], 
    sampleText: 'खुलुमबाय', 
    primaryFont: 'Noto Sans Devanagari' 
  },
  'Dogri': { 
    families: ['family=Noto+Sans+Devanagari:wght@400;700'], 
    sampleText: 'नमस्ते', 
    primaryFont: 'Noto Sans Devanagari' 
  },
  'Konkani': { 
    families: ['family=Noto+Sans+Devanagari:wght@400;700'], 
    sampleText: 'देव बरे करू', 
    primaryFont: 'Noto Sans Devanagari' 
  },
  
  'Bengali': { 
    families: ['family=Noto+Sans+Bengali:wght@400;700'], 
    sampleText: 'হ্যালো', 
    primaryFont: 'Noto Sans Bengali' 
  },
  'Assamese': { 
    families: ['family=Noto+Sans+Bengali:wght@400;700'], 
    sampleText: 'নমস্কাৰ', 
    primaryFont: 'Noto Sans Bengali' 
  },
  
  'Tamil': { 
    families: ['family=Noto+Sans+Tamil:wght@400;700'], 
    sampleText: 'வணக்கம்', 
    primaryFont: 'Noto Sans Tamil' 
  },
  'Telugu': { 
    families: ['family=Noto+Sans+Telugu:wght@400;700'], 
    sampleText: 'హలో', 
    primaryFont: 'Noto Sans Telugu' 
  },
  'Kannada': { 
    families: ['family=Noto+Sans+Kannada:wght@400;700'], 
    sampleText: 'ನಮಸ್ಕಾರ', 
    primaryFont: 'Noto Sans Kannada' 
  },
  'Malayalam': { 
    families: ['family=Noto+Sans+Malayalam:wght@400;700'], 
    sampleText: 'ഹലോ', 
    primaryFont: 'Noto Sans Malayalam' 
  },
  'Gujarati': { 
    families: ['family=Noto+Sans+Gujarati:wght@400;700'], 
    sampleText: 'નમસ્તે', 
    primaryFont: 'Noto Sans Gujarati' 
  },
  'Punjabi': { 
    families: ['family=Noto+Sans+Gurmukhi:wght@400;700'], 
    sampleText: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ', 
    primaryFont: 'Noto Sans Gurmukhi' 
  },
  'Odia': { 
    families: ['family=Noto+Sans+Oriya:wght@400;700'], 
    sampleText: 'ନମସ୍କାର', 
    primaryFont: 'Noto Sans Oriya' 
  },
  
  'Urdu': { 
    families: ['family=Noto+Sans+Arabic:wght@400;700'], 
    sampleText: 'مرحبا', 
    primaryFont: 'Noto Sans Arabic' 
  },
  'Kashmiri': { 
    families: ['family=Noto+Sans+Arabic:wght@400;700'], 
    sampleText: 'سَلام', 
    primaryFont: 'Noto Sans Arabic' 
  },
  'Sindhi': { 
    families: ['family=Noto+Sans+Arabic:wght@400;700'], 
    sampleText: 'سلام', 
    primaryFont: 'Noto Sans Arabic' 
  },
  
  'Manipuri': { 
    families: ['family=Noto+Sans+Meetei+Mayek:wght@400;700'], 
    sampleText: 'ꯈꯨꯔꯨꯝꯖꯔꯤ', 
    primaryFont: 'Noto Sans Meetei Mayek' 
  },
  'Santali': { 
    families: ['family=Noto+Sans+Ol+Chiki:wght@400;700'], 
    sampleText: 'ᱡᱚᱦᱟᱨ', 
    primaryFont: 'Noto Sans Ol Chiki' 
  }
};

// Github Raw Links for TTF files (reliable for jsPDF)
const NOTO_BASE = "https://raw.githubusercontent.com/google/fonts/main/ofl";
const FONT_URL_MAP: Record<string, string> = {
    'Noto Sans Devanagari': `${NOTO_BASE}/notosansdevanagari/NotoSansDevanagari-Regular.ttf`,
    'Noto Sans Bengali': `${NOTO_BASE}/notosansbengali/NotoSansBengali-Regular.ttf`,
    'Noto Sans Tamil': `${NOTO_BASE}/notosanstamil/NotoSansTamil-Regular.ttf`,
    'Noto Sans Telugu': `${NOTO_BASE}/notosanstelugu/NotoSansTelugu-Regular.ttf`,
    'Noto Sans Kannada': `${NOTO_BASE}/notosanskannada/NotoSansKannada-Regular.ttf`,
    'Noto Sans Malayalam': `${NOTO_BASE}/notosansmalayalam/NotoSansMalayalam-Regular.ttf`,
    'Noto Sans Gujarati': `${NOTO_BASE}/notosansgujarati/NotoSansGujarati-Regular.ttf`,
    'Noto Sans Gurmukhi': `${NOTO_BASE}/notosansgurmukhi/NotoSansGurmukhi-Regular.ttf`,
    'Noto Sans Oriya': `${NOTO_BASE}/notosansoriya/NotoSansOriya-Regular.ttf`,
    'Noto Sans Arabic': `${NOTO_BASE}/notosansarabic/NotoSansArabic-Regular.ttf`,
    'Noto Sans Meetei Mayek': `${NOTO_BASE}/notosansmeeteimayek/NotoSansMeeteiMayek-Regular.ttf`,
    'Noto Sans Ol Chiki': `${NOTO_BASE}/notosansolchiki/NotoSansOlChiki-Regular.ttf`,
    'Inter': `${NOTO_BASE}/inter/static/Inter-Regular.ttf` // Fallback for latin
};

// Cached canvas for text measurement
const measureCanvas = document.createElement('canvas');
const measureCtx = measureCanvas.getContext('2d');

function measureTextWidth(text: string, fontStack: string, fontSize: number, isBold: boolean): number {
  if (!measureCtx) return 0;
  measureCtx.font = `${isBold ? '700' : '400'} ${fontSize}pt ${fontStack}`;
  return measureCtx.measureText(text).width;
}

/**
 * Fetches and embeds a specific set of fonts into the document head.
 */
async function loadFontSet(id: string, fontParams: string[]) {
  if (document.getElementById(id)) return;

  const fontCssUrl = `https://fonts.googleapis.com/css2?${fontParams.join('&')}&display=swap`;
  
  try {
    const cssRes = await fetch(fontCssUrl);
    if (!cssRes.ok) {
      throw new Error(`Failed to load font CSS from ${fontCssUrl}: ${cssRes.status} ${cssRes.statusText}`);
    }
    let cssText = await cssRes.text();

    const urlRegex = /url\(['"]?([^)'"]+)['"]?\)/g;
    const matches = [...cssText.matchAll(urlRegex)];
    const uniqueUrls = [...new Set(matches.map(m => m[1]))];

    const fontMap = new Map<string, string>();
    await Promise.all(uniqueUrls.map(async (url) => {
      try {
        const fontRes = await fetch(url);
        if (!fontRes.ok) throw new Error(`Failed to fetch font file: ${url}`);
        const blob = await fontRes.blob();
        return new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              fontMap.set(url, reader.result);
            }
            resolve();
          };
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.warn('Failed to embed font file:', url, e);
        return null;
      }
    }));

    cssText = cssText.replace(urlRegex, (match, url) => {
      return fontMap.has(url) ? `url(${fontMap.get(url)})` : match;
    });

    const style = document.createElement('style');
    style.id = id;
    style.textContent = cssText;
    document.head.appendChild(style);
    
  } catch (error) {
    console.error(`Error embedding fonts for ${id}:`, error);
  }
}

async function embedFontsForExport(targetLanguage: string) {
  await loadFontSet('polyglot-base-fonts', ['family=Inter:wght@400;600;700;900']);
  
  const config = LANGUAGE_FONT_MAP[targetLanguage];
  if (config) {
    await loadFontSet(`polyglot-fonts-${targetLanguage}`, config.families);
    
    const warmUpDiv = document.createElement('div');
    warmUpDiv.id = `font-warmup-${targetLanguage}`;
    warmUpDiv.style.cssText = 'position:absolute; top:-9999px; left:-9999px; visibility:hidden; white-space:nowrap; pointer-events:none;';
    warmUpDiv.innerHTML = `
      <span style="font-family: 'Inter'; font-weight:700;">Warmup</span>
      <span style="font-family: '${config.primaryFont}'; font-weight:400;">${config.sampleText}</span>
      <span style="font-family: '${config.primaryFont}'; font-weight:700;">${config.sampleText}</span>
    `;
    document.body.appendChild(warmUpDiv);
    
    if ((document as any).fonts && (document as any).fonts.ready) {
        await (document as any).fonts.ready;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (document.body.contains(warmUpDiv)) document.body.removeChild(warmUpDiv);
  } else {
    if ((document as any).fonts && (document as any).fonts.ready) {
        await (document as any).fonts.ready;
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

async function ensureFontsLoaded() {
  const fontCheck = (document as any).fonts;
  if (fontCheck && fontCheck.ready) await fontCheck.ready;
  await new Promise(resolve => setTimeout(resolve, 800));
}

export async function extractDocumentStructure(file: File): Promise<PdfStructure> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'docx' || file.type.includes('word') || file.type.includes('officedocument')) {
    return extractDocxStructure(file);
  }
  return extractPdfStructure(file);
}

async function extractDocxStructure(file: File): Promise<PdfStructure> {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const options = {
      convertImage: mammoth.images.inline((element: any) => {
        return element.read("base64").then((imageBuffer: any) => {
          return { src: "data:" + element.contentType + ";base64," + imageBuffer };
        });
      })
    };
    const result = await mammoth.convertToHtml({ arrayBuffer }, options);
    const html = result.value || "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 50; 
    const fontSize = 12;
    const lineHeight = fontSize * 1.5;
    
    const pages: PdfPage[] = [];
    let currentPageItems: any[] = [];
    let currentY = margin;

    const pushNewPage = () => {
      pages.push({ items: currentPageItems, width: pageWidth, height: pageHeight });
      currentPageItems = [];
      currentY = margin;
    };

    const processNode = (node: Node) => {
      if (node.nodeName === 'P') {
        const text = node.textContent?.trim();
        if (text) {
          if (currentY + lineHeight > pageHeight - margin) pushNewPage();
          currentPageItems.push({
            type: 'text',
            text,
            x: margin,
            y: currentY,
            width: pageWidth - (margin * 2),
            height: fontSize,
            fontSize,
            fontName: 'sans-serif',
            isBold: (node as HTMLElement).tagName === 'STRONG' || (node as HTMLElement).tagName === 'B',
            isParagraphStart: true
          });
          currentY += lineHeight;
        }
      } else if (node.nodeName === 'TABLE') {
        const rows: PdfTableRow[] = [];
        const trs = (node as HTMLElement).querySelectorAll('tr');
        trs.forEach((tr: any) => {
          const cells: PdfTableCell[] = [];
          tr.querySelectorAll('td, th').forEach((td: any) => {
            cells.push({
              text: td.textContent?.trim() || "",
              isHeader: td.nodeName === 'TH',
              colSpan: parseInt(td.getAttribute('colspan') || '1'),
              rowSpan: parseInt(td.getAttribute('rowspan') || '1')
            });
          });
          if (cells.length > 0) rows.push({ cells });
        });
        if (rows.length > 0) {
          const h = rows.length * 25;
          if (currentY + h > pageHeight - margin) pushNewPage();
          currentPageItems.push({ type: 'table', rows, x: margin, y: currentY, width: pageWidth - (margin * 2), height: h, hasBorders: true });
          currentY += h + 20;
        }
      } else {
        node.childNodes.forEach(processNode);
      }
    };

    doc.body.childNodes.forEach(processNode);
    if (currentPageItems.length > 0 || pages.length === 0) {
      pages.push({ items: currentPageItems, width: pageWidth, height: pageHeight });
    }
    return { pages };
  } catch (error) {
    throw new Error("Could not parse DOCX content.");
  }
}

function calculateLineSpacingStats(yCoords: number[]): { stdLineHeight: number, paraGapThreshold: number } {
    if (yCoords.length < 2) return { stdLineHeight: 14, paraGapThreshold: 20 };

    const gaps: number[] = [];
    for (let i = 0; i < yCoords.length - 1; i++) {
        const gap = Math.abs(yCoords[i] - yCoords[i+1]);
        if (gap > 5 && gap < 300) gaps.push(gap);
    }
    
    if (gaps.length === 0) return { stdLineHeight: 14, paraGapThreshold: 20 };

    const frequency: Record<number, number> = {};
    gaps.forEach(g => {
        const rounded = Math.round(g);
        frequency[rounded] = (frequency[rounded] || 0) + 1;
    });

    let mode = 0; 
    let maxFreq = 0;
    Object.entries(frequency).forEach(([gap, freq]) => {
        if (freq > maxFreq) {
            maxFreq = freq;
            mode = parseInt(gap);
        }
    });

    const std = mode > 8 ? mode : (gaps.reduce((a,b)=>a+b,0)/gaps.length);
    
    return { 
        stdLineHeight: std, 
        paraGapThreshold: std * 1.5
    };
}

function reorderItemsByReadingFlow(items: any[]): any[] {
  const MIN_COL_GAP = 14; 
  const MIN_ROW_GAP = 6;

  const getContributors = (list: any[]) => {
    return list.filter(i => i.type === 'text' || i.type === 'image' || i.type === 'table');
  };

  const findSplit = (list: any[], axis: 'x' | 'y') => {
    const contributors = getContributors(list);
    if (contributors.length < 2) return null;
    
    const intervals = contributors.map(i => axis === 'x' 
      ? { s: i.x, e: i.x + i.width }
      : { s: i.y, e: i.y + i.height }
    ).sort((a, b) => a.s - b.s);

    if (intervals.length === 0) return null;

    const merged: {s: number, e: number}[] = [];
    let current = intervals[0];
    for (let i = 1; i < intervals.length; i++) {
      const next = intervals[i];
      if (next.s < current.e - 0.1) {
        current.e = Math.max(current.e, next.e);
      } else {
        merged.push(current);
        current = next;
      }
    }
    merged.push(current);

    let bestGap = null;
    let maxGapSize = 0;
    
    for (let i = 0; i < merged.length - 1; i++) {
      const gapSize = merged[i+1].s - merged[i].e;
      const minSize = axis === 'x' ? MIN_COL_GAP : MIN_ROW_GAP;
      
      if (gapSize > minSize && gapSize > maxGapSize) {
        maxGapSize = gapSize;
        bestGap = (merged[i].e + merged[i+1].s) / 2;
      }
    }
    return bestGap;
  };

  const recursiveOrder = (list: any[]): any[] => {
    if (list.length <= 1) return list;

    const splitX = findSplit(list, 'x');
    if (splitX !== null) {
      const left = list.filter(i => (i.x + i.width/2) < splitX);
      const right = list.filter(i => (i.x + i.width/2) >= splitX);
      return [...recursiveOrder(left), ...recursiveOrder(right)];
    }

    const splitY = findSplit(list, 'y');
    if (splitY !== null) {
      const top = list.filter(i => (i.y + i.height/2) < splitY);
      const bottom = list.filter(i => (i.y + i.height/2) >= splitY);
      return [...recursiveOrder(top), ...recursiveOrder(bottom)];
    }

    return list.sort((a, b) => {
       if (Math.abs(a.y - b.y) > 6) return a.y - b.y;
       return a.x - b.x;
    });
  };

  return recursiveOrder(items);
}

function mergeTextBlocks(items: any[]): any[] {
  if (items.length === 0) return [];
  
  const merged: any[] = [];
  let current = items[0];
  
  for (let i = 1; i < items.length; i++) {
    const next = items[i];
    
    const isText = current.type === 'text' && next.type === 'text';
    
    if (!isText) {
      merged.push(current);
      current = next;
      continue;
    }

    const sameFont = current.fontName === next.fontName;
    const sameSize = Math.abs(current.fontSize - next.fontSize) < 2.0;
    const lineSpacing = next.y - current.y;
    
    // Dynamic vertical check using font size
    const isContinuousVertical = lineSpacing > 0 && lineSpacing < (current.fontSize * 2.5);
    
    const isAlignedLeft = Math.abs(current.x - next.x) < 20; 
    const isFlowing = next.x >= current.x - 40 && (next.x + next.width) <= (current.x + current.width) + 40;

    // Check for list patterns to prevent merging list items into previous paragraph
    const isList = /^[•●\-\*]\s/.test(next.text) || /^\d+[\.\)]\s/.test(next.text);

    if (sameFont && sameSize && isContinuousVertical && (isAlignedLeft || isFlowing) && !isList) {
      
      // Handle Hyphenation (merge words split across lines)
      if (current.text.trim().endsWith('-')) {
          current.text = current.text.trim().slice(0, -1) + next.text;
      } else {
          current.text += " " + next.text;
      }
      
      const newX = Math.min(current.x, next.x);
      const newWidth = Math.max(current.x + current.width, next.x + next.width) - newX;
      const newHeight = (next.y + next.height) - current.y;

      // Adjust indentation if the subsequent line starts further left (hanging indent correction)
      if (next.x < current.x - 5) {
        current.indent = (current.indent || 0) + (current.x - next.x);
        current.x = next.x; 
      }
      
      current.width = newWidth;
      current.height = newHeight;
    } else {
      merged.push(current);
      current = next;
    }
  }
  merged.push(current);
  return merged;
}

export async function extractPdfStructure(file: File): Promise<PdfStructure> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const pages: PdfPage[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();
    const operatorList = await page.getOperatorList();
    
    const pageItems: (PdfTextItem | PdfImageItem | PdfPathItem | PdfTableItem)[] = [];
    const lineMap = new Map<number, any[]>();
    
    textContent.items.forEach((item: any) => {
      if (!item.str || item.str.trim().length === 0) return;
      
      const y = Math.round(item.transform[5] * 2) / 2;
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y)!.push(item);
    });

    const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);
    const { stdLineHeight, paraGapThreshold } = calculateLineSpacingStats(sortedY);
    
    let previousY = -1;
    let previousX = -1;

    sortedY.forEach(y => {
      const lineItems = lineMap.get(y)!;
      lineItems.sort((a, b) => a.transform[4] - b.transform[4]);
      
      let currentGroup: PdfTextItem | null = null;
      
      lineItems.forEach((item) => {
        const x = item.transform[4];
        const fontSize = Math.sqrt(item.transform[0] ** 2 + item.transform[1] ** 2);
        const charWidth = item.width / item.str.length;
        const splitThreshold = Math.max(charWidth * 2.5, 12);

        if (currentGroup && (x - (currentGroup.x + currentGroup.width) < splitThreshold)) {
          const gap = x - (currentGroup.x + currentGroup.width);
          if (gap > charWidth * 0.3) currentGroup.text += " ";
          currentGroup.text += item.str;
          currentGroup.width = (x + item.width) - currentGroup.x;
        } else {
          // Enhanced paragraph detection using calculated stats
          const gap = previousY !== -1 ? Math.abs(previousY - y) : 0;
          const isNewParagraph = previousY === -1 || gap > paraGapThreshold;
          
          let currentIndent = 0;
          if (isNewParagraph && previousX !== -1) {
              const diff = x - previousX;
              // Only consider significant positive indentation
              if (diff > 10 && diff < 80) currentIndent = diff;
          }
          
          currentGroup = {
            type: 'text',
            text: item.str,
            x: x,
            y: viewport.height - y - fontSize,
            width: item.width,
            height: fontSize,
            fontSize,
            fontName: item.fontName || 'sans-serif',
            isBold: (item.fontName || '').toLowerCase().includes('bold'),
            isParagraphStart: isNewParagraph,
            indent: currentIndent
          };
          
          const pageMid = viewport.width / 2;
          const centerDev = Math.abs((currentGroup.x + currentGroup.width / 2) - pageMid);
          if (centerDev < 15) {
            currentGroup.alignment = 'center';
          } else if (currentGroup.x > viewport.width * 0.65) {
            currentGroup.alignment = 'right';
          }

          pageItems.push(currentGroup);
          previousY = y;
          previousX = x;
        }
      });
    });

    const OPS = (pdfjsLib as any).OPS;
    let currentTransform = [1, 0, 0, 1, 0, 0];
    for (let j = 0; j < operatorList.fnArray.length; j++) {
      const fn = operatorList.fnArray[j];
      const args = operatorList.argsArray[j];
      if (fn === OPS.transform) currentTransform = args;
      if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject) {
        const imgW = Math.abs(currentTransform[0]), imgH = Math.abs(currentTransform[3]);
        const imgX = currentTransform[4], imgY = viewport.height - currentTransform[5] - imgH;
        pageItems.push({ type: 'image', data: 'placeholder', x: imgX, y: imgY, width: imgW, height: imgH });
      }
    }

    const sortedPageItems = reorderItemsByReadingFlow(pageItems);
    const mergedPageItems = mergeTextBlocks(sortedPageItems);

    pages.push({ items: mergedPageItems, width: viewport.width, height: viewport.height });
  }
  return { pages };
}

export async function renderStructureToElement(
  container: HTMLElement,
  structure: PdfStructure,
  userFont: PdfFont,
  userFontSize: PdfFontSize,
  userLineSpacing: PdfLineSpacing,
  editable: boolean = false,
  isExport: boolean = false,
  scale: number = 1.0
): Promise<void> {
  const s = (val: number) => val * scale;
  
  const indicStack = [
    "'Inter'",
    "'Noto Sans Devanagari'",
    "'Noto Sans Bengali'",
    "'Noto Sans Tamil'",
    "'Noto Sans Telugu'",
    "'Noto Sans Kannada'",
    "'Noto Sans Malayalam'",
    "'Noto Sans Gujarati'",
    "'Noto Sans Gurmukhi'",
    "'Noto Sans Odia'",
    "'Noto Sans Oriya'", 
    "'Noto Sans Arabic'",
    "'Noto Sans Meetei Mayek'",
    "'Noto Sans Ol Chiki'",
    "sans-serif"
  ].join(', ');

  const fontStack = userFont === 'times' 
    ? "'Times New Roman', serif, " + indicStack 
    : userFont === 'courier' 
      ? "'Courier New', monospace, " + indicStack 
      : indicStack;
  
  structure.pages.forEach((page, pageIdx) => {
    const pageEl = document.createElement('div');
    pageEl.className = 'pdf-page-canvas-item';
    
    const margin = '0';
    const shadow = isExport ? 'none' : `0 ${s(4)}px ${s(6)}px -${s(1)}px rgba(0, 0, 0, 0.1), 0 ${s(2)}px ${s(4)}px -${s(1)}px rgba(0, 0, 0, 0.06), 0 0 0 ${s(1)}px rgba(0,0,0,0.02)`;
    
    pageEl.style.cssText = `position:relative; width:${s(page.width)}pt; height:${s(page.height)}pt; margin:${margin}; background:white; overflow:hidden; box-shadow:${shadow}; transform-origin: top left;`;
    pageEl.setAttribute('data-page-index', pageIdx.toString());

    page.items.forEach((item) => {
      const el = document.createElement('div');
      el.style.position = 'absolute';
      el.style.left = `${s(item.x)}pt`;
      el.style.top = `${s(item.y)}pt`;
      el.style.width = `${s(item.width)}pt`;
      el.style.zIndex = item.type === 'text' ? '2' : '1';
      
      if (item.type === 'text') {
        const span = document.createElement('span');
        let scaledFontSize = s(item.fontSize);
        
        // Intelligent font resizing logic to fit translated text
        // 1. Setup metrics
        const containerW = s(item.width);
        const containerH = s(item.height);
        
        // 2. Measure text width as a single line
        const fullTextWidth = measureTextWidth(item.text, fontStack, scaledFontSize, !!item.isBold);
        
        // 3. Estimate number of lines this text will take in the container
        // We use a slight buffer (0.95 factor) for word wrapping inefficiencies
        const estimatedLines = Math.ceil(fullTextWidth / (containerW * 0.95)); 
        
        // 4. Calculate required height based on line count and spacing
        const requiredHeight = estimatedLines * (scaledFontSize * userLineSpacing);
        
        // 5. Apply scaling if overflow detected
        if (requiredHeight > containerH * 1.1) { // 10% height overflow tolerance
             // Height constrained scaling: Area ~ fontSize^2
             const heightRatio = containerH / requiredHeight;
             const adjustment = Math.sqrt(heightRatio);
             scaledFontSize = Math.max(scaledFontSize * adjustment, scaledFontSize * 0.6); // Floor at 60%
        } else if (estimatedLines === 1 && fullTextWidth > containerW) {
             // Single line width constrained scaling
             const widthRatio = containerW / fullTextWidth;
             scaledFontSize = Math.max(scaledFontSize * widthRatio, scaledFontSize * 0.6);
        }

        span.style.cssText = `
          font-size:${scaledFontSize}pt; 
          font-family:${fontStack}; 
          font-weight:${item.isBold ? '700' : '400'}; 
          line-height:${userLineSpacing}; 
          white-space:pre-wrap; 
          display:block;
          color: ${isExport ? '#000000' : '#1e293b'};
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        `;
        
        if (item.alignment) span.style.textAlign = item.alignment;
        if (item.indent) span.style.textIndent = `${s(item.indent)}pt`;
        
        if (item.isParagraphStart) {
          span.style.marginTop = `${s(2)}pt`;
        }

        span.innerText = item.text;
        
        if (editable) {
          span.contentEditable = "true";
          span.style.outline = "none";
          span.style.cursor = "text";
          span.addEventListener('input', () => { item.text = span.innerText; });
          span.addEventListener('focus', () => { span.style.backgroundColor = 'rgba(59, 130, 246, 0.05)'; });
          span.addEventListener('blur', () => { span.style.backgroundColor = 'transparent'; });
        }
        
        el.appendChild(span);
      } else if (item.type === 'image') {
        el.style.height = `${s(item.height)}pt`;
        el.style.backgroundColor = '#f8fafc';
        el.style.border = '1px dashed #e2e8f0';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        const label = document.createElement('span');
        label.innerText = 'IMG';
        label.style.cssText = `font-size:${s(8)}px; font-weight:900; color:#cbd5e1;`;
        el.appendChild(label);
      } else if (item.type === 'table') {
        const table = document.createElement('table');
        const tableFontSize = s(userFontSize - 2);
        table.style.cssText = `width:100%; border-collapse:collapse; font-family:${fontStack}; font-size:${tableFontSize}pt;`;
        item.rows.forEach(row => {
          const tr = document.createElement('tr');
          row.cells.forEach(cell => {
            const td = document.createElement(cell.isHeader ? 'th' : 'td');
            td.innerText = cell.text;
            td.style.cssText = `border:${s(0.5)}pt solid #e2e8f0; padding:${s(6)}pt; text-align:${cell.align || 'left'}; font-weight:${cell.isHeader ? '900' : '400'}; color:${isExport ? '#000000' : '#334155'};`;
            if (editable) {
              td.contentEditable = "true";
              td.style.outline = "none";
              td.addEventListener('input', () => { cell.text = td.innerText; });
            }
            tr.appendChild(td);
          });
          table.appendChild(tr);
        });
        el.appendChild(table);
      } else if (item.type === 'path') {
        el.style.height = `${s(item.height)}pt`;
        const lw = s(item.lineWidth);
        el.style.border = `${lw}pt solid ${item.strokeColor || '#f1f5f9'}`;
        if (item.method !== 'rect') {
           el.style.borderWidth = item.width > item.height ? `${lw}pt 0 0 0` : `0 0 0 ${lw}pt`;
        }
      }
      pageEl.appendChild(el);
    });

    const pageMeta = document.createElement('div');
    pageMeta.style.cssText = `position:absolute; bottom:${s(10)}pt; width:100%; text-align:center; font-size:${s(7)}pt; color:#94a3b8; font-weight:700; opacity:0.5;`;
    pageMeta.innerText = `RECONSTRUCTED MIRROR - PAGE ${pageIdx + 1}`;
    pageEl.appendChild(pageMeta);

    container.appendChild(pageEl);
  });
}

// Helper to fetch valid TTF font for jsPDF
async function fetchFontForJsPDF(targetLanguage: string): Promise<{ fontName: string, fontFile: string } | null> {
    const config = LANGUAGE_FONT_MAP[targetLanguage];
    if (!config) return null;
    
    // Attempt to map to a TTF file
    let ttfUrl = FONT_URL_MAP[config.primaryFont];
    
    // If not found in map, fallback to Inter if not specific, or just null
    if (!ttfUrl) {
       // If the language is English or other Latin based that isn't in map, use Inter
       if (['English', 'Spanish', 'French', 'German', 'Italian'].includes(targetLanguage)) {
           ttfUrl = FONT_URL_MAP['Inter'];
           config.primaryFont = 'Inter'; // Override
       } else {
           return null;
       }
    }

    try {
        const fontRes = await fetch(ttfUrl);
        if (!fontRes.ok) throw new Error("Font fetch failed");
        
        const blob = await fontRes.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    const base64 = reader.result.split(',')[1];
                    resolve({
                        fontName: config.primaryFont,
                        fontFile: base64
                    });
                } else {
                    resolve(null);
                }
            };
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn(`Could not fetch TTF font for ${targetLanguage}, text layer may be garbage.`, e);
        return null;
    }
}

export async function generatePdfFromStructure(
  structure: PdfStructure, 
  filename: string, 
  userFont: PdfFont = 'helvetica', 
  userFontSize: PdfFontSize = 12,
  userLineSpacing: PdfLineSpacing = 1.5,
  targetLanguage: string = 'English',
  save: boolean = true
): Promise<any> {
  const jspdfLib = (window as any).jspdf;
  const html2canvasLib = (window as any).html2canvas;

  try {
      await embedFontsForExport(targetLanguage);
      await ensureFontsLoaded();
  } catch (fontError) {
      console.warn("Font embedding encountered an issue, proceeding with system fonts:", fontError);
  }
  
  // Fetch font for Text Layer (Critical for "True PDF" in Indic languages)
  const embedFontData = await fetchFontForJsPDF(targetLanguage);
  
  window.scrollTo(0, 0);

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed; top:0; left:0; z-index:-9999; margin:0; padding:0; background:#ffffff; opacity:1; pointer-events:none;';
  document.body.appendChild(wrap);
  
  try {
    // 1. Render the high-fidelity visual layer (HTML/CSS)
    // We render this at 1.0 scale into the container, but html2canvas will upscale it
    await renderStructureToElement(wrap, structure, userFont, userFontSize, userLineSpacing, false, true, 1.0);

    const els = wrap.querySelectorAll('.pdf-page-canvas-item');
    if (els.length === 0) {
        throw new Error("No pages generated");
    }

    const firstPage = els[0] as HTMLElement;
    const firstW = parseFloat(firstPage.style.width) || 595.28;
    const firstH = parseFloat(firstPage.style.height) || 841.89;
    
    // Initialize PDF with Point units to match structure
    const pdf = new jspdfLib.jsPDF({ 
      unit: 'pt', 
      format: [firstW, firstH], 
      compress: true,
      orientation: firstW > firstH ? 'l' : 'p'
    });

    // Font setup for invisible text layer
    let activeFontName = 'helvetica';
    
    if (embedFontData) {
        // Register the font
        pdf.addFileToVFS(`${embedFontData.fontName}.ttf`, embedFontData.fontFile);
        pdf.addFont(`${embedFontData.fontName}.ttf`, embedFontData.fontName, 'normal');
        pdf.setFont(embedFontData.fontName);
        activeFontName = embedFontData.fontName;
    } else {
        pdf.setFont('helvetica');
    }

    for (let i = 0; i < els.length; i++) {
      const el = els[i] as HTMLElement;
      const w = parseFloat(el.style.width) || 595.28;
      const h = parseFloat(el.style.height) || 841.89;

      if (i > 0) {
        pdf.addPage([w, h], w > h ? 'l' : 'p');
      }
      
      // A. Render Visual Layer (Image)
      const canvas = await html2canvasLib(el, {
        scale: 3, 
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: false,
        letterRendering: true,
        imageTimeout: 20000
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, w, h, undefined, 'FAST');

      // B. Render Text Layer (Invisible, Selectable)
      // This creates a "True PDF" where text can be selected and searched.
      if (structure.pages[i]) {
        // Ensure the correct font is set for each page
        if (activeFontName !== 'helvetica') {
            pdf.setFont(activeFontName);
        }

        const pageItems = structure.pages[i].items;
        pageItems.forEach((item) => {
          if (item.type === 'text') {
             // Approximate the font size. JS PDF text size is in points.
             // structure item.fontSize is also in points.
             pdf.setFontSize(item.fontSize);
             
             // Calculate line height for multiline text if needed, though structure usually has single lines/blocks.
             // We render invisibly.
             // Note: jsPDF y coordinate is the baseline. 
             // structure item.y is top-left. We add fontSize to approximate baseline.
             // Using a slight offset ensures the selection highlight roughly matches the visual text.
             pdf.text(item.text, item.x, item.y + (item.fontSize * 0.8), {
                 renderingMode: 'invisible',
                 charSpace: 0
             });
          }
        });
      }
    }
    
    if (save) {
      return pdf.save(filename);
    } else {
      return pdf.output('blob');
    }
  } finally {
    if (document.body.contains(wrap)) {
      document.body.removeChild(wrap);
    }
  }
}