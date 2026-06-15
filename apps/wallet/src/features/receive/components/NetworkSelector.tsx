import { CoinIcon } from '@rc/ui';
import { useTranslation } from 'react-i18next';
import { NATIVE_BNB, NATIVE_ETH, NATIVE_MATIC, NATIVE_XRP } from '~/lib/chains/registry';
import { ERC20_TOKENS } from '~/lib/chains/tokens';
import { assetIconUrl, nativeIconUrl } from '~/lib/chains/assets/iconUrl';

export type ReceiveNetwork = 'xrp' | 'evm';

interface Props {
  selected: ReceiveNetwork;
  onSelect: (next: ReceiveNetwork) => void;
  /** Если профиль не multi_chain — EVM-опция скрыта. */
  evmEnabled: boolean;
}

const EVM_TOKEN_PREVIEW_IDS = ['eth:usdt', 'eth:usdc', 'eth:dai'] as const;

export function NetworkSelector({ selected, onSelect, evmEnabled }: Props) {
  const { t } = useTranslation('receive');
  const evmTokens = ERC20_TOKENS.filter((t) => EVM_TOKEN_PREVIEW_IDS.includes(t.id as (typeof EVM_TOKEN_PREVIEW_IDS)[number]));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <NetworkCard
        active={selected === 'xrp'}
        onClick={() => onSelect('xrp')}
        title={NATIVE_XRP.symbol}
        subtitle={t('network.xrp.subtitle')}
        leadingIcon={
          <CoinIcon symbol={NATIVE_XRP.symbol} size={32} src={nativeIconUrl('xrpl')} />
        }
      />
      {evmEnabled && (
        <NetworkCard
          active={selected === 'evm'}
          onClick={() => onSelect('evm')}
          title={t('network.evm.title')}
          subtitle={t('network.evm.subtitle')}
          leadingIcon={
            <div className="flex -space-x-2">
              <CoinIcon symbol={NATIVE_ETH.symbol} size={28} src={nativeIconUrl('eth')} />
              <CoinIcon symbol={NATIVE_BNB.symbol} size={28} src={nativeIconUrl('bsc')} />
              <CoinIcon symbol={NATIVE_MATIC.symbol} size={28} src={nativeIconUrl('pol')} />
            </div>
          }
          trailing={
            <div className="flex -space-x-1.5 mt-2 opacity-90">
              {evmTokens.map((tok) => (
                <CoinIcon key={tok.id} symbol={tok.symbol} size={20} src={assetIconUrl(tok)} />
              ))}
              <span className="inline-flex items-center justify-center min-w-[28px] h-5 px-1.5 rounded-full bg-neutral-100 text-caption text-neutral-600 ring-2 ring-surface">
                +{ERC20_TOKENS.length - evmTokens.length}
              </span>
            </div>
          }
        />
      )}
    </div>
  );
}

interface CardProps {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  leadingIcon: React.ReactNode;
  trailing?: React.ReactNode;
}

function NetworkCard({ active, onClick, title, subtitle, leadingIcon, trailing }: CardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        'flex flex-col items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors ' +
        (active
          ? 'border-brand-600 bg-brand-50/40'
          : 'border-neutral-200 bg-surface hover:border-neutral-300')
      }
    >
      <div className="flex items-center gap-3">
        {leadingIcon}
        <div className="flex flex-col">
          <span className="text-body-strong text-neutral-900">{title}</span>
          <span className="text-caption text-neutral-500">{subtitle}</span>
        </div>
      </div>
      {trailing}
    </button>
  );
}
