// Statistika kartalarining ikonkalari — avvalgi (qotirilgan) dizayndagi asl SVG'lar.
// Admin "Statistika"da tanlaydi; tanlanmagan bo'lsa karta tartibi bo'yicha
// asl ikonka beriladi (qaytarilgan 6 ta ko'rsatkich avvalgidek ko'rinadi).

export const STAT_ICONS = [
    { key: 'zones', labelKey: 'statIcon.zones', paths: ['M17 20h-2c-1.1 0-2-.9-2-2v-6c0-1.1.9-2 2-2h2v10z', 'M13 20H7V8a2 2 0 012-2h6v14z'] },
    { key: 'industry', labelKey: 'statIcon.industry', paths: ['M17 21v-2a4 4 0 00-5-5H12M12 9a5 5 0 00-5 5v2M12 9a5 5 0 005 5v2M12 9a5 5 0 005 5v2'] },
    { key: 'free-zone', labelKey: 'statIcon.freeZone', paths: ['M13 7l5 5m0 0l-5 5m5-5H6', 'M19 12l-7 7-7-7'] },
    { key: 'projects', labelKey: 'statIcon.projects', paths: ['M9 7h6m0 10v-1a3 3 0 005.356-2.356L21 12a4.978 4.978 0 00-5-5h-2M9 7a3 3 0 003-3h6a3 3 0 003 3M9 17a3 3 0 003 3h6a3 3 0 003-3M9 12a3 3 0 003-3h6a3 3 0 003 3'] },
    { key: 'money', labelKey: 'statIcon.money', paths: ['M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'] },
    { key: 'investment', labelKey: 'statIcon.investment', paths: ['M12 6v6m0 0v6m0-6h6m-6 0H6', 'M17 8l4 4m0 0l-4 4m4-4L13 12'] },
] as const

export type StatIconKey = (typeof STAT_ICONS)[number]['key']

export function StatIcon({
    name,
    index = 0,
    className = 'w-8 h-8',
}: {
    name?: string | null
    index?: number
    className?: string
}) {
    const icon =
        STAT_ICONS.find((i) => i.key === name) ?? STAT_ICONS[index % STAT_ICONS.length]
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            {icon.paths.map((d) => (
                <path key={d} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
            ))}
        </svg>
    )
}
