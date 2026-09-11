import React, { useState } from 'react';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';
import { HomeScreenView } from './HomeScreenView';
import { PreviewFilterView, WebBatchPage, FilterId } from './PreviewFilterView';
import { CropScreenView } from './CropScreenView';

// تابع تولید تصویر سند اداری با جزئیات فارسی برای صفحات نمونه و عکاسی دوربین
function generateDocumentCanvas(title: string, pageNum: number, totalPages: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 840;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // پس‌زمینه طبیعی کاغذ اداری با بافت ملایم
  ctx.fillStyle = '#dfd8cb';
  ctx.fillRect(0, 0, 600, 840);

  // سایه ملایم عکاسی با دوربین
  const grad = ctx.createLinearGradient(0, 0, 600, 840);
  grad.addColorStop(0, 'rgba(0,0,0,0.06)');
  grad.addColorStop(1, 'rgba(0,0,0,0.16)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 600, 840);

  // کادر حاشیه استاندارد سند
  ctx.strokeStyle = '#8d7f6c';
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, 540, 780);

  // هدر رسمی
  ctx.fillStyle = '#2c251c';
  ctx.font = 'bold 24px Vazirmatn, Tahoma, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('جمهوری اسلامی ایران', 300, 85);

  ctx.font = 'bold 19px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText(title, 300, 125);

  // نشانگر صفحه در بالای سند
  ctx.font = '14px Vazirmatn, Tahoma, sans-serif';
  ctx.fillStyle = '#5c4e3e';
  ctx.fillText(`صفحه ${pageNum} از ${totalPages} • سامانه جامع اسناد الکترونیکی`, 300, 155);

  ctx.beginPath();
  ctx.moveTo(55, 175);
  ctx.lineTo(545, 175);
  ctx.strokeStyle = '#9c8e7b';
  ctx.lineWidth = 2;
  ctx.stroke();

  // فیلدهای اداری
  ctx.textAlign = 'right';
  ctx.fillStyle = '#2c251c';
  ctx.font = '16px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText(`شناسه سند: IR-DOC-${98270 + pageNum * 3}-${totalPages}`, 520, 220);
  ctx.fillText('نام و نام خانوادگی: مرتضی محمدی', 520, 260);
  ctx.fillText('شماره ملی: ۰۰۱۲۳۴۵۶۷۸', 520, 300);
  ctx.fillText(`تاریخ ثبت و بررسی: ۱۴۰۳/۰۶/${18 + pageNum}`, 520, 340);
  ctx.fillText('مرجع صادرکننده: سازمان ثبت اسناد و املاک کشور', 520, 380);

  // جدول مشخصات صفحه
  ctx.strokeRect(55, 420, 490, 160);
  ctx.beginPath();
  ctx.moveTo(55, 470);
  ctx.lineTo(545, 470);
  ctx.moveTo(300, 420);
  ctx.lineTo(300, 580);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = 'bold 15px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText('شرح موضوع صفحه', 420, 452);
  ctx.fillText('کد پیگیری امنیتی', 175, 452);

  ctx.font = '14px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText(`احراز اصالت بخش ${pageNum} و پیوست‌ها`, 420, 525);
  ctx.font = 'bold 15px monospace';
  ctx.fillText(`SEC-${89000 + pageNum * 142}-PDF`, 175, 525);

  // مهر رسمی
  ctx.save();
  ctx.translate(150, 680);
  ctx.rotate(-0.08);
  ctx.strokeStyle = '#b82a2a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 48, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = '#b82a2a';
  ctx.font = 'bold 13px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText('مهر تأیید رسمی', 0, -6);
  ctx.fillText('ثبت اسناد کشور', 0, 16);
  ctx.restore();

  // بارکد پایانی
  ctx.fillStyle = '#2c251c';
  ctx.textAlign = 'right';
  ctx.font = '12px monospace';
  ctx.fillText(`BATCH-DOC-PAGE-${pageNum}`, 530, 775);

  return canvas.toDataURL('image/jpeg', 0.92);
}

