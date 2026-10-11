'use client';

import { useEffect, useState } from 'react';
import { CamelAuthProvider, useCamelAuth } from 'camel-accounts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { logClientAuditEvent, logClientEvent } from '@/lib/observability';

const issuer = process.env.NEXT_PUBLIC_CAMEL_ACCOUNTS_URL || 'https://accounts.camelcreatives.com';
const clientId = process.env.NEXT_PUBLIC_CAMEL_ACCOUNTS_CLIENT_ID || 'simamia-35sj96';

export function CamelAuthRoot({ children }: { children: React.ReactNode }) {
  const [providerKey, setProviderKey] = useState(0);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    const rememberMe = localStorage.getItem('simamia_remember_me') !== 'false';
    const hasSessionLogin = sessionStorage.getItem('simamia_session_login') === 'true';
    if (!rememberMe && !hasSessionLogin) localStorage.removeItem('camel_auth_tokens');
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let active = true;
    const readTokens = () => {
      try {
        return JSON.parse(localStorage.getItem('camel_auth_tokens') || 'null') as {
          accessToken?: string;
          refreshToken?: string;
          expiresIn?: number;
          scope?: string;
        } | null;
      } catch {
        return null;
      }
    };
    const expiry = (token?: string) => {
      if (!token) return 0;
      try {
        const payload = token.split('.')[1];
        return Number(JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))).exp) * 1000;
      } catch {
        return 0;
      }
    };
    const schedule = () => {
      if (timer) clearTimeout(timer);
      const token = readTokens();
      if (!token?.refreshToken) return;
      const refreshAt = Math.max(Date.now(), expiry(token.accessToken) - 45_000);
      timer = setTimeout(() => void refresh(), refreshAt - Date.now());
    };
    const refresh = async () => {
      const refreshInLock = async () => {
        const latest = readTokens();
        if (!latest?.refreshToken) return;
        if (expiry(latest.accessToken) > Date.now() + 45_000) return;
        const body = new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: latest.refreshToken,
          client_id: clientId
        });
        try {
          const response = await fetch(`${issuer}/oauth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body
          });
          const result = await response.json();
          if (!response.ok || !result.access_token || !result.refresh_token)
            throw new Error('Token refresh failed');
          if (!active) return;
          localStorage.setItem(
            'camel_auth_tokens',
            JSON.stringify({
              accessToken: result.access_token,
              refreshToken: result.refresh_token,
              expiresIn: result.expires_in,
              scope: result.scope ?? latest.scope ?? ''
            })
          );
          logClientEvent('info', 'auth.token_refresh_succeeded', {
            area: 'auth',
            operation: 'token_refresh'
          });
          setProviderKey((key) => key + 1);
        } catch {
          if (!active) return;
          logClientEvent('warn', 'auth.token_refresh_failed', {
            area: 'auth',
            operation: 'token_refresh'
          });
          localStorage.removeItem('camel_auth_tokens');
          setProviderKey((key) => key + 1);
        }
      };
      if ('locks' in navigator) {
        await navigator.locks.request(
          'simamia-camel-token-refresh',
          { ifAvailable: true },
          async (lock) => {
            if (lock) await refreshInLock();
            else await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        );
      } else {
        await refreshInLock();
      }
      schedule();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'simamia_session_login_signal' && event.newValue === 'true') {
        sessionStorage.setItem('simamia_session_login', 'true');
        localStorage.removeItem('simamia_session_login_signal');
      }
      if (event.key === 'camel_auth_tokens') {
        setProviderKey((key) => key + 1);
        schedule();
      }
    };
    schedule();
    window.addEventListener('storage', onStorage);
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      window.removeEventListener('storage', onStorage);
    };
  }, [storageReady]);

  if (!storageReady) return null;
  return (
    <CamelAuthProvider
      key={`${clientId}-${providerKey}`}
      config={{ issuer, clientId, scopes: ['openid', 'profile', 'phone'], storage: 'localStorage' }}
    >
      {children}
    </CamelAuthProvider>
  );
}

export function useSimamiaAuth() {
  return useCamelAuth();
}

export function CamelAuthScreen({ lang = 'sw' }: { lang?: 'sw' | 'en' }) {
  const { loading } = useCamelAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem('simamia_remember_me') !== 'false';
  });
  const english = lang === 'en';

  const startAuthorization = (popup: Window) => {
    const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
    const verifier = btoa(String.fromCharCode(...verifierBytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const stateBytes = crypto.getRandomValues(new Uint8Array(16));
    const state = btoa(String.fromCharCode(...stateBytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const redirectUri = `${window.location.origin}/auth/callback/`;
    const authorize = new URL(`${issuer.replace(/\/$/, '')}/oauth/authorize`);
    authorize.search = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'openid profile phone',
      state,
      code_challenge: '',
      code_challenge_method: 'S256'
    }).toString();

    return crypto.subtle
      .digest('SHA-256', new TextEncoder().encode(verifier))
      .then((digest) => {
        const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
        authorize.searchParams.set('code_challenge', challenge);
        localStorage.setItem('simamia_remember_me', String(rememberMe));
        localStorage.setItem(
          'simamia_oauth_pending',
          JSON.stringify({ state, verifier, redirectUri })
        );
        return { authorize: authorize.toString(), state };
      })
      .catch(() => {
        logClientEvent('warn', 'auth.authorization_prepare_failed', {
          area: 'auth',
          operation: 'prepare_authorization'
        });
        if (!popup.closed) popup.close();
        setGoogleLoading(false);
        setFormLoading(false);
        setGoogleError(
          english
            ? 'Could not start sign-in. Please try again.'
            : 'Imeshindikana kuanzisha kuingia. Jaribu tena.'
        );
        throw new Error('Could not prepare Camel Accounts authorization');
      });
  };

  const openAuthPopup = () => {
    setGoogleError('');
    const popup = window.open(
      'about:blank',
      'simamia-camel-auth',
      'popup=yes,width=520,height=680'
    );
    if (!popup) {
      logClientEvent('warn', 'auth.popup_blocked', { area: 'auth', operation: 'open_popup' });
      setGoogleError(
        english
          ? 'Allow pop-ups to continue with Google.'
          : 'Ruhusu dirisha ibukizi ili kuendelea na Google.'
      );
      return null;
    }
    return popup;
  };

  const watchAuthPopup = (popup: Window) => {
    const watcher = window.setInterval(() => {
      if (!popup.closed) return;
      window.clearInterval(watcher);
      setGoogleLoading(false);
      setFormLoading(false);
      const authError = localStorage.getItem('simamia_oauth_error');
      if (authError) {
        localStorage.removeItem('simamia_oauth_error');
        setGoogleError(authError);
      }
    }, 500);
  };

  const loginWithGoogle = () => {
    logClientAuditEvent('auth.sign_in_started', { area: 'auth', operation: 'google' });
    const popup = openAuthPopup();
    if (!popup) return;
    setGoogleLoading(true);
    watchAuthPopup(popup);
    void startAuthorization(popup)
      .then(({ authorize }) => {
        const socialStart = new URL(`${issuer.replace(/\/$/, '')}/auth/social/google/begin`);
        socialStart.searchParams.set('next', authorize);
        popup.location.href = socialStart.toString();
      })
      .catch(() => {
        logClientEvent('warn', 'auth.redirect_failed', { area: 'auth', operation: 'google' });
      });
  };

  const loginWithPhone = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    logClientAuditEvent('auth.sign_in_started', { area: 'auth', operation: 'phone_password' });
    const popup = openAuthPopup();
    if (!popup) return;
    setFormLoading(true);
    watchAuthPopup(popup);
    void startAuthorization(popup)
      .then(({ authorize }) => {
        const form = popup.document.createElement('form');
        form.method = 'post';
        form.action = `${issuer.replace(/\/$/, '')}/auth/login/continue`;
        const localNumber = phone.replace(/\D/g, '').replace(/^255/, '').replace(/^0/, '');
        for (const [name, value] of Object.entries({
          identifier: `+255${localNumber}`,
          password,
          next: new URL(authorize).pathname + new URL(authorize).search
        })) {
          const input = popup.document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          input.value = value;
          form.append(input);
        }
        popup.document.body.append(form);
        form.submit();
        setPassword('');
      })
      .catch(() => {
        logClientEvent('warn', 'auth.redirect_failed', {
          area: 'auth',
          operation: 'phone_password'
        });
      });
  };

  const createAccount = () => {
    logClientAuditEvent('auth.account_creation_started', {
      area: 'auth',
      operation: 'register'
    });
    setGoogleError('');
    const popup = openAuthPopup();
    if (!popup) return;
    setFormLoading(true);
    watchAuthPopup(popup);
    void startAuthorization(popup)
      .then(({ authorize }) => {
        const register = new URL(`${issuer.replace(/\/$/, '')}/register`);
        register.searchParams.set('next', new URL(authorize).pathname + new URL(authorize).search);
        popup.location.href = register.toString();
      })
      .catch(() => {
        logClientEvent('warn', 'auth.redirect_failed', { area: 'auth', operation: 'register' });
      });
  };

  return (
    <main className='bg-background flex min-h-svh items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-4'>
          <div className='flex items-center gap-3'>
            <div className='bg-primary text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-xl'>
              <Icons.dashboard className='size-5' />
            </div>
            <CardTitle className='text-2xl'>Simamia</CardTitle>
          </div>
          <CardDescription>
            {english
              ? 'Continue to Camel Accounts to sign in with Google or your phone number and password, or create a Camel Account. After sign-in, you will set up your Simamia business profile.'
              : 'Endelea kwenye Camel Accounts kuingia kwa Google au namba ya simu na nenosiri, au kufungua akaunti. Baada ya kuingia utaweka wasifu wa biashara yako ya Simamia.'}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Button
            className='w-full'
            size='lg'
            variant='outline'
            onClick={loginWithGoogle}
            disabled={loading || googleLoading || formLoading}
          >
            <GoogleMark />
            {googleLoading
              ? english
                ? 'Connecting to Google…'
                : 'Inaunganisha na Google…'
              : english
                ? 'Continue with Google'
                : 'Endelea na Google'}
          </Button>
          <div className='relative py-1'>
            <div className='absolute inset-0 flex items-center'>
              <span className='border-border w-full border-t' />
            </div>
            <div className='relative flex justify-center'>
              <span className='bg-card text-muted-foreground px-2 text-xs'>
                {english ? 'or sign in with phone' : 'au ingia kwa simu'}
              </span>
            </div>
          </div>
          <form className='space-y-3' onSubmit={loginWithPhone}>
            <label className='text-sm font-medium' htmlFor='camel-phone'>
              {english ? 'Phone number' : 'Namba ya simu'}
            </label>
            <div className='border-input bg-background focus-within:ring-ring flex h-10 w-full items-center rounded-md border focus-within:ring-2 focus-within:ring-offset-2'>
              <span className='text-muted-foreground border-r px-3 text-sm' aria-hidden='true'>
                +255
              </span>
              <input
                id='camel-phone'
                name='phone'
                type='tel'
                inputMode='numeric'
                autoComplete='tel-national'
                required
                value={phone}
                onChange={(event) =>
                  setPhone(
                    event.target.value.replace(/\D/g, '').replace(/^255/, '').replace(/^0/, '')
                  )
                }
                placeholder='712 345 678'
                className='placeholder:text-muted-foreground h-full min-w-0 flex-1 rounded-r-md bg-transparent px-3 py-2 text-sm outline-none'
              />
            </div>
            <label className='text-sm font-medium' htmlFor='camel-password'>
              {english ? 'Password' : 'Nenosiri'}
            </label>
            <div className='relative'>
              <input
                id='camel-password'
                name='password'
                type={showPassword ? 'text' : 'password'}
                autoComplete='current-password'
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 pr-10 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
              />
              <button
                type='button'
                className='text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center px-3'
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={
                  showPassword
                    ? english
                      ? 'Hide password'
                      : 'Ficha nenosiri'
                    : english
                      ? 'Show password'
                      : 'Onyesha nenosiri'
                }
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <Icons.eyeOff className='size-4' />
                ) : (
                  <Icons.eye className='size-4' />
                )}
              </button>
            </div>
            <label className='flex cursor-pointer items-center gap-2 text-sm'>
              <input
                type='checkbox'
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className='accent-primary size-4 rounded border'
              />
              {english ? 'Remember me' : 'Nikumbuke'}
            </label>
            <Button
              className='w-full'
              size='lg'
              type='submit'
              disabled={loading || googleLoading || formLoading}
            >
              {formLoading
                ? english
                  ? 'Connecting to Camel Accounts…'
                  : 'Inaunganisha na Camel Accounts…'
                : english
                  ? 'Sign in'
                  : 'Ingia'}
            </Button>
          </form>
          <p className='text-muted-foreground text-center text-sm'>
            {english ? 'New to Camel Accounts?' : 'Huna akaunti ya Camel?'}{' '}
            <button
              type='button'
              className='text-primary font-medium underline-offset-4 hover:underline'
              onClick={createAccount}
              disabled={loading || googleLoading || formLoading}
            >
              {english ? 'Create account' : 'Fungua akaunti'}
            </button>
          </p>
          {googleError && (
            <p className='text-destructive text-center text-sm' role='alert'>
              {googleError}
            </p>
          )}
          <p className='text-muted-foreground text-center text-xs'>
            {english
              ? 'Camel Accounts verifies your password. Simamia does not save it.'
              : 'Camel Accounts huthibitisha nenosiri lako. Simamia halilihifadhi.'}
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden='true' viewBox='0 0 18 18' className='mr-2 size-4'>
      <path
        fill='#4285F4'
        d='M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z'
      />
      <path
        fill='#34A853'
        d='M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18Z'
      />
      <path
        fill='#FBBC05'
        d='M3.96 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3-2.33Z'
      />
      <path
        fill='#EA4335'
        d='M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.59A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58Z'
      />
    </svg>
  );
}
