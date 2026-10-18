import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const manifest = resolve("android/app/src/main/AndroidManifest.xml");

if (!existsSync(manifest)) {
  console.warn("patch-android: no se encontró", manifest, "(se omite)");
  process.exit(0);
}

const perms = [
  "android.permission.SCHEDULE_EXACT_ALARM",
  "android.permission.USE_EXACT_ALARM",
  "android.permission.POST_NOTIFICATIONS",
];

let xml = readFileSync(manifest, "utf8");
const missing = perms.filter((p) => !xml.includes(p));

if (missing.length) {
  const lines = missing
    .map((p) => `    <uses-permission android:name="${p}" />`)
    .join("\n");
  xml = xml.replace(/<\/manifest>/, `${lines}\n</manifest>`);
  writeFileSync(manifest, xml);
  console.log("patch-android: permisos añadidos ->", missing.join(", "));
} else {
  console.log("patch-android: permisos ya presentes");
}
