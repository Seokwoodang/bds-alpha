// 캐시된(온디맨드로 수집된) 모든 시군구의 최근 N개월 매매+전세를 재수집.
// 온디맨드 전국 모델의 신선도 유지용 — 매일 cron에서 실행.
// 사용: set -a; . ./.env.local; set +a; node scripts/refresh-cached.mjs [MONTHS=3]
import pg from 'pg';

const API_KEY = process.env.DATA_GO_KR_API_KEY;
const PW = process.env.SUPABASE_DB_PASSWORD;
const REF = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace('https://', '').split('.')[0];
const REGION = process.env.SUPABASE_POOLER_REGION || 'aws-1-ap-northeast-2';
if (!API_KEY || !PW || !REF) { console.error('환경변수 필요(DATA_GO_KR_API_KEY/SUPABASE_DB_PASSWORD/NEXT_PUBLIC_SUPABASE_URL)'); process.exit(1); }

const MONTHS = Math.max(1, Math.min(parseInt(process.argv[2] || '3', 10), 13));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const TRADE = 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev';
const RENT = 'https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent';
const tag = (b, n) => { const m = b.match(new RegExp(`<${n}>([\\s\\S]*?)</${n}>`)); return m ? m[1].trim() : ''; };
const num = (s) => parseInt((s || '').replace(/[^0-9-]/g, ''), 10) || 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function recentMonths(n) { const out = []; const d = new Date(); for (let i = 0; i < n; i++) { out.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`); d.setMonth(d.getMonth() - 1); } return out; }
async function items(base, lawd, ym, rows) {
  const x = await (await fetch(`${base}?serviceKey=${API_KEY}&LAWD_CD=${lawd}&DEAL_YMD=${ym}&numOfRows=${rows}&pageNo=1`, { headers: { 'User-Agent': UA } })).text();
  if (!x.includes('<resultCode>')) return [];
  return [...x.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
}
function parseTrade(region, lawd, b) {
  if (tag(b, 'cdealType') === 'O') return null;
  const a = num(tag(b, 'dealAmount')), y = tag(b, 'dealYear'), mo = tag(b, 'dealMonth'), d = tag(b, 'dealDay');
  if (!a || !y || !mo || !d) return null;
  return { region, lawd_cd: lawd, apt_name: tag(b, 'aptNm') || null, dong: tag(b, 'umdNm') || null, deal_amount: a, area: parseFloat(tag(b, 'excluUseAr')) || null, floor: parseInt(tag(b, 'floor'), 10) || null, build_year: parseInt(tag(b, 'buildYear'), 10) || null, deal_date: `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`, cdeal_type: tag(b, 'cdealType') || null };
}
function parseRent(region, lawd, b) {
  const dep = num(tag(b, 'deposit')), y = tag(b, 'dealYear'), mo = tag(b, 'dealMonth'), d = tag(b, 'dealDay');
  if (!dep || !y || !mo || !d) return null;
  return { region, lawd_cd: lawd, apt_name: tag(b, 'aptNm') || null, dong: tag(b, 'umdNm') || null, deposit: dep, monthly_rent: num(tag(b, 'monthlyRent')), area: parseFloat(tag(b, 'excluUseAr')) || null, floor: parseInt(tag(b, 'floor'), 10) || null, build_year: parseInt(tag(b, 'buildYear'), 10) || null, deal_date: `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}` };
}
const TX_COLS = ['region', 'lawd_cd', 'apt_name', 'dong', 'deal_amount', 'area', 'floor', 'build_year', 'deal_date', 'cdeal_type'];
const RENT_COLS = ['region', 'lawd_cd', 'apt_name', 'dong', 'deposit', 'monthly_rent', 'area', 'floor', 'build_year', 'deal_date'];
async function bulk(client, table, cols, rows) {
  let n = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200); const ph = []; const vals = [];
    chunk.forEach((r, k) => { const o = k * cols.length; ph.push(`(${cols.map((_, j) => `$${o + j + 1}`).join(',')})`); vals.push(...cols.map((c) => r[c])); });
    n += (await client.query(`insert into public.${table} (${cols.join(',')}) values ${ph.join(',')} on conflict do nothing`, vals)).rowCount ?? 0;
  }
  return n;
}

const client = new pg.Client({ connectionString: `postgresql://postgres.${REF}:${PW}@${REGION}.pooler.supabase.com:5432/postgres`, ssl: { rejectUnauthorized: false } });
await client.connect();
const { rows: regions } = await client.query('select distinct lawd_cd, max(region) as region from transactions group by lawd_cd order by lawd_cd');
const yms = recentMonths(MONTHS);
console.log(`캐시 지역 ${regions.length}곳 × 최근 ${MONTHS}개월 갱신`);
let tTot = 0, rTot = 0;
for (const { lawd_cd, region } of regions) {
  let tx = [], rt = [];
  for (const ym of yms) {
    tx.push(...(await items(TRADE, lawd_cd, ym, 2000)).map((b) => parseTrade(region, lawd_cd, b)).filter(Boolean));
    rt.push(...(await items(RENT, lawd_cd, ym, 4000)).map((b) => parseRent(region, lawd_cd, b)).filter(Boolean));
    await sleep(120);
  }
  tTot += await bulk(client, 'transactions', TX_COLS, tx);
  rTot += await bulk(client, 'rents', RENT_COLS, rt);
}
console.log(`신규 적재: 매매 ${tTot} · 전세 ${rTot}`);
await client.end();
