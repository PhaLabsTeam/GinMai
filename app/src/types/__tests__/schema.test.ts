import fs from 'fs';
import path from 'path';

// The app's hand-written types (with narrow status unions) must describe the
// same tables and columns as the live database, and every function the app
// calls must exist there. Regenerate after any backend change:
//   cd supabase && supabase gen types typescript --linked --schema public
// (see docs/backend/README.md), then fix whatever this test reports.
const read = (f: string) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const generated = read('supabase.generated.ts');
const handWritten = read('database.ts');

function tables(src: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const body = src.slice(src.indexOf('Tables: {'), src.indexOf('Views: {') > 0 ? src.indexOf('Views: {') : src.indexOf('Functions: {'));
  for (const m of body.matchAll(/\n\s+(\w+): \{\s*\n\s*Row: \{([\s\S]*?)\n\s*\};?\n/g)) {
    out[m[1]] = [...m[2].matchAll(/\n\s*(\w+)\??:/g)].map((c) => c[1]).sort();
  }
  return out;
}

function functions(src: string): string[] {
  const body = src.slice(src.indexOf('Functions: {'));
  return [...body.matchAll(/\n\s{6}(\w+): \{/g)].map((m) => m[1]);
}

function rpcCalls(): string[] {
  const names = new Set<string>();
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (!['__tests__', 'node_modules'].includes(e.name)) walk(p); continue; }
      if (!/\.tsx?$/.test(e.name)) continue;
      for (const m of fs.readFileSync(p, 'utf8').matchAll(/\.rpc\(\s*["'](\w+)["']/g)) names.add(m[1]);
    }
  };
  walk(path.join(__dirname, '../..'));
  walk(path.join(__dirname, '../../../app'));
  return [...names].sort();
}

describe('app types match the live database', () => {
  it('has the same tables and columns', () => {
    expect(Object.keys(tables(generated)).sort()).toEqual(
      ['blocks', 'connections', 'eat_again_matches', 'feedback', 'moments', 'reports', 'users']
    );
    expect(tables(handWritten)).toEqual(tables(generated));
  });

  it('only calls functions that exist live and are typed', () => {
    const calls = rpcCalls();
    expect(calls.length).toBeGreaterThan(0);
    for (const fn of calls) {
      expect({ fn, live: functions(generated).includes(fn) }).toEqual({ fn, live: true });
      expect({ fn, typed: functions(handWritten).includes(fn) }).toEqual({ fn, typed: true });
    }
  });
});
