import pg from 'pg';
const pw = process.env.SUPABASE_DB_PASSWORD;
if (!pw) { console.error('환경변수 SUPABASE_DB_PASSWORD가 필요합니다.'); process.exit(1); }
const ref=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').replace('https://','').split('.')[0];
const region=process.env.SUPABASE_POOLER_REGION||'aws-1-ap-northeast-2';
const cs=`postgresql://postgres.${ref}:${pw}@${region}.pooler.supabase.com:5432/postgres`;
const c=new pg.Client({connectionString:cs,ssl:{rejectUnauthorized:false}});
await c.connect();
const uid="(select id from auth.users where email='e2e@bds.test')";
const r=await c.query(`delete from public.saved_listings where user_id=${uid}`);
const p=await c.query(`delete from public.properties where user_id=${uid}`);
console.log('cleared saved:', r.rowCount, 'properties:', p.rowCount);
await c.end();
