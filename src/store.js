import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";

export const DB_FILENAME = "mis-finanzas.sqlite";
export const isNative = Capacitor.isNativePlatform();

function bytesToBase64(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function readDbBytes() {
  try {
    const res = await Filesystem.readFile({
      path: DB_FILENAME,
      directory: Directory.Data,
    });
    return base64ToBytes(res.data);
  } catch (e) {
    return null;
  }
}

export async function writeDbBytes(bytes) {
  await Filesystem.writeFile({
    path: DB_FILENAME,
    directory: Directory.Data,
    data: bytesToBase64(bytes),
    recursive: true,
  });
}

export async function writeFileTo(path, bytes) {
  await Filesystem.writeFile({
    path,
    directory: Directory.Data,
    data: bytesToBase64(bytes),
    recursive: true,
  });
}

export async function readFileFrom(path) {
  const res = await Filesystem.readFile({ path, directory: Directory.Data });
  return typeof res.data === "string" ? base64ToBytes(res.data) : new Uint8Array(res.data);
}

export { bytesToBase64, base64ToBytes };
