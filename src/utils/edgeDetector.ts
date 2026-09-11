/**
 * الگوریتم آشکارسازی لبه سوبل (Sobel Operator) و کنتراست روشنایی محلی
 * جهت تشخیص خودکار لبه‌های کاغذ سند و پیشنهاد کادر برش اولیه.
 */
export interface DocumentBoundingBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function detectDocumentBoundingBox(
  sourceImage: HTMLImageElement | HTMLCanvasElement
): DocumentBoundingBox {
  const defaultBox: DocumentBoundingBox = {
    left: 0.06,
    top: 0.06,
    right: 0.94,
    bottom: 0.94
  };

  try {
    const srcW = 'videoWidth' in sourceImage ? 300 : sourceImage.width;
    const srcH = 'videoHeight' in sourceImage ? 400 : sourceImage.height;

    if (srcW <= 10 || srcH <= 10) {
      return defaultBox;
    }

    // ۱. تغییر مقیاس بهینه جهت سرعت پردازش بلادرنگ (زیر ۵ میلی‌ثانیه)
    const maxDim = 240;
    const scale = maxDim / Math.max(srcW, srcH, 1);
    const procW = Math.max(10, Math.round(srcW * scale));
    const procH = Math.max(10, Math.round(srcH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = procW;
    canvas.height = procH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return defaultBox;

    ctx.drawImage(sourceImage, 0, 0, procW, procH);
    const imgData = ctx.getImageData(0, 0, procW, procH);
    const data = imgData.data;

    // ۲. محاسبه مقادیر روشنایی خاکستری (Luminosity Grayscale)
    const luminance = new Float32Array(procW * procH);
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      luminance[i / 4] = 0.299 * r + 0.587 * g + 0.114 * b;
    }

    // ۳. اعمال ماتریس فیلتر گرادیان سوبل (Sobel 3x3)
    const edgeXProfile = new Float32Array(procW);
    const edgeYProfile = new Float32Array(procH);

    for (let y = 1; y < procH - 1; y++) {
      const rowPrev = (y - 1) * procW;
      const rowCurr = y * procW;
      const rowNext = (y + 1) * procW;

      for (let x = 1; x < procW - 1; x++) {
        // گرادیان افقی (Gx)
        const gx =
          -luminance[rowPrev + x - 1] +
          luminance[rowPrev + x + 1] -
          2 * luminance[rowCurr + x - 1] +
          2 * luminance[rowCurr + x + 1] -
          luminance[rowNext + x - 1] +
          luminance[rowNext + x + 1];

        // گرادیان عمودی (Gy)
        const gy =
          -luminance[rowPrev + x - 1] -
          2 * luminance[rowPrev + x] -
          luminance[rowPrev + x + 1] +
          luminance[rowNext + x - 1] +
          2 * luminance[rowNext + x] +
          luminance[rowNext + x + 1];

        const mag = Math.abs(gx) + Math.abs(gy);
        edgeXProfile[x] += mag;
        edgeYProfile[y] += mag;
      }
    }

    // ۴. فیلتر هموارساز میانگین متحرک (Moving Average Smoothing)
    const smoothX = new Float32Array(procW);
    for (let x = 1; x < procW - 1; x++) {
      smoothX[x] = (edgeXProfile[x - 1] + edgeXProfile[x] * 2 + edgeXProfile[x + 1]) / 4;
    }

    const smoothY = new Float32Array(procH);
    for (let y = 1; y < procH - 1; y++) {
      smoothY[y] = (edgeYProfile[y - 1] + edgeYProfile[y] * 2 + edgeYProfile[y + 1]) / 4;
    }

    // ۵. شناسایی قله‌های مرزی کاغذ سند در محدوده‌های متداول (۳٪ تا ۳۸٪ و ۶۲٪ تا ۹۷٪)
    const leftScanStart = Math.floor(procW * 0.03);
    const leftScanEnd = Math.floor(procW * 0.38);
    let maxLeftVal = 0;
    let bestLeftIdx = leftScanStart;
    for (let x = leftScanStart; x <= leftScanEnd; x++) {
      if (smoothX[x] > maxLeftVal) {
        maxLeftVal = smoothX[x];
        bestLeftIdx = x;
      }
    }

    const rightScanStart = Math.floor(procW * 0.62);
    const rightScanEnd = Math.floor(procW * 0.97);
    let maxRightVal = 0;
    let bestRightIdx = rightScanEnd;
    for (let x = rightScanStart; x <= rightScanEnd; x++) {
      if (smoothX[x] > maxRightVal) {
        maxRightVal = smoothX[x];
        bestRightIdx = x;
      }
    }

    const topScanStart = Math.floor(procH * 0.03);
    const topScanEnd = Math.floor(procH * 0.38);
    let maxTopVal = 0;
    let bestTopIdx = topScanStart;
    for (let y = topScanStart; y <= topScanEnd; y++) {
      if (smoothY[y] > maxTopVal) {
        maxTopVal = smoothY[y];
        bestTopIdx = y;
      }
    }

    const bottomScanStart = Math.floor(procH * 0.62);
    const bottomScanEnd = Math.floor(procH * 0.97);
    let maxBottomVal = 0;
    let bestBottomIdx = bottomScanEnd;
    for (let y = bottomScanStart; y <= bottomScanEnd; y++) {
      if (smoothY[y] > maxBottomVal) {
        maxBottomVal = smoothY[y];
        bestBottomIdx = y;
      }
    }

    let avgX = 0;
    for (let x = 0; x < procW; x++) avgX += smoothX[x];
    avgX /= procW;

    let avgY = 0;
    for (let y = 0; y < procH; y++) avgY += smoothY[y];
    avgY /= procH;

    let detectedLeft = maxLeftVal > avgX * 1.15 ? bestLeftIdx / procW : 0.06;
    let detectedRight = maxRightVal > avgX * 1.15 ? bestRightIdx / procW : 0.94;
    let detectedTop = maxTopVal > avgY * 1.15 ? bestTopIdx / procH : 0.06;
    let detectedBottom = maxBottomVal > avgY * 1.15 ? bestBottomIdx / procH : 0.94;

    // اعمال مارجین احتیاطی کوچک
    detectedLeft = Math.max(0.02, Math.min(0.4, detectedLeft - 0.01));
    detectedRight = Math.max(0.6, Math.min(0.98, detectedRight + 0.01));
    detectedTop = Math.max(0.02, Math.min(0.4, detectedTop - 0.01));
    detectedBottom = Math.max(0.6, Math.min(0.98, detectedBottom + 0.01));

    if (detectedRight - detectedLeft < 0.35 || detectedBottom - detectedTop < 0.35) {
      return defaultBox;
    }

    return {
      left: Number(detectedLeft.toFixed(3)),
      top: Number(detectedTop.toFixed(3)),
      right: Number(detectedRight.toFixed(3)),
      bottom: Number(detectedBottom.toFixed(3))
    };
  } catch (err) {
    console.error('Edge detection error:', err);
    return defaultBox;
  }
}
