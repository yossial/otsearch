'use client';

import * as Select from '@radix-ui/react-select';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';

interface FormSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  dir?: 'ltr' | 'rtl';
}

export default function FormSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  className,
  dir,
}: FormSelectProps) {
  const locale = useLocale();
  const resolvedDir: 'ltr' | 'rtl' = dir ?? (locale === 'he' || locale === 'ar' ? 'rtl' : 'ltr');

  return (
    <Select.Root value={value} onValueChange={onChange} disabled={disabled} dir={resolvedDir}>
      <Select.Trigger
        className={cn(
          'flex w-full items-center justify-between gap-2',
          'bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-3.5 py-2.5 text-sm',
          'text-start text-[color:var(--color-text-primary)]',
          'transition-all outline-none',
          'focus:bg-white focus:border-[color:var(--color-primary)]',
          'focus:shadow-[0_1px_2px_0_rgba(0,0,0,0.05),_0_0_0_3px_rgba(27,15,147,0.12)]',
          'data-[state=open]:bg-white data-[state=open]:border-[color:var(--color-primary)]',
          'data-[state=open]:shadow-[0_1px_2px_0_rgba(0,0,0,0.05),_0_0_0_3px_rgba(27,15,147,0.12)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        )}
      >
        <Select.Value placeholder={placeholder ?? ''} />
        <Select.Icon asChild>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="shrink-0 text-[#9CA3AF]"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={4}
          dir={resolvedDir}
          className="z-50 w-[var(--radix-select-trigger-width)] rounded-xl border border-[#E5E7EB] bg-white p-1 shadow-lg max-h-64 overflow-y-auto"
        >
          <Select.Viewport>
            {options.map((opt) => (
              <Select.Item
                key={opt.value}
                value={opt.value}
                className={cn(
                  'flex items-center justify-between gap-2',
                  'px-3 py-2 text-sm rounded-lg cursor-pointer outline-none',
                  'text-[color:var(--color-text-primary)]',
                  'hover:bg-[#F3F4F6]',
                  'data-[highlighted]:bg-[#F3F4F6]',
                  'data-[state=checked]:text-[color:var(--color-primary)] data-[state=checked]:font-normal',
                )}
              >
                <Select.ItemText>{opt.label}</Select.ItemText>
                <Select.ItemIndicator>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
