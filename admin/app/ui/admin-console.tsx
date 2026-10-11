'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

type Json = Record<string, unknown>;
type Account = {
  owner_sub: string;
  record_count: number;
  business_name: string;
  resources: Record<string, number>;
};
type Pagination = { page: number; page_size: number; total: number; total_pages: number };
type Resource = 'businesses' | 'customers' | 'services' | 'orders' | 'team' | 'expenses';
const resources: Resource[] = ['businesses', 'customers', 'services', 'orders', 'team', 'expenses'];
const labels: Record<string, string> = {
  overview: 'Overview',
  accounts: 'Accounts',
  records: 'Business records',
  usage: 'Usage',
  audit: 'Audit log',
  health: 'System health',
  businesses: 'Businesses',
  customers: 'Customers',
  services: 'Services',
  orders: 'Jobs & invoices',
  team: 'Team',
  expenses: 'Expenses'
};
const emptyRecord: Record<Resource, Json> = {
  businesses: { businessName: '', phone: '', template: 'general' },
  customers: { name: '', phone: '' },
  services: { name: '', price: 0, currency: 'TZS', active: true },
  orders: {
    customer: '',
    phone: '',
    service: '',
    amount: 0,
    paid: 0,
    currency: 'TZS',
    status: 'New'
  },
  team: { name: '', phone: '', role: '' },
  expenses: {
    description: '',
    category: '',
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    currency: 'TZS'
  }
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/admin/proxy/${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    cache: 'no-store'
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(body.error?.message ?? body.error ?? `Request failed (${response.status})`);
  return body.data as T;
}

async function apiPage<T>(path: string): Promise<{ data: T; pagination?: Pagination }> {
  const response = await fetch(`/api/admin/proxy/${path}`, { cache: 'no-store' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(body.error?.message ?? body.error ?? `Request failed (${response.status})`);
  return { data: body.data as T, pagination: body.meta?.pagination as Pagination | undefined };
}

function Icon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    overview: 'M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z',
    accounts:
      'M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8m6-7.5a4 4 0 0 1 0 7.75M20 21v-2a4 4 0 0 0-3-3.87',
    records: 'M4 4h16v16H4zM8 8h8m-8 4h8m-8 4h5',
    usage: 'M3 3v18h18M8 15l4-4 4 3 5-7',
    audit: 'M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
    health: 'M22 12h-4l-3 9-6-18-3 9H2',
    search: 'm20 20-4.5-4.5M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0',
    plus: 'M12 5v14m-7-7h14',
    close: 'M18 6 6 18M6 6l12 12',
    arrow: 'M7 17 17 7M7 7h10v10',
    shield: 'M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z'
  };
  return (
    <svg
      aria-hidden='true'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.7'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d={paths[name] ?? paths.records} />
    </svg>
  );
}

function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Sign-in failed');
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className='login-wrap'>
      <form className='login-card' onSubmit={submit}>
        <div className='brand-mark'>S</div>
        <p className='eyebrow'>PRIVATE OPERATIONS CONSOLE</p>
        <h1>Sign in to Simamia Admin</h1>
        <p className='muted'>Manage Simamia accounts, service records, usage, and audit history.</p>
        <label htmlFor='admin-email'>Admin email</label>
        <input
          id='admin-email'
          type='email'
          autoComplete='username'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
        <label htmlFor='admin-password'>Admin password</label>
        <input
          id='admin-password'
          type='password'
          autoComplete='current-password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className='primary full' disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in securely'}
        </button>
        {error && <p className='error'>{error}</p>}
        <div className='login-foot'>
          <Icon name='shield' /> Camel Accounts identity credentials are not used for this console.
        </div>
      </form>
    </main>
  );
}

