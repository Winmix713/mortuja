import React, { Children, cloneElement, isValidElement } from 'react';
export const Collapsible = ({
  open,
  onOpenChange,
  children,
  className
}: any) => {
  return (
    <div className={className}>
      {Children.map(children, (child) => {
        if (isValidElement(child)) {
          if (child.type === CollapsibleTrigger) {
            return cloneElement(child as any, {
              onClick: () => onOpenChange(!open)
            });
          }
          if (child.type === CollapsibleContent) {
            return open ? child : null;
          }
        }
        return child;
      })}
    </div>);

};
export const CollapsibleTrigger = ({ asChild, children, onClick }: any) => {
  if (asChild && isValidElement(children)) {
    return cloneElement(children as any, {
      onClick
    });
  }
  return <div onClick={onClick}>{children}</div>;
};
export const CollapsibleContent = ({ children }: any) => <div>{children}</div>;