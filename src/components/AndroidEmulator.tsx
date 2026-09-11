import React, { useState } from 'react';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';
import { HomeScreenView } from './HomeScreenView';
import { PreviewFilterView } from './PreviewFilterView';

export const AndroidEmulator: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'preview'>('home');
  const [selectedDocId, setSelectedDocId] = useState<string>('doc_1');
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleNavigateToPreview = (docId: string, imageSrc?: string) => {
    setSelectedDocId(docId);
    if (imageSrc) {
      setActiveImage(imageSrc);
    } else {
      setActiveImage(null);
    }
    setCurrentScreen('preview');
  };

  const handleLaunchCamera = () => {
    setSelectedDocId('camera_scan');
    // ساخت یک تصویر سند نمونه با پس‌زمینه طبیعی و سایه برای شبیه‌سازی دقیق عکس گرفته شده با دوربین
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 840;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // زمینه خاکستری/کرم رنگ میز و کاغذ عکاسی شده
      ctx.fillStyle = '#dfd8ca';
      ctx.fillRect(0, 0, 600, 840);

      // سایه خفیف عکاسی با گوشی
      const grad = ctx.createLinearGradient(0, 0, 600, 840);
      grad.addColorStop(0, 'rgba(0,0,0,0.08)');
      grad.addColorStop(1, 'rgba(0,0,0,0.18)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 840);

      // کادر سند
      ctx.strokeStyle = '#8d7f6c';
      ctx.lineWidth = 3;
      ctx.strokeRect(30, 30, 540, 780);

      // متون سند
      ctx.fillStyle = '#2c251c';
      ctx.font = 'bold 24px Vazirmatn, Tahoma, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('جمهوری اسلامی ایران', 300, 90);
      ctx.font = 'bold 20px Vazirmatn, Tahoma, sans-serif';
      ctx.fillText('سند رسمی احراز هویت الکترونیکی', 300, 130);

      ctx.beginPath();
      ctx.moveTo(60, 160);
      ctx.lineTo(540, 160);
      ctx.strokeStyle = '#9c8e7b';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.font = '16px Vazirmatn, Tahoma, sans-serif';
      ctx.fillText('نام و نام خانوادگی: مرتضی محمدی', 520, 220);
      ctx.fillText('شماره ملی: ۰۰۱۲۳۴۵۶۷۸', 520, 260);
      ctx.fillText('تاریخ اسکن دوربین: ۱۴۰۳/۰۶/۲۱', 520, 300);
      ctx.fillText('وضعیت اصالت: تأیید شده', 520, 340);

      // جدول مشخصات
      ctx.strokeRect(60, 380, 480, 160);
      ctx.beginPath();
      ctx.moveTo(60, 430);
      ctx.lineTo(540, 430);
      ctx.moveTo(300, 380);
      ctx.lineTo(300, 540);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = '15px Vazirmatn, Tahoma, sans-serif';
      ctx.fillText('شناسه رهگیری', 420, 410);
      ctx.fillText('کد واحد اسکن', 180, 410);
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('IR-89412-COPY', 420, 480);
      ctx.fillText('ST-0041', 180, 480);

      // مهر قرمز
      ctx.strokeStyle = '#b82a2a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(160, 680, 50, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.fillStyle = '#b82a2a';
      ctx.font = 'bold 14px Vazirmatn, Tahoma, sans-serif';
      ctx.fillText('مهر رسمی', 160, 675);
      ctx.fillText('ثبت اسناد', 160, 695);

      setActiveImage(canvas.toDataURL('image/jpeg', 0.9));
    }
    setCurrentScreen('preview');
    showToast('عکس از دوربین دریافت شد؛ فیلتر فتوکپی پرکنتراست به صورت خودکار اعمال شد.');
  };

  const handleLaunchGallery = (dataUrl?: string) => {
    setSelectedDocId('gallery_pick');
    if (dataUrl) {
      setActiveImage(dataUrl);
    }
    setCurrentScreen('preview');
    showToast('تصویر با موفقیت انتخاب شد؛ موتور پردازش تصویر آماده است.');
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
            {currentScreen === 'home' ? (
              <HomeScreenView
                onNavigateToPreview={handleNavigateToPreview}
                onLaunchCamera={handleLaunchCamera}
                onLaunchGallery={handleLaunchGallery}
              />
            ) : (
              <PreviewFilterView
                docId={selectedDocId}
                imageSrc={activeImage}
                onNavigateBack={() => setCurrentScreen('home')}
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
              }}
              className="w-28 h-1 bg-slate-400/50 hover:bg-slate-300 rounded-full cursor-pointer transition-colors"
              title="دکمه ناوبری اندروید (بازگشت به خانه)"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
