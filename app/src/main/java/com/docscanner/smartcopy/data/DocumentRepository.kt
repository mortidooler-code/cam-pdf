package com.docscanner.smartcopy.data

import android.content.Context
import android.content.SharedPreferences
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import com.docscanner.smartcopy.model.ScannedDocument
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.util.Calendar
import java.util.Locale

/**
 * مخزن محلی مدیریت و ذخیره‌سازی دائمی مدارک اسکن‌شده
 * ذخیره واقعی متادیتا و فایل‌های تصویری در حافظه داخلی دستگاه
 */
object DocumentRepository {

    private const val PREFS_NAME = "smart_doc_scanner_prefs"
    private const val KEY_DOCUMENTS = "saved_scanned_documents"
    private const val DOCS_DIR_NAME = "saved_documents"

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    private fun getDocsDirectory(context: Context): File {
        val dir = File(context.filesDir, DOCS_DIR_NAME)
        if (!dir.exists()) {
            dir.mkdirs()
        }
        return dir
    }

    /**
     * دریافت لیست تمامی اسناد اسکن‌شده واقعی ذخیره‌شده در حافظه
     */
    fun getDocuments(context: Context): List<ScannedDocument> {
        val prefs = getPrefs(context)
        val jsonString = prefs.getString(KEY_DOCUMENTS, null) ?: return emptyList()

        val documentsList = mutableListOf<ScannedDocument>()
        try {
            val jsonArray = JSONArray(jsonString)
            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)
                documentsList.add(
                    ScannedDocument(
                        id = obj.getString("id"),
                        title = obj.getString("title"),
                        date = obj.getString("date"),
                        pageCount = obj.optInt("pageCount", 1),
                        fileSize = obj.optString("fileSize", "۱.۲ مگابایت"),
                        thumbnailPath = obj.optString("thumbnailPath", null),
                        isPdf = obj.optBoolean("isPdf", false),
                        filePath = obj.optString("filePath", null)
                    )
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return documentsList
    }

    /**
     * ذخیره‌سازی سند جدید همراه با تصاویر واقعی صفحات
     */
    fun saveDocument(
        context: Context,
        title: String,
        pageBitmaps: List<Bitmap>,
        isPdf: Boolean = false,
        pdfPath: String? = null
    ): ScannedDocument? {
        if (pageBitmaps.isEmpty()) return null

        val docId = "doc_${System.currentTimeMillis()}"
        val docsDir = getDocsDirectory(context)

        // ذخیره تصویر بندانگشتی (صفحه نخست)
        val thumbFile = File(docsDir, "${docId}_thumb.jpg")
        try {
            FileOutputStream(thumbFile).use { fos ->
                pageBitmaps[0].compress(Bitmap.CompressFormat.JPEG, 85, fos)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        // ذخیره تمام صفحات جهت امکان بازگشایی بعدی
        var totalBytes = 0L
        for ((index, bitmap) in pageBitmaps.withIndex()) {
            val pageFile = File(docsDir, "${docId}_page_${index}.jpg")
            try {
                FileOutputStream(pageFile).use { fos ->
                    bitmap.compress(Bitmap.CompressFormat.JPEG, 90, fos)
                }
                totalBytes += pageFile.length()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        val fileSizeFormatted = formatFileSize(totalBytes)
        val persianDate = getFormattedPersianDateTime()

        val newDoc = ScannedDocument(
            id = docId,
            title = title.ifBlank { "سند اسکن‌شده" },
            date = persianDate,
            pageCount = pageBitmaps.size,
            fileSize = fileSizeFormatted,
            thumbnailPath = thumbFile.absolutePath,
            isPdf = isPdf,
            filePath = pdfPath
        )

        // به‌روزرسانی لیست در SharedPreferences
        val existingDocs = getDocuments(context).toMutableList()
        existingDocs.add(0, newDoc) // افزودن به ابتدای لیست (جدیدترین در ابتدا)
        saveDocumentsList(context, existingDocs)

        return newDoc
    }

    /**
     * حذف یک سند و تمامی فایل‌های مربوط به آن
     */
    fun deleteDocument(context: Context, docId: String): Boolean {
        val docs = getDocuments(context).toMutableList()
        val index = docs.indexOfFirst { it.id == docId }
        if (index == -1) return false

        docs.removeAt(index)
        saveDocumentsList(context, docs)

        // حذف فایل‌های تصویر از دیسک
        try {
            val docsDir = getDocsDirectory(context)
            val files = docsDir.listFiles { _, name -> name.startsWith(docId) }
            files?.forEach { it.delete() }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        return true
    }

    /**
     * بارگذاری تصاویر تمام صفحات یک سند از حافظه محلی
     */
    fun loadDocumentPages(context: Context, docId: String): List<Bitmap> {
        val docsDir = getDocsDirectory(context)
        val bitmaps = mutableListOf<Bitmap>()
        var index = 0
        while (true) {
            val pageFile = File(docsDir, "${docId}_page_${index}.jpg")
            if (pageFile.exists()) {
                val bitmap = BitmapFactory.decodeFile(pageFile.absolutePath)
                if (bitmap != null) {
                    bitmaps.add(bitmap)
                }
                index++
            } else {
                break
            }
        }

        // اگر فایل‌های صفحه جداگانه نبودند، از تصویر بندانگشتی استفاده کن
        if (bitmaps.isEmpty()) {
            val thumbFile = File(docsDir, "${docId}_thumb.jpg")
            if (thumbFile.exists()) {
                BitmapFactory.decodeFile(thumbFile.absolutePath)?.let { bitmaps.add(it) }
            }
        }

        return bitmaps
    }

    private fun saveDocumentsList(context: Context, documents: List<ScannedDocument>) {
        val jsonArray = JSONArray()
        for (doc in documents) {
            val obj = JSONObject().apply {
                put("id", doc.id)
                put("title", doc.title)
                put("date", doc.date)
                put("pageCount", doc.pageCount)
                put("fileSize", doc.fileSize)
                put("thumbnailPath", doc.thumbnailPath)
                put("isPdf", doc.isPdf)
                put("filePath", doc.filePath)
            }
            jsonArray.put(obj)
        }

        getPrefs(context).edit().putString(KEY_DOCUMENTS, jsonArray.toString()).apply()
    }

    private fun formatFileSize(bytes: Long): String {
        return when {
            bytes >= 1024 * 1024 -> {
                val mb = bytes.toDouble() / (1024 * 1024)
                toPersianDigits(String.format(Locale.US, "%.1f", mb)) + " مگابایت"
            }
            bytes >= 1024 -> {
                val kb = bytes / 1024
                toPersianDigits(kb.toString()) + " کیلوبایت"
            }
            else -> {
                toPersianDigits(bytes.coerceAtLeast(100).toString()) + " بایت"
            }
        }
    }

    /**
     * تبدیل ارقام انگلیسی به فارسی
     */
    fun toPersianDigits(input: String): String {
        val persianDigits = arrayOf("۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹")
        var result = input
        for (i in 0..9) {
            result = result.replace(i.toString(), persianDigits[i])
        }
        return result
    }

    /**
     * دریافت تاریخ و زمان استاندارد هجری شمسی جاری
     */
    fun getFormattedPersianDateTime(): String {
        val calendar = Calendar.getInstance()
        val gYear = calendar.get(Calendar.YEAR)
        val gMonth = calendar.get(Calendar.MONTH) + 1
        val gDay = calendar.get(Calendar.DAY_OF_MONTH)
        val hour = calendar.get(Calendar.HOUR_OF_DAY)
        val minute = calendar.get(Calendar.MINUTE)

        val (jYear, jMonth, jDay) = gregorianToJalali(gYear, gMonth, gDay)

        val dateStr = String.format(Locale.US, "%04d/%02d/%02d", jYear, jMonth, jDay)
        val timeStr = String.format(Locale.US, "%02d:%02d", hour, minute)

        return toPersianDigits("$dateStr - $timeStr")
    }

    /**
     * الگوریتم استاندارد و دقیق تبدیل تاریخ میلادی به هجری شمسی
     */
    private fun gregorianToJalali(gy: Int, gm: Int, gd: Int): Triple<Int, Int, Int> {
        val gDaysInMonth = intArrayOf(0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)
        if ((gy % 4 == 0 && gy % 100 != 0) || (gy % 400 == 0)) {
            gDaysInMonth[2] = 29
        }

        var totalDays = 0
        for (i in 1 until gm) {
            totalDays += gDaysInMonth[i]
        }
        totalDays += gd

        val gDays = totalDays
        val jy: Int
        val jm: Int
        val jd: Int

        val marchDay = if ((gy % 4 == 0 && gy % 100 != 0) || (gy % 400 == 0)) 79 else 79
        if (gDays > marchDay) {
            jy = gy - 621
            val daysAfterNowruz = gDays - marchDay
            if (daysAfterNowruz <= 186) {
                jm = ((daysAfterNowruz - 1) / 31) + 1
                jd = ((daysAfterNowruz - 1) % 31) + 1
            } else {
                val rest = daysAfterNowruz - 186
                jm = ((rest - 1) / 30) + 7
                jd = ((rest - 1) % 30) + 1
            }
        } else {
            jy = gy - 622
            val daysBeforeNowruz = marchDay - gDays
            val rest = 365 - daysBeforeNowruz
            if (rest <= 186) {
                jm = ((rest - 1) / 31) + 1
                jd = ((rest - 1) % 31) + 1
            } else {
                val r = rest - 186
                jm = ((r - 1) / 30) + 7
                jd = ((r - 1) % 30) + 1
            }
        }

        return Triple(jy, jm, jd)
    }
}
