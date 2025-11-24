'use client';

import { ReactNode, useState } from 'react';

type Props = {
  content: ReactNode;
  children: ReactNode;
};

export function Tooltip({ content, children }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="tooltip-wrapper"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && <span className="tooltip">{content}</span>}
    </span>
  );
}
