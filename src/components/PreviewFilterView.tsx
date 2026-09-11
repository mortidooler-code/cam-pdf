import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Share2,
  Check,
  Printer,
  Contrast,
  Palette,
  Image as ImageIcon,
  ShieldCheck,
  Download,
  Crop,
  FileText,
  Layers,
  Plus,
  X,
  Camera,
  FolderOpen
} from 'lucide-react';
import { generatePdfDocument, downloadPdfBlob } from '../utils/pdfGenerator';

export type FilterId = 'photocopy' | 'bw' | 'vibrant' | 'original';

export interface WebBatchPage {
  id: string;
  rawImage: string;
  croppedImage: string;
  filterType: FilterId;
  processedImage?: string;
  title?: string;
}

interface PreviewFilterViewProps {
  docId: string;
  imageSrc?: string | null;
  pages?: WebBatchPage[];
  activePageIndex?: number;
  onSelectPage?: (index: number) => void;
  onRemovePage?: (index: number) => void;
  onAddPage?: (source: 'camera' | 'gallery') => void;
  onUpdatePageFilter?: (index: number, filter: FilterId, processedUrl: string) => void;
  onNavigateBack: () => void;
  onNavigateToCrop?: () => void;
  onShowToast: (message: string) => void;
}

interface FilterItem {
  id: FilterId;
  name: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const PreviewFilterView: React.FC<PreviewFilterViewProps> = ({
  docId: _docId,
  imageSrc,
  pages = [],
  activePageIndex = 0,
  onSelectPage,
  onRemovePage,
  onAddPage,
  onUpdatePageFilter,
  onNavigateBack,
  onNavigateToCrop,
  onShowToast
}) => {
  // صفحه فعال جاری
  const currentPage = pages[activePageIndex] || null;
  const currentBaseImage = currentPage?.croppedImage || imageSrc || null;

  const [activeFilter, setActiveFilter] = useState<FilterId>(currentPage?.filterType || 'photocopy');
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(currentPage?.processedImage || null);
  const [isProcessing, setIsProcessing] = useState(false);

  // دیالوگ‌های افزودن صفحه و صدور PDF
  const [showAddPageModal, setShowAddPageModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfTitle, setPdfTitle] = useState(`SmartDoc_${pages.length > 0 ? pages.length : 1}Pages`);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // همگام‌سازی فیلتر با تغییر صفحه فعال
  useEffect(() => {
    if (currentPage) {
      setActiveFilter(currentPage.filterType);
      if (currentPage.processedImage) {
        setProcessedImageUrl(currentPage.processedImage);
      }
    }
  }, [activePageIndex, currentPage]);

  const filters: FilterItem[] = [
    {
      id: 'photocopy',
      name: 'فتوکپی',
      desc: 'سفید کردن کاغذ، محو سایه‌ها و مشکی پررنگ کردن جوهر نوشته‌ها',
      icon: Printer
    },
    {
      id: 'bw',
      name: 'سیاه‌سفید اداری',
      desc: 'طیف خاکستری تمیز و استاندارد با کنتراست متعادل',
      icon: Contrast
    },
    {
      id: 'vibrant',
      name: 'رنگی شفاف',
      desc: 'افزایش اشباع و وضوح برای خواناتر شدن مهرهای رنگی',
      icon: Palette
    },
    {
      id: 'original',
      name: 'تصویر اصلی',
      desc: 'حالت اولیه عکس بدون اعمال فیلتر',
      icon: ImageIcon
    }
  ];

  // پردازش واقعی فیلترها روی تصویر صفحه فعال
  useEffect(() => {
    if (!currentBaseImage) {
      setProcessedImageUrl(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentBaseImage;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      if (activeFilter === 'original') {
        setProcessedImageUrl(currentBaseImage);
        if (onUpdatePageFilter && currentPage) {
          onUpdatePageFilter(activePageIndex, activeFilter, currentBaseImage);
        }
        return;
      }

      setIsProcessing(true);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];

        if (activeFilter === 'photocopy') {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const contrast = 2.8;
          const brightness = 42;
          let val = (gray - 128) * contrast + 128 + brightness;
          val = Math.max(0, Math.min(255, val));
          d[i] = val;
          d[i + 1] = val;
          d[i + 2] = val;
        } else if (activeFilter === 'bw') {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const contrast = 1.35;
          let val = (gray - 128) * contrast + 128;
          val = Math.max(0, Math.min(255, val));
          d[i] = val;
          d[i + 1] = val;
          d[i + 2] = val;
        } else if (activeFilter === 'vibrant') {
          const avg = (r + g + b) / 3;
          d[i] = Math.max(0, Math.min(255, avg + (r - avg) * 1.55 + 10));
          d[i + 1] = Math.max(0, Math.min(255, avg + (g - avg) * 1.55 + 10));
          d[i + 2] = Math.max(0, Math.min(255, avg + (b - avg) * 1.55 + 10));
        }
      }

      ctx.putImageData(imgData, 0, 0);
      const resultUrl = canvas.toDataURL('image/jpeg', 0.92);
      setProcessedImageUrl(resultUrl);
      setIsProcessing(false);

      if (onUpdatePageFilter && currentPage) {
        onUpdatePageFilter(activePageIndex, activeFilter, resultUrl);
      }
    };
  }, [currentBaseImage, activeFilter, activePageIndex]);

