import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Plus, Trash2 } from '@rc/ui';
import { Banner, Button, Card, CoinIcon, Field, Input, toast } from '@rc/ui';
import { maskAddress } from '@rc/types';
import { useWalletProfile } from '~/lib/wallet/useWallet';
import { CHAINS, EVM_CHAINS } from '~/lib/chains/registry';
import { addCustomToken, removeCustomToken } from '~/lib/chains/customTokensStore';
import { useCustomTokens } from '~/lib/chains/useCustomTokens';
import { fetchErc20Metadata, TokenMetadataError, type FetchedTokenMetadata } from '~/lib/chains/tokenMetadata';
import { tokenIconUrl } from '~/lib/chains/assets/iconUrl';
import type { EvmChainId } from '~/lib/chains/types';

export function TokensSettings() {
  const { t } = useTranslation('settings');
  const { profile } = useWalletProfile();
  const { tokens, loading } = useCustomTokens();

  if (profile && profile.kind !== 'multi_chain') {
    return (
      <Card>
        <p className="text-body text-neutral-700">{t('tokens.notMultiChain')}</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <AddTokenCard />
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-h3 text-neutral-900">{t('tokens.list.title')}</h2>
          <span className="text-caption text-neutral-500">{tokens.length}</span>
        </div>
        {loading ? (
          <p className="text-body text-neutral-500">{t('tokens.list.loading')}</p>
        ) : tokens.length === 0 ? (
          <p className="text-body text-neutral-500">{t('tokens.list.empty')}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-neutral-200">
            {tokens.map((tok) => (
              <li key={tok.id} className="py-3 flex items-center gap-3">
                <CoinIcon
                  symbol={tok.symbol}
                  size={28}
                  src={tokenIconUrl(tok.chain, tok.address)}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-body-strong text-neutral-900 truncate">
                    {tok.symbol} <span className="text-neutral-500">· {tok.name}</span>
                  </div>
                  <div className="text-caption text-neutral-500 flex items-center gap-2 flex-wrap">
                    <span>{CHAINS[tok.chain].shortLabel}</span>
                    <span className="text-neutral-300">·</span>
                    <span className="font-mono">{maskAddress(tok.address, 6, 6)}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  onClick={async () => {
                    await removeCustomToken(tok.id);
                    toast.success(t('tokens.removed'));
                  }}
                >
                  {t('actions.delete')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function AddTokenCard() {
  const { t } = useTranslation('settings');
  const [chain, setChain] = useState<EvmChainId>('eth');
  const [address, setAddress] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [preview, setPreview] = useState<FetchedTokenMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onPreview = async () => {
    setError(null);
    setPreview(null);
    setPreviewing(true);
    try {
      const meta = await fetchErc20Metadata(chain, address.trim());
      setPreview(meta);
    } catch (e) {
      if (e instanceof TokenMetadataError) {
        setError(t(`tokens.errors.${e.code}`));
      } else {
        setError((e as Error).message);
      }
    } finally {
      setPreviewing(false);
    }
  };

  const onAdd = async () => {
    if (!preview) return;
    setAdding(true);
    try {
      await addCustomToken({
        chain,
        address: preview.address,
        symbol: preview.symbol,
        name: preview.name,
        decimals: preview.decimals,
      });
      toast.success(t('tokens.added'));
      setAddress('');
      setPreview(null);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes('already added')) {
        setError(t('tokens.errors.duplicate'));
      } else {
        setError(msg);
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-h3 text-neutral-900">{t('tokens.add.title')}</h2>
          <p className="text-caption text-neutral-500 mt-1">{t('tokens.add.body')}</p>
        </div>

        <Banner
          severity="warning"
          title={t('tokens.scamWarning.title')}
          body={t('tokens.scamWarning.body')}
        />

        <Field label={t('tokens.add.chainLabel')}>
          {() => (
            <div className="flex flex-wrap gap-2">
              {EVM_CHAINS.map((id) => {
                const active = chain === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setChain(id);
                      setPreview(null);
                      setError(null);
                    }}
                    className={
                      'inline-flex items-center gap-2 h-9 px-3 rounded-full text-body font-medium ring-1 transition-colors ' +
                      (active
                        ? 'bg-brand-600 text-neutral-0 ring-brand-600'
                        : 'bg-surface text-neutral-700 ring-neutral-200 hover:bg-nested')
                    }
                  >
                    {CHAINS[id].label}
                  </button>
                );
              })}
            </div>
          )}
        </Field>

        <Field
          label={t('tokens.add.addressLabel')}
          helper={t('tokens.add.addressHelper')}
          error={error ?? undefined}
        >
          {(id) => (
            <Input
              id={id}
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setPreview(null);
                setError(null);
              }}
              placeholder="0x..."
              spellCheck={false}
              autoComplete="off"
              invalid={Boolean(error)}
            />
          )}
        </Field>

        {preview && (
          <div className="rounded-xl border border-neutral-200 bg-nested p-4 flex items-center gap-4">
            <CoinIcon
              symbol={preview.symbol}
              size={32}
              src={tokenIconUrl(chain, preview.address)}
            />
            <div className="flex-1 min-w-0">
              <div className="text-body-strong text-neutral-900 truncate">
                {preview.symbol} <span className="text-neutral-500">· {preview.name}</span>
              </div>
              <div className="text-caption text-neutral-500 flex items-center gap-2 flex-wrap">
                <span>{CHAINS[chain].shortLabel}</span>
                <span className="text-neutral-300">·</span>
                <span>{t('tokens.add.decimals', { decimals: preview.decimals })}</span>
              </div>
              <div className="text-caption text-neutral-400 font-mono mt-1 truncate" title={preview.address}>
                {preview.address}
              </div>
            </div>
            <div className="inline-flex items-center gap-1 text-caption text-warning-700 shrink-0">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <span>{t('tokens.add.verifyHint')}</span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          {!preview && (
            <Button
              type="button"
              onClick={onPreview}
              disabled={!address.trim() || previewing}
              loading={previewing}
            >
              {t('tokens.add.previewCta')}
            </Button>
          )}
          {preview && (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setPreview(null);
                  setError(null);
                }}
                disabled={adding}
              >
                {t('actions.cancel')}
              </Button>
              <Button
                type="button"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={onAdd}
                disabled={adding}
                loading={adding}
              >
                {t('tokens.add.confirmCta')}
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
