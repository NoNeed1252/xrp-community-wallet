import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge, Banner, Button, Card, Field, Input, useMediaQuery } from '@rc/ui';
import { ActivationPill } from '~/features/_shared/ActivationPill';
import { dropsToXrp, formatCrypto, maskAddress, parseXrpInput } from '@rc/types';
import { useWalletProfile } from '~/lib/wallet/useWallet';
import { getEvmAddress } from '~/lib/wallet/vault';
import { AssetSelector } from '~/features/_shared/AssetSelector';
import { NATIVE_XRP, isEvm, type Asset } from '~/lib/chains/registry';
import { useAllAssets } from '~/lib/chains/useAllAssets';
import { useAssetBalances } from './hooks/useAssetBalances';
import { useAccountFlags } from './hooks/useAccountFlags';
import { useEffectiveXrpBalance } from './hooks/useEffectiveXrpBalance';
import { useSendDraft, type XrplSendDraft } from './hooks/useSendDraft';
import { sendFormSchema, type SendFormValues } from './lib/formSchema';
import { EvmSendForm } from './EvmSendForm';

const FEE_DROPS = '12';
const RESERVE_DROPS = '1000000';

export function SendPage() {
  const { t } = useTranslation('send');
  const { profile } = useWalletProfile();
  const allAssets = useAllAssets();

  const baseAssets = useMemo<readonly Asset[]>(() => {
    if (!profile) return [NATIVE_XRP];
    if (profile.kind === 'multi_chain') return allAssets;
    return [NATIVE_XRP];
  }, [profile, allAssets]);

  // Балансы и сортировка по убыванию USD-стоимости (или баланса при отсутствии цены).
  const { balances, sortedAssets } = useAssetBalances(baseAssets);

  const [asset, setAsset] = useState<Asset>(NATIVE_XRP);
  const isLedger = profile?.kind === 'ledger_hardware';
  const evmDisabledByLedger = isLedger && isEvm(asset.chain);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-h1 text-neutral-900">{t('title')}</h1>
        <p className="text-body text-neutral-500">{t('subtitle')}</p>
      </div>

      <div className="space-y-2">
        <span className="text-caption text-neutral-500 uppercase tracking-wide">
          {t('form.asset.label')}
        </span>
        <AssetSelector
          assets={sortedAssets}
          selected={asset}
          onSelect={setAsset}
          balances={balances}
          ariaLabel={t('form.asset.label')}
        />
      </div>

      {asset.chain === 'xrpl' ? (
        <XrplSendForm />
      ) : (
        <EvmSendForm
          asset={asset}
          fromAddress={profile ? getEvmAddress(profile) : null}
          ledgerDisabled={evmDisabledByLedger}
        />
      )}
    </div>
  );
}

