// @vitest-environment node
import { existsSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from './main.ts';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const fixture = (name: string) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

function exec(args: string[]) {
  const out: string[] = [];
  const err: string[] = [];
  const code = run(args, {
    stdout: (s) => out.push(s),
    stderr: (s) => err.push(s),
    repoRoot,
    homeDir: mkdtempSync(join(tmpdir(), 'lapa-home-')),
    now: new Date('2026-10-19T12:00:00Z'),
  });
  return { code, out: out.join('\n'), err: err.join('\n') };
}

const outDir = () => mkdtempSync(join(tmpdir(), 'lapa-osm-'));

describe('import-osm CLI', () => {
  it('requires --from-file', () => {
    const r = exec([]);
    expect(r.code).toBe(1);
    expect(r.err).toMatch(/--from-file/);
  });

  it('reports a missing input file in Russian', () => {
    const r = exec(['--from-file', '/no/such/file.json', '--out-dir', outDir()]);
    expect(r.code).toBe(1);
    expect(r.err).toMatch(/Файл не найден/);
  });

  it('reports a directory given instead of a file in Russian', () => {
    const r = exec(['--from-file', tmpdir(), '--out-dir', outDir()]);
    expect(r.code).toBe(1);
    expect(r.err).toMatch(/папка, а не файл/);
  });

  it('stops on GeoJSON with a clear message and writes nothing', () => {
    const dir = outDir();
    const r = exec(['--from-file', fixture('geojson-sample.json'), '--out-dir', dir]);
    expect(r.code).toBe(1);
    expect(r.err).toMatch(/GeoJSON/);
    expect(readdirSync(dir)).toEqual([]);
  });

  it('refuses to write output inside the repository', () => {
    const inside = join(repoRoot, 'tmp-osm-output');
    const r = exec(['--from-file', fixture('overpass-sample.json'), '--out-dir', inside]);
    expect(r.code).toBe(1);
    expect(r.err).toMatch(/внутри репозитория/);
    expect(existsSync(inside)).toBe(false);
  });

  it('writes SQL and log outside the repository and prints the journal', () => {
    const dir = outDir();
    const r = exec(['--from-file', fixture('overpass-sample.json'), '--out-dir', dir]);
    expect(r.err).toBe('');
    expect(r.code).toBe(0);

    expect(r.out).toContain('Время данных OSM: 2026-10-01T00:00:00Z');
    expect(r.out).toContain('Элементов в файле: 11 (node 7, way 2, relation 2)');
    expect(r.out).toContain('Дублей в файле: 1; без координат: 1; без нужных тегов: 1');
    expect(r.out).toMatch(/vet_clinic\s+ветклиники\s+2\s+1\s+1\s+0/);
    expect(r.out).toMatch(/pet_shop\s+зоомагазины\s+2\s+1\s+0\s+1/);
    expect(r.out).toContain('Итого к загрузке: 8');
    expect(r.out).toContain('© участники OpenStreetMap');

    const sql = readFileSync(join(dir, 'venues_import_upsert.sql'), 'utf8');
    expect(sql).toContain('jsonb_to_recordset(');
    expect(readFileSync(join(dir, 'import-log-2026-10-19.txt'), 'utf8')).toBe(`${r.out}\n`);
  });

  it('produces the same SQL on a second run (deterministic, idempotent input)', () => {
    const dir = outDir();
    exec(['--from-file', fixture('overpass-sample.json'), '--out-dir', dir]);
    const first = readFileSync(join(dir, 'venues_import_upsert.sql'), 'utf8');
    exec(['--from-file', fixture('overpass-sample.json'), '--out-dir', dir]);
    expect(readFileSync(join(dir, 'venues_import_upsert.sql'), 'utf8')).toBe(first);
  });

  it('defaults the output directory to ~/lapa-osm-import', () => {
    const r = exec(['--from-file', fixture('overpass-sample.json')]);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/lapa-osm-import[/\\]venues_import_upsert\.sql/);
  });
});
