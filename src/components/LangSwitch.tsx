import { useI18n } from '../i18n/context';
import { LANGS } from '../i18n/locale';

export function LangSwitch() {
  const { t, lang, setLang } = useI18n();
  return (
    <div className="segmented" role="group" aria-label={t.lang.label}>
      {LANGS.map((option) => (
        <button
          key={option}
          type="button"
          className="segmented__item"
          lang={option}
          aria-pressed={option === lang}
          aria-label={option === 'ru' ? t.lang.ruName : t.lang.enName}
          onClick={() => setLang(option)}
        >
          {t.lang[option]}
        </button>
      ))}
    </div>
  );
}
