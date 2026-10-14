import { z } from 'zod'

// ─────────────────────────── Umumiy ───────────────────────────

/** Ko'p tilli matn maydoni. */
export const localizedSchema = z.object({
    uz: z.string().optional(),
    oz: z.string().optional(),
    ru: z.string().optional(),
    en: z.string().optional(),
})
export type Localized = z.infer<typeof localizedSchema>

/** Har blokning dizayn sozlamalari (tayyor variantlardan, erkin CSS emas). */
export const designSchema = z.object({
    bg: z.enum(['white', 'light', 'dark', 'gradient']).default('white'),
    padding: z.enum(['sm', 'md', 'lg']).default('md'),
    width: z.enum(['narrow', 'medium', 'full']).default('medium'),
    align: z.enum(['left', 'center']).default('left'),
})
export type Design = z.infer<typeof designSchema>

export const defaultDesign: Design = {
    bg: 'white',
    padding: 'md',
    width: 'medium',
    align: 'left',
}

const base = { id: z.string(), design: designSchema.optional() }
const L = () => localizedSchema.optional()

// ─────────────────────────── Bloklar ───────────────────────────

// "Oddiy" bloklar — ustunlar ichiga ham joylanadi (ustun ichida ustun yo'q).
const simpleOptions = [
    z.object({
        ...base,
        type: z.literal('hero'),
        title: L(),
        subtitle: L(),
        buttonText: L(),
        buttonUrl: z.string().optional(),
    }),
    z.object({ ...base, type: z.literal('text'), content: L() }),
    z.object({
        ...base,
        type: z.literal('image'),
        url: z.string().optional(),
        alt: L(),
        caption: L(),
    }),
    z.object({
        ...base,
        type: z.literal('cards'),
        items: z
            .array(z.object({ title: L(), text: L() }))
            .default([]),
    }),
    z.object({
        ...base,
        type: z.literal('stats'),
        items: z
            .array(z.object({ value: z.string().default(''), label: L() }))
            .default([]),
    }),
    z.object({
        ...base,
        type: z.literal('faq'),
        items: z
            .array(z.object({ question: L(), answer: L() }))
            .default([]),
    }),
    z.object({ ...base, type: z.literal('divider') }),
    z.object({
        ...base,
        type: z.literal('people'),
        items: z
            .array(
                z.object({
                    photo: z.string().optional(), // tilga bog'liq emas
                    phone: z.string().optional(),
                    ext: z.string().optional(), // ichki raqam
                    email: z.string().optional(),
                    name: L(), // F.I.Sh. (kirillda farq qiladi)
                    position: L(),
                    reception: L(), // qabul kuni
                    education: L(),
                    group: L(), // bo'linma nomi (ixtiyoriy guruhlash)
                    career: z
                        .array(z.object({ year: z.string().default(''), text: L() }))
                        .default([]),
                })
            )
            .default([]),
    }),
    z.object({
        ...base,
        type: z.literal('docs'),
        items: z
            .array(
                z.object({ name: L(), note: L(), url: z.string().optional() })
            )
            .default([]),
    }),
    z.object({
        ...base,
        type: z.literal('orgchart'),
        root: L(),
        // parentId bo'sh — ildizga (Boshqaruv) bo'ysunadi
        nodes: z
            .array(
                z.object({
                    id: z.string(),
                    name: L(),
                    parentId: z.string().default(''),
                })
            )
            .default([]),
    }),
    z.object({
        ...base,
        type: z.literal('gallery'),
        cols: z.enum(['2', '3', '4']).default('3'),
        images: z
            .array(z.object({ url: z.string().default(''), alt: L() }))
            .default([]),
    }),
    z.object({
        ...base,
        type: z.literal('video'),
        // YouTube havolasi yoki video fayl (mp4/webm) havolasi
        url: z.string().optional(),
        title: L(),
    }),
    z.object({
        ...base,
        type: z.literal('buttons'),
        items: z
            .array(
                z.object({
                    text: L(),
                    url: z.string().default(''),
                    variant: z.enum(['primary', 'outline']).default('primary'),
                })
            )
            .default([]),
    }),
    z.object({
        ...base,
        type: z.literal('map'),
        lat: z.string().optional(), // bo'sh — "Asosiy ma'lumotlar"dagi koordinata
        lng: z.string().optional(),
        zoom: z.enum(['12', '14', '16', '18']).default('16'),
        height: z.enum(['sm', 'md', 'lg']).default('md'),
    }),
    z.object({
        ...base,
        type: z.literal('contact'),
        title: L(),
        showMap: z.boolean().default(true),
    }),
    z.object({
        ...base,
        type: z.literal('feed'),
        title: L(),
        source: z.enum(['NEWS', 'ANNOUNCEMENTS', 'EVENTS']).default('NEWS'),
        count: z.enum(['3', '4', '6', '8']).default('3'),
    }),
] as const

