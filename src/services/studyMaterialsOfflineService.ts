/**
 * Student Study Materials Offline Caching Service
 *
 * Utilizes the browser's CacheStorage API ('student-study-materials-cache') configured
 * in the Vite PWA service worker to ensure students can access downloaded study notes,
 * examination past papers, revision timetables, and competency guides without internet.
 */

export interface OfflineStudyMaterial {
  id: string;
  title: string;
  subject: string;
  grade: string;
  fileType: 'pdf' | 'xlsx' | 'json' | 'notes';
  downloadUrl: string;
  sizeBytes?: number;
  downloadedAt: string;
  description?: string;
  topics?: string[];
}

const CACHE_NAME = 'student-study-materials-cache';
const STORAGE_META_KEY = 'hnc_student_offline_materials_v1';

/**
 * Get list of offline downloaded study materials metadata
 */
export function getOfflineMaterialsList(): OfflineStudyMaterial[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_META_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Failed to parse offline materials metadata:', err);
    return [];
  }
}

/**
 * Save an offline material into CacheStorage and register its metadata
 */
export async function cacheStudyMaterialOffline(
  material: OfflineStudyMaterial,
  dataContent: Blob | string
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    // 1. Put into CacheStorage
    if ('caches' in window) {
      const cache = await caches.open(CACHE_NAME);
      const mime =
        material.fileType === 'pdf'
          ? 'application/pdf'
          : material.fileType === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/json';

      const response = new Response(dataContent, {
        headers: {
          'Content-Type': mime,
          'Content-Length': String(
            typeof dataContent === 'string' ? dataContent.length : dataContent.size
          ),
          'X-Offline-Cached-At': new Date().toISOString(),
          'Cache-Control': 'public, max-age=5184000', // 60 days
        },
      });

      await cache.put(material.downloadUrl, response);
    }

    // 2. Register metadata
    const existing = getOfflineMaterialsList().filter((m) => m.id !== material.id);
    const updated = [material, ...existing];
    localStorage.setItem(STORAGE_META_KEY, JSON.stringify(updated));

    // Dispatch event for UI reactivity
    window.dispatchEvent(
      new CustomEvent('hnc_offline_materials_updated', {
        detail: { materialId: material.id, count: updated.length },
      })
    );

    return true;
  } catch (err) {
    console.error('Failed to cache study material offline:', err);
    return false;
  }
}

/**
 * Check if a specific study material is cached offline
 */
export async function isStudyMaterialCached(downloadUrl: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) return false;
  try {
    const cache = await caches.open(CACHE_NAME);
    const match = await cache.match(downloadUrl);
    return !!match;
  } catch {
    return false;
  }
}

/**
 * Retrieve cached study material Response from CacheStorage
 */
export async function getCachedStudyMaterial(downloadUrl: string): Promise<Response | null> {
  if (typeof window === 'undefined' || !('caches' in window)) return null;
  try {
    const cache = await caches.open(CACHE_NAME);
    const match = await cache.match(downloadUrl);
    return match || null;
  } catch {
    return null;
  }
}

/**
 * Delete a downloaded study material from CacheStorage
 */
export async function removeCachedStudyMaterial(id: string, downloadUrl: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    if ('caches' in window) {
      const cache = await caches.open(CACHE_NAME);
      await cache.delete(downloadUrl);
    }

    const existing = getOfflineMaterialsList().filter((m) => m.id !== id);
    localStorage.setItem(STORAGE_META_KEY, JSON.stringify(existing));

    window.dispatchEvent(
      new CustomEvent('hnc_offline_materials_updated', {
        detail: { materialId: id, count: existing.length },
      })
    );
    return true;
  } catch (err) {
    console.error('Failed to remove cached material:', err);
    return false;
  }
}

/**
 * Auto-cache generated study timetable for instant offline study access
 */
export async function cacheTimetableForOfflineUse(
  studentGrade: string,
  timetableData: any
): Promise<void> {
  if (!timetableData || typeof window === 'undefined') return;

  const url = `/offline-materials/timetable_${studentGrade.replace(/\s+/g, '_')}.json`;
  const materialMeta: OfflineStudyMaterial = {
    id: `timetable_${Date.now()}`,
    title: timetableData.timetableTitle || `${studentGrade} Weekly Study Timetable`,
    subject: 'Study Planning & Timetable',
    grade: studentGrade,
    fileType: 'json',
    downloadUrl: url,
    downloadedAt: new Date().toISOString(),
    description: 'Personalized 7-day revision schedule with focus areas and daily time slots.',
    topics: timetableData.weakAreasIdentified?.map((w: any) => w.subject) || [],
  };

  await cacheStudyMaterialOffline(materialMeta, JSON.stringify(timetableData));
}
