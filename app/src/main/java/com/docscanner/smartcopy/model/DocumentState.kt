package com.docscanner.smartcopy.model

import android.content.Context
import android.graphics.*
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

/**
 * مدیریت وضعیت جاری سند در حال پردازش بین صفحات
 */
object DocumentState {
    var activeBitmap by mutableStateOf<Bitmap?>(null)

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
