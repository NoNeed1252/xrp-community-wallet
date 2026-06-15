import { Card, Select, type SelectOption } from '@rc/ui';
import { useTranslation } from 'react-i18next';
import { Monitor, Moon, Sun } from '@rc/ui';
import type { ReactNode } from 'react';
import { usePreferences } from '~/lib/wallet/useWallet';
import { setPreferences } from '~/lib/wallet/vaultMutations';
import type { AutoLockMinutes, Locale, Theme } from '~/lib/wallet/types';
import { SUPPORTED_LOCALES, LOCALE_DISPLAY_NAMES } from '@rc/i18n';
import i18n from '~/lib/i18n';
import { setTheme as applyTheme } from '~/lib/theme/useTheme';

const LANGUAGE_OPTIONS: SelectOption<Locale>[] = SUPPORTED_LOCALES.map((value) => ({
  value,
  label: LOCALE_DISPLAY_NAMES[value],
  caption: value.toUpperCase(),
}));
const THEMES: { value: Theme; icon: ReactNode }[] = [
  { value: 'light', icon: <Sun className="h-4 w-4" aria-hidden="true" /> },
  { value: 'dark', icon: <Moon className="h-4 w-4" aria-hidden="true" /> },
  { value: 'system', icon: <Monitor className="h-4 w-4" aria-hidden="true" /> },
];
const AUTO_LOCK_OPTIONS: AutoLockMinutes[] = [1, 5, 15, 30, 60];

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return theme;
}

function SettingsCard({ title, body, children }: { title: string; body?: string; children: ReactNode }) {
  return (
    <Card>
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-h3 text-neutral-900">{title}</h2>
          {body && <p className="text-caption text-neutral-500 mt-1">{body}</p>}
        </div>
        <div>{children}</div>
      </div>
    </Card>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  ariaLabel: string;
}

function AnimatedToggle({ checked, onChange, ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ' +
        (checked ? 'bg-brand-600' : 'bg-neutral-300')
      }
    >
      <span
        className={
          'inline-block h-5 w-5 transform rounded-full bg-surface shadow ring-0 transition-transform ' +
          (checked ? 'translate-x-5' : 'translate-x-0')
        }
      />
    </button>
  );
}

interface SegmentedProps<T extends string | number> {
  options: { value: T; label: string; icon?: ReactNode }[];
  value: T;
  onChange: (next: T) => void;
}

function Segmented<T extends string | number>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <div className="inline-flex rounded-lg bg-nested p-1 flex-wrap">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={
              'inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-body font-medium transition-all ' +
              (active
                ? 'bg-surface text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900')
            }
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function GeneralSettings() {
  const { t } = useTranslation('settings');
  const { prefs } = usePreferences();
  if (!prefs) return null;

  const onLocaleChange = async (loc: Locale) => {
    await setPreferences({ locale: loc });
    if (typeof window !== 'undefined') window.localStorage.setItem('rc:locale', loc);
    void i18n.changeLanguage(loc);
  };

  return (
    <div className="flex flex-col gap-4">
      <SettingsCard
        title={t('general.appearance.title')}
        body={t('general.appearance.body')}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-body text-neutral-700">{t('general.language.label')}</span>
            <Select<Locale>
              value={prefs.locale}
              onChange={(loc) => void onLocaleChange(loc)}
              options={LANGUAGE_OPTIONS}
              ariaLabel={t('general.language.label')}
              width="200px"
            />
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-body text-neutral-700">{t('general.theme.label')}</span>
            <Segmented
              value={prefs.theme}
              onChange={(th) => {
                void setPreferences({ theme: th });
                applyTheme(resolveTheme(th));
              }}
              options={THEMES.map((th) => ({
                value: th.value,
                label: t(`general.theme.${th.value}`),
                icon: th.icon,
              }))}
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title={t('general.security.title')} body={t('general.security.body')}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-body text-neutral-700">{t('general.autoLock.label')}</div>
              <div className="text-caption text-neutral-500">{t('general.autoLock.helper')}</div>
            </div>
            <Segmented
              value={prefs.autoLockMinutes}
              onChange={(min) => void setPreferences({ autoLockMinutes: min })}
              options={AUTO_LOCK_OPTIONS.map((m) => ({
                value: m,
                label: t(`general.autoLock.options.${m}`),
              }))}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-body text-neutral-700">{t('general.autoLock.lockOnHidden')}</div>
              <div className="text-caption text-neutral-500">{t('general.autoLock.lockOnHiddenHelper')}</div>
            </div>
            <AnimatedToggle
              checked={prefs.lockOnHidden}
              onChange={(next) => void setPreferences({ lockOnHidden: next })}
              ariaLabel={t('general.autoLock.lockOnHidden')}
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title={t('general.about.title')}>
        <dl className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-4 gap-y-2 text-body">
          <dt className="text-neutral-500">{t('general.about.version')}</dt>
          <dd className="text-neutral-900 font-medium">0.0.0</dd>
          <dt className="text-neutral-500">{t('general.about.network')}</dt>
          <dd className="text-neutral-900">XRPL Mainnet · EVM (ETH/BSC/POL)</dd>
        </dl>
      </SettingsCard>
    </div>
  );
}
