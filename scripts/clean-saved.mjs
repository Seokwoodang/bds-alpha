import pg from 'pg';
const pw = process.env.SUPABASE_DB_PASSWORD;
if (!pw) { console.error('환경변수 SUPABASE_DB_PASSWORD가 필요합니다.'); process.exit(1); }
const cs=`postgresql://postgres.zvbysnzonvgsgtwmzvqi:${pw}@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres`;
const c=new pg.Client({connectionString:cs,ssl:{rejectUnauthorized:false}});
await c.connect();
const r=await c.query("delete from public.saved_listings where user_id=(select id from auth.users where email='e2e@bds.test')");
console.log('cleared saved rows:', r.rowCount);
await c.end();