export const simpleBlockSchema = z.discriminatedUnion('type', simpleOptions)

const columnsSchema = z.object({
    ...base,
    type: z.literal('columns'),
    // har ustun — oddiy bloklar ro'yxati
    columns: z.array(z.array(simpleBlockSchema)).min(2).max(3),
})

export const blockSchema = z.discriminatedUnion('type', [...simpleOptions, columnsSchema])

export type Block = z.infer<typeof blockSchema>
export type SimpleBlock = z.infer<typeof simpleBlockSchema>
export type BlockType = Block['type']

/** Bloklar massivi (butun sahifa). Noto'g'ri bloklarni tashlab, xavfsiz tozalaydi. */
export function parseBlocks(raw: unknown): Block[] {
    if (!Array.isArray(raw)) return []
    const out: Block[] = []
    for (const item of raw) {
        const r = blockSchema.safeParse(item)
        if (r.success) out.push(r.data)
    }
    return out
}

// ─────────────────────────── Palitra / defaultlar ───────────────────────────

export interface BlockMeta {
    type: BlockType
    labelKey: string // i18n kaliti
}

export const BLOCK_PALETTE: BlockMeta[] = [
    { type: 'hero', labelKey: 'block.hero' },
    { type: 'text', labelKey: 'block.text' },
    { type: 'image', labelKey: 'block.image' },
    { type: 'gallery', labelKey: 'block.gallery' },
    { type: 'video', labelKey: 'block.video' },
    { type: 'buttons', labelKey: 'block.buttons' },
    { type: 'columns', labelKey: 'block.columns' },
    { type: 'cards', labelKey: 'block.cards' },
    { type: 'stats', labelKey: 'block.stats' },
    { type: 'faq', labelKey: 'block.faq' },
    { type: 'people', labelKey: 'block.people' },
    { type: 'docs', labelKey: 'block.docs' },
    { type: 'orgchart', labelKey: 'block.orgchart' },
    { type: 'map', labelKey: 'block.map' },
    { type: 'contact', labelKey: 'block.contact' },
    { type: 'feed', labelKey: 'block.feed' },
    { type: 'divider', labelKey: 'block.divider' },
]

/** Ustun ichiga qo'shiladigan bloklar (ustun ichida ustun yo'q). */
export const SIMPLE_PALETTE = BLOCK_PALETTE.filter((m) => m.type !== 'columns')

