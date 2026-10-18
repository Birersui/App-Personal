import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = "android";
const manifestPath = resolve(root, "app/src/main/AndroidManifest.xml");
const variablesPath = resolve(root, "variables.gradle");
const appGradlePath = resolve(root, "app/build.gradle");
const gradlePropsPath = resolve(root, "gradle.properties");

if (!existsSync(manifestPath)) {
  console.warn("patch-android: no se encontró el proyecto Android (se omite)");
  process.exit(0);
}

const read = (p) => readFileSync(p, "utf8");
const write = (p, s) => writeFileSync(p, s);
const log = (m) => console.log("patch-android:", m);

// --- Permisos de notificaciones y alarmas exactas -------------------------
const perms = [
  "android.permission.SCHEDULE_EXACT_ALARM",
  "android.permission.USE_EXACT_ALARM",
  "android.permission.POST_NOTIFICATIONS",
];

let xml = read(manifestPath);
const missing = perms.filter((p) => !xml.includes(p));
if (missing.length) {
  const lines = missing
    .map((p) => `    <uses-permission android:name="${p}" />`)
    .join("\n");
  xml = xml.replace(/<\/manifest>/, `${lines}\n</manifest>`);
  write(manifestPath, xml);
  log("permisos añadidos ->", missing.join(", "));
} else {
  log("permisos ya presentes");
}

// --- compileSdk / targetSdk (Play exige una API reciente) -----------------
const SDK = "35";
let vars = read(variablesPath);
const varsBefore = vars;
vars = vars
  .replace(/(compileSdkVersion\s*=\s*)\d+/g, `$1${SDK}`)
  .replace(/(targetSdkVersion\s*=\s*)\d+/g, `$1${SDK}`);
if (vars !== varsBefore) write(variablesPath, vars);
log(`compileSdk/targetSdk = ${SDK}`);

// --- Silenciar aviso de AGP sobre compileSdk nuevo ------------------------
let props = read(gradlePropsPath);
if (!props.includes("android.suppressUnsupportedCompileSdk")) {
  props += `\nandroid.suppressUnsupportedCompileSdk=${SDK}\n`;
  write(gradlePropsPath, props);
  log("android.suppressUnsupportedCompileSdk añadido");
}

// --- Firma release + versionado -------------------------------------------
let gradle = read(appGradlePath);
const MARK = "// patch-android";

if (!gradle.includes(`${MARK}:version`)) {
  gradle = gradle
    .replace(
      /(\n\s*versionCode\s+)\d+/,
      `$1((System.getenv("VERSION_CODE") ?: "1").toInteger()) ${MARK}:version`
    )
    .replace(
      /(\n\s*versionName\s+)"[^"]*"/,
      `$1(System.getenv("VERSION_NAME") ?: "1.0.0")`
    );
}

if (!gradle.includes(`${MARK}:signing`)) {
  const signingBlock = `    ${MARK}:signing
    signingConfigs {
        release {
            def ks = System.getenv("ANDROID_KEYSTORE_FILE")
            if (ks) {
                storeFile file(ks)
                storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias System.getenv("ANDROID_KEY_ALIAS")
                keyPassword System.getenv("ANDROID_KEY_PASSWORD")
            }
        }
    }
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
            if (System.getenv("ANDROID_KEYSTORE_FILE")) {
                signingConfig signingConfigs.release
            }
        }
    }`;

  gradle = gradle.replace(
    /    buildTypes\s*\{[\s\S]*?\n    \}/,
    signingBlock
  );
  write(appGradlePath, gradle);
  log("signingConfig release + versionado configurados");
} else {
  log("firma release ya configurada");
}
