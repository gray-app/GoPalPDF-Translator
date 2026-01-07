
export interface TranslationState {
  isProcessing: boolean;
  progress: number;
  status: string;
  error: string | null;
}

export type TranslationStyle = 'Formal' | 'Informal' | 'Simplified' | 'Technical' | 'Linguistic';

export type PdfFont = 'helvetica' | 'times' | 'courier';
export type PdfFontSize = 10 | 12 | 14 | 16;
export type PdfLineSpacing = 1.2 | 1.5 | 1.8 | 2.0;

export interface PdfTextItem {
  type: 'text';
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  isBold?: boolean;
  letterSpacing?: number;
  // Enhanced structural hints
  isParagraphStart?: boolean;
  indent?: number;
  alignment?: 'left' | 'center' | 'right' | 'justify';
}

export interface PdfImageItem {
  type: 'image';
  data: string; // base64
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfPathItem {
  type: 'path';
  method: 'rect' | 'line';
  x: number;
  y: number;
  width: number;
  height: number;
  lineWidth: number;
  strokeColor?: string;
}

export interface PdfTableCell {
  text: string;
  isHeader?: boolean;
  colSpan?: number;
  rowSpan?: number;
  align?: 'left' | 'center' | 'right';
}

export interface PdfTableRow {
  cells: PdfTableCell[];
}

export interface PdfTableItem {
  type: 'table';
  rows: PdfTableRow[];
  x: number;
  y: number;
  width: number;
  height: number;
  hasBorders: boolean;
}

export interface PdfPage {
  items: (PdfTextItem | PdfImageItem | PdfPathItem | PdfTableItem)[];
  width: number;
  height: number;
}

export interface PdfStructure {
  pages: PdfPage[];
}

export const SUPPORTED_LANGUAGES = [
  { code: 'hi', name: 'Hindi', region: 'India', category: 'Indic' },
  { code: 'bn', name: 'Bengali', region: 'India/Bangladesh', category: 'Indic' },
  { code: 'mr', name: 'Marathi', region: 'India', category: 'Indic' },
  { code: 'te', name: 'Telugu', region: 'India', category: 'Indic' },
  { code: 'ta', name: 'Tamil', region: 'India/Sri Lanka', category: 'Indic' },
  { code: 'gu', name: 'Gujarati', region: 'India', category: 'Indic' },
  { code: 'ur', name: 'Urdu', region: 'India/Pakistan', category: 'Indic' },
  { code: 'kn', name: 'Kannada', region: 'India', category: 'Indic' },
  { code: 'or', name: 'Odia', region: 'India', category: 'Indic' },
  { code: 'ml', name: 'Malayalam', region: 'India', category: 'Indic' },
  { code: 'pa', name: 'Punjabi', region: 'India/Pakistan', category: 'Indic' },
  { code: 'as', name: 'Assamese', region: 'India', category: 'Indic' },
  { code: 'ma', name: 'Maithili', region: 'India', category: 'Indic' },
  { code: 'sa', name: 'Sanskrit', region: 'India', category: 'Indic' },
  { code: 'ks', name: 'Kashmiri', region: 'India', category: 'Indic' },
  { code: 'ko', name: 'Konkani', region: 'India', category: 'Indic' },
  { code: 'ne', name: 'Nepali', region: 'India/Nepal', category: 'Indic' },
  { code: 'sd', name: 'Sindhi', region: 'India/Pakistan', category: 'Indic' },
  { code: 'mn', name: 'Manipuri', region: 'India', category: 'Indic' },
  { code: 'bo', name: 'Bodo', region: 'India', category: 'Indic' },
  { code: 'do', name: 'Dogri', region: 'India', category: 'Indic' },
  { code: 'st', name: 'Santali', region: 'India', category: 'Indic' },
  { code: 'en', name: 'English', region: 'Global', category: 'Global' },
  { code: 'es', name: 'Spanish', region: 'Global', category: 'Global' },
  { code: 'fr', name: 'French', region: 'Global', category: 'Global' },
  { code: 'de', name: 'German', region: 'Global', category: 'Global' },
  { code: 'it', name: 'Italian', region: 'Global', category: 'Global' },
  { code: 'zh', name: 'Chinese', region: 'Global', category: 'Global' },
  { code: 'ja', name: 'Japanese', region: 'Global', category: 'Global' },
  { code: 'ko', name: 'Korean', region: 'Global', category: 'Global' },
  { code: 'ru', name: 'Russian', region: 'Global', category: 'Global' },
  { code: 'ar', name: 'Arabic', region: 'Global', category: 'Global' },
];

export const TRANSLATION_STYLES: { value: TranslationStyle; label: string; desc: string }[] = [
  { value: 'Formal', label: 'Formal/Official', desc: 'Respectful grammar (Aap/Ji)' },
  { value: 'Informal', label: 'Casual/Native', desc: 'Regional spoken phrasing' },
  { value: 'Simplified', label: 'Easy Read', desc: 'Simple plain vocabulary' },
  { value: 'Technical', label: 'Precision', desc: 'Strict field terminology' },
  { value: 'Linguistic', label: 'Pro-Indic', desc: 'Native script optimization' },
];
