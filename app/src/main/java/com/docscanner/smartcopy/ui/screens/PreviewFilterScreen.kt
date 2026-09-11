package com.docscanner.smartcopy.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.docscanner.smartcopy.model.FilterType
import com.docscanner.smartcopy.ui.theme.PrimaryBlue
import com.docscanner.smartcopy.ui.theme.SecondaryTeal

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PreviewFilterScreen(
    docId: String,
    onNavigateBack: () -> Unit,
    onSaveDocument: (filterType: FilterType) -> Unit,
    onShareDocument: (filterType: FilterType) -> Unit
) {
    // وضعیت فیلتر انتخابی (پیش‌فرض: فتوکپی هوشمند)
    var selectedFilter by remember { mutableStateOf(FilterType.PHOTOCOPY) }
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "پیش‌نمایش و فیلتر",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "بازگشت",
                            tint = MaterialTheme.colorScheme.onSurface
                        )
                    }
                },
                actions = {
                    // دکمه اشتراک‌گذاری
                    IconButton(onClick = { onShareDocument(selectedFilter) }) {
                        Icon(
                            imageVector = Icons.Default.Share,
                            contentDescription = "اشتراک‌گذاری",
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }
                    // دکمه ذخیره
                    FilledTonalButton(
                        onClick = { onSaveDocument(selectedFilter) },
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                        colors = ButtonDefaults.filledTonalButtonColors(
                            containerColor = MaterialTheme.colorScheme.primary,
                            contentColor = MaterialTheme.colorScheme.surface
                        ),
                        modifier = Modifier.padding(end = 8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Check,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "ذخیره",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        bottomBar = {
            // نوار ابزار پایین صفحه جهت انتخاب زنده فیلترها (۴ فیلتر اصلی)
            Surface(
                tonalElevation = 8.dp,
                shadowElevation = 12.dp,
                color = MaterialTheme.colorScheme.surface,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                ) {
                    // توضیح کوتاه فیلتر فعال
                    Text(
                        text = selectedFilter.description,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Medium,
                        textAlign = TextAlign.Center,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 10.dp)
                    )

                    // دکمه‌های ۴ فیلتر
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        FilterButton(
                            title = "فتوکپی",
                            icon = Icons.Default.Print,
                            isSelected = selectedFilter == FilterType.PHOTOCOPY,
                            onClick = { selectedFilter = FilterType.PHOTOCOPY }
                        )

                        FilterButton(
                            title = "سیاه‌سفید",
                            icon = Icons.Default.Contrast,
                            isSelected = selectedFilter == FilterType.BLACK_AND_WHITE,
                            onClick = { selectedFilter = FilterType.BLACK_AND_WHITE }
                        )

                        FilterButton(
                            title = "رنگی شفاف",
                            icon = Icons.Default.ColorLens,
                            isSelected = selectedFilter == FilterType.VIBRANT_COLOR,
                            onClick = { selectedFilter = FilterType.VIBRANT_COLOR }
                        )

                        FilterButton(
                            title = "اصلی",
                            icon = Icons.Default.CropOriginal,
                            isSelected = selectedFilter == FilterType.ORIGINAL,
                            onClick = { selectedFilter = FilterType.ORIGINAL }
                        )
                    }
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        // نمایش تصویر مدرک در مرکز صفحه با کادر مرتب و زیبا
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            contentAlignment = Alignment.Center
        ) {
            DocumentPreviewFrame(selectedFilter = selectedFilter)
        }
    }
}

@Composable
fun FilterButton(
    title: String,
    icon: ImageVector,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val activeColor = MaterialTheme.colorScheme.primary
    val inactiveColor = MaterialTheme.colorScheme.onSurfaceVariant

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .clickable { onClick() }
            .padding(horizontal = 8.dp, vertical = 6.dp)
    ) {
        Box(
            modifier = Modifier
                .size(50.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(
                    if (isSelected) activeColor else activeColor.copy(alpha = 0.08f)
                )
                .border(
                    width = if (isSelected) 2.dp else 1.dp,
                    color = if (isSelected) activeColor else Color.Transparent,
                    shape = RoundedCornerShape(14.dp)
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = title,
                tint = if (isSelected) Color.White else inactiveColor,
                modifier = Modifier.size(24.dp)
            )
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = title,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
            color = if (isSelected) activeColor else inactiveColor
        )
    }
}

@Composable
fun DocumentPreviewFrame(selectedFilter: FilterType) {
    // شبیه‌ساز بصری برگه‌ی اسکن‌شده بر اساس فیلتر فعال
    val paperBgColor = when (selectedFilter) {
        FilterType.PHOTOCOPY -> Color(0xFFFFFFFF) // زمینه کاملاً سفید تمیز فتوکپی
        FilterType.BLACK_AND_WHITE -> Color(0xFFF3F4F6)
        FilterType.VIBRANT_COLOR -> Color(0xFFFAF9F6)
        FilterType.ORIGINAL -> Color(0xFFEBE6DD) // رنگ کاغذ معمولی عکاسی شده
    }

    val textInkColor = when (selectedFilter) {
        FilterType.PHOTOCOPY -> Color(0xFF000000) // جوهر مشکی پررنگ و شارپ
        FilterType.BLACK_AND_WHITE -> Color(0xFF1E293B)
        FilterType.VIBRANT_COLOR -> Color(0xFF0F172A)
        FilterType.ORIGINAL -> Color(0xFF4A4036)
    }

    val stampColor = when (selectedFilter) {
        FilterType.PHOTOCOPY -> Color(0xFF000000) // در فتوکپی مهر سیاه می‌شود
        FilterType.BLACK_AND_WHITE -> Color(0xFF334155)
        FilterType.VIBRANT_COLOR -> Color(0xFFDC2626) // مهر قرمز شارپ
        FilterType.ORIGINAL -> Color(0xFF991B1B)
    }

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .fillMaxHeight(0.92f)
            .shadow(12.dp, RoundedCornerShape(8.dp)),
        shape = RoundedCornerShape(8.dp),
        color = paperBgColor,
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFCBD5E1))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // سربرگ سند
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "جمهوری اسلامی ایران",
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = textInkColor
                    )
                    Text(
                        text = "گواهی تأیید هویت رسمی",
                        fontSize = 11.sp,
                        color = textInkColor.copy(alpha = 0.8f)
                    )
                }
                Box(
                    modifier = Modifier
                        .size(46.dp)
                        .border(1.5.dp, stampColor, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "مهر تأیید",
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Bold,
                        color = stampColor
                    )
                }
            }

            Divider(
                color = textInkColor.copy(alpha = 0.2f),
                thickness = 1.dp,
                modifier = Modifier.padding(vertical = 12.dp)
            )

            // خطوط متن شبیه‌سازی شده سند
            Column(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.weight(1f)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(0.85f)
                        .height(8.dp)
                        .background(textInkColor.copy(alpha = 0.7f), RoundedCornerShape(2.dp))
                )
                Box(
                    modifier = Modifier
                        .fillMaxWidth(0.95f)
                        .height(8.dp)
                        .background(textInkColor.copy(alpha = 0.6f), RoundedCornerShape(2.dp))
                )
                Box(
                    modifier = Modifier
                        .fillMaxWidth(0.7f)
                        .height(8.dp)
                        .background(textInkColor.copy(alpha = 0.6f), RoundedCornerShape(2.dp))
                )

                Spacer(modifier = Modifier.height(16.dp))

                // جدول شبیه‌سازی شده مشخصات
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, textInkColor.copy(alpha = 0.3f), RoundedCornerShape(4.dp))
                        .padding(10.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = "شماره ملی: ۱۲۳۴۵۶۷۸۹۰", fontSize = 11.sp, color = textInkColor)
                        Text(text = "تاریخ صدور: ۱۴۰۲/۰۱/۱۵", fontSize = 11.sp, color = textInkColor)
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = "وضعیت: تأیید نهایی سامانه", fontSize = 11.sp, color = textInkColor)
                        Text(text = "کد رهگیری: 89412-A", fontSize = 11.sp, color = textInkColor)
                    }
                }
            }

            // برچسب حالت فیلتر پایین سند
            Surface(
                shape = RoundedCornerShape(6.dp),
                color = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f),
                modifier = Modifier.align(Alignment.CenterHorizontally)
            ) {
                Text(
                    text = "فیلتر اعمال‌شده: ${selectedFilter.title}",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                )
            }
        }
    }
}
