import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from '../icons.js';
import { Input } from './Input.js';
import { IconButton } from './IconButton.js';

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  invalid?: boolean;
  toggleAriaLabel?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { invalid, toggleAriaLabel = 'Toggle password visibility', ...rest },
  ref,
) {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      ref={ref}
      type={visible ? 'text' : 'password'}
      invalid={invalid}
      rightSlot={
        <IconButton
          aria-label={toggleAriaLabel}
          size="sm"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          className="text-neutral-500"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </IconButton>
      }
      {...rest}
    />
  );
});