export function uid(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID)
        return crypto.randomUUID()
    return `b_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

/** Yangi blokni standart qiymatlar bilan yaratadi. */
export function createBlock(type: BlockType): Block {
    const id = uid()
    const design = { ...defaultDesign }
    switch (type) {
        case 'hero':
            return { id, type, design: { ...design, bg: 'gradient', padding: 'lg', align: 'center' }, title: {}, subtitle: {}, buttonText: {}, buttonUrl: '' }
        case 'text':
            return { id, type, design, content: {} }
        case 'image':
            return { id, type, design, url: '', alt: {}, caption: {} }
        case 'cards':
            return { id, type, design, items: [{ title: {}, text: {} }] }
        case 'stats':
            return { id, type, design, items: [{ value: '', label: {} }] }
        case 'faq':
            return { id, type, design, items: [{ question: {}, answer: {} }] }
        case 'divider':
            return { id, type, design: { ...design, padding: 'sm' } }
        case 'people':
            return { id, type, design: { ...design, width: 'full' }, items: [emptyPerson()] }
        case 'docs':
            return { id, type, design, items: [{ name: {}, note: {}, url: '' }] }
        case 'orgchart':
            return {
                id,
                type,
                design: { ...design, width: 'full', align: 'center' },
                root: { uz: 'Boshqaruv', oz: 'Бошқарув', ru: 'Правление', en: 'Management Board' },
                nodes: [],
            }
        case 'gallery':
            return { id, type, design: { ...design, width: 'full' }, cols: '3', images: [] }
        case 'video':
            return { id, type, design, url: '', title: {} }
        case 'buttons':
            return { id, type, design, items: [{ text: {}, url: '', variant: 'primary' }] }
        case 'map':
            return { id, type, design: { ...design, width: 'full' }, lat: '', lng: '', zoom: '16', height: 'md' }
        case 'contact':
            return { id, type, design: { ...design, width: 'full', bg: 'light' }, title: {}, showMap: true }
        case 'feed':
            return { id, type, design: { ...design, width: 'full' }, title: {}, source: 'NEWS', count: '3' }
        case 'columns':
            return {
                id,
                type,
                design: { ...design, width: 'full' },
                columns: [[createSimple('text')], [createSimple('text')]],
            }
    }
}

/**
 * Eski markdown kontent ({uz,oz,ru,en,all} yoki string) → "Matn" bloklari.
 * Backend'dagi prisma/migrate-content-to-blocks.mjs bilan bir xil qoida:
 * tillar bitta blokda, `all` (umumiy qism) — barcha tillarda ikkinchi blok.
 */
export function contentToBlocks(content: unknown): Block[] {
    const c: Record<string, unknown> =
        typeof content === 'string'
            ? { uz: content }
            : content && typeof content === 'object'
              ? (content as Record<string, unknown>)
              : {}
    const langs = ['uz', 'oz', 'ru', 'en'] as const
    const out: Block[] = []
    const localized: Localized = {}
    for (const l of langs) {
        const v = c[l]
        if (typeof v === 'string' && v.trim()) localized[l] = v
    }
    if (Object.keys(localized).length) out.push({ ...(createBlock('text') as any), content: localized })
    if (typeof c.all === 'string' && c.all.trim()) {
        const all = c.all
        out.push({
            ...(createBlock('text') as any),
            content: { uz: all, oz: all, ru: all, en: all },
        })
    }
    return out
}

/** Ustun ichi uchun blok (ustun ichida ustun yaratilmaydi). */
export function createSimple(type: Exclude<BlockType, 'columns'>): SimpleBlock {
    const b = createBlock(type) as SimpleBlock
    // Ustun ichida tashqi bo'shliq kichikroq, kenglik to'liq
    return { ...b, design: { ...defaultDesign, ...(b.design || {}), padding: 'sm', width: 'full' } } as SimpleBlock
}

// ─────────────────────────── Media xavfsizligi ───────────────────────────

/** Faqat http(s):// yoki saytning o'z yo'li (javascript:, data: va h.k. rad etiladi). */
export function safeHref(v: unknown): string {
    if (typeof v !== 'string') return ''
    const s = v.trim()
    if (/^https?:\/\//i.test(s)) return s
    if (s.startsWith('/') && !s.startsWith('//')) return s
    if (/^(mailto|tel):/i.test(s)) return s
    return ''
}

/** YouTube havolasidan 11 belgili video ID (youtu.be, watch?v=, embed/, shorts/). */
export function youtubeId(url: string | undefined): string | null {
    if (!url) return null
    const m = url.match(
        /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    )
    return m ? m[1] : null
}

/** Koordinata — faqat raqam va oraliqda bo'lsa. */
export function coord(v: unknown, max: number): number | null {
    const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN
    return Number.isFinite(n) && Math.abs(n) <= max ? n : null
}

export function emptyPerson() {
    return {
        photo: '',
        phone: '',
        ext: '',
        email: '',
        name: {},
        position: {},
        reception: {},
        education: {},
        group: {},
        career: [] as { year: string; text: Localized }[],
    }
}

/** Dizayn sozlamalarini Tailwind klasslariga aylantiradi (section o'ramasi uchun). */
export function designClasses(d: Design = defaultDesign) {
    const bg = {
        white: 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100',
        light: 'bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-slate-100',
        dark: 'bg-[#0A0A3D] text-white',
        gradient: 'bg-gradient-to-br from-[#0A0A3D] to-blue-900 text-white',
    }[d.bg || 'white']
    const padding = { sm: 'py-6', md: 'py-12', lg: 'py-20' }[d.padding || 'md']
    const width = {
        narrow: 'max-w-2xl',
        medium: 'max-w-4xl',
        full: 'max-w-7xl',
    }[d.width || 'medium']
    const align = d.align === 'center' ? 'text-center' : 'text-left'
    return { section: `${bg} ${padding} px-4`, inner: `${width} mx-auto ${align}` }
}

/** Ko'p tilli maydondan joriy til qiymati. */
export function pick(l: Localized | undefined, locale: string): string {
    if (!l) return ''
    return (l as any)[locale] || l.uz || ''
}
