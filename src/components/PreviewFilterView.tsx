import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Share2, Check, Printer, Contrast, Palette, Image as ImageIcon, ShieldCheck, Download } from 'lucide-react';

interface PreviewFilterViewProps {
  docId: string;
  imageSrc?: string | null;
  onNavigateBack: () => void;
  onShowToast: (message: string) => void;
}

export type FilterId = 'photocopy' | 'bw' | 'vibrant' | 'original';

interface FilterItem {
  id: FilterId;
  name: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const PreviewFilterView: React.FC<PreviewFilterViewProps> = ({
  docId: _docId,
  imageSrc,
  onNavigateBack,
  onShowToast
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterId>('photocopy');
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // پردازش واقعی فیلترها روی تصویر انتخاب‌شده
  useEffect(() => {
    if (!imageSrc) {
      setProcessedImageUrl(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      if (activeFilter === 'original') {
        setProcessedImageUrl(imageSrc);
        return;
      }

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];

        if (activeFilter === 'photocopy') {
          // فیلتر فتوکپی پرکنتراست (الگوریتم ColorMatrix اندروید)
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          // کنتراست شدید + شیفت نوری به سمت سفید
          const contrast = 2.8;
          const brightness = 42;
          let val = (gray - 128) * contrast + 128 + brightness;
          val = Math.max(0, Math.min(255, val));
          d[i] = val;
          d[i + 1] = val;
          d[i + 2] = val;
        } else if (activeFilter === 'bw') {
          // فیلتر سیاه‌سفید اداری
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const contrast = 1.35;
          const brightness = 14;
          let val = (gray - 128) * contrast + 128 + brightness;
          val = Math.max(0, Math.min(255, val));
          d[i] = val;
          d[i + 1] = val;
          d[i + 2] = val;
        } else if (activeFilter === 'vibrant') {
          // فیلتر رنگی شفاف با افزایش اشباع و کنتراست
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const sat = 1.65;
          let nr = gray + (r - gray) * sat;
          let ng = gray + (g - gray) * sat;
          let nb = gray + (b - gray) * sat;
          // اندکی کنتراست
          nr = (nr - 128) * 1.18 + 128 + 6;
          ng = (ng - 128) * 1.18 + 128 + 6;
          nb = (nb - 128) * 1.18 + 128 + 6;
          d[i] = Math.max(0, Math.min(255, nr));
          d[i + 1] = Math.max(0, Math.min(255, ng));
          d[i + 2] = Math.max(0, Math.min(255, nb));
        }
      }

      ctx.putImageData(imgData, 0, 0);
      setProcessedImageUrl(canvas.toDataURL('image/jpeg', 0.92));
    };
  }, [imageSrc, activeFilter]);

  const handleSave = () => {
    const current = filters.find((f) => f.id === activeFilter);
    if (processedImageUrl) {
      const a = document.createElement('a');
      a.href = processedImageUrl;
      a.download = `smart_doc_${activeFilter}.jpg`;
      a.click();
    }
    onShowToast(`سند با فیلتر «${current?.name}» در گالری ذخیره شد.`);
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
      onShowToast(`لینک اشتراک‌گذاری سند (${current?.name}) آماده گردید.`);
    }
  };

  // سبک‌های بصری برای شبیه‌ساز سند نمونه
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
    <div className="flex flex-col h-full bg-slate-900 text-white select-none overflow-hidden">
      {/* Top App Bar */}
      <header className="bg-slate-900/90 backdrop-blur-sm border-b border-slate-800 px-3 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onNavigateBack}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-200 transition-colors flex items-center gap-1"
            title="بازگشت"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm text-slate-100">پیش‌نمایش و فیلترها</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2 rounded-full hover:bg-slate-800 text-blue-400 hover:text-blue-300 transition-colors"
            title="اشتراک‌گذاری"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>ذخیره</span>
          </button>
        </div>
      </header>

