package com.docscanner.smartcopy.util

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.pdf.PdfDocument
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.core.content.FileProvider
import com.docscanner.smartcopy.model.FilterType
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream

/**
 * موتور پردازش تصویر فتوکپی و اسناد اداری
 * کاملاً آفلاین، سریع و بدون نیاز به هیچ کتابخانه خارجی (فقط ابزارهای داخلی SDK اندروید)
 */
object DocumentFilterProcessor {

    /**
     * اعمال فیلترهای هوشمند با استفاده از شتاب‌دهنده گرافیکی ColorMatrix اندروید
     */
    fun applyFilter(original: Bitmap, filterType: FilterType): Bitmap {
        if (filterType == FilterType.ORIGINAL) {
            return original.copy(original.config ?: Bitmap.Config.ARGB_8888, true)
        }

        val resultBitmap = Bitmap.createBitmap(
            original.width,
            original.height,
            original.config ?: Bitmap.Config.ARGB_8888
        )
        val canvas = Canvas(resultBitmap)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)

        val colorMatrix = when (filterType) {
            FilterType.PHOTOCOPY -> {
                // فیلتر فتوکپی پرکنتراست اداری:
                // ۱. حذف کامل رنگ و تبدیل به تک‌رنگ (Saturation = 0)
                // ۲. افزایش شدید شیب کنتراست برای تبدیل خاکستری‌های روشن به سفید خالص
                // ۳. تشدید تاریکی جوهر نوشته‌ها و مهرها به مشکی خالص
                val cm = ColorMatrix()
                cm.setSaturation(0f)

                val contrast = 2.8f
                val brightness = 42f
                val scale = contrast
                val translate = (-0.5f * scale + 0.5f) * 255f + brightness

                val contrastMatrix = ColorMatrix(floatArrayOf(
                    scale, 0f, 0f, 0f, translate,
                    0f, scale, 0f, 0f, translate,
                    0f, 0f, scale, 0f, translate,
                    0f, 0f, 0f, 1f, 0f
                ))
                cm.postConcat(contrastMatrix)
                cm
            }

            FilterType.BLACK_AND_WHITE -> {
                // فیلتر سیاه‌سفید اداری: طیف خاکستری تمیز با وضوح بهینه
                val cm = ColorMatrix()
                cm.setSaturation(0f)

                val contrast = 1.35f
                val scale = contrast
                val translate = (-0.5f * scale + 0.5f) * 255f + 14f

                val contrastMatrix = ColorMatrix(floatArrayOf(
                    scale, 0f, 0f, 0f, translate,
                    0f, scale, 0f, 0f, translate,
                    0f, 0f, scale, 0f, translate,
                    0f, 0f, 0f, 1f, 0f
                ))
                cm.postConcat(contrastMatrix)
                cm
            }

            FilterType.VIBRANT_COLOR -> {
                // فیلتر رنگی شفاف: افزایش اشباع رنگ‌ها برای خوانایی مهرها، تمبر و امضاهای رنگی
                val cm = ColorMatrix()
                cm.setSaturation(1.65f)

                val contrast = 1.2f
                val scale = contrast
                val translate = (-0.5f * scale + 0.5f) * 255f + 8f

                val contrastMatrix = ColorMatrix(floatArrayOf(
                    scale, 0f, 0f, 0f, translate,
                    0f, scale, 0f, 0f, translate,
                    0f, 0f, scale, 0f, translate,
                    0f, 0f, 0f, 1f, 0f
                ))
                cm.postConcat(contrastMatrix)
                cm
            }

            FilterType.ORIGINAL -> ColorMatrix()
        }

        paint.colorFilter = ColorMatrixColorFilter(colorMatrix)
        canvas.drawBitmap(original, 0f, 0f, paint)

