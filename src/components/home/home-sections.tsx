'use client'

import Announcements from '@/components/announcements/announcements'
import CalcCta from '@/components/calc/calc-cta'
import Events from '@/components/events/events'
import HeroSection from '@/components/hero-section/hero-section'
import Partners from '@/components/home/partners'
import NewsSection from '@/components/news-section/news-section'
import StatisticsSection from '@/components/statistics-section/statistics-section'
import UsefulLinks from '@/components/useful-links/useful-links'
import { HomeSectionKey, useSiteSettings } from '@/lib/site-settings'
import { ComponentType } from 'react'

const SECTIONS: Record<HomeSectionKey, ComponentType> = {
    hero: HeroSection,
    calc: CalcCta,
    news: NewsSection,
    stats: StatisticsSection,
    announcements: Announcements,
    events: Events,
    partners: Partners,
    usefulLinks: UsefulLinks,
}

/** Bosh sahifa seksiyalari — admin "Dizayn"dagi tartib va yoqilganlik bo'yicha. */
export default function HomeSections() {
    const { data } = useSiteSettings()
    const sections = data?.homeSections ?? []
    return (
        <div>
            {sections
                .filter((s) => s.enabled)
                .map((s) => {
                    const C = SECTIONS[s.key]
                    return C ? <C key={s.key} /> : null
                })}
        </div>
    )
}
