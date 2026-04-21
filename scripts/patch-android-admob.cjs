/* eslint-disable */
/**
 * Post-`cap sync` script.
 *
 * Why: @capacitor-community/admob does NOT auto-inject the required
 *   <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" />
 * into AndroidManifest.xml. Without it, the Google Mobile Ads SDK throws
 * an IllegalStateException as soon as MobileAds.initialize() runs and the
 * Android app crashes the moment it launches.
 *
 * This script:
 *   1. Writes/updates android/app/src/main/res/values/strings.xml so it
 *      contains <string name="admob_app_id">…</string>.
 *   2. Inserts the <meta-data …APPLICATION_ID …/> tag inside <application>
 *      in android/app/src/main/AndroidManifest.xml (idempotent).
 *
 * Run automatically via the `postinstall` and `cap:sync` npm scripts.
 */
const fs = require('fs');
const path = require('path');

const ADMOB_APP_ID = 'ca-app-pub-9135467957897987~6645958141';

const projectRoot = path.resolve(__dirname, '..');
const androidDir = path.join(projectRoot, 'android');

if (!fs.existsSync(androidDir)) {
  console.log('[admob-patch] android/ folder not found — skipping (run `npx cap add android` first).');
  process.exit(0);
}

// 1. strings.xml ----------------------------------------------------------
const stringsPath = path.join(androidDir, 'app', 'src', 'main', 'res', 'values', 'strings.xml');
let stringsXml = fs.existsSync(stringsPath)
  ? fs.readFileSync(stringsPath, 'utf8')
  : `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n</resources>\n`;

if (/<string\s+name="admob_app_id">/.test(stringsXml)) {
  stringsXml = stringsXml.replace(
    /<string\s+name="admob_app_id">[^<]*<\/string>/,
    `<string name="admob_app_id">${ADMOB_APP_ID}</string>`,
  );
} else {
  stringsXml = stringsXml.replace(
    /<\/resources>/,
    `    <string name="admob_app_id">${ADMOB_APP_ID}</string>\n</resources>`,
  );
}
fs.mkdirSync(path.dirname(stringsPath), { recursive: true });
fs.writeFileSync(stringsPath, stringsXml);
console.log('[admob-patch] strings.xml updated.');

// 2. AndroidManifest.xml --------------------------------------------------
const manifestPath = path.join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml');
if (!fs.existsSync(manifestPath)) {
  console.warn('[admob-patch] AndroidManifest.xml not found — skipping meta-data injection.');
  process.exit(0);
}

let manifest = fs.readFileSync(manifestPath, 'utf8');
const META_TAG = `        <meta-data\n            android:name="com.google.android.gms.ads.APPLICATION_ID"\n            android:value="@string/admob_app_id" />\n`;

if (/com\.google\.android\.gms\.ads\.APPLICATION_ID/.test(manifest)) {
  console.log('[admob-patch] AdMob APPLICATION_ID meta-data already present.');
} else if (/<\/application>/.test(manifest)) {
  manifest = manifest.replace(/<\/application>/, `${META_TAG}    </application>`);
  fs.writeFileSync(manifestPath, manifest);
  console.log('[admob-patch] AdMob APPLICATION_ID meta-data injected into AndroidManifest.xml.');
} else {
  console.warn('[admob-patch] Could not find </application> tag — manifest left unchanged.');
}

console.log('[admob-patch] Done ✔');