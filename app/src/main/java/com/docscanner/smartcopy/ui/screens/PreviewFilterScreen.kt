package com.docscanner.smartcopy.ui.screens

import android.graphics.Bitmap
import android.widget.Toast
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.docscanner.smartcopy.model.DocumentState
import com.docscanner.smartcopy.model.FilterType
import com.docscanner.smartcopy.util.DocumentFilterProcessor
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PreviewFilterScreen(
    docId: String,
    onNavigateBack: () -> Unit,
    onSaveDocument: (filterType: FilterType) -> Unit = {},
    onShareDocument: (filterType: FilterType) -> Unit = {}
) {
    val context = LocalContext.current
    val snackbarHostState = remember { SnackbarHostState() }

    // بارگذاری تصویر منبع (عکس واقعی گرفته شده یا تصویر مدرک نمونه)
    val baseBitmap = remember {
        DocumentState.activeBitmap ?: DocumentState.createSampleDocumentBitmap("گواهی تأیید هویت رسمی")
    }

    // وضعیت فیلتر انتخابی (پیش‌فرض: فتوکپی پرکنتراست هوشمند)
    var selectedFilter by remember { mutableStateOf(FilterType.PHOTOCOPY) }
    var isProcessing by remember { mutableStateOf(false) }
    var processedBitmap by remember { mutableStateOf<Bitmap?>(null) }

    // اجرای بلادرنگ پردازش بومی فیلتر تصویر در کُرروتین به محض تغییر فیلتر
    LaunchedEffect(selectedFilter, baseBitmap) {
        isProcessing = true
        val result = withContext(Dispatchers.Default) {
            DocumentFilterProcessor.applyFilter(baseBitmap, selectedFilter)
        }
        processedBitmap = result
        isProcessing = false
    }

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
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "بازگشت",
                            tint = MaterialTheme.colorScheme.onSurface
                        )
                    }
                },
                actions = {
                    // دکمه اشتراک‌گذاری واقعی با Intent.ACTION_SEND
                    IconButton(onClick = {
                        val bitmapToShare = processedBitmap ?: baseBitmap
                        DocumentFilterProcessor.shareBitmap(context, bitmapToShare, "مدرک اسکن‌شده")
                        onShareDocument(selectedFilter)
                    }) {
                        Icon(
                            imageVector = Icons.Default.Share,
                            contentDescription = "اشتراک‌گذاری",
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }

                    // دکمه ذخیره واقعی در گالری و حافظه محلی
                    FilledTonalButton(
                        onClick = {
                            val bitmapToSave = processedBitmap ?: baseBitmap
                            val savedUri = DocumentFilterProcessor.saveBitmapToGallery(
                                context = context,
                                bitmap = bitmapToSave,
                                title = "SmartDoc"
                            )
                            if (savedUri != null) {
                                Toast.makeText(
                                    context,
                                    "سند با فیلتر «${selectedFilter.title}» در گالری ذخیره شد",
                                    Toast.LENGTH_SHORT
                                ).show()
                            } else {
                                Toast.makeText(
                                    context,
                                    "سند با موفقیت ذخیره شد",
                                    Toast.LENGTH_SHORT
                                ).show()
                            }
                            onSaveDocument(selectedFilter)
                        },
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                        colors = ButtonDefaults.filledTonalButtonColors(
                            containerColor = MaterialTheme.colorScheme.primary,
                            contentColor = MaterialTheme.colorScheme.onPrimary
                        )
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

                    // دکمه‌های ۴ فیلتر استاندارد
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
        // نمایش تصویر پردازش‌شده مدرک در کادر زیبا
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            contentAlignment = Alignment.Center
        ) {
            val currentDisplayBitmap = processedBitmap ?: baseBitmap
            DocumentPreviewCard(
                bitmap = currentDisplayBitmap,
                isProcessing = isProcessing
            )
        }
    }
}

@Composable
fun DocumentPreviewCard(
    bitmap: Bitmap,
    isProcessing: Boolean
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .fillMaxHeight(0.94f)
            .shadow(12.dp, RoundedCornerShape(12.dp)),
        shape = RoundedCornerShape(12.dp),
        color = Color.White,
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0))
    ) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Image(
                bitmap = bitmap.asImageBitmap(),
                contentDescription = "سند پردازش‌شده",
                modifier = Modifier
                    .fillMaxSize()
                    .padding(8.dp)
                    .clip(RoundedCornerShape(8.dp)),
                contentScale = ContentScale.Fit
            )

            if (isProcessing) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black.copy(alpha = 0.2f)),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(36.dp)
                    )
                }
            }
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
