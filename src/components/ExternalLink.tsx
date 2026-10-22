import type { ReactNode } from 'react';
import { openInTelegram } from '../lib/telegram';

/** Внешняя ссылка: в браузере — новая вкладка, в Telegram — средствами клиента. */
export function ExternalLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => {
        if (openInTelegram(href)) event.preventDefault();
      }}
    >
      {children}
    </a>
  );
}
