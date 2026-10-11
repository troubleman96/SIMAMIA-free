import * as Sentry from '@sentry/nextjs';

type LogLevel = 'info' | 'warn' | 'error';
type SafeLogValue = string | number | boolean;
type LogContext = Record<string, SafeLogValue | null | undefined>;

const safeKeys = new Set([
  'area',
  'operation',
  'method',
  'resource',
  'status',
  'duration_ms',
  'request_id',
  'source'
]);

function safeContext(context: LogContext = {}): Record<string, SafeLogValue> {
  return Object.fromEntries(
    Object.entries(context).filter(
      (entry): entry is [string, SafeLogValue] =>
        safeKeys.has(entry[0]) && entry[1] !== null && entry[1] !== undefined
    )
  );
}

export function logClientEvent(level: LogLevel, event: string, context: LogContext = {}): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: 'simamia-app',
    event,
    ...safeContext(context)
  };

  if (process.env.NODE_ENV !== 'production' || level !== 'info') {
    const write =
      level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
    write(JSON.stringify(entry));
  }

  Sentry.addBreadcrumb({
    category: 'simamia',
    level: level === 'warn' ? 'warning' : level,
    message: event,
    data: safeContext(context)
  });
}

export function logClientError(event: string, context: LogContext = {}): void {
  const safe = safeContext(context);
  logClientEvent('error', event, safe);
  Sentry.captureMessage(event, {
    level: 'error',
    tags: { area: String(safe.area ?? 'app'), operation: String(safe.operation ?? 'unknown') },
    extra: safe
  });
}

export function logClientAuditEvent(event: string, context: LogContext = {}): void {
  const safe = safeContext(context);
  logClientEvent('info', event, safe);
  Sentry.captureMessage(event, {
    level: 'info',
    tags: { area: String(safe.area ?? 'app'), operation: String(safe.operation ?? 'unknown') },
    extra: safe
  });
}

export async function loggedFetch(
  input: RequestInfo | URL,
  init: RequestInit,
  context: LogContext
): Promise<Response> {
  const started = performance.now();
  const { method = 'GET', resource = 'unknown' } = context;
  logClientEvent('info', 'api.request.started', { ...context, method, resource });

  try {
    const response = await fetch(input, init);
    const resultContext = {
      ...context,
      method,
      resource,
      status: response.status,
      request_id: response.headers.get('X-Request-ID') ?? undefined,
      duration_ms: Math.round(performance.now() - started)
    };
    logClientEvent(response.ok ? 'info' : 'warn', 'api.request.completed', resultContext);
    if (response.status >= 500) logClientError('api.request.failed', resultContext);
    return response;
  } catch (error) {
    logClientError('api.request.network_failed', {
      ...context,
      method,
      resource,
      duration_ms: Math.round(performance.now() - started)
    });
    throw error;
  }
}
