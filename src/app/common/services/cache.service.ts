import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

type StorageType = 'local' | 'session';

export const POKEMON_LIST_CACHE_KEY = 'pokemonListCache';

interface CacheEntry<T> {
  value: T;
  storedAt: number;
}

@Injectable({ providedIn: 'root' })
export class CacheService {
  public inAppCache: Record<string, { value: unknown }> = {};

  private readonly platformId = inject(PLATFORM_ID);

  private getStorage(storageType: StorageType): Storage | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return storageType === 'local' ? localStorage : sessionStorage;
  }

  
  get<T>(key: string, storageType: StorageType = 'local', maxAgeMs?: number): T | null {
    const storage = this.getStorage(storageType);
    if (!storage) return null;
    const cachedRaw = storage.getItem(key);
    if (!cachedRaw) return null;
    try {
      const cached: CacheEntry<T> = JSON.parse(cachedRaw);
      if (maxAgeMs !== undefined && Date.now() - cached.storedAt > maxAgeMs) {
        this.remove(key, storageType);
        return null;
      }
      return cached.value;
    } catch {
      this.remove(key, storageType);
      return null;
    }
  }

  set<T>(key: string, value: T, storageType: StorageType = 'local'): boolean {
    const storage = this.getStorage(storageType);
    if (!storage) return false;
    const entry: CacheEntry<T> = { value, storedAt: Date.now() };
    try {
      storage.setItem(key, JSON.stringify(entry));
      return true;
    } catch {
      return false;
    }
  }

  remove(key: string, storageType: StorageType = 'local'): void {
    this.getStorage(storageType)?.removeItem(key);
  }

  getInApp<T>(key: string): T | null {
    const entry = this.inAppCache[key];
    return entry ? (entry.value as T) : null;
  }

  setInApp<T>(key: string, value: T): void {
    this.inAppCache[key] = { value };
  }

  removeInApp(key: string): void {
    delete this.inAppCache[key];
  }
}