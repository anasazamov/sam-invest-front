import { api } from '@/models/axios'
import { useQuery } from '@tanstack/react-query'
import { Localized } from '@/lib/blocks'

// Saytning global dizayn sozlamalari. Backend saqlashda tozalaydi, frontend
// ham ishlatishdan oldin qayta tekshiradi (rang CSS'ga tushadi).

export const DEFAULT_PRIMARY = '#0A0A3D'
export const DEFAULT_ACCENT = '#3B82F6' // tailwind blue-500

export const FONTS = [
    { id: 'inter', label: 'Inter', cssVar: '--font-inter' },
    { id: 'roboto', label: 'Roboto', cssVar: '--font-roboto' },
    { id: 'montserrat', label: 'Montserrat', cssVar: '--font-montserrat' },
    { id: 'noto-sans', label: 'Noto Sans', cssVar: '--font-noto-sans' },
] as const
export type FontId = (typeof FONTS)[number]['id']

export type HomeSectionKey =
    | 'hero'
    | 'calc'
    | 'news'
    | 'stats'
    | 'announcements'
    | 'events'
    | 'partners'
    | 'usefulLinks'

export const HOME_SECTION_LABELS: Record<HomeSectionKey, string> = {
    hero: 'home.hero',
    calc: 'home.calc',
    news: 'home.news',
    stats: 'home.stats',
    announcements: 'home.announcements',
    events: 'home.events',
    partners: 'home.partners',
    usefulLinks: 'home.usefulLinks',
}

export const DEFAULT_HOME_SECTIONS: { key: HomeSectionKey; enabled: boolean }[] = [
    { key: 'hero', enabled: true },
    { key: 'calc', enabled: true },
    { key: 'news', enabled: true },
    { key: 'stats', enabled: true },
    { key: 'announcements', enabled: true },
    { key: 'events', enabled: true },
    { key: 'partners', enabled: false },
    { key: 'usefulLinks', enabled: true },
]

export interface LinkItem {
    title: Localized
    url: string
    logo: string
}

export interface HeaderSettings {
    showHome: boolean
    showCalc: boolean
    showPress: boolean
    hiddenMenus: string[] // yashirilgan menyular (Menu.id)
}

export interface PreheaderSettings {
    showAddress: boolean
    showEmail: boolean
    text: Localized // ixtiyoriy e'lon qatori
}

export interface SiteSettings {
    siteName: Localized
    header: HeaderSettings
    preheader: PreheaderSettings
    logoLight: string
    logoDark: string
    favicon: string
    colors: { primary: string; accent: string }
    font: FontId
    footerText: Localized
    copyright: Localized
    homeSections: { key: HomeSectionKey; enabled: boolean }[]
    usefulLinks: LinkItem[]
    partners: LinkItem[]
}

const HEX = /^#[0-9a-fA-F]{6}$/
export const isHex = (v: unknown): v is string => typeof v === 'string' && HEX.test(v)

/** Faqat http(s):// yoki saytning o'z yo'li. */
export function safeUrl(v: unknown): string {
    if (typeof v !== 'string') return ''
    const s = v.trim()
    if (/^https?:\/\//i.test(s)) return s
    if (s.startsWith('/') && !s.startsWith('//')) return s
    return ''
}

/** Backend javobini to'liq, xavfsiz SiteSettings'ga aylantiradi (defaultlar bilan). */
export function normalizeSettings(raw: any): SiteSettings {
    const r = raw && typeof raw === 'object' ? raw : {}
    const known = new Set(DEFAULT_HOME_SECTIONS.map((s) => s.key))
    const saved: { key: HomeSectionKey; enabled: boolean }[] = Array.isArray(r.homeSections)
        ? r.homeSections.filter((s: any) => s && known.has(s.key))
        : []
    // Saqlangan tartib + yangi qo'shilgan (saqlanmagan) seksiyalar oxirida
    const homeSections = [
        ...saved.map((s) => ({ key: s.key, enabled: s.enabled !== false })),
        ...DEFAULT_HOME_SECTIONS.filter((d) => !saved.some((s) => s.key === d.key)),
    ]
    const links = (arr: any): LinkItem[] =>
        Array.isArray(arr)
            ? arr.map((x: any) => ({
                  title: x?.title && typeof x.title === 'object' ? x.title : {},
                  url: safeUrl(x?.url),
                  logo: safeUrl(x?.logo),
              }))
            : []

    const h = r.header && typeof r.header === 'object' ? r.header : {}
    const p = r.preheader && typeof r.preheader === 'object' ? r.preheader : {}

    return {
        siteName: r.siteName && typeof r.siteName === 'object' ? r.siteName : {},
        header: {
            showHome: h.showHome !== false,
            showCalc: h.showCalc !== false,
            showPress: h.showPress !== false,
            hiddenMenus: Array.isArray(h.hiddenMenus)
                ? h.hiddenMenus.filter((x: unknown) => typeof x === 'string')
                : [],
        },
        preheader: {
            showAddress: p.showAddress !== false,
            showEmail: p.showEmail !== false,
            text: p.text && typeof p.text === 'object' ? p.text : {},
        },
        logoLight: safeUrl(r.logoLight),
        logoDark: safeUrl(r.logoDark),
        favicon: safeUrl(r.favicon),
        colors: {
            primary: isHex(r.colors?.primary) ? r.colors.primary : DEFAULT_PRIMARY,
            accent: isHex(r.colors?.accent) ? r.colors.accent : DEFAULT_ACCENT,
        },
        font: FONTS.some((f) => f.id === r.font) ? r.font : 'inter',
        footerText: r.footerText && typeof r.footerText === 'object' ? r.footerText : {},
        copyright: r.copyright && typeof r.copyright === 'object' ? r.copyright : {},
        homeSections,
        usefulLinks: links(r.usefulLinks),
        partners: links(r.partners),
    }
}

export const SITE_SETTINGS_KEY = ['site-settings']

export function useSiteSettings() {
    return useQuery({
        queryKey: SITE_SETTINGS_KEY,
        queryFn: async () => {
            const res = await api.get('/site-settings')
            return normalizeSettings(res.data)
        },
        staleTime: 5 * 60 * 1000,
        placeholderData: normalizeSettings({}),
    })
}
