'use client'

import { pick } from '@/lib/blocks'
import { useSiteSettings } from '@/lib/site-settings'
import { useLocale, useTranslations } from 'next-intl'

/** Hamkorlar logotiplari (admin "Dizayn" → Hamkorlar). Bo'sh bo'lsa ko'rinmaydi. */
export default function Partners() {
    const t = useTranslations()
    const locale = useLocale()
    const { data } = useSiteSettings()
    const partners = (data?.partners ?? []).filter((p) => p.logo)
    if (!partners.length) return null

    return (
        <section className="container-cs py-12">
            <h2 className="mb-8 w-fit border-b-2 border-[#0A0A3D] pb-2 text-2xl font-bold">
                {t('Hamkorlar')}
            </h2>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
                {partners.map((p, i) => {
                    const title = pick(p.title, locale)
                    const card = (
                        <div className="flex h-28 items-center justify-center rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-neutral-900">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={p.logo}
                                alt={title}
                                title={title}
                                className="max-h-full max-w-full object-contain grayscale transition hover:grayscale-0"
                            />
                        </div>
                    )
                    return p.url ? (
                        <a key={i} href={p.url} target="_blank" rel="noopener noreferrer">
                            {card}
                        </a>
                    ) : (
                        <div key={i}>{card}</div>
                    )
                })}
            </div>
        </section>
    )
}
