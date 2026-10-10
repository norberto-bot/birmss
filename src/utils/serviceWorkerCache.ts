/**
 * Service Worker & CacheStorage Manager for Critical Immunization Data
 * Designed specifically for Barangay Health Workers (BHWs) conducting field visits
 * in remote sitios, puroks, and areas with unstable or zero internet connectivity.
 */

import { Patient, VaccinationRecord, BarangaySettings } from '../types';

export const CACHE_NAME = 'birms-critical-immunization-v1';

export const OFFLINE_ENDPOINTS = {
  SNAPSHOT: '/api/offline/immunization-snapshot',
  PATIENTS: '/api/offline/patients',
  RECORDS: '/api/offline/vaccination-records',
  METRICS: '/api/offline/immunization-metrics',
};

export interface ImmunizationSnapshot {
  version: string;
  timestamp: string;
  facility: BarangaySettings;
  patients: Patient[];
  vaccinationRecords: VaccinationRecord[];
  summary: {
    totalPatients: number;
    totalRecords: number;
    underOneYearCount: number;
    puroksCovered: string[];
  };
}

export interface CacheDiagnostics {
  isServiceWorkerSupported: boolean;
  isServiceWorkerActive: boolean;
  isCacheStorageSupported: boolean;
  cachedPatientsCount: number;
  cachedRecordsCount: number;
  lastCachedTimestamp: string | null;
  cacheSizeEstimateKB: number;
  isOfflineReady: boolean;
}

/**
 * Persists critical immunization data directly into CacheStorage
 * as simulated HTTP Response objects matching the Service Worker routing rules.
 */
export async function syncCriticalDataToServiceWorkerCache(
  patients: Patient[],
  records: VaccinationRecord[],
  settings: BarangaySettings
): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return false;
  }

  try {
    const cache = await caches.open(CACHE_NAME);

    const puroks = Array.from(new Set(patients.map((p) => p.purokSitio).filter(Boolean)));
    const now = new Date().toISOString();

    const snapshotPayload: ImmunizationSnapshot = {
      version: '1.0.0',
      timestamp: now,
      facility: settings,
      patients,
      vaccinationRecords: records,
      summary: {
        totalPatients: patients.length,
        totalRecords: records.length,
        underOneYearCount: patients.filter((p) => {
          const ageMonths = (Date.now() - new Date(p.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
          return ageMonths < 12;
        }).length,
        puroksCovered: puroks,
      },
    };

    const headers = {
      'Content-Type': 'application/json',
      'X-BIRMS-Offline-Source': 'ServiceWorker-CacheStorage',
      'X-BIRMS-Cached-At': now,
      'Cache-Control': 'public, max-age=2592000', // 30 days
    };

    // 1. Store Master Snapshot
    await cache.put(
      new Request(OFFLINE_ENDPOINTS.SNAPSHOT, { method: 'GET' }),
      new Response(JSON.stringify(snapshotPayload), { headers })
    );

    // 2. Store Individual Collections for REST-like offline fallback
    await cache.put(
      new Request(OFFLINE_ENDPOINTS.PATIENTS, { method: 'GET' }),
      new Response(JSON.stringify(patients), { headers })
    );

    await cache.put(
      new Request(OFFLINE_ENDPOINTS.RECORDS, { method: 'GET' }),
      new Response(JSON.stringify(records), { headers })
    );

    await cache.put(
      new Request(OFFLINE_ENDPOINTS.METRICS, { method: 'GET' }),
      new Response(JSON.stringify(snapshotPayload.summary), { headers })
    );

    // Store metadata timestamp in localStorage for fast synchronous UI access
    localStorage.setItem('birms_sw_last_cache_time', now);
    localStorage.setItem('birms_sw_cached_patients', String(patients.length));
    localStorage.setItem('birms_sw_cached_records', String(records.length));

    return true;
  } catch (error) {
    console.warn('[BIRMS SW Cache] Failed to update Service Worker cache:', error);
    return false;
  }
}

/**
 * Recovers cached immunization data directly from the Service Worker CacheStorage
 * Used when the device is completely offline or fails to fetch remote updates.
 */
export async function loadCachedImmunizationSnapshot(): Promise<ImmunizationSnapshot | null> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return null;
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(OFFLINE_ENDPOINTS.SNAPSHOT);

    if (response) {
      const data = await response.json();
      return data as ImmunizationSnapshot;
    }
  } catch (error) {
    console.error('[BIRMS SW Cache] Error reading from CacheStorage:', error);
  }

  return null;
}

/**
 * Returns diagnostic metrics about the current Service Worker and Cache state.
 */
export async function getServiceWorkerCacheDiagnostics(): Promise<CacheDiagnostics> {
  const isSWSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator;
  const isCacheSupported = typeof window !== 'undefined' && 'caches' in window;
  const isSWActive = isSWSupported && !!navigator.serviceWorker.controller;

  let cachedPatientsCount = parseInt(localStorage.getItem('birms_sw_cached_patients') || '0', 10);
  let cachedRecordsCount = parseInt(localStorage.getItem('birms_sw_cached_records') || '0', 10);
  let lastCachedTimestamp = localStorage.getItem('birms_sw_last_cache_time');
  let cacheSizeEstimateKB = 0;

  if (isCacheSupported) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const res = await cache.match(OFFLINE_ENDPOINTS.SNAPSHOT);
      if (res) {
        const text = await res.clone().text();
        cacheSizeEstimateKB = Math.round(text.length / 1024);
        const data = await res.json();
        if (data && data.patients) {
          cachedPatientsCount = data.patients.length;
          cachedRecordsCount = data.vaccinationRecords?.length || 0;
          lastCachedTimestamp = data.timestamp;
        }
      }
    } catch {
      // Ignore cache inspection errors
    }
  }

  return {
    isServiceWorkerSupported: isSWSupported,
    isServiceWorkerActive: isSWActive,
    isCacheStorageSupported: isCacheSupported,
    cachedPatientsCount,
    cachedRecordsCount,
    lastCachedTimestamp,
    cacheSizeEstimateKB,
    isOfflineReady: cachedPatientsCount > 0,
  };
}
