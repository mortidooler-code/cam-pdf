package com.docscanner.smartcopy.ui.screens

import android.graphics.Bitmap
import android.graphics.Matrix
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.docscanner.smartcopy.model.DocumentState
import com.docscanner.smartcopy.util.DocumentFilterProcessor
import kotlin.math.sqrt

enum class CropHandle {
    NONE,
    TOP_LEFT,
    TOP_RIGHT,
    BOTTOM_RIGHT,
    BOTTOM_LEFT,
    CENTER_BODY
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CropScreen(
    docId: String,
    onNavigateBack: () -> Unit,
    onCropConfirmed: () -> Unit
) {
    // تصویر مبنا برای برش (تصویر خام اولیه یا نمونه پیش‌فرض)
    val originalSourceBitmap = remember {
        DocumentState.rawBitmap
            ?: DocumentState.activeBitmap
            ?: DocumentState.createSampleDocumentBitmap("گواهی تأیید هویت و مدارک")
    }

    // چرخش دستی بر حسب درجه (۰، ۹۰، ۱۸۰، ۲۷۰)
    var rotationDegrees by remember { mutableStateOf(DocumentState.currentRotationDegrees) }

    // ایجاد بیت‌مپ چرخیده‌شده در حافظه
    val displayBitmap = remember(originalSourceBitmap, rotationDegrees) {
        if (rotationDegrees % 360 == 0) {
            originalSourceBitmap
        } else {
            val matrix = Matrix().apply { postRotate(rotationDegrees.toFloat()) }
            Bitmap.createBitmap(
                originalSourceBitmap,
                0,
                0,
                originalSourceBitmap.width,
                originalSourceBitmap.height,
                matrix,
                true
            )
        }
    }

    // محاسبه پیشنهاد اولیه کادر بر اساس الگوریتم تشخیص لبه سوبل و کنتراست نوری
    val initialSuggestedBounds = remember(originalSourceBitmap) {
        DocumentFilterProcessor.detectDocumentBoundingBox(originalSourceBitmap)
    }

    // مختصات نسبی کادر برش (مقادیر نرمال‌شده بین 0f تا 1f بر اساس لبه‌یابی هوشمند محلی)
    var normLeft by remember { mutableStateOf(initialSuggestedBounds.left) }
    var normTop by remember { mutableStateOf(initialSuggestedBounds.top) }
    var normRight by remember { mutableStateOf(initialSuggestedBounds.right) }
    var normBottom by remember { mutableStateOf(initialSuggestedBounds.bottom) }

    var activeHandle by remember { mutableStateOf(CropHandle.NONE) }

    val density = LocalDensity.current
    val handleTouchRadiusPx = with(density) { 36.dp.toPx() }
    val minBoxSizePx = with(density) { 50.dp.toPx() }

    // مستطیل قرارگیری تصویر داخل کادر Canvas
    var imageFitRect by remember { mutableStateOf(Rect.Zero) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    val titleText = if (DocumentState.pages.size > 1) {
                        "برش سند (صفحه ${DocumentState.activePageIndex + 1} از ${DocumentState.pages.size})"
                    } else {
                        "تنظیم کادر و برش مدرک"
                    }
                    Text(
                        text = titleText,
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
                    // تشخیص هوشمند لبه‌های سند با الگوریتم Sobel
                    IconButton(
                        onClick = {
                            val detected = DocumentFilterProcessor.detectDocumentBoundingBox(displayBitmap)
                            normLeft = detected.left
                            normTop = detected.top
                            normRight = detected.right
                            normBottom = detected.bottom
                        }
                    ) {
                        Icon(
                            imageVector = Icons.Default.AutoFixHigh,
                            contentDescription = "تشخیص هوشمند لبه‌ها",
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }

                    // چرخش ۹۰ درجه ساعت‌گرد
                    IconButton(
                        onClick = {
                            rotationDegrees = (rotationDegrees + 90) % 360
                            // بعد از چرخش، مجدداً لبه‌های سند شناسایی می‌شوند
                            val matrix = Matrix().apply { postRotate(((rotationDegrees) % 360).toFloat()) }
                            val rotated = Bitmap.createBitmap(
                                originalSourceBitmap,
                                0,
                                0,
                                originalSourceBitmap.width,
                                originalSourceBitmap.height,
                                matrix,
                                true
                            )
                            val detected = DocumentFilterProcessor.detectDocumentBoundingBox(rotated)
                            normLeft = detected.left
                            normTop = detected.top
                            normRight = detected.right
                            normBottom = detected.bottom
                        }
                    ) {
                        Icon(
                            imageVector = Icons.Default.RotateRight,
                            contentDescription = "چرخش ۹۰ درجه",
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }

                    // انتخاب کل تصویر (بدون حاشیه)
                    IconButton(
                        onClick = {
                            normLeft = 0.005f
                            normTop = 0.005f
                            normRight = 0.995f
                            normBottom = 0.995f
                        }
                    ) {
                        Icon(
                            imageVector = Icons.Default.CropFree,
                            contentDescription = "انتخاب تمام کادر",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        bottomBar = {
            Surface(
                tonalElevation = 8.dp,
                shadowElevation = 12.dp,
                color = MaterialTheme.colorScheme.surface,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // متن راهنمای کاربر
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 12.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Crop,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "گوشه‌های آبی را برای تعیین لبه‌های سند جابجا کنید",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center
                        )
                    }

                    // دکمه‌های عملیات سریع و دکمه اصلی تأیید
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // تشخیص خودکار مجدد لبه‌های مدرک با الگوریتم سوبل
                        OutlinedButton(
                            onClick = {
                                val detected = DocumentFilterProcessor.detectDocumentBoundingBox(displayBitmap)
                                normLeft = detected.left
                                normTop = detected.top
                                normRight = detected.right
                                normBottom = detected.bottom
                            },
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.height(48.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.AutoFixHigh,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("تشخیص هوشمند", fontSize = 11.sp, maxLines = 1)
                        }

                        // ریست کادر به حالت بهینه استاندارد سند
                        OutlinedButton(
                            onClick = {
                                normLeft = 0.06f
                                normTop = 0.06f
                                normRight = 0.94f
                                normBottom = 0.94f
                            },
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.height(48.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Refresh,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("کادر کامل", fontSize = 11.sp, maxLines = 1)
                        }

                        // دکمه بزرگ تأیید برش و ورود به پردازش فتوکپی
                        Button(
                            onClick = {
                                val cropped = DocumentFilterProcessor.cropAndRotateBitmap(
                                    source = originalSourceBitmap,
                                    normalizedLeft = normLeft,
                                    normalizedTop = normTop,
                                    normalizedRight = normRight,
                                    normalizedBottom = normBottom,
                                    rotationDegrees = rotationDegrees
                                )
                                DocumentState.activeBitmap = cropped
                                DocumentState.currentRotationDegrees = rotationDegrees
                                DocumentState.updateActivePageCrop(cropped)
                                onCropConfirmed()
                            },
                            modifier = Modifier
                                .weight(1f)
                                .height(48.dp),
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.primary
                            ),
                            elevation = ButtonDefaults.buttonElevation(defaultElevation = 2.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Check,
                                contentDescription = null,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "تأیید و اعمال فیلترها",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        },
        containerColor = Color(0xFF0F172A) // پس‌زمینه تیره متمرکز برای وضوح کادر سند
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(Color(0xFF0F172A)),
            contentAlignment = Alignment.Center
        ) {
            val imageBitmap = remember(displayBitmap) { displayBitmap.asImageBitmap() }

            Canvas(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(12.dp)
                    .pointerInput(imageFitRect) {
                        detectDragGestures(
                            onDragStart = { startOffset ->
                                if (imageFitRect.width <= 0 || imageFitRect.height <= 0) return@detectDragGestures

                                val cropX1 = imageFitRect.left + normLeft * imageFitRect.width
                                val cropY1 = imageFitRect.top + normTop * imageFitRect.height
                                val cropX2 = imageFitRect.left + normRight * imageFitRect.width
                                val cropY2 = imageFitRect.top + normBottom * imageFitRect.height

                                fun dist(p1: Offset, x2: Float, y2: Float): Float {
                                    val dx = p1.x - x2
                                    val dy = p1.y - y2
                                    return sqrt(dx * dx + dy * dy)
                                }

                                val dTL = dist(startOffset, cropX1, cropY1)
                                val dTR = dist(startOffset, cropX2, cropY1)
                                val dBR = dist(startOffset, cropX2, cropY2)
                                val dBL = dist(startOffset, cropX1, cropY2)

                                activeHandle = when {
                                    dTL <= handleTouchRadiusPx -> CropHandle.TOP_LEFT
                                    dTR <= handleTouchRadiusPx -> CropHandle.TOP_RIGHT
                                    dBR <= handleTouchRadiusPx -> CropHandle.BOTTOM_RIGHT
                                    dBL <= handleTouchRadiusPx -> CropHandle.BOTTOM_LEFT
                                    startOffset.x in cropX1..cropX2 && startOffset.y in cropY1..cropY2 -> CropHandle.CENTER_BODY
                                    else -> CropHandle.NONE
                                }
                            },
                            onDragEnd = {
                                activeHandle = CropHandle.NONE
                            },
                            onDragCancel = {
                                activeHandle = CropHandle.NONE
                            },
                            onDrag = { change, dragAmount ->
                                change.consume()
                                if (imageFitRect.width <= 0 || imageFitRect.height <= 0) return@detectDragGestures

                                val dxNorm = dragAmount.x / imageFitRect.width
                                val dyNorm = dragAmount.y / imageFitRect.height

                                val minWidthNorm = minBoxSizePx / imageFitRect.width
                                val minHeightNorm = minBoxSizePx / imageFitRect.height

                                when (activeHandle) {
                                    CropHandle.TOP_LEFT -> {
                                        normLeft = (normLeft + dxNorm).coerceIn(0f, normRight - minWidthNorm)
                                        normTop = (normTop + dyNorm).coerceIn(0f, normBottom - minHeightNorm)
                                    }
                                    CropHandle.TOP_RIGHT -> {
                                        normRight = (normRight + dxNorm).coerceIn(normLeft + minWidthNorm, 1f)
                                        normTop = (normTop + dyNorm).coerceIn(0f, normBottom - minHeightNorm)
                                    }
                                    CropHandle.BOTTOM_RIGHT -> {
                                        normRight = (normRight + dxNorm).coerceIn(normLeft + minWidthNorm, 1f)
                                        normBottom = (normBottom + dyNorm).coerceIn(normTop + minHeightNorm, 1f)
                                    }
                                    CropHandle.BOTTOM_LEFT -> {
                                        normLeft = (normLeft + dxNorm).coerceIn(0f, normRight - minWidthNorm)
                                        normBottom = (normBottom + dyNorm).coerceIn(normTop + minHeightNorm, 1f)
                                    }
                                    CropHandle.CENTER_BODY -> {
                                        val boxWidth = normRight - normLeft
                                        val boxHeight = normBottom - normTop
                                        var newLeft = normLeft + dxNorm
                                        var newTop = normTop + dyNorm

                                        if (newLeft < 0f) newLeft = 0f
                                        if (newTop < 0f) newTop = 0f
                                        if (newLeft + boxWidth > 1f) newLeft = 1f - boxWidth
                                        if (newTop + boxHeight > 1f) newTop = 1f - boxHeight

                                        normLeft = newLeft
                                        normTop = newTop
                                        normRight = newLeft + boxWidth
                                        normBottom = newTop + boxHeight
                                    }
                                    CropHandle.NONE -> {}
                                }
                            }
                        )
                    }
            ) {
                val canvasWidth = size.width
                val canvasHeight = size.height

                if (canvasWidth <= 0 || canvasHeight <= 0 || displayBitmap.width <= 0 || displayBitmap.height <= 0) {
                    return@Canvas
                }

                // محاسبه مستطیل تصویر به صورت Fit در مرکز بوم
                val imageAspect = displayBitmap.width.toFloat() / displayBitmap.height.toFloat()
                val canvasAspect = canvasWidth / canvasHeight

                val fitWidth: Float
                val fitHeight: Float
                val fitLeft: Float
                val fitTop: Float

                if (imageAspect > canvasAspect) {
                    fitWidth = canvasWidth
                    fitHeight = canvasWidth / imageAspect
                    fitLeft = 0f
                    fitTop = (canvasHeight - fitHeight) / 2f
                } else {
                    fitHeight = canvasHeight
                    fitWidth = canvasHeight * imageAspect
                    fitLeft = (canvasWidth - fitWidth) / 2f
                    fitTop = 0f
                }

                val currentFitRect = Rect(fitLeft, fitTop, fitLeft + fitWidth, fitTop + fitHeight)
                if (imageFitRect != currentFitRect) {
                    imageFitRect = currentFitRect
                }

                // ۱. رسم تصویر پس‌زمینه داخل Canvas
                drawImage(
                    image = imageBitmap,
                    dstOffset = IntOffset(fitLeft.toInt(), fitTop.toInt()),
                    dstSize = IntSize(fitWidth.toInt(), fitHeight.toInt())
                )

                // ۲. محاسبه مختصات مطلق کادر برش روی بوم
                val cropX1 = fitLeft + normLeft * fitWidth
                val cropY1 = fitTop + normTop * fitHeight
                val cropX2 = fitLeft + normRight * fitWidth
                val cropY2 = fitTop + normBottom * fitHeight
                val cropW = cropX2 - cropX1
                val cropH = cropY2 - cropY1

                val scrimColor = Color.Black.copy(alpha = 0.58f)

                // ۳. ایجاد ماسک نیمه‌شفاف برای محدوده خارج از سند
                // بخش بالا
                drawRect(
                    color = scrimColor,
                    topLeft = Offset(fitLeft, fitTop),
                    size = Size(fitWidth, cropY1 - fitTop)
                )
                // بخش پایین
                drawRect(
                    color = scrimColor,
                    topLeft = Offset(fitLeft, cropY2),
                    size = Size(fitWidth, fitTop + fitHeight - cropY2)
                )
                // بخش چپ
                drawRect(
                    color = scrimColor,
                    topLeft = Offset(fitLeft, cropY1),
                    size = Size(cropX1 - fitLeft, cropH)
                )
                // بخش راست
                drawRect(
                    color = scrimColor,
                    topLeft = Offset(cropX2, cropY1),
                    size = Size(fitLeft + fitWidth - cropX2, cropH)
                )

                // ۴. رسم شبکه راهنمای یک‌سوم (Rule of Thirds) داخل کادر برش
                val gridColor = Color.White.copy(alpha = 0.35f)
                val gridStroke = Stroke(width = 1.dp.toPx())

                // دو خط عمودی
                drawLine(
                    color = gridColor,
                    start = Offset(cropX1 + cropW / 3f, cropY1),
                    end = Offset(cropX1 + cropW / 3f, cropY2),
                    strokeWidth = gridStroke.width
                )
                drawLine(
                    color = gridColor,
                    start = Offset(cropX1 + 2f * cropW / 3f, cropY1),
                    end = Offset(cropX1 + 2f * cropW / 3f, cropY2),
                    strokeWidth = gridStroke.width
                )
                // دو خط افقی
                drawLine(
                    color = gridColor,
                    start = Offset(cropX1, cropY1 + cropH / 3f),
                    end = Offset(cropX2, cropY1 + cropH / 3f),
                    strokeWidth = gridStroke.width
                )
                drawLine(
                    color = gridColor,
                    start = Offset(cropX1, cropY1 + 2f * cropH / 3f),
                    end = Offset(cropX2, cropY1 + 2f * cropH / 3f),
                    strokeWidth = gridStroke.width
                )

                // ۵. کادر دور برش
                drawRect(
                    color = Color(0xFF38BDF8),
                    topLeft = Offset(cropX1, cropY1),
                    size = Size(cropW, cropH),
                    style = Stroke(width = 2.dp.toPx())
                )

                // ۶. دستگیره‌های گوشه به صورت L شکل و دستگیره دایره‌ای
                val cornerLen = 22.dp.toPx()
                val cornerStroke = Stroke(width = 4.dp.toPx())
                val cornerColor = Color(0xFF0284C7)

                // گوشه بالا-چپ
                drawLine(cornerColor, Offset(cropX1, cropY1), Offset(cropX1 + cornerLen, cropY1), cornerStroke.width)
                drawLine(cornerColor, Offset(cropX1, cropY1), Offset(cropX1, cropY1 + cornerLen), cornerStroke.width)

                // گوشه بالا-راست
                drawLine(cornerColor, Offset(cropX2, cropY1), Offset(cropX2 - cornerLen, cropY1), cornerStroke.width)
                drawLine(cornerColor, Offset(cropX2, cropY1), Offset(cropX2, cropY1 + cornerLen), cornerStroke.width)

                // گوشه پایین-راست
                drawLine(cornerColor, Offset(cropX2, cropY2), Offset(cropX2 - cornerLen, cropY2), cornerStroke.width)
                drawLine(cornerColor, Offset(cropX2, cropY2), Offset(cropX2, cropY2 - cornerLen), cornerStroke.width)

                // گوشه پایین-چپ
                drawLine(cornerColor, Offset(cropX1, cropY2), Offset(cropX1 + cornerLen, cropY2), cornerStroke.width)
                drawLine(cornerColor, Offset(cropX1, cropY2), Offset(cropX1, cropY2 - cornerLen), cornerStroke.width)

                // ۷. دایره‌های لمسی در هر ۴ گوشه
                val handleRadius = 9.dp.toPx()
                val outerRadius = 13.dp.toPx()

                listOf(
                    Offset(cropX1, cropY1),
                    Offset(cropX2, cropY1),
                    Offset(cropX2, cropY2),
                    Offset(cropX1, cropY2)
                ).forEach { point ->
                    // هاله خارجی سفید
                    drawCircle(
                        color = Color.White,
                        radius = outerRadius,
                        center = point
                    )
                    // هسته آبی لمسی
                    drawCircle(
                        color = Color(0xFF0284C7),
                        radius = handleRadius,
                        center = point
                    )
                }
            }
        }
    }
}
