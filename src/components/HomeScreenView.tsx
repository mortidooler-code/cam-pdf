import React, { useRef, useState } from 'react';
import { Camera, ImagePlus, FileText, Sparkles, ChevronLeft, ShieldCheck, Trash2, Layers, AlertCircle } from 'lucide-react';
import { ScannedDocumentItem } from '../utils/recentDocsStorage';

interface HomeScreenViewProps {
  documents: ScannedDocumentItem[];
  onSelectDocument: (doc: ScannedDocumentItem) => void;
  onDeleteDocument?: (docId: string) => void;
  onLaunchCamera: () => void;
  onLaunchGallery: (dataUrl?: string) => void;
}

export const HomeScreenView: React.FC<HomeScreenViewProps> = ({
  documents,
  onSelectDocument,
  onDeleteDocument,
  onLaunchCamera,
  onLaunchGallery
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docToDelete, setDocToDelete] = useState<ScannedDocumentItem | null>(null);

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

  const confirmDelete = () => {
    if (docToDelete && onDeleteDocument) {
      onDeleteDocument(docToDelete.id);
      setDocToDelete(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 select-none overflow-hidden relative">
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
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full">
            {documents.length} سند
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-slate-900">مدارک اخیر</h2>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {documents.length > 0 ? `${documents.length} سند ثبت‌شده` : 'لیست اسناد خالی است'}
          </span>
        </div>

        {/* Recent Documents List or Empty State */}
        {documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer flex items-center gap-3 group relative"
              >
                {/* Real Document Thumbnail with Fallback */}
                <div className="w-14 h-18 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex flex-col items-center justify-center shrink-0 group-hover:scale-102 transition-transform relative shadow-2xs">
                  {doc.thumbnail ? (
                    <img
                      src={doc.thumbnail}
                      alt={doc.title}
                      className="w-full h-full object-cover bg-white"
                      onError={(e) => {
                        // Fallback to icon if thumbnail failed to render
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <FileText className="w-6 h-6 text-blue-700 mb-0.5" />
                  )}

                  {/* Page count pill */}
                  <span className="absolute bottom-1 right-1 text-[9px] font-bold text-white bg-slate-900/80 backdrop-blur-xs px-1.5 py-0.2 rounded shadow-xs flex items-center gap-0.5">
                    <Layers className="w-2.5 h-2.5" />
                    <span>{doc.pageCount} ص</span>
                  </span>
                </div>

                {/* Document Info */}
                <div className="flex-1 min-w-0 text-right">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-bold text-slate-900 text-sm truncate group-hover:text-blue-700 transition-colors">
                      {doc.title}
                    </h3>
                    <span className="text-[9px] font-black bg-rose-50 text-rose-600 border border-rose-200/60 px-1.5 py-0.5 rounded shrink-0">
                      PDF
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{doc.date}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {doc.fileSize}
                    </span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium truncate">
                      {doc.pageCount > 1 ? `${doc.pageCount} صفحه اسکن‌شده` : 'آماده چاپ و ارسال'}
                    </span>
                  </div>
                </div>

                {/* Actions: Delete & Chevron */}
                <div className="flex items-center gap-1 shrink-0">
                  {onDeleteDocument && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDocToDelete(doc);
                      }}
                      className="w-8 h-8 rounded-full text-slate-300 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                      title="حذف مدرک"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 border border-dashed border-slate-300 text-center space-y-3 shadow-xs">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">هنوز مدرکی اسکن نکرده‌اید</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                با دوربین عکاسی کنید یا عکس مدرک را از گالری انتخاب کنید تا با فیلتر فتوکپی پردازش و در این بخش ذخیره شود.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-2">
              <button
                onClick={onLaunchCamera}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>اسکن مدرک جدید</span>
              </button>
            </div>
          </div>
        )}

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

      {/* Delete Confirmation Dialog */}
      {docToDelete && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 w-full max-w-[290px] shadow-2xl space-y-3 text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">حذف مدرک اسکن‌شده</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                آیا از حذف مدرک «{docToDelete.title}» اطمینان دارید؟
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setDocToDelete(null)}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={confirmDelete}
                className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 transition-colors"
              >
                حذف شود
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Action Buttons */}
      <footer className="bg-white border-t border-slate-200/90 p-3.5 shadow-lg">
        <div className="grid grid-cols-2 gap-3">
          {/* Gallery Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl border-2 border-blue-600/30 bg-blue-50/50 hover:bg-blue-100/60 text-blue-700 font-bold text-xs transition-all active:scale-98 cursor-pointer"
          >
            <ImagePlus className="w-4 h-4" />
            <span>گالری (انتخاب عکس)</span>
          </button>

          {/* Camera Button */}
          <button
            onClick={onLaunchCamera}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all active:scale-98 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>دوربین (اسکن مستقیم)</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

