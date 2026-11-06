import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defer, of, throwError } from 'rxjs';
import { retryWithDelay } from './retry-with-delay.util';

describe('retryWithDelay', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('retries with a growing delay and emits once the source succeeds', () => {
    let calls = 0;
    const source$ = defer(() => {
      calls++;
      return calls < 3 ? throwError(() => new Error('fail')) : of('ok');
    });
    const results: string[] = [];

    source$.pipe(retryWithDelay(3, 1000)).subscribe((value) => results.push(value));

    expect(calls).toBe(1);
    vi.advanceTimersByTime(1000); 
    expect(calls).toBe(2);
    vi.advanceTimersByTime(1999); 
    expect(calls).toBe(2);
    vi.advanceTimersByTime(1);
    expect(calls).toBe(3);
    expect(results).toEqual(['ok']);
  });

  it('propagates the error once retries are exhausted', () => {
    let calls = 0;
    const source$ = defer(() => {
      calls++;
      return throwError(() => new Error('always fails'));
    });
    const errors: unknown[] = [];

    source$.pipe(retryWithDelay(2, 100)).subscribe({ error: (e) => errors.push(e) });

    vi.advanceTimersByTime(100 + 200);

    expect(calls).toBe(3); 
    expect(errors).toHaveLength(1);
  });
});