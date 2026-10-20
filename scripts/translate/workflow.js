// Сценарий оркестрации подагентов Claude Code (инструмент Workflow) для TASK-T. Запускать из сессии Claude Code:
// Workflow({ scriptPath: "scripts/translate/workflow.js", args: { batches: [<имена пакетов из data/translations_remaining.json>] } }).
// Пакет b-001 в сценарии помечен как уже переведённый (пилот) — при продолжении его в списке нет.
export const meta = {
  name: 'task-t-translation',
  description:
    'TASK-T: translate 3862 reviews (RU/EN) in 50 batches with independent tone verification, plus 165 venue names',
  phases: [
    {
      title: 'Translate',
      detail: 'one agent per batch writes data/work/out/b-NNN.json and self-checks',
    },
    { title: 'Verify', detail: 'independent agent: meaning/tone yes/no per review' },
    { title: 'Retranslate', detail: 'redo every "no" from the original' },
    { title: 'Reverify', detail: 'fresh agent checks the redone items' },
    { title: 'Venues', detail: '165 venue names RU/EN' },
  ],
};

const RULES = `THE MAIN RULE: «Переведи дословно по смыслу, сохрани тон (негатив остаётся негативом), не выдумывай. Ничего не добавляй, не убирай и не смягчай».
Mandatory rules:
1. Exact translation, not a retelling or an evaluation. Add nothing, remove nothing, do not soften or intensify. A negative review stays negative, a complaint stays a complaint, sarcasm stays sarcasm.
2. Keep tone and meaning; keep emoji, numbers, prices, currency, names and clinic names. Colloquial text → colloquial translation.
3. Do not translate people's names or clinic names. In Russian write names of people and brands in Cyrillic transliteration ("หมอบิว" → "доктор Бью", "Dr. Taro" → "доктор Таро") because the Russian text must be at least 80% Cyrillic among letters; in English use Latin transliteration. Never leave Thai (or other non-target) script in the translations.
4. If a fragment is unreadable or ambiguous, do not guess: translate what is there literally and set "uncertain": true; otherwise false.
5. "rating" is only a sanity check: never adapt the translation to the rating. If the text praises but the rating is 1 (or vice versa), translate the text as it is.
6. Do not invent content for empty or meaningless texts: "👍" stays "👍"; "ดี" → "Хорошо" / "Good". A text of only emoji/punctuation is copied unchanged into each needed language.`;

const FORMAT = `Fields: if need_ru is true → text_ru is the Russian translation of "text"; if need_ru is false (original is Russian) → text_ru must be "". Same for need_en/text_en. Translate from the ORIGINAL "text" directly into each language.`;

const translatePrompt = (
  b,
) => `You are a professional translator (Thai/English/other → Russian and English) of pet-clinic reviews. Work in /home/user/petsCR. Do NOT touch git and do not edit any file except data/work/out/${b}.json.
INPUT: read data/work/batches/${b}.jsonl fully with the Read tool (one JSON per line: id, source_url, rating, lang, text, need_ru, need_en).
For every line produce {"id": <same id>, "text_ru": "...", "text_en": "...", "uncertain": true|false}. ${FORMAT}
${RULES}
OUTPUT: write ONE valid JSON array (one object per input line, same order) to data/work/out/${b}.json with the Write tool. Escape quotes/newlines properly; keep original line breaks as \\n.
SELF-CHECK (mandatory): run \`node scripts/translate/check-batch.mjs ${b}\`; fix and re-run until it prints OK. Then re-read your output against the originals once for meaning and tone (especially negative reviews) and fix anything softened, added or dropped; re-run the check.
Return the structured result.`;

