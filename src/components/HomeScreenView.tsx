import React, { useRef } from 'react';
import { Camera, ImagePlus, FileText, MoreVertical, Sparkles, ChevronLeft, ShieldCheck } from 'lucide-react';

interface HomeScreenViewProps {
  onNavigateToPreview: (docId: string, pageCount?: number, title?: string) => void;
  onLaunchCamera: () => void;
  onLaunchGallery: (dataUrl?: string) => void;
}

export const HomeScreenView: React.FC<HomeScreenViewProps> = ({
  onNavigateToPreview,
  onLaunchCamera,
  onLaunchGallery
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleDocs = [
    {
      id: 'doc_1',
      title: 'شناسنامه و کارت ملی',
      date: '۱۴۰۳/۰۶/۲۰ - ۱۰:۴۵',
      pages: 2,
      size: '۱.۴ مگابایت'
    },
    {
      id: 'doc_2',
      title: 'قرارداد رسمی و اجاره‌نامه',
      date: '۱۴۰۳/۰۶/۱۹ - ۱۸:۱۵',
      pages: 4,
      size: '۲.۸ مگابایت'
    }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          onLaunchGallery(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 select-none overflow-hidden">
      {/* Hidden File Input for Gallery simulation */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Top App Bar */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-700">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">اسکنر مدارک</h1>
            <p className="text-[11px] text-slate-500 font-medium">فتوکپی هوشمند اسناد اداری</p>
          </div>
        </div>
        <button
          className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
          title="گزینه‌ها"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">مدارک اخیر</h2>
          <span className="text-xs text-slate-500 font-medium">{sampleDocs.length} سند ثبت‌شده</span>
        </div>

        {/* Recent Documents List */}
        <div className="space-y-3">
          {sampleDocs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => onNavigateToPreview(doc.id, doc.pages, doc.title)}
              className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer flex items-center gap-3.5 group"
            >
              {/* Document Thumbnail */}
              <div className="w-14 h-16 rounded-xl bg-gradient-to-b from-blue-50 to-indigo-50 border border-blue-100 flex flex-col items-center justify-center shrink-0 group-hover:scale-102 transition-transform">
                <FileText className="w-6 h-6 text-blue-700 mb-0.5" />
                <span className="text-[10px] font-bold text-blue-600 bg-white px-1.5 py-0.5 rounded shadow-2xs">
                  {doc.pages} ص
                </span>
              </div>

              {/* Document Info */}
              <div className="flex-1 min-w-0 text-right">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm truncate group-hover:text-blue-700 transition-colors">
                    {doc.title}
                  </h3>
                  <span className="text-[9px] font-black bg-rose-50 text-rose-600 border border-rose-200/60 px-1.5 py-0.5 rounded">
                    PDF
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{doc.date}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {doc.size}
                  </span>
                  <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">
                    {doc.pages > 1 ? `${doc.pages} صفحه آماده ادغام` : 'آماده چاپ و ارسال'}
                  </span>
                </div>
              </div>

              <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
            </div>
          ))}
        </div>

        {/* Pro Tip Card */}
        <div className="bg-emerald-50/80 border border-emerald-200/70 rounded-2xl p-3.5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-950 mb-0.5">راهنمای فتوکپی باکیفیت</h4>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              مدرک را روی زمینه تیره با نور مناسب قرار دهید. موتور فیلتر ColorMatrix سایه‌های کاغذ را خودکار پاک و سفید می‌کند.
            </p>
          </div>
        </div>

        {/* Security & Offline Badge */}
        <div className="bg-blue-50/60 border border-blue-200/60 rounded-2xl p-3 flex items-center gap-2.5 text-blue-900 text-xs">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>پردازش ۱۰۰٪ آفلاین و درون‌دستگاهی (بدون ارسال به اینترنت)</span>
        </div>
      </div>

      {/* Persistent Bottom Action Buttons */}
      <footer className="bg-white border-t border-slate-200/90 p-3.5 shadow-lg">
        <div className="grid grid-cols-2 gap-3">
          {/* Gallery Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl border-2 border-blue-600/30 bg-blue-50/50 hover:bg-blue-100/60 text-blue-700 font-bold text-xs transition-all active:scale-98"
          >
            <ImagePlus className="w-4 h-4" />
            <span>گالری (انتخاب عکس)</span>
          </button>

          {/* Camera Button */}
          <button
            onClick={onLaunchCamera}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all active:scale-98"
          >
            <Camera className="w-4 h-4" />
            <span>دوربین (اسکن مستقیم)</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
