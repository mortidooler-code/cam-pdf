package com.docscanner.smartcopy.ui.screens

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
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
import androidx.core.content.ContextCompat
import com.docscanner.smartcopy.model.DocumentState
import com.docscanner.smartcopy.model.FilterType
import com.docscanner.smartcopy.util.DocumentFilterProcessor
import com.docscanner.smartcopy.util.RecentDocumentsRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PreviewFilterScreen(
    docId: String,
    onNavigateBack: () -> Unit,
    onNavigateToCrop: () -> Unit = {},
    onSaveDocument: (filterType: FilterType) -> Unit = {},
    onShareDocument: (filterType: FilterType) -> Unit = {}
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    // مقداردهی اولیه صفحات در صورت خالی بودن
    LaunchedEffect(Unit) {
        DocumentState.ensureSampleBatchPages()
    }

    val pages = DocumentState.pages
    val activeIndex = DocumentState.activePageIndex.coerceIn(0, (pages.size - 1).coerceAtLeast(0))

    // صفحه فعال جاری
    val currentPage = if (pages.isNotEmpty() && activeIndex in pages.indices) {
        pages[activeIndex]
    } else {
        null
    }

    // تصویر مبنا برای پیش‌نمایش صفحه جاری
    val baseBitmap = currentPage?.croppedBitmap
        ?: DocumentState.activeBitmap
        ?: remember { DocumentState.createSampleDocumentBitmap("گواهی تأیید هویت رسمی") }

    // وضعیت فیلتر صفحه فعال
    var selectedFilter by remember(activeIndex) {
        mutableStateOf(currentPage?.filterType ?: FilterType.PHOTOCOPY)
    }

    var isProcessing by remember { mutableStateOf(false) }
    var processedBitmap by remember { mutableStateOf<Bitmap?>(null) }
    var showPdfExportDialog by remember { mutableStateOf(false) }
    var showAddPageMenu by remember { mutableStateOf(false) }
    var isExportingPdf by remember { mutableStateOf(false) }

    // لانچر دوربین جهت عکسبرداری صفحات بعدی سند
    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicturePreview()
    ) { capturedBitmap ->
        if (capturedBitmap != null) {
            DocumentState.addNewPage(capturedBitmap)
            onNavigateToCrop()
        }
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            cameraLauncher.launch(null)
        } else {
            Toast.makeText(context, "جهت ثبت عکس با دوربین به این دسترسی نیاز است", Toast.LENGTH_SHORT).show()
        }
    }

    // لانچر گالری جهت افزودن تصاویر دیگر به بسته سند
    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        if (uri != null) {
            val bitmap = DocumentState.decodeUriToBitmap(context, uri)
            if (bitmap != null) {
                DocumentState.addNewPage(bitmap)
                onNavigateToCrop()
            }
        }
    }

    // اعمال زنده فیلتر انتخابی روی تصویر صفحه جاری
    LaunchedEffect(selectedFilter, baseBitmap) {
        isProcessing = true
        val result = withContext(Dispatchers.Default) {
            DocumentFilterProcessor.applyFilter(baseBitmap, selectedFilter)
        }
        processedBitmap = result
        DocumentState.updateActivePageFilter(selectedFilter, result)
        isProcessing = false
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "پیش‌نمایش سند",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        if (pages.size > 1) {
                            Text(
                                text = "صفحه ${activeIndex + 1} از ${pages.size} • اسکن چندصفحه‌ای",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.primary,
                                fontSize = 11.sp
                            )
                        }
                    }
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
                    // دکمه خروجی PDF با Android native PdfDocument API
                    IconButton(onClick = { showPdfExportDialog = true }) {
                        Badge(
                            containerColor = MaterialTheme.colorScheme.error,
                            modifier = Modifier.offset(x = 10.dp, y = (-10).dp)
                        ) {
                            Text("PDF", fontSize = 9.sp, fontWeight = FontWeight.Black)
                        }
                        Icon(
                            imageVector = Icons.Default.PictureAsPdf,
                            contentDescription = "خروجی PDF چندصفحه‌ای",
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }

                    // دکمه تنظیم مجدد کادر و برش صفحه جاری
                    IconButton(onClick = onNavigateToCrop) {
                        Icon(
                            imageVector = Icons.Default.Crop,
                            contentDescription = "تنظیم کادر برش",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    // دکمه اشتراک‌گذاری تصویر یا سند
                    IconButton(onClick = {
                        val bitmapToShare = processedBitmap ?: baseBitmap
                        DocumentFilterProcessor.shareBitmap(context, bitmapToShare, "مدرک اسکن‌شده")
                        onShareDocument(selectedFilter)
                    }) {
                        Icon(
                            imageVector = Icons.Default.Share,
                            contentDescription = "اشتراک‌گذاری تصویر",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    // دکمه ذخیره تصویر جاری در گالری و مدارک اخیر
                    FilledTonalButton(
                        onClick = {
                            val bitmapToSave = processedBitmap ?: baseBitmap
                            val savedUri = DocumentFilterProcessor.saveBitmapToGallery(
                                context = context,
                                bitmap = bitmapToSave,
                                title = "SmartDoc_Page${activeIndex + 1}"
                            )

                            // ذخیره تمام صفحات پردازش‌شده در مخزن مدارک اخیر
                            val allPages = pages.map { it.processedBitmap ?: it.croppedBitmap }
                            val pagesToSave = if (allPages.isNotEmpty()) allPages else listOf(bitmapToSave)
                            val titleToSave = if (docId.startsWith("doc_") && !docId.startsWith("doc_real_")) {
                                "سند اسکن‌شده"
                            } else {
                                "مدرک اسکن‌شده ${pagesToSave.size} صفحه‌ای"
                            }
                            RecentDocumentsRepository.saveDocument(
                                context = context,
                                title = titleToSave,
                                pages = pagesToSave
                            )

                            Toast.makeText(
                                context,
                                "سند در مدارک اخیر و گالری ذخیره شد",
                                Toast.LENGTH_SHORT
                            ).show()
                            onSaveDocument(selectedFilter)
                        },
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                        colors = ButtonDefaults.filledTonalButtonColors(
                            containerColor = MaterialTheme.colorScheme.primary,
                            contentColor = MaterialTheme.colorScheme.onPrimary
                        )
                    ) {
                        Icon(
                            imageVector = Icons.Default.Check,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "ذخیره",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        bottomBar = {
            // پنل پایین شامل نوار انتخاب فیلترها
            Surface(
                tonalElevation = 8.dp,
                shadowElevation = 12.dp,
                color = MaterialTheme.colorScheme.surface,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 10.dp)
                ) {
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
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // نوار مدیریت صفحات اسناد دسته‌ای (Batch Pages Carousel)
            Surface(
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(vertical = 8.dp)) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 2.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Layers,
                                contentDescription = null,
                                modifier = Modifier.size(15.dp),
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "صفحات سند دسته‌ای (${pages.size} صفحه)",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }

                        // دکمه سریع ساخت PDF
                        TextButton(
                            onClick = { showPdfExportDialog = true },
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.PictureAsPdf,
                                contentDescription = null,
                                modifier = Modifier.size(14.dp),
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "ادغام به PDF",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    // ردیف افقی صفحات و دکمه افزودن صفحه جدید
                    LazyRow(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp, vertical = 4.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        itemsIndexed(pages) { index, page ->
                            val isSelected = index == activeIndex
                            val thumbBitmap = page.processedBitmap ?: page.croppedBitmap

                            Box(
                                modifier = Modifier
                                    .width(64.dp)
                                    .height(84.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color.White)
                                    .border(
                                        width = if (isSelected) 2.5.dp else 1.dp,
                                        color = if (isSelected) MaterialTheme.colorScheme.primary else Color(0xFFCBD5E1),
                                        shape = RoundedCornerShape(8.dp)
                                    )
                                    .clickable {
                                        DocumentState.selectPage(index)
                                    }
                            ) {
                                Image(
                                    bitmap = thumbBitmap.asImageBitmap(),
                                    contentDescription = "صفحه ${index + 1}",
                                    modifier = Modifier.fillMaxSize(),
                                    contentScale = ContentScale.Crop
                                )

                                // برچسب شماره صفحه
                                Surface(
                                    color = if (isSelected) MaterialTheme.colorScheme.primary else Color.Black.copy(alpha = 0.65f),
                                    shape = RoundedCornerShape(topEnd = 6.dp),
                                    modifier = Modifier.align(Alignment.BottomStart)
                                ) {
                                    Text(
                                        text = "${index + 1}",
                                        color = Color.White,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }

                                // دکمه حذف صفحه (در صورتی که بیش از یک صفحه وجود داشته باشد)
                                if (pages.size > 1) {
                                    Box(
                                        modifier = Modifier
                                            .align(Alignment.TopEnd)
                                            .size(20.dp)
                                            .clip(CircleShape)
                                            .background(Color.Black.copy(alpha = 0.55f))
                                            .clickable {
                                                DocumentState.removePage(index)
                                            },
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Close,
                                            contentDescription = "حذف صفحه",
                                            tint = Color.White,
                                            modifier = Modifier.size(12.dp)
                                        )
                                    }
                                }
                            }
                        }

                        // کارت افزودن صفحه جدید به بسته
                        item {
                            Box(
                                modifier = Modifier
                                    .width(64.dp)
                                    .height(84.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.08f))
                                    .border(
                                        width = 1.dp,
                                        color = MaterialTheme.colorScheme.primary.copy(alpha = 0.4f),
                                        shape = RoundedCornerShape(8.dp)
                                    )
                                    .clickable { showAddPageMenu = true },
                                contentAlignment = Alignment.Center
                            ) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Add,
                                        contentDescription = "افزودن صفحه",
                                        tint = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.size(22.dp)
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = "+ صفحه",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // کادر پیش‌نمایش تصویر صفحه فعال
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .padding(horizontal = 16.dp, vertical = 8.dp),
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

    // پنجره پاپ‌آپ انتخاب منبع برای افزودن صفحه جدید (دوربین یا گالری)
    if (showAddPageMenu) {
        AlertDialog(
            onDismissRequest = { showAddPageMenu = false },
            title = {
                Text(
                    text = "افزودن صفحه جدید به سند",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Text(
                    text = "می‌توانید صفحه بعدی این سند را با دوربین ثبت کرده یا از گالری انتخاب کنید.",
                    style = MaterialTheme.typography.bodyMedium
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showAddPageMenu = false
                        val hasCam = ContextCompat.checkSelfPermission(
                            context,
                            Manifest.permission.CAMERA
                        ) == PackageManager.PERMISSION_GRANTED
                        if (hasCam) {
                            cameraLauncher.launch(null)
                        } else {
                            permissionLauncher.launch(Manifest.permission.CAMERA)
                        }
                    }
                ) {
                    Icon(imageVector = Icons.Default.CameraAlt, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("دوربین")
                }
            },
            dismissButton = {
                OutlinedButton(
                    onClick = {
                        showAddPageMenu = false
                        galleryLauncher.launch("image/*")
                    }
                ) {
                    Icon(imageVector = Icons.Default.AddPhotoAlternate, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("گالری")
                }
            }
        )
    }

    // دیالوگ خروجی و ادغام PDF با Android native PdfDocument API
    if (showPdfExportDialog) {
        var pdfTitle by remember { mutableStateOf("SmartDoc_${pages.size}Pages") }

        AlertDialog(
            onDismissRequest = { if (!isExportingPdf) showPdfExportDialog = false },
            icon = {
                Icon(
                    imageVector = Icons.Default.PictureAsPdf,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(36.dp)
                )
            },
            title = {
                Text(
                    text = "صدور سند چندصفحه‌ای PDF",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )
            },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "تعداد ${pages.size} صفحه پردازش‌شده در یک فایل استاندارد A4 با استفاده از Android native PdfDocument API ادغام خواهند شد.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        lineHeight = 20.sp
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = pdfTitle,
                        onValueChange = { pdfTitle = it },
                        label = { Text("نام فایل PDF") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    if (isExportingPdf) {
                        Spacer(modifier = Modifier.height(14.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("در حال تولید و ذخیره فایل PDF...", fontSize = 12.sp)
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    enabled = !isExportingPdf,
                    onClick = {
                        isExportingPdf = true
                        scope.launch {
                            val exportBitmaps = withContext(Dispatchers.Default) {
                                pages.map { page ->
                                    page.processedBitmap
                                        ?: DocumentFilterProcessor.applyFilter(page.croppedBitmap, page.filterType)
                                }
                            }
                            val savedUri = DocumentFilterProcessor.savePdfToStorage(
                                context = context,
                                pageBitmaps = exportBitmaps,
                                documentTitle = pdfTitle
                            )

                            // ذخیره مدرک در مدارک اخیر
                            RecentDocumentsRepository.saveDocument(
                                context = context,
                                title = pdfTitle,
                                pages = exportBitmaps
                            )

                            isExportingPdf = false
                            showPdfExportDialog = false

                            if (savedUri != null) {
                                Toast.makeText(
                                    context,
                                    "فایل PDF ذخیره شد و در مدارک اخیر ثبت گردید",
                                    Toast.LENGTH_LONG
                                ).show()
                            } else {
                                Toast.makeText(
                                    context,
                                    "فایل PDF با موفقیت در مدارک اخیر ثبت شد",
                                    Toast.LENGTH_SHORT
                                ).show()
                            }
                        }
                    }
                ) {
                    Icon(imageVector = Icons.Default.Download, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("ذخیره در دستگاه")
                }
            },
            dismissButton = {
                OutlinedButton(
                    enabled = !isExportingPdf,
                    onClick = {
                        isExportingPdf = true
                        scope.launch {
                            val exportBitmaps = withContext(Dispatchers.Default) {
                                pages.map { page ->
                                    page.processedBitmap
                                        ?: DocumentFilterProcessor.applyFilter(page.croppedBitmap, page.filterType)
                                }
                            }
                            DocumentFilterProcessor.sharePdfDocument(
                                context = context,
                                pageBitmaps = exportBitmaps,
                                documentTitle = pdfTitle
                            )
                            isExportingPdf = false
                            showPdfExportDialog = false
                        }
                    }
                ) {
                    Icon(imageVector = Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("اشتراک‌گذاری")
                }
            }
        )
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
            .fillMaxHeight(0.98f)
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
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(12.dp),
        color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
        contentColor = if (isSelected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = Modifier.height(48.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = title,
                fontSize = 12.sp,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
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
