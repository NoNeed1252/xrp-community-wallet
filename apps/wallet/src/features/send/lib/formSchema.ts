import { z } from 'zod';

const XRPL_ADDRESS = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/u;
const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/u;

export const sendFormSchema = z.object({
  recipient: z
    .string()
    .min(1, 'required')
    .regex(XRPL_ADDRESS, 'invalid'),
  amountInput: z
    .string()
    .min(1, 'required')
    .regex(/^\d+([.,]\d{0,6})?$/u, 'invalid'),
  // Destination tag — numeric, uint32. Поле раньше называлось `memo` и
  // одновременно играло роль свободного memo, что добавляло мусор в Memos[]
  // (security audit M6).
  destinationTag: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v.trim() : undefined))
    .refine(
      (v) => {
        if (v === undefined) return true;
        const n = Number(v);
        return Number.isInteger(n) && n >= 0 && n <= 4_294_967_295;
      },
      { message: 'destination_tag_range' },
    ),
  // Свободный текстовый memo (UTF-8, до 100 байт после кодирования).
  memoText: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v.trim() : undefined))
    .refine(
      (v) => v === undefined || new TextEncoder().encode(v).byteLength <= 100,
      { message: 'memo_text_too_long' },
    ),
});

export type SendFormValues = z.infer<typeof sendFormSchema>;

export const evmSendFormSchema = z.object({
  recipient: z
    .string()
    .min(1, 'required')
    .regex(EVM_ADDRESS, 'invalid'),
  amountInput: z
    .string()
    .min(1, 'required')
    .regex(/^\d+([.,]\d{0,18})?$/u, 'invalid'),
});

export type EvmSendFormValues = z.infer<typeof evmSendFormSchema>;
