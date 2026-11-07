import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryStorage } from '../../../testing/memory-storage';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let cache: CacheService;

  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
    vi.useFakeTimers();
    cache = TestBed.inject(CacheService);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('returns a stored value while it is fresh', () => {
    cache.set('key', { id: 1 });
    vi.advanceTimersByTime(500);

    expect(cache.get('key', 'local', 1000)).toEqual({ id: 1 });
  });

  it('drops the entry once it is older than the max age', () => {
    cache.set('key', { id: 1 });
    vi.advanceTimersByTime(1001);

    expect(cache.get('key', 'local', 1000)).toBeNull();
    expect(localStorage.getItem('key')).toBeNull();
  });

  it('treats corrupt storage as a miss and clears it', () => {
    localStorage.setItem('key', '{not json');

    expect(cache.get('key')).toBeNull();
    expect(localStorage.getItem('key')).toBeNull();
  });
});