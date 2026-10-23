import { ScreenState } from '../components/ScreenState';
import { useI18n } from '../i18n/context';
import { useTheme } from '../theme/context';
import { THEMES } from '../theme/theme';
import type { ScreenProps } from './types';

/** «Питомец»: профиль пока «скоро»; раздел «Оформление» — выбор палитры (DESIGN.md §9). */
export function PetScreen({ status = 'empty', onRetry }: ScreenProps) {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const a = t.screens.appearance;
  return (
    <div className="stack">
      <ScreenState
        status={status}
        badge={t.state.soon}
        message={status === 'empty' ? t.screens.pet.empty : undefined}
        onRetry={onRetry}
      />
      <section className="group group--padded" aria-labelledby="appearance-title">
        <h2 id="appearance-title" className="section-title">
          {a.title}
        </h2>
        <div className="segmented segmented--wide" role="group" aria-label={a.palette}>
          {THEMES.map((option) => (
            <button
              key={option}
              type="button"
              className="segmented__item"
              aria-pressed={theme === option}
              onClick={() => setTheme(option)}
            >
              {a[option]}
            </button>
          ))}
        </div>
        <p className="hint">{a.hint}</p>
      </section>
    </div>
  );
}
