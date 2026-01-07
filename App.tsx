
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { extractDocumentStructure, generatePdfFromStructure, renderStructureToElement } from './services/pdfService';
import { translatePdfStructure, detectLanguageFromStructure } from './services/geminiService';
import { 
  TranslationState, 
  SUPPORTED_LANGUAGES, 
  TranslationStyle, 
  PdfFont, 
  PdfFontSize, 
  PdfLineSpacing,
  PdfStructure
} from './types';

const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB

/**
 * Component for rendering the inline PDF preview.
 * Includes auto-scaling logic to fit large documents onto mobile screens.
 * Uses ResizeObserver for robust layout detection and CSS Transforms for cross-browser scaling.
 * Now supports Single Page View (Pagination) vs Scroll View.
 */
const InlinePreview: React.FC<{
  structure: PdfStructure;
  font: PdfFont;
  fontSize: PdfFontSize;
  lineSpacing: PdfLineSpacing;
}> = ({ structure, font, fontSize, lineSpacing }) => {
  const [viewMode, setViewMode] = useState<'single' | 'scroll'>('single');
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.0); // 1.0 = Fit to Width of container
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);

  const totalPages = structure.pages.length;

  // Determine which pages to render based on view mode
  const displayStructure = useMemo(() => {
    if (viewMode === 'scroll') return structure;
    // Ensure currentPage is valid
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    return {
      pages: [structure.pages[safePage - 1]]
    };
  }, [structure, viewMode, currentPage, totalPages]);

  // Reset to page 1 when structure changes (e.g. new file)
  useEffect(() => {
    setCurrentPage(1);
    setZoom(1.0);
  }, [structure]);

  // 1. Render Content (Heavy Operation)
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      renderStructureToElement(
        containerRef.current, 
        displayStructure, 
        font, 
        fontSize, 
        lineSpacing, 
        false,
        false,
        3.0 // Render at 300% size for print-quality sharpness
      );
    }
  }, [displayStructure, font, fontSize, lineSpacing]);

  // 2. Auto-Scaling Logic (Visual Presentation + Scroll Support)
  useEffect(() => {
    const container = containerRef.current;
    const wrapper = wrapperRef.current;
    const spacer = spacerRef.current;
    if (!container || !wrapper || !spacer) return;

    const calculateScale = () => {
      const firstPage = container.querySelector('.pdf-page-canvas-item') as HTMLElement;
      if (!firstPage) return;

      const naturalWidth = firstPage.offsetWidth;
      // Use standard padding allowance
      const availableWidth = wrapper.clientWidth - 32; 

      // 1. Calculate the "Fit Width" scale base
      let baseScale = availableWidth / naturalWidth;
      // Prevent it from auto-upscaling tiny docs too much, but allow downsizing
      baseScale = Math.min(1.0, baseScale);

      // 2. Apply User Zoom
      const finalScale = baseScale * zoom;

      // 3. Apply Transform
      container.style.transform = `scale(${finalScale})`;
      container.style.transformOrigin = 'top left'; // Top-Left origin allows easier scrolling logic
      
      // 4. Update Spacer dimensions to force scrollbars on wrapper
      const visualWidth = naturalWidth * finalScale;
      const naturalHeight = container.scrollHeight;
      const visualHeight = naturalHeight * finalScale;

      spacer.style.width = `${visualWidth}px`;
      spacer.style.height = `${visualHeight}px`;
      
      // Center the spacer if it's smaller than the wrapper
      if (visualWidth < availableWidth) {
         spacer.style.marginLeft = `${(availableWidth - visualWidth) / 2}px`;
      } else {
         spacer.style.marginLeft = '0px';
      }
    };

    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(calculateScale);
    });

    observer.observe(wrapper);
    calculateScale(); // Initial call

    return () => observer.disconnect();
  }, [displayStructure, zoom]); 

  // Handlers for navigation
  const goToNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));
  const goToPrev = () => setCurrentPage(p => Math.max(1, p - 1));

  // Zoom Handlers
  const zoomIn = () => setZoom(z => Math.min(3.0, z + 0.25));
  const zoomOut = () => setZoom(z => Math.max(0.5, z - 0.25));

  return (
    <div className="w-full flex flex-col items-center gap-6 relative">
      
      {/* Responsive Collapsible Toolbar */}
      <div className={`
         bg-white/90 backdrop-blur-xl border border-slate-200/60 shadow-lg rounded-2xl 
         transition-all duration-300 ease-in-out z-50 sticky top-4
         ${isMobileMenuOpen ? 'p-4 w-[95%] max-w-lg' : 'px-4 py-2 w-auto max-w-full'}
       `}>
          {/* Header / Condensed View */}
          <div className="flex items-center justify-between gap-4">
             <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Preview</span>
                {/* Mobile: Show simplistic page count if collapsed */}
                {!isMobileMenuOpen && viewMode === 'single' && (
                  <span className="md:hidden text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {currentPage}/{totalPages}
                  </span>
                )}
             </div>

             {/* Mobile Menu Toggle */}
             <button 
               className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
               onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
               aria-label="Toggle Preview Controls"
             >
               {isMobileMenuOpen ? (
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               ) : (
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> 
               )}
             </button>

             {/* Desktop Controls (Always Visible on MD+) */}
             <div className="hidden md:flex items-center gap-4">
                {/* Zoom Controls */}
                <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200/50 p-0.5">
                   <button onClick={zoomOut} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-slate-500 hover:text-orange-600 transition-all"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg></button>
                   <span className="w-12 text-center text-[10px] font-bold text-slate-600">{Math.round(zoom * 100)}%</span>
                   <button onClick={zoomIn} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-slate-500 hover:text-orange-600 transition-all"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></button>
                </div>

                <div className="h-4 w-px bg-slate-300"></div>

                {/* View Mode */}
                <div className="flex bg-slate-50 rounded-lg p-0.5 border border-slate-200/50">
                    <button onClick={() => setViewMode('single')} className={`p-1.5 rounded transition-all ${viewMode === 'single' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></button>
                    <button onClick={() => setViewMode('scroll')} className={`p-1.5 rounded transition-all ${viewMode === 'scroll' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg></button>
                </div>

                {/* Pagination */}
                {viewMode === 'single' && (
                  <>
                    <div className="h-4 w-px bg-slate-300"></div>
                    <div className="flex items-center gap-1">
                        <button onClick={goToPrev} disabled={currentPage === 1} className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-orange-100 text-slate-600 disabled:opacity-30 disabled:hover:bg-slate-100 transition-all">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <span className="text-[10px] font-black text-slate-700 w-12 text-center tabular-nums">{currentPage} / {totalPages}</span>
                        <button onClick={goToNext} disabled={currentPage === totalPages} className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-orange-100 text-slate-600 disabled:opacity-30 disabled:hover:bg-slate-100 transition-all">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                  </>
                )}
             </div>
          </div>

          {/* Mobile Collapsible Content */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-slate-100 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
               {/* Mobile Zoom */}
               <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Zoom Level</span>
                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl">
                      <button onClick={zoomOut} className="w-8 h-8 bg-white shadow-sm rounded-lg flex items-center justify-center text-slate-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg></button>
                      <span className="font-bold text-slate-700">{Math.round(zoom * 100)}%</span>
                      <button onClick={zoomIn} className="w-8 h-8 bg-white shadow-sm rounded-lg flex items-center justify-center text-slate-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></button>
                  </div>
               </div>
               
               {/* Mobile View Mode */}
               <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Layout</span>
                  <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => { setViewMode('single'); setIsMobileMenuOpen(false); }} className={`p-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${viewMode === 'single' ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-500/20' : 'bg-slate-50 text-slate-600'}`}>
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                         Single Page
                      </button>
                      <button onClick={() => { setViewMode('scroll'); setIsMobileMenuOpen(false); }} className={`p-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${viewMode === 'scroll' ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-500/20' : 'bg-slate-50 text-slate-600'}`}>
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                         Continuous
                      </button>
                  </div>
               </div>

               {/* Mobile Pagination */}
               {viewMode === 'single' && (
                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl">
                      <button onClick={goToPrev} disabled={currentPage === 1} className="w-10 h-10 bg-white shadow-sm rounded-lg flex items-center justify-center text-slate-600 disabled:opacity-30"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                      <span className="font-bold text-slate-700">{currentPage} of {totalPages}</span>
                      <button onClick={goToNext} disabled={currentPage === totalPages} className="w-10 h-10 bg-white shadow-sm rounded-lg flex items-center justify-center text-slate-600 disabled:opacity-30"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                  </div>
               )}
            </div>
          )}
      </div>

      <div ref={wrapperRef} className="w-full relative flex justify-start min-h-[60vh] overflow-auto pb-8 scrollbar-hide">
        {/* Spacer forces the wrapper to have scrollbars when zoomed in */}
        <div ref={spacerRef} className="relative transition-all duration-200">
           <div 
             ref={containerRef} 
             className="flex flex-col items-center gap-8 will-change-transform transition-transform duration-200 ease-out origin-top-left"
             style={{ width: 'fit-content' }} 
           />
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [targetLanguage, setTargetLanguage] = useState('Hindi');
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [detectedConfidence, setDetectedConfidence] = useState<number | null>(null);
  const [translationStyle, setTranslationStyle] = useState<TranslationStyle>('Formal');
  
  const [exportFont, setExportFont] = useState<PdfFont>('helvetica');
  const [exportFontSize, setExportFontSize] = useState<PdfFontSize>(12);
  const [exportLineSpacing, setExportLineSpacing] = useState<PdfLineSpacing>(1.5);
  const [outputFilename, setOutputFilename] = useState('');

  const [state, setState] = useState<TranslationState>({ isProcessing: false, progress: 0, status: 'Ready', error: null });
  const [sourceStructure, setSourceStructure] = useState<PdfStructure | null>(null);
  const [translatedStructure, setTranslatedStructure] = useState<PdfStructure | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'upload' | 'processing' | 'result'>('upload');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > MAX_FILE_SIZE) {
        setState(prev => ({ ...prev, error: 'File too large (Max 30MB).' }));
        return;
      }
      setFile(selectedFile);
      setTranslatedStructure(null);
      setDetectedLanguage(null);
      setDetectedConfidence(null);
      setSourceStructure(null);
      setState(prev => ({ ...prev, error: null, status: 'Detecting Language...' }));

      try {
        const struct = await extractDocumentStructure(selectedFile);
        setSourceStructure(struct);
        const { language, confidence } = await detectLanguageFromStructure(struct);
        setDetectedLanguage(language);
        setDetectedConfidence(confidence);
        setState(prev => ({ ...prev, status: 'File Selected' }));
      } catch (err: any) {
        console.warn("Language detection warning:", err);
        // Fallback to allow manual proceed without detection
        setState(prev => ({ ...prev, status: 'File Selected' })); 
      }
    }
  };

  const startTranslation = async () => {
    if (!file) return;
    setStep('processing');
    setState({ isProcessing: true, progress: 0, status: 'Analyzing Document...', error: null });

    try {
      let struct = sourceStructure;
      // Fallback if structure wasn't captured during upload
      if (!struct) {
        struct = await extractDocumentStructure(file);
        setSourceStructure(struct);
      }
      
      // Retry detection if it wasn't done
      if (!detectedLanguage) {
         const { language, confidence } = await detectLanguageFromStructure(struct);
         setDetectedLanguage(language);
         setDetectedConfidence(confidence);
      }
      
      const translated = await translatePdfStructure(struct, targetLanguage, translationStyle, (p) => {
        setState(prev => ({ ...prev, progress: p, status: `Translating to ${targetLanguage}...` }));
      });

      setTranslatedStructure(translated);
      setOutputFilename(`Translated_${targetLanguage}_${file.name.split('.')[0]}`);
      setStep('result');
      setState({ isProcessing: false, progress: 100, status: 'Completed', error: null });
    } catch (err: any) {
      setState({ isProcessing: false, progress: 0, status: 'Failed', error: err.message || 'Error occurred.' });
      setStep('upload');
    }
  };

  const handleDownload = async () => {
    if (!translatedStructure) return;
    setState(prev => ({ ...prev, isProcessing: true, status: 'Generating High-Fidelity PDF...' }));
    try {
      await generatePdfFromStructure(
        translatedStructure, 
        `${outputFilename}.pdf`, 
        exportFont, 
        exportFontSize, 
        exportLineSpacing, 
        targetLanguage // Pass the target language for optimized font loading
      );
    } catch (err: any) {
      setState(prev => ({ ...prev, error: 'Failed to generate PDF.' }));
    } finally {
      setState(prev => ({ ...prev, isProcessing: false, status: 'Completed' }));
    }
  };

  const handleShare = async () => {
    if (!translatedStructure) return;
    setState(prev => ({ ...prev, isProcessing: true, status: 'Preparing for Share...' }));
    
    try {
        const blob = await generatePdfFromStructure(
            translatedStructure, 
            `${outputFilename}.pdf`, 
            exportFont, 
            exportFontSize, 
            exportLineSpacing, 
            targetLanguage, // Pass the target language here too
            false // Do not save automatically, get blob
        );

        const fileToShare = new File([blob], `${outputFilename}.pdf`, { type: 'application/pdf' });

        if (navigator.share && navigator.canShare({ files: [fileToShare] })) {
            await navigator.share({
                files: [fileToShare],
                title: 'Translated Document',
                text: `Here is the translated PDF: ${outputFilename}`
            });
            setState(prev => ({ ...prev, isProcessing: false, status: 'Shared Successfully' }));
        } else {
            // Fallback for desktop or unsupported browsers
            setState(prev => ({ ...prev, isProcessing: false, error: 'Sharing not supported on this device. Downloading instead.' }));
            // Fallback to auto-download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${outputFilename}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        }
    } catch (err: any) {
        // AbortError happens if user cancels share sheet, which is fine
        if (err.name !== 'AbortError') {
             setState(prev => ({ ...prev, isProcessing: false, error: 'Share failed. Try downloading.' }));
        } else {
             setState(prev => ({ ...prev, isProcessing: false, status: 'Completed' }));
        }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-orange-100 p-4 sm:p-6">
      <div className={`mx-auto py-8 sm:py-12 ${step === 'result' ? 'max-w-7xl' : 'max-w-6xl'}`}>
        <header className="flex items-center justify-between mb-12 sm:mb-16 px-2 sm:px-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">GoPal<span className="text-orange-600">PDF Translator</span></h1>
              <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-slate-400">Intelligent Document Suite</p>
              <p className="text-[10px] sm:text-xs font-black text-center text-slate-300 mt-1">⭕❗⭕</p>
            </div>
          </div>
        </header>

        {step === 'upload' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-7 space-y-8">
              <div className="bg-white p-8 sm:p-12 rounded-[3rem] border border-slate-100 shadow-2xl relative overflow-hidden group">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight mb-4">Translate any document, <span className="text-orange-600">perfectly mirrored.</span></h2>
                <div 
                  onClick={() => state.status !== 'Detecting Language...' && fileInputRef.current?.click()}
                  className={`relative border-4 border-dashed rounded-[2.5rem] p-8 sm:p-12 transition-all cursor-pointer ${file ? 'border-orange-500 bg-orange-50' : 'border-slate-100 hover:border-orange-300'}`}
                >
                  <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx" onChange={handleFileChange} />
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[2rem] flex items-center justify-center mb-6 ${file ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    </div>
                    {file ? (
                      <div className="flex flex-col items-center">
                        <p className="text-lg sm:text-xl font-black mb-2">{file.name}</p>
                        <div className="min-h-[24px]">
                          {state.status === 'Detecting Language...' ? (
                            <span className="text-orange-500 text-xs font-black uppercase tracking-widest animate-pulse">Detecting Language...</span>
                          ) : detectedLanguage ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                Detected: {detectedLanguage}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs font-bold">Ready to translate</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 font-bold text-sm sm:text-base">Tap to upload PDF or DOCX</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Target Language</label>
                  <div className="relative">
                    <select 
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl p-4 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.name}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
                <button 
                    onClick={startTranslation} 
                    disabled={!file || state.status === 'Detecting Language...'} 
                    className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-sm shadow-xl hover:bg-orange-600 disabled:opacity-30 disabled:hover:bg-slate-900 transition-all"
                >
                    Start Translation
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-8">
            <div className="w-32 h-32 relative">
              <div className="absolute inset-0 border-8 border-slate-100 rounded-full" />
              <div className="absolute inset-0 border-8 border-orange-600 rounded-full border-t-transparent animate-spin" />
            </div>
            <h2 className="text-4xl font-black text-slate-900">{state.status}</h2>
            <div className="w-full max-w-md h-4 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-600 transition-all duration-500" style={{ width: `${state.progress}%` }} />
            </div>
          </div>
        )}

        {step === 'result' && translatedStructure && (
          <div className="animate-in fade-in duration-700 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
              <button onClick={() => setStep('upload')} className="flex items-center gap-2 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-orange-600 self-start sm:self-auto">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg> Back
              </button>
            </div>

            {/* Language Summary Banner */}
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-orange-900 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-orange-200 text-orange-800 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md">Source</div>
                    <span className="font-bold text-base">{detectedLanguage || 'Unknown'}</span>
                    {detectedConfidence && <span className="text-orange-400 text-xs font-medium">({Math.round(detectedConfidence * 100)}% Match)</span>}
                </div>
                <div className="hidden sm:block h-px w-8 bg-orange-200"></div>
                <div className="flex items-center gap-3">
                    <div className="bg-orange-200 text-orange-800 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md">Target</div>
                    <span className="font-bold text-base">{targetLanguage}</span>
                </div>
            </div>

            {/* Preview Area with Workspace Background */}
            <div className="bg-slate-200/80 rounded-[2rem] p-4 sm:p-10 min-h-[60vh] shadow-inner relative flex justify-center border-4 border-slate-100/50 backdrop-blur-sm"
                 style={{ backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
              <div id="inline-preview-wrap" className="w-full flex flex-col items-center">
                <InlinePreview 
                  structure={translatedStructure} 
                  font={exportFont} 
                  fontSize={exportFontSize} 
                  lineSpacing={exportLineSpacing} 
                />
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-8 pb-20 sm:pb-8">
                {/* Share Button */}
                <button onClick={handleShare} className="w-full sm:w-auto px-8 py-4 bg-orange-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-orange-600 transition-all flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    Share PDF
                </button>
                {/* Download Button */}
                <button onClick={handleDownload} className="w-full sm:w-auto px-8 py-4 bg-orange-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-orange-800 transition-all flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download PDF
                </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default App;
