'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { useSimamiaAuth } from './camel-auth-screen';

declare global {
  interface Window {
    camel?: {
      identify: (accountId: string) => void;
      clearIdentity: () => void;
    };
  }
}

function AuthenticatedAnalyticsIdentity({ ready }: { ready: boolean }) {
  const { user, authenticated, loading } = useSimamiaAuth();
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

export function SimamiaAnalytics() {
  const [trackerReady, setTrackerReady] = useState(false);

  return (
    <>
      <Script
        id='camel-analytics-simamia-app'
        src='https://analytics.camelcreatives.com/tracker.js'
        data-site='simamia-app'
        strategy='afterInteractive'
        onReady={() => setTrackerReady(true)}
      />
      <AuthenticatedAnalyticsIdentity ready={trackerReady} />
    </>
  );
}
