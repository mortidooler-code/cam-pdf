package com.docscanner.smartcopy.util

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.Paint
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.core.content.FileProvider
import com.docscanner.smartcopy.model.FilterType
import java.io.File
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
}
