import { useQuery } from '@tanstack/react-query';
import { GithubLogo, Globe, Star, XLogo } from '@rc/ui';

/** Public links. Github URL также определяет источник для счётчика звёзд. */
const TWITTER_URL = 'https://twitter.com/Ripple';
const WEBSITE_URL = 'https://ripple.com';
const GITHUB_REPO = 'XRPLF/xrpl.js';
const GITHUB_URL = `https://github.com/${GITHUB_REPO}`;

interface RepoInfo {
  stargazers_count: number;
}

function compactCount(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

function useGithubStars() {
  return useQuery({
    queryKey: ['github-stars', GITHUB_REPO],
    queryFn: async (): Promise<number> => {
      const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (!res.ok) throw new Error(`github: HTTP ${res.status}`);
      const data = (await res.json()) as RepoInfo;
      return data.stargazers_count ?? 0;
    },
    staleTime: 60 * 60 * 1000, // 1 час
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

interface SocialIconProps {
  href: string;
  label: string;
  children: React.ReactNode;
}

function SocialIcon({ href, label, children }: SocialIconProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-neutral-600 hover:text-brand-600 hover:bg-nested transition-colors"
    >
      {children}
    </a>
  );
}

/** Десктоп: иконки социальных ссылок в TopBar. */
export function HeaderSocial() {
  const stars = useGithubStars();
  return (
    <div className="hidden sm:inline-flex items-center gap-1">
      <SocialIcon href={WEBSITE_URL} label="Website">
        <Globe className="h-5 w-5" aria-hidden="true" />
      </SocialIcon>
      <SocialIcon href={TWITTER_URL} label="Twitter / X">
        <XLogo className="h-5 w-5" aria-hidden="true" />
      </SocialIcon>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noreferrer noopener"
        aria-label="GitHub"
        className="inline-flex items-center gap-1 h-9 px-2 rounded-md text-neutral-600 hover:text-brand-600 hover:bg-nested transition-colors"
      >
        <GithubLogo className="h-5 w-5" aria-hidden="true" />
        {stars.data !== undefined && (
          <span className="inline-flex items-center gap-0.5 text-caption tabular-nums">
            <Star className="h-3.5 w-3.5" weight="fill" aria-hidden="true" />
            <span>{compactCount(stars.data)}</span>
          </span>
        )}
      </a>
    </div>
  );
}

/** Мобильное More-меню: список ссылок (полная ширина, label + icon). */
export function MobileSocialLinks() {
  const stars = useGithubStars();
  return (
    <div className="border-t border-neutral-200 mt-1 pt-1">
      <SocialItem href={WEBSITE_URL} icon={<Globe className="h-5 w-5" aria-hidden="true" />} label="ripple.com" />
      <SocialItem href={TWITTER_URL} icon={<XLogo className="h-5 w-5" aria-hidden="true" />} label="Twitter / X" />
      <SocialItem
        href={GITHUB_URL}
        icon={<GithubLogo className="h-5 w-5" aria-hidden="true" />}
        label="GitHub"
        trailing={
          stars.data !== undefined ? (
            <span className="inline-flex items-center gap-0.5 text-caption text-neutral-500 tabular-nums">
              <Star className="h-3.5 w-3.5" weight="fill" aria-hidden="true" />
              <span>{compactCount(stars.data)}</span>
            </span>
          ) : null
        }
      />
    </div>
  );
}

function SocialItem({
  href,
  icon,
  label,
  trailing,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  trailing?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="flex items-center gap-3 px-4 py-3 text-left text-body text-neutral-700 hover:bg-nested"
    >
      {icon}
      <span className="flex-1">{label}</span>
      {trailing}
    </a>
  );
}
