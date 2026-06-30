'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PROPERTY_REGIONS, PROPERTY_TYPES, validateProperty, hasErrors, formatPriceManwon, type PropertyErrors } from '@/lib/property';
import { addProperty, updateProperty } from '@/lib/queries/properties';
import type { Property, PropertyInput } from '@/lib/types';

const field: React.CSSProperties = { width: '100%', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', fontFamily: 'inherit', fontSize: 14, color: 'var(--ink)', outline: 'none', background: '#fff' };
const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 };
const errStyle: React.CSSProperties = { fontSize: 12, color: 'var(--down)', marginTop: 3 };

function blank(): PropertyInput {
  return { name: '', region: '', dong: '', type: '', area: '', purchase_price: '', purchase_date: '', memo: '', is_rental: false, deposit: '', monthly_rent: '', rent_day: '', lease_start: '', lease_end: '' };
}
function fromProperty(p: Property): PropertyInput {
  return {
    name: p.name, region: p.region, dong: p.dong ?? '', type: p.type, area: p.area,
    purchase_price: p.purchase_price, purchase_date: p.purchase_date, memo: p.memo ?? '',
    is_rental: p.is_rental, deposit: p.deposit || '', monthly_rent: p.monthly_rent || '',
    rent_day: p.rent_day ?? '', lease_start: p.lease_start ?? '', lease_end: p.lease_end ?? '',
  };
}

export function PropertyForm({ editing, onDone }: { editing: Property | null; onDone: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState<PropertyInput>(editing ? fromProperty(editing) : blank());
  const [errors, setErrors] = useState<PropertyErrors>({});
  const [pending, startTransition] = useTransition();

  function set<K extends keyof PropertyInput>(k: K, v: PropertyInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateProperty(form, new Date());
    setErrors(errs);
    if (hasErrors(errs)) return;
    startTransition(async () => {
      if (editing) await updateProperty(editing.id, form);
      else await addProperty(form);
      router.refresh();
      onDone();
    });
  }

  const priceNum = Number(form.purchase_price);

  return (
    <form onSubmit={onSubmit} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 20, marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
      <div style={{ gridColumn: '1 / -1', fontSize: 16, fontWeight: 800, color: 'var(--navy)' }}>{editing ? '자산 수정' : '자산 추가'}</div>

      <div>
        <label style={label} htmlFor="p-name">단지명/별칭</label>
        <input id="p-name" style={field} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="예: 우리집, 라이프 청담" />
        {errors.name && <div style={errStyle}>{errors.name}</div>}
      </div>
      <div>
        <label style={label} htmlFor="p-region">지역</label>
        <select id="p-region" style={field} value={form.region} onChange={(e) => set('region', e.target.value)}>
          <option value="">선택</option>
          {PROPERTY_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        {errors.region && <div style={errStyle}>{errors.region}</div>}
      </div>
      <div>
        <label style={label} htmlFor="p-dong">동 (선택)</label>
        <input id="p-dong" style={field} value={form.dong ?? ''} onChange={(e) => set('dong', e.target.value)} placeholder="예: 청담동" />
      </div>
      <div>
        <label style={label} htmlFor="p-type">매물 유형</label>
        <select id="p-type" style={field} value={form.type} onChange={(e) => set('type', e.target.value)}>
          <option value="">선택</option>
          {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {errors.type && <div style={errStyle}>{errors.type}</div>}
      </div>
      <div>
        <label style={label} htmlFor="p-area">전용면적 (㎡)</label>
        <input id="p-area" type="number" step="0.1" style={field} value={form.area} onChange={(e) => set('area', e.target.value === '' ? '' : Number(e.target.value))} />
        {errors.area && <div style={errStyle}>{errors.area}</div>}
      </div>
      <div>
        <label style={label} htmlFor="p-price">매입가 (만원)</label>
        <input id="p-price" type="number" style={field} value={form.purchase_price} onChange={(e) => set('purchase_price', e.target.value === '' ? '' : Number(e.target.value))} placeholder="예: 245000" />
        {priceNum > 0 && <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 3 }}>= {formatPriceManwon(priceNum)}</div>}
        {errors.purchase_price && <div style={errStyle}>{errors.purchase_price}</div>}
      </div>
      <div>
        <label style={label} htmlFor="p-date">매입일</label>
        <input id="p-date" type="date" style={field} value={form.purchase_date} onChange={(e) => set('purchase_date', e.target.value)} />
        {errors.purchase_date && <div style={errStyle}>{errors.purchase_date}</div>}
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <label style={label} htmlFor="p-memo">메모 (선택)</label>
        <input id="p-memo" style={field} value={form.memo ?? ''} onChange={(e) => set('memo', e.target.value)} placeholder="투자 메모" />
      </div>

      <label style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: 'var(--navy)', cursor: 'pointer' }}>
        <input type="checkbox" checked={!!form.is_rental} onChange={(e) => set('is_rental', e.target.checked)} />
        임대(월세) 주는 물건 — 지식산업센터·상가·오피스텔 등
      </label>

      {form.is_rental && (
        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, background: 'var(--bg-2,#F7F9FC)', border: '1px solid var(--line)', borderRadius: 12, padding: 16 }}>
          <div>
            <label style={label} htmlFor="p-deposit">보증금 (만원)</label>
            <input id="p-deposit" type="number" style={field} value={form.deposit ?? ''} onChange={(e) => set('deposit', e.target.value === '' ? '' : Number(e.target.value))} placeholder="예: 10000" />
          </div>
          <div>
            <label style={label} htmlFor="p-rent">월세 (만원)</label>
            <input id="p-rent" type="number" style={field} value={form.monthly_rent ?? ''} onChange={(e) => set('monthly_rent', e.target.value === '' ? '' : Number(e.target.value))} placeholder="예: 300" />
            {errors.monthly_rent && <div style={errStyle}>{errors.monthly_rent}</div>}
          </div>
          <div>
            <label style={label} htmlFor="p-rentday">월세 수령일 (1~31)</label>
            <input id="p-rentday" type="number" min={1} max={31} style={field} value={form.rent_day ?? ''} onChange={(e) => set('rent_day', e.target.value === '' ? '' : Number(e.target.value))} placeholder="예: 25" />
            {errors.rent_day && <div style={errStyle}>{errors.rent_day}</div>}
          </div>
          <div>
            <label style={label} htmlFor="p-lstart">계약 시작일</label>
            <input id="p-lstart" type="date" style={field} value={form.lease_start ?? ''} onChange={(e) => set('lease_start', e.target.value)} />
          </div>
          <div>
            <label style={label} htmlFor="p-lend">계약 만기일</label>
            <input id="p-lend" type="date" style={field} value={form.lease_end ?? ''} onChange={(e) => set('lease_end', e.target.value)} />
            {errors.lease_end && <div style={errStyle}>{errors.lease_end}</div>}
          </div>
        </div>
      )}

      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onDone} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 700, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
        <button type="submit" disabled={pending} style={{ background: 'var(--primary)', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', opacity: pending ? 0.6 : 1 }}>{editing ? '수정' : '추가'}</button>
      </div>
    </form>
  );
}
