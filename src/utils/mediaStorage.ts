/**
 * Media Storage & Client-Side Compression Utility
 * Prevents Firestore 1MB document size limit errors (1,048,576 bytes)
 * by compressing images, extracting video thumbnails, and caching large video media safely.
 */

const DB_NAME = 'hnc_eduhub_media_vault';
const STORE_NAME = 'media_cache';
const DB_VERSION = 1;

// Resilient in-memory fallback cache if IndexedDB/Storage is restricted (e.g. mobile sandbox/private mode)
const memoryMediaCache = new Map<string, string>();

/**
 * Initializes and returns an IndexedDB connection safely without throwing
 */
function openMediaDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      if (typeof window === 'undefined') {
        reject(new Error('Window unavailable'));
        return;
      }

      let idb: IDBFactory | undefined;
      try {
        idb = window.indexedDB;
      } catch {
        reject(new Error('IndexedDB access denied'));
        return;
      }

      if (!idb) {
        reject(new Error('IndexedDB is not supported'));
        return;
      }

      const request = idb.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        try {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        } catch {}
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Stores a large media string (e.g. video Base64 or Blob) safely
 */
export async function storeMediaInIndexedDB(key: string, data: string): Promise<void> {
  memoryMediaCache.set(key, data);

  try {
    const db = await openMediaDatabase();
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(data, key);

        req.onsuccess = () => resolve();
        req.onerror = () => resolve(); // Non-blocking
      } catch {
        resolve();
      }
    });
  } catch {
    // Graceful fallback to sessionStorage if allowed
    try {
      if (typeof window !== 'undefined' && data.length < 2_000_000) {
        window.sessionStorage.setItem(`media_${key}`, data);
      }
    } catch {}
  }
}

/**
 * Retrieves a media string safely with multi-tier fallback
 */
export async function getMediaFromIndexedDB(key: string): Promise<string | null> {
  // 1. Check in-memory cache first
  if (memoryMediaCache.has(key)) {
    return memoryMediaCache.get(key) || null;
  }

  // 2. Check IndexedDB
  try {
    const db = await openMediaDatabase();
    const result = await new Promise<string | null>((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);

        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });

    if (result) {
      memoryMediaCache.set(key, result);
      return result;
    }
  } catch {}

  // 3. Check sessionStorage fallback
  try {
    if (typeof window !== 'undefined') {
      const fallback = window.sessionStorage.getItem(`media_${key}`);
      if (fallback) {
        memoryMediaCache.set(key, fallback);
        return fallback;
      }
    }
  } catch {}

  return null;
}

/**
 * Deletes media from cache
 */
export async function deleteMediaFromIndexedDB(key: string): Promise<void> {
  memoryMediaCache.delete(key);
  try {
    const db = await openMediaDatabase();
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  } catch {}
}

/**
 * Compresses an image file client-side using HTML5 Canvas.
 * Downscales dimensions (max width 1200px) and compresses to JPEG with 0.75 quality.
 * Typical result is 40KB - 120KB, well within Firestore limits.
 */
export function compressImageFile(file: File, maxWidth = 1200, maxHeight = 700, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      img.onerror = () => reject(new Error('Failed to parse image file.'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Extracts a lightweight poster thumbnail from an uploaded video file.
 */
export function extractVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      const url = URL.createObjectURL(file);
      video.src = url;

      video.onloadeddata = () => {
        video.currentTime = Math.min(1.0, video.duration / 2 || 0.5);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(640, video.videoWidth || 640);
          canvas.height = Math.min(360, video.videoHeight || 360);

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbDataUrl = canvas.toDataURL('image/jpeg', 0.7);
            URL.revokeObjectURL(url);
            resolve(thumbDataUrl);
            return;
          }
        } catch {}
        URL.revokeObjectURL(url);
        resolve('');
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve('');
      };
    } catch {
      resolve('');
    }
  });
}

/**
 * Calculates UTF-8 byte length of any JSON object to ensure it stays below Firestore 1MB
 */
export function estimateObjectByteSize(obj: any): number {
  try {
    const json = JSON.stringify(obj);
    return new TextEncoder().encode(json).length;
  } catch {
    return 0;
  }
}
