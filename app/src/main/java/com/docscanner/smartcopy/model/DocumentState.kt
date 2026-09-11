package com.docscanner.smartcopy.model

import android.content.Context
import android.graphics.*
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

/**
 * مدل داده‌ای هر صفحه سند در پردازش دسته‌ای (Batch Processing)
 */
data class DocumentPage(
    val id: String = java.util.UUID.randomUUID().toString(),
    var rawBitmap: Bitmap,
    var croppedBitmap: Bitmap = rawBitmap,
    var filterType: FilterType = FilterType.PHOTOCOPY,
    var processedBitmap: Bitmap? = null
)

/**
 * مدیریت وضعیت جاری سند در حال پردازش و پایش صفحات دسته‌ای (Batch)
 */
object DocumentState {
    // تصویر خام اصلی ثبت‌شده از دوربین یا گالری (پیش از برش)
    var rawBitmap by mutableStateOf<Bitmap?>(null)

    // تصویر برش‌خورده نهایی و آماده اعمال فیلترهای فتوکپی
    var activeBitmap by mutableStateOf<Bitmap?>(null)

    // زاویه چرخش دستی تصویر بر حسب درجه
    var currentRotationDegrees by mutableStateOf(0)

    // لیست صفحات سند چندصفحه‌ای برای ادغام در فایل PDF واحد
    val pages = mutableStateListOf<DocumentPage>()

    // شاخص صفحه فعال در حال پیش‌نمایش یا ویرایش
    var activePageIndex by mutableStateOf(0)

    fun setImageSource(bitmap: Bitmap, resetBatch: Boolean = true) {
        rawBitmap = bitmap
        activeBitmap = bitmap
        currentRotationDegrees = 0

        if (resetBatch || pages.isEmpty()) {
            pages.clear()
            val initialPage = DocumentPage(
                rawBitmap = bitmap,
                croppedBitmap = bitmap,
                filterType = FilterType.PHOTOCOPY
            )
            pages.add(initialPage)
            activePageIndex = 0
        }
    }

    /**
     * افزودن صفحه جدید به بسته سند چندصفحه‌ای
     */
    fun addNewPage(bitmap: Bitmap) {
        val newPage = DocumentPage(
            rawBitmap = bitmap,
            croppedBitmap = bitmap,
            filterType = FilterType.PHOTOCOPY
        )
        pages.add(newPage)
        activePageIndex = pages.size - 1
        rawBitmap = bitmap
        activeBitmap = bitmap
        currentRotationDegrees = 0
    }

    /**
     * به‌روزرسانی تصویر برش‌خورده صفحه فعال
     */
    fun updateActivePageCrop(cropped: Bitmap) {
        activeBitmap = cropped
        if (activePageIndex in pages.indices) {
            val current = pages[activePageIndex]
            pages[activePageIndex] = current.copy(
                croppedBitmap = cropped,
                processedBitmap = null
            )
        }
    }

    /**
     * انتخاب صفحه مشخص به عنوان صفحه فعال
     */
    fun selectPage(index: Int) {
        if (index in pages.indices) {
            activePageIndex = index
            val page = pages[index]
            rawBitmap = page.rawBitmap
            activeBitmap = page.croppedBitmap
            currentRotationDegrees = 0
        }
    }

    /**
     * حذف صفحه از بسته دسته‌ای
     */
    fun removePage(index: Int) {
        if (index in pages.indices && pages.size > 1) {
            pages.removeAt(index)
            if (activePageIndex >= pages.size) {
                activePageIndex = pages.size - 1
            }
            val page = pages[activePageIndex]
            rawBitmap = page.rawBitmap
            activeBitmap = page.croppedBitmap
        }
    }

    /**
     * به‌روزرسانی فیلتر صفحه جاری
     */
    fun updateActivePageFilter(filter: FilterType, processed: Bitmap?) {
        if (activePageIndex in pages.indices) {
            val current = pages[activePageIndex]
            pages[activePageIndex] = current.copy(
                filterType = filter,
                processedBitmap = processed
            )
        }
    }

    /**
     * مقداردهی اولیه پیش‌فرض در صورت خالی بودن صفحات
     */
    fun ensureSampleBatchPages() {
        if (pages.isEmpty()) {
            val sample1 = createSampleDocumentBitmap("گواهی تأیید هویت و مدارک (صفحه ۱)")
            val sample2 = createSampleDocumentBitmap("قرارداد رسمی و تعهدنامه اداری (صفحه ۲)")
            pages.add(DocumentPage(rawBitmap = sample1, croppedBitmap = sample1, filterType = FilterType.PHOTOCOPY))
            pages.add(DocumentPage(rawBitmap = sample2, croppedBitmap = sample2, filterType = FilterType.BLACK_AND_WHITE))
            activePageIndex = 0
            rawBitmap = sample1
            activeBitmap = sample1
        }
    }

