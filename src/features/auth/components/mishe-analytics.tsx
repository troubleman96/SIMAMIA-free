'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { useMisheAuth } from './camel-auth-screen';

declare global {
  interface Window {
    camel?: {
      identify: (accountId: string) => void;
      clearIdentity: () => void;
    };
  }
}

function AuthenticatedAnalyticsIdentity({ ready }: { ready: boolean }) {
  const { user, authenticated, loading } = useMisheAuth();
  const accountId = user?.sub ? String(user.sub) : null;

  useEffect(() => {
    if (!ready || loading) return;

    if (authenticated && accountId) {
      window.camel?.identify(accountId);
      return;
    }

    window.camel?.clearIdentity();
  }, [accountId, authenticated, loading, ready]);

  return null;
}

export function MisheAnalytics() {
  const [trackerReady, setTrackerReady] = useState(false);

  return (
    <>
      <Script
        id='camel-analytics-mishe-app'
        src='https://analytics.camelcreatives.com/tracker.js'
        data-site='mishe-app'
        strategy='afterInteractive'
        onReady={() => setTrackerReady(true)}
      />
      <AuthenticatedAnalyticsIdentity ready={trackerReady} />
    </>
  );
}
