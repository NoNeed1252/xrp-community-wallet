import { Button, toast, useCopyToClipboard } from '@rc/ui';
import { Copy, Share2 } from '@rc/ui';
import { useTranslation } from 'react-i18next';

interface AddressBlockProps {
  address: string;
}

function canShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export function AddressBlock({ address }: AddressBlockProps) {
  const { t } = useTranslation('receive');
  const { copy } = useCopyToClipboard();
  const showShare = canShare();

  const onCopy = async () => {
    const ok = await copy(address);
    if (ok) toast.success(t('address.copied'));
  };

  const onShare = async () => {
    if (!canShare()) return;
    try {
      await navigator.share({ text: address });
    } catch {
      // user dismissed — silent
    }
  };

  return (
    <div className="flex flex-col gap-3 min-w-0">
      <span className="text-caption text-neutral-500">{t('address.label')}</span>
      <div className="font-mono text-body text-neutral-900 break-all" title={address}>
        {address}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" leftIcon={<Copy className="h-4 w-4" />} onClick={onCopy}>
          {t('address.copy')}
        </Button>
        {showShare && (
          <Button variant="ghost" size="sm" leftIcon={<Share2 className="h-4 w-4" />} onClick={onShare}>
            {t('address.share')}
          </Button>
        )}
      </div>
    </div>
  );
}
