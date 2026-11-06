import { MonoTypeOperatorFunction, retry, timer } from 'rxjs';

export function retryWithDelay<T>(count = 3, delayMs = 1000): MonoTypeOperatorFunction<T> {
  return retry({
    count,
    delay: (_error, attempt) => timer(delayMs * attempt),
  });
}