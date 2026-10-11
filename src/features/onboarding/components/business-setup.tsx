'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { businessTemplates, type BusinessTemplate } from '../business-templates';

export interface SimamiaBusinessProfile {
  ownerSub: string;
  businessName: string;
  phone: string;
  primaryTemplate: string;
  templateVersion: number;
  createdAt: string;
}

export function BusinessSetup({
  ownerSub,
  ownerName,
  ownerPhone,
  lang,
  onComplete
}: {
  ownerSub: string;
  ownerName?: string;
  ownerPhone?: string;
  lang: 'sw' | 'en';
  onComplete: (profile: SimamiaBusinessProfile) => Promise<void> | void;
}) {
  const [selected, setSelected] = useState('general');
  const [businessName, setBusinessName] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState(() =>
    (ownerPhone ?? '').replace(/\D/g, '').replace(/^255/, '').replace(/^0/, '').slice(0, 9)
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const sw = lang === 'sw';
  const IconCheck = Icons.check;

  const complete = async () => {
    if (!businessName.trim() || phone.length !== 9) {
      setError(
        sw
          ? 'Jaza jina la biashara na namba kamili ya simu yenye tarakimu 9.'
          : 'Enter your business name and a complete 9-digit phone number.'
      );
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onComplete({
        ownerSub,
        businessName: businessName.trim(),
        phone: `+255${phone.trim()}`,
        primaryTemplate: selected,
        templateVersion: 1,
        createdAt: new Date().toISOString()
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : sw
            ? 'Wasifu haujahifadhiwa.'
            : 'Could not save the business profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className='bg-background flex min-h-svh items-center px-3 py-4 sm:px-6 sm:py-6'>
      <div className='mx-auto flex w-full max-w-5xl flex-col gap-4 sm:gap-6'>
        <header className='space-y-1'>
          <p className='text-muted-foreground text-sm'>
            {sw ? 'Karibu Simamia' : 'Welcome to Simamia'}
          </p>
          <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>
            {sw ? 'Tengeneza wasifu wa biashara' : 'Set up your business profile'}
          </h1>
        </header>

        <ol className='grid grid-cols-2 gap-2' aria-label={sw ? 'Hatua za usanidi' : 'Setup steps'}>
          <li
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
              step === 1 ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'
            )}
            aria-current={step === 1 ? 'step' : undefined}
          >
            <span
              className={cn(
                'flex size-6 items-center justify-center rounded-full text-xs',
                step === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}
            >
              1
            </span>
            {sw ? 'Aina ya biashara' : 'Business type'}
          </li>
          <li
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
              step === 2 ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'
            )}
            aria-current={step === 2 ? 'step' : undefined}
          >
            <span
              className={cn(
                'flex size-6 items-center justify-center rounded-full text-xs',
                step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}
            >
              2
            </span>
            {sw ? 'Taarifa za biashara' : 'Business details'}
          </li>
        </ol>

        {step === 1 ? (
          <section className='space-y-3' aria-label={sw ? 'Aina za biashara' : 'Business types'}>
            <div>
              <h2 className='text-lg font-semibold'>
                {sw ? 'Biashara yako inatoa huduma gani?' : 'What kind of business do you run?'}
              </h2>
              <p className='text-muted-foreground text-sm'>
                {sw
                  ? 'Chagua aina moja. Unaweza kuibadilisha baadaye.'
                  : 'Choose one. You can change it later.'}
              </p>
            </div>
            <div className='grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4'>
              {businessTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  selected={selected === template.id}
                  lang={lang}
                  onSelect={() => setSelected(template.id)}
                />
              ))}
            </div>
            <div className='flex justify-end pt-1'>
              <Button className='w-full sm:w-auto' onClick={() => setStep(2)}>
                {sw ? 'Endelea' : 'Continue'}
                <Icons.arrowRight className='ml-2 size-4' />
              </Button>
            </div>
          </section>
        ) : (
          <Card className='mx-auto w-full max-w-2xl'>
            <CardHeader className='pb-3'>
              <CardTitle>{sw ? 'Taarifa za biashara' : 'Business details'}</CardTitle>
              <CardDescription>
                {sw
                  ? `Aina iliyochaguliwa: ${businessTemplates.find((item) => item.id === selected)?.nameSw}`
                  : `Selected type: ${businessTemplates.find((item) => item.id === selected)?.name}`}
                {' · '}
                {sw
                  ? `Akaunti ya mmiliki: ${ownerName || 'Camel Accounts'}`
                  : `Owner account: ${ownerName || 'Camel Accounts'}`}
              </CardDescription>
            </CardHeader>
            <CardContent className='grid gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='business-name'>{sw ? 'Jina la biashara' : 'Business name'}</Label>
                <Input
                  id='business-name'
                  autoComplete='organization'
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  placeholder={sw ? 'Mfano: Saluni ya Amani' : 'e.g. Amani Salon'}
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='business-phone'>
                  {sw ? 'Namba ya simu ya biashara' : 'Business phone number'}
                </Label>
                <div className='border-input bg-background focus-within:ring-ring flex h-10 w-full items-center rounded-md border focus-within:ring-2 focus-within:ring-offset-2'>
                  <span className='text-muted-foreground border-r px-3 text-sm' aria-hidden='true'>
                    +255
                  </span>
                  <Input
                    id='business-phone'
                    name='phone'
                    type='tel'
                    inputMode='numeric'
                    autoComplete='tel-national'
                    required
                    maxLength={9}
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value.replace(/\D/g, '').replace(/^0/, '').slice(0, 9))
                    }
                    placeholder='712 345 678'
                    className='h-full rounded-r-md border-0 bg-transparent px-3 shadow-none focus-visible:border-0 focus-visible:ring-0'
                  />
                </div>
              </div>
              <p className='text-muted-foreground text-xs'>
                {businessTemplates
                  .find((item) => item.id === selected)
                  ?.modules.slice(0, 4)
                  .join(' · ')}
              </p>
              {error && (
                <p className='text-destructive text-sm' role='alert'>
                  {error}
                </p>
              )}
              <div className='flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-between'>
                <Button
                  variant='outline'
                  onClick={() => {
                    setError('');
                    setStep(1);
                  }}
                  disabled={saving}
                >
                  <Icons.chevronLeft className='mr-2 size-4' />
                  {sw ? 'Rudi' : 'Back'}
                </Button>
                <Button onClick={complete} disabled={saving}>
                  {saving ? (
                    <Icons.spinner className='mr-2 size-4 animate-spin' />
                  ) : (
                    <IconCheck className='mr-2 size-4' />
                  )}
                  {sw ? 'Anza kutumia Simamia' : 'Start using Simamia'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

function TemplateCard({
  template,
  selected,
  lang,
  onSelect
}: {
  template: BusinessTemplate;
  selected: boolean;
  lang: 'sw' | 'en';
  onSelect: () => void;
}) {
  const name = lang === 'sw' ? template.nameSw : template.name;
  const description = lang === 'sw' ? template.descriptionSw : template.description;

  return (
    <button
      type='button'
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'focus-visible:ring-ring flex min-h-24 flex-col rounded-xl border p-3 text-left outline-none transition-colors focus-visible:ring-2 sm:min-h-40 sm:p-4',
        selected ? 'border-primary bg-accent/50' : 'border-border bg-card hover:bg-muted/50'
      )}
    >
      <div className='flex items-start justify-between gap-2'>
        <span className='text-xs font-semibold leading-snug sm:text-sm'>{name}</span>
        {selected && (
          <Icons.circleCheck className='text-primary size-4 shrink-0' aria-hidden='true' />
        )}
      </div>
      <span className='text-muted-foreground mt-2 hidden text-xs leading-relaxed sm:block'>
        {description}
      </span>
      <span className='text-muted-foreground mt-auto hidden pt-3 text-[11px] sm:block'>
        {lang === 'sw' ? template.statusLabelsSw[template.statuses[0]] : template.statuses[0]} →{' '}
        {lang === 'sw'
          ? template.statusLabelsSw[template.statuses.at(-1) ?? '']
          : template.statuses.at(-1)}
      </span>
    </button>
  );
}
