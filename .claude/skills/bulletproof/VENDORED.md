# Vendored: bulletproof

- Источник: https://github.com/artemiimillier/bulletproof (автор Artemiy Miller, лицензия MIT)
- Проверенный коммит: 49e9c28f317c549de2767c6bbe11848fdfc9587a (fix: improve auto-trigger description), версия скилла 5.0
- Дата проверки: 2026-10-08
- Проверка: клон с GitHub сопоставлен с bulletproof-main.zip из репозитория (diff -r: файлы идентичны), прочитаны SKILL.md, templates/, agents/. Исполняемых скриптов в скилле нет; хуки описаны только как JSON в SKILL.md.
- Автообновление с main отключено. Обновлять только вручную после повторной проверки.
- Отличие от upstream: хуки проекта лежат в .claude/hooks/ и .claude/settings.json (в SKILL.md пример читает TOOL_INPUT, а в актуальной документации Claude Code вход хука приходит в stdin как JSON).
