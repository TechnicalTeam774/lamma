// بعد `npx cap add android`: اسم الأبلكيشن والأيقونة وشاشة الفتح، والتوقيع من أسرار جيت هاب
import fs from 'node:fs';
import path from 'node:path';

const APP = 'android/app';
const RES = `${APP}/src/main/res`;
if (!fs.existsSync(APP)) {
  console.error('android/ not found: run `npx cap add android` first');
  process.exit(1);
}
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const f of fs.readdirSync(src)) {
    const s = path.join(src, f);
    const d = path.join(dst, f);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
function edit(file, fn) {
  const before = fs.readFileSync(file, 'utf8');
  const after = fn(before);
  if (after !== before) fs.writeFileSync(file, after);
}

// 1) شاشة الفتح الأصلية بتاعة Capacitor تتشال
for (const dir of fs.readdirSync(RES)) {
  const f = path.join(RES, dir, 'splash.png');
  if (dir.startsWith('drawable') && fs.existsSync(f)) fs.unlinkSync(f);
}
// 2) الأيقونات والألوان وشاشة الفتح بتاعة لمّة
copyDir('android-res', RES);
for (const dir of fs.readdirSync(RES)) {
  const f = path.join(RES, dir, 'ic_launcher_foreground.png');
  if (dir.startsWith('mipmap') && fs.existsSync(f)) fs.unlinkSync(f);
}
for (const f of [path.join(RES, 'drawable-v24', 'ic_launcher_foreground.xml'), path.join(RES, 'drawable', 'ic_launcher_background.xml')]) {
  if (fs.existsSync(f)) fs.unlinkSync(f);
}
// 3) شاشة الفتح في أندرويد 12 وأحدث
edit(path.join(RES, 'values', 'styles.xml'), (s) => {
  if (s.includes('windowSplashScreenBackground')) return s;
  return s.replace(
    '<item name="android:background">@drawable/splash</item>',
    '<item name="android:background">@drawable/splash</item>\n'
    + '        <item name="windowSplashScreenBackground">@color/lamma_splash_bg</item>\n'
    + '        <item name="windowSplashScreenAnimatedIcon">@mipmap/ic_launcher_fg</item>\n'
    + '        <item name="windowSplashScreenIconBackgroundColor">@color/ic_launcher_background</item>',
  );
});
// 4) الاسم
edit(path.join(RES, 'values', 'strings.xml'), (s) => s
  .replace(/<string name="app_name">[^<]*<\/string>/, '<string name="app_name">لمّة</string>')
  .replace(/<string name="title_activity_main">[^<]*<\/string>/, '<string name="title_activity_main">لمّة</string>'));
// 5) الكيبورد ميغطيش خانة الكتابة في الشات
edit(path.join(APP, 'src/main/AndroidManifest.xml'), (s) => (s.includes('windowSoftInputMode')
  ? s
  : s.replace('android:launchMode="singleTask"', 'android:launchMode="singleTask"\n            android:windowSoftInputMode="adjustResize"')));
// 5b) أيقونة ولون الإشعارات
edit(path.join(APP, 'src/main/AndroidManifest.xml'), (s) => (s.includes('default_notification_icon')
  ? s
  : s.replace('</application>', '    <meta-data android:name="com.google.firebase.messaging.default_notification_icon" android:resource="@drawable/ic_stat_lamma" />\n'
    + '        <meta-data android:name="com.google.firebase.messaging.default_notification_color" android:resource="@color/lamma_accent" />\n'
    + '        <meta-data android:name="com.google.firebase.messaging.default_notification_channel_id" android:value="lamma" />\n    </application>')));
// 6) دخول جوجل من الموبايل
edit('android/variables.gradle', (s) => (s.includes('rgcfaIncludeGoogle') ? s : s.replace(/ext \{\n/, 'ext {\n    rgcfaIncludeGoogle = true\n')));
// 7) رقم النسخة والتوقيع
edit(path.join(APP, 'build.gradle'), (s) => {
  if (s.includes('LAMMA_KEYSTORE')) return s;
  s = s.replace(/versionCode \d+/, 'versionCode((System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInteger())')
    .replace(/versionName "[^"]*"/, 'versionName "1.0.${System.getenv("GITHUB_RUN_NUMBER") ?: "0"}"');
  return s.replace(
    /buildTypes \{\s*release \{/,
    `lint {
        checkReleaseBuilds = false
    }
    signingConfigs {
        release {
            if (System.getenv("LAMMA_KEYSTORE")) {
                storeFile file(System.getenv("LAMMA_KEYSTORE"))
                storePassword System.getenv("LAMMA_STORE_PASSWORD")
                keyAlias "lamma"
                keyPassword System.getenv("LAMMA_STORE_PASSWORD")
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release`,
  );
});
console.log('android project patched');
