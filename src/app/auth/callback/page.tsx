'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { logClientAuditEvent, logClientEvent } from '@/lib/observability';

const issuer = process.env.NEXT_PUBLIC_CAMEL_ACCOUNTS_URL || 'https://accounts.camelcreatives.com';
const clientId = process.env.NEXT_PUBLIC_CAMEL_ACCOUNTS_CLIENT_ID || 'simamia-35sj96';

interface PendingAuthorization {
  state: string;
  verifier: string;
  redirectUri: string;
}

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
}

export default function CamelAuthCallbackPage() {
  const [message, setMessage] = useState('Inakamilisha kuingia…');
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const completeSignIn = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const returnedState = params.get('state');
      const authError = params.get('error_description') || params.get('error');
      const pendingValue = localStorage.getItem('simamia_oauth_pending');

      const fail = (reason: string) => {
        logClientEvent('warn', 'auth.callback_failed', {
          area: 'auth',
          operation: 'oauth_callback'
        });
        localStorage.removeItem('simamia_oauth_pending');
        localStorage.setItem('simamia_oauth_error', reason);
        if (!cancelled) {
          setMessage(reason);
          setError(true);
        }
      };

      if (authError) {
        fail(`Camel Accounts: ${authError}`);
        return;
      }
      if (!code || !returnedState || !pendingValue) {
        fail('Jibu la kuingia halijakamilika. Rudi Simamia ujaribu tena.');
        return;
      }

      let pending: PendingAuthorization;
      try {
        pending = JSON.parse(pendingValue) as PendingAuthorization;
      } catch {
        fail('Taarifa za kuingia zimeharibika. Rudi Simamia ujaribu tena.');
        return;
      }
      if (returnedState !== pending.state) {
        fail('Uthibitisho wa kuingia haujalingana. Rudi Simamia ujaribu tena.');
        return;
      }

      try {
        const response = await fetch(`${issuer.replace(/\/$/, '')}/oauth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: pending.redirectUri,
            client_id: clientId,
            code_verifier: pending.verifier
          })
        });
        const tokens = (await response.json()) as TokenResponse;
        if (!response.ok || !tokens.access_token || !tokens.refresh_token) {
          throw new Error(tokens.error_description || tokens.error || 'Token exchange failed');
        }

        const rememberMe = localStorage.getItem('simamia_remember_me') !== 'false';
        if (!rememberMe) localStorage.setItem('simamia_session_login_signal', 'true');
        localStorage.setItem(
          'camel_auth_tokens',
          JSON.stringify({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresIn: tokens.expires_in,
            scope: tokens.scope ?? ''
          })
        );
        localStorage.removeItem('simamia_oauth_pending');
        localStorage.removeItem('simamia_oauth_error');
        logClientAuditEvent('auth.sign_in_succeeded', {
          area: 'auth',
          operation: 'oauth_callback'
        });

        if (!cancelled) {
          setMessage('Umeingia. Dirisha hili litafungwa…');
          window.setTimeout(() => {
            if (window.opener) window.close();
            else window.location.replace('/');
          }, 350);
        }
      } catch (cause) {
        const detail = cause instanceof Error ? cause.message : 'Token exchange failed';
        fail(`Imeshindikana kukamilisha kuingia kupitia Camel Accounts: ${detail}`);
      }
    };

    void completeSignIn();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className='bg-background flex min-h-svh items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle className='flex items-center gap-3'>
            <span className='bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-xl'>
              {error ? (
                <Icons.warning className='size-5' />
              ) : (
                <Icons.spinner className='size-5 animate-spin' />
              )}
            </span>
            Simamia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p
            role={error ? 'alert' : 'status'}
            className={error ? 'text-destructive' : 'text-muted-foreground'}
          >
            {message}
          </p>
          {error && (
            <a
              className='text-primary mt-4 inline-block font-medium underline-offset-4 hover:underline'
              href='/'
            >
              Rudi Simamia
            </a>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
