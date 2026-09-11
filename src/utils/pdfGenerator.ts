/**
 * تولید فایل سند استاندارد PDF چندصفحه‌ای در شبیه‌ساز وب
 * معادل مستقیم Android Native PdfDocument API
 * بدون نیاز به لایبرری خارجی و با ایجاد مستقیم ساختار PDF 1.4 باینری
 */

export interface PdfPageInput {
  title?: string;
  imageSrc: string; // Data URL or Image URL
}

/**
 * تبدیل داده‌های Data URL به بایت‌های JPEG خام
 */
async function getImageJpegBytes(src: string): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context could not be created'));
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const base64Data = jpegDataUrl.split(',')[1];
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      resolve({
        bytes,
        width: img.width,
        height: img.height
      });
    };
    img.onerror = () => reject(new Error('Failed to load image for PDF generation'));
    img.src = src;
  });
}

/**
 * ایجاد باینری سند PDF استاندارد (PDF 1.4) برای لیست صفحات
 */
export async function generatePdfDocument(pages: PdfPageInput[], title: string = 'SmartDoc'): Promise<Blob> {
  if (pages.length === 0) {
    throw new Error('حداقل یک صفحه برای تولید فایل PDF الزامی است');
  }

  // بارگذاری و استخراج اطلاعات تصاویر همه صفحات
  const loadedPages = await Promise.all(pages.map(p => getImageJpegBytes(p.imageSrc)));

  // ابعاد استاندارد A4 به پوینت (72 DPI)
  const a4Width = 595;
  const a4Height = 842;

  // جدول اشیاء PDF
  const objects: (string | Uint8Array)[] = [];
  const offsets: number[] = [];

  // ساخت هدر PDF
  const encoder = new TextEncoder();
  const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const parts: Uint8Array[] = [encoder.encode(header)];
  let currentOffset = parts[0].length;

  const totalPages = loadedPages.length;
  // شیء 1: Catalog
  // شیء 2: Pages
  // برای هر صفحه i (از 0 تا totalPages-1):
  // شیء 3 + i*3: Page Object
  // شیء 4 + i*3: Content Stream
  // شیء 5 + i*3: Image XObject

  const pageObjectIds: number[] = [];
  for (let i = 0; i < totalPages; i++) {
    pageObjectIds.push(3 + i * 3);
  }

  // شیء 1: Catalog
  const catalogStr = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  offsets[1] = currentOffset;
  const catBytes = encoder.encode(catalogStr);
  parts.push(catBytes);
  currentOffset += catBytes.length;

  // شیء 2: Pages Root
  const kidsStr = pageObjectIds.map(id => `${id} 0 R`).join(' ');
  const pagesStr = `2 0 obj\n<< /Type /Pages /Kids [ ${kidsStr} ] /Count ${totalPages} >>\nendobj\n`;
  offsets[2] = currentOffset;
  const pagesBytes = encoder.encode(pagesStr);
  parts.push(pagesBytes);
  currentOffset += pagesBytes.length;

  // تولید اشیاء هر صفحه
  for (let i = 0; i < totalPages; i++) {
    const { bytes: imgBytes, width: imgW, height: imgH } = loadedPages[i];
    const pageId = 3 + i * 3;
    const contentId = pageId + 1;
    const imageId = pageId + 2;

    const isLandscape = imgW > imgH;
    const pageWidth = isLandscape ? a4Height : a4Width;
    const pageHeight = isLandscape ? a4Width : a4Height;

    const margin = 24;
    const printableW = pageWidth - margin * 2;
    const printableH = pageHeight - margin * 2;

    const scale = Math.min(printableW / imgW, printableH / imgH);
    const scaledW = imgW * scale;
    const scaledH = imgH * scale;

    const left = (pageWidth - scaledW) / 2;
    const bottom = (pageHeight - scaledH) / 2;

    // شیء صفحه (Page Object)
    const pageObjStr = `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [ 0 0 ${pageWidth} ${pageHeight} ] /Contents ${contentId} 0 R /Resources << /XObject << /Im${i + 1} ${imageId} 0 R >> >> >>\nendobj\n`;
    offsets[pageId] = currentOffset;
    const pBytes = encoder.encode(pageObjStr);
    parts.push(pBytes);
    currentOffset += pBytes.length;

    // شیء دستورات رسم (Content Stream)
    const streamContent = `q\n${scaledW.toFixed(2)} 0 0 ${scaledH.toFixed(2)} ${left.toFixed(2)} ${bottom.toFixed(2)} cm\n/Im${i + 1} Do\nQ\n`;
    const streamLen = streamContent.length;
    const contentObjStr = `${contentId} 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamContent}endstream\nendobj\n`;
    offsets[contentId] = currentOffset;
    const cBytes = encoder.encode(contentObjStr);
    parts.push(cBytes);
    currentOffset += cBytes.length;

    // شیء تصویر (Image XObject با فشرده‌سازی DCTDecode)
    const imgObjHeader = `${imageId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length} >>\nstream\n`;
    const imgObjFooter = `\nendstream\nendobj\n`;

    offsets[imageId] = currentOffset;
    const imgHeadBytes = encoder.encode(imgObjHeader);
    const imgFootBytes = encoder.encode(imgObjFooter);

    parts.push(imgHeadBytes);
    parts.push(imgBytes);
    parts.push(imgFootBytes);
    currentOffset += imgHeadBytes.length + imgBytes.length + imgFootBytes.length;
  }

  // جدول XRef
  const totalObjects = 2 + totalPages * 3;
  const startXref = currentOffset;

  let xrefStr = `xref\n0 ${totalObjects + 1}\n0000000000 65535 f \n`;
  for (let id = 1; id <= totalObjects; id++) {
    const offset = offsets[id] || 0;
    xrefStr += offset.toString().padStart(10, '0') + ' 00000 n \n';
  }

  xrefStr += `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R /Info << /Title (${title}) >> >>\nstartxref\n${startXref}\n%%EOF\n`;

  const xrefBytes = encoder.encode(xrefStr);
  parts.push(xrefBytes);

  return new Blob(parts, { type: 'application/pdf' });
}

/**
 * دانلود مستقیم فایل PDF در مرورگر
 */
export function downloadPdfBlob(blob: Blob, filename: string = 'SmartDoc_Document.pdf') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
