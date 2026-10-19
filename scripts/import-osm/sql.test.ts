// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { parseOverpass, type ImportRow } from './parse.ts';
import { buildUpsertSql } from './sql.ts';

const sample = parseOverpass(
  readFileSync(new URL('./fixtures/overpass-sample.json', import.meta.url), 'utf8'),
);
const meta = { inputName: 'overpass-sample.json', osmTimestamp: sample.osmTimestamp };

const migrationsDir = new URL('../../supabase/migrations/', import.meta.url);
const migrationFile = readdirSync(migrationsDir).find((f) => f.endsWith('_venues_import.sql'));
const migration = readFileSync(new URL(migrationFile ?? 'missing', migrationsDir), 'utf8');

async function freshDb() {
  const db = new PGlite();
  // В PGlite нет ролей Supabase; создаём их, чтобы миграция применилась как есть.
  await db.exec('create role anon; create role authenticated; create role service_role;');
  await db.exec(migration);
  return db;
}

type Row = { osm_type: string; osm_id: number; status: string; imported_at: Date; lat: number };
const rowsOf = async (db: PGlite) =>
  (await db.query<Row>('select * from public.venues_import order by osm_type, osm_id')).rows;

describe('buildUpsertSql (text)', () => {
  const sql = buildUpsertSql(sample.rows, meta);

  it('embeds all data in a single JSON literal inside one transaction', () => {
    expect(sql.match(/jsonb_to_recordset\(/g)).toHaveLength(1);
    expect(sql).toMatch(/^begin;$/m);
    expect(sql).toMatch(/^commit;$/m);
    expect(sql).toContain('set local standard_conforming_strings = on;');
  });

  it('never updates status, imported_at or source on conflict', () => {
    const update = sql.slice(sql.indexOf('do update set'), sql.indexOf('commit;'));
    expect(update).not.toMatch(/status|imported_at|source/);
  });

  it('keeps header values on comment lines (no line breaks from file names)', () => {
    const evil = buildUpsertSql(sample.rows, { ...meta, inputName: 'x.json\nselect 1; --' });
    expect(evil).not.toMatch(/^select 1;/m);
  });
});

describe('buildUpsertSql on real Postgres (PGlite) with the venues_import migration', () => {
  it('inserts every row once, with source and OSM timestamp', async () => {
    const db = await freshDb();
    await db.exec(buildUpsertSql(sample.rows, meta));
    const rows = await db.query<{ n: number; sources: string[]; ts: Date }>(
      'select count(*)::int as n, array_agg(distinct source) as sources, max(osm_timestamp) as ts from public.venues_import',
    );
    expect(rows.rows[0]).toEqual({
      n: 8,
      sources: ['osm'],
      ts: new Date('2026-10-01T00:00:00Z'),
    });
  }, 30_000);

  it('is idempotent and keeps human decisions on re-run', async () => {
    const db = await freshDb();
    await db.exec(buildUpsertSql(sample.rows, meta));
    await db.exec("update public.venues_import set status = 'approved' where osm_id = 101");
    const before = await rowsOf(db);

    const moved: ImportRow[] = sample.rows.map((r) => (r.osm_id === 201 ? { ...r, lat: 12.5 } : r));
    await db.exec(buildUpsertSql(moved, meta));
    await db.exec(buildUpsertSql(moved, meta));
    const after = await rowsOf(db);

    expect(after).toHaveLength(before.length);
    const find = (rows: Row[], id: number) => rows.find((r) => r.osm_id === id);
    expect(find(after, 101)?.status).toBe('approved');
    expect(find(after, 101)?.imported_at).toEqual(find(before, 101)?.imported_at);
    expect(find(after, 201)?.lat).toBe(12.5);
  }, 30_000);

  it('stores unsafe tag values byte for byte and executes nothing from them', async () => {
    const db = await freshDb();
    await db.exec(buildUpsertSql(sample.rows, meta));
    const name = await db.query<{ name: string }>(
      "select tags->>'name' as name from public.venues_import where osm_type = 'node' and osm_id = 105",
    );
    expect(name.rows[0]?.name).toBe(
      'O\'Brien "Pets" $$; delete from public.venues_import; -- \\ \n second line',
    );
    expect((await rowsOf(db)).length).toBe(8);
  }, 30_000);

  it('is closed for anon and authenticated (RLS + no grants)', async () => {
    const db = await freshDb();
    await db.exec(buildUpsertSql(sample.rows, meta));
    for (const role of ['anon', 'authenticated']) {
      await expect(
        db.exec(`set role ${role}; select * from public.venues_import;`),
      ).rejects.toThrow(/permission denied/);
      await db.exec('reset role;');
    }
  }, 30_000);
});
