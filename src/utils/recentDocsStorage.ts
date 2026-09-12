import { WebBatchPage, FilterId } from '../components/PreviewFilterView';

export interface ScannedDocumentItem {
  id: string;
  title: string;
  date: string;
  pageCount: number;
  fileSize: string;
  thumbnail: string;
  pages: WebBatchPage[];
  createdAt: number;
}

const STORAGE_KEY = 'smart_doc_scanned_documents_v1';

// فرمت‌بندی تاریخ شمسی زیبا و خوانا
export function getPersianDateString(date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return formatter.format(date).replace(',', ' -');
  } catch {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}/${m}/${d} - ${h}:${min}`;
  }
}

// محاسبه اندازه تقریبی فایل بر حسب مگابایت یا کیلوبایت
export function calculateDocumentSize(pages: WebBatchPage[]): string {
  let totalChars = 0;
  pages.forEach((p) => {
    totalChars += (p.processedImage || p.croppedImage || p.rawImage || '').length;
  });
  const bytes = Math.round((totalChars * 3) / 4);
  if (bytes > 1024 * 1024) {
    const mb = (bytes / (1024 * 1024)).toFixed(1);
    return `${mb.replace('.', '/')} مگابایت`;
  }
  const kb = Math.max(120, Math.round(bytes / 1024));
  return `${kb} کیلوبایت`;
}

// تولید تصویر سند اداری اولیه برای بارگذاری اولیه
export function createDefaultSampleThumbnail(title: string, subtitle: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 420;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // پس‌زمینه تمیز کاغذ
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 300, 420);

  // کادر سند
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2;
  ctx.strokeRect(15, 15, 270, 390);

  // هدر رسمی
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 13px Vazirmatn, Tahoma, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('جمهوری اسلامی ایران', 150, 45);

  ctx.font = 'bold 12px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText(title, 150, 70);

  ctx.font = '10px Vazirmatn, Tahoma, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(subtitle, 150, 90);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, 105);
  ctx.lineTo(270, 105);
  ctx.stroke();

  // خطوط متنی شبیه‌سازی سند
  ctx.fillStyle = '#334155';
  ctx.textAlign = 'right';
  ctx.font = '10px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText('شماره پیگیری: IR-982710', 260, 135);
  ctx.fillText('نام و نام خانوادگی: مرتضی محمدی', 260, 160);
  ctx.fillText('کد ملی: ۰۰۱۲۳۴۵۶۷۸', 260, 185);
  ctx.fillText('وضعیت: اسکن و فتوکپی هوشمند تأییدشده', 260, 210);

  // جدول کوچک
  ctx.strokeRect(30, 235, 240, 75);
  ctx.beginPath();
  ctx.moveTo(30, 265);
  ctx.lineTo(270, 265);
  ctx.moveTo(150, 235);
  ctx.lineTo(150, 310);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = 'bold 9px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText('نوع مدرک', 210, 255);
  ctx.fillText('اصالت داده', 90, 255);
  ctx.font = '9px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText('مدرک شناسایی', 210, 290);
  ctx.fillText('احراز شده', 90, 290);

  // مهر اداری قرمز
  ctx.save();
  ctx.translate(90, 360);
  ctx.rotate(-0.06);
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 8px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText('مهر تأیید', 0, -2);
  ctx.fillText('ثبت رسمی', 0, 10);
  ctx.restore();

  // بارکد پایانی
  ctx.fillStyle = '#1e293b';
  ctx.textAlign = 'right';
  ctx.font = '9px monospace';
  ctx.fillText('SCAN-DOC-892', 265, 385);

  return canvas.toDataURL('image/jpeg', 0.9);
}

// ساخت صفحات اولیه سند نمونه
function generateInitialSampleDocuments(): ScannedDocumentItem[] {
  const thumb1 = createDefaultSampleThumbnail('شناسنامه و کارت ملی', 'سامانه ثبت احوال و اسناد رسمی');
  const thumb2 = createDefaultSampleThumbnail('قرارداد رسمی و اجاره‌نامه', 'کد رهگیری سامانه املاک و مستغلات');

  return [
    {
      id: 'doc_real_1',
      title: 'شناسنامه و کارت ملی',
      date: '۱۴۰۳/۰۶/۲۰ - ۱۰:۴۵',
      pageCount: 2,
      fileSize: '۱/۴ مگابایت',
      thumbnail: thumb1,
      pages: [
        {
          id: 'p_init_1',
          rawImage: thumb1,
          croppedImage: thumb1,
          processedImage: thumb1,
          filterType: 'photocopy',
          title: 'صفحه ۱ - کارت ملی'
        },
        {
          id: 'p_init_2',
          rawImage: thumb1,
          croppedImage: thumb1,
          processedImage: thumb1,
          filterType: 'photocopy',
          title: 'صفحه ۲ - شناسنامه'
        }
      ],
      createdAt: Date.now() - 86400000
    },
    {
      id: 'doc_real_2',
      title: 'قرارداد رسمی و اجاره‌نامه',
      date: '۱۴۰۳/۰۶/۱۹ - ۱۸:۱۵',
      pageCount: 3,
      fileSize: '۲/۱ مگابایت',
      thumbnail: thumb2,
      pages: [
        {
          id: 'p_init_3',
          rawImage: thumb2,
          croppedImage: thumb2,
          processedImage: thumb2,
          filterType: 'bw',
          title: 'صفحه ۱ - متن قرارداد'
        },
        {
          id: 'p_init_4',
          rawImage: thumb2,
          croppedImage: thumb2,
          processedImage: thumb2,
          filterType: 'bw',
          title: 'صفحه ۲ - مشخصات طرفین'
        },
        {
          id: 'p_init_5',
          rawImage: thumb2,
          croppedImage: thumb2,
          processedImage: thumb2,
          filterType: 'photocopy',
          title: 'صفحه ۳ - امضاها و تضامین'
        }
      ],
      createdAt: Date.now() - 172800000
    }
  ];
}

// خواندن اسناد اسکن‌شده واقعی کاربر از حافظه مرورگر
export function loadRecentDocuments(): ScannedDocumentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = generateInitialSampleDocuments();
      saveRecentDocuments(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    const initial = generateInitialSampleDocuments();
    saveRecentDocuments(initial);
    return initial;
  } catch (e) {
    console.error('Failed to load recent documents from localStorage', e);
    return generateInitialSampleDocuments();
  }
}

// ذخیره کل اسناد در localStorage
export function saveRecentDocuments(documents: ScannedDocumentItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  } catch (e) {
    console.warn('Storage quota limit reached or localStorage unavailable', e);
  }
}

// افزودن سند اسکن‌شده واقعی جدید به صدر لیست
export function addOrUpdateScannedDocument(
  doc: Omit<ScannedDocumentItem, 'id' | 'createdAt'> & { id?: string }
): ScannedDocumentItem[] {
  const current = loadRecentDocuments();
  const id = doc.id && doc.id !== 'camera_scan' && doc.id !== 'gallery_pick'
    ? doc.id
    : `doc_user_${Date.now()}`;

  const existingIndex = current.findIndex((d) => d.id === id);

  const fullDoc: ScannedDocumentItem = {
    id,
    title: doc.title || `سند اسکن‌شده (${getPersianDateString()})`,
    date: doc.date || getPersianDateString(),
    pageCount: doc.pages.length > 0 ? doc.pages.length : 1,
    fileSize: doc.fileSize || calculateDocumentSize(doc.pages),
    thumbnail: doc.thumbnail || doc.pages[0]?.processedImage || doc.pages[0]?.croppedImage || '',
    pages: doc.pages,
    createdAt: Date.now()
  };

  let updated: ScannedDocumentItem[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = fullDoc;
  } else {
    updated = [fullDoc, ...current];
  }

  // محدود کردن به حداکثر ۲۰ سند اخیر برای بهینه‌سازی حافظه
  if (updated.length > 20) {
    updated = updated.slice(0, 20);
  }

  saveRecentDocuments(updated);
  return updated;
}

// حذف سند اسکن‌شده از لیست
export function deleteScannedDocument(id: string): ScannedDocumentItem[] {
  const current = loadRecentDocuments();
  const updated = current.filter((d) => d.id !== id);
  saveRecentDocuments(updated);
  return updated;
}
