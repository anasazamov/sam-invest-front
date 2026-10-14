'use client'

import {
    DEFAULT_ACCENT,
    DEFAULT_PRIMARY,
    FONTS,
    isHex,
    useSiteSettings,
} from '@/lib/site-settings'
import { useEffect } from 'react'

/**
 * Admin "Dizayn" sozlamalarini butun saytga qo'llaydi:
 *  - asosiy rang: qotirilgan `#0A0A3D` klasslarini CSS o'zgaruvchisiga bog'laydi;
 *  - aksent: Tailwind v4 `--color-blue-*` o'zgaruvchilarini qayta belgilaydi;
 *  - shrift va favicon.
 * Xavfsizlik: CSS'ga faqat #RRGGBB ranglar va oq ro'yxatdagi shrift o'zgaruvchilari
 * tushadi (normalizeSettings + isHex) — erkin CSS yo'q.
 */
export default function BrandStyle() {
    const { data } = useSiteSettings()

    const primary = isHex(data?.colors.primary) ? data!.colors.primary : DEFAULT_PRIMARY
    const accent = isHex(data?.colors.accent) ? data!.colors.accent : DEFAULT_ACCENT
    const font = FONTS.find((f) => f.id === data?.font) ?? FONTS[0]
    const favicon = data?.favicon

    useEffect(() => {
        if (!favicon) return
        let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
        if (!link) {
            link = document.createElement('link')
            link.rel = 'icon'
            document.head.appendChild(link)
        }
        link.href = favicon
    }, [favicon])

    const rules: string[] = [`:root{--brand-primary:${primary};--brand-accent:${accent};}`]

    if (primary.toUpperCase() !== DEFAULT_PRIMARY) {
        rules.push(
            `.bg-\\[\\#0A0A3D\\]{background-color:var(--brand-primary)!important}`,
            `.text-\\[\\#0A0A3D\\]{color:var(--brand-primary)!important}`,
            `.border-\\[\\#0A0A3D\\]{border-color:var(--brand-primary)!important}`,
            `.from-\\[\\#0A0A3D\\]{--tw-gradient-from:var(--brand-primary)!important}`
        )
    }

    if (accent.toUpperCase() !== DEFAULT_ACCENT) {
        const mix = (pct: number, to: 'white' | 'black') =>
            `color-mix(in oklab, var(--brand-accent) ${pct}%, ${to})`
        rules.push(
            `:root{` +
                `--color-blue-100:${mix(20, 'white')};` +
                `--color-blue-200:${mix(40, 'white')};` +
                `--color-blue-300:${mix(60, 'white')};` +
                `--color-blue-400:${mix(80, 'white')};` +
                `--color-blue-500:var(--brand-accent);` +
                `--color-blue-600:${mix(85, 'black')};` +
                `--color-blue-700:${mix(70, 'black')};` +
                `--color-blue-900:${mix(40, 'black')};` +
                `}`
        )
    }

    if (font.id !== 'inter') {
        rules.push(
            `body{font-family:var(${font.cssVar}),ui-sans-serif,system-ui,sans-serif!important}`
        )
    }

    return <style dangerouslySetInnerHTML={{ __html: rules.join('\n') }} />
}
