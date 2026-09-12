package com.docscanner.smartcopy.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import com.docscanner.smartcopy.model.DocumentState
import com.docscanner.smartcopy.model.ScannedDocument
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * مدیریت ذخیره‌سازی، خواندن و حذف مدارک اسکن‌شده واقعی کاربر
 * با ذخیره‌سازی دائمی متادیتا در فایل JSON و ذخیره تصاویر واقعی در حافظه داخلی دستگاه (Internal Storage)
 */
object RecentDocumentsRepository {

    private const val METADATA_FILE_NAME = "scanned_documents.json"
    private const val DOCS_DIR_NAME = "scanned_documents_media"

    /**
     * دریافت لیست تمام مدارک اسکن‌شده واقعی کاربر
     */
    fun getRecentDocuments(context: Context): List<ScannedDocument> {
        val metadataFile = File(context.filesDir, METADATA_FILE_NAME)
        if (!metadataFile.exists()) {
            // مقداردهی اولیه با ساخت و ذخیره واقعی نمونه مدارک آغازین روی دیسک
            return initializeDefaultDocuments(context)
        }

        return try {
            val jsonContent = metadataFile.readText()
            parseJsonToDocuments(jsonContent)
        } catch (e: Exception) {
            e.printStackTrace()
            initializeDefaultDocuments(context)
        }
    }

    /**
     * ذخیره مدرک جدید یا به‌روزرسانی مدرک موجود با صفحات تصویری واقعی
     */
    fun saveDocument(
        context: Context,
        title: String,
        pages: List<Bitmap>,
        existingDocId: String? = null
    ): ScannedDocument {
        if (pages.isEmpty()) {
            throw IllegalArgumentException("لیست صفحات مدرک نمی‌تواند خالی باشد")
        }

        val docId = existingDocId ?: "doc_${System.currentTimeMillis()}"
        val docsDir = File(context.filesDir, DOCS_DIR_NAME)
        if (!docsDir.exists()) docsDir.mkdirs()

        val itemDir = File(docsDir, docId)
        if (!itemDir.exists()) itemDir.mkdirs()

        val savedPagePaths = mutableListOf<String>()
        var totalBytes = 0L

        // ذخیره تمام صفحات به فرمت فشرده JPEG روی حافظه داخلی
        pages.forEachIndexed { index, bitmap ->
            val pageFile = File(itemDir, "page_${index + 1}.jpg")
            FileOutputStream(pageFile).use { out ->
                bitmap.compress(Bitmap.CompressFormat.JPEG, 88, out)
            }
            savedPagePaths.add(pageFile.absolutePath)
            totalBytes += pageFile.length()
        }

        // ساخت و ذخیره تصویر بندانگشتی از صفحه اول
        val thumbFile = File(itemDir, "thumbnail.jpg")
        val firstPage = pages.first()
        val thumbBitmap = createThumbnail(firstPage, 320)
        FileOutputStream(thumbFile).use { out ->
            thumbBitmap.compress(Bitmap.CompressFormat.JPEG, 85, out)
        }
        totalBytes += thumbFile.length()

        val formattedSize = formatFileSize(totalBytes)
        val formattedDate = getFormattedPersianDate()

        val scannedDoc = ScannedDocument(
            id = docId,
            title = title,
            date = formattedDate,
            pageCount = pages.size,
            fileSize = formattedSize,
            thumbnailPath = thumbFile.absolutePath,
            pagePaths = savedPagePaths
        )

        // به‌روزرسانی لیست و نوشتن متادیتا روی فایل
        val currentList = getRecentDocuments(context).toMutableList()
        val existingIndex = currentList.indexOfFirst { it.id == docId }
        if (existingIndex >= 0) {
            currentList[existingIndex] = scannedDoc
        } else {
            currentList.add(0, scannedDoc)
        }

        saveDocumentsMetadata(context, currentList)
        return scannedDoc
    }

    /**
     * حذف یک مدرک به همراه تمام فایل‌های تصویری آن از حافظه داخلی
     */
    fun deleteDocument(context: Context, docId: String): List<ScannedDocument> {
        val docsDir = File(context.filesDir, DOCS_DIR_NAME)
        val itemDir = File(docsDir, docId)
        if (itemDir.exists()) {
            itemDir.deleteRecursively()
        }

        val currentList = getRecentDocuments(context).filter { it.id != docId }
        saveDocumentsMetadata(context, currentList)
        return currentList
    }

    /**
     * بارگذاری صفحات یک مدرک از روی دیسک به فرمت Bitmap
     */
    fun loadDocumentPages(context: Context, docId: String): List<Bitmap> {
        val doc = getRecentDocuments(context).find { it.id == docId }
        if (doc != null && doc.pagePaths.isNotEmpty()) {
            val bitmaps = mutableListOf<Bitmap>()
            for (path in doc.pagePaths) {
                val file = File(path)
                if (file.exists()) {
                    val bitmap = BitmapFactory.decodeFile(file.absolutePath)
                    if (bitmap != null) {
                        bitmaps.add(bitmap)
                    }
                }
            }
            if (bitmaps.isNotEmpty()) {
                return bitmaps
            }
        }

        // اگر فایلی روی دیسک یافت نشد، صفحات الگو تولید می‌شود
        val count = doc?.pageCount ?: 1
        val docTitle = doc?.title ?: "سند اسکن‌شده"
        val sampleBitmaps = mutableListOf<Bitmap>()
        for (i in 1..count) {
            sampleBitmaps.add(DocumentState.createSampleDocumentBitmap("$docTitle (صفحه $i)"))
        }
        return sampleBitmaps
    }

