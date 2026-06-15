import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Badge, Banner, Button, Card } from '@rc/ui';
import { dropsToXrp, formatCrypto, maskAddress } from '@rc/types';
import { useWalletProfile } from '~/lib/wallet/useWallet';
import { getEvmAddress } from '~/lib/wallet/vault';
import { sendEvmTransaction, sendXrplPayment, submitXrplPayment } from '~/lib/wallet/broadcast';
import { isEvmDraft, useSendDraft, type EvmSendDraft, type XrplSendDraft } from './hooks/useSendDraft';
import { useMockedAccountState, useRecentRecipientsForProfile } from './hooks/useMockedAccountState';
import { LedgerSignModal } from './components/LedgerSignModal';
import { StatusModal, type SendPhase } from './components/StatusModal';
import { signWithLedger, type LedgerError } from '~/lib/wallet/ledger';
import { CHAINS } from '~/lib/chains/registry';
import { formatDecimal } from '~/lib/chains/balances';

type Phase = SendPhase;

export function ReviewPage() {
  const { t } = useTranslation('send');
  const { t: tLedger } = useTranslation('ledger');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const draft = useSendDraft((s) => s.draft);
  const clearDraft = useSendDraft((s) => s.clear);
  const { profile } = useWalletProfile();
  const applySend = useMockedAccountState((s) => s.applySend);
  const recentRecipients = useRecentRecipientsForProfile(profile?.id ?? null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!draft) navigate('/send', { replace: true });
  }, [draft, navigate]);

  if (!draft || !profile) return null;

  if (isEvmDraft(draft)) {
    return (
      <EvmReview
        draft={draft}
        fromAddress={getEvmAddress(profile)}
        phase={phase}
        txHash={txHash}
        errorMsg={errorMsg}
        setPhase={setPhase}
        setTxHash={setTxHash}
        setErrorMsg={setErrorMsg}
        onClose={() => {
          clearDraft();
          navigate('/', { replace: true });
        }}
      />
    );
  }

  const isFirstTime = !recentRecipients.has(draft.recipient);
  const totalDrops = (BigInt(draft.amountDrops) + BigInt(draft.feeDrops)).toString();

  const isLedger = profile.kind === 'ledger_hardware';

  const onConfirm = async () => {
    setPhase('signing');
    setErrorMsg(null);
    try {
      let resultHash: string;
      if (isLedger) {
        // Ledger подписывает у себя — мы получаем готовый tx_blob, его submitим.
        const ledgerSigned = await signWithLedger({
          destination: draft.recipient,
          amountDrops: draft.amountDrops,
          feeDrops: draft.feeDrops,
          destinationTag: draft.destinationTag,
          memoText: draft.memo,
          fromAddress: profile.address,
          derivationPath: profile.derivationPath ?? "44'/144'/0'/0/0",
        });
        setPhase('broadcasting');
        const submitted = await submitXrplPayment(ledgerSigned.txHex);
        if (!submitted.accepted) {
          throw new Error(`${submitted.engineResult} — ${submitted.engineResultMessage}`);
        }
        resultHash = submitted.txHash || ledgerSigned.txHash;
      } else {
        // Reusable seed-wallet path.
        setPhase('broadcasting');
        const submitted = await sendXrplPayment({
          destination: draft.recipient,
          amountDrops: draft.amountDrops,
          feeDrops: draft.feeDrops,
          destinationTag: draft.destinationTag,
          memoText: draft.memo,
        });
        resultHash = submitted.txHash;
      }

      applySend(profile.id, {
        toAddress: draft.recipient,
        amountDrops: draft.amountDrops,
        feeDrops: draft.feeDrops,
        memo: draft.memo,
        destinationTag: draft.destinationTag,
        txHash: resultHash,
      });
      // Refresh on-chain balance + history immediately.
      void queryClient.invalidateQueries({ queryKey: ['xrpl-account'] });
      void queryClient.invalidateQueries({ queryKey: ['xrpl-history'] });
      setTxHash(resultHash);
      setPhase('success');
    } catch (e) {
      const ledgerCode = (e as LedgerError | undefined)?.code;
      if (isLedger && ledgerCode) {
        setErrorMsg(tLedger(`errors.${ledgerCode}`));
      } else {
        setErrorMsg((e as Error).message || t('status.failure.body'));
      }
      setPhase('failure');
    }
  };

  const onCloseSuccess = () => {
    clearDraft();
    navigate('/', { replace: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-h1 text-neutral-900">{t('review.title')}</h1>
      </div>

      {isFirstTime && (
        <Banner
          severity="info"
          title={t('review.firstTime.title')}
          body={t('review.firstTime.body')}
        />
      )}

      <Card>
        <dl className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-4 gap-y-3 text-body">
          <dt className="text-neutral-500">{t('review.summary.from')}</dt>
          <dd className="font-mono text-neutral-900 break-all">{profile.address}</dd>

          <dt className="text-neutral-500">{t('review.summary.to')}</dt>
          <dd className="font-mono text-neutral-900 break-all">
            {draft.recipient}
            {draft.recipientLabel && (
              <span className="ml-2 font-sans text-caption text-neutral-500">
                ({draft.recipientLabel})
              </span>
            )}
          </dd>

          <dt className="text-neutral-500">{t('review.summary.destinationTag')}</dt>
          <dd className="text-neutral-900">
            {draft.destinationTag !== undefined ? (
              <span className="inline-flex items-center gap-2">
                <span className="font-mono">{draft.destinationTag}</span>
                {draft.recipientRequiresMemo && (
                  <Badge variant="warning">{t('form.destinationTag.badge.required')}</Badge>
                )}
              </span>
            ) : (
              <span className="text-neutral-400">—</span>
            )}
          </dd>

          <dt className="text-neutral-500">{t('review.summary.memo')}</dt>
          <dd className="text-neutral-900">
            {draft.memo ? (
              <span className="font-mono break-all">{draft.memo}</span>
            ) : (
              <span className="text-neutral-400">—</span>
            )}
          </dd>

          <dt className="text-neutral-500">{t('review.summary.amount')}</dt>
          <dd className="text-neutral-900 font-medium">
            {formatCrypto(dropsToXrp(draft.amountDrops), 'XRP').value} XRP
          </dd>

          <dt className="text-neutral-500">{t('review.summary.fee')}</dt>
          <dd className="text-neutral-900">
            {formatCrypto(dropsToXrp(draft.feeDrops), 'XRP').value} XRP
          </dd>

          <dt className="text-neutral-500 border-t border-neutral-200 pt-3">
            {t('review.summary.total')}
          </dt>
          <dd className="text-neutral-900 font-medium border-t border-neutral-200 pt-3">
            {formatCrypto(dropsToXrp(totalDrops), 'XRP').value} XRP
          </dd>
        </dl>
      </Card>

      {isLedger && (
        <Banner
          severity="warning"
          title={tLedger('send.disabled.title')}
          body={tLedger('send.disabled.body')}
        />
      )}

      <div className="flex justify-between gap-2">
        <Button variant="ghost" onClick={() => navigate('/send')}>
          {t('cta.back')}
        </Button>
        <Button onClick={onConfirm} disabled={isLedger}>
          {t('cta.confirm')}
        </Button>
      </div>

      {isLedger && phase === 'signing' ? (
        <LedgerSignModal open draft={draft as XrplSendDraft} />
      ) : (
        <StatusModal
          open={phase !== 'idle'}
          phase={phase}
          recipient={maskAddress(draft.recipient, 6, 6)}
          amountLabel={`${formatCrypto(dropsToXrp(draft.amountDrops), 'XRP').value} XRP`}
          txHash={txHash}
          explorerUrl={txHash ? `https://livenet.xrpl.org/transactions/${txHash}` : null}
          errorMsg={errorMsg}
          onClose={onCloseSuccess}
          onRetry={() => setPhase('idle')}
        />
      )}
    </div>
  );
}

interface EvmReviewProps {
  draft: EvmSendDraft;
  fromAddress: `0x${string}` | null;
  phase: Phase;
  txHash: string | null;
  errorMsg: string | null;
  setPhase: (p: Phase) => void;
  setTxHash: (h: string | null) => void;
  setErrorMsg: (m: string | null) => void;
  onClose: () => void;
}

function EvmReview(props: EvmReviewProps) {
  const { t } = useTranslation('send');
  const navigate = useNavigate();
  const { draft, fromAddress, phase, txHash, errorMsg, setPhase, setTxHash, setErrorMsg, onClose } = props;

  const chainMeta = CHAINS[draft.chain];
  const decimals = draft.tokenDecimals ?? chainMeta.native.decimals;
  const symbol = draft.tokenSymbol ?? chainMeta.native.symbol;
  const amountHumanFormatted = formatDecimal(BigInt(draft.amountRaw), decimals);
  const feeHuman = formatDecimal(BigInt(draft.feeWei), chainMeta.native.decimals);

  const onConfirm = async () => {
    setPhase('signing');
    setErrorMsg(null);
    try {
      setPhase('broadcasting');
      // Для ERC-20: value = 0, целевой контракт в `to`, payload — `transfer(recipient, amount)`.
      const targetTo = draft.isNative ? draft.recipient : (draft.tokenAddress as `0x${string}`);
      const result = await sendEvmTransaction({
        chain: draft.chain,
        to: targetTo,
        value: draft.isNative ? BigInt(draft.amountRaw) : 0n,
        data: draft.isNative
          ? undefined
          : buildErc20TransferData(draft.recipient, draft.amountRaw),
        gasLimit: draft.gasOverride?.gasLimit ? BigInt(draft.gasOverride.gasLimit) : undefined,
        maxFeePerGas: draft.gasOverride?.maxFeePerGas
          ? BigInt(draft.gasOverride.maxFeePerGas)
          : undefined,
        maxPriorityFeePerGas: draft.gasOverride?.maxPriorityFeePerGas
          ? BigInt(draft.gasOverride.maxPriorityFeePerGas)
          : undefined,
      });
      setTxHash(result.txHash);
      setPhase('success');
    } catch (e) {
      setErrorMsg((e as Error).message || t('status.failure.body'));
      setPhase('failure');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-h1 text-neutral-900">{t('review.title')}</h1>
        <p className="text-body text-neutral-500">{chainMeta.label}</p>
      </div>

      <Card>
        <dl className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-4 gap-y-3 text-body">
          <dt className="text-neutral-500">{t('review.summary.from')}</dt>
          <dd className="font-mono text-neutral-900 break-all">{fromAddress ?? '—'}</dd>

          <dt className="text-neutral-500">{t('review.summary.to')}</dt>
          <dd className="font-mono text-neutral-900 break-all">{draft.recipient}</dd>

          <dt className="text-neutral-500">{t('review.summary.network')}</dt>
          <dd className="text-neutral-900">{chainMeta.label}</dd>

          <dt className="text-neutral-500">{t('review.summary.amount')}</dt>
          <dd className="text-neutral-900 font-medium">
            {amountHumanFormatted} {symbol}
          </dd>

          <dt className="text-neutral-500">{t('review.summary.fee')}</dt>
          <dd className="text-neutral-900">~ {feeHuman} {chainMeta.native.symbol}</dd>
        </dl>
      </Card>

      <div className="flex justify-between gap-2">
        <Button variant="ghost" onClick={() => navigate('/send')}>
          {t('cta.back')}
        </Button>
        <Button onClick={onConfirm} disabled={phase !== 'idle' && phase !== 'failure'}>
          {t('cta.confirm')}
        </Button>
      </div>

      <StatusModal
        open={phase !== 'idle'}
        phase={phase}
        recipient={maskAddress(draft.recipient, 6, 6)}
        amountLabel={`${amountHumanFormatted} ${symbol}`}
        txHash={txHash}
        explorerUrl={txHash ? evmExplorerUrl(draft.chain, txHash) : null}
        errorMsg={errorMsg}
        onClose={onClose}
        onRetry={() => setPhase('idle')}
      />
    </div>
  );
}

// Минимальный ERC-20 transfer(address,uint256) data builder для review payload.
function buildErc20TransferData(to: `0x${string}`, amountRaw: string): `0x${string}` {
  const selector = 'a9059cbb';
  const toPadded = to.replace(/^0x/u, '').padStart(64, '0');
  const amountHex = BigInt(amountRaw).toString(16).padStart(64, '0');
  return `0x${selector}${toPadded}${amountHex}` as `0x${string}`;
}

function evmExplorerUrl(chain: 'eth' | 'bsc' | 'pol', hash: string): string {
  switch (chain) {
    case 'eth':
      return `https://etherscan.io/tx/${hash}`;
    case 'bsc':
      return `https://bscscan.com/tx/${hash}`;
    case 'pol':
      return `https://polygonscan.com/tx/${hash}`;
  }
}
