import React, { useState } from 'react';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';
import { HomeScreenView } from './HomeScreenView';
import { PreviewFilterView } from './PreviewFilterView';

export const AndroidEmulator: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'preview'>('home');
  const [selectedDocId, setSelectedDocId] = useState<string>('doc_1');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleNavigateToPreview = (docId: string) => {
    setSelectedDocId(docId);
    setCurrentScreen('preview');
  };

  const handleLaunchCamera = () => {
    setSelectedDocId('camera_scan');
    setCurrentScreen('preview');
    showToast('دوربین فعال شد؛ تصویر سند دریافت و فیلتر فتوکپی اعمال شد.');
  };

  const handleLaunchGallery = () => {
    setSelectedDocId('gallery_pick');
    setCurrentScreen('preview');
    showToast('تصویر از گالری انتخاب شد؛ در حال پردازش کنتراست...');
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
