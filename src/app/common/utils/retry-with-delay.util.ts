import { MonoTypeOperatorFunction, retry, timer } from 'rxjs';
import { API_MAX_RETRIES, API_RETRY_DELAY_MS } from '../constant';


export function retryWithDelay<T>(
  count = API_MAX_RETRIES,
  delayMs = API_RETRY_DELAY_MS,
): MonoTypeOperatorFunction<T> {
  return retry({
    count,
    delay: (_error, attempt) => timer(delayMs * attempt),
  });
}