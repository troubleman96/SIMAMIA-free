'use client';

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Icons } from '@/components/icons';
import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger
} from '@/components/ui/sidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { toast } from 'sonner';

type Lang = 'sw' | 'en';
type Status = 'New' | 'In progress' | 'Ready' | 'Completed' | 'Cancelled';
type Page =
  | 'overview'
  | 'orders'
  | 'customers'
  | 'services'
  | 'schedule'
  | 'team'
  | 'payments'
  | 'reports'
  | 'messages'
  | 'assistant'
  | 'integrations'
  | 'api'
  | 'settings';
type Order = {
  id: string;
  customer: string;
  phone: string;
  service: string;
  date: string;
  amount: number;
  paid: number;
  status: Status;
  method: string;
  assignee: string;
};
type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  orders: number;
  spent: number;
  last: string;
};
type Service = {
  id: string;
  name: string;
  category: string;
  duration: string;
  price: number;
  active: boolean;
};
type Staff = { id: string; name: string; role: string; phone: string; active: boolean };
type FormKind = 'order' | 'customer' | 'service' | 'staff' | 'payment' | 'message' | null;

const seedOrders: Order[] = [
  {
    id: 'ORD-0248',
    customer: 'Demo Customer 01',
    phone: '+255 700 000 001',
    service: 'Laundry · Express',
    date: '2026-10-11T10:30',
    amount: 48000,
    paid: 48000,
    status: 'In progress',
    method: 'M-Pesa',
    assignee: 'Demo Staff 01'
  },
  {
    id: 'ORD-0247',
    customer: 'Demo Customer 02',
    phone: '+255 700 000 002',
    service: 'AC maintenance',
    date: '2026-10-11T09:00',
    amount: 120000,
    paid: 60000,
    status: 'Ready',
    method: 'Mixx by Yas',
    assignee: 'Demo Staff 02'
  },
  {
    id: 'ORD-0246',
    customer: 'Demo Customer 03',
    phone: '+255 700 000 003',
    service: 'Office cleaning',
    date: '2026-10-11T08:00',
    amount: 185000,
    paid: 185000,
    status: 'Completed',
    method: 'Airtel Money',
    assignee: 'Demo Staff 01'
  },
  {
    id: 'ORD-0245',
    customer: 'Demo Customer 04',
    phone: '+255 700 000 004',
    service: 'Plumbing · Call-out',
    date: '2026-10-10T16:30',
    amount: 95000,
    paid: 0,
    status: 'New',
    method: '—',
    assignee: 'Demo Staff 03'
  },
  {
    id: 'ORD-0244',
    customer: 'Demo Customer 05',
    phone: '+255 700 000 005',
    service: 'Generator service',
    date: '2026-10-10T14:00',
    amount: 210000,
    paid: 210000,
    status: 'Completed',
    method: 'Bank transfer',
    assignee: 'Demo Staff 02'
  },
  {
    id: 'ORD-0243',
    customer: 'Demo Customer 06',
    phone: '+255 700 000 006',
    service: 'Laundry · Wash & fold',
    date: '2026-10-10T12:00',
    amount: 32500,
    paid: 32500,
    status: 'Completed',
    method: 'M-Pesa',
    assignee: 'Demo Staff 01'
  },
  {
    id: 'ORD-0242',
    customer: 'Demo Customer 07',
    phone: '+255 700 000 007',
    service: 'Electrical repair',
    date: '2026-10-10T11:00',
    amount: 75000,
    paid: 25000,
    status: 'In progress',
    method: 'Cash',
    assignee: 'Demo Staff 03'
  },
  {
    id: 'ORD-0241',
    customer: 'Demo Customer 08',
    phone: '+255 700 000 008',
    service: 'Deep cleaning',
    date: '2026-10-09T15:00',
    amount: 260000,
    paid: 260000,
    status: 'Completed',
    method: 'HaloPesa',
    assignee: 'Demo Staff 01'
  }
];
const seedCustomers: Customer[] = [
  {
    id: 'CUS-0086',
    name: 'Demo Customer 01',
    phone: '+255 700 000 001',
    email: 'demo.customer01@example.test',
    location: 'Kinondoni, Dar es Salaam',
    orders: 8,
    spent: 540000,
    last: '11 Oct 2026'
  },
  {
    id: 'CUS-0085',
    name: 'Demo Customer 02',
    phone: '+255 700 000 002',
    email: 'demo.customer02@example.test',
    location: 'Arusha CBD, Arusha',
    orders: 5,
    spent: 725000,
    last: '11 Oct 2026'
  },
  {
    id: 'CUS-0084',
    name: 'Demo Customer 03',
    phone: '+255 700 000 003',
    email: 'demo.customer03@example.test',
    location: 'Upanga, Dar es Salaam',
    orders: 12,
    spent: 1640000,
    last: '11 Oct 2026'
  },
  {
    id: 'CUS-0083',
    name: 'Demo Customer 04',
    phone: '+255 700 000 004',
    email: 'demo.customer04@example.test',
    location: 'Mwanza City, Mwanza',
    orders: 3,
    spent: 195000,
    last: '10 Oct 2026'
  },
  {
    id: 'CUS-0082',
    name: 'Demo Customer 05',
    phone: '+255 700 000 005',
    email: 'demo.customer05@example.test',
    location: 'Mikocheni, Dar es Salaam',
    orders: 16,
    spent: 3270000,
    last: '10 Oct 2026'
  },
  {
    id: 'CUS-0081',
    name: 'Demo Customer 06',
    phone: '+255 700 000 006',
    email: 'demo.customer06@example.test',
    location: 'Moshi, Kilimanjaro',
    orders: 6,
    spent: 381000,
    last: '10 Oct 2026'
  },
  {
    id: 'CUS-0080',
    name: 'Demo Customer 07',
    phone: '+255 700 000 007',
    email: 'demo.customer07@example.test',
    location: 'Dodoma mjini, Dodoma',
    orders: 2,
    spent: 160000,
    last: '10 Oct 2026'
  },
  {
    id: 'CUS-0079',
    name: 'Demo Customer 08',
    phone: '+255 700 000 008',
    email: 'demo.customer08@example.test',
    location: 'Stone Town, Zanzibar',
    orders: 9,
    spent: 1120000,
    last: '09 Oct 2026'
  }
];
const seedServices: Service[] = [
  {
    id: 'SRV-01',
    name: 'Laundry · Wash & fold',
    category: 'Laundry',
    duration: '24 hours',
    price: 25000,
    active: true
  },
  {
    id: 'SRV-02',
    name: 'Laundry · Express',
    category: 'Laundry',
    duration: 'Same day',
    price: 48000,
    active: true
  },
  {
    id: 'SRV-03',
    name: 'Home deep cleaning',
    category: 'Cleaning',
    duration: '4 hours',
    price: 260000,
    active: true
  },
  {
    id: 'SRV-04',
    name: 'Office cleaning',
    category: 'Cleaning',
    duration: '3 hours',
    price: 185000,
    active: true
  },
  {
    id: 'SRV-05',
    name: 'AC maintenance',
    category: 'Repairs',
    duration: '2 hours',
    price: 120000,
    active: true
  },
  {
    id: 'SRV-06',
    name: 'Plumbing · Call-out',
    category: 'Repairs',
    duration: '90 min',
    price: 95000,
    active: true
  },
  {
    id: 'SRV-07',
    name: 'Electrical repair',
    category: 'Repairs',
    duration: '2 hours',
    price: 75000,
    active: true
  },
  {
    id: 'SRV-08',
    name: 'Generator service',
    category: 'Repairs',
    duration: '3 hours',
    price: 210000,
    active: false
  }
];
const seedStaff: Staff[] = [
  {
    id: 'TM-04',
    name: 'Demo Staff 01',
    role: 'Service lead',
    phone: '+255 700 001 001',
    active: true
  },
  {
    id: 'TM-03',
    name: 'Demo Staff 02',
    role: 'Technician',
    phone: '+255 700 001 002',
    active: true
  },
  {
    id: 'TM-02',
    name: 'Demo Staff 03',
    role: 'Technician',
    phone: '+255 700 001 003',
    active: true
  },
  { id: 'TM-01', name: 'Demo Admin', role: 'Owner', phone: '+255 700 001 004', active: true }
];

