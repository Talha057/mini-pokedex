import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  error(message: string, context?: Record<string, unknown>): void {
    console.error(`[app] ${message}`, context ?? '');
  }
}