const verifyPrompt = (
  b,
) => `You are an independent bilingual reviewer (Thai/English/other ↔ Russian/English). You did NOT write these translations. Work in /home/user/petsCR. Do NOT edit any file except data/work/verify/${b}.json. Do not touch git.
Read data/work/batches/${b}.jsonl (originals: id, rating, lang, text, need_ru, need_en) and data/work/out/${b}.json (translations: id, text_ru, text_en, uncertain).
For EVERY review answer: does the translation (text_ru and/or text_en, whichever are non-empty) correspond to the original in MEANING and TONE — yes or no, and why.
Say "no" if: something is added, dropped or invented; meaning is changed; tone is softened or intensified (complaint turned neutral/positive, praise turned negative); sarcasm lost; a translation is in the wrong language or keeps Thai script. Pay special attention to: rating 1–2 reviews whose translation sounds positive, and rating 5 reviews whose translation sounds harshly negative — but judge against the ORIGINAL TEXT, not the rating (an original that truly contradicts its rating is fine if translated faithfully).
Do not say "no" for style preferences, transliteration choices of names, or minor wording that keeps meaning and tone.
Write ONE JSON array to data/work/verify/${b}.json with an entry for EVERY id: {"id": <id>, "verdict": "yes"|"no", "reason": "<short reason; required for no, may be empty for yes>"}.
Then run \`node scripts/translate/check-verify.mjs ${b} verify\` and fix until OK. Return the structured result (list the "no" ids).`;

const fixPrompt = (
  b,
  ids,
) => `You are a professional translator. Work in /home/user/petsCR. Do not touch git. Edit only data/work/out/${b}.json and write data/work/fix/${b}.json.
An independent reviewer rejected these translations: ids ${JSON.stringify(ids)}. Read the reasons in data/work/verify/${b}.json, the originals in data/work/batches/${b}.jsonl and the current translations in data/work/out/${b}.json.
For each rejected id, translate AGAIN from the ORIGINAL text (not by patching), fixing what the reviewer pointed out, and replace that object in data/work/out/${b}.json (keep all other objects unchanged). If you are convinced the reviewer is wrong, still re-check carefully; keep the faithful version.
${FORMAT}
${RULES}
Then write data/work/fix/${b}.json: a JSON array [{"id": <id>, "reason": "<reviewer reason>", "change": "<what you changed, short>"}] for exactly these ids.
Run \`node scripts/translate/check-batch.mjs ${b}\` and fix until OK. Return the structured result.`;

const reverifyPrompt = (
  b,
) => `You are an independent bilingual reviewer. You did NOT write these translations. Work in /home/user/petsCR. Do NOT edit any file except data/work/reverify/${b}.json. Do not touch git.
Read data/work/fix/${b}.json (the ids that were re-translated), the originals in data/work/batches/${b}.jsonl and the translations in data/work/out/${b}.json.
For EACH id listed in data/work/fix/${b}.json answer: does the translation correspond to the original in MEANING and TONE — yes or no, and why. Say "no" for additions, omissions, invented content, changed meaning, softened or intensified tone, lost sarcasm, wrong language or leftover Thai script. Judge against the original text, not the rating. Do not say "no" for style preferences or name transliteration choices.
Write ONE JSON array to data/work/reverify/${b}.json: [{"id": <id>, "verdict": "yes"|"no", "reason": "<short; required for no>"}] for exactly those ids.
Run \`node scripts/translate/check-verify.mjs ${b} reverify\` and fix until OK. Return the structured result.`;