  const handleSave = () => {
    const current = filters.find((f) => f.id === activeFilter);
    if (processedImageUrl) {
      const a = document.createElement('a');
      a.href = processedImageUrl;
      a.download = `SmartDoc_Page${activePageIndex + 1}_${activeFilter}.jpg`;
      a.click();
    }
    onShowToast(`صفحه ${activePageIndex + 1} با فیلتر «${current?.name}» ذخیره شد.`);
  };

  const handleShare = () => {
    const current = filters.find((f) => f.id === activeFilter);
    if (navigator.share && processedImageUrl) {
      fetch(processedImageUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], 'document_scan.jpg', { type: 'image/jpeg' });
          navigator.share({
            title: 'مدرک اسکن‌شده',
            text: 'ارسال‌شده از اپلیکیشن اسکنر و فتوکپی هوشمند مدارک',
            files: [file]
          }).catch(() => {});
        });
    } else {
      onShowToast(`لینک اشتراک‌گذاری صفحه (${current?.name}) آماده گردید.`);
    }
  };

  // ایجاد و دانلود فایل استاندارد PDF چندصفحه‌ای (معادل Android PdfDocument API)
  const handleExportPdf = async (action: 'download' | 'share') => {
    setIsGeneratingPdf(true);
    try {
      const pagesToExport = pages.length > 0
        ? pages.map((p, idx) => ({
            title: `صفحه ${idx + 1}`,
            imageSrc: p.processedImage || p.croppedImage || currentBaseImage || ''
          }))
        : [
            {
              title: 'صفحه ۱',
              imageSrc: processedImageUrl || currentBaseImage || ''
            }
          ];

      const pdfBlob = await generatePdfDocument(pagesToExport, pdfTitle);
      setIsGeneratingPdf(false);
      setShowPdfModal(false);

      if (action === 'download') {
        downloadPdfBlob(pdfBlob, `${pdfTitle}.pdf`);
        onShowToast(`سند ${pagesToExport.length} صفحه‌ای با فرمت استاندارد PDF دانلود شد.`);
      } else {
        if (navigator.share && navigator.canShare) {
          const pdfFile = new File([pdfBlob], `${pdfTitle}.pdf`, { type: 'application/pdf' });
          if (navigator.canShare({ files: [pdfFile] })) {
            await navigator.share({
              title: pdfTitle,
              text: `سند چندصفحه‌ای اسکن‌شده (${pagesToExport.length} صفحه)`,
              files: [pdfFile]
            });
            onShowToast('فایل PDF ارسال گردید.');
            return;
          }
        }
        downloadPdfBlob(pdfBlob, `${pdfTitle}.pdf`);
        onShowToast(`فایل PDF آماده و دانلود گردید.`);
      }
    } catch (err) {
      setIsGeneratingPdf(false);
      onShowToast('خطا در ایجاد فایل سند PDF');
      console.error(err);
    }
  };

  // سبک‌های بصری شبیه‌ساز سند نمونه در صورت نبود تصویر
  const getDocumentStyle = () => {
    switch (activeFilter) {
      case 'photocopy':
        return {
          paperBg: 'bg-white',
          textColor: 'text-black',
          subTextColor: 'text-black font-semibold',
          borderColor: 'border-black',
          stampBg: 'border-black text-black',
          filterName: 'فتوکپی پرکنتراست (کاغذ کاملاً سفید)'
        };
      case 'bw':
        return {
          paperBg: 'bg-slate-100',
          textColor: 'text-slate-800',
          subTextColor: 'text-slate-600',
          borderColor: 'border-slate-400',
          stampBg: 'border-slate-700 text-slate-700',
          filterName: 'سیاه‌سفید اداری (Grayscale)'
        };
      case 'vibrant':
        return {
          paperBg: 'bg-stone-50',
          textColor: 'text-slate-900',
          subTextColor: 'text-slate-700',
          borderColor: 'border-slate-300',
          stampBg: 'border-red-600 text-red-600 bg-red-50/50',
          filterName: 'رنگی شفاف و بهبودیافته (Enhanced Color)'
        };
      case 'original':
      default:
        return {
          paperBg: 'bg-[#ede6d8]',
          textColor: 'text-[#42392d]',
          subTextColor: 'text-[#635748]',
          borderColor: 'border-[#c4b9a7]',
          stampBg: 'border-[#8c2d2d] text-[#8c2d2d]',
          filterName: 'عکس اصلی (بدون افکت)'
        };
    }
  };

  const docStyle = getDocumentStyle();

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white select-none overflow-hidden relative">
      {/* Top App Bar */}
      <header className="bg-slate-900/90 backdrop-blur-sm border-b border-slate-800 px-3 py-2.5 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onNavigateBack}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-200 transition-colors flex items-center gap-1"
            title="بازگشت"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <span className="font-bold text-sm text-slate-100 block leading-tight">پیش‌نمایش سند</span>
            {pages.length > 1 && (
              <span className="text-[10px] text-blue-400 font-medium">
                صفحه {activePageIndex + 1} از {pages.length} • اسکن دسته‌ای
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* دکمه برجسته خروجی PDF */}
          <button
            onClick={() => {
              setPdfTitle(`SmartDoc_${pages.length > 0 ? pages.length : 1}Pages`);
              setShowPdfModal(true);
            }}
            className="relative p-2 rounded-xl bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-rose-400 transition-all flex items-center gap-1 text-xs font-bold"
            title="خروجی PDF چندصفحه‌ای"
          >
            <FileText className="w-4 h-4 text-rose-400" />
            <span className="text-[11px] font-black text-rose-300">PDF</span>
            {pages.length > 1 && (
              <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                {pages.length}
              </span>
            )}
          </button>

          {onNavigateToCrop && (
            <button
              onClick={onNavigateToCrop}
              className="p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="تنظیم کادر برش صفحه فعلی"
            >
              <Crop className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleShare}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="اشتراک‌گذاری تصویر"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-md shadow-blue-600/30 transition-all"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>ذخیره</span>
          </button>
        </div>
      </header>

      {/* Batch Pages Carousel Bar (نوار مدیریت صفحات دسته‌ای) */}
      {pages.length > 0 && (
        <div className="bg-slate-950/80 border-b border-slate-800/80 px-3 py-2 shrink-0 z-10">
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <div className="flex items-center gap-1.5 text-slate-300 text-xs font-bold">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>صفحات سند ({pages.length} صفحه)</span>
            </div>

            <button
              onClick={() => {
                setPdfTitle(`SmartDoc_${pages.length}Pages`);
                setShowPdfModal(true);
              }}
              className="text-[11px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 py-0.5 px-2 rounded-lg bg-rose-950/40 border border-rose-800/50"
            >
              <FileText className="w-3 h-3" />
              <span>ادغام به PDF</span>
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {pages.map((page, idx) => {
              const isSelected = idx === activePageIndex;
              const thumbSrc = page.processedImage || page.croppedImage;

              return (
                <div
                  key={page.id || idx}
                  onClick={() => onSelectPage && onSelectPage(idx)}
                  className={`relative shrink-0 w-12 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-400/40 scale-105 shadow-md shadow-blue-500/20'
                      : 'border-slate-700 hover:border-slate-500 opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={thumbSrc} alt={`صفحه ${idx + 1}`} className="w-full h-full object-cover bg-white" />

                  {/* شماره صفحه */}
                  <span className={`absolute bottom-0 right-0 px-1 py-0.2 text-[9px] font-black rounded-tl ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-black/70 text-slate-200'
                  }`}>
                    {idx + 1}
                  </span>

                  {/* دکمه حذف صفحه (اگر بیش از یک صفحه باشد) */}
                  {pages.length > 1 && onRemovePage && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemovePage(idx);
                      }}
                      className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center transition-colors"
                      title="حذف صفحه"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              );
            })}

            {/* دکمه افزودن صفحه جدید */}
            <button
              onClick={() => setShowAddPageModal(true)}
              className="shrink-0 w-12 h-16 rounded-lg border-2 border-dashed border-slate-700 hover:border-blue-500 bg-slate-900/60 hover:bg-blue-600/10 flex flex-col items-center justify-center text-slate-400 hover:text-blue-400 transition-all cursor-pointer"
              title="افزودن صفحه جدید به بسته سند"
            >
              <Plus className="w-5 h-5 mb-0.5" />
              <span className="text-[8px] font-bold">+ صفحه</span>
            </button>
          </div>
        </div>
      )}

      {/* Center Framed Document Preview */}
      <div className="flex-1 overflow-hidden p-3 flex flex-col items-center justify-center bg-slate-950/60 relative">
        {/* Filter status pill tag */}
        <div className="absolute top-2 z-10 bg-slate-800/90 backdrop-blur-md border border-slate-700/60 px-3 py-1 rounded-full text-[11px] font-medium text-slate-300 flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span>{docStyle.filterName}</span>
        </div>

        {/* Display real image or sample document */}
        {processedImageUrl ? (
          <div className="w-full max-w-[300px] aspect-[1/1.38] rounded-xl overflow-hidden shadow-2xl border border-slate-700/80 bg-black flex items-center justify-center relative">
            <img
              src={processedImageUrl}
              alt="سند پردازش شده"
              className="w-full h-full object-contain"
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-xs">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        ) : (
          <div
            className={`w-full max-w-[300px] aspect-[1/1.38] rounded-md shadow-2xl p-4 flex flex-col justify-between transition-colors duration-200 border ${docStyle.paperBg} ${docStyle.borderColor} ${docStyle.textColor}`}
          >
            <div>
              <div className="flex items-start justify-between border-b pb-2 mb-2">
                <div>
                  <p className="text-[10px] tracking-wide font-bold">جمهوری اسلامی ایران</p>
                  <h4 className="text-xs font-extrabold mt-0.5">سند هویت و مدارک رسمی</h4>
                  <p className="text-[8.5px] opacity-75 mt-0.5">شناسه ثبتی: ۹۸۲۷۱-الف</p>
                </div>
                <div
                  className={`w-10 h-10 rounded-full border-2 border-dashed flex flex-col items-center justify-center text-[7px] font-black leading-tight rotate-[-8deg] ${docStyle.stampBg}`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 mb-0.5" />
                  <span>مهر تأیید</span>
                </div>
              </div>
              <div className="space-y-1 opacity-90 text-[9.5px] leading-relaxed">
                <p>بدین‌وسیله گواهی می‌شود مدارک هویتی پیوست طبق استعلام سامانه جامع تطبیق داده شده و صحت آن مورد تأیید است.</p>
              </div>
            </div>

            <div className={`border rounded p-2 text-[8.5px] space-y-1 my-1.5 ${docStyle.borderColor}`}>
              <div className="flex justify-between">
                <span className={docStyle.subTextColor}>نام صاحب سند:</span>
                <span className="font-bold">مرتضی محمدی</span>
              </div>
              <div className="flex justify-between">
                <span className={docStyle.subTextColor}>شماره ملی:</span>
                <span className="font-bold font-mono">۰۰۱۲۳۴۵۶۷۸</span>
              </div>
              <div className="flex justify-between">
                <span className={docStyle.subTextColor}>تاریخ صدور:</span>
                <span className="font-bold">۱۴۰۳/۰۶/۲۰</span>
              </div>
            </div>

            <div className="pt-1.5 border-t flex items-end justify-between">
              <div className="space-y-0.5">
                <div className="h-3 flex items-center gap-[2px]">
                  {[4, 2, 6, 1, 4, 2, 7, 3, 2, 5, 2, 4].map((w, idx) => (
                    <span key={idx} className="h-full bg-current block" style={{ width: `${w}px` }} />
                  ))}
                </div>
                <p className="text-[7px] font-mono">DOC-89412-IR</p>
              </div>
              <div className="text-left">
                <p className="text-[7.5px] font-bold">امضای مسئول صدور</p>
                <div className="w-12 h-4 border-b border-dotted border-current"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Live Filter Selector Toolbar */}
      <footer className="bg-slate-900 border-t border-slate-800 p-2.5 shrink-0 z-10">
        <p className="text-[11px] text-center text-blue-400 font-medium mb-2 truncate px-2">
          {filters.find((f) => f.id === activeFilter)?.desc}
        </p>

        <div className="grid grid-cols-4 gap-2">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const isSelected = activeFilter === filter.id;

            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex flex-col items-center py-2 px-1 rounded-2xl transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-102 ring-2 ring-blue-400/40'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1 transition-colors ${
                    isSelected ? 'bg-white/20' : 'bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold tracking-tight whitespace-nowrap">
                  {filter.name}
                </span>
              </button>
            );
          })}
        </div>
      </footer>

      {/* Modal افزودن صفحه جدید */}
      {showAddPageModal && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-[310px] shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">افزودن صفحه جدید به بسته</h3>
              <p className="text-xs text-slate-400 mt-1">روش افزودن صفحه بعدی سند را انتخاب کنید:</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => {
                  setShowAddPageModal(false);
                  if (onAddPage) onAddPage('camera');
                }}
                className="p-3.5 bg-slate-800 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-slate-200 hover:text-white group cursor-pointer"
              >
                <Camera className="w-6 h-6 text-blue-400 group-hover:text-white" />
                <span className="text-xs font-bold">دوربین (اسکن)</span>
              </button>

              <button
                onClick={() => {
                  setShowAddPageModal(false);
                  if (onAddPage) onAddPage('gallery');
                }}
                className="p-3.5 bg-slate-800 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-slate-200 hover:text-white group cursor-pointer"
              >
                <FolderOpen className="w-6 h-6 text-teal-400 group-hover:text-white" />
                <span className="text-xs font-bold">گالری تصاویر</span>
              </button>
            </div>

            <button
              onClick={() => setShowAddPageModal(false)}
              className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              انصراف
            </button>
          </div>
        </div>
      )}

      {/* Modal صدور و ادغام فایل PDF با موتور معادل Android PdfDocument API */}
      {showPdfModal && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-[320px] shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-600/20 text-rose-400 rounded-2xl flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100">صدور سند چندصفحه‌ای PDF</h3>
                <p className="text-[11px] text-slate-400">
                  {pages.length > 0 ? `${pages.length} صفحه آماده ادغام در فرمت A4` : '۱ صفحه آماده صدور PDF'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1 font-medium">نام فایل PDF</label>
              <input
                type="text"
                value={pdfTitle}
                onChange={(e) => setPdfTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-mono text-left"
                placeholder="نام سند"
              />
            </div>

            <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80 text-[10px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>تعداد صفحات سند:</span>
                <span className="font-bold text-slate-200">{pages.length > 0 ? pages.length : 1} صفحه</span>
              </div>
              <div className="flex justify-between">
                <span>موتور تولید PDF:</span>
                <span className="font-bold text-rose-400">Android PdfDocument Native API</span>
              </div>
              <div className="flex justify-between">
                <span>استاندارد خروجی:</span>
                <span className="font-bold text-slate-200">ISO A4 (595x842 pt)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                disabled={isGeneratingPdf}
                onClick={() => handleExportPdf('download')}
                className="py-2.5 px-3 bg-rose-600 hover:bg-rose-500 active:scale-95 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isGeneratingPdf ? 'تولید PDF...' : 'دانلود فایل'}</span>
              </button>

              <button
                disabled={isGeneratingPdf}
                onClick={() => handleExportPdf('share')}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-50 text-slate-200 hover:text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>اشتراک‌گذاری</span>
              </button>
            </div>

            <button
              disabled={isGeneratingPdf}
              onClick={() => setShowPdfModal(false)}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-200 pt-1 cursor-pointer"
            >
              بستن
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