        return resultBitmap
    }

    /**
     * ذخیره تصویر پردازش‌شده در گالری و حافظه محلی
     */
    fun saveBitmapToGallery(context: Context, bitmap: Bitmap, title: String = "Doc_Scan"): Uri? {
        val fileName = "${title}_${System.currentTimeMillis()}.jpg"
        var uri: Uri? = null

        try {
            val contentValues = ContentValues().apply {
                put(MediaStore.Images.Media.DISPLAY_NAME, fileName)
                put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg")
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/SmartDocScanner")
                    put(MediaStore.Images.Media.IS_PENDING, 1)
                }
            }

            val resolver = context.contentResolver
            uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)

            uri?.let { destUri ->
                resolver.openOutputStream(destUri)?.use { stream ->
                    bitmap.compress(Bitmap.CompressFormat.JPEG, 92, stream)
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    contentValues.clear()
                    contentValues.put(MediaStore.Images.Media.IS_PENDING, 0)
                    resolver.update(destUri, contentValues, null, null)
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        return uri
    }

    /**
     * اشتراک‌گذاری تصویر نهایی از طریق Intent.ACTION_SEND استاندارد
     */
    fun shareBitmap(context: Context, bitmap: Bitmap, title: String = "مدرک اسکن‌شده") {
        try {
            val imagesFolder = File(context.cacheDir, "images")
            if (!imagesFolder.exists()) {
                imagesFolder.mkdirs()
            }
            val file = File(imagesFolder, "shared_document.jpg")
            val fos = FileOutputStream(file)
            bitmap.compress(Bitmap.CompressFormat.JPEG, 92, fos)
            fos.flush()
            fos.close()

            val contentUri: Uri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                file
            )

            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                type = "image/jpeg"
                putExtra(Intent.EXTRA_STREAM, contentUri)
                putExtra(Intent.EXTRA_SUBJECT, title)
                putExtra(Intent.EXTRA_TEXT, "ارسال‌شده از اپلیکیشن اسکنر و فتوکپی هوشمند مدارک")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            context.startActivity(Intent.createChooser(shareIntent, "اشتراک‌گذاری مدرک با:"))
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * برش و چرخش دستی سند با استفاده از Canvas و ابزارهای استاندارد اندروید
     * @param source تصویر ورودی
     * @param normalizedLeft نسبت مختصات چپ کادر برش (۰ تا ۱)
     * @param normalizedTop نسبت مختصات بالای کادر برش (۰ تا ۱)
     * @param normalizedRight نسبت مختصات راست کادر برش (۰ تا ۱)
     * @param normalizedBottom نسبت مختصات پایین کادر برش (۰ تا ۱)
     * @param rotationDegrees زاویه چرخش سند (۰، ۹۰، ۱۸۰، ۲۷۰)
     */
    fun cropAndRotateBitmap(
        source: Bitmap,
        normalizedLeft: Float,
        normalizedTop: Float,
        normalizedRight: Float,
        normalizedBottom: Float,
        rotationDegrees: Int = 0
    ): Bitmap {
        var workingBitmap = source

        // اعمال چرخش در صورت وجود
        if (rotationDegrees % 360 != 0) {
            val matrix = Matrix().apply {
                postRotate(rotationDegrees.toFloat())
            }
            workingBitmap = Bitmap.createBitmap(
                source, 0, 0, source.width, source.height, matrix, true
            )
        }

        // تبدیل نسبت‌های نسبی به پیکسل‌های واقعی تصویر
        val imgWidth = workingBitmap.width
        val imgHeight = workingBitmap.height

        val nLeft = normalizedLeft.coerceIn(0f, 1f)
        val nTop = normalizedTop.coerceIn(0f, 1f)
        val nRight = normalizedRight.coerceIn(0f, 1f)
        val nBottom = normalizedBottom.coerceIn(0f, 1f)

        val actualLeft = (minOf(nLeft, nRight) * imgWidth).toInt().coerceIn(0, imgWidth - 1)
        val actualTop = (minOf(nTop, nBottom) * imgHeight).toInt().coerceIn(0, imgHeight - 1)
        val actualRight = (maxOf(nLeft, nRight) * imgWidth).toInt().coerceIn(actualLeft + 1, imgWidth)
        val actualBottom = (maxOf(nTop, nBottom) * imgHeight).toInt().coerceIn(actualTop + 1, imgHeight)

        val cropWidth = (actualRight - actualLeft).coerceAtLeast(1)
        val cropHeight = (actualBottom - actualTop).coerceAtLeast(1)

        return Bitmap.createBitmap(
            workingBitmap,
            actualLeft,
            actualTop,
            cropWidth,
            cropHeight
        )
    }

    /**
     * تحلیل هوشمند تصویر با استفاده از الگوریتم آشکارسازی لبه سوبل (Sobel) و کنتراست روشنایی محلی
     * جهت پیشنهاد کادر مرزی اولیه سند به جای پیش‌فرض تمام صفحه.
     * @param source تصویر Bitmap ورودی
     * @return مختصات نرمال‌شده مستطیل برآوردشده سند (بین ۰ تا ۱)
     */
    fun detectDocumentBoundingBox(source: Bitmap): DocumentBoundingBox {
        val defaultBox = DocumentBoundingBox(0.06f, 0.06f, 0.94f, 0.94f)
        try {
            val srcWidth = source.width
            val srcHeight = source.height
            if (srcWidth <= 10 || srcHeight <= 10) {
                return defaultBox
            }

            // ۱. تغییر مقیاس بهینه جهت سرعت فوق‌العاده بالا و بدون تاخیر رابط کاربری
            val maxProcessDim = 240
            val scale = maxProcessDim.toFloat() / maxOf(srcWidth, srcHeight).coerceAtLeast(1)
            val procW = (srcWidth * scale).toInt().coerceAtLeast(10)
            val procH = (srcHeight * scale).toInt().coerceAtLeast(10)

            val scaledBitmap = Bitmap.createScaledBitmap(source, procW, procH, true)
            val pixels = IntArray(procW * procH)
            scaledBitmap.getPixels(pixels, 0, procW, 0, 0, procW, procH)

            // ۲. محاسبه روشنایی خاکستری (Luminosity)
            val luminance = IntArray(procW * procH)
            for (i in pixels.indices) {
                val p = pixels[i]
                val r = (p shr 16) and 0xFF
                val g = (p shr 8) and 0xFF
                val b = p and 0xFF
                luminance[i] = (0.299f * r + 0.587f * g + 0.114f * b).toInt()
            }

            // ۳. اعمال ماتریس فیلتر سوبل (Sobel Operator 3x3) برای محاسبه گرادیان محلی لبه‌ها
            val edgeXProfile = FloatArray(procW)
            val edgeYProfile = FloatArray(procH)

            for (y in 1 until procH - 1) {
                val rowPrev = (y - 1) * procW
                val rowCurr = y * procW
                val rowNext = (y + 1) * procW

                for (x in 1 until procW - 1) {
                    // گرادیان افقی لبه
                    val gx = -luminance[rowPrev + x - 1] + luminance[rowPrev + x + 1] -
                            2 * luminance[rowCurr + x - 1] + 2 * luminance[rowCurr + x + 1] -
                            luminance[rowNext + x - 1] + luminance[rowNext + x + 1]

                    // گرادیان عمودی لبه
                    val gy = -luminance[rowPrev + x - 1] - 2 * luminance[rowPrev + x] - luminance[rowPrev + x + 1] +
                            luminance[rowNext + x - 1] + 2 * luminance[rowNext + x] + luminance[rowNext + x + 1]

                    val mag = (kotlin.math.abs(gx) + kotlin.math.abs(gy)).toFloat()
                    edgeXProfile[x] += mag
                    edgeYProfile[y] += mag
                }
            }

            // ۴. نرم‌سازی (Smoothing) انرژی لبه‌ها با فیلتر میانگین متحرک ۳ نقطه‌ای
            val smoothX = FloatArray(procW)
            for (x in 1 until procW - 1) {
                smoothX[x] = (edgeXProfile[x - 1] + edgeXProfile[x] * 2f + edgeXProfile[x + 1]) / 4f
            }
            val smoothY = FloatArray(procH)
            for (y in 1 until procH - 1) {
                smoothY[y] = (edgeYProfile[y - 1] + edgeYProfile[y] * 2f + edgeYProfile[y + 1]) / 4f
            }

            // ۵. جستجوی قوی‌ترین لبه‌های مرزی کاغذ سند بر اساس تغییرات کنتراست
            // لبه چپ: بین ۳٪ تا ۳۸٪ عرض تصویر
            val leftScanStart = (procW * 0.03f).toInt()
            val leftScanEnd = (procW * 0.38f).toInt()
            var maxLeftVal = 0f
            var bestLeftIdx = leftScanStart
            for (x in leftScanStart..leftScanEnd) {
                if (smoothX[x] > maxLeftVal) {
                    maxLeftVal = smoothX[x]
                    bestLeftIdx = x
                }
            }

            // لبه راست: بین ۶۲٪ تا ۹۷٪ عرض تصویر
            val rightScanStart = (procW * 0.62f).toInt()
            val rightScanEnd = (procW * 0.97f).toInt()
            var maxRightVal = 0f
            var bestRightIdx = rightScanEnd
            for (x in rightScanStart..rightScanEnd) {
                if (smoothX[x] > maxRightVal) {
                    maxRightVal = smoothX[x]
                    bestRightIdx = x
                }
            }

            // لبه بالا: بین ۳٪ تا ۳۸٪ ارتفاع تصویر
            val topScanStart = (procH * 0.03f).toInt()
            val topScanEnd = (procH * 0.38f).toInt()
            var maxTopVal = 0f
            var bestTopIdx = topScanStart
            for (y in topScanStart..topScanEnd) {
                if (smoothY[y] > maxTopVal) {
                    maxTopVal = smoothY[y]
                    bestTopIdx = y
                }
            }

            // لبه پایین: بین ۶۲٪ تا ۹۷٪ ارتفاع تصویر
            val bottomScanStart = (procH * 0.62f).toInt()
            val bottomScanEnd = (procH * 0.97f).toInt()
            var maxBottomVal = 0f
            var bestBottomIdx = bottomScanEnd
            for (y in bottomScanStart..bottomScanEnd) {
                if (smoothY[y] > maxBottomVal) {
                    maxBottomVal = smoothY[y]
                    bestBottomIdx = y
                }
            }

            val avgXEnergy = smoothX.average().toFloat()
            val avgYEnergy = smoothY.average().toFloat()

            var detectedLeft = if (maxLeftVal > avgXEnergy * 1.15f) bestLeftIdx.toFloat() / procW else 0.06f
            var detectedRight = if (maxRightVal > avgXEnergy * 1.15f) bestRightIdx.toFloat() / procW else 0.94f
            var detectedTop = if (maxTopVal > avgYEnergy * 1.15f) bestTopIdx.toFloat() / procH else 0.06f
            var detectedBottom = if (maxBottomVal > avgYEnergy * 1.15f) bestBottomIdx.toFloat() / procH else 0.94f

            // ضریب حاشیه امنیتی
            detectedLeft = (detectedLeft - 0.01f).coerceIn(0.02f, 0.40f)
            detectedRight = (detectedRight + 0.01f).coerceIn(0.60f, 0.98f)
            detectedTop = (detectedTop - 0.01f).coerceIn(0.02f, 0.40f)
            detectedBottom = (detectedBottom + 0.01f).coerceIn(0.60f, 0.98f)

            if (detectedRight - detectedLeft < 0.35f || detectedBottom - detectedTop < 0.35f) {
                return defaultBox
            }

            return DocumentBoundingBox(
                left = detectedLeft,
                top = detectedTop,
                right = detectedRight,
                bottom = detectedBottom
            )
        } catch (e: Exception) {
            e.printStackTrace()
            return defaultBox
        }
    }

    /**
     * ساخت فایل سند PDF چندصفحه‌ای با استفاده از Android native PdfDocument API
     * این قابلیت کاملاً با ابزارهای داخلی SDK اندروید کار کرده و هیچ وابستگی یا کتابخانه جانبی اضافه نمی‌کند.
     *
     * @param context کانتکست برنامه
     * @param pageBitmaps لیست تصاویر صفحات مدرک
     * @param documentTitle نام فایل سند
     * @return شیء File تولیدشده در حافظه یا null در صورت خطا
     */
    fun createPdfDocument(
        context: Context,
        pageBitmaps: List<Bitmap>,
        documentTitle: String = "SmartDoc_${System.currentTimeMillis()}"
    ): File? {
        if (pageBitmaps.isEmpty()) return null

        val pdfDoc = PdfDocument()
        try {
            // ابعاد استاندارد برگه A4 بر حسب پوینت چاپی (72 DPI)
            val a4Width = 595
            val a4Height = 842

            for ((index, bitmap) in pageBitmaps.withIndex()) {
                val pageNum = index + 1

                // تنظیم جهت صفحه متناسب با تناسب تصویر
                val isLandscape = bitmap.width > bitmap.height
                val pageWidth = if (isLandscape) a4Height else a4Width
                val pageHeight = if (isLandscape) a4Width else a4Height

                val pageInfo = PdfDocument.PageInfo.Builder(pageWidth, pageHeight, pageNum).create()
                val page = pdfDoc.startPage(pageInfo)
                val canvas = page.canvas

                // رسم پس‌زمینه سفید استاندارد کاغذ
                val bgPaint = Paint().apply {
                    color = Color.WHITE
                    style = Paint.Style.FILL
                }
                canvas.drawRect(0f, 0f, pageWidth.toFloat(), pageHeight.toFloat(), bgPaint)

                // محاسبه مقیاس قرارگیری تصویر در مرکز صفحه A4 با حاشیه امن
                val margin = 20f
                val printableW = pageWidth - (margin * 2)
                val printableH = pageHeight - (margin * 2)

                val scale = minOf(
                    printableW / bitmap.width.toFloat(),
                    printableH / bitmap.height.toFloat()
                )

                val scaledW = bitmap.width * scale
                val scaledH = bitmap.height * scale

                val left = (pageWidth - scaledW) / 2f
                val top = (pageHeight - scaledH) / 2f

                val destRect = RectF(left, top, left + scaledW, top + scaledH)
                val paint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)

                canvas.drawBitmap(bitmap, null, destRect, paint)
                pdfDoc.finishPage(page)
            }

            // ذخیره در دایرکتوری کش اختصاصی PDF
            val pdfDir = File(context.cacheDir, "pdfs")
            if (!pdfDir.exists()) {
                pdfDir.mkdirs()
            }

            val sanitizedTitle = documentTitle.replace("[^a-zA-Z0-9_\\-]".toRegex(), "_")
            val pdfFile = File(pdfDir, "${sanitizedTitle}.pdf")

            FileOutputStream(pdfFile).use { fos ->
                pdfDoc.writeTo(fos)
                fos.flush()
            }

            return pdfFile
        } catch (e: Exception) {
            e.printStackTrace()
            return null
        } finally {
            pdfDoc.close()
        }
    }

    /**
     * ذخیره رسمی سند PDF در پوشه Downloads / اسناد دستگاه با استفاده از MediaStore
     */
    fun savePdfToStorage(
        context: Context,
        pageBitmaps: List<Bitmap>,
        documentTitle: String = "SmartDoc_${System.currentTimeMillis()}"
    ): Uri? {
        val pdfFile = createPdfDocument(context, pageBitmaps, documentTitle) ?: return null

        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, "${documentTitle}.pdf")
                    put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
                    put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/SmartDoc")
                    put(MediaStore.MediaColumns.IS_PENDING, 1)
                }

                val resolver = context.contentResolver
                val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)

                uri?.let { destUri ->
                    resolver.openOutputStream(destUri)?.use { outStream ->
                        FileInputStream(pdfFile).use { inStream ->
                            inStream.copyTo(outStream)
                        }
                    }
                    contentValues.clear()
                    contentValues.put(MediaStore.MediaColumns.IS_PENDING, 0)
                    resolver.update(destUri, contentValues, null, null)
                }
                uri
            } else {
                Uri.fromFile(pdfFile)
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    /**
     * اشتراک‌گذاری سند PDF چندصفحه‌ای از طریق ابزارهای استاندارد اندروید (Intent.ACTION_SEND)
     */
    fun sharePdfDocument(
        context: Context,
        pageBitmaps: List<Bitmap>,
        documentTitle: String = "سند_اسکن_شده"
    ): Boolean {
        val pdfFile = createPdfDocument(context, pageBitmaps, documentTitle) ?: return false

        return try {
            val contentUri: Uri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                pdfFile
            )

            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                type = "application/pdf"
                putExtra(Intent.EXTRA_STREAM, contentUri)
                putExtra(Intent.EXTRA_SUBJECT, "$documentTitle.pdf")
                putExtra(Intent.EXTRA_TEXT, "ارسال سند چندصفحه‌ای PDF ایجادشده با اسکنر هوشمند مدارک")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            val chooser = Intent.createChooser(shareIntent, "ارسال و اشتراک‌گذاری فایل PDF")
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(chooser)
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }
}

/**
 * محدوده نرمال‌شده کادر سند (بین ۰ تا ۱)
 */
data class DocumentBoundingBox(
    val left: Float,
    val top: Float,
    val right: Float,
    val bottom: Float
)
