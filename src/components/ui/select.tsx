import React, { forwardRef, Children, cloneElement } from 'react';
import { cn } from '../../lib/utils';
export const Select = ({
  value,
  onValueChange,
  children




}: {value?: string;onValueChange?: (v: string) => void;children: React.ReactNode;}) => {
  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
        
        {Children.toArray(children).map((child: any) => {
          if (child?.type === SelectContent) {
            return Children.toArray(child.props.children).map((item: any) =>
            <option key={item.props.value} value={item.props.value}>
                {item.props.children}
              </option>
            );
          }
          return null;
        })}
      </select>
      {Children.toArray(children).map((child: any) => {
        if (child?.type === SelectTrigger) {
          return cloneElement(child, {
            children: Children.toArray(child.props.children).map((c: any) =>
            c?.type === SelectValue ?
            <span key="val">{value || 'Select...'}</span> :

            c

            )
          });
        }
        return null;
      })}
    </div>);

};
export const SelectTrigger = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) =>
  <div
    ref={ref}
    className={cn(
      'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}>
    
    {children}
  </div>
);
export const SelectValue = ({ placeholder }: {placeholder?: string;}) =>
<span>{placeholder}</span>;

export const SelectContent = ({ children }: {children: React.ReactNode;}) =>
<>{children}</>;

export const SelectItem = ({
  value,
  children



}: {value: string;children: React.ReactNode;}) => <>{children}</>;