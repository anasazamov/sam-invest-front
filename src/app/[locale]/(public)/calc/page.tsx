'use client'

import LocationPicker, {
    ResolvedLocation,
} from '@/components/calc/location-picker'
import { ChevronDown, Info, MapPin, RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

/**
 * Infratuzilma yig'imi kalkulyatori — VM 2026-yil 8-apreldagi 151-son qarori.
 * Formula: Yig'im = BHM × ((Хб + Хю) − (Ха + Хт + Ху)) × Кт × Ко × Кз × Кж
 */

const KT = [
    { v: 1, k: 'ktNew' },
    { v: 0.5, k: 'ktRenovation' },
    { v: 0.85, k: 'ktReconstruction' },
]
const KO = [
    { v: 1, k: 'koResidential' },
    { v: 0.8, k: 'koSocial' },
    { v: 0.5, k: 'koState' },
    { v: 0.5, k: 'koIndustrial' },
]
const KZ = [
    { v: 1, k: 'kz1' },
    { v: 0.5, k: 'kz2' },
    { v: 0.2, k: 'kz3' },
    { v: 0.1, k: 'kz4' },
    { v: 0.05, k: 'kz5' },
]
const KZH = [
    { v: 1, k: 'kzhCentral' },
    { v: 0.6, k: 'kzhOther' },
]

const BHM_2025 = 412000
const BHM_2026 = 440000

type VolKey = 'xb' | 'xyu' | 'xa' | 'xt' | 'xu'

const fmt = (n: number, dp = 2) =>
    n.toLocaleString('uz-UZ', { minimumFractionDigits: dp, maximumFractionDigits: dp })

const Page = () => {
    const t = useTranslations('calc')

    const [vol, setVol] = useState<Record<VolKey, string>>({
        xb: '', xyu: '', xa: '', xt: '', xu: '',
    })
    const [bhm, setBhm] = useState(String(BHM_2026))
    const [kt, setKt] = useState(KT[0].v)
    const [koIdx, setKoIdx] = useState(0)
    const [kz, setKz] = useState(KZ[1].v)
    const [kzInfo, setKzInfo] = useState<string | null>(null)
    const [kzAssumed, setKzAssumed] = useState(false)
    const [kzh, setKzh] = useState(KZH[0].v)
    const [showBreakdown, setShowBreakdown] = useState(false)

    const ko = KO[koIdx].v
    const num = (s: string) => parseFloat(s) || 0

    const ktOptions = KT.map((o) => ({ value: o.v, label: t(o.k) }))
    const koOptions = KO.map((o, i) => ({ value: i, label: t(o.k) }))
    const kzOptions = KZ.map((o) => ({ value: o.v, label: `${t(o.k)} (${o.v})` }))
    const kzhOptions = KZH.map((o) => ({ value: o.v, label: t(o.k) }))

    const calc = useMemo(() => {
        const bhmV = num(bhm)
        const positive = num(vol.xb) + num(vol.xyu)
        const negative = num(vol.xa) + num(vol.xt) + num(vol.xu)
        const clampedVolume = Math.max(0, positive - negative)
        const rawK = kt * ko * kz * kzh
        const effK = rawK < 0.01 ? 0.01 : rawK
        return {
            bhmV, positive, negative, clampedVolume, rawK, effK,
            floored: rawK < 0.01,
            total: bhmV * clampedVolume * effK,
            negativeVolume: positive - negative < 0,
            empty: positive === 0,
        }
    }, [bhm, vol, kt, ko, kz, kzh])

    const onVol = (k: VolKey, v: string) => {
        if (v === '' || /^\d*\.?\d*$/.test(v)) setVol((p) => ({ ...p, [k]: v }))
    }

    const handleResolved = (loc: ResolvedLocation) => {
        if (!loc.matched) return
        setKz(loc.kzValue)
        setKzAssumed(!!loc.assumed)
        setKzInfo(
            loc.assumed
                ? t('kzAssumed', { name: loc.detectedName || '—', kz: loc.kzValue })
                : t('kzResolved', {
                      city: loc.city || '',
                      pop: fmt(loc.population || 0, 0),
                      kz: loc.kzValue,
                  })
        )
    }

    const reset = () => {
        setVol({ xb: '', xyu: '', xa: '', xt: '', xu: '' })
        setBhm(String(BHM_2026))
        setKt(KT[0].v)
        setKoIdx(0)
        setKz(KZ[1].v)
        setKzInfo(null)
        setKzAssumed(false)
        setKzh(KZH[0].v)
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Sarlavha */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{t('title')}</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        {t('subtitle')} ·{' '}
                        <a
                            href="https://lex.uz/docs/8126388"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium"
                        >
                            {t('resolution')}
                        </a>
                    </p>
                </div>

                {/* Kirish yo'riqnomasi */}
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 mb-6 flex gap-3">
                    <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-900 leading-relaxed">{t('intro')}</p>
                </div>

                <div className="space-y-5">
                    {/* 1. Joy */}
                    <Card step={1} title={t('step1')}>
                        <LocationPicker onResolve={handleResolved} />
                        {kzInfo && (
                            <p className={`mt-3 flex items-start gap-1.5 rounded-lg px-3 py-2 text-sm ${
                                kzAssumed ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                {kzInfo}
                            </p>
                        )}
                        <div className="mt-3">
                            <Label help={t('zoneHelp')}>{t('zoneLabel')} (Кз)</Label>
                            <Select
                                value={kz}
                                onChange={(v) => { setKz(v); setKzInfo(null); setKzAssumed(false) }}
                                options={kzOptions}
                            />
                        </div>
                    </Card>

                    {/* 2. Hajmlar */}
                    <Card step={2} title={t('step2')}>
                        <NumField label={t('xbLabel')} help={t('xbHelp')} value={vol.xb} onChange={(v) => onVol('xb', v)} unit="m³" big sign="+" />
                        <div className="mt-4">
                            <NumField label={t('xyuLabel')} help={t('xyuHelp')} value={vol.xyu} onChange={(v) => onVol('xyu', v)} unit="m³" sign="+" />
                        </div>

                        <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-4">
                            <p className="flex items-start gap-2 text-sm text-slate-600 mb-4">
                                <Info className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
                                {t('deductNote')}
                            </p>
                            <div className="space-y-4">
                                <NumField label={t('xaLabel')} help={t('xaHelp')} value={vol.xa} onChange={(v) => onVol('xa', v)} unit="m³" sign="−" />
                                <NumField label={t('xtLabel')} help={t('xtHelp')} value={vol.xt} onChange={(v) => onVol('xt', v)} unit="m³" sign="−" />
                                <NumField label={t('xuLabel')} help={t('xuHelp')} value={vol.xu} onChange={(v) => onVol('xu', v)} unit="m³" sign="−" />
                            </div>
                        </div>

                        <div className="mt-5 max-w-xs">
                            <Label help={t('bhmHelp', { prev: fmt(BHM_2025, 0) })}>{t('bhmLabel')}</Label>
                            <NumField value={bhm} onChange={(v) => (v === '' || /^\d*$/.test(v)) && setBhm(v)} unit={t('currency')} />
                        </div>
                    </Card>

                    {/* 3. Obyekt */}
                    <Card step={3} title={t('step3')}>
                        <div className="space-y-5">
                            <div>
                                <Label>{t('ktLabel')}</Label>
                                <Segmented value={kt} onChange={setKt} options={ktOptions} />
                            </div>
                            <div>
                                <Label>{t('koLabel')}</Label>
                                <Select value={koIdx} onChange={setKoIdx} options={koOptions} />
                            </div>
                            <div>
                                <Label help={t('kzhHelp')}>{t('kzhLabel')}</Label>
                                <Segmented value={kzh} onChange={setKzh} options={kzhOptions} />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Natija */}
                <div className="mt-6 rounded-2xl bg-[#0A0A3D] text-white p-6 shadow-lg">
                    <p className="text-sm text-blue-200/80">{t('resultLabel')}</p>
                    <div className="mt-1 text-4xl font-bold tabular-nums">
                        {fmt(calc.total)}
                        <span className="text-xl font-medium text-blue-200/70"> {t('currency')}</span>
                    </div>
                    {calc.empty && <p className="mt-2 text-sm text-blue-200/70">{t('emptyHint')}</p>}
                    {calc.negativeVolume && (
                        <p className="mt-2 text-sm bg-white/10 rounded-lg px-3 py-2">⚠️ {t('negativeWarn')}</p>
                    )}
                    <button
                        onClick={() => setShowBreakdown((s) => !s)}
                        className="mt-4 inline-flex items-center gap-1.5 text-sm text-blue-200 hover:text-white"
                    >
                        {t('showBreakdown')}
                        <ChevronDown className={`h-4 w-4 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showBreakdown && (
                        <div className="mt-3 pt-3 border-t border-white/10 space-y-2 text-sm">
                            <BRow k={t('brNet')} v={fmt(calc.clampedVolume)} />
                            <BRow k={t('brCoef')} v={fmt(calc.rawK, 4)} />
                            {calc.floored && <BRow k={t('brMin')} v={t('brApplied')} warn />}
                            <BRow k={t('brBhm')} v={`${fmt(calc.bhmV, 0)} ${t('currency')}`} />
                            <p className="pt-1 text-[11px] text-blue-200/60">
                                {fmt(calc.bhmV, 0)} × {fmt(calc.clampedVolume, 0)} × {fmt(calc.effK, 4)}
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-4">
                    <button onClick={reset} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700">
                        <RefreshCw className="h-4 w-4" /> {t('reset')}
                    </button>
                </div>

                {/* Undirilmaydigan holatlar */}
                <div className="mt-5 rounded-2xl bg-white border border-slate-200 p-5">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">{t('exemptTitle')}</h3>
                    <ul className="space-y-1.5 text-xs text-slate-500 list-disc list-inside">
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <li key={i}>{t(`exempt${i}`)}</li>
                        ))}
                    </ul>
                </div>

                <p className="mt-6 text-center text-xs text-slate-400 leading-relaxed">
                    {t('disclaimer')}{' '}
                    <a href="https://lex.uz/docs/8126388" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        {t('resolution')}
                    </a>.
                </p>
            </div>
        </div>
    )
}

// ─── UI komponentlar ───

function Card({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
    return (
        <section className="rounded-2xl bg-white border border-slate-200 p-5 md:p-6">
            <div className="flex items-center gap-3 mb-4">
                <span className="grid place-items-center h-7 w-7 rounded-full bg-[#0A0A3D] text-white text-sm font-bold shrink-0">{step}</span>
                <h2 className="text-base md:text-lg font-bold text-slate-800">{title}</h2>
            </div>
            {children}
        </section>
    )
}

function Label({ children, help }: { children: React.ReactNode; help?: string }) {
    return (
        <div className="mb-1.5">
            <label className="block text-sm font-semibold text-slate-700">{children}</label>
            {help && <p className="text-xs text-slate-400 mt-0.5">{help}</p>}
        </div>
    )
}

function NumField({
    label, help, value, onChange, unit, big, sign,
}: {
    label?: string
    help?: string
    value: string
    onChange: (v: string) => void
    unit: string
    big?: boolean
    sign?: '+' | '−'
}) {
    return (
        <div>
            {label && (
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
                    {sign && (
                        <span className={`inline-grid place-items-center h-5 w-5 rounded text-xs font-bold ${
                            sign === '+' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'
                        }`}>{sign}</span>
                    )}
                    {label}
                </label>
            )}
            {help && <p className="text-xs text-slate-400 mb-1.5">{help}</p>}
            <div className="relative">
                <input
                    type="text"
                    inputMode="decimal"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="0"
                    className={`w-full rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition tabular-nums ${
                        big ? 'pl-4 pr-14 py-3.5 text-xl' : 'pl-3 pr-12 py-2.5'
                    }`}
                />
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none ${big ? 'text-base' : 'text-sm'}`}>
                    {unit}
                </span>
            </div>
        </div>
    )
}

function Select<T extends number>({
    value, onChange, options,
}: {
    value: T
    onChange: (v: T) => void
    options: { value: T; label: string }[]
}) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(Number(e.target.value) as T)}
                className="w-full appearance-none pl-3 pr-9 py-2.5 rounded-lg border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-slate-800 text-sm"
            >
                {options.map((o, i) => (
                    <option key={i} value={o.value}>{o.label}</option>
                ))}
            </select>
            <ChevronDown className="h-4 w-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
    )
}

function Segmented<T extends number>({
    value, onChange, options,
}: {
    value: T
    onChange: (v: T) => void
    options: { value: T; label: string }[]
}) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {options.map((o, i) => {
                const active = value === o.value
                return (
                    <button
                        key={i}
                        onClick={() => onChange(o.value)}
                        className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition text-center ${
                            active ? 'border-[#0A0A3D] bg-[#0A0A3D] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                    >
                        {o.label}
                    </button>
                )
            })}
        </div>
    )
}

function BRow({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
    return (
        <div className="flex justify-between gap-3">
            <span className="text-blue-200/70">{k}</span>
            <span className={`tabular-nums ${warn ? 'text-amber-300' : 'text-white'}`}>{v}</span>
        </div>
    )
}

export default Page
