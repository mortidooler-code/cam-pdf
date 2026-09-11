import React, { useState } from 'react';
import { AndroidEmulator } from './components/AndroidEmulator';
import { ProjectExplorer } from './components/ProjectExplorer';
import { Smartphone, FolderGit2, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'emulator' | 'code'>('emulator');

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Vazirmatn',sans-serif]">
      {/* Top Banner & Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base lg:text-lg font-bold text-white tracking-tight">
                اسکنر و فتوکپی هوشمند مدارک
              </h1>
              <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold px-2 py-0.5 rounded-md">
                Native Android
              </span>
            </div>
            <p className="text-xs text-slate-400">
              طراحی‌شده با کاتلین، Jetpack Compose و خط لوله بیلد خودکار GitHub Actions (فاز اول)
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60">
          <button
            onClick={() => setActiveTab('emulator')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'emulator'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>شبیه‌ساز زنده اندروید</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'code'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            <span>سورس‌کد و GitHub Actions</span>
          </button>
        </div>
      </header>

      {/* Main Responsive Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 flex flex-col justify-center">
        {activeTab === 'emulator' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left/Center Column: Android Phone Simulator */}
            <div className="lg:col-span-6 flex justify-center">
              <AndroidEmulator />
            </div>

            {/* Right Column: Key Feature Badges & Architectural Summary */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2.5 text-blue-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>قابلیت‌های متصل‌شده در فاز دوم (بدون هیچ وابستگی خارجی):</span>
                </div>

                <div className="space-y-3 text-xs leading-relaxed text-slate-300">
                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-800/50 border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white font-bold block mb-0.5">تشخیص خودکار لبه‌های سند با الگوریتم Sobel و کنتراست نوری:</strong>
                      تابع پیشرفته <code className="text-amber-300 font-mono">detectDocumentBoundingBox</code> در اندروید و شبیه‌ساز با ماتریس گرادیان ۳×۳ سوبل و تحلیل پروفایل روشنایی، لبه‌های برگه کاغذ را شناسایی کرده و به‌صورت خودکار کادر اولیه ابزار برش را روی سند تنظیم می‌کند.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-800/50 border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white font-bold block mb-0.5">برش دستی سند با Canvas بومی اندروید و Touch Gestures:</strong>
                      رابط کاربری تعاملی با <code className="text-blue-300 font-mono">androidx.compose.foundation.Canvas</code> و <code className="text-blue-300 font-mono">detectDragGestures</code> با ۴ دستگیره گوشه، شبکه یک‌سوم (Rule of Thirds)، چرخش ۹۰ درجه و انتخاب کادر سند قبل از اعمال فیلترها.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-800/50 border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white font-bold block mb-0.5">اتصال واقعی دوربین و گالری (Android ActivityResult):</strong>
                      دوربین با لانچر استاندارد <code className="text-blue-300 font-mono">TakePicturePreview</code> و گالری با لانچر استاندارد <code className="text-blue-300 font-mono">GetContent</code> به صفحه پیش‌نمایش متصل شدند.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-800/50 border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white font-bold block mb-0.5">موتور پردازش فتوکپی (<code className="text-amber-300 font-mono">DocumentFilterProcessor</code>):</strong>
                      ۱۰۰٪ آفلاین و با توابع نیتیو <code className="text-blue-300 font-mono">ColorMatrix</code> اندروید:
                      فیلتر فتوکپی پرکنتراست (سفید کردن زمینه و پررنگ کردن جوهر)، فیلتر سیاه‌سفید اداری، فیلتر رنگی شفاف (مهرهای رنگی) و تصویر اصلی.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-800/50 border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white font-bold block mb-0.5">ذخیره و اشتراک‌گذاری استاندارد:</strong>
                      دکمه «اشتراک‌گذاری» با <code className="text-blue-300 font-mono">Intent.ACTION_SEND</code> و دکمه «ذخیره» با <code className="text-blue-300 font-mono">MediaStore</code> تصویر نهایی را ذخیره و ارسال می‌کند.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-800/50 border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white font-bold block mb-0.5">بیلد فوق سریع و تضمینی در گیتهاب:</strong>
                      هیچ پکیج یا کتابخانه سنگین جانبی (مثل OpenCV یا Room) اضافه نشد تا بیلد فایل نصبی در گیت‌هاب اکشنز بسیار سریع و بدون ریسک شکست انجام شود.
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('code')}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/30"
                  >
                    <FolderGit2 className="w-4 h-4" />
                    <span>مشاهده و بررسی فایل‌های کاتلین و Gradle</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full">
            <ProjectExplorer />
          </div>
        )}
      </div>
    </main>
  );
}
