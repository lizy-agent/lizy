import * as Sentry from '@sentry/node';
import { config } from '../config';

export function initSentry(): void {
  if (!config.SENTRY_DSN) return;
  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.NODE_ENV,
    tracesSampleRate: config.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [Sentry.httpIntegration()],
  });
}

export function captureError(error: Error, context?: Record<string, unknown>): void {
  if (config.SENTRY_DSN) {
    Sentry.withScope((scope) => {
      if (context) scope.setExtras(context);
      Sentry.captureException(error);
    });
  } else {
    console.error('[Error]', error.message, context);
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' = 'info'): void {
  if (config.SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  }
}

export const sentryHandlers = {
  requestHandler: Sentry.expressErrorHandler,
};
