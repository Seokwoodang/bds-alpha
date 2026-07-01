import 'server-only';
import pg from 'pg';

/**
 * 국토부 아파트 실거래가(매매·전월세) 온디맨드 수집.
 * 특정 시군구(lawd)의 최근 N개월을 받아 transactions/rents에 upsert(중복은 on conflict do nothing).
 * 서버 전용. DB는 Supabase 풀러(pg 직결, SUPABASE_DB_PASSWORD). WAF 회피용 브라우저 User-Agent 필수.
 */

const API_KEY = process.env.DATA_GO_KR_API_KEY!;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const TRADE = 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev';
const RENT = 'https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent';

function poolerClient() {
  const ref = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace('https://', '').split('.')[0];
  const region = process.env.SUPABASE_POOLER_REGION || 'aws-1-ap-northeast-2';
  return new pg.Client({
    connectionString: `postgresql://postgres.${ref}:${process.env.SUPABASE_DB_PASSWORD}@${region}.pooler.supabase.com:5432/postgres`,
    ssl: { rejectUnauthorized: false },
  });
}

const tag = (block: string, name: string) => {
  const m = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? m[1].trim() : '';
};
const num = (s: string) => parseInt((s || '').replace(/[^0-9-]/g, ''), 10) || 0;

/** 최근 n개월 YYYYMM 배열(현재월 포함). */
export function recentMonths(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    out.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`);
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

async function fetchItems(base: string, lawd: string, ym: string, rows: number): Promise<string[]> {
  const url = `${base}?serviceKey=${API_KEY}&LAWD_CD=${lawd}&DEAL_YMD=${ym}&numOfRows=${rows}&pageNo=1`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const xml = await res.text();
  if (!xml.includes('<resultCode>')) throw new Error(`국토부 응답 이상: ${xml.slice(0, 100)}`);
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
}

function parseTrade(region: string, lawd: string, b: string) {
  if (tag(b, 'cdealType') === 'O') return null;
  const amount = num(tag(b, 'dealAmount'));
  const y = tag(b, 'dealYear'), mo = tag(b, 'dealMonth'), d = tag(b, 'dealDay');
  if (!amount || !y || !mo || !d) return null;
  return {
    region, lawd_cd: lawd, apt_name: tag(b, 'aptNm') || null, dong: tag(b, 'umdNm') || null,
    deal_amount: amount, area: parseFloat(tag(b, 'excluUseAr')) || null,
    floor: parseInt(tag(b, 'floor'), 10) || null, build_year: parseInt(tag(b, 'buildYear'), 10) || null,
    deal_date: `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`, cdeal_type: tag(b, 'cdealType') || null,
  };
}

function parseRent(region: string, lawd: string, b: string) {
  const deposit = num(tag(b, 'deposit'));
  const y = tag(b, 'dealYear'), mo = tag(b, 'dealMonth'), d = tag(b, 'dealDay');
  if (!deposit || !y || !mo || !d) return null;
  return {
    region, lawd_cd: lawd, apt_name: tag(b, 'aptNm') || null, dong: tag(b, 'umdNm') || null,
    deposit, monthly_rent: num(tag(b, 'monthlyRent')), area: parseFloat(tag(b, 'excluUseAr')) || null,
    floor: parseInt(tag(b, 'floor'), 10) || null, build_year: parseInt(tag(b, 'buildYear'), 10) || null,
    deal_date: `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
  };
}

export interface IngestResult { tx: number; rent: number }

const TX_COLS = ['region', 'lawd_cd', 'apt_name', 'dong', 'deal_amount', 'area', 'floor', 'build_year', 'deal_date', 'cdeal_type'];
const RENT_COLS = ['region', 'lawd_cd', 'apt_name', 'dong', 'deposit', 'monthly_rent', 'area', 'floor', 'build_year', 'deal_date'];

async function bulkInsert(client: pg.Client, table: string, cols: string[], rows: Record<string, unknown>[]): Promise<number> {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    const ph: string[] = []; const vals: unknown[] = [];
    chunk.forEach((r, k) => {
      const o = k * cols.length;
      ph.push(`(${cols.map((_, j) => `$${o + j + 1}`).join(',')})`);
      vals.push(...cols.map((c) => r[c]));
    });
    const res = await client.query(`insert into public.${table} (${cols.join(',')}) values ${ph.join(',')} on conflict do nothing`, vals);
    inserted += res.rowCount ?? 0;
  }
  return inserted;
}

/** 시군구 1곳의 최근 months개월 매매+전세 수집·적재. months 기본 6. */
export async function ingestRegion(lawd: string, region: string, months = 6): Promise<IngestResult> {
  const yms = recentMonths(months);
  // 매매 + 전세를 월별로 병렬 fetch
  const [tradeBlocks, rentBlocks] = await Promise.all([
    Promise.all(yms.map((ym) => fetchItems(TRADE, lawd, ym, 2000))).then((a) => a.flat()),
    Promise.all(yms.map((ym) => fetchItems(RENT, lawd, ym, 4000))).then((a) => a.flat()),
  ]);
  const txRows = tradeBlocks.map((b) => parseTrade(region, lawd, b)).filter(Boolean) as Record<string, unknown>[];
  const rentRows = rentBlocks.map((b) => parseRent(region, lawd, b)).filter(Boolean) as Record<string, unknown>[];

  const client = poolerClient();
  await client.connect();
  try {
    const tx = await bulkInsert(client, 'transactions', TX_COLS, txRows);
    const rent = await bulkInsert(client, 'rents', RENT_COLS, rentRows);
    return { tx, rent };
  } finally {
    await client.end();
  }
}
