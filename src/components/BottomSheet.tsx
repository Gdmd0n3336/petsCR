import { useEffect, useRef, type ReactNode } from 'react';
import { useI18n } from '../i18n/context';
import { Icon } from './Icon';

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Нижняя шторка выбора (DESIGN.md §4, §6): затемнение, ручка, заголовок, закрытие по Escape и
 * по нажатию мимо. При открытии фокус на выбранном пункте, при закрытии — обратно на кнопку,
 * которая её открыла.
 */
export function BottomSheet({ title, onClose, children }: Props) {
  const { t } = useI18n();
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const sheet = sheetRef.current;
    const first =
      sheet?.querySelector<HTMLElement>('[aria-pressed="true"]') ??
      sheet?.querySelector<HTMLElement>('button');
    first?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      opener?.focus();
    };
  }, [onClose]);

  return (
    <div className="overlay overlay--sheet" onClick={onClose}>
      <div
        ref={sheetRef}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="sheet__grab" aria-hidden="true" />
        <div className="sheet__header">
          <h2 id="sheet-title" className="sheet__title">
            {title}
          </h2>
          <button
            type="button"
            className="sheet__close"
            aria-label={t.catalog.closeSheet}
            onClick={onClose}
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

type Option<T extends string> = { value: T; label: string };

/** Список вариантов в шторке: один выбран, выбор сразу применяется и закрывает шторку. */
export function SheetOptions<T extends string>({
  options,
  value,
  onSelect,
}: {
  options: Option<T>[];
  value: T;
  onSelect: (value: T) => void;
}) {
  return (
    <ul className="sheet__options">
      {options.map((o) => (
        <li key={o.value}>
          <button
            type="button"
            className="sheet__option"
            aria-pressed={o.value === value}
            onClick={() => onSelect(o.value)}
          >
            <span>{o.label}</span>
            {o.value === value && <Icon name="check" size={20} className="sheet__check" />}
          </button>
        </li>
      ))}
    </ul>
  );
}