const words = {
  sw: {
    overview: 'Muhtasari',
    orders: 'Maagizo',
    customers: 'Wateja',
    services: 'Huduma',
    schedule: 'Ratiba',
    team: 'Timu',
    payments: 'Malipo',
    reports: 'Ripoti',
    messages: 'Ujumbe',
    assistant: 'Msaidizi AI',
    integrations: 'Miunganisho',
    api: 'API na nyaraka',
    settings: 'Mipangilio',
    work: 'KAZI',
    manage: 'USIMAMIZI',
    grow: 'WASILIANO',
    system: 'MFUMO',
    business: 'Mwangaza Demo Services',
    overviewDesc: 'Muhtasari wa huduma zako leo.',
    ordersDesc: 'Pokea, ratibu na fuatilia kazi za wateja.',
    customersDesc: 'Taarifa na historia ya wateja wako.',
    servicesDesc: 'Huduma, bei na muda wa utekelezaji.',
    scheduleDesc: 'Panga kazi na mgawo wa timu.',
    teamDesc: 'Simamia watu wanaotoa huduma.',
    paymentsDesc: 'Fuatilia malipo na salio la maagizo.',
    reportsDesc: 'Muhtasari wa biashara na mauzo.',
    messagesDesc: 'Andaa ujumbe wa wateja.',
    assistantDesc: 'Majibu ya haraka kuhusu biashara yako.',
    integrationsDesc: 'Unganisha ujumbe na huduma za AI.',
    apiDesc: 'Mkataba wa API na nyaraka za usimamizi.',
    settingsDesc: 'Mipangilio ya biashara na onyesho.',
    revenue: 'Mapato ya mwezi',
    totalOrders: 'Jumla ya maagizo',
    newCustomers: 'Wateja wapya',
    outstanding: 'Salio linalodaiwa',
    vsMonth: 'ikilinganishwa na mwezi uliopita',
    recentOrders: 'Maagizo ya hivi karibuni',
    todaySchedule: 'Ratiba ya leo',
    quickActions: 'Vitendo vya haraka',
    last30: 'Siku 30 zilizopita',
    search: 'Tafuta chochote…',
    searchRecords: 'Tafuta jina, simu au huduma…',
    newOrder: 'Agizo jipya',
    addCustomer: 'Ongeza mteja',
    addService: 'Ongeza huduma',
    addStaff: 'Ongeza mfanyakazi',
    recordPayment: 'Rekodi malipo',
    sendMessage: 'Andaa ujumbe',
    create: 'Unda',
    save: 'Hifadhi',
    cancel: 'Ghairi',
    close: 'Funga',
    export: 'Pakua CSV',
    all: 'Zote',
    status: 'Hali',
    customer: 'Mteja',
    service: 'Huduma',
    date: 'Tarehe',
    amount: 'Kiasi',
    assigned: 'Aliyepangiwa',
    method: 'Njia ya malipo',
    paid: 'Imelipwa',
    due: 'Salio',
    phone: 'Simu',
    email: 'Barua pepe',
    location: 'Eneo',
    name: 'Jina',
    price: 'Bei',
    duration: 'Muda',
    category: 'Aina',
    active: 'Inatumika',
    inactive: 'Haifanyi kazi',
    actions: 'Vitendo',
    noResults: 'Hakuna matokeo. Badili utafutaji au ongeza rekodi mpya.',
    preview: 'Onyesho · Data huhifadhiwa kwenye kifaa hiki',
    integrationsOff: 'Haijaunganishwa',
    draftOnly: 'Ujumbe umehifadhiwa kama rasimu; haujatumwa.',
    welcome: 'Habari za asubuhi, Demo Admin',
    revenueLabel: 'Mapato',
    ordersLabel: 'Maagizo',
    fiscal: 'Hifadhi kumbukumbu hapa; toa risiti ya EFD/VFD iliyoidhinishwa pale inapohitajika.',
    switchLang: 'English',
    customerCount: 'Wateja',
    dueToday: 'Inadaiwa',
    details: 'Maelezo'
  },
  en: {
    overview: 'Overview',
    orders: 'Orders',
    customers: 'Customers',
    services: 'Services',
    schedule: 'Schedule',
    team: 'Team',
    payments: 'Payments',
    reports: 'Reports',
    messages: 'Messages',
    assistant: 'AI assistant',
    integrations: 'Integrations',
    api: 'API & docs',
    settings: 'Settings',
    work: 'WORK',
    manage: 'MANAGE',
    grow: 'GROW',
    system: 'SYSTEM',
    business: 'Mwangaza Demo Services',
    overviewDesc: 'Here’s what is happening with your services today.',
    ordersDesc: 'Receive, schedule and track customer work.',
    customersDesc: 'Your customer details and service history.',
    servicesDesc: 'Services, prices and delivery times.',
    scheduleDesc: 'Plan work and assign your team.',
    teamDesc: 'Manage the people delivering services.',
    paymentsDesc: 'Track payments and outstanding balances.',
    reportsDesc: 'Business and sales summaries.',
    messagesDesc: 'Prepare customer messages.',
    assistantDesc: 'Quick answers about your business.',
    integrationsDesc: 'Connect messaging and AI services.',
    apiDesc: 'API contract and management documentation.',
    settingsDesc: 'Business and preview settings.',
    revenue: 'Revenue this month',
    totalOrders: 'Total orders',
    newCustomers: 'New customers',
    outstanding: 'Outstanding',
    vsMonth: 'vs last month',
    recentOrders: 'Recent orders',
    todaySchedule: 'Today’s schedule',
    quickActions: 'Quick actions',
    last30: 'Last 30 days',
    search: 'Search anything…',
    searchRecords: 'Search name, phone or service…',
    newOrder: 'New order',
    addCustomer: 'Add customer',
    addService: 'Add service',
    addStaff: 'Add staff member',
    recordPayment: 'Record payment',
    sendMessage: 'Prepare message',
    create: 'Create',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    export: 'Export CSV',
    all: 'All',
    status: 'Status',
    customer: 'Customer',
    service: 'Service',
    date: 'Date',
    amount: 'Amount',
    assigned: 'Assigned to',
    method: 'Payment method',
    paid: 'Paid',
    due: 'Due',
    phone: 'Phone',
    email: 'Email',
    location: 'Location',
    name: 'Name',
    price: 'Price',
    duration: 'Duration',
    category: 'Category',
    active: 'Active',
    inactive: 'Inactive',
    actions: 'Actions',
    noResults: 'No results. Try another search or add a record.',
    preview: 'Preview · Data stays on this device',
    integrationsOff: 'Not connected',
    draftOnly: 'Message saved as a draft; it was not sent.',
    welcome: 'Good morning, Demo Admin',
    revenueLabel: 'Revenue',
    ordersLabel: 'Orders',
    fiscal: 'Keep records here; issue an approved EFD/VFD fiscal receipt where required.',
    switchLang: 'Kiswahili',
    customerCount: 'Customers',
    dueToday: 'Due',
    details: 'Details'
  }
} as const;

const menu: {
  section: 'work' | 'manage' | 'grow' | 'system';
  page: Page;
  icon: keyof typeof Icons;
}[] = [
  { section: 'work', page: 'overview', icon: 'dashboard' },
  { section: 'work', page: 'orders', icon: 'post' },
  { section: 'work', page: 'customers', icon: 'teams' },
  { section: 'work', page: 'services', icon: 'product' },
  { section: 'work', page: 'schedule', icon: 'calendar' },
  { section: 'manage', page: 'team', icon: 'teams' },
  { section: 'manage', page: 'payments', icon: 'creditCard' },
  { section: 'manage', page: 'reports', icon: 'trendingUp' },
  { section: 'grow', page: 'messages', icon: 'chat' },
  { section: 'grow', page: 'assistant', icon: 'sparkles' },
  { section: 'grow', page: 'integrations', icon: 'externalLink' },
  { section: 'system', page: 'api', icon: 'code' },
  { section: 'system', page: 'settings', icon: 'settings' }
];
const pages: Page[] = [
  'overview',
  'orders',
  'customers',
  'services',
  'schedule',
  'team',
  'payments',
  'reports',
  'messages',
  'assistant',
  'integrations',
  'api',
  'settings'
];
const statuses: Status[] = ['New', 'In progress', 'Ready', 'Completed', 'Cancelled'];
const statusSw: Record<Status, string> = {
  New: 'Jipya',
  'In progress': 'Inaendelea',
  Ready: 'Tayari',
  Completed: 'Imekamilika',
  Cancelled: 'Imeghairiwa'
};
const money = (n: number) =>
  `TZS ${new Intl.NumberFormat('en-TZ', { maximumFractionDigits: 0 }).format(n)}`;
const idNext = (prefix: string, n: number, digits = 4) =>
  `${prefix}-${String(n).padStart(digits, '0')}`;
