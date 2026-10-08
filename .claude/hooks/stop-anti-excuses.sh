#!/bin/bash
# Stop: не даёт объявить работу завершённой без показанных результатов проверок
# и ловит отговорки. Детерминированная проверка по last_assistant_message.
IN=$(cat)
# защита от зацикливания: повторный блок подряд пропускаем, решает Макс
[ "$(printf '%s' "$IN" | jq -r '.stop_hook_active // false')" = "true" ] && exit 0
MSG=$(printf '%s' "$IN" | jq -r '.last_assistant_message // empty')
block() { jq -n --arg r "$1" '{decision:"block",reason:$r}'; exit 0; }
if printf '%s' "$MSG" | grep -qiE 'pre-?existing|out of scope|follow-?up task|вне рамок задачи|не относится к этой задаче|разберёмся позже'; then
  block "Обнаружена отговорка (pre-existing / out of scope / follow-up). Либо исправь, либо явно назови как «НЕ сделано» с причиной и вопросом к Максу."
fi
if printf '%s' "$MSG" | grep -qiE '(^|[^[:alpha:]])(готово|завершено|done|completed|all tests pass)([^[:alpha:]]|$)' \
   && ! printf '%s' "$MSG" | grep -qiE '(npm (run )?(lint|test|build|typecheck)|tsc|pytest|exit code|passed|прошл|вывод|diff -r|проверк)'; then
  block "Работа объявлена завершённой без показанных результатов проверок (раздел 10 TZ-bulletproof_1.md). Запусти проверки и покажи команду и вывод, либо уберь слово «готово»."
fi
exit 0
