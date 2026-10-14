import { api } from '@/models/axios'
import { useQuery } from '@tanstack/react-query'

// Ijtimoiy tarmoq havolalari. Admin "Asosiy ma'lumotlar"da hali saqlamagan bo'lsa
// (Details.socialLinks = null) — Kompaniyaning haqiqiy sahifalari ishlatiladi
// (avval mobil menyuda qotirib yozilgan edi).

export interface SocialLinks {
    telegram: string
    facebook: string
    instagram: string
    youtube: string
}

export const DEFAULT_SOCIAL_LINKS: SocialLinks = {
    telegram: 'https://t.me/samarqandinvestkompaniyasi',
    facebook: 'https://www.facebook.com/share/14QfpykKKVz/',
    instagram: 'https://www.instagram.com/saminvestcom',
    youtube: 'https://youtube.com/@samarqandinvestkompaniyasi',
}

const KEYS = Object.keys(DEFAULT_SOCIAL_LINKS) as (keyof SocialLinks)[]

/** Faqat http(s) havolalar (javascript: va h.k. — bo'sh). */
const safe = (v: unknown) => (typeof v === 'string' && /^https?:\/\//i.test(v.trim()) ? v.trim() : '')

/**
 * Details javobidan havolalar. `socialLinks` umuman saqlanmagan bo'lsa — standart;
 * saqlangan bo'lsa (hatto bo'sh) — adminning qarori hurmat qilinadi.
 */
export function resolveSocialLinks(details: any): SocialLinks {
    const s = details?.socialLinks
    if (!s || typeof s !== 'object') return { ...DEFAULT_SOCIAL_LINKS }
    return KEYS.reduce((acc, k) => ({ ...acc, [k]: safe(s[k]) }), {} as SocialLinks)
}

/** Client komponentlar uchun: /details (footer/preheader bilan bir xil kesh). */
export function useSocialLinks(): SocialLinks {
    const { data } = useQuery({
        queryKey: ['details'],
        queryFn: async () => (await api.get('/details')).data,
    })
    return resolveSocialLinks(data)
}
