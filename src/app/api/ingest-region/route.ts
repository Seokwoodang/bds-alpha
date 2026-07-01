import { NextRequest, NextResponse } from 'next/server';
import { ingestRegion } from '@/lib/ingest/molit';
import { CODE_TO_SIGUNGU } from '@/lib/regions-kr';

export const runtime = 'nodejs';
export const maxDuration = 60; // 온디맨드 수집(국토부 다중 호출) 여유

/** POST /api/ingest-region  { code, months? } → 해당 시군구 최근 N개월 매매+전세 수집. */
export async function POST(req: NextRequest) {
  let body: { code?: string; months?: number };
  try { body = await req.json(); } catch { body = {}; }
  const code = String(body.code ?? '').trim();
  const sgg = CODE_TO_SIGUNGU[code];
  if (!sgg) return NextResponse.json({ error: '알 수 없는 시군구 코드' }, { status: 400 });

  const months = Math.min(Math.max(Number(body.months) || 6, 1), 13);
  try {
    const result = await ingestRegion(code, sgg.name, months);
    return NextResponse.json({ ok: true, code, region: sgg.name, ...result });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