      {/* Center Framed Document Preview */}
      <div className="flex-1 overflow-hidden p-4 flex flex-col items-center justify-center bg-slate-950/60 relative">
        {/* Filter status pill tag */}
        <div className="absolute top-2 z-10 bg-slate-800/90 backdrop-blur-md border border-slate-700/60 px-3 py-1 rounded-full text-[11px] font-medium text-slate-300 flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span>{docStyle.filterName}</span>
        </div>

        {/* Display real image or sample document */}
        {processedImageUrl ? (
          <div className="w-full max-w-[310px] aspect-[1/1.38] rounded-xl overflow-hidden shadow-2xl border border-slate-700/80 bg-black flex items-center justify-center">
            <img
              src={processedImageUrl}
              alt="سند پردازش شده"
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div
            className={`w-full max-w-[310px] aspect-[1/1.38] rounded-md shadow-2xl p-5 flex flex-col justify-between transition-colors duration-200 border ${docStyle.paperBg} ${docStyle.borderColor} ${docStyle.textColor}`}
          >
            {/* Header of Certificate */}
            <div>
              <div className="flex items-start justify-between border-b pb-2.5 mb-3">
                <div>
                  <p className="text-[10px] tracking-wide font-bold">جمهوری اسلامی ایران</p>
                  <h4 className="text-xs font-extrabold mt-0.5">گواهی تأیید هویت و مدارک</h4>
                  <p className="text-[9px] opacity-75 mt-0.5">شناسه ثبتی: ۹۸۲۷۱-الف</p>
                </div>

                {/* Official Stamp */}
                <div
                  className={`w-11 h-11 rounded-full border-2 border-dashed flex flex-col items-center justify-center text-[7.5px] font-black leading-tight rotate-[-8deg] ${docStyle.stampBg}`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 mb-0.5" />
                  <span>مهر تأیید</span>
                </div>
              </div>

              {/* Simulated Document Text Paragraphs */}
              <div className="space-y-1.5 opacity-90 text-[10px] leading-relaxed">
                <p>بدین‌وسیله گواهی می‌شود مدارک هویتی پیوست طبق استعلام سامانه جامع احراز هویت کشور تطبیق داده شده و صحت مندرجات آن مورد تأیید رسمی می‌باشد.</p>
              </div>
            </div>

            {/* Form Data Grid */}
            <div className={`border rounded p-2 text-[9px] space-y-1 my-2 ${docStyle.borderColor}`}>
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
              <div className="flex justify-between">
                <span className={docStyle.subTextColor}>مرجع صادرکننده:</span>
                <span className="font-bold">ثبت اسناد و املاک کشور</span>
              </div>
            </div>

            {/* Document Footer Barcode & Signature */}
            <div className="pt-2 border-t flex items-end justify-between">
              <div className="space-y-0.5">
                <div className="h-4 flex items-center gap-[2px]">
                  {[4, 2, 6, 1, 4, 2, 7, 3, 2, 5, 2, 4, 3, 6, 2, 4, 2].map((w, idx) => (
                    <span
                      key={idx}
                      className="h-full bg-current block"
                      style={{ width: `${w}px` }}
                    />
                  ))}
                </div>
                <p className="text-[7.5px] font-mono tracking-wider">DOC-89412-IR</p>
              </div>

              <div className="text-left">
                <p className="text-[8px] font-bold">امضای مسئول صدور</p>
                <div className="w-14 h-5 border-b border-dotted border-current"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Live Filter Selector Toolbar */}
      <footer className="bg-slate-900 border-t border-slate-800 p-3 shrink-0">
        <p className="text-[11px] text-center text-blue-400 font-medium mb-2.5 truncate px-2">
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
                  className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1 transition-colors ${
                    isSelected ? 'bg-white/20' : 'bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold tracking-tight whitespace-nowrap">
                  {filter.name}
                </span>
              </button>
            );
          })}
        </div>
      </footer>
    </div>
  );
};
