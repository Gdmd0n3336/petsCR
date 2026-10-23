// Свои линейные значки (design/DESIGN.md §4): одна толщина 1,8, цвет текущего текста, без эмодзи.
const PATHS = {
  nearby: (
    <>
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  catalog: <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />,
  bookings: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  shop: (
    <>
      <path d="M5.5 8h13l-1 12.5h-11z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </>
  ),
  pet: (
    <>
      <circle cx="6.5" cy="10.5" r="1.8" />
      <circle cx="10" cy="6.2" r="1.8" />
      <circle cx="14" cy="6.2" r="1.8" />
      <circle cx="17.5" cy="10.5" r="1.8" />
      <path d="M12 12.5c-2.8 0-5 3-5 5.2 0 1.5 1.2 2.8 2.8 2.8h4.4c1.6 0 2.8-1.3 2.8-2.8 0-2.2-2.2-5.2-5-5.2z" />
    </>
  ),
  chevronRight: <path d="M9.5 6l6 6-6 6" />,
  chevronLeft: <path d="M14.5 6l-6 6 6 6" />,
  chevronDown: <path d="M7 10l5 5 5-5" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />,
} as const;

export type IconName = keyof typeof PATHS;

/** Декоративный значок: смысл передаёт текст рядом, поэтому скрыт от экранных читалок. */
export function Icon({
  name,
  size = 24,
  filled = false,
  className,
}: {
  name: IconName;
  size?: number;
  filled?: boolean;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