const statusClass = (status: Status) =>
  status === 'Completed'
    ? 'border-primary/40 text-primary'
    : status === 'Ready'
      ? 'border-blue-500/40 text-blue-700 dark:text-blue-300'
      : status === 'Cancelled'
        ? 'border-destructive/40 text-destructive'
        : 'border-border text-muted-foreground';

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder = ''
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className='grid gap-2'>
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
function Choice({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className='grid gap-2'>
      <Label>{label}</Label>
      <select
        className='border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-1'
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
function OrderStatus({ status, lang }: { status: Status; lang: Lang }) {
  return (
    <Badge variant='outline' className={statusClass(status)}>
      {lang === 'sw' ? statusSw[status] : status}
    </Badge>
  );
}
function SectionHeading({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>{title}</h2>
        {description && <p className='text-muted-foreground mt-1 text-sm'>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export default function HudumaDesk() {
  const [lang, setLang] = useState<Lang>('sw');
  const [page, setPage] = useState<Page>('overview');
  const [orders, setOrders] = useState<Order[]>(seedOrders);
  const [customers, setCustomers] = useState<Customer[]>(seedCustomers);
  const [services, setServices] = useState<Service[]>(seedServices);
  const [staff, setStaff] = useState<Staff[]>(seedStaff);
  const [businessName, setBusinessName] = useState('Mwangaza Demo Services');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modal, setModal] = useState<FormKind>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [assistantQuestion, setAssistantQuestion] = useState('');
  const [assistantAnswer, setAssistantAnswer] = useState('');
  const t = (key: keyof typeof words.sw) => words[lang][key] ?? words.en[key];

  useEffect(() => {
    try {
      const raw = localStorage.getItem('hudumadesk-demo-v1');
      if (raw) {
        const value = JSON.parse(raw);
        if (value.orders) setOrders(value.orders);
        if (value.customers) setCustomers(value.customers);
        if (value.services) setServices(value.services);
        if (value.staff) setStaff(value.staff);
        if (value.language === 'sw' || value.language === 'en') setLang(value.language);
        if (value.businessName) setBusinessName(value.businessName);
      }
    } catch {
      /* Ignore corrupted local preview data. */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded)
      localStorage.setItem(
        'hudumadesk-demo-v1',
        JSON.stringify({ orders, customers, services, staff, language: lang, businessName })
      );
  }, [loaded, orders, customers, services, staff, lang, businessName]);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const filteredOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          [order.id, order.customer, order.phone, order.service]
            .join(' ')
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (statusFilter === 'All' || order.status === statusFilter)
      ),
    [orders, query, statusFilter]
  );
  const filteredCustomers = useMemo(
    () =>
      customers.filter((customer) =>
        [customer.name, customer.phone, customer.email, customer.location]
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [customers, query]
  );
  const pageName = t(page);
  const descKey = `${page}Desc` as keyof typeof words.sw;
  const description = t(descKey);
  const setField = (key: string, value: string) => setForm((old) => ({ ...old, [key]: value }));
  const openModal = (kind: Exclude<FormKind, null>) => {
    setForm({
      date: '2026-10-12',
      time: '10:00',
      amount: '',
      paid: '0',
      status: 'New',
      method: 'M-Pesa',
      category: 'General',
      duration: '1 hour',
      customer: customers[0]?.name ?? '',
      service: services.find((item) => item.active)?.name ?? '',
      order: orders[0]?.id ?? '',
      channel: 'SMS',
      message: ''
    });
    setModal(kind);
  };
  const cycleStatus = (id: string) =>
    setOrders((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, status: statuses[(statuses.indexOf(item.status) + 1) % statuses.length] }
          : item
      )
    );
  const resetForm = () => {
    setModal(null);
    setForm({});
  };
  const saveRecord = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (modal === 'order') {
      if (!form.customer || !form.service || !form.amount) return;
      const customer = customers.find((item) => item.name === form.customer);
      const amount = Number(form.amount) || 0;
      setOrders((items) => [
        {
          id: idNext('ORD', 249 + items.length),
          customer: form.customer,
          phone: customer?.phone ?? form.phone ?? '',
          service: form.service,
          date: `${form.date || '2026-10-12'}T${form.time || '10:00'}`,
          amount,
          paid: Number(form.paid) || 0,
          status: (form.status as Status) || 'New',
          method: form.method || '—',
          assignee: form.assignee || staff[0]?.name || '—'
        },
        ...items
      ]);
      toast.success(lang === 'sw' ? 'Agizo limeundwa' : 'Order created');
    } else if (modal === 'customer') {
      if (!form.name || !form.phone) return;
      setCustomers((items) => [
        {
          id: idNext('CUS', 87 + items.length),
          name: form.name,
          phone: form.phone,
          email: form.email || '',
          location: form.location || 'Tanzania',
          orders: 0,
          spent: 0,
          last: 'Leo'
        },
        ...items
      ]);
      toast.success(lang === 'sw' ? 'Mteja ameongezwa' : 'Customer added');
    } else if (modal === 'service') {
      if (!form.name || !form.price) return;
      setServices((items) => [
        {
          id: idNext('SRV', 1 + items.length, 2),
          name: form.name,
          category: form.category || 'General',
          duration: form.duration || '1 hour',
          price: Number(form.price) || 0,
          active: true
        },
        ...items
      ]);
      toast.success(lang === 'sw' ? 'Huduma imeongezwa' : 'Service added');
    } else if (modal === 'staff') {
      if (!form.name || !form.phone) return;
      setStaff((items) => [
        {
          id: idNext('TM', 5 + items.length, 2),
          name: form.name,
          phone: form.phone,
          role: form.role || 'Technician',
          active: true
        },
        ...items
      ]);
      toast.success(lang === 'sw' ? 'Mfanyakazi ameongezwa' : 'Team member added');
    } else if (modal === 'payment') {
      const amount = Number(form.amount) || 0;
      setOrders((items) =>
        items.map((item) =>
          item.id === form.order
            ? {
                ...item,
                paid: Math.min(item.amount, item.paid + amount),
                method: form.method || item.method
              }
            : item
        )
      );
      toast.success(lang === 'sw' ? 'Malipo yamerekodiwa' : 'Payment recorded');
    } else if (modal === 'message') {
      toast.success(t('draftOnly'));
    }
    resetForm();
  };
  const exportCsv = () => {
    const rows = [
      ['Order', 'Customer', 'Phone', 'Service', 'Date', 'Amount TZS', 'Paid TZS', 'Status'],
      ...filteredOrders.map((item) => [
        item.id,
        item.customer,
        item.phone,
        item.service,
        item.date,
        item.amount,
        item.paid,
        item.status
      ])
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const href = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = 'hudumadesk-orders.csv';
    anchor.click();
    URL.revokeObjectURL(href);
  };

  const pageAction =
    page === 'overview' || page === 'orders' || page === 'schedule' ? (
      <Button onClick={() => openModal('order')}>
        <Icons.add className='mr-2 size-4' />
        {t('newOrder')}
      </Button>
    ) : page === 'customers' ? (
      <Button onClick={() => openModal('customer')}>
        <Icons.add className='mr-2 size-4' />
        {t('addCustomer')}
      </Button>
    ) : page === 'services' ? (
      <Button onClick={() => openModal('service')}>
        <Icons.add className='mr-2 size-4' />
        {t('addService')}
      </Button>
    ) : page === 'team' ? (
      <Button onClick={() => openModal('staff')}>
        <Icons.add className='mr-2 size-4' />
        {t('addStaff')}
      </Button>
    ) : page === 'payments' ? (
      <Button onClick={() => openModal('payment')}>
        <Icons.add className='mr-2 size-4' />
        {t('recordPayment')}
      </Button>
    ) : page === 'messages' ? (
      <Button onClick={() => openModal('message')}>
        <Icons.send className='mr-2 size-4' />
        {t('sendMessage')}
      </Button>
    ) : page === 'reports' ? (
      <Button variant='outline' onClick={exportCsv}>
        <Icons.fileTypeXls className='mr-2 size-4' />
        {t('export')}
      </Button>
    ) : undefined;

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible='icon'>
        <SidebarHeader className='group-data-[collapsible=icon]:pt-4'>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size='lg'
                className='data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground'
              >
                <span className='bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md text-sm font-bold'>
                  H
                </span>
                <span className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-semibold'>HudumaDesk</span>
                  <span className='truncate text-xs text-muted-foreground'>{businessName}</span>
                </span>
                <Icons.chevronsDown className='ml-auto size-4' />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className='overflow-x-hidden'>
          {(['work', 'manage', 'grow', 'system'] as const).map((section) => (
            <SidebarGroup key={section} className='py-0'>
              <SidebarGroupLabel>{words[lang][section]}</SidebarGroupLabel>
              <SidebarMenu>
                {menu
                  .filter((item) => item.section === section)
                  .map((item) => {
                    const Icon = Icons[item.icon];
                    return (
                      <SidebarMenuItem key={item.page}>
                        <SidebarMenuButton
                          isActive={page === item.page}
                          tooltip={t(item.page)}
                          render={
                            <button
                              type='button'
                              onClick={() => {
                                setPage(item.page);
                                setQuery('');
                              }}
                            />
                          }
                        >
                          <Icon className='size-4' />
                          <span>{t(item.page)}</span>
                          {item.page === 'orders' && (
                            <span className='bg-muted text-muted-foreground ml-auto rounded px-1.5 py-0.5 text-[10px]'>
                              {orders.filter((order) => order.status !== 'Completed').length}
                            </span>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter>
          <Separator />
          <div className='flex items-center gap-3 px-2 py-2'>
            <div className='bg-primary/15 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold'>
              DA
            </div>
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-medium'>Demo Admin Emmanuel</p>
              <p className='text-muted-foreground truncate text-xs'>
                {lang === 'sw' ? 'Msimamizi' : 'Owner'}
              </p>
            </div>
            <Icons.chevronsDown className='text-muted-foreground size-4' />
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset id='main-content' className='min-w-0'>
        <header className='bg-background/60 sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 border-b backdrop-blur-md md:h-14'>
          <div className='flex min-w-0 items-center gap-2 px-4'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='mr-2 h-4' />
            <span className='text-muted-foreground hidden text-sm sm:inline'>{businessName}</span>
            <span className='text-muted-foreground hidden sm:inline'>/</span>
            <span className='truncate text-sm font-medium'>{pageName}</span>
          </div>
          <div className='flex items-center gap-2 px-4'>
            <div className='relative hidden w-52 md:block'>
              <Icons.search className='text-muted-foreground absolute top-2.5 left-2.5 size-4' />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('search')}
                className='h-9 pl-9'
              />
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setLang(lang === 'sw' ? 'en' : 'sw')}
              aria-label={t('switchLang')}
            >
              {lang === 'sw' ? 'SW' : 'EN'}
            </Button>
            <Button
              variant='ghost'
              size='icon'
              aria-label={lang === 'sw' ? 'Arifa' : 'Notifications'}
            >
              <Icons.notification className='size-4' />
              <span className='sr-only'>3</span>
            </Button>
            <div className='bg-primary/15 text-primary hidden size-8 items-center justify-center rounded-full text-xs font-semibold sm:flex'>
              DA
            </div>
          </div>
        </header>
        <PageContainer
          pageTitle={page === 'overview' ? t('welcome') : pageName}
          pageDescription={description}
          pageHeaderAction={pageAction}
        >
          {page === 'overview' && (
            <Overview
              orders={orders}
              lang={lang}
              onNavigate={setPage}
              onNewOrder={() => openModal('order')}
            />
          )}
          {page === 'orders' && (
            <OrdersPage
              orders={filteredOrders}
              lang={lang}
              query={query}
              setQuery={setQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              onAdvance={cycleStatus}
              onPayment={() => openModal('payment')}
            />
          )}
          {page === 'customers' && <CustomersPage customers={filteredCustomers} lang={lang} />}
          {page === 'services' && (
            <ServicesPage
              services={services.filter((item) =>
                [item.name, item.category].join(' ').toLowerCase().includes(query.toLowerCase())
              )}
              lang={lang}
              onToggle={(id) =>
                setServices((items) =>
                  items.map((item) => (item.id === id ? { ...item, active: !item.active } : item))
                )
              }
            />
          )}
          {page === 'schedule' && (
            <SchedulePage orders={orders} lang={lang} onAdvance={cycleStatus} />
          )}
          {page === 'team' && (
            <TeamPage
              staff={staff}
              lang={lang}
              onToggle={(id) =>
                setStaff((items) =>
                  items.map((item) => (item.id === id ? { ...item, active: !item.active } : item))
                )
              }
            />
          )}
          {page === 'payments' && (
            <PaymentsPage orders={orders} lang={lang} onRecord={() => openModal('payment')} />
          )}
          {page === 'reports' && <ReportsPage orders={orders} lang={lang} onExport={exportCsv} />}
          {page === 'messages' && (
            <MessagesPage lang={lang} onPrepare={() => openModal('message')} />
          )}
          {page === 'assistant' && (
            <AssistantPage
              lang={lang}
              question={assistantQuestion}
              setQuestion={setAssistantQuestion}
              answer={assistantAnswer}
              setAnswer={setAssistantAnswer}
              orders={orders}
              customers={customers}
            />
          )}
          {page === 'integrations' && <IntegrationsPage lang={lang} />}
          {page === 'api' && <ApiPage lang={lang} />}
          {page === 'settings' && (
            <SettingsPage
              lang={lang}
              businessName={businessName}
              setBusinessName={setBusinessName}
              onReset={() => {
                localStorage.removeItem('hudumadesk-demo-v1');
                setOrders(seedOrders);
                setCustomers(seedCustomers);
                setServices(seedServices);
                setStaff(seedStaff);
                toast.success(lang === 'sw' ? 'Onyesho limerejeshwa' : 'Demo data reset');
              }}
            />
          )}
        </PageContainer>
      </SidebarInset>
      <Dialog open={modal !== null} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>
              {modal === 'order'
                ? t('newOrder')
                : modal === 'customer'
                  ? t('addCustomer')
                  : modal === 'service'
                    ? t('addService')
                    : modal === 'staff'
                      ? t('addStaff')
                      : modal === 'payment'
                        ? t('recordPayment')
                        : t('sendMessage')}
            </DialogTitle>
            <DialogDescription>
              {lang === 'sw'
                ? 'Jaza taarifa hapa chini. Data ya onyesho huhifadhiwa kwenye kifaa hiki.'
                : 'Enter the details below. Preview data is stored on this device.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveRecord} className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              {modal === 'order' && (
                <>
                  <Choice
                    label={t('customer')}
                    value={form.customer ?? ''}
                    onChange={(value) => setField('customer', value)}
                    options={customers.map((item) => item.name)}
                  />
                  <Choice
                    label={t('service')}
                    value={form.service ?? ''}
                    onChange={(value) => setField('service', value)}
                    options={services.filter((item) => item.active).map((item) => item.name)}
                  />
                  <Field
                    label={t('date')}
                    type='date'
                    value={form.date ?? ''}
                    onChange={(value) => setField('date', value)}
                    required
                  />
                  <Field
                    label={lang === 'sw' ? 'Saa' : 'Time'}
                    type='time'
                    value={form.time ?? ''}
                    onChange={(value) => setField('time', value)}
                  />
                  <Field
                    label={t('amount')}
                    type='number'
                    value={form.amount ?? ''}
                    onChange={(value) => setField('amount', value)}
                    required
                    placeholder='48000'
                  />
                  <Choice
                    label={t('assigned')}
                    value={form.assignee ?? staff[0]?.name ?? ''}
                    onChange={(value) => setField('assignee', value)}
                    options={staff.map((item) => item.name)}
                  />
                </>
              )}
              {modal === 'customer' && (
                <>
                  <Field
                    label={t('name')}
                    value={form.name ?? ''}
                    onChange={(value) => setField('name', value)}
                    required
                  />
                  <Field
                    label={t('phone')}
                    value={form.phone ?? ''}
                    onChange={(value) => setField('phone', value)}
                    required
                    placeholder='+255 7xx xxx xxx'
                  />
                  <Field
                    label={t('email')}
                    type='email'
                    value={form.email ?? ''}
                    onChange={(value) => setField('email', value)}
                  />
                  <Field
                    label={t('location')}
                    value={form.location ?? ''}
                    onChange={(value) => setField('location', value)}
                    placeholder='Dar es Salaam'
                  />
                </>
              )}
              {modal === 'service' && (
                <>
                  <Field
                    label={t('name')}
                    value={form.name ?? ''}
                    onChange={(value) => setField('name', value)}
                    required
                  />
                  <Field
                    label={t('category')}
                    value={form.category ?? ''}
                    onChange={(value) => setField('category', value)}
                  />
                  <Field
                    label={t('price')}
                    type='number'
                    value={form.price ?? ''}
                    onChange={(value) => setField('price', value)}
                    required
                  />
                  <Field
                    label={t('duration')}
                    value={form.duration ?? ''}
                    onChange={(value) => setField('duration', value)}
                  />
                </>
              )}
              {modal === 'staff' && (
                <>
                  <Field
                    label={t('name')}
                    value={form.name ?? ''}
                    onChange={(value) => setField('name', value)}
                    required
                  />
                  <Field
                    label={t('phone')}
                    value={form.phone ?? ''}
                    onChange={(value) => setField('phone', value)}
                    required
                  />
                  <Field
                    label={lang === 'sw' ? 'Wajibu' : 'Role'}
                    value={form.role ?? ''}
                    onChange={(value) => setField('role', value)}
                  />
                </>
              )}
              {modal === 'payment' && (
                <>
                  <Choice
                    label={lang === 'sw' ? 'Agizo' : 'Order'}
                    value={form.order ?? ''}
                    onChange={(value) => setField('order', value)}
                    options={orders.map((item) => item.id)}
                  />
                  <Field
                    label={t('amount')}
                    type='number'
                    value={form.amount ?? ''}
                    onChange={(value) => setField('amount', value)}
                    required
                  />
                  <Choice
                    label={t('method')}
                    value={form.method ?? 'M-Pesa'}
                    onChange={(value) => setField('method', value)}
                    options={[
                      'M-Pesa',
                      'Mixx by Yas',
                      'Airtel Money',
                      'HaloPesa',
                      'Cash',
                      'Bank transfer'
                    ]}
                  />
                </>
              )}
              {modal === 'message' && (
                <>
                  <Choice
                    label={lang === 'sw' ? 'Njia' : 'Channel'}
                    value={form.channel ?? 'SMS'}
                    onChange={(value) => setField('channel', value)}
                    options={['SMS', 'Email']}
                  />
                  <Field
                    label={lang === 'sw' ? 'Mpokeaji' : 'Recipient'}
                    value={form.recipient ?? ''}
                    onChange={(value) => setField('recipient', value)}
                    required
                    placeholder='+255… or email'
                  />
                  <div className='sm:col-span-2 grid gap-2'>
                    <Label>{lang === 'sw' ? 'Ujumbe' : 'Message'}</Label>
                    <textarea
                      className='border-input bg-background focus-visible:ring-ring min-h-24 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1'
                      value={form.message ?? ''}
                      onChange={(event) => setField('message', event.target.value)}
                      required
                    />
                  </div>
                </>
              )}
            </div>
            {modal === 'message' && (
              <p className='text-muted-foreground text-xs'>
                {lang === 'sw'
                  ? 'Huduma ya kutuma bado haijaunganishwa. Rasimu haitatumwa.'
                  : 'Sending is not connected yet. This saves a draft only.'}
              </p>
            )}
            <DialogFooter>
              <Button type='button' variant='outline' onClick={resetForm}>
                {t('cancel')}
              </Button>
              <Button type='submit'>{t('save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

function Overview({
  orders,
  lang,
  onNavigate,
  onNewOrder
}: {
  orders: Order[];
  lang: Lang;
  onNavigate: (page: Page) => void;
  onNewOrder: () => void;
}) {
  const t = (key: keyof typeof words.sw) => words[lang][key] ?? words.en[key];
  const outstanding = orders.reduce((sum, item) => sum + Math.max(0, item.amount - item.paid), 0);
  const recent = orders.slice(0, 5);
  const days =
    lang === 'sw'
      ? ['12 Sep', '19 Sep', '26 Sep', '03 Okt', '11 Okt']
      : ['12 Sep', '19 Sep', '26 Sep', '03 Oct', '11 Oct'];
  return (
    <div className='flex flex-1 flex-col gap-4'>
      <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
        <Metric
          title={t('revenue')}
          value='TZS 4,820,000'
          change='+12.8%'
          note={t('vsMonth')}
          icon='trendingUp'
        />
        <Metric
          title={t('totalOrders')}
          value='194'
          change='+8.2%'
          note={t('vsMonth')}
          icon='post'
        />
        <Metric
          title={t('newCustomers')}
          value='29'
          change='+5.4%'
          note={t('vsMonth')}
          icon='teams'
        />
        <Metric
          title={t('outstanding')}
          value={money(Math.max(680000, outstanding))}
          change={String(orders.filter((item) => item.paid < item.amount).length)}
          note={lang === 'sw' ? 'Agizo 4 · yanayofuatiliwa 3' : '4 orders · 3 follow-ups'}
          icon='creditCard'
        />
      </div>
      <div className='grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]'>
        <Card className='@container/card'>
          <CardHeader>
            <CardTitle>{lang === 'sw' ? 'Muhtasari wa mapato' : 'Revenue overview'}</CardTitle>
            <CardDescription>
              {lang === 'sw' ? 'Mapato na maagizo kwa muda' : 'Revenue and orders over time'}
            </CardDescription>
            <CardAction>
              <Button variant='outline' size='sm'>
                {t('last30')} <Icons.chevronDown className='ml-2 size-4' />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className='flex h-56 items-end gap-2 border-b px-2 pb-0 pt-4 sm:gap-4'>
              {[48, 60, 52, 69, 76, 64, 72, 86, 69, 78, 92, 84, 72, 88, 80, 96].map(
                (height, index) => (
                  <div key={index} className='flex h-full flex-1 items-end gap-1'>
                    <div
                      className='bg-primary/80 w-1/2 rounded-t-sm'
                      style={{ height: `${height}%` }}
                    />
                    <div
                      className='bg-muted-foreground/20 w-1/2 rounded-t-sm'
                      style={{ height: `${Math.max(18, height - 16)}%` }}
                    />
                  </div>
                )
              )}
            </div>
            <div className='text-muted-foreground mt-3 flex justify-between text-xs'>
              {days.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className='text-muted-foreground mt-4 flex gap-5 text-xs'>
              <span className='flex items-center gap-2'>
                <span className='bg-primary size-2 rounded-full' />
                {t('revenueLabel')}
              </span>
              <span className='flex items-center gap-2'>
                <span className='bg-muted-foreground/30 size-2 rounded-full' />
                {t('ordersLabel')}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('todaySchedule')}</CardTitle>
            <CardDescription>
              {lang === 'sw' ? 'Agizo 4 · wafanyakazi 3' : '4 orders · 3 assigned'}
            </CardDescription>
            <CardAction>
              <Button variant='link' size='sm' onClick={() => onNavigate('schedule')}>
                {lang === 'sw' ? 'Angalia yote' : 'View all'}{' '}
                <Icons.arrowRight className='ml-1 size-4' />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className='space-y-4'>
            {orders.slice(0, 4).map((item, index) => (
              <div key={item.id} className='flex items-start gap-3'>
                <span className='text-muted-foreground w-11 pt-0.5 text-xs'>
                  {new Date(item.date).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                <span
                  className={`mt-1 h-9 w-0.5 rounded-full ${index % 2 ? 'bg-chart-2' : 'bg-primary'}`}
                />
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium'>{item.service}</p>
                  <p className='text-muted-foreground truncate text-xs'>
                    {item.customer} · {item.assignee}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className='grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]'>
        <OrdersTable
          orders={recent}
          lang={lang}
          onAdvance={() => onNavigate('orders')}
          title={t('recentOrders')}
        />
        <Card>
          <CardHeader>
            <CardTitle>{t('quickActions')}</CardTitle>
            <CardDescription>
              {lang === 'sw' ? 'Njia za mkato za kazi za kila siku' : 'Shortcuts for daily work'}
            </CardDescription>
          </CardHeader>
          <CardContent className='grid gap-2 sm:grid-cols-2 xl:grid-cols-1'>
            <Button variant='outline' className='justify-start' onClick={onNewOrder}>
              <Icons.add className='mr-2 size-4' />
              {t('newOrder')}
            </Button>
            <Button
              variant='outline'
              className='justify-start'
              onClick={() => onNavigate('customers')}
            >
              <Icons.teams className='mr-2 size-4' />
              {t('addCustomer')}
            </Button>
            <Button
              variant='outline'
              className='justify-start'
              onClick={() => onNavigate('payments')}
            >
              <Icons.creditCard className='mr-2 size-4' />
              {t('recordPayment')}
            </Button>
            <Button
              variant='outline'
              className='justify-start'
              onClick={() => onNavigate('messages')}
            >
              <Icons.chat className='mr-2 size-4' />
              {t('sendMessage')}
            </Button>
          </CardContent>
        </Card>
      </div>
      <p className='text-muted-foreground text-xs'>
        {t('preview')} · {t('fiscal')}
      </p>
    </div>
  );
}
function Metric({
  title,
  value,
  change,
  note,
  icon
}: {
  title: string;
  value: string;
  change: string;
  note: string;
  icon: keyof typeof Icons;
}) {
  const Icon = Icons[icon];
  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
          {value}
        </CardTitle>
        <CardAction>
          <Badge variant='outline'>
            <Icon className='mr-1 size-3.5' />
            {change}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className='flex-col items-start gap-1.5 text-sm'>
        <div className='line-clamp-1 flex gap-2 font-medium'>
          {note}
          <Icons.trendingUp className='size-4' />
        </div>
        <div className='text-muted-foreground'>{title}</div>
      </CardFooter>
    </Card>
  );
}
function OrdersTable({
  orders,
  lang,
  onAdvance,
  title
}: {
  orders: Order[];
  lang: Lang;
  onAdvance?: (id: string) => void;
  title?: string;
}) {
  const t = (key: keyof typeof words.sw) => words[lang][key] ?? words.en[key];
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title ?? t('orders')}</CardTitle>
        <CardDescription>
          {lang === 'sw'
            ? `${orders.length} ${t('orders').toLowerCase()}`
            : `${orders.length} orders`}
        </CardDescription>
      </CardHeader>
      <CardContent className='px-0 sm:px-6'>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('customer')}</TableHead>
                <TableHead>{t('service')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead className='text-right'>{t('amount')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length ? (
                orders.map((item) => (
                  <TableRow
                    key={item.id}
                    onClick={() => onAdvance?.(item.id)}
                    className={onAdvance ? 'cursor-pointer' : ''}
                  >
                    <TableCell>
                      <div className='font-medium'>{item.customer}</div>
                      <div className='text-muted-foreground text-xs'>{item.id}</div>
                    </TableCell>
                    <TableCell>
                      <div>{item.service}</div>
                      <div className='text-muted-foreground text-xs'>{item.assignee}</div>
                    </TableCell>
                    <TableCell>
                      <OrderStatus status={item.status} lang={lang} />
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>{money(item.amount)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className='text-muted-foreground py-8 text-center'>
                    {t('noResults')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
function OrdersPage({
  orders,
  lang,
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  onAdvance,
  onPayment
}: {
  orders: Order[];
  lang: Lang;
  query: string;
  setQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  onAdvance: (id: string) => void;
  onPayment: () => void;
}) {
  const t = (key: keyof typeof words.sw) => words[lang][key] ?? words.en[key];
  return (
    <div className='space-y-4'>
      <SectionHeading
        title={lang === 'sw' ? 'Orodha ya maagizo' : 'Order register'}
        description={
          lang === 'sw'
            ? 'Bofya hali ili kusogeza agizo hatua inayofuata.'
            : 'Select a status badge to move an order to the next step.'
        }
        action={
          <Button variant='outline' onClick={onPayment}>
            <Icons.creditCard className='mr-2 size-4' />
            {t('recordPayment')}
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <CardTitle>{t('orders')}</CardTitle>
              <CardDescription>
                {orders.length} {lang === 'sw' ? 'rekodi' : 'records'}
              </CardDescription>
            </div>
            <div className='flex flex-col gap-2 sm:flex-row'>
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('searchRecords')}
                className='w-full sm:w-64'
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className='border-input bg-background h-9 rounded-md border px-3 text-sm'
              >
                <option value='All'>
                  {t('all')} {t('status').toLowerCase()}
                </option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {lang === 'sw' ? statusSw[status] : status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className='px-0 sm:px-6'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>{t('customer')}</TableHead>
                  <TableHead>{t('service')}</TableHead>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('assigned')}</TableHead>
                  <TableHead className='text-right'>{t('amount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className='font-mono text-xs'>{item.id}</TableCell>
                    <TableCell>
                      <div className='font-medium'>{item.customer}</div>
                      <div className='text-muted-foreground text-xs'>{item.phone}</div>
                    </TableCell>
                    <TableCell>{item.service}</TableCell>
                    <TableCell>
                      {new Date(item.date).toLocaleString(lang === 'sw' ? 'sw-TZ' : 'en-GB', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => onAdvance(item.id)}
                        aria-label={`${t('status')}: ${item.status}`}
                      >
                        <OrderStatus status={item.status} lang={lang} />
                      </button>
                    </TableCell>
                    <TableCell>{item.assignee}</TableCell>
                    <TableCell className='text-right tabular-nums'>
                      {money(item.amount)}
                      <div className='text-muted-foreground text-xs'>
                        {t('paid')}: {money(item.paid)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
function CustomersPage({ customers, lang }: { customers: Customer[]; lang: Lang }) {
  const t = (key: keyof typeof words.sw) => words[lang][key] ?? words.en[key];
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('customers')}</CardTitle>
        <CardDescription>
          {customers.length} {lang === 'sw' ? 'rekodi' : 'records'}
        </CardDescription>
      </CardHeader>
      <CardContent className='px-0 sm:px-6'>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('customer')}</TableHead>
                <TableHead>{t('phone')}</TableHead>
                <TableHead>{t('location')}</TableHead>
                <TableHead>{t('orders')}</TableHead>
                <TableHead className='text-right'>
                  {lang === 'sw' ? 'Jumla ya matumizi' : 'Lifetime spend'}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length ? (
                customers.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className='font-medium'>{item.name}</div>
                      <div className='text-muted-foreground text-xs'>{item.email}</div>
                    </TableCell>
                    <TableCell>
                      <a className='text-primary hover:underline' href={`tel:${item.phone}`}>
                        {item.phone}
                      </a>
                    </TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>{item.orders}</TableCell>
                    <TableCell className='text-right tabular-nums'>{money(item.spent)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className='py-8 text-center text-muted-foreground'>
                    {t('noResults')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
function ServicesPage({
  services,
  lang,
  onToggle
}: {
  services: Service[];
  lang: Lang;
  onToggle: (id: string) => void;
}) {
  const t = (key: keyof typeof words.sw) => words[lang][key] ?? words.en[key];
  return (
    <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
      {services.map((service) => (
        <Card key={service.id}>
          <CardHeader>
            <div className='flex items-start justify-between gap-3'>
              <div>
                <CardDescription>{service.category}</CardDescription>
                <CardTitle className='mt-1'>{service.name}</CardTitle>
              </div>
              <Badge variant='outline'>{service.active ? t('active') : t('inactive')}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-muted-foreground flex items-center justify-between text-sm'>
              <span>{t('duration')}</span>
              <span>{service.duration}</span>
            </div>
            <div className='mt-3 flex items-center justify-between text-sm'>
              <span>{t('price')}</span>
              <span className='font-semibold tabular-nums'>{money(service.price)}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant='outline' size='sm' onClick={() => onToggle(service.id)}>
              {service.active
                ? lang === 'sw'
                  ? 'Sitisha'
                  : 'Pause'
                : lang === 'sw'
                  ? 'Washa'
                  : 'Activate'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
function SchedulePage({
  orders,
  lang,
  onAdvance
}: {
  orders: Order[];
  lang: Lang;
  onAdvance: (id: string) => void;
}) {
  const t = (key: keyof typeof words.sw) => words[lang][key] ?? words.en[key];
  const upcoming = [...orders].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div className='grid gap-4 lg:grid-cols-[260px_1fr]'>
      <Card>
        <CardHeader>
          <CardTitle>{lang === 'sw' ? 'Wiki hii' : 'This week'}</CardTitle>
          <CardDescription>
            {lang === 'sw' ? '11–17 Oktoba 2026' : '11–17 October 2026'}
          </CardDescription>
        </CardHeader>
        <CardContent className='grid grid-cols-7 gap-1 text-center text-xs'>
          {['J', 'J', 'J', 'A', 'I', 'J', 'S'].map((day, index) => (
            <div key={index} className='text-muted-foreground'>
              {day}
              <div
                className={`mt-2 rounded-md py-2 ${index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
              >
                {11 + index}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{lang === 'sw' ? 'Kazi zilizopangwa' : 'Scheduled work'}</CardTitle>
          <CardDescription>
            {upcoming.length} {lang === 'sw' ? 'maagizo' : 'orders'}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          {upcoming.map((item) => (
            <button
              key={item.id}
              onClick={() => onAdvance(item.id)}
              className='hover:bg-muted/50 flex w-full items-center gap-4 rounded-lg border p-3 text-left transition-colors'
            >
              <span className='text-muted-foreground w-12 text-xs'>
                {new Date(item.date).toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              <span className='bg-primary/70 h-9 w-0.5 rounded-full' />
              <span className='min-w-0 flex-1'>
                <span className='block truncate text-sm font-medium'>{item.service}</span>
                <span className='text-muted-foreground block truncate text-xs'>
                  {item.customer} · {item.assignee}
                </span>
              </span>
              <OrderStatus status={item.status} lang={lang} />
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
function TeamPage({
  staff,
  lang,
  onToggle
}: {
  staff: Staff[];
  lang: Lang;
  onToggle: (id: string) => void;
}) {
  const t = (key: keyof typeof words.sw) => words[lang][key] ?? words.en[key];
  return (
    <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
      {staff.map((member) => (
        <Card key={member.id}>
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='bg-primary/15 text-primary flex size-11 items-center justify-center rounded-full text-sm font-semibold'>
                {member.name
                  .split(' ')
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join('')}
              </div>
              <div className='min-w-0'>
                <CardTitle className='truncate text-base'>{member.name}</CardTitle>
                <CardDescription>{member.role}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <a
              href={`tel:${member.phone}`}
              className='text-muted-foreground text-sm hover:text-foreground'
            >
              {member.phone}
            </a>
          </CardContent>
          <CardFooter className='justify-between'>
            <Badge variant='outline'>{member.active ? t('active') : t('inactive')}</Badge>
            <Button variant='outline' size='sm' onClick={() => onToggle(member.id)}>
              {member.active
                ? lang === 'sw'
                  ? 'Sitisha'
                  : 'Pause'
                : lang === 'sw'
                  ? 'Washa'
                  : 'Activate'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
function PaymentsPage({
  orders,
  lang,
  onRecord
}: {
  orders: Order[];
  lang: Lang;
  onRecord: () => void;
}) {
  const t = (key: keyof typeof words.sw) => words[lang][key] ?? words.en[key];
  const due = orders.reduce((sum, item) => sum + Math.max(0, item.amount - item.paid), 0);
  return (
    <div className='space-y-4'>
      <div className='grid gap-4 sm:grid-cols-3'>
        <Metric
          title={lang === 'sw' ? 'Jumla iliyolipwa' : 'Total collected'}
          value={money(orders.reduce((sum, item) => sum + item.paid, 0))}
          change={t('paid')}
          note={t('method')}
          icon='creditCard'
        />
        <Metric
          title={t('outstanding')}
          value={money(due)}
          change={String(orders.filter((item) => item.paid < item.amount).length)}
          note={lang === 'sw' ? 'Maagizo yenye salio' : 'Orders with balances'}
          icon='clock'
        />
        <Metric
          title={lang === 'sw' ? 'Njia zinazotumika' : 'Payment methods'}
          value='6'
          change='TZ'
          note='M-Pesa · Mixx · Airtel'
          icon='creditCard'
        />
      </div>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>{lang === 'sw' ? 'Daftari la malipo' : 'Payment ledger'}</CardTitle>
              <CardDescription>
                {lang === 'sw' ? 'Rekodi za malipo kwa agizo' : 'Payments linked to each order'}
              </CardDescription>
            </div>
            <Button size='sm' onClick={onRecord}>
              <Icons.add className='mr-2 size-4' />
              {t('recordPayment')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className='px-0 sm:px-6'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>{t('customer')}</TableHead>
                  <TableHead>{t('method')}</TableHead>
                  <TableHead>{t('paid')}</TableHead>
                  <TableHead>{t('due')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className='font-mono text-xs'>{item.id}</TableCell>
                    <TableCell>{item.customer}</TableCell>
                    <TableCell>{item.method}</TableCell>
                    <TableCell className='tabular-nums'>{money(item.paid)}</TableCell>
                    <TableCell className='tabular-nums'>
                      {money(Math.max(0, item.amount - item.paid))}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant='outline'
                        className={
                          item.paid >= item.amount
                            ? 'text-primary'
                            : 'text-amber-700 dark:text-amber-300'
                        }
                      >
                        {item.paid >= item.amount
                          ? lang === 'sw'
                            ? 'Imelipwa'
                            : 'Paid'
                          : lang === 'sw'
                            ? 'Inasubiri'
                            : 'Pending'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <p className='text-muted-foreground text-xs'>{t('fiscal')}</p>
    </div>
  );
}
function ReportsPage({
  orders,
  lang,
  onExport
}: {
  orders: Order[];
  lang: Lang;
  onExport: () => void;
}) {
  const t = (key: keyof typeof words.sw) => words[lang][key] ?? words.en[key];
  return (
    <div className='space-y-4'>
      <SectionHeading
        title={lang === 'sw' ? 'Ripoti za biashara' : 'Business reports'}
        description={
          lang === 'sw'
            ? 'Pakua daftari la maagizo kama CSV.'
            : 'Download the order register as CSV.'
        }
        action={
          <Button variant='outline' onClick={onExport}>
            <Icons.fileTypeXls className='mr-2 size-4' />
            {t('export')}
          </Button>
        }
      />
      <div className='grid gap-4 md:grid-cols-3'>
        <Metric
          title={t('revenue')}
          value={money(orders.reduce((sum, item) => sum + item.paid, 0))}
          change='+12%'
          note={t('paid')}
          icon='trendingUp'
        />
        <Metric
          title={t('totalOrders')}
          value={String(orders.length)}
          change='+8%'
          note={lang === 'sw' ? 'Jumla ya rekodi' : 'All records'}
          icon='post'
        />
        <Metric
          title={t('outstanding')}
          value={money(orders.reduce((sum, item) => sum + Math.max(0, item.amount - item.paid), 0))}
          change='TZS'
          note={t('due')}
          icon='creditCard'
        />
      </div>
      <OrdersTable
        orders={orders}
        lang={lang}
        title={lang === 'sw' ? 'Muhtasari wa maagizo' : 'Order summary'}
      />
    </div>
  );
}
function MessagesPage({ lang, onPrepare }: { lang: Lang; onPrepare: () => void }) {
  const t = (key: keyof typeof words.sw) => words[lang][key] ?? words.en[key];
  return (
    <div className='grid gap-4 lg:grid-cols-[1.2fr_1fr]'>
      <Card>
        <CardHeader>
          <CardTitle>{lang === 'sw' ? 'Ujumbe kwa wateja' : 'Customer messaging'}</CardTitle>
          <CardDescription>
            {lang === 'sw'
              ? 'Tuma taarifa za agizo na vikumbusho baada ya kuunganisha mtoa huduma.'
              : 'Send order updates and reminders after connecting a provider.'}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='bg-muted/50 rounded-lg border p-4'>
            <p className='text-sm font-medium'>
              {lang === 'sw' ? 'Taarifa ya agizo' : 'Order update'}
            </p>
            <p className='text-muted-foreground mt-2 text-sm'>
              {lang === 'sw'
                ? 'Habari Demo Customer 01, agizo lako ORD-0248 limepokelewa. Tutakutumia taarifa likiwa tayari.'
                : 'Hi Demo Customer 01, your order ORD-0248 is in progress. We will let you know when it is ready.'}
            </p>
          </div>
          <Button onClick={onPrepare}>
            <Icons.send className='mr-2 size-4' />
            {t('sendMessage')}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{lang === 'sw' ? 'Hali ya njia' : 'Channel status'}</CardTitle>
          <CardDescription>{t('integrationsOff')}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='flex items-center justify-between rounded-lg border p-3'>
            <span>SMS · SendAfrica</span>
            <Badge variant='outline'>{t('integrationsOff')}</Badge>
          </div>
          <div className='flex items-center justify-between rounded-lg border p-3'>
            <span>Email · MailAfrica</span>
            <Badge variant='outline'>{t('integrationsOff')}</Badge>
          </div>
          <p className='text-muted-foreground text-xs'>
            {lang === 'sw'
              ? 'Rasimu za ujumbe hazitumwi hadi API key salama ziwekwe kwenye seva.'
              : 'Drafts are not sent until secure server-side API keys are configured.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
function AssistantPage({
  lang,
  question,
  setQuestion,
  answer,
  setAnswer,
  orders,
  customers
}: {
  lang: Lang;
  question: string;
  setQuestion: (value: string) => void;
  answer: string;
  setAnswer: (value: string) => void;
  orders: Order[];
  customers: Customer[];
}) {
  return (
    <div className='grid gap-4 lg:grid-cols-[1.2fr_1fr]'>
      <Card>
        <CardHeader>
          <CardTitle>
            {lang === 'sw' ? 'Uliza kuhusu biashara' : 'Ask about your business'}
          </CardTitle>
          <CardDescription>
            {lang === 'sw'
              ? 'Onyesho linatumia muhtasari wa data ya ndani pekee.'
              : 'This preview answers from local demo data only.'}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='bg-muted/50 min-h-36 rounded-lg border p-4'>
            <p className='text-muted-foreground text-sm'>
              {lang === 'sw'
                ? 'Jaribu: “Nina maagizo mangapi ambayo hayajalipwa?”'
                : 'Try: “How many orders still have a balance?”'}
            </p>
            {answer && <p className='mt-4 text-sm'>{answer}</p>}
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const q = question.toLowerCase();
              if (
                q.includes('payment') ||
                q.includes('lip') ||
                q.includes('due') ||
                q.includes('salio')
              ) {
                const due = orders.filter((item) => item.paid < item.amount);
                setAnswer(
                  lang === 'sw'
                    ? `Kuna maagizo ${due.length} yenye salio; jumla ni ${money(due.reduce((sum, item) => sum + item.amount - item.paid, 0))}.`
                    : `${due.length} orders have a balance, totaling ${money(due.reduce((sum, item) => sum + item.amount - item.paid, 0))}.`
                );
              } else if (q.includes('customer') || q.includes('mteja') || q.includes('wateja'))
                setAnswer(
                  lang === 'sw'
                    ? `Kuna wateja ${customers.length} kwenye onyesho hili.`
                    : `There are ${customers.length} customers in this preview.`
                );
              else
                setAnswer(
                  lang === 'sw'
                    ? `Una maagizo ${orders.length}. Jaribu kuuliza kuhusu malipo au wateja.`
                    : `There are ${orders.length} orders. Try asking about payments or customers.`
                );
            }}
            className='flex gap-2'
          >
            <Input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={lang === 'sw' ? 'Andika swali…' : 'Ask a question…'}
            />
            <Button type='submit'>
              <Icons.send className='mr-2 size-4' />
              {lang === 'sw' ? 'Uliza' : 'Ask'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{lang === 'sw' ? 'Unganisha AI halisi' : 'Connect live AI'}</CardTitle>
          <CardDescription>Ngamia</CardDescription>
        </CardHeader>
        <CardContent className='space-y-3 text-sm'>
          <p>
            {lang === 'sw'
              ? 'Msaidizi huyu ni mfano wa ndani; hakuna swali linalotumwa kwa mtoa huduma wa AI.'
              : 'This assistant is a local demo; questions are not sent to an AI provider.'}
          </p>
          <a
            className='text-primary inline-flex items-center gap-1 hover:underline'
            href='https://docs.ngamia.cc'
            target='_blank'
            rel='noreferrer'
          >
            docs.ngamia.cc <Icons.externalLink className='size-3.5' />
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
function IntegrationsPage({ lang }: { lang: Lang }) {
  const list = [
    {
      title: 'SendAfrica',
      kind: lang === 'sw' ? 'SMS na ujumbe' : 'SMS and messaging',
      url: 'https://docs.sendafrica.online',
      icon: 'phone' as const
    },
    {
      title: 'MailAfrica',
      kind: lang === 'sw' ? 'Barua pepe' : 'Email delivery',
      url: 'https://docs.mailafrica.online',
      icon: 'send' as const
    },
    {
      title: 'Ngamia',
      kind: lang === 'sw' ? 'Huduma za AI' : 'AI services',
      url: 'https://docs.ngamia.cc',
      icon: 'sparkles' as const
    }
  ];
  return (
    <div className='grid gap-4 md:grid-cols-3'>
      {list.map((item) => {
        const Icon = Icons[item.icon];
        return (
          <Card key={item.title}>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <Icon className='text-primary size-5' />
                <Badge variant='outline'>{words[lang].integrationsOff}</Badge>
              </div>
              <CardTitle className='mt-2'>{item.title}</CardTitle>
              <CardDescription>{item.kind}</CardDescription>
            </CardHeader>
            <CardContent>
              <a
                className='text-primary inline-flex items-center gap-1 text-sm hover:underline'
                href={item.url}
                target='_blank'
                rel='noreferrer'
              >
                {lang === 'sw' ? 'Nyaraka za API' : 'API documentation'}{' '}
                <Icons.externalLink className='size-3.5' />
              </a>
              <p className='text-muted-foreground mt-3 text-xs'>
                {lang === 'sw'
                  ? 'Weka funguo za API kwenye seva pekee.'
                  : 'Keep API keys on the server only.'}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
function ApiPage({ lang }: { lang: Lang }) {
  const apiBaseUrl = (
    process.env.NEXT_PUBLIC_HUDUMADESK_API_URL || 'http://localhost:8080/api/v1'
  ).replace(/\/+$/, '');
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  useEffect(() => {
    let active = true;
    fetch(`${apiBaseUrl}/health`, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('API health check failed');
        return response.json();
      })
      .then(() => {
        if (active) setApiStatus('online');
      })
      .catch(() => {
        if (active) setApiStatus('offline');
      });
    return () => {
      active = false;
    };
  }, [apiBaseUrl]);
  const endpoints = [
    ['GET', '/health', lang === 'sw' ? 'Hali ya API' : 'API health'],
    [
      'GET/POST',
      '/orders',
      lang === 'sw' ? 'Orodha na uundaji wa maagizo' : 'List and create orders'
    ],
    [
      'GET/PATCH/DELETE',
      '/orders/{id}',
      lang === 'sw' ? 'Soma, badilisha au futa agizo' : 'Read, update, or delete an order'
    ],
    ['GET/POST', '/customers', lang === 'sw' ? 'Wateja' : 'Customers'],
    ['GET/POST', '/services', lang === 'sw' ? 'Huduma' : 'Services'],
    ['GET/POST', '/team', lang === 'sw' ? 'Timu' : 'Team'],
    [
      'GET',
      '/payments',
      lang === 'sw' ? 'Daftari la malipo, linasomwa pekee' : 'Read-only payment ledger'
    ]
  ];
  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle>{lang === 'sw' ? 'API ya Go' : 'Go workflow API'}</CardTitle>
          <CardDescription>
            {lang === 'sw' ? 'Anwani ya msingi: ' : 'Base URL: '}
            <a
              className='text-primary font-mono hover:underline'
              href={`${apiBaseUrl}/health`}
              target='_blank'
              rel='noreferrer'
            >
              {apiBaseUrl}
            </a>
          </CardDescription>
          <CardAction>
            <Badge variant='outline'>
              {apiStatus === 'online'
                ? lang === 'sw'
                  ? 'Inatumika'
                  : 'Online'
                : apiStatus === 'offline'
                  ? lang === 'sw'
                    ? 'Haipatikani'
                    : 'Offline'
                  : lang === 'sw'
                    ? 'Inakagua…'
                    : 'Checking…'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{lang === 'sw' ? 'Njia' : 'Method'}</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>{lang === 'sw' ? 'Matumizi' : 'Purpose'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpoints.map(([method, path, purpose]) => (
                  <TableRow key={path}>
                    <TableCell>
                      <Badge variant='outline'>{method}</Badge>
                    </TableCell>
                    <TableCell className='font-mono text-xs'>{path}</TableCell>
                    <TableCell>{purpose}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className='text-muted-foreground text-xs'>
            {lang === 'sw'
              ? 'API hii ya onyesho haina uthibitishaji na hutumia data bandia ya pamoja kwenye kumbukumbu. Mabadiliko ya API hayaonekani kwenye data ya kivinjari ya dashibodi.'
              : 'This demo API is unauthenticated and uses shared, fabricated in-memory data. API changes are separate from the dashboard’s browser-local records.'}
          </p>
          <div className='flex flex-wrap gap-4 text-sm'>
            <a
              className='text-primary hover:underline'
              href={`${apiBaseUrl}/orders?page=1&page_size=10`}
              target='_blank'
              rel='noreferrer'
            >
              {lang === 'sw' ? 'Angalia maagizo ya mfano' : 'View sample orders'}
            </a>
            <a
              className='text-primary hover:underline'
              href={`${apiBaseUrl}/payments`}
              target='_blank'
              rel='noreferrer'
            >
              {lang === 'sw' ? 'Angalia daftari la malipo' : 'View payment ledger'}
            </a>
            <a
              className='text-primary hover:underline'
              href='https://github.com/troubleman96/hudumadesk-tanzania/blob/main/api/openapi.yaml'
              target='_blank'
              rel='noreferrer'
            >
              {lang === 'sw' ? 'Mkataba wa OpenAPI' : 'OpenAPI contract'}
            </a>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            {lang === 'sw' ? 'Jaribio la API na usalama wa onyesho' : 'API testing and demo safety'}
          </CardTitle>
          <CardDescription>
            {lang === 'sw'
              ? 'Hifadhi mabadiliko kwa data za majaribio pekee.'
              : 'Use synthetic data only when testing writes.'}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-2 text-sm'>
          <p>
            {lang === 'sw'
              ? 'Dashibodi huhifadhi mabadiliko yake kwenye kivinjari. Tumia maombi ya REST yaliyo kwenye nyaraka kujaribu CRUD ya API.'
              : 'The dashboard stores its edits in this browser. Use the documented REST requests to exercise API CRUD workflows.'}
          </p>
          <p className='text-muted-foreground'>
            {lang === 'sw'
              ? 'API inaweza kufikiwa na mtu yeyote mwenye kiungo hiki; rekodi zake hurudi mwanzo seva ikiwashwa upya.'
              : 'Anyone with this link can change or delete the shared sample API records; they reset when the service restarts.'}
          </p>
          <a
            className='text-primary hover:underline'
            href='https://github.com/troubleman96/hudumadesk-tanzania/blob/main/docs/demo-testing.md'
            target='_blank'
            rel='noreferrer'
          >
            {lang === 'sw' ? 'Fungua mwongozo wa majaribio' : 'Open demo testing guide'}
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
function SettingsPage({
  lang,
  businessName,
  setBusinessName,
  onReset
}: {
  lang: Lang;
  businessName: string;
  setBusinessName: (value: string) => void;
  onReset: () => void;
}) {
  return (
    <div className='grid gap-4 lg:grid-cols-[1fr_1fr]'>
      <Card>
        <CardHeader>
          <CardTitle>{lang === 'sw' ? 'Biashara' : 'Business profile'}</CardTitle>
          <CardDescription>
            {lang === 'sw'
              ? 'Jina hili linaonekana kwenye menyu.'
              : 'This name appears in the workspace sidebar.'}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Field
            label={lang === 'sw' ? 'Jina la biashara' : 'Business name'}
            value={businessName}
            onChange={setBusinessName}
          />
          <div className='grid gap-2'>
            <Label>{lang === 'sw' ? 'Lugha' : 'Language'}</Label>
            <p className='text-muted-foreground text-sm'>
              {lang === 'sw'
                ? 'Kiswahili rahisi · tumia swichi ya SW/EN kwenye kichwa.'
                : 'Simple Kiswahili · use the SW/EN switch in the header.'}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            {lang === 'sw' ? 'Tanzania · kumbukumbu za kodi' : 'Tanzania · tax records'}
          </CardTitle>
          <CardDescription>
            {lang === 'sw'
              ? 'Hakikisha taratibu zako zinakidhi masharti husika.'
              : 'Confirm your workflow meets the applicable requirements.'}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-muted-foreground text-sm'>{words[lang].fiscal}</p>
          <Separator />
          <div>
            <p className='text-sm font-medium'>
              {lang === 'sw' ? 'Data ya onyesho' : 'Preview data'}
            </p>
            <p className='text-muted-foreground mt-1 text-xs'>{words[lang].preview}</p>
          </div>
          <Button variant='destructive' onClick={onReset}>
            {lang === 'sw' ? 'Rejesha data ya mfano' : 'Reset demo data'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
