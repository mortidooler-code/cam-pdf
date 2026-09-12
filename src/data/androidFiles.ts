export interface AndroidFileInfo {
  path: string;
  name: string;
  type: 'workflow' | 'kotlin' | 'gradle' | 'manifest' | 'xml';
  description: string;
}

export const ANDROID_FILES: AndroidFileInfo[] = [
  {
    path: '.github/workflows/build-apk.yml',
    name: 'build-apk.yml',
    type: 'workflow',
    description: 'خط لوله خودکار گیت‌هاب اکشنز (Java 17 + بررسی و بازیابی خودکار Wrapper + assembleDebug + Upload Artifact APK)'
  },
  {
    path: 'app/src/main/java/com/docscanner/smartcopy/util/RecentDocumentsRepository.kt',
    name: 'RecentDocumentsRepository.kt',
    type: 'kotlin',
    description: 'مدیریت و ذخیره‌سازی دائمی مدارک اسکن‌شده واقعی کاربر در حافظه داخلی دستگاه با متادیتای JSON و تصاویر JPEG واقعی'
  },
  {
    path: 'app/src/main/java/com/docscanner/smartcopy/util/DocumentFilterProcessor.kt',
    name: 'DocumentFilterProcessor.kt',
    type: 'kotlin',
    description: 'موتور پردازش فیلترها (ColorMatrix) و الگوریتم آشکارسازی لبه سوبل (Sobel 3x3) با کنتراست روشنایی محلی جهت تشخیص خودکار کادر و لبه‌های کاغذ سند، برش Canvas و اشتراک‌گذاری'
  },
  {
    path: 'app/src/main/java/com/docscanner/smartcopy/model/DocumentState.kt',
    name: 'DocumentState.kt',
    type: 'kotlin',
    description: 'مدیریت استیت بیت‌مپ فعال سند، دیکود کردن تصویر گالری با ImageDecoder و تولید Canvas مدرک رسمی نمونه'
  },
  {
    path: 'app/src/main/java/com/docscanner/smartcopy/ui/screens/CropScreen.kt',
    name: 'CropScreen.kt',
    type: 'kotlin',
    description: 'رابط کاربری برش دستی سند با Canvas بومی و تشخیص حرکات لمسی، لبه‌یابی هوشمند خودکار با الگوریتم سوبل (Sobel)، ۴ دستگیره گوشه، شبکه یک‌سوم و چرخش ۹۰ درجه'
  },
  {
    path: 'app/src/main/java/com/docscanner/smartcopy/ui/screens/HomeScreen.kt',
    name: 'HomeScreen.kt',
    type: 'kotlin',
    description: 'صفحه اصلی Compose با اتصال مستقیم به دوربین (TakePicturePreview)، گالری (GetContent) و اسناد اخیر'
  },
  {
    path: 'app/src/main/java/com/docscanner/smartcopy/ui/screens/PreviewFilterScreen.kt',
    name: 'PreviewFilterScreen.kt',
    type: 'kotlin',
    description: 'صفحه پیش‌نمایش و اعمال بلادرنگ فیلترها روی Bitmap، دکمه ذخیره در گالری (MediaStore) و اشتراک‌گذاری (Intent.ACTION_SEND)'
  },
  {
    path: 'app/src/main/java/com/docscanner/smartcopy/MainActivity.kt',
    name: 'MainActivity.kt',
    type: 'kotlin',
    description: 'اکتیویتی اصلی نیتیو اندروید با تنظیم تم کاتلین و راه‌اندازی AppNavHost'
  },
  {
    path: 'app/src/main/java/com/docscanner/smartcopy/ui/navigation/AppNavHost.kt',
    name: 'AppNavHost.kt',
    type: 'kotlin',
    description: 'ناوبری رسمی Navigation Compose بین صفحه اصلی و صفحه پیش‌نمایش'
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    type: 'manifest',
    description: 'مانیفست با مجوزهای دوربین (CAMERA)، تعریف FileProvider و پشتیبانی کامل راست‌چین (supportsRtl="true")'
  },
  {
    path: 'app/src/main/res/xml/file_paths.xml',
    name: 'file_paths.xml',
    type: 'xml',
    description: 'مسیرهای مجاز FileProvider برای اشتراک‌گذاری امن تصاویر مدرک اسکن‌شده بین برنامه‌ها'
  },
  {
    path: 'app/build.gradle.kts',
    name: 'app/build.gradle.kts',
    type: 'gradle',
    description: 'اسکریپت بیلد ماژول اپ با وابستگی‌های استاندارد و پایدار Jetpack Compose (بدون هیچ وابستگی خارجی اضافه)'
  },
  {
    path: 'build.gradle.kts',
    name: 'build.gradle.kts (Root)',
    type: 'gradle',
    description: 'اسکریپت ریشه گریدل با پلاگین‌های کاتلین و کامپوز'
  },
  {
    path: 'settings.gradle.kts',
    name: 'settings.gradle.kts',
    type: 'gradle',
    description: 'تنظیمات مخازن استاندارد گوگل و Maven Central'
  }
];