    /**
     * بارگذاری فایل تصویر بندانگشتی به عنوان Bitmap
     */
    fun loadThumbnail(path: String?): Bitmap? {
        if (path == null) return null
        return try {
            val file = File(path)
            if (file.exists()) {
                BitmapFactory.decodeFile(file.absolutePath)
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }

    private fun createThumbnail(source: Bitmap, targetWidth: Int): Bitmap {
        val aspectRatio = source.height.toFloat() / source.width.toFloat()
        val targetHeight = (targetWidth * aspectRatio).toInt()
        return Bitmap.createScaledBitmap(source, targetWidth, targetHeight, true)
    }

    private fun saveDocumentsMetadata(context: Context, documents: List<ScannedDocument>) {
        try {
            val jsonArray = JSONArray()
            documents.forEach { doc ->
                val obj = JSONObject().apply {
                    put("id", doc.id)
                    put("title", doc.title)
                    put("date", doc.date)
                    put("pageCount", doc.pageCount)
                    put("fileSize", doc.fileSize)
                    put("thumbnailPath", doc.thumbnailPath ?: "")
                    val pagesArray = JSONArray()
                    doc.pagePaths.forEach { pagesArray.put(it) }
                    put("pagePaths", pagesArray)
                }
                jsonArray.put(obj)
            }
            val metadataFile = File(context.filesDir, METADATA_FILE_NAME)
            metadataFile.writeText(jsonArray.toString(2))
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun parseJsonToDocuments(jsonStr: String): List<ScannedDocument> {
        val list = mutableListOf<ScannedDocument>()
        val jsonArray = JSONArray(jsonStr)
        for (i in 0 until jsonArray.length()) {
            val obj = jsonArray.getJSONObject(i)
            val pagesList = mutableListOf<String>()
            if (obj.has("pagePaths")) {
                val pagesArray = obj.getJSONArray("pagePaths")
                for (j in 0 until pagesArray.length()) {
                    pagesList.add(pagesArray.getString(j))
                }
            }
            list.add(
                ScannedDocument(
                    id = obj.getString("id"),
                    title = obj.getString("title"),
                    date = obj.getString("date"),
                    pageCount = obj.optInt("pageCount", 1),
                    fileSize = obj.optString("fileSize", "۱.۲ مگابایت"),
                    thumbnailPath = obj.optString("thumbnailPath").takeIf { it.isNotBlank() },
                    pagePaths = pagesList
                )
            )
        }
        return list
    }

    /**
     * تولید اولین اسناد پیش‌فرض با ذخیره‌سازی واقعی روی حافظه داخلی
     */
    private fun initializeDefaultDocuments(context: Context): List<ScannedDocument> {
        return try {
            val sample1Page1 = DocumentState.createSampleDocumentBitmap("شناسنامه و کارت ملی (صفحه ۱)")
            val sample1Page2 = DocumentState.createSampleDocumentBitmap("شناسنامه و کارت ملی (صفحه ۲)")
            val doc1 = saveDocument(context, "شناسنامه و کارت ملی", listOf(sample1Page1, sample1Page2), "doc_real_1")

            val sample2Page1 = DocumentState.createSampleDocumentBitmap("قرارداد رسمی و اجاره‌نامه (صفحه ۱)")
            val sample2Page2 = DocumentState.createSampleDocumentBitmap("قرارداد رسمی و اجاره‌نامه (صفحه ۲)")
            val sample2Page3 = DocumentState.createSampleDocumentBitmap("قرارداد رسمی و اجاره‌نامه (صفحه ۳)")
            val doc2 = saveDocument(context, "قرارداد رسمی و اجاره‌نامه", listOf(sample2Page1, sample2Page2, sample2Page3), "doc_real_2")

            listOf(doc1, doc2)
        } catch (e: Exception) {
            e.printStackTrace()
            listOf(
                ScannedDocument(
                    id = "doc_real_1",
                    title = "شناسنامه و کارت ملی",
                    date = "۱۴۰۳/۰۶/۲۰ - ۱۰:۴۵",
                    pageCount = 2,
                    fileSize = "۱.۴ مگابایت"
                ),
                ScannedDocument(
                    id = "doc_real_2",
                    title = "قرارداد رسمی و اجاره‌نامه",
                    date = "۱۴۰۳/۰۶/۱۹ - ۱۸:۱۵",
                    pageCount = 3,
                    fileSize = "۲.۶ مگابایت"
                )
            )
        }
    }

    private fun formatFileSize(bytes: Long): String {
        return if (bytes >= 1024 * 1024) {
            val mb = bytes.toDouble() / (1024 * 1024)
            toPersianDigits(String.format(Locale.US, "%.1f", mb)) + " مگابایت"
        } else {
            val kb = bytes / 1024
            toPersianDigits(kb.toString()) + " کیلوبایت"
        }
    }

    private fun getFormattedPersianDate(): String {
        val sdfTime = SimpleDateFormat("HH:mm", Locale.getDefault())
        val currentTime = sdfTime.format(Date())
        val sdfDate = SimpleDateFormat("yyyy/MM/dd", Locale.getDefault())
        val currentDate = sdfDate.format(Date())
        // نمایش زمان و تاریخ به اعداد فارسی
        return toPersianDigits("$currentDate - $currentTime")
    }

    private fun toPersianDigits(input: String): String {
        val persianNumbers = charArrayOf('۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹')
        val sb = StringBuilder()
        for (c in input) {
            if (c in '0'..'9') {
                sb.append(persianNumbers[c - '0'])
            } else {
                sb.append(c)
            }
        }
        return sb.toString()
    }
}