function XrplSendForm() {
  const { t } = useTranslation('send');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useWalletProfile();
  const { balanceDrops, activated: liveActivated, ownerReserveDrops } = useEffectiveXrpBalance();
  const setDraft = useSendDraft((s) => s.set);
  const isCompact = useMediaQuery('(max-width: 767px)');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SendFormValues>({
    resolver: zodResolver(sendFormSchema),
    defaultValues: {
      recipient: searchParams.get('to') ?? '',
      amountInput: searchParams.get('amount') ?? '',
      // URL backwards-compat: `?memo=` исторически означало destination tag.
      destinationTag: searchParams.get('memo') ?? searchParams.get('tag') ?? '',
      memoText: searchParams.get('memoText') ?? '',
    },
    mode: 'onBlur',
  });

  const recipient = watch('recipient');
  const amountInput = watch('amountInput');
  const destinationTagInput = watch('destinationTag');
  const memoText = watch('memoText');

  const flags = useAccountFlags(recipient || null);
  const amountDrops = useMemo(() => parseXrpInput(amountInput || ''), [amountInput]);

  const ownAddress = profile?.address ?? null;
  const isSelfSend = Boolean(ownAddress && recipient === ownAddress);
  const destTagRequired = flags.requireDestTag;
  const destTagMissing = destTagRequired && !destinationTagInput;
  const isActivated = liveActivated;

  const totalDrops = amountDrops ? (BigInt(amountDrops) + BigInt(FEE_DROPS)).toString() : null;
  // Available = balance − base reserve (1 XRP) − owner reserve (200k drops × ownerCount) − fee.
  // Это то, что реально можно списать без нарушения XRPL-резерва.
  const reserveTotal = BigInt(RESERVE_DROPS) + BigInt(ownerReserveDrops || '0') + BigInt(FEE_DROPS);
  const balanceBig = BigInt(balanceDrops);
  const availableBig = balanceBig > reserveTotal ? balanceBig - reserveTotal : 0n;
  const availableDrops = availableBig.toString();
  const exceedsBalance =
    amountDrops !== null && BigInt(amountDrops) > availableBig;
  const isZeroAmount = amountDrops !== null && BigInt(amountDrops) === 0n;

  const canSubmit =
    !!recipient &&
    !!amountDrops &&
    !destTagMissing &&
    !exceedsBalance &&
    !isZeroAmount &&
    !flags.loading &&
    !errors.recipient &&
    !errors.amountInput &&
    !errors.destinationTag &&
    !errors.memoText;

  const onMax = () => {
    setValue('amountInput', dropsToXrp(availableDrops), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const onSubmit = handleSubmit(() => {
    if (!amountDrops || !canSubmit) return;
    const draft: XrplSendDraft = {
      assetId: 'xrpl:xrp',
      chain: 'xrpl',
      recipient,
      amountDrops,
      feeDrops: FEE_DROPS,
      memo: memoText || undefined,
      destinationTag: destinationTagInput ? Number(destinationTagInput) : undefined,
      recipientLabel: flags.knownLabel,
      recipientRequiresMemo: flags.requireDestTag,
    };
    setDraft(draft);
    navigate('/send/review');
  });

  return (
    <>
      {!isActivated && (
        <div>
          <ActivationPill />
        </div>
      )}

      <Card>
        <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
          <Field
            label={t('form.recipient.label')}
            helper={
              flags.knownLabel ? t('form.recipient.helperKnown', { label: flags.knownLabel }) : t('form.recipient.helper')
            }
            error={
              errors.recipient?.message === 'invalid'
                ? t('form.recipient.error.invalid')
                : errors.recipient?.message === 'required'
                ? t('form.recipient.error.required')
                : isSelfSend
                ? t('form.recipient.error.selfSend')
                : undefined
            }
          >
            {(id) => (
              <Input
                id={id}
                {...register('recipient')}
                placeholder="rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH"
                spellCheck={false}
                autoComplete="off"
                invalid={Boolean(errors.recipient) || isSelfSend}
              />
            )}
          </Field>

          <Field
            label={t('form.amount.label')}
            helper={t('form.amount.balanceWithReserve', {
              amount: dropsToXrp(availableDrops),
              reserve: dropsToXrp((BigInt(RESERVE_DROPS) + BigInt(ownerReserveDrops || '0')).toString()),
            })}
            error={
              exceedsBalance
                ? t('form.amount.error.exceedsBalance')
                : isZeroAmount
                ? t('form.amount.error.zero')
                : errors.amountInput
                ? t('form.amount.error.invalid')
                : undefined
            }
          >
            {(id) => (
              <Input
                id={id}
                {...register('amountInput')}
                inputMode="decimal"
                placeholder="0.000000"
                autoComplete="off"
                invalid={Boolean(errors.amountInput) || exceedsBalance || isZeroAmount}
                rightSlot={
                  <Button type="button" variant="ghost" size="sm" onClick={onMax}>
                    {t('form.amount.max')}
                  </Button>
                }
              />
            )}
          </Field>

          {flags.error && recipient && !errors.recipient && (
            <Banner
              severity="warning"
              title={t('form.recipient.flagsUnverified.title')}
              body={t('form.recipient.flagsUnverified.body')}
            />
          )}

          <Field
            label={
              <span className="inline-flex items-center gap-2">
                {t('form.destinationTag.label')}
                <Badge variant={destTagRequired ? 'warning' : 'neutral'}>
                  {destTagRequired
                    ? t('form.destinationTag.badge.required')
                    : t('form.destinationTag.badge.optional')}
                </Badge>
              </span>
            }
            helper={t('form.destinationTag.helper')}
            error={
              destTagMissing
                ? t('form.destinationTag.error.requiredByRecipient')
                : errors.destinationTag?.message === 'destination_tag_range'
                ? t('form.destinationTag.error.range')
                : undefined
            }
          >
            {(id) => (
              <Input
                id={id}
                {...register('destinationTag')}
                inputMode="numeric"
                placeholder="e.g. 1234567"
                autoComplete="off"
                invalid={destTagMissing || Boolean(errors.destinationTag)}
              />
            )}
          </Field>

          <Field
            label={t('form.memoText.label')}
            helper={t('form.memoText.helper')}
            error={
              errors.memoText?.message === 'memo_text_too_long'
                ? t('form.memoText.error.tooLong')
                : undefined
            }
          >
            {(id) => (
              <Input
                id={id}
                {...register('memoText')}
                placeholder={t('form.memoText.placeholder')}
                autoComplete="off"
                invalid={Boolean(errors.memoText)}
              />
            )}
          </Field>

          <div className="flex items-center justify-between text-body">
            <span className="text-neutral-500">{t('form.fee.label')}</span>
            <span className="text-neutral-900 font-medium">
              {formatCrypto(dropsToXrp(FEE_DROPS), 'XRP').value} XRP
            </span>
          </div>

          {totalDrops && !exceedsBalance && (
            <div className="flex items-center justify-between text-body bg-nested rounded-lg px-4 py-3">
              <span className="text-neutral-500">{t('form.total')}</span>
              <span className="text-neutral-900 font-medium">
                {formatCrypto(dropsToXrp(totalDrops), 'XRP').value} XRP
              </span>
            </div>
          )}

          <div className={isCompact ? 'flex flex-col gap-2' : 'flex justify-end gap-2'}>
            <Button type="submit" disabled={!canSubmit}>
              {t('cta.review')}
            </Button>
          </div>
        </form>
      </Card>

      {recipient && flags.knownLabel && (
        <p className="text-caption text-neutral-500">
          {t('form.recipient.detectedLabel', { label: flags.knownLabel, address: maskAddress(recipient, 6, 6) })}
        </p>
      )}
    </>
  );
}