export default function AdminConsole() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [page, setPage] = useState('overview');
  const [overview, setOverview] = useState<Json | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedOwner, setSelectedOwner] = useState('');
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState<Json[]>([]);
  const [resource, setResource] = useState<Resource>('orders');
  const [editing, setEditing] = useState<Json | null>(null);
  const [jsonDraft, setJsonDraft] = useState('');
  const [usage, setUsage] = useState<Json | null>(null);
  const [health, setHealth] = useState<Json | null>(null);
  const [audit, setAudit] = useState<Json[]>([]);
  const [accountsPage, setAccountsPage] = useState(1);
  const [recordsPage, setRecordsPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | undefined>();
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!authenticated) return;
    setLoading(true);
    setError('');
    try {
      if (page === 'overview') setOverview(await api<Json>('overview'));
      if (page === 'accounts' || page === 'records') {
        const accountList = await apiPage<Account[]>(
          `accounts?q=${encodeURIComponent(query)}&page=${accountsPage}&page_size=50`
        );
        const list = accountList.data;
        setAccounts(list);
        if (page === 'accounts') setPagination(accountList.pagination);
        if (list.length && !list.some((account) => account.owner_sub === selectedOwner))
          setSelectedOwner(list[0].owner_sub);
        if (page === 'records' && selectedOwner) {
          const recordList = await apiPage<Json[]>(
            `accounts/${encodeURIComponent(selectedOwner)}/${resource}?q=${encodeURIComponent(query)}&page=${recordsPage}&page_size=50`
          );
          setRecords(recordList.data);
          setPagination(recordList.pagination);
        }
      }
      if (page === 'usage') setUsage(await api<Json>('usage'));
      if (page === 'health') setHealth(await api<Json>('health'));
      if (page === 'audit') {
        const auditList = await apiPage<Json[]>(`audit?page=${auditPage}&page_size=50`);
        setAudit(auditList.data);
        setPagination(auditList.pagination);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load data');
    } finally {
      setLoading(false);
    }
  }, [authenticated, page, query, resource, selectedOwner, accountsPage, recordsPage, auditPage]);

  useEffect(() => {
    fetch('/api/session', { cache: 'no-store' })
      .then((r) => r.json())
      .then((v) => setAuthenticated(Boolean(v.authenticated)))
      .catch(() => setAuthenticated(false));
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const nav = useMemo(() => ['overview', 'accounts', 'records', 'usage', 'health', 'audit'], []);
  async function logout() {
    await fetch('/api/session', { method: 'DELETE' });
    setAuthenticated(false);
  }
  async function saveRecord(event: FormEvent) {
    event.preventDefault();
    if (!selectedOwner) return;
    try {
      const data = JSON.parse(jsonDraft) as Json;
      const path = `accounts/${encodeURIComponent(selectedOwner)}/${resource}${editing?.id ? `/${encodeURIComponent(String(editing.id))}` : ''}`;
      await api(path, { method: editing?.id ? 'PATCH' : 'POST', body: JSON.stringify(data) });
      setEditing(null);
      setJsonDraft('');
      setNotice('Record saved.');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save record. Check the JSON.');
    }
  }
  function startCreate() {
    setEditing({});
    setJsonDraft(JSON.stringify(emptyRecord[resource], null, 2));
    setError('');
  }
  function startEdit(record: Json) {
    const copy = { ...record };
    delete copy.id;
    delete copy.owner_sub;
    setEditing(record);
    setJsonDraft(JSON.stringify(copy, null, 2));
    setError('');
  }
  async function deleteRecord(record: Json) {
    if (
      !selectedOwner ||
      !record.id ||
      !window.confirm(`Delete ${String(record.id)}? This permanently removes the record.`)
    )
      return;
    try {
      await api(
        `accounts/${encodeURIComponent(selectedOwner)}/${resource}/${encodeURIComponent(String(record.id))}`,
        { method: 'DELETE' }
      );
      setNotice('Record deleted.');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete record.');
    }
  }

  if (authenticated === null) return <main className='loading-screen'>Loading admin console…</main>;
  if (!authenticated) return <Login onLogin={() => setAuthenticated(true)} />;

  return (
    <div className='shell'>
      <aside className='sidebar'>
        <a className='brand' href='/'>
          <span className='brand-mark small'>S</span>
          <span>
            <strong>Simamia</strong>
            <small>ADMIN CONSOLE</small>
          </span>
        </a>
        <div className='workspace-chip'>
          <span className='live-dot' /> Production operations
        </div>
        <nav aria-label='Admin navigation'>
          <p className='nav-label'>WORKSPACE</p>
          {nav.map((item) => (
            <button
              key={item}
              className={`nav-item ${page === item ? 'active' : ''}`}
              onClick={() => {
                setPage(item);
                setNotice('');
              }}
            >
              <Icon name={item} />
              <span>{labels[item]}</span>
              {page === item && <span className='nav-active' />}
            </button>
          ))}
        </nav>
        <div className='sidebar-bottom'>
          <div className='admin-avatar'>SA</div>
          <div className='admin-identity'>
            <strong>Simamia Operator</strong>
            <small>Platform administrator</small>
          </div>
          <button className='icon-button logout' onClick={logout} aria-label='Sign out'>
            ↗
          </button>
        </div>
      </aside>
      <main className='main'>
        <header className='topbar'>
          <div className='crumb'>
            <span>Simamia</span>
            <b>/</b>
            {labels[page]}
          </div>
          <div className='top-actions'>
            <span className='secure-label'>
              <Icon name='shield' /> Private console
            </span>
            <button className='icon-button' title='Refresh data' onClick={() => void refresh()}>
              ↻
            </button>
            <button className='avatar'>SA</button>
          </div>
        </header>
        <div className='content'>
          <div className='page-heading'>
            <div>
              <p className='eyebrow'>SIMAMIA PLATFORM</p>
              <h1>{labels[page]}</h1>
              <p className='muted'>
                {page === 'overview'
                  ? 'A live view of tenant data and platform activity.'
                  : page === 'accounts'
                    ? 'Business accounts inferred from Simamia-owned records.'
                    : page === 'records'
                      ? 'Inspect and maintain each account’s operational records.'
                      : page === 'usage'
                        ? 'Storage and activity indicators from the API database.'
                        : page === 'health'
                          ? 'Current API and dependency configuration status.'
                          : 'A trace of administrator changes to business data.'}
              </p>
            </div>
            {page === 'records' && (
              <button className='primary' onClick={startCreate}>
                <Icon name='plus' /> New record
              </button>
            )}
          </div>
          {notice && (
            <div className='notice'>
              {notice}
              <button onClick={() => setNotice('')} aria-label='Dismiss'>
                ×
              </button>
            </div>
          )}
          {error && (
            <div className='error-banner'>
              {error}
              <button onClick={() => setError('')} aria-label='Dismiss'>
                ×
              </button>
            </div>
          )}
          {loading && <div className='loading-bar' />}
          {page === 'overview' && <Overview data={overview} onNavigate={setPage} />}
          {page === 'accounts' && (
            <Accounts
              accounts={accounts}
              query={query}
              setQuery={(value) => {
                setQuery(value);
                setAccountsPage(1);
              }}
              selected={selectedOwner}
              setSelected={setSelectedOwner}
              onNavigate={setPage}
              pagination={pagination}
              onPage={setAccountsPage}
            />
          )}
          {page === 'records' && (
            <section className='panel'>
              <div className='toolbar'>
                <div className='control'>
                  <label>Account</label>
                  <select
                    value={selectedOwner}
                    onChange={(e) => {
                      setSelectedOwner(e.target.value);
                      setRecordsPage(1);
                    }}
                  >
                    {accounts.map((account) => (
                      <option key={account.owner_sub} value={account.owner_sub}>
                        {account.business_name || account.owner_sub} · {account.owner_sub}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='control'>
                  <label>Data area</label>
                  <select
                    value={resource}
                    onChange={(e) => {
                      setResource(e.target.value as Resource);
                      setRecordsPage(1);
                    }}
                  >
                    {resources.map((name) => (
                      <option key={name} value={name}>
                        {labels[name]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='search-field'>
                  <Icon name='search' />
                  <input
                    placeholder='Search records…'
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setRecordsPage(1);
                    }}
                  />
                </div>
              </div>
              <RecordsTable rows={records} onEdit={startEdit} onDelete={deleteRecord} />
              <PaginationBar pagination={pagination} onPage={setRecordsPage} />
            </section>
          )}
          {page === 'usage' && <Usage data={usage} />}
          {page === 'health' && <Health data={health} />}
          {page === 'audit' && <Audit rows={audit} pagination={pagination} onPage={setAuditPage} />}
          <footer className='footer'>
            Simamia Admin <span>·</span> Internal operations <span>·</span> Business records are
            scoped by account
          </footer>
        </div>
      </main>
      {editing !== null && (
        <div
          className='modal-backdrop'
          role='presentation'
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditing(null);
          }}
        >
          <form className='editor-modal' onSubmit={saveRecord}>
            <div className='modal-head'>
              <div>
                <p className='eyebrow'>
                  {editing.id
                    ? `EDIT ${resource.toUpperCase()}`
                    : `CREATE ${resource.toUpperCase()}`}
                </p>
                <h2>{editing.id ? String(editing.id) : 'New business record'}</h2>
              </div>
              <button
                type='button'
                className='icon-button'
                onClick={() => setEditing(null)}
                aria-label='Close'
              >
                <Icon name='close' />
              </button>
            </div>
            <p className='muted'>
              Edit the record as JSON. The API validates required fields and assigns account
              ownership.
            </p>
            <textarea
              spellCheck={false}
              value={jsonDraft}
              onChange={(e) => setJsonDraft(e.target.value)}
              aria-label='Record JSON'
            />
            <div className='modal-foot'>
              <button type='button' className='secondary' onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className='primary'>Save record</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Overview({ data, onNavigate }: { data: Json | null; onNavigate: (page: string) => void }) {
  const resourcesData = (data?.resources ?? {}) as Record<string, number>;
  const tiles = [
    {
      label: 'Business accounts',
      value: String(data?.account_count ?? '—'),
      note: 'Distinct Simamia owner IDs',
      icon: 'accounts'
    },
    {
      label: 'Stored records',
      value: String(data?.record_count ?? '—'),
      note: 'Across all business accounts',
      icon: 'records'
    },
    {
      label: 'Data areas',
      value: Object.keys(resourcesData).length || 6,
      note: 'Operational resources',
      icon: 'overview'
    }
  ];
  return (
    <>
      <section className='welcome-panel'>
        <div>
          <span className='welcome-tag'>
            <span className='live-dot' /> PLATFORM OPERATIONS
          </span>
          <h2>Operations, with the full picture.</h2>
          <p>Review account activity and keep Simamia business data accurate from one place.</p>
        </div>
        <div className='welcome-art'>
          <div className='art-ring ring-one' />
          <div className='art-ring ring-two' />
          <div className='art-core'>S</div>
          <span className='art-orbit orbit-one' />
          <span className='art-orbit orbit-two' />
        </div>
      </section>
      <div className='metric-grid'>
        {tiles.map((tile) => (
          <article className='metric-card' key={tile.label}>
            <div className='metric-top'>
              <span>{tile.label}</span>
              <div className='metric-icon'>
                <Icon name={tile.icon} />
              </div>
            </div>
            <strong>{tile.value}</strong>
            <small>{tile.note}</small>
          </article>
        ))}
      </div>
      <div className='section-title'>
        <div>
          <h2>Data areas</h2>
          <p className='muted'>Stored record counts by resource</p>
        </div>
        <button className='text-button' onClick={() => onNavigate('records')}>
          Manage records <Icon name='arrow' />
        </button>
      </div>
      <div className='resource-grid'>
        {resources.map((name) => (
          <button className='resource-card' key={name} onClick={() => onNavigate('records')}>
            <span className='resource-icon'>
              <Icon name='records' />
            </span>
            <span>
              <strong>{labels[name]}</strong>
              <small>Platform records</small>
            </span>
            <b>{resourcesData[name] ?? 0}</b>
          </button>
        ))}
      </div>
      <div className='info-note'>
        <Icon name='shield' />
        <p>
          <strong>Account identities come from Camel Accounts.</strong> This console sees owner IDs
          attached to Simamia records. User profile and credential administration stays in Camel
          Accounts.
        </p>
      </div>
    </>
  );
}

function Health({ data }: { data: Json | null }) {
  const states = [
    {
      title: 'Simamia API',
      status: data?.status ?? 'loading',
      detail: `Uptime ${Math.floor(Number(data?.uptime_seconds ?? 0) / 3600)}h ${Math.floor((Number(data?.uptime_seconds ?? 0) % 3600) / 60)}m`,
      icon: 'health'
    },
    {
      title: 'SQLite database',
      status: data?.database ?? 'loading',
      detail: 'Persistent operational records and admin audit data',
      icon: 'records'
    },
    {
      title: 'Camel Accounts',
      status: data?.camel_accounts ?? 'loading',
      detail: 'OAuth identity validation configured',
      icon: 'accounts'
    },
    {
      title: 'Admin API',
      status: data?.admin_api ?? 'loading',
      detail: 'Protected by the server-side admin key',
      icon: 'shield'
    }
  ];
  return (
    <>
      <div className='health-grid'>
        {states.map((item) => (
          <article className='health-card' key={item.title}>
            <div className='health-card-top'>
              <span className='metric-icon'>
                <Icon name={item.icon} />
              </span>
              <span
                className={`health-status ${item.status === 'healthy' || item.status === 'configured' || item.status === 'enabled' ? 'good' : item.status === 'loading' ? '' : 'bad'}`}
              >
                <i />
                {String(item.status).replaceAll('_', ' ')}
              </span>
            </div>
            <h2>{item.title}</h2>
            <p>{item.detail}</p>
          </article>
        ))}
      </div>
      <div className='info-note'>
        <Icon name='health' />
        <p>
          <strong>Health scope:</strong> this page checks the Go API process and SQLite
          connectivity. It does not query the Camel Accounts provider, inspect container logs, or
          replace Sentry alerting. Last checked {String(data?.checked_at ?? 'when loaded')}.
        </p>
      </div>
    </>
  );
}

function Accounts({
  accounts,
  query,
  setQuery,
  selected,
  setSelected,
  onNavigate,
  pagination,
  onPage
}: {
  accounts: Account[];
  query: string;
  setQuery: (q: string) => void;
  selected: string;
  setSelected: (id: string) => void;
  onNavigate: (page: string) => void;
  pagination?: Pagination;
  onPage: (page: number) => void;
}) {
  const selectedAccount = accounts.find((account) => account.owner_sub === selected);
  return (
    <section className='panel'>
      <div className='panel-head'>
        <div>
          <h2>Simamia accounts</h2>
          <p>Each row represents a Camel Accounts subject with Simamia business data.</p>
        </div>
        <div className='search-field'>
          <Icon name='search' />
          <input
            placeholder='Search business or account ID'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      <div className='table-scroll'>
        <table>
          <thead>
            <tr>
              <th>Business</th>
              <th>Owner subject</th>
              <th>Records</th>
              <th>Customers</th>
              <th>Jobs</th>
              <th>Services</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.owner_sub}>
                <td>
                  <strong>{account.business_name || 'Business profile not set'}</strong>
                  <small className='cell-muted'>Simamia tenant</small>
                </td>
                <td>
                  <code>{account.owner_sub}</code>
                </td>
                <td>{account.record_count}</td>
                <td>{account.resources.customers ?? 0}</td>
                <td>{account.resources.orders ?? 0}</td>
                <td>{account.resources.services ?? 0}</td>
                <td>
                  <button
                    className='row-action'
                    onClick={() => {
                      setSelected(account.owner_sub);
                    }}
                  >
                    Select <Icon name='arrow' />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {accounts.length === 0 && (
          <div className='empty-state'>
            <span className='empty-icon'>
              <Icon name='accounts' />
            </span>
            <strong>No Simamia accounts found</strong>
            <p>Accounts appear when the API has stored business records for them.</p>
          </div>
        )}
      </div>
      <PaginationBar pagination={pagination} onPage={onPage} />
      {selectedAccount && (
        <div className='selected-account'>
          <span className='live-dot' /> Selected:{' '}
          <strong>{selectedAccount.business_name || 'Business profile not set'}</strong>
          <code>{selected}</code>
          <button className='row-action' onClick={() => onNavigate('records')}>
            Manage records <Icon name='arrow' />
          </button>
        </div>
      )}
    </section>
  );
}

function RecordsTable({
  rows,
  onEdit,
  onDelete
}: {
  rows: Json[];
  onEdit: (r: Json) => void;
  onDelete: (r: Json) => void;
}) {
  if (!rows.length)
    return (
      <div className='empty-state'>
        <span className='empty-icon'>
          <Icon name='records' />
        </span>
        <strong>No matching records</strong>
        <p>Try another account or resource, or create a record.</p>
      </div>
    );
  return (
    <div className='table-scroll'>
      <table>
        <thead>
          <tr>
            <th>Record</th>
            <th>Summary</th>
            <th>Account</th>
            <th>Data</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={String(row.id ?? index)}>
              <td>
                <code>{String(row.id ?? `Record ${index + 1}`)}</code>
              </td>
              <td>
                <strong>
                  {String(
                    row.name ??
                      row.customer ??
                      row.businessName ??
                      row.description ??
                      row.service ??
                      '—'
                  )}
                </strong>
                <small className='cell-muted'>
                  {String(row.status ?? row.category ?? row.role ?? '')}
                </small>
              </td>
              <td>
                <span className='tag'>Tenant owned</span>
              </td>
              <td>
                <code className='json-preview'>
                  {JSON.stringify(row).slice(0, 72)}
                  {JSON.stringify(row).length > 72 ? '…' : ''}
                </code>
              </td>
              <td>
                <div className='row-actions'>
                  <button onClick={() => onEdit(row)}>Edit</button>
                  <button className='danger-link' onClick={() => onDelete(row)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Usage({ data }: { data: Json | null }) {
  const areas = (data?.resources ?? {}) as Record<string, Json>;
  return (
    <>
      <div className='metric-grid usage-metrics'>
        <Metric label='Records stored' value={data?.records ?? '—'} note='Current database count' />
        <Metric
          label='Payload storage'
          value={
            data?.payload_bytes ? `${(Number(data.payload_bytes) / 1024).toFixed(1)} KB` : '0 KB'
          }
          note='Approximate JSON payload size'
        />
        <Metric
          label='Created in 30 days'
          value={data?.created_last_30_days ?? '—'}
          note='Based on database creation time'
        />
        <Metric
          label='Admin changes'
          value={data?.admin_mutations ?? '—'}
          note='Events retained in audit log'
        />
      </div>
      <section className='panel'>
        <div className='panel-head'>
          <div>
            <h2>Usage by data area</h2>
            <p>Database level counts and last update time.</p>
          </div>
          <span className='tag positive'>Updated {String(data?.sampled_at ?? '—')}</span>
        </div>
        <div className='table-scroll'>
          <table>
            <thead>
              <tr>
                <th>Resource</th>
                <th>Records</th>
                <th>Payload</th>
                <th>Created · 30 days</th>
                <th>Last updated</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(areas).map(([name, item]) => (
                <tr key={name}>
                  <td>
                    <strong>{labels[name] ?? name}</strong>
                  </td>
                  <td>{String(item.records ?? 0)}</td>
                  <td>{(Number(item.payload_bytes ?? 0) / 1024).toFixed(1)} KB</td>
                  <td>{String(item.created_last_30_days ?? 0)}</td>
                  <td>{String(item.last_updated ?? '—')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className='subtle-caption'>
        Storage is estimated from serialized record payloads. It excludes SQLite indexes, WAL files,
        and backups.
      </p>
    </>
  );
}

function Audit({
  rows,
  pagination,
  onPage
}: {
  rows: Json[];
  pagination?: Pagination;
  onPage: (page: number) => void;
}) {
  return (
    <section className='panel'>
      <div className='panel-head'>
        <div>
          <h2>Administrator activity</h2>
          <p>
            Successful changes made through the Simamia admin API. Record values are never copied
            into this log.
          </p>
        </div>
        <span className='tag'>Newest first</span>
      </div>
      <div className='table-scroll'>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Record</th>
              <th>Account subject</th>
              <th>Fields</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={String(item.id)}>
                <td>{String(item.occurred_at)}</td>
                <td>
                  <span className={`action-pill ${String(item.action)}`}>
                    {String(item.action)}
                  </span>
                </td>
                <td>{labels[String(item.resource)] ?? String(item.resource)}</td>
                <td>
                  <code>{String(item.record_id || '—')}</code>
                </td>
                <td>
                  <code>{String(item.owner_sub || '—')}</code>
                </td>
                <td>
                  {Array.isArray(item.changed_fields)
                    ? (item.changed_fields as string[]).join(', ') || '—'
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className='empty-state'>
            <span className='empty-icon'>
              <Icon name='audit' />
            </span>
            <strong>No admin changes yet</strong>
            <p>Successful changes will appear here.</p>
          </div>
        )}
      </div>
      <PaginationBar pagination={pagination} onPage={onPage} />
    </section>
  );
}

function PaginationBar({
  pagination,
  onPage
}: {
  pagination?: Pagination;
  onPage: (page: number) => void;
}) {
  if (!pagination || pagination.total_pages < 2) return null;
  return (
    <div className='pagination-bar'>
      <span>
        Showing {(pagination.page - 1) * pagination.page_size + 1}–
        {Math.min(pagination.page * pagination.page_size, pagination.total)} of {pagination.total}
      </span>
      <div>
        <button
          className='secondary'
          disabled={pagination.page <= 1}
          onClick={() => onPage(pagination.page - 1)}
        >
          Previous
        </button>
        <span>
          Page {pagination.page} of {pagination.total_pages}
        </span>
        <button
          className='secondary'
          disabled={pagination.page >= pagination.total_pages}
          onClick={() => onPage(pagination.page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: unknown; note: string }) {
  return (
    <article className='metric-card'>
      <div className='metric-top'>
        <span>{label}</span>
        <span className='metric-dot' />
      </div>
      <strong>{String(value)}</strong>
      <small>{note}</small>
    </article>
  );
}
