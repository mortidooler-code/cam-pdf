import React, { useState } from 'react';
import { ANDROID_FILES, AndroidFileInfo } from '../data/androidFiles';
import { FileCode, Check, Copy, ExternalLink, Terminal, Shield, Sparkles } from 'lucide-react';

export const ProjectExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<AndroidFileInfo>(ANDROID_FILES[0]);
  const [copied, setCopied] = useState(false);

  const handleCopyPath = () => {
    navigator.clipboard.writeText(selectedFile.path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-slate-100 flex flex-col h-full shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">سورس‌کد نیتیو اندروید و گیت‌هاب اکشنز</h2>
            <p className="text-xs text-slate-400">ساختار استاندارد Kotlin + Jetpack Compose + CI/CD</p>
          </div>
        </div>

        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          آماده بیلد در GitHub Actions
        </span>
      </div>

      {/* Grid of Files */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
        {ANDROID_FILES.map((file) => {
          const isSelected = selectedFile.path === file.path;
          return (
            <button
              key={file.path}
              onClick={() => setSelectedFile(file)}
              className={`text-right p-2.5 rounded-xl border text-xs transition-all flex items-center gap-2 ${
                isSelected
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                  : 'bg-slate-800/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-4 h-4 shrink-0 text-blue-400" />
              <span className="truncate">{file.name}</span>
            </button>
          );
        })}
      </div>

      {/* Selected File Details Box */}
      <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800/80 mb-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs text-blue-400 dir-ltr select-all">
              {selectedFile.path}
            </span>
            <button
              onClick={handleCopyPath}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'کپی شد' : 'کپی مسیر'}</span>
            </button>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed mt-2">
            {selectedFile.description}
          </p>
        </div>

        {/* CI/CD Quick Info */}
        <div className="mt-4 pt-4 border-t border-slate-900 bg-blue-950/20 p-3 rounded-xl border-blue-900/30">
          <h4 className="text-xs font-bold text-blue-300 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            فرآیند تولید خودکار APK در گیت‌هاب:
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            با ارسال این ریپازیتوری به GitHub، فایل اکشنز <code className="text-blue-300 font-mono">build-apk.yml</code> با جاوا ۱۷ و دستور <code className="text-amber-300 font-mono">./gradlew assembleDebug --no-daemon</code> فایل خروجی APK را تحت نام <span className="text-emerald-300 font-bold">scanner-debug-apk</span> در بخش Artifacts قرار می‌دهد.
          </p>
        </div>
      </div>

      {/* Export / Instructions */}
      <div className="bg-slate-800/60 rounded-2xl p-3 text-xs text-slate-400 flex items-center justify-between">
        <span>می‌توانید کل پروژه را از منوی تنظیمات (Settings) به عنوان ریپازیتوری GitHub ذخیره یا دانلود کنید.</span>
        <div className="flex items-center gap-1 text-blue-400 font-medium shrink-0 mr-2">
          <span>استاندارد Android Studio 2024</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
