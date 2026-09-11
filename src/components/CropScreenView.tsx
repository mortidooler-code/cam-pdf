import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowRight, RotateCw, Maximize2, RefreshCw, Check, Crop, Sparkles } from 'lucide-react';
import { detectDocumentBoundingBox } from '../utils/edgeDetector';

interface CropScreenViewProps {
  docId: string;
  imageSrc?: string | null;
  pageIndex?: number;
  totalPages?: number;
  onNavigateBack: () => void;
  onCropConfirmed: (croppedImageUrl: string) => void;
  onShowToast: (message: string) => void;
}

type DragTarget = 'none' | 'tl' | 'tr' | 'br' | 'bl' | 'center';

export const CropScreenView: React.FC<CropScreenViewProps> = ({
  docId: _docId,
  imageSrc,
  pageIndex,
  totalPages,
  onNavigateBack,
  onCropConfirmed,
  onShowToast
}) => {
  // دوران زاویه بر حسب درجه
  const [rotationDegrees, setRotationDegrees] = useState<number>(0);

  // مختصات نسبی کادر برش (بین ۰ تا ۱)
  const [normCrop, setNormCrop] = useState({
    left: 0.07,
    top: 0.07,
    right: 0.93,
    bottom: 0.93
  });

  const [activeDrag, setActiveDrag] = useState<DragTarget>('none');
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startCropRef = useRef(normCrop);

  const containerRef = useRef<HTMLDivElement>(null);
  const [imageMetrics, setImageMetrics] = useState<{
    width: number;
    height: number;
    displayWidth: number;
    displayHeight: number;
    offsetX: number;
    offsetY: number;
  }>({
    width: 600,
    height: 840,
    displayWidth: 280,
    displayHeight: 392,
    offsetX: 20,
    offsetY: 20
  });

  // تولید تصویر پیش‌فرض مدرک در صورتی که عکس وجود نداشته باشد
  const [currentImageSrc, setCurrentImageSrc] = useState<string>(imageSrc || '');

  useEffect(() => {
    if (!imageSrc) {
      // ایجاد سند رسمی نمونه با پس‌زمینه طبیعی
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 840;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // پس‌زمینه میز و کاغذ
        ctx.fillStyle = '#e5dece';
        ctx.fillRect(0, 0, 600, 840);

        // سایه حاشیه‌ها
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.fillRect(0, 0, 600, 40);
        ctx.fillRect(0, 800, 600, 40);

        // برگه سند
        ctx.fillStyle = '#f8f5ee';
        ctx.fillRect(35, 35, 530, 770);
        ctx.strokeStyle = '#9e907d';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(40, 40, 520, 760);

        ctx.fillStyle = '#2c251c';
        ctx.font = 'bold 22px Tahoma, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('جمهوری اسلامی ایران', 300, 100);
        ctx.font = 'bold 18px Tahoma, sans-serif';
        ctx.fillText('سند رسمی احراز هویت الکترونیکی', 300, 140);

        ctx.strokeStyle = '#b5a794';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(70, 170);
        ctx.lineTo(530, 170);
        ctx.stroke();

        ctx.textAlign = 'right';
        ctx.font = '15px Tahoma, sans-serif';
        ctx.fillText('نام و نام خانوادگی: مرتضی محمدی', 510, 230);
        ctx.fillText('شماره ملی: ۰۰۱۲۳۴۵۶۷۸', 510, 270);
        ctx.fillText('تاریخ صدور: ۱۴۰۳/۰۶/۲۰', 510, 310);
        ctx.fillText('کد رهگیری: IR-89412-A', 510, 350);

        // جدول
        ctx.strokeRect(70, 390, 460, 150);
        ctx.beginPath();
        ctx.moveTo(70, 440);
        ctx.lineTo(530, 440);
        ctx.moveTo(300, 390);
        ctx.lineTo(300, 540);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillText('مرجع صادرکننده', 415, 420);
        ctx.fillText('وضعیت سند', 185, 420);
        ctx.font = 'bold 16px Tahoma, sans-serif';
        ctx.fillText('ثبت اسناد و املاک کشور', 415, 490);
        ctx.fillText('تأیید نهایی رسمی', 185, 490);

        // مهر قرمز رنگ
        ctx.strokeStyle = '#b82a2a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(170, 680, 50, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#b82a2a';
        ctx.font = 'bold 14px Tahoma, sans-serif';
        ctx.fillText('مهر تأیید رسمی', 170, 675);
        ctx.fillText('ثبت اسناد', 170, 698);

        setCurrentImageSrc(canvas.toDataURL('image/jpeg', 0.92));
      }
    } else {
      setCurrentImageSrc(imageSrc);
    }
  }, [imageSrc]);

  // محاسبه ابعاد قرارگیری تصویر در کانتینر
  const updateMetrics = useCallback(() => {
    if (!containerRef.current || !currentImageSrc) return;
    const img = new Image();
    img.src = currentImageSrc;
    img.onload = () => {
      const containerW = containerRef.current?.clientWidth || 320;
      const containerH = containerRef.current?.clientHeight || 450;

      // محاسبه با توجه به زاویه چرخش (در چرخش ۹۰ یا ۲۷۰ عرض و ارتفاع جابجا می‌شوند)
      const isRotatedSideways = rotationDegrees % 180 !== 0;
      const srcW = isRotatedSideways ? img.height : img.width;
      const srcH = isRotatedSideways ? img.width : img.height;

      const imgAspect = srcW / srcH;
      const containerAspect = containerW / containerH;

      let displayW: number;
      let displayH: number;

      if (imgAspect > containerAspect) {
        displayW = containerW - 16;
        displayH = displayW / imgAspect;
      } else {
        displayH = containerH - 16;
        displayW = displayH * imgAspect;
      }

      const offX = (containerW - displayW) / 2;
      const offY = (containerH - displayH) / 2;

      setImageMetrics({
        width: srcW,
        height: srcH,
        displayWidth: displayW,
        displayHeight: displayH,
        offsetX: offX,
        offsetY: offY
      });
    };
  }, [currentImageSrc, rotationDegrees]);

  // اجرای الگوریتم سوبل (Sobel) جهت تشخیص لبه‌های سند و پیشنهاد کادر اولیه
  const runEdgeDetection = useCallback(
    (rotation: number = rotationDegrees, notify: boolean = true) => {
      if (!currentImageSrc) return;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = currentImageSrc;
      img.onload = () => {
        let sourceTarget: HTMLImageElement | HTMLCanvasElement = img;
        if (rotation % 360 !== 0) {
          const isRotatedSideways = rotation % 180 !== 0;
          const rCanvas = document.createElement('canvas');
          rCanvas.width = isRotatedSideways ? img.height : img.width;
          rCanvas.height = isRotatedSideways ? img.width : img.height;
          const rCtx = rCanvas.getContext('2d');
          if (rCtx) {
            rCtx.translate(rCanvas.width / 2, rCanvas.height / 2);
            rCtx.rotate((rotation * Math.PI) / 180);
            rCtx.drawImage(img, -img.width / 2, -img.height / 2);
            sourceTarget = rCanvas;
          }
        }

        const suggestedBox = detectDocumentBoundingBox(sourceTarget);
        setNormCrop(suggestedBox);
        if (notify) {
          onShowToast('لبه‌های سند با الگوریتم سوبل (Sobel) شناسایی و تنظیم شدند');
        }
      };
    },
    [currentImageSrc, rotationDegrees, onShowToast]
  );

  // در بارگذاری اولیه سند، کادر به جای حالت تمام‌صفحه با لبه‌یابی هوشمند مقداردهی اولیه می‌شود
  const hasInitializedCrop = useRef<boolean>(false);
  useEffect(() => {
    if (currentImageSrc && !hasInitializedCrop.current) {
      hasInitializedCrop.current = true;
      runEdgeDetection(0, false);
    }
  }, [currentImageSrc, runEdgeDetection]);

  useEffect(() => {
    updateMetrics();
    window.addEventListener('resize', updateMetrics);
    return () => window.removeEventListener('resize', updateMetrics);
  }, [updateMetrics]);

  // مدیریت رویدادهای کشیدن (Drag Gestures)
  const handlePointerDown = (e: React.PointerEvent, target: DragTarget) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDrag(target);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    startCropRef.current = { ...normCrop };
  };

  useEffect(() => {
    if (activeDrag === 'none') return;

    const handlePointerMove = (e: PointerEvent) => {
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;

      const normDx = dx / imageMetrics.displayWidth;
      const normDy = dy / imageMetrics.displayHeight;

      const minW = 40 / imageMetrics.displayWidth;
      const minH = 40 / imageMetrics.displayHeight;

      setNormCrop(() => {
        const start = startCropRef.current;
        let { left, top, right, bottom } = start;

        if (activeDrag === 'tl') {
          left = Math.max(0, Math.min(start.left + normDx, start.right - minW));
          top = Math.max(0, Math.min(start.top + normDy, start.bottom - minH));
        } else if (activeDrag === 'tr') {
          right = Math.min(1, Math.max(start.right + normDx, start.left + minW));
          top = Math.max(0, Math.min(start.top + normDy, start.bottom - minH));
        } else if (activeDrag === 'br') {
          right = Math.min(1, Math.max(start.right + normDx, start.left + minW));
          bottom = Math.min(1, Math.max(start.bottom + normDy, start.top + minH));
        } else if (activeDrag === 'bl') {
          left = Math.max(0, Math.min(start.left + normDx, start.right - minW));
          bottom = Math.min(1, Math.max(start.bottom + normDy, start.top + minH));
        } else if (activeDrag === 'center') {
          const boxW = start.right - start.left;
          const boxH = start.bottom - start.top;
          left = Math.max(0, Math.min(start.left + normDx, 1 - boxW));
          top = Math.max(0, Math.min(start.top + normDy, 1 - boxH));
          right = left + boxW;
          bottom = top + boxH;
        }

        return { left, top, right, bottom };
      });
    };

    const handlePointerUp = () => {
      setActiveDrag('none');
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [activeDrag, imageMetrics]);

  // چرخش ۹۰ درجه و به‌روزرسانی هوشمند کادر
  const handleRotate = () => {
    const nextRotation = (rotationDegrees + 90) % 360;
    setRotationDegrees(nextRotation);
    runEdgeDetection(nextRotation, false);
    onShowToast('سند ۹۰ درجه چرخانده شد');
  };

  // ریست کادر
  const handleReset = () => {
    setNormCrop({ left: 0.07, top: 0.07, right: 0.93, bottom: 0.93 });
    onShowToast('کادر استاندارد سند تنظیم شد');
  };

  // انتخاب کل صفحه
  const handleSelectAll = () => {
    setNormCrop({ left: 0.005, top: 0.005, right: 0.995, bottom: 0.995 });
    onShowToast('تمام کادر تصویر انتخاب شد');
  };

  // اجرای واقعی برش تصویر روی بوم Canvas
  const handleConfirmCrop = () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentImageSrc;
    img.onload = () => {
      // ابتدا اعمال چرخش در صورت نیاز
      let sourceCanvas = document.createElement('canvas');
      const isRotatedSideways = rotationDegrees % 180 !== 0;
      sourceCanvas.width = isRotatedSideways ? img.height : img.width;
      sourceCanvas.height = isRotatedSideways ? img.width : img.height;
      const sCtx = sourceCanvas.getContext('2d');
      if (!sCtx) return;

      sCtx.translate(sourceCanvas.width / 2, sourceCanvas.height / 2);
      sCtx.rotate((rotationDegrees * Math.PI) / 180);
      sCtx.drawImage(img, -img.width / 2, -img.height / 2);

      // حالا برش محدوده مشخص‌شده
      const cropPxX = Math.round(normCrop.left * sourceCanvas.width);
      const cropPxY = Math.round(normCrop.top * sourceCanvas.height);
      const cropPxW = Math.max(10, Math.round((normCrop.right - normCrop.left) * sourceCanvas.width));
      const cropPxH = Math.max(10, Math.round((normCrop.bottom - normCrop.top) * sourceCanvas.height));

      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = cropPxW;
      croppedCanvas.height = cropPxH;
      const cCtx = croppedCanvas.getContext('2d');
      if (!cCtx) return;

      cCtx.drawImage(
        sourceCanvas,
        cropPxX,
        cropPxY,
        cropPxW,
        cropPxH,
        0,
        0,
        cropPxW,
        cropPxH
      );

      const croppedDataUrl = croppedCanvas.toDataURL('image/jpeg', 0.93);
      onCropConfirmed(croppedDataUrl);
      onShowToast('کادر سند با موفقیت برش خورد و آماده پردازش شد.');
    };
  };

  // مقادیر پیکسلی کادر برش برای نمایش روی صفحه
  const cropPixelX = imageMetrics.offsetX + normCrop.left * imageMetrics.displayWidth;
  const cropPixelY = imageMetrics.offsetY + normCrop.top * imageMetrics.displayHeight;
  const cropPixelW = (normCrop.right - normCrop.left) * imageMetrics.displayWidth;
  const cropPixelH = (normCrop.bottom - normCrop.top) * imageMetrics.displayHeight;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white select-none overflow-hidden">
      {/* Top App Bar */}
      <header className="bg-slate-900/95 border-b border-slate-800 px-3 py-2.5 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onNavigateBack}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-200 transition-colors flex items-center gap-1"
            title="بازگشت"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-bold text-sm text-slate-100 leading-tight">
              تنظیم کادر برش {typeof pageIndex === 'number' && typeof totalPages === 'number' && totalPages > 1 ? `(صفحه ${pageIndex + 1} از ${totalPages})` : 'مدرک'}
            </h2>
            <p className="text-[10px] text-slate-400">حذف پس‌زمینه و زاویه میز</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* تشخیص هوشمند لبه‌ها با الگوریتم سوبل */}
          <button
            onClick={() => runEdgeDetection(rotationDegrees, true)}
            className="p-2 rounded-full hover:bg-slate-800 text-amber-400 hover:text-amber-300 transition-colors"
            title="تشخیص هوشمند لبه‌ها (الگوریتم Sobel)"
          >
            <Sparkles className="w-5 h-5" />
          </button>
          {/* چرخش ۹۰ درجه */}
          <button
            onClick={handleRotate}
            className="p-2 rounded-full hover:bg-slate-800 text-blue-400 hover:text-blue-300 transition-colors"
            title="چرخش ۹۰ درجه"
          >
            <RotateCw className="w-5 h-5" />
          </button>
          {/* انتخاب کل کادر */}
          <button
            onClick={handleSelectAll}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="انتخاب تمام تصویر"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Interactive Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-slate-950 flex items-center justify-center touch-none"
      >
        {/* تصویر چرخانده‌شده در پس‌زمینه */}
        {currentImageSrc && (
          <div
            style={{
              position: 'absolute',
              left: `${imageMetrics.offsetX}px`,
              top: `${imageMetrics.offsetY}px`,
              width: `${imageMetrics.displayWidth}px`,
              height: `${imageMetrics.displayHeight}px`
            }}
            className="pointer-events-none overflow-hidden shadow-2xl rounded-sm"
          >
            <img
              src={currentImageSrc}
              alt="سند در حال برش"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'fill',
                transform: `rotate(${rotationDegrees}deg)`,
                transition: 'transform 0.2s ease-out'
              }}
            />
          </div>
        )}

        {/* ماسک تیره اطراف کادر برش (Dark Scrim Overlay) */}
        {imageMetrics.displayWidth > 0 && (
          <div
            style={{
              position: 'absolute',
              left: `${imageMetrics.offsetX}px`,
              top: `${imageMetrics.offsetY}px`,
              width: `${imageMetrics.displayWidth}px`,
              height: `${imageMetrics.displayHeight}px`
            }}
            className="pointer-events-none"
          >
            {/* Scrim Top */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${normCrop.top * 100}%`,
                backgroundColor: 'rgba(15, 23, 42, 0.65)'
              }}
            />
            {/* Scrim Bottom */}
            <div
              style={{
                position: 'absolute',
                top: `${normCrop.bottom * 100}%`,
                left: 0,
                width: '100%',
                height: `${(1 - normCrop.bottom) * 100}%`,
                backgroundColor: 'rgba(15, 23, 42, 0.65)'
              }}
            />
            {/* Scrim Left */}
            <div
              style={{
                position: 'absolute',
                top: `${normCrop.top * 100}%`,
                left: 0,
                width: `${normCrop.left * 100}%`,
                height: `${(normCrop.bottom - normCrop.top) * 100}%`,
                backgroundColor: 'rgba(15, 23, 42, 0.65)'
              }}
            />
            {/* Scrim Right */}
            <div
              style={{
                position: 'absolute',
                top: `${normCrop.top * 100}%`,
                left: `${normCrop.right * 100}%`,
                width: `${(1 - normCrop.right) * 100}%`,
                height: `${(normCrop.bottom - normCrop.top) * 100}%`,
                backgroundColor: 'rgba(15, 23, 42, 0.65)'
              }}
            />
          </div>
        )}

        {/* جعبه کادر برش قابل تعامل با اشاره‌گر */}
        {imageMetrics.displayWidth > 0 && (
          <div
            style={{
              position: 'absolute',
              left: `${cropPixelX}px`,
              top: `${cropPixelY}px`,
              width: `${cropPixelW}px`,
              height: `${cropPixelH}px`
            }}
            onPointerDown={(e) => handlePointerDown(e, 'center')}
            className="border-2 border-sky-400 cursor-move relative transition-colors shadow-lg z-20"
          >
            {/* خطوط شبکه راهنمای یک‌سوم (Rule of Thirds Grid) */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
              <div className="border-r border-b border-white/25"></div>
              <div className="border-r border-b border-white/25"></div>
              <div className="border-b border-white/25"></div>
              <div className="border-r border-b border-white/25"></div>
              <div className="border-r border-b border-white/25"></div>
              <div className="border-b border-white/25"></div>
              <div className="border-r border-white/25"></div>
              <div className="border-r border-white/25"></div>
              <div></div>
            </div>

            {/* دستگیره‌های گوشه به صورت L شکل */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-sky-500 pointer-events-none"></div>
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-sky-500 pointer-events-none"></div>
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-sky-500 pointer-events-none"></div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-sky-500 pointer-events-none"></div>

            {/* پین‌های لمسی دایره‌ای در ۴ گوشه با مساحت لمس بزرگ */}
            {/* بالا - چپ */}
            <div
              onPointerDown={(e) => handlePointerDown(e, 'tl')}
              className="absolute -top-3.5 -left-3.5 w-7 h-7 flex items-center justify-center cursor-nwse-resize z-30"
            >
              <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md ring-2 ring-blue-500/30"></div>
            </div>

            {/* بالا - راست */}
            <div
              onPointerDown={(e) => handlePointerDown(e, 'tr')}
              className="absolute -top-3.5 -right-3.5 w-7 h-7 flex items-center justify-center cursor-nesw-resize z-30"
            >
              <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md ring-2 ring-blue-500/30"></div>
            </div>

            {/* پایین - راست */}
            <div
              onPointerDown={(e) => handlePointerDown(e, 'br')}
              className="absolute -bottom-3.5 -right-3.5 w-7 h-7 flex items-center justify-center cursor-nwse-resize z-30"
            >
              <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md ring-2 ring-blue-500/30"></div>
            </div>

            {/* پایین - چپ */}
            <div
              onPointerDown={(e) => handlePointerDown(e, 'bl')}
              className="absolute -bottom-3.5 -left-3.5 w-7 h-7 flex items-center justify-center cursor-nesw-resize z-30"
            >
              <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md ring-2 ring-blue-500/30"></div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Controls */}
      <footer className="bg-slate-900 border-t border-slate-800 p-3 shrink-0 z-30">
        <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[11px] mb-3">
          <Crop className="w-3.5 h-3.5 text-blue-400" />
          <span>گوشه‌های آبی را برای تعیین لبه‌های سند بکشید</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => runEdgeDetection(rotationDegrees, true)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-medium text-xs transition-colors shrink-0"
            title="تشخیص هوشمند لبه‌ها (الگوریتم Sobel)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="whitespace-nowrap">تشخیص هوشمند</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-medium text-xs transition-colors shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">کادر کامل</span>
          </button>

          <button
            onClick={handleConfirmCrop}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span className="whitespace-nowrap">تأیید و فیلترها</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
