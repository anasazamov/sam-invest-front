'use client'

import { api } from '@/models/axios'
import { Loader2, MapPin, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

declare global {
    interface Window {
        ymaps: any
    }
}

const KEY = process.env.NEXT_PUBLIC_YANDEX_API_KEY

export interface ResolvedLocation {
    matched: boolean
    assumed?: boolean
    detectedName?: string
    kzValue: number
    kzBracket: string
    city?: string
    population?: number
    populationYear?: number
    source?: string
}

interface SearchHit {
    display: string
    lat: number
    lon: number
}

let loaderPromise: Promise<void> | null = null
function loadYmaps(): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve()
    if (window.ymaps?.Map) return Promise.resolve()
    if (loaderPromise) return loaderPromise
    loaderPromise = new Promise<void>((resolve, reject) => {
        const s = document.createElement('script')
        s.src = `https://api-maps.yandex.ru/2.1/?apikey=${KEY}&lang=ru_RU`
        s.async = true
        s.onload = () => window.ymaps.ready(() => resolve())
        s.onerror = () => reject(new Error('Yandex xarita yuklanmadi'))
        document.head.appendChild(s)
    })
    return loaderPromise
}

export default function LocationPicker({
    onResolve,
}: {
    onResolve: (loc: ResolvedLocation) => void
}) {
    const mapEl = useRef<HTMLDivElement | null>(null)
    const mapRef = useRef<any>(null)
    const pinRef = useRef<any>(null)

    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [info, setInfo] = useState<string | null>(null)

    const [q, setQ] = useState('')
    const [hits, setHits] = useState<SearchHit[]>([])
    const [searching, setSearching] = useState(false)
    const [coord, setCoord] = useState('')

    useEffect(() => {
        let alive = true
        if (!KEY) {
            setError('Yandex API kaliti sozlanmagan (NEXT_PUBLIC_YANDEX_API_KEY)')
            setLoading(false)
            return
        }
        loadYmaps()
            .then(() => {
                if (!alive || !mapEl.current) return
                const ymaps = window.ymaps
                const map = new ymaps.Map(mapEl.current, {
                    center: [39.654, 66.959], // Samarqand
                    zoom: 11,
                    controls: ['zoomControl', 'geolocationControl'],
                })
                mapRef.current = map
                setLoading(false)
                map.events.add('click', (e: any) => {
                    const c = e.get('coords')
                    setPin(c)
                    void reverse(c[0], c[1])
                })
            })
            .catch((err) => {
                setError(err.message)
                setLoading(false)
            })
        return () => {
            alive = false
            mapRef.current?.destroy?.()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function setPin(coords: number[]) {
        const ymaps = window.ymaps
        const map = mapRef.current
        if (!ymaps || !map) return
        if (pinRef.current) {
            pinRef.current.geometry.setCoordinates(coords)
        } else {
            pinRef.current = new ymaps.Placemark(
                coords,
                {},
                { preset: 'islands#redDotIcon', draggable: true }
            )
            pinRef.current.events.add('dragend', () => {
                const c = pinRef.current.geometry.getCoordinates()
                void reverse(c[0], c[1])
            })
            map.geoObjects.add(pinRef.current)
        }
    }

    function centerTo(lat: number, lon: number, zoom = 15) {
        mapRef.current?.setCenter([lat, lon], zoom, { duration: 300 })
        setPin([lat, lon])
    }

    // Koordinata → manzil + aholi + Кз (backend/Nominatim)
    async function reverse(lat: number, lon: number) {
        setBusy(true)
        setError(null)
        try {
            const { data } = await api.get('/geo/reverse', {
                params: { lat, lon },
            })
            setInfo(data?.location?.display || null)
            if (data?.matched) {
                const detectedName =
                    data.location?.city ||
                    data.location?.county ||
                    data.location?.state
                onResolve({
                    matched: true,
                    assumed: !!data.assumed,
                    detectedName,
                    kzValue: data.kz.value,
                    kzBracket: data.kz.bracket,
                    city: data.territory?.name,
                    population: data.territory?.population,
                    populationYear: data.territory?.populationYear,
                    source: data.territory?.source,
                })
            } else {
                setError('Joyni aniqlab bo‘lmadi. Qayta urinib ko‘ring.')
            }
        } catch {
            setError('Joyni aniqlab bo‘lmadi. Qayta urinib ko‘ring.')
        } finally {
            setBusy(false)
        }
    }

    // Manzil qidiruv
    async function doSearch(e?: React.FormEvent) {
        e?.preventDefault()
        if (q.trim().length < 2) return
        setSearching(true)
        setError(null)
        try {
            const { data } = await api.get('/geo/search', { params: { q } })
            setHits(Array.isArray(data) ? data : [])
            if (!data?.length) setError('Manzil topilmadi.')
        } catch {
            setError('Qidiruvda xatolik.')
        } finally {
            setSearching(false)
        }
    }

    function pickHit(h: SearchHit) {
        setHits([])
        setQ(h.display)
        centerTo(h.lat, h.lon)
        void reverse(h.lat, h.lon)
    }

    // Koordinata bo'yicha (lat, lon)
    function goCoord(e?: React.FormEvent) {
        e?.preventDefault()
        const m = coord.split(/[,;\s]+/).map((x) => parseFloat(x.trim()))
        if (m.length < 2 || !isFinite(m[0]) || !isFinite(m[1])) {
            setError('Koordinata formati: kenglik, uzunlik (masalan 39.654, 66.959)')
            return
        }
        centerTo(m[0], m[1])
        void reverse(m[0], m[1])
    }

    return (
        <div className="space-y-3">
            {/* Qidiruv qutilari */}
            <div className="grid md:grid-cols-2 gap-3">
                <form onSubmit={doSearch} className="relative">
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Manzil bo‘yicha qidirish (masalan: Samarqand, Registon)"
                        className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none text-sm"
                    />
                    <button
                        type="submit"
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                        aria-label="Qidirish"
                    >
                        {searching ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Search className="w-4 h-4" />
                        )}
                    </button>
                    {hits.length > 0 && (
                        <ul className="absolute z-[500] mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-56 overflow-auto">
                            {hits.map((h, i) => (
                                <li key={i}>
                                    <button
                                        type="button"
                                        onClick={() => pickHit(h)}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50"
                                    >
                                        {h.display}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </form>
                <form onSubmit={goCoord} className="flex gap-2">
                    <input
                        value={coord}
                        onChange={(e) => setCoord(e.target.value)}
                        placeholder="Koordinata: 39.654, 66.959"
                        className="flex-1 px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none text-sm"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shrink-0"
                    >
                        Borish
                    </button>
                </form>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-indigo-600" />
                Xaritada qurilish joyini bosing — <b>Кз avtomatik</b> aniqlanadi.
            </div>

            <div className="relative">
                <div
                    ref={mapEl}
                    className="w-full h-72 md:h-80 rounded-xl overflow-hidden border-2 border-gray-200"
                />
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 rounded-xl">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    </div>
                )}
                {busy && (
                    <div className="absolute top-2 right-2 bg-white/90 rounded-lg px-3 py-1.5 text-sm flex items-center gap-2 shadow">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                        Aniqlanmoqda…
                    </div>
                )}
            </div>

            {info && !error && (
                <p className="text-xs text-gray-500 flex items-start gap-1">
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0" /> {info}
                </p>
            )}
            {error && (
                <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                    {error}
                </p>
            )}
        </div>
    )
}