const venuePrompt = (
  n,
  from,
  to,
) => `You translate names of veterinary clinics in Chonburi (Thailand) for a Russian-speaking app. Work in /home/user/petsCR. Do not touch git. Edit only data/work/venues/v-${n}.json.
Read data/venue_names_input.jsonl lines ${from}–${to} (1-based; ${to - from + 1} lines): google_place_id, name, district_ru, category, address.
For each produce {"google_place_id": "...", "name_ru": "...", "name_en": "...", "uncertain": true|false}:
- Brand names and proper names: readable transliteration (Russian letters in name_ru, Latin in name_en), NOT a literal translation of a name. Common words are translated: «โรงพยาบาลสัตว์» → «Ветеринарная больница» / "Animal Hospital", «สัตวแพทย์» → «Ветеринар» / "Veterinary", «คลินิก» / «คลีนิก» → «Клиника» / "Clinic", «รักษาสัตว์» → «лечение животных» (ветклиника) / "Animal Clinic". Format example: «Pet Friends Hospital Sriracha» → «Больница Пет Френдс (Сирача)» / "Pet Friends Hospital (Sriracha)".
- Do not invent names. If the original already contains a Latin name, keep that Latin spelling in name_en; in name_ru transliterate it into Cyrillic (name_ru must be at least 80% Cyrillic among letters, name_en at least 80% Latin). Place names (Sriracha, Pattaya, Bang Saen, Ban Bueng, Phanat Nikhom, Panthong…) go in parentheses at the end when they are part of the name, as in the example.
- Never leave Thai, Chinese or Japanese script in the output.
- If the name is ambiguous (unclear brand vs common word, unclear reading), set "uncertain": true.
Write ONE JSON array (same order as the input lines) to data/work/venues/v-${n}.json, run \`node scripts/translate/venues.mjs check ${n}\` and fix until OK. Return the structured result.`;

const RESULT = {
  type: 'object',
  properties: {
    rows: { type: 'number' },
    uncertain: { type: 'number' },
    check: { type: 'string', enum: ['OK', 'FAIL'] },
    note: { type: 'string' },
  },
  required: ['rows', 'check'],
};
const VERDICTS = {
  type: 'object',
  properties: {
    checked: { type: 'number' },
    no_ids: { type: 'array', items: { type: 'number' } },
    check: { type: 'string', enum: ['OK', 'FAIL'] },
  },
  required: ['checked', 'no_ids', 'check'],
};

const batches = args.batches;

const reviews = pipeline(
  batches,
  (b) =>
    b === 'b-001'
      ? { rows: 89, check: 'OK', note: 'pilot, translated earlier' }
      : agent(translatePrompt(b), { label: `translate ${b}`, phase: 'Translate', schema: RESULT }),
  (t, b) =>
    agent(verifyPrompt(b), { label: `verify ${b}`, phase: 'Verify', schema: VERDICTS }).then(
      (v) => ({ b, t, v }),
    ),
  async (s) => {
    if (!s || !s.v || s.v.no_ids.length === 0) return { ...s, fix: null, re: null };
    const fix = await agent(fixPrompt(s.b, s.v.no_ids), {
      label: `retranslate ${s.b} (${s.v.no_ids.length})`,
      phase: 'Retranslate',
      schema: RESULT,
    });
    const re = await agent(reverifyPrompt(s.b), {
      label: `reverify ${s.b}`,
      phase: 'Reverify',
      schema: VERDICTS,
    });
    return { ...s, fix, re };
  },
);

const venues = parallel([
  () => agent(venuePrompt(1, 1, 83), { label: 'venues 1–83', phase: 'Venues', schema: RESULT }),
  () => agent(venuePrompt(2, 84, 165), { label: 'venues 84–165', phase: 'Venues', schema: RESULT }),
]);

const [r, v] = await Promise.all([reviews, venues]);
const done = r.filter(Boolean);
const firstNo = done.reduce((n, s) => n + (s.v ? s.v.no_ids.length : 0), 0);
const finalNo = done.reduce((n, s) => n + (s.re ? s.re.no_ids.length : 0), 0);
log(
  `batches ${done.length}/${batches.length}; first-pass "no": ${firstNo}; after retranslation "no": ${finalNo}`,
);
return {
  batches: done.map((s) => ({
    b: s.b,
    translate: s.t && s.t.check,
    uncertain: s.t && s.t.uncertain,
    no1: s.v ? s.v.no_ids.length : null,
    verifyCheck: s.v && s.v.check,
    fixCheck: s.fix ? s.fix.check : null,
    no2: s.re ? s.re.no_ids : null,
  })),
  missing: batches.filter((b) => !done.some((s) => s.b === b)),
  venues: v,
  firstNo,
  finalNo,
};
