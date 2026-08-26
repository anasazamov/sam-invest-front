'use client'

import LocationPicker, {
    ResolvedLocation,
} from '@/components/calc/location-picker'
import { Calculator, ChevronDown, Info, MapPin, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'

/**
 * Muhandislik-kommunikatsiya va transport infratuzilmasi yig'imi kalkulyatori.
 * Asos: VM 2026-yil 8-apreldagi 151-son qarori, 4-ilova (Nizom) 2-ilovasi.
 *
 * Formula: Yig'im = BHM × ((Хб + Хю) − (Ха + Хт + Ху)) × Кт × Ко × Кз × Кж
 * Cheklov: Кт×Ко×Кз×Кж koeffitsienti 0.01 dan kam bo'lsa — 0.01 ga tenglashadi.
 */

const KT_OPTIONS = [
    { value: 1, label: 'Yangi qurilish (rivojlanish)' },
    { value: 0.5, label: 'Renovatsiya' },
    { value: 0.85, label: 'Obyektni rekonstruksiya qilish' },
]

const KO_OPTIONS = [
    { value: 0.8, label: 'Ijtimoiy-xususiy obyekt (o‘quv markazi, xususiy klinika va b.)' },
    { value: 0.5, label: 'Davlat ulushi 50%+ investitsiya loyihasi obyekti' },
    { value: 0.5, label: 'Sanoat binosi (ishlab chiqarish/ombor) — har qavat 3 m gacha' },
    { value: 1, label: 'Boshqa obyektlar' },
]

const KZ_OPTIONS = [
    { value: 1, label: '1 mln kishidan ortiq shahar (Toshkent 1–2)' },
    { value: 0.5, label: '500 ming – 1 mln kishilik shahar' },
    { value: 0.2, label: '250 ming – 500 ming kishilik shahar' },
    { value: 0.1, label: '100 ming – 250 ming kishilik shahar' },
    { value: 0.05, label: '100 minggacha / boshqa aholi punkti' },
]

const KZH_OPTIONS = [
    { value: 1, label: 'Markaziy qatnov ko‘chasida joylashgan (yoki boshqa holatlar)' },
    { value: 0.6, label: 'Markaziy qatnov ko‘chalaridan boshqa hududda' },
]

const BHM_2025 = 412000
const BHM_2026 = 440000

// Umumiy hajmga qo'shiladigan qismlar
const ADD_FIELDS = [
    { key: 'xb', symbol: 'Хб', label: 'Binoning umumiy hajmi', hint: 'Loyihadagi umumiy qurilish hajmi' },
    { key: 'xyu', symbol: 'Хю', label: 'Ruxsat etilgan qavatlardan yuqori hajm', hint: 'Belgilangan qavat sonidan oshirilgan qism hajmi (bo‘lmasa 0)' },
] as const

// Bino umumiy hajmi ICHIDAGI, ayiriladigan qismlar
const SUB_FIELDS = [
    { key: 'xa', symbol: 'Ха', label: 'Avtoturargoh qismi', hint: 'Bino ichidagi avtoturargoh hajmi' },
    { key: 'xt', symbol: 'Хт', label: 'Texnik qavatlar/inshootlar/xonalar', hint: 'Bino ichidagi texnik qism hajmi' },
    { key: 'xu', symbol: 'Ху', label: 'Umumiy foydalanishdagi qism', hint: 'Turar-joyning umumiy foydalanish qismi hajmi' },
] as const

type VolKey = 'xb' | 'xyu' | 'xa' | 'xt' | 'xu'

const fmt = (n: number, dp = 2) =>
    n.toLocaleString('uz-UZ', { minimumFractionDigits: dp, maximumFractionDigits: dp })

const Page = () => {
    const [vol, setVol] = useState<Record<VolKey, string>>({
        xb: '', xyu: '', xa: '', xt: '', xu: '',
    })
    const [bhm, setBhm] = useState(String(BHM_2026))
    const [kt, setKt] = useState(KT_OPTIONS[0].value)
    const [koIdx, setKoIdx] = useState(3)
    const [kz, setKz] = useState(KZ_OPTIONS[1].value)
    const [kzInfo, setKzInfo] = useState<string | null>(null)
    const [kzh, setKzh] = useState(KZH_OPTIONS[0].value)
    const [showExempt, setShowExempt] = useState(false)

    const ko = KO_OPTIONS[koIdx].value
    const num = (s: string) => parseFloat(s) || 0

    const calc = useMemo(() => {
        const bhmV = num(bhm)
        const positive = num(vol.xb) + num(vol.xyu)
        const negative = num(vol.xa) + num(vol.xt) + num(vol.xu)
        const netVolume = positive - negative
        const clampedVolume = Math.max(0, netVolume)
        const rawK = kt * ko * kz * kzh
        const floored = rawK < 0.01
        const effK = floored ? 0.01 : rawK
        return {
            bhmV, positive, negative, netVolume, clampedVolume,
            rawK, effK, floored, total: bhmV * clampedVolume * effK,
            negativeVolume: netVolume < 0,
        }
    }, [bhm, vol, kt, ko, kz, kzh])

    const onVol = (k: VolKey, v: string) => {
        if (v === '' || /^\d*\.?\d*$/.test(v)) setVol((p) => ({ ...p, [k]: v }))
    }

    const handleResolved = (loc: ResolvedLocation) => {
        if (!loc.matched) return
        setKz(loc.kzValue)
        if (loc.assumed) {
            setKzInfo(
                `${loc.detectedName || 'Kichik aholi punkti'} — bazada yo‘q, kichik punkt deb olindi → Кз=${loc.kzValue}. Kerak bo‘lsa qo‘lda o‘zgartiring.`
            )
        } else {
            setKzInfo(
                `${loc.city} — aholi ~${fmt(loc.population || 0, 0)} (${loc.populationYear}) → Кз=${loc.kzValue}`
            )
        }
    }

    const reset = () => {
        setVol({ xb: '', xyu: '', xa: '', xt: '', xu: '' })
        setBhm(String(BHM_2026))
        setKt(KT_OPTIONS[0].value)
        setKoIdx(3)
        setKz(KZ_OPTIONS[1].value)
        setKzInfo(null)
        setKzh(KZH_OPTIONS[0].value)
    }

    const inputCls =
        'w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all'
    const selectCls = inputCls + ' bg-white text-gray-800'
    const card = 'bg-white rounded-2xl shadow-xl p-6 md:p-8'

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Sarlavha */}
                <div className={card}>
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-3 rounded-xl shrink-0">
                            <Calculator className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                                Infratuzilma yig‘imi kalkulyatori
                            </h1>
                            <p className="text-gray-600 text-sm md:text-base mt-1">
                                VM 151-son qarori (08.04.2026) bo‘yicha
                            </p>
                        </div>
                    </div>
                </div>

                {/* 1. Joylashuv (Кз) */}
                <div className={card}>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                        1. Qurilish joyi
                    </h2>
                    <LocationPicker onResolve={handleResolved} />
                    <div className="mt-4 grid md:grid-cols-2 gap-4 items-end">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">
                                Hududiy zona (Кз)
                            </label>
                            <select
                                className={selectCls}
                                value={kz}
                                onChange={(e) => {
                                    setKz(Number(e.target.value))
                                    setKzInfo(null)
                                }}
                            >
                                {KZ_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label} — {o.value}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {kzInfo && (
                            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-800">
                                <MapPin className="w-4 h-4 shrink-0" />
                                {kzInfo}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Hajmlar */}
                <div className={card}>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">
                        2. Hajm ma‘lumotlari (m³)
                    </h2>
                    <p className="text-sm text-gray-500 mb-5">
                        Qurilish hajmlarini kub metrda kiriting.
                    </p>
                    <div className="grid md:grid-cols-2 gap-5">
                        {ADD_FIELDS.map((f) => (
                            <VolInput
                                key={f.key}
                                f={f}
                                value={vol[f.key]}
                                onChange={(v) => onVol(f.key, v)}
                                cls={inputCls}
                                positive
                            />
                        ))}
                    </div>

                    <div className="mt-6 rounded-xl border-2 border-dashed border-gray-200 p-4">
                        <div className="flex items-start gap-2 mb-4">
                            <Info className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
                            <p className="text-sm text-gray-600">
                                Quyidagi qismlar <b>bino umumiy hajmi (Хб) ichida</b>{' '}
                                bo‘lib, yig‘imdan <b>ayiriladi</b>. Agar bunday
                                qismlar bo‘lmasa — 0 qoldiring.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-5">
                            {SUB_FIELDS.map((f) => (
                                <VolInput
                                    key={f.key}
                                    f={f}
                                    value={vol[f.key]}
                                    onChange={(v) => onVol(f.key, v)}
                                    cls={inputCls}
                                    positive={false}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="mt-5 space-y-1.5 max-w-xs">
                        <label className="text-sm font-semibold text-gray-700">
                            BHM (bazaviy hisoblash miqdori), so‘m
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={bhm}
                            onChange={(e) =>
                                (e.target.value === '' || /^\d*$/.test(e.target.value)) &&
                                setBhm(e.target.value)
                            }
                            className={inputCls}
                        />
                        <p className="text-xs text-gray-500">
                            2026: {fmt(BHM_2026, 0)} so‘m · oldingi: {fmt(BHM_2025, 0)}
                        </p>
                    </div>
                </div>

                {/* 3. Koeffitsientlar */}
                <div className={card}>
                    <h2 className="text-xl font-bold text-gray-800 mb-5">
                        3. Koeffitsientlar
                    </h2>
                    <div className="grid md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">
                                Qurilish turi (Кт)
                            </label>
                            <select
                                className={selectCls}
                                value={kt}
                                onChange={(e) => setKt(Number(e.target.value))}
                            >
                                {KT_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label} — {o.value}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">
                                Obyekt turi (Ко)
                            </label>
                            <select
                                className={selectCls}
                                value={koIdx}
                                onChange={(e) => setKoIdx(Number(e.target.value))}
                            >
                                {KO_OPTIONS.map((o, i) => (
                                    <option key={i} value={i}>
                                        {o.label} — {o.value}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-sm font-semibold text-gray-700">
                                Obyekt joylashuvi (Кж)
                            </label>
                            <select
                                className={selectCls}
                                value={kzh}
                                onChange={(e) => setKzh(Number(e.target.value))}
                            >
                                {KZH_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label} — {o.value}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-amber-600 flex items-start gap-1">
                                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                                Markaziy qatnov ko‘chasi ma‘lumotini xaritadan
                                avtomatik aniqlab bo‘lmaydi — obyekt joylashuvini
                                o‘zingiz tanlang.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={reset}
                        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        <RefreshCw className="w-4 h-4" /> Tozalash
                    </button>
                </div>

                {/* Natija */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 md:p-8 text-white">
                        <h3 className="text-lg font-semibold opacity-90">
                            Hisoblangan yig‘im miqdori
                        </h3>
                        <div className="text-4xl md:text-5xl font-bold mt-1">
                            {fmt(calc.total)} so‘m
                        </div>
                        {calc.negativeVolume && (
                            <p className="mt-2 text-sm bg-white/20 rounded px-3 py-1 inline-block">
                                ⚠️ Ayiriladigan qismlar umumiy hajmdan katta — hajm 0 olindi.
                            </p>
                        )}
                    </div>
                    <div className="p-6 md:p-8 space-y-2 text-sm">
                        <h4 className="font-bold text-gray-800 mb-3">Hisob-kitob</h4>
                        <Row
                            k="Sof hajm = (Хб+Хю) − (Ха+Хт+Ху)"
                            v={`(${fmt(calc.positive)} − ${fmt(calc.negative)}) = ${fmt(calc.clampedVolume)} m³`}
                        />
                        <Row
                            k="Koeffitsientlar Кт×Ко×Кз×Кж"
                            v={`${kt} × ${ko} × ${kz} × ${kzh} = ${fmt(calc.rawK, 4)}`}
                        />
                        {calc.floored && (
                            <Row
                                k="0.01 minimum qoidasi"
                                v={`${fmt(calc.rawK, 4)} < 0.01 → 0.01`}
                                warn
                            />
                        )}
                        <Row k="BHM" v={`${fmt(calc.bhmV, 0)} so‘m`} />
                        <div className="border-t pt-2 mt-2" />
                        <Row
                            k="Yig‘im = BHM × sof hajm × koeffitsient"
                            v={`${fmt(calc.bhmV, 0)} × ${fmt(calc.clampedVolume)} × ${fmt(calc.effK, 4)} = ${fmt(calc.total)} so‘m`}
                            bold
                        />
                    </div>
                </div>

                {/* Undirilmaydigan holatlar */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <button
                        onClick={() => setShowExempt((s) => !s)}
                        className="w-full flex items-center justify-between p-5 text-left font-semibold text-gray-800"
                    >
                        <span>Yig‘im undirilmaydigan holatlar</span>
                        <ChevronDown className={`w-5 h-5 transition-transform ${showExempt ? 'rotate-180' : ''}`} />
                    </button>
                    {showExempt && (
                        <ul className="px-6 pb-6 space-y-2 text-sm text-gray-600 list-disc list-inside">
                            <li>Renovatsiya kompensatsiyasi sifatidagi bino va inshootlar;</li>
                            <li>Davlatga bepul topshiriladigan bino va inshootlar;</li>
                            <li>Qurilish hajmining 50%+ qismi davlatga bepul topshiriladigan obyektlar;</li>
                            <li>Fuqarolar o‘zini o‘zi boshqarish (mahalla) binolari;</li>
                            <li>Muhandislik-kommunikatsiya va transport infratuzilmasi obyektlari;</li>
                            <li>Sanoat kapital binolari (umumiy ovqatlanish, sport zali, ofis, turar joy bundan mustasno);</li>
                            <li>Diniy maqsadli binolar.</li>
                        </ul>
                    )}
                </div>

                <p className="text-center text-xs text-gray-400 pb-4">
                    Asos: VM 151-son qarori (08.04.2026), 4-ilova Nizomi 2-ilovasi.
                    Natija ma‘lumot uchun; rasmiy yig‘im ekspertiza xulosasi asosida hisoblanadi.
                </p>
            </div>
        </div>
    )
}

function VolInput({
    f,
    value,
    onChange,
    cls,
    positive,
}: {
    f: { symbol: string; label: string; hint: string }
    value: string
    onChange: (v: string) => void
    cls: string
    positive?: boolean
}) {
    return (
        <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                {positive !== undefined && (
                    <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded text-xs font-bold ${
                            positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                    >
                        {positive ? '+' : '−'}
                    </span>
                )}
                {f.label} <span className="text-gray-400">({f.symbol})</span>
            </label>
            <input
                type="text"
                inputMode="decimal"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="0"
                className={cls}
            />
            <p className="text-xs text-gray-500">{f.hint}</p>
        </div>
    )
}

function Row({ k, v, bold, warn }: { k: string; v: string; bold?: boolean; warn?: boolean }) {
    return (
        <div
            className={`flex flex-col sm:flex-row sm:justify-between gap-1 ${
                bold ? 'font-bold text-gray-900' : 'text-gray-600'
            } ${warn ? 'text-amber-600' : ''}`}
        >
            <span>{k}</span>
            <span className="sm:text-right">{v}</span>
        </div>
    )
}

export default Page
