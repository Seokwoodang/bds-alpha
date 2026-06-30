// 실거래(transactions)에서 최근 거래를 골라 listings 테이블을 실데이터로 교체.
// 더미 9건 → 실제 단지·가격. roi 없음(0→"—"), deal 전부 매매. 광진구는 1건(유사매물 0 케이스용).
import pg from 'pg';

const PW = process.env.SUPABASE_DB_PASSWORD;
const REF = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace('https://', '').split('.')[0];
const REGION = process.env.SUPABASE_POOLER_REGION || 'aws-1-ap-northeast-2';
if (!PW || !REF) { console.error('환경변수 필요'); process.exit(1); }

const PER_REGION = { 광진구: 1 }; // 기본 6, 광진구만 1
const DEFAULT_N = 6;

function priceText(manwon) {
  const eok = Math.floor(manwon / 10000), man = manwon % 10000;
  if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString('ko-KR')}`;
  if (eok > 0) return `${eok}억`;
  return `${man.toLocaleString('ko-KR')}만`;
}
function tagsFor(t) {
  const tags = [];
  if (t.build_year >= 2021) tags.push('신축'); else if (2026 - t.build_year <= 15) tags.push('준신축'); else tags.push('구축');
  if (t.area >= 85) tags.push('대형'); else if (t.area <= 45) tags.push('소형'); else tags.push('중형');
  return tags;
}

const client = new pg.Client({ connectionString: `postgresql://postgres.${REF}:${PW}@${REGION}.pooler.supabase.com:5432/postgres`, ssl: { rejectUnauthorized: false } });
await client.connect();

// 지역별 최근 거래(단지 중복 제거) 추출
const regions = (await client.query('select distinct region from transactions')).rows.map((r) => r.region);
const picks = [];
for (const region of regions) {
  const n = PER_REGION[region] ?? DEFAULT_N;
  const { rows } = await client.query(
    `select distinct on (apt_name) apt_name, dong, deal_amount, area, floor, build_year, deal_date
     from transactions where region=$1 and area between 40 and 130 and apt_name is not null
     order by apt_name, deal_date desc`, [region],
  );
  // 최근 거래일 순으로 정렬해 상위 n
  rows.sort((a, b) => new Date(b.deal_date) - new Date(a.deal_date));
  rows.slice(0, n).forEach((r) => picks.push({ region, ...r }));
}

await client.query('delete from public.saved_listings'); // FK 정리(더미 저장 제거)
await client.query('delete from public.listings');

let id = 1;
for (const p of picks) {
  await client.query(
    `insert into public.listings (id,title,type,deal,region,dong,price_text,price_num,area,floor,built,roi,tags,beds)
     values ($1,$2,'아파트','매매',$3,$4,$5,$6,$7,$8,$9,0,$10,0)`,
    [id++, p.apt_name, p.region, p.dong, priceText(p.deal_amount), p.deal_amount, Math.round(p.area), `${p.floor}층`, p.build_year, tagsFor(p)],
  );
}
const { rows: cnt } = await client.query('select count(*)::int n from public.listings');
console.log(`listings 교체 완료: 실거래 ${cnt[0].n}건 (광진구 ${PER_REGION.광진구}건)`);
await client.end();
