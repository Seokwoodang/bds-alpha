import pg from 'pg';

const pw = process.env.SUPABASE_DB_PASSWORD;
if (!pw) { console.error('환경변수 SUPABASE_DB_PASSWORD가 필요합니다.'); process.exit(1); }
const ref = 'zvbysnzonvgsgtwmzvqi';
const cs = `postgresql://postgres.${ref}:${pw}@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres`;

const EMAIL = 'e2e@bds.test';
const PASS = 'Test1234!';

const client = new pg.Client({ connectionString: cs, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
await client.connect();
await client.query('create extension if not exists pgcrypto');
// 깨끗하게 재생성(멱등)
await client.query('delete from auth.identities where identity_data->>$1 = $2', ['email', EMAIL]);
await client.query('delete from auth.users where email=$1', [EMAIL]);

const { rows } = await client.query(
  `insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change)
   values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated','authenticated',$1, crypt($2, gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{}', '', '', '', '')
   returning id`,
  [EMAIL, PASS],
);
const uid = rows[0].id;
await client.query(
  `insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
   values (gen_random_uuid(), $1, jsonb_build_object('sub', $1::text, 'email', $2::text, 'email_verified', true), 'email', $1::text, now(), now(), now())`,
  [uid, EMAIL],
);
console.log('CREATED e2e user + identity', EMAIL, uid);
await client.end();
