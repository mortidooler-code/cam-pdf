import React from 'react';
import { Camera, ImagePlus, FileText, MoreVertical, Sparkles, ChevronLeft } from 'lucide-react';

interface HomeScreenViewProps {
  onNavigateToPreview: (docId: string) => void;
  onLaunchCamera: () => void;
  onLaunchGallery: () => void;
}

export const HomeScreenView: React.FC<HomeScreenViewProps> = ({
  onNavigateToPreview,
  onLaunchCamera,
  onLaunchGallery
}) => {
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

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 select-none overflow-hidden">
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
              onClick={() => onNavigateToPreview(doc.id)}
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
                <h3 className="font-bold text-slate-900 text-sm truncate group-hover:text-blue-700 transition-colors">
                  {doc.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{doc.date}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {doc.size}
                  </span>
                  <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">
                    آماده چاپ و ارسال
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
          <div className="text-right">
            <h4 className="text-xs font-bold text-emerald-900">نکته برای فتوکپی تمیزتر:</h4>
            <p className="text-[11px] text-emerald-700 leading-relaxed mt-0.5">
              مدرک را روی یک میز یا پس‌زمینه با رنگ متضاد قرار دهید و مطمئن شوید نور مستقیم بازتاب خیره‌کننده ایجاد نمی‌کند.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Bottom Action Bar (Two Large Buttons) */}
      <div className="bg-white/95 backdrop-blur-md border-t border-slate-200 p-3.5 shadow-lg">
        <div className="grid grid-cols-2 gap-3">
          {/* Gallery Button */}
          <button
            onClick={onLaunchGallery}
            className="h-13 rounded-2xl border-2 border-blue-600/30 bg-blue-50/50 hover:bg-blue-100/60 active:scale-98 text-blue-700 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <ImagePlus className="w-5 h-5 text-blue-700" />
            <span>انتخاب از گالری</span>
          </button>

          {/* Camera Button (Primary Action) */}
          <button
            onClick={onLaunchCamera}
            className="h-13 rounded-2xl bg-blue-700 hover:bg-blue-800 active:scale-98 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-700/25"
          >
            <Camera className="w-5 h-5 text-white" />
            <span>دوربین (ثبت مدرک)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
