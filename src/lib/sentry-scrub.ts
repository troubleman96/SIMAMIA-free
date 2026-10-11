import type * as Sentry from '@sentry/nextjs';

export function scrubSentryEvent<T extends Sentry.Event>(event: T): T {
  delete event.user;

  if (event.request) {
    if (event.request.url) {
      try {
        const url = new URL(event.request.url);
        event.request.url = `${url.origin}${url.pathname}`;
      } catch {
        event.request.url = event.request.url.split(/[?#]/, 1)[0];
      }
    }
    delete event.request.headers;
    delete event.request.cookies;
    delete event.request.data;
    delete event.request.query_string;
  }

  // Network breadcrumbs can contain OAuth codes, tokens, or user supplied query values.
  event.breadcrumbs = [];
  return event;
}
