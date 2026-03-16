'use client';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cn } from '@/lib/utils';

interface RadioGroupProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}

export default function RadioGroup({ value, onChange, options, className }: RadioGroupProps) {
  return (
    <RadioGroupPrimitive.Root
      value={value}
      onValueChange={onChange}
      className={cn('flex flex-wrap gap-2', className)}
    >
      {options.map((opt) => (
        <RadioGroupPrimitive.Item
          key={opt.value}
          value={opt.value}
          className={cn(
            'px-4 py-2 text-sm rounded-full border cursor-pointer transition-all outline-none',
            'focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-1',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            value === opt.value
              ? 'border-[color:var(--color-primary)] bg-[color:var(--color-primary)] text-white'
              : 'border-[#D1D5DB] bg-[#F9FAFB] text-[color:var(--color-text-secondary)] hover:border-[#9CA3AF] hover:text-[color:var(--color-text-primary)]',
          )}
        >
          {opt.label}
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
}