    /**
     * رمزگشایی تصویر انتخابی از گالری به فرمت Bitmap با ابزارهای داخلی اندروید
     */
    fun decodeUriToBitmap(context: Context, uri: Uri): Bitmap? {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                val source = ImageDecoder.createSource(context.contentResolver, uri)
                ImageDecoder.decodeBitmap(source) { decoder, _, _ ->
                    decoder.isMutableRequired = true
                }
            } else {
                @Suppress("DEPRECATION")
                MediaStore.Images.Media.getBitmap(context.contentResolver, uri)
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    /**
     * ساخت تصویر پیش‌فرض مدرک رسمی با Canvas بومی برای نمونه اولیه
     */
    fun createSampleDocumentBitmap(title: String = "گواهی تأیید هویت و مشخصات"): Bitmap {
        val width = 900
        val height = 1260
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        // پس‌زمینه کاغذ (کمی بافت طبیعی)
        val bgPaint = Paint().apply {
            color = Color.rgb(246, 243, 236)
            style = Paint.Style.FILL
        }
        canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), bgPaint)

        // کادر دور سند
        val borderPaint = Paint().apply {
            color = Color.rgb(180, 170, 155)
            style = Paint.Style.STROKE
            strokeWidth = 3f
        }
        canvas.drawRect(40f, 40f, width - 40f, height - 40f, borderPaint)

        // قلم متون
        val titlePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.rgb(40, 35, 30)
            textSize = 34f
            isFakeBoldText = true
            textAlign = Paint.Align.CENTER
        }

        val subTitlePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.rgb(70, 60, 50)
            textSize = 24f
            textAlign = Paint.Align.CENTER
        }

        val bodyPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.rgb(50, 45, 40)
            textSize = 22f
            textAlign = Paint.Align.RIGHT
        }

        // سربرگ
        canvas.drawText("جمهوری اسلامی ایران", width / 2f, 110f, titlePaint)
        canvas.drawText(title, width / 2f, 160f, subTitlePaint)

        // خط جداکننده
        val linePaint = Paint().apply {
            color = Color.rgb(190, 180, 165)
            strokeWidth = 2f
        }
        canvas.drawLine(80f, 200f, width - 80f, 200f, linePaint)

        // متون شبیه‌سازی‌شده سند
        canvas.drawText("شماره ملی: ۰۰۱۲۳۴۵۶۷۸", width - 80f, 280f, bodyPaint)
        canvas.drawText("نام و نام خانوادگی: مرتضی محمدی", width - 80f, 340f, bodyPaint)
        canvas.drawText("تاریخ صدور مدرک: ۱۴۰۳/۰۶/۲۰", width - 80f, 400f, bodyPaint)
        canvas.drawText("مرجع صادرکننده: سازمان ثبت اسناد و املاک کشور", width - 80f, 460f, bodyPaint)

        canvas.drawText("بدین‌وسیله گواهی می‌شود مدارک هویتی پیوست طبق سامانه", width - 80f, 560f, bodyPaint)
        canvas.drawText("احراز هویت بررسی و صحت مندرجات آن مورد تأیید رسمی می‌باشد.", width - 80f, 610f, bodyPaint)

        // جدول مشخصات
        val tablePaint = Paint().apply {
            color = Color.rgb(200, 190, 175)
            style = Paint.Style.STROKE
            strokeWidth = 2f
        }
        canvas.drawRect(80f, 680f, width - 80f, 880f, tablePaint)
        canvas.drawLine(80f, 750f, width - 80f, 750f, tablePaint)
        canvas.drawLine(width / 2f, 680f, width / 2f, 880f, tablePaint)

        val cellPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.rgb(60, 50, 45)
            textSize = 20f
            textAlign = Paint.Align.CENTER
        }
        canvas.drawText("کد رهگیری سامانه", width * 0.75f, 725f, cellPaint)
        canvas.drawText("وضعیت پرونده", width * 0.25f, 725f, cellPaint)
        canvas.drawText("89412-A-IR", width * 0.75f, 825f, cellPaint)
        canvas.drawText("تأیید نهایی اداری", width * 0.25f, 825f, cellPaint)

        // مهر قرمز اداری
        val stampCirclePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.rgb(185, 45, 45)
            style = Paint.Style.STROKE
            strokeWidth = 4f
        }
        val stampTextPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.rgb(185, 45, 45)
            textSize = 22f
            isFakeBoldText = true
            textAlign = Paint.Align.CENTER
        }
        canvas.drawCircle(220f, 1020f, 70f, stampCirclePaint)
        canvas.drawText("مهر تأیید رسمی", 220f, 1015f, stampTextPaint)
        canvas.drawText("ثبت اسناد", 220f, 1045f, stampTextPaint)

        return bitmap
    }
}