export const AndroidEmulator: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'crop' | 'preview'>('home');
  const [selectedDocId, setSelectedDocId] = useState<string>('doc_1');
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // مدیریت صفحات دسته‌ای سند جاری
  const [batchPages, setBatchPages] = useState<WebBatchPage[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // بارگذاری سند از صفحه اصلی با پشتیبانی چندصفحه‌ای
  const handleOpenDocument = (docId: string, pageCount: number = 1, title: string = 'سند') => {
    setSelectedDocId(docId);
    const generatedPages: WebBatchPage[] = [];

    for (let i = 1; i <= pageCount; i++) {
      const pageDataUrl = generateDocumentCanvas(title, i, pageCount);
      generatedPages.push({
        id: `page_${docId}_${i}`,
        rawImage: pageDataUrl,
        croppedImage: pageDataUrl,
        filterType: 'photocopy',
        title: `صفحه ${i}`
      });
    }

    setBatchPages(generatedPages);
    setActivePageIndex(0);
    setActiveImage(generatedPages[0].croppedImage);
    setRawImage(generatedPages[0].rawImage);
    setCurrentScreen('preview');
    showToast(`سند «${title}» با ${pageCount} صفحه بارگذاری گردید.`);
  };

  // ورود به صفحه برش
  const handleNavigateToCrop = () => {
    const current = batchPages[activePageIndex];
    if (current) {
      setRawImage(current.rawImage || current.croppedImage);
    }
    setCurrentScreen('crop');
  };

  // تأیید برش کادر
  const handleCropConfirmed = (croppedImageUrl: string) => {
    setActiveImage(croppedImageUrl);

    setBatchPages((prev) => {
      if (prev.length === 0) {
        return [
          {
            id: `page_${Date.now()}`,
            rawImage: rawImage || croppedImageUrl,
            croppedImage: croppedImageUrl,
            filterType: 'photocopy',
            title: 'صفحه ۱'
          }
        ];
      }

      const updated = [...prev];
      if (updated[activePageIndex]) {
        updated[activePageIndex] = {
          ...updated[activePageIndex],
          croppedImage: croppedImageUrl,
          processedImage: undefined
        };
      }
      return updated;
    });

    setCurrentScreen('preview');
    showToast(`کادر صفحه ${activePageIndex + 1} تنظیم شد.`);
  };

  // عکسبرداری با دوربین (اسکن مستقیم یا افزودن صفحه جدید به بسته)
  const handleLaunchCamera = (isAppending: boolean = false) => {
    setSelectedDocId('camera_scan');
    const pageNum = isAppending ? batchPages.length + 1 : 1;
    const totalPages = isAppending ? batchPages.length + 1 : 1;
    const capturedDataUrl = generateDocumentCanvas('سند اسکن‌شده با دوربین', pageNum, totalPages);

    const newPage: WebBatchPage = {
      id: `page_cam_${Date.now()}`,
      rawImage: capturedDataUrl,
      croppedImage: capturedDataUrl,
      filterType: 'photocopy',
      title: `صفحه ${pageNum}`
    };

    if (isAppending) {
      setBatchPages((prev) => [...prev, newPage]);
      setActivePageIndex(batchPages.length);
    } else {
      setBatchPages([newPage]);
      setActivePageIndex(0);
    }

    setRawImage(capturedDataUrl);
    setActiveImage(capturedDataUrl);
    setCurrentScreen('crop');
    showToast(isAppending ? 'صفحه جدید با دوربین ثبت شد؛ کادر آن را تنظیم کنید.' : 'عکس با دوربین ثبت شد؛ کادر مدرک را تنظیم کنید.');
  };

  // انتخاب تصویر از گالری (یا افزودن صفحه به بسته جاری)
  const handleLaunchGallery = (dataUrl?: string, isAppending: boolean = false) => {
    setSelectedDocId('gallery_pick');
    const pageNum = isAppending ? batchPages.length + 1 : 1;
    const totalPages = isAppending ? batchPages.length + 1 : 1;
    const imgUrl = dataUrl || generateDocumentCanvas('تصویر انتخابی از گالری', pageNum, totalPages);

    const newPage: WebBatchPage = {
      id: `page_gal_${Date.now()}`,
      rawImage: imgUrl,
      croppedImage: imgUrl,
      filterType: 'photocopy',
      title: `صفحه ${pageNum}`
    };

    if (isAppending) {
      setBatchPages((prev) => [...prev, newPage]);
      setActivePageIndex(batchPages.length);
    } else {
      setBatchPages([newPage]);
      setActivePageIndex(0);
    }

    setRawImage(imgUrl);
    setActiveImage(imgUrl);
    setCurrentScreen('crop');
    showToast(isAppending ? 'تصویر به عنوان صفحه جدید انتخاب شد؛ کادر را تنظیم کنید.' : 'تصویر از گالری انتخاب شد؛ کادر را تنظیم کنید.');
  };

  // تعویض صفحه فعال در پیش‌نمایش
  const handleSelectBatchPage = (index: number) => {
    if (batchPages[index]) {
      setActivePageIndex(index);
      setActiveImage(batchPages[index].croppedImage);
      setRawImage(batchPages[index].rawImage);
    }
  };

  // حذف صفحه از بسته
  const handleRemoveBatchPage = (index: number) => {
    if (batchPages.length <= 1) return;
    const updated = batchPages.filter((_, idx) => idx !== index);
    setBatchPages(updated);
    const newActive = Math.min(activePageIndex, updated.length - 1);
    setActivePageIndex(newActive);
    setActiveImage(updated[newActive]?.croppedImage || null);
    setRawImage(updated[newActive]?.rawImage || null);
    showToast(`صفحه ${index + 1} از بسته حذف شد.`);
  };

  // به‌روزرسانی فیلتر یک صفحه در پیش‌نمایش
  const handleUpdatePageFilter = (index: number, filter: FilterId, processedUrl: string) => {
    setBatchPages((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          filterType: filter,
          processedImage: processedUrl
        };
      }
      return updated;
    });
  };

  return (
    <div className="relative flex justify-center items-center py-4">
      {/* Smartphone Device Frame */}
      <div className="w-[360px] h-[720px] max-h-[88vh] bg-black rounded-[44px] p-3 shadow-2xl ring-1 ring-slate-700/60 relative flex flex-col overflow-hidden">
        {/* Dynamic Island / Punch hole camera */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 rounded-full border border-slate-700/80 z-50 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-blue-950 rounded-full"></div>
        </div>

        {/* Android Screen Display */}
        <div className="flex-1 bg-slate-900 rounded-[34px] overflow-hidden flex flex-col relative">
          {/* Android Status Bar */}
          <div className="h-7 px-6 bg-transparent text-slate-400 text-[11px] font-mono flex items-center justify-between select-none z-40 shrink-0">
            <div className="flex items-center gap-1.5 font-bold text-slate-300">
              <Signal className="w-3 h-3 text-slate-300" />
              <span>IR-MCI</span>
            </div>
            <div className="flex items-center gap-2">
              <Wifi className="w-3 h-3" />
              <BatteryMedium className="w-3.5 h-3.5" />
              <span>10:35</span>
            </div>
          </div>

          {/* Active Screen Container */}
          <div className="flex-1 overflow-hidden relative">
            {currentScreen === 'home' && (
              <HomeScreenView
                onNavigateToPreview={(id, pages, title) => handleOpenDocument(id, pages, title)}
                onLaunchCamera={() => handleLaunchCamera(false)}
                onLaunchGallery={(url) => handleLaunchGallery(url, false)}
              />
            )}

            {currentScreen === 'crop' && (
              <CropScreenView
                docId={selectedDocId}
                imageSrc={rawImage}
                pageIndex={activePageIndex}
                totalPages={batchPages.length > 0 ? batchPages.length : 1}
                onNavigateBack={() => {
                  if (batchPages.length > 0) {
                    setCurrentScreen('preview');
                  } else {
                    setCurrentScreen('home');
                  }
                }}
                onCropConfirmed={handleCropConfirmed}
                onShowToast={showToast}
              />
            )}

            {currentScreen === 'preview' && (
              <PreviewFilterView
                docId={selectedDocId}
                imageSrc={activeImage || rawImage}
                pages={batchPages}
                activePageIndex={activePageIndex}
                onSelectPage={handleSelectBatchPage}
                onRemovePage={handleRemoveBatchPage}
                onAddPage={(source) => {
                  if (source === 'camera') {
                    handleLaunchCamera(true);
                  } else {
                    handleLaunchGallery(undefined, true);
                  }
                }}
                onUpdatePageFilter={handleUpdatePageFilter}
                onNavigateBack={() => setCurrentScreen('home')}
                onNavigateToCrop={handleNavigateToCrop}
                onShowToast={showToast}
              />
            )}

            {/* Android In-App Toast Notification */}
            {toastMessage && (
              <div className="absolute bottom-20 left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
                <div className="bg-slate-900/95 text-white text-xs font-medium px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700/80 text-center leading-relaxed">
                  {toastMessage}
                </div>
              </div>
            )}
          </div>

          {/* Android Navigation Gesture Bar */}
          <div className="h-4 bg-slate-900 flex items-center justify-center shrink-0">
            <div
              onClick={() => {
                if (currentScreen === 'preview') setCurrentScreen('home');
                else if (currentScreen === 'crop') {
                  if (batchPages.length > 0) setCurrentScreen('preview');
                  else setCurrentScreen('home');
                }
              }}
              className="w-28 h-1 bg-slate-400/50 hover:bg-slate-300 rounded-full cursor-pointer transition-colors"
              title="دکمه بازگشت اندروید"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
