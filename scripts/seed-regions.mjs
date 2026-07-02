// 시도 단위 사전 수집 — 전국 색칠지도/스코어 채우기용.
// 사용: set -a; . ./.env.local; set +a; node scripts/seed-regions.mjs [시도접두CSV=11] [MONTHS=6]
//  예: node scripts/seed-regions.mjs 26,27,28,29,30,31,36 6   ← 6대 광역시+세종
import pg from 'pg';
import fs from 'fs';

const API = process.env.DATA_GO_KR_API_KEY;
const PW = process.env.SUPABASE_DB_PASSWORD;
const REF = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace('https://', '').split('.')[0];
const REGION = process.env.SUPABASE_POOLER_REGION || 'aws-1-ap-northeast-2';
if (!API || !PW || !REF) { console.error('환경변수 필요'); process.exit(1); }

const PREFIXES = (process.argv[2] || '11').split(',').map((s) => s.trim());
const MONTHS = Math.max(1, Math.min(parseInt(process.argv[3] || '6', 10), 13));
const CONCURRENCY = 3;

// regions-kr.ts에서 시군구 파싱(생성 포맷 고정)
const ts = fs.readFileSync(new URL('../src/lib/regions-kr.ts', import.meta.url), 'utf8');
const ALL = [...ts.matchAll(/\{ sido: "([^"]+)", name: "([^"]+)", code: "(\d{5})" \}/g)]
  .map((m) => ({ sido: m[1], name: m[2], code: m[3] }));
const TARGETS = ALL.filter((s) => PREFIXES.some((p) => s.code.startsWith(p)));

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const TRADE = 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev';
const RENT = 'https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent';
const tag = (b, n) => { const m = b.match(new RegExp(`<${n}>([\\s\\S]*?)</${n}>`)); return m ? m[1].trim() : ''; };
const num = (s) => parseInt((s || '').replace(/[^0-9-]/g, ''), 10) || 0;
const yms = (() => { const o = []; const d = new Date(); for (let i = 0; i < MONTHS; i++) { o.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`); d.setMonth(d.getMonth() - 1); } return o; })();

async function items(base, lawd, ym, rows) {
  try {
    const x = await (await fetch(`${base}?serviceKey=${API}&LAWD_CD=${lawd}&DEAL_YMD=${ym}&numOfRows=${rows}&pageNo=1`, { headers: { 'User-Agent': UA } })).text();
    if (!x.includes('<resultCode>')) return [];
    return [...x.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  } catch { return []; }
}
const parseTrade = (r, l, b) => { if (tag(b, 'cdealType') === 'O') return null; const a = num(tag(b, 'dealAmount')), y = tag(b, 'dealYear'), mo = tag(b, 'dealMonth'), d = tag(b, 'dealDay'); if (!a || !y) return null; return { region: r, lawd_cd: l, apt_name: tag(b, 'aptNm') || null, dong: tag(b, 'umdNm') || null, deal_amount: a, area: parseFloat(tag(b, 'excluUseAr')) || null, floor: parseInt(tag(b, 'floor'), 10) || null, build_year: parseInt(tag(b, 'buildYear'), 10) || null, deal_date: `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`, cdeal_type: tag(b, 'cdealType') || null }; };
const parseRent = (r, l, b) => { const dep = num(tag(b, 'deposit')), y = tag(b, 'dealYear'), mo = tag(b, 'dealMonth'), d = tag(b, 'dealDay'); if (!dep || !y) return null; return { region: r, lawd_cd: l, apt_name: tag(b, 'aptNm') || null, dong: tag(b, 'umdNm') || null, deposit: dep, monthly_rent: num(tag(b, 'monthlyRent')), area: parseFloat(tag(b, 'excluUseAr')) || null, floor: parseInt(tag(b, 'floor'), 10) || null, build_year: parseInt(tag(b, 'buildYear'), 10) || null, deal_date: `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}` }; };
const TXC = ['region', 'lawd_cd', 'apt_name', 'dong', 'deal_amount', 'area', 'floor', 'build_year', 'deal_date', 'cdeal_type'];
const RTC = ['region', 'lawd_cd', 'apt_name', 'dong', 'deposit', 'monthly_rent', 'area', 'floor', 'build_year', 'deal_date'];
async function bulk(c, t, cols, rows) { let n = 0; for (let i = 0; i < rows.length; i += 200) { const ch = rows.slice(i, i + 200); const ph = [], v = []; ch.forEach((r, k) => { const o = k * cols.length; ph.push(`(${cols.map((_, j) => `$${o + j + 1}`).join(',')})`); v.push(...cols.map((x) => r[x])); }); n += (await c.query(`insert into public.${t} (${cols.join(',')}) values ${ph.join(',')} on conflict do nothing`, v)).rowCount ?? 0; } return n; }

const client = new pg.Client({ connectionString: `postgresql://postgres.${REF}:${PW}@${REGION}.pooler.supabase.com:5432/postgres`, ssl: { rejectUnauthorized: false } });
await client.connect();
console.log(`시드: ${TARGETS.length}개 시군구 × ${MONTHS}개월 (동시 ${CONCURRENCY})`);
let T = 0, R = 0, done = 0;
const queue = [...TARGETS];
async function worker() {
  for (;;) {
    const s = queue.shift();
    if (!s) return;
    const [tb, rb] = await Promise.all([
      Promise.all(yms.map((ym) => items(TRADE, s.code, ym, 2000))).then((a) => a.flat()),
      Promise.all(yms.map((ym) => items(RENT, s.code, ym, 4000))).then((a) => a.flat()),
    ]);
    const tx = tb.map((b) => parseTrade(s.name, s.code, b)).filter(Boolean);
    const rt = rb.map((b) => parseRent(s.name, s.code, b)).filter(Boolean);
    T += await bulk(client, 'transactions', TXC, tx);
    R += await bulk(client, 'rents', RTC, rt);
    done++;
    if (done % 10 === 0) console.log(`  ${done}/${TARGETS.length}`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log(`완료: 신규 매매 ${T} · 전월세 ${R}`);
await client.end();
