import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Banner, Button, Card, Field, Input, useMediaQuery } from '@rc/ui';
import { useSendDraft, type EvmSendDraft } from './hooks/useSendDraft';
import { useEvmAssetBalance } from './hooks/useEvmAssetBalance';
import { evmSendFormSchema, type EvmSendFormValues } from './lib/formSchema';
import { type Asset, isEvm } from '~/lib/chains/registry';
import { formatDecimal } from '~/lib/chains/balances';
import { isValidEvmAddress } from './lib/evmAddress';

interface EvmSendFormProps {
  asset: Asset;
  fromAddress: `0x${string}` | null;
  /** Если активный профиль — Ledger, отключаем (ADR-061). */
  ledgerDisabled?: boolean;
}

function parseHumanAmount(input: string, decimals: number): string | null {
  const normalized = input.replace(',', '.').trim();
  if (!/^\d+(\.\d+)?$/u.test(normalized)) return null;
  const [whole, fracRaw = ''] = normalized.split('.');
  if (fracRaw.length > decimals) return null;
  const frac = fracRaw.padEnd(decimals, '0');
  const value = BigInt(`${whole}${frac}`);
  return value.toString();
}

/**
 * Конвертирует строковое значение в gwei (`30`, `30.5`) в wei через BigInt,
 * без потерь точности на больших/дробных значениях (security audit M7).
 */
function gweiToWei(input: string): string | null {
  const normalized = input.replace(',', '.').trim();
  if (normalized === '') return null;
  if (!/^\d+(\.\d+)?$/u.test(normalized)) return null;
  const [whole, fracRaw = ''] = normalized.split('.');
  if (fracRaw.length > 9) return null;
  const frac = fracRaw.padEnd(9, '0');
  return BigInt(`${whole}${frac}`).toString();
}

