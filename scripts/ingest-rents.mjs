// 국토부 아파트 전월세 실거래 수집 → public.rents 적재.
// 사용: set -a; . ./.env.local; set +a; node scripts/ingest-rents.mjs [START=YYYY-MM] [END=YYYY-MM]
import pg from 'pg';

const API_KEY = process.env.DATA_GO_KR_API_KEY;
const PW = process.env.SUPABASE_DB_PASSWORD;
const REF = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace('https://', '').split('.')[0];
const REGION = process.env.SUPABASE_POOLER_REGION || 'aws-1-ap-northeast-2';
if (!API_KEY || !PW || !REF) { console.error('환경변수 필요'); process.exit(1); }

const LAWD = { 강남구: '11680', 서초구: '11650', 송파구: '11710', 용산구: '11170', 성동구: '11200', 마포구: '11440', 광진구: '11215', 영등포구: '11560' };
function recentRange() {
  const d = new Date(); const end = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  d.setMonth(d.getMonth() - 3); const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  return [start, end];
}
const [dS, dE] = recentRange();
const START = process.argv[2] || dS;
const END = process.argv[3] || dE;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const BASE = 'https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent';

function months(start, end) {
  const out = []; let [y, m] = start.split('-').map(Number); const [ey, em] = end.split('-').map(Number);
  while (y < ey || (y === ey && m <= em)) { out.push(`${y}${String(m).padStart(2, '0')}`); m++; if (m > 12) { m = 1; y++; } }
  return out;
}
const tag = (b, n) => { const mt = b.match(new RegExp(`<${n}>([\\s\\S]*?)</${n}>`)); return mt ? mt[1].trim() : ''; };
const num = (s) => parseInt((s || '').replace(/[^0-9]/g, ''), 10) || 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchMonth(lawd, ym) {
  const url = `${BASE}?serviceKey=${API_KEY}&LAWD_CD=${lawd}&DEAL_YMD=${ym}&numOfRows=4000&pageNo=1`;
  const xml = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();
  if (!xml.includes('<resultCode>000')) return [];
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
}
function parse(region, lawd, b) {
  const y = tag(b, 'dealYear'), mo = tag(b, 'dealMonth'), d = tag(b, 'dealDay');
  const deposit = num(tag(b, 'deposit'));
  if (!y || !mo || !d || !deposit) return null;
  return {
    region, lawd_cd: lawd, apt_name: tag(b, 'aptNm') || null, dong: tag(b, 'umdNm') || null,
    deposit, monthly_rent: num(tag(b, 'monthlyRent')),
    area: parseFloat(tag(b, 'excluUseAr')) || null, floor: parseInt(tag(b, 'floor'), 10) || null,
    build_year: parseInt(tag(b, 'buildYear'), 10) || null,
    deal_date: `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
  };
}

const client = new pg.Client({ connectionString: `postgresql://postgres.${REF}:${PW}@${REGION}.pooler.supabase.com:5432/postgres`, ssl: { rejectUnauthorized: false } });
await client.connect();
const COLS = ['region', 'lawd_cd', 'apt_name', 'dong', 'deposit', 'monthly_rent', 'area', 'floor', 'build_year', 'deal_date'];
const ms = months(START, END);
console.log(`전월세 수집: ${Object.keys(LAWD).length}구 × ${ms.length}개월 (${START}~${END})`);
let totalIn = 0;
for (const [region, lawd] of Object.entries(LAWD)) {
  let c = 0;
  for (const ym of ms) {
    const rows = (await fetchMonth(lawd, ym)).map((b) => parse(region, lawd, b)).filter(Boolean);
    c += rows.length;
    for (let i = 0; i < rows.length; i += 200) {
      const chunk = rows.slice(i, i + 200); const ph = []; const vals = [];
      chunk.forEach((r, k) => { const o = k * COLS.length; ph.push(`(${COLS.map((_, j) => `$${o + j + 1}`).join(',')})`); vals.push(...COLS.map((cc) => r[cc])); });
      const res = await client.query(`insert into public.rents (${COLS.join(',')}) values ${ph.join(',')} on conflict do nothing`, vals);
      totalIn += res.rowCount;
    }
    await sleep(150);
  }
  console.log(`  ${region}: ${c}건`);
}
const { rows } = await client.query("select count(*)::int n, count(*) filter (where monthly_rent=0)::int jeonse from public.rents");
console.log(`적재 신규 ${totalIn}. rents 총 ${rows[0].n}건 (전세 ${rows[0].jeonse})`);
await client.end();
