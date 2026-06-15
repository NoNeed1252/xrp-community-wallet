import { Button, Card, CardActions, CardHeader, CardTitle, EmptyState, Helper, WalletAvatar } from '@rc/ui';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Inbox } from '@rc/ui';
import { maskAddress } from '@rc/types';
import { useAllAccounts } from '~/lib/wallet/useWallet';
import { CHAINS } from '~/lib/chains/registry';
import type { ChainId, WalletProfile } from '~/lib/wallet/types';

function primaryAddress(p: WalletProfile): string {
  return p.address;
}

function kindBadgeLabel(p: WalletProfile, t: (k: string) => string): string {
  if (p.kind === 'ledger_hardware') return t('widgets.accounts.kinds.ledger');
  if (p.kind === 'multi_chain') return t('widgets.accounts.kinds.multi');
  if (p.kind === 'imported_key') return t('widgets.accounts.kinds.importedKey');
  return t('widgets.accounts.kinds.legacy');
}

function chainsDescription(p: WalletProfile): string {
  if (p.kind !== 'multi_chain' || !p.chains) return CHAINS.xrpl.shortLabel;
  const ids = p.chains.map((c) => CHAINS[c.chain as ChainId].shortLabel);
  return ids.join(' · ');
}

export function AccountsCard() {
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const { profiles, loading } = useAllAccounts();

  return (
    <Card>
      <CardHeader>
        <CardTitle helper={<Helper text={t('widgets.accounts.helper')} />}>
          {t('widgets.accounts.title')}
        </CardTitle>
        <CardActions>
          <Button
            variant="link"
            size="sm"
            rightIcon={<ChevronRight className="h-4 w-4" aria-hidden="true" />}
            onClick={() => navigate('/settings/accounts')}
          >
            {tCommon('actions.viewAll')}
          </Button>
        </CardActions>
      </CardHeader>
      {loading || profiles.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-10 w-10" />}
          title={t('widgets.accounts.empty')}
        />
      ) : (
        <ul className="flex flex-col">
          {profiles.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <WalletAvatar seed={p.id} size={32} />
              <div className="min-w-0 flex-1">
                <div className="text-body-strong text-neutral-900 truncate" title={p.label}>
                  {p.label}
                </div>
                <div className="text-caption text-neutral-500 truncate font-mono">
                  {maskAddress(primaryAddress(p), 6, 6)}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-caption text-neutral-600">{kindBadgeLabel(p, t)}</span>
                <span className="text-caption text-neutral-500">{chainsDescription(p)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
