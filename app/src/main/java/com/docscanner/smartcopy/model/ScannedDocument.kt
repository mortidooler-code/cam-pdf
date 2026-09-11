package com.docscanner.smartcopy.model

/**
 * مدل داده‌ای اسناد اسکن‌شده
 */
data class ScannedDocument(
    val id: String,
    val title: String,
    val date: String,
    val pageCount: Int = 1,
    val fileSize: String = "1.2 مگابایت",
    val thumbnailPath: String? = null,
    val isPdf: Boolean = false,
    val filePath: String? = null
)

/**
 * انواع فیلترهای پردازش هوشمند اسناد
 */
enum class FilterType(val title: String, val description: String) {
    PHOTOCOPY("فتوکپی", "سفید کردن کاغذ و مشکی پررنگ کردن نوشته‌ها"),
    BLACK_AND_WHITE("سیاه‌سفید اداری", "کنتراست استاندارد اسناد اداری"),
    VIBRANT_COLOR("رنگی شفاف", "بهبود وضوح و تفکیک رنگ"),
    ORIGINAL("تصویر اصلی", "بدون اعمال هیچ‌گونه فیلتر")
}
