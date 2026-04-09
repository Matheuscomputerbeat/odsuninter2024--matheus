const UTF8_ENCODER = new TextEncoder();
const UTF8_DECODER = new TextDecoder();

const FEEDBACK_STORAGE_KEY = 'proconsvate-feedbacks';
const FEEDBACK_SESSION_KEY = 'proconsvate-feedbacks-key';
const FEEDBACK_MAX_ITEMS = 30;

export type StoredFeedback = {
  text: string;
  at: string;
};

export const MAX_FEEDBACK_LENGTH = 500;

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function getSessionKeyBytes(): Uint8Array {
  const current = window.sessionStorage.getItem(FEEDBACK_SESSION_KEY);

  if (current) {
    return base64ToBytes(current);
  }

  const keyBytes = new Uint8Array(32);
  window.crypto.getRandomValues(keyBytes);
  window.sessionStorage.setItem(FEEDBACK_SESSION_KEY, bytesToBase64(keyBytes));
  return keyBytes;
}

async function getAesKey(): Promise<CryptoKey> {
  const rawKey = getSessionKeyBytes();

  return window.crypto.subtle.importKey('raw', toArrayBuffer(rawKey), { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

export function sanitizeInput(text: string): string {
  return text
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, MAX_FEEDBACK_LENGTH);
}

export function createSecureId(): string {
  if (typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }

  const randomBytes = new Uint8Array(16);
  window.crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function loadSecureFeedbacks(): Promise<StoredFeedback[]> {
  const encrypted = window.sessionStorage.getItem(FEEDBACK_STORAGE_KEY);

  if (!encrypted) {
    return [];
  }

  try {
    const parsed = JSON.parse(encrypted) as { payload: string; iv: string };
    const key = await getAesKey();
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(base64ToBytes(parsed.iv)) },
      key,
      toArrayBuffer(base64ToBytes(parsed.payload)),
    );

    const decoded = UTF8_DECODER.decode(decrypted);
    const items = JSON.parse(decoded) as StoredFeedback[];

    if (!Array.isArray(items)) {
      return [];
    }

    return items.filter((item) => typeof item?.text === 'string' && typeof item?.at === 'string');
  } catch {
    return [];
  }
}

export async function saveSecureFeedback(feedback: StoredFeedback): Promise<void> {
  const existing = await loadSecureFeedbacks();
  const nextItems = [...existing, feedback].slice(-FEEDBACK_MAX_ITEMS);

  const key = await getAesKey();
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);

  const payload = UTF8_ENCODER.encode(JSON.stringify(nextItems));
  const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, payload);

  window.sessionStorage.setItem(
    FEEDBACK_STORAGE_KEY,
    JSON.stringify({
      payload: bytesToBase64(new Uint8Array(encrypted)),
      iv: bytesToBase64(iv),
    }),
  );
}
