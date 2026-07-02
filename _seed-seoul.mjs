import pg from 'pg'; import fs from 'fs';
const API=process.env.DATA_GO_KR_API_KEY, PW=process.env.SUPABASE_DB_PASSWORD;
const REF=process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://','').split('.')[0];
const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const TRADE='https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev';
const RENT='https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent';
const tag=(b,n)=>{const m=b.match(new RegExp(`<${n}>([\\s\\S]*?)</${n}>`));return m?m[1].trim():'';};
const num=s=>parseInt((s||'').replace(/[^0-9-]/g,''),10)||0;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const yms=(()=>{const o=[];const d=new Date();for(let i=0;i<3;i++){o.push(`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}`);d.setMonth(d.getMonth()-1);}return o;})();
async function items(base,lawd,ym,rows){const x=await(await fetch(`${base}?serviceKey=${API}&LAWD_CD=${lawd}&DEAL_YMD=${ym}&numOfRows=${rows}&pageNo=1`,{headers:{'User-Agent':UA}})).text();if(!x.includes('<resultCode>'))return[];return[...x.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m=>m[1]);}
const sgg=JSON.parse(fs.readFileSync(process.env.SCR+'/sigungu.json','utf8')).filter(s=>s.code.startsWith('11')&&s.name.endsWith('구'));
const TXC=['region','lawd_cd','apt_name','dong','deal_amount','area','floor','build_year','deal_date','cdeal_type'];
const RTC=['region','lawd_cd','apt_name','dong','deposit','monthly_rent','area','floor','build_year','deal_date'];
async function bulk(c,t,cols,rows){let n=0;for(let i=0;i<rows.length;i+=200){const ch=rows.slice(i,i+200);const ph=[],v=[];ch.forEach((r,k)=>{const o=k*cols.length;ph.push(`(${cols.map((_,j)=>`$${o+j+1}`).join(',')})`);v.push(...cols.map(x=>r[x]));});n+=(await c.query(`insert into public.${t} (${cols.join(',')}) values ${ph.join(',')} on conflict do nothing`,v)).rowCount??0;}return n;}
const c=new pg.Client({connectionString:`postgresql://postgres.${REF}:${PW}@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres`,ssl:{rejectUnauthorized:false}});
await c.connect();
let T=0,R=0;
for(const s of sgg){
  let tx=[],rt=[];
  for(const ym of yms){
    tx.push(...(await items(TRADE,s.code,ym,2000)).map(b=>{if(tag(b,'cdealType')==='O')return null;const a=num(tag(b,'dealAmount')),y=tag(b,'dealYear'),mo=tag(b,'dealMonth'),d=tag(b,'dealDay');if(!a||!y)return null;return{region:s.name,lawd_cd:s.code,apt_name:tag(b,'aptNm')||null,dong:tag(b,'umdNm')||null,deal_amount:a,area:parseFloat(tag(b,'excluUseAr'))||null,floor:parseInt(tag(b,'floor'),10)||null,build_year:parseInt(tag(b,'buildYear'),10)||null,deal_date:`${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`,cdeal_type:tag(b,'cdealType')||null};}).filter(Boolean));
    rt.push(...(await items(RENT,s.code,ym,4000)).map(b=>{const dep=num(tag(b,'deposit')),y=tag(b,'dealYear'),mo=tag(b,'dealMonth'),d=tag(b,'dealDay');if(!dep||!y)return null;return{region:s.name,lawd_cd:s.code,apt_name:tag(b,'aptNm')||null,dong:tag(b,'umdNm')||null,deposit:dep,monthly_rent:num(tag(b,'monthlyRent')),area:parseFloat(tag(b,'excluUseAr'))||null,floor:parseInt(tag(b,'floor'),10)||null,build_year:parseInt(tag(b,'buildYear'),10)||null,deal_date:`${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`};}).filter(Boolean));
    await sleep(100);
  }
  T+=await bulk(c,'transactions',TXC,tx); R+=await bulk(c,'rents',RTC,rt);
  process.stdout.write('.');
}
console.log(`\n서울 25구 신규: 매매 ${T} · 전세 ${R}`);
await c.end();