export function EvmSendForm({ asset, fromAddress, ledgerDisabled }: EvmSendFormProps) {
  const { t } = useTranslation('send');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const setDraft = useSendDraft((s) => s.set);
  const isCompact = useMediaQuery('(max-width: 767px)');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    setError,
  } = useForm<EvmSendFormValues>({
    resolver: zodResolver(evmSendFormSchema),
    defaultValues: { recipient: '', amountInput: '' },
    mode: 'onBlur',
  });

  const recipient = watch('recipient') as `0x${string}` | '';
  const amountInput = watch('amountInput');
  const [checksumError, setChecksumError] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [gasLimit, setGasLimit] = useState('');
  const [maxFeeGwei, setMaxFeeGwei] = useState('');
  const [priorityGwei, setPriorityGwei] = useState('');

  const decimals = asset.decimals;
  const amountRaw = useMemo(
    () => (amountInput ? parseHumanAmount(amountInput, decimals) : null),
    [amountInput, decimals],
  );

  const balance = useEvmAssetBalance(asset, fromAddress);
  const balanceHuman = balance.amountRaw !== null ? formatDecimal(balance.amountRaw, decimals) : null;

  if (!isEvm(asset.chain)) return null;

  // Mock fee — фиксированная оценка (реальный gas estimate — в integration phase).
  const feeWei = '210000000000000'; // 0.00021 ETH equivalent
  const isSelfSend = Boolean(fromAddress && recipient.toLowerCase() === fromAddress.toLowerCase());

  const exceedsBalance = balance.amountRaw !== null && amountRaw !== null && BigInt(amountRaw) > balance.amountRaw;

  const canSubmit =
    !!recipient &&
    !!amountRaw &&
    amountRaw !== '0' &&
    !exceedsBalance &&
    !errors.recipient &&
    !errors.amountInput &&
    !isSelfSend &&
    !ledgerDisabled;

  const onMax = () => {
    if (balance.amountRaw === null) return;
    // Для ERC-20 газ платится в native — Max = full token balance.
    // Для native — оставляем консервативный gas reserve, чтобы tx ушёл.
    let max = balance.amountRaw;
    if (asset.kind === 'native') {
      const reserve = gasReserveWei(asset.chain as 'eth' | 'bsc' | 'pol');
      max = balance.amountRaw > reserve ? balance.amountRaw - reserve : 0n;
    }
    setValue('amountInput', formatDecimal(max, decimals), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  // Грубая оценка стоимости простого native-transfer.
  function gasReserveWei(chain: 'eth' | 'bsc' | 'pol'): bigint {
    if (chain === 'eth') return 1_000_000_000_000_000n; // 0.001 ETH
    if (chain === 'pol') return 2_000_000_000_000_000n; // 0.002 MATIC
    return 300_000_000_000_000n; // 0.0003 BNB
  }

  const onSubmit = handleSubmit(async () => {
    if (!amountRaw || !canSubmit) return;
    // Финальная EIP-55 проверка для mixed-case адресов (Fix-1 W10 security review).
    const ok = await isValidEvmAddress(recipient);
    if (!ok) {
      setChecksumError(true);
      setError('recipient', { type: 'manual', message: 'checksum' });
      return;
    }
    setChecksumError(false);
    const evmChain = asset.chain as 'eth' | 'bsc' | 'pol';
    const gasOverride =
      gasLimit || maxFeeGwei || priorityGwei
        ? {
            gasLimit: gasLimit ? gasLimit.trim() : undefined,
            maxFeePerGas: maxFeeGwei ? gweiToWei(maxFeeGwei) ?? undefined : undefined,
            maxPriorityFeePerGas: priorityGwei
              ? gweiToWei(priorityGwei) ?? undefined
              : undefined,
          }
        : undefined;
    const draft: EvmSendDraft = {
      assetId: asset.id,
      chain: evmChain,
      isNative: asset.kind === 'native',
      tokenAddress: asset.kind === 'token' ? asset.address : undefined,
      tokenDecimals: asset.kind === 'token' ? asset.decimals : undefined,
      tokenSymbol: asset.kind === 'token' ? asset.symbol : undefined,
      recipient,
      amountRaw,
      amountHuman: amountInput,
      feeWei,
      gasOverride,
    };
    setDraft(draft);
    navigate('/send/review');
  });

  return (
    <>
      {ledgerDisabled && (
        <Banner
          severity="info"
          title={t('warnings.ledgerEvm.title')}
          body={t('warnings.ledgerEvm.body')}
        />
      )}
      <Card>
        <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
          <Field
            label={t('form.recipient.label')}
            helper={t('form.recipient.helperEvm')}
            error={
              errors.recipient?.message === 'invalid'
                ? t('form.recipient.error.invalidEvm')
                : errors.recipient?.message === 'required'
                ? t('form.recipient.error.required')
                : errors.recipient?.message === 'checksum' || checksumError
                ? t('form.recipient.error.checksum')
                : isSelfSend
                ? t('form.recipient.error.selfSend')
                : undefined
            }
          >
            {(id) => (
              <Input
                id={id}
                {...register('recipient')}
                placeholder="0x..."
                spellCheck={false}
                autoComplete="off"
                invalid={Boolean(errors.recipient) || isSelfSend}
              />
            )}
          </Field>

          <Field
            label={t('form.amount.label')}
            helper={
              balance.loading
                ? t('form.amount.balanceLoading', { symbol: asset.symbol })
                : balance.error
                ? t('form.amount.balanceError', { symbol: asset.symbol })
                : balanceHuman !== null
                ? t('form.amount.balanceGeneric', { amount: balanceHuman, symbol: asset.symbol })
                : t('form.amount.balanceUnknown', { symbol: asset.symbol })
            }
            error={
              exceedsBalance
                ? t('form.amount.error.exceedsBalanceGeneric')
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
                invalid={Boolean(errors.amountInput) || exceedsBalance}
                rightSlot={
                  balance.amountRaw !== null && balance.amountRaw > 0n ? (
                    <Button type="button" variant="ghost" size="sm" onClick={onMax}>
                      {t('form.amount.max')}
                    </Button>
                  ) : undefined
                }
              />
            )}
          </Field>

          <div className="flex items-center justify-between text-body">
            <span className="text-neutral-500">{t('form.fee.estimated')}</span>
            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="text-caption text-brand-600 hover:underline"
            >
              {advancedOpen ? t('form.gas.hide') : t('form.gas.customize')}
            </button>
          </div>

          {advancedOpen && (
            <div className="rounded-lg bg-nested p-3 flex flex-col gap-3">
              <p className="text-caption text-neutral-500">{t('form.gas.helper')}</p>
              <Field label={t('form.gas.gasLimit')}>
                {(id) => (
                  <Input
                    id={id}
                    value={gasLimit}
                    onChange={(e) => setGasLimit(e.target.value.replace(/[^\d]/gu, ''))}
                    placeholder={t('form.gas.gasLimitPlaceholder')}
                    inputMode="numeric"
                    autoComplete="off"
                  />
                )}
              </Field>
              <Field label={t('form.gas.maxFee')}>
                {(id) => (
                  <Input
                    id={id}
                    value={maxFeeGwei}
                    onChange={(e) => setMaxFeeGwei(e.target.value.replace(/[^\d.]/gu, ''))}
                    placeholder="30"
                    inputMode="decimal"
                    autoComplete="off"
                  />
                )}
              </Field>
              <Field label={t('form.gas.priority')}>
                {(id) => (
                  <Input
                    id={id}
                    value={priorityGwei}
                    onChange={(e) => setPriorityGwei(e.target.value.replace(/[^\d.]/gu, ''))}
                    placeholder="1.5"
                    inputMode="decimal"
                    autoComplete="off"
                  />
                )}
              </Field>
            </div>
          )}

          <div className={isCompact ? 'flex flex-col gap-2' : 'flex justify-end gap-2'}>
            <Button type="submit" disabled={!canSubmit}>
              {t('cta.review')}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
