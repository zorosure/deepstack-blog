import { runtimeValue } from "./runtime";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function encryptionKey() {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(runtimeValue("APP_ENCRYPTION_KEY")));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export function randomToken(bytes = 32) {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return base64UrlEncode(value);
}

export async function sha256Base64Url(value: string) {
  return base64UrlEncode(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}

export async function seal(value: unknown) {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encryptionKey(), encoder.encode(JSON.stringify(value))));
  const output = new Uint8Array(iv.length + encrypted.length);
  output.set(iv);
  output.set(encrypted, iv.length);
  return base64UrlEncode(output);
}

export async function unseal<T>(value: string) {
  const bytes = base64UrlDecode(value);
  if (bytes.length < 29) throw new Error("Invalid encrypted value");
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.slice(0, 12) }, await encryptionKey(), bytes.slice(12));
  return JSON.parse(decoder.decode(decrypted)) as T;
}

export function timingSafeTextEqual(left: string, right: string) {
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  const length = Math.max(a.length, b.length);
  let difference = a.length ^ b.length;
  for (let index = 0; index < length; index += 1) difference |= (a[index] ?? 0) ^ (b[index] ?? 0);
  return difference === 0;
}
