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
    description: 'خط لوله خودکار گیت‌هاب اکشنز (Java 17 + assembleDebug + Upload Artifact APK)'
  },
  {
    path: 'app/src/main/java/com/docscanner/smartcopy/MainActivity.kt',
    name: 'MainActivity.kt',
    type: 'kotlin',
    description: 'اکتیویتی اصلی نیتیو اندروید با تنظیم تم کاتلین و لانچر درخواست مجوز دوربین'
  },
  {
    path: 'app/src/main/java/com/docscanner/smartcopy/ui/screens/HomeScreen.kt',
    name: 'HomeScreen.kt',
    type: 'kotlin',
    description: 'صفحه اصلی Jetpack Compose با لیست مدارک اخیر و دکمه‌های بزرگ دوربین و گالری'
  },
  {
    path: 'app/src/main/java/com/docscanner/smartcopy/ui/screens/PreviewFilterScreen.kt',
    name: 'PreviewFilterScreen.kt',
    type: 'kotlin',
    description: 'صفحه پیش‌نمایش و ۴ فیلتر هوشمند (فتوکپی، سیاه‌سفید، رنگی شفاف، اصلی)'
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
    description: 'مانیفست با مجوزهای دوربین (CAMERA) و پشتیبانی کامل راست‌چین (supportsRtl="true")'
  },
  {
    path: 'app/build.gradle.kts',
    name: 'app/build.gradle.kts',
    type: 'gradle',
    description: 'اسکریپت بیلد ماژول اپ با وابستگی‌های استاندارد و پایدار Jetpack Compose'
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
    description: 'تنظیمات مخازن Google و MavenCentral و ماژول :app'
  }
];
