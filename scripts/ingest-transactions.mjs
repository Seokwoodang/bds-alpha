// 국토부 아파트 매매 실거래가(상세) 수집 → public.transactions 적재.
// 사용: set -a; . ./.env.local; set +a; node scripts/ingest-transactions.mjs [START=YYYY-MM] [END=YYYY-MM]
import pg from 'pg';

const API_KEY = process.env.DATA_GO_KR_API_KEY;
const PW = process.env.SUPABASE_DB_PASSWORD;
const REF = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace('https://', '').split('.')[0];
const REGION = process.env.SUPABASE_POOLER_REGION || 'aws-1-ap-northeast-2';
if (!API_KEY || !PW || !REF) { console.error('환경변수(DATA_GO_KR_API_KEY/SUPABASE_DB_PASSWORD/NEXT_PUBLIC_SUPABASE_URL) 필요'); process.exit(1); }

const LAWD = { 강남구: '11680', 서초구: '11650', 송파구: '11710', 용산구: '11170', 성동구: '11200', 마포구: '11440', 광진구: '11215', 영등포구: '11560' };
const START = process.argv[2] || '2025-05';
const END = process.argv[3] || '2026-05';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const BASE = 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev';

function months(start, end) {
  const out = []; let [y, m] = start.split('-').map(Number); const [ey, em] = end.split('-').map(Number);
  while (y < ey || (y === ey && m <= em)) { out.push(`${y}${String(m).padStart(2, '0')}`); m++; if (m > 12) { m = 1; y++; } }
  return out;
}
const tag = (block, name) => { const mt = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`)); return mt ? mt[1].trim() : ''; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchMonth(lawd, ym) {
  const url = `${BASE}?serviceKey=${API_KEY}&LAWD_CD=${lawd}&DEAL_YMD=${ym}&numOfRows=2000&pageNo=1`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const xml = await res.text();
  if (!xml.includes('<resultCode>000')) {
    if (xml.includes('<resultCode>') ) return []; // 정상이나 데이터 없음/기타
    throw new Error(`API 응답 이상 (${lawd}/${ym}): ${xml.slice(0, 120)}`);
  }
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((mm) => mm[1]);
}

function parseItem(region, lawd, block) {
  const cdeal = tag(block, 'cdealType');
  if (cdeal === 'O') return null; // 해제(취소) 거래 제외
  const amount = parseInt(tag(block, 'dealAmount').replace(/[^0-9]/g, ''), 10);
  const y = tag(block, 'dealYear'), mo = tag(block, 'dealMonth'), d = tag(block, 'dealDay');
  if (!amount || !y || !mo || !d) return null;
  return {
    region, lawd_cd: lawd,
    apt_name: tag(block, 'aptNm') || null,
    dong: tag(block, 'umdNm') || null,
    deal_amount: amount,
    area: parseFloat(tag(block, 'excluUseAr')) || null,
    floor: parseInt(tag(block, 'floor'), 10) || null,
    build_year: parseInt(tag(block, 'buildYear'), 10) || null,
    deal_date: `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    cdeal_type: cdeal || null,
  };
}

const client = new pg.Client({ connectionString: `postgresql://postgres.${REF}:${PW}@${REGION}.pooler.supabase.com:5432/postgres`, ssl: { rejectUnauthorized: false } });
await client.connect();

const ms = months(START, END);
console.log(`수집: ${Object.keys(LAWD).length}개 구 × ${ms.length}개월 (${START}~${END})`);
let totalIn = 0;
const COLS = ['region', 'lawd_cd', 'apt_name', 'dong', 'deal_amount', 'area', 'floor', 'build_year', 'deal_date', 'cdeal_type'];
for (const [region, lawd] of Object.entries(LAWD)) {
  let regionCount = 0;
  for (const ym of ms) {
    const blocks = await fetchMonth(lawd, ym);
    const rows = blocks.map((b) => parseItem(region, lawd, b)).filter(Boolean);
    regionCount += rows.length;
    for (let i = 0; i < rows.length; i += 200) {
      const chunk = rows.slice(i, i + 200);
      const ph = []; const vals = [];
      chunk.forEach((r, k) => {
        const o = k * COLS.length;
        ph.push(`(${COLS.map((_, j) => `$${o + j + 1}`).join(',')})`);
        vals.push(...COLS.map((c) => r[c]));
      });
      const res = await client.query(`insert into public.transactions (${COLS.join(',')}) values ${ph.join(',')} on conflict do nothing`, vals);
      totalIn += res.rowCount;
    }
    await sleep(150); // WAF 레이트 회피
  }
  console.log(`  ${region}: 파싱 ${regionCount}건`);
}
const { rows: cnt } = await client.query('select count(*)::int n, min(deal_date) lo, max(deal_date) hi from public.transactions');
console.log(`적재 신규 ${totalIn}건. transactions 총 ${cnt[0].n}건 (${cnt[0].lo}~${cnt[0].hi})`);
await client.end();
