import pg from 'pg';
import { readFileSync, readdirSync } from 'node:fs';

const pw = process.env.SUPABASE_DB_PASSWORD;
if (!pw) { console.error('환경변수 SUPABASE_DB_PASSWORD가 필요합니다.'); process.exit(1); }
const ref = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace('https://', '').split('.')[0];
if (!ref) { console.error('NEXT_PUBLIC_SUPABASE_URL이 필요합니다.'); process.exit(1); }

// 시도 순서: 직접(IPv6/4) → 세션 풀러(여러 리전 추정)
const regions = ['ap-northeast-2', 'ap-northeast-1', 'ap-southeast-1', 'us-east-1', 'us-west-1', 'eu-central-1', 'us-east-2'];
const prefixes = ['aws-1', 'aws-0'];
const ports = [5432, 6543];
const candidates = [];
for (const pre of prefixes)
  for (const r of regions)
    for (const port of ports)
      candidates.push(`postgresql://postgres.${ref}:${pw}@${pre}-${r}.pooler.supabase.com:${port}/postgres`);

const migrationFiles = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort();
const files = [...migrationFiles.map((f) => `supabase/migrations/${f}`), 'supabase/seed.sql'];
console.log('적용:', files.join(', '));
const sqls = files.map((f) => readFileSync(f, 'utf8'));

for (const cs of candidates) {
  const client = new pg.Client({ connectionString: cs, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 7000 });
  try {
    await client.connect();
    console.log('CONNECTED via', cs.replace(pw, '***').replace(/@.*?:/, '@<host>:'));
    for (const sql of sqls) await client.query(sql);
    await client.query("NOTIFY pgrst, 'reload schema'"); // PostgREST 스키마 캐시 갱신
    const r = await client.query('select (select count(*) from public.listings)::int as listings, (select count(*) from public.regions)::int as regions, (select count(*) from public.guides)::int as guides');
    console.log('ROWS:', JSON.stringify(r.rows[0]));
    await client.end();
    process.exit(0);
  } catch (e) {
    console.log('try failed:', cs.replace(pw, '***').split('@')[1]?.split('/')[0], '->', e.message);
    try { await client.end(); } catch {}
  }
}
console.error('ALL CONNECTION ATTEMPTS FAILED');
process.exit(1);
