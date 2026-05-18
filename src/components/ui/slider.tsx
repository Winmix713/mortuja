import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
export const Slider = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    value?: number[];
    onValueChange?: (value: number[]) => void;
  }>(

  (
  { className, value, onValueChange, min = 0, max = 100, step = 1, ...props },
  ref) =>

  <input
    type="range"
    ref={ref}
    min={min}
    max={max}
    step={step}
    value={value?.[0] ?? 0}
    onChange={(e) => onValueChange?.([parseFloat(e.target.value)])}
    className={cn(
      'w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary',
      className
    )}
    {...props} />


);
Slider.displayName = 'Slider';