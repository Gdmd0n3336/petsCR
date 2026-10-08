#!/bin/bash
# PreToolUse(Write|Edit): дополнительная (хрупкая, на regex) защита от зашитых секретов.
# Основная защита: переменные окружения, /security-review, semgrep.
CONTENT=$(jq -r '.tool_input.content // .tool_input.new_string // empty')
if printf '%s' "$CONTENT" | grep -qiP "(api.?key|secret|password|token|service_role)\s*[=:]\s*['\"][^'\"]{10,}['\"]|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.|sk-[A-Za-z0-9]{20,}"; then
  echo "BLOCKED: похоже на зашитый секрет. Используй переменные окружения (.env.example только с пустыми значениями)." >&2
  exit 2
fi
exit 0
