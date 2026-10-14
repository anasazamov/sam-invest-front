'use client'

import {
    Block,
    coord,
    designClasses,
    Localized,
    pick,
    safeHref,
    SimpleBlock,
    youtubeId,
} from '@/lib/blocks'
import { api, baseBackendUrl } from '@/models/axios'
import { useQuery } from '@tanstack/react-query'
import {
    CalendarDays,
    ChevronDown,
    Clock,
    ExternalLink,
    FileText,
    Mail,
    MapPin,
    Phone,
    UserRound,
    X,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ReactNode, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

/**
 * Bloklardan sahifani chizadi. XSS yo'q: faqat tipizatsiyalangan JSON'dan
 * React komponentlar chiziladi; "text" bloki markdown'ni rehype-sanitize bilan.
 */
export default function BlockRenderer({
    blocks,
    locale,
}: {
    blocks: Block[]
    locale: string
}) {
    return (
        <div>
            {blocks.map((block) => (
                <BlockView key={block.id} block={block} locale={locale} />
            ))}
        </div>
    )
}

function BlockView({ block, locale }: { block: Block; locale: string }) {
    const cls = designClasses(block.design)

    if (block.type === 'columns') {
        const n = block.columns.length
        return (
            <section className={cls.section}>
                <div className={cls.inner}>
                    <div className={`grid gap-6 ${n === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                        {block.columns.map((col, i) => (
                            <div key={i} className="min-w-0 space-y-4">
                                {col.map((child) => (
                                    <ChildView key={child.id} block={child} locale={locale} />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        )
    }

    if (block.type === 'divider') {
        return (
            <div className={cls.section}>
                <div className={cls.inner}>
                    <hr className="border-t border-black/10 dark:border-white/15" />
                </div>
            </div>
        )
    }

    return (
        <section className={cls.section}>
            <div className={cls.inner}>
                <BlockBody block={block} locale={locale} />
            </div>
        </section>
    )
}

/** Ustun ichidagi blok — kenglik konteynerisiz, fon/bo'shliq/tekislash bilan. */
function ChildView({ block, locale }: { block: SimpleBlock; locale: string }) {
    if (block.type === 'divider') {
        return <hr className="border-t border-black/10 dark:border-white/15" />
    }
    const cls = designClasses(block.design)
    const plain = !block.design || block.design.bg === 'white'
    return (
        <div className={plain ? cls.section.replace('px-4', '') : `${cls.section} rounded-2xl`}>
            <div className={block.design?.align === 'center' ? 'text-center' : 'text-left'}>
                <BlockBody block={block} locale={locale} />
            </div>
        </div>
    )
}

function BlockBody({ block, locale }: { block: Block; locale: string }) {
    switch (block.type) {
        case 'hero':
            return (
                <div className="space-y-5">
                    <h1 className="text-3xl md:text-5xl font-bold leading-tight">
                        {pick(block.title, locale)}
                    </h1>
                    {pick(block.subtitle, locale) && (
                        <p className="text-lg md:text-xl opacity-80">
                            {pick(block.subtitle, locale)}
                        </p>
                    )}
                    {pick(block.buttonText, locale) && safeHref(block.buttonUrl) && (
                        <a
                            href={safeHref(block.buttonUrl)}
                            className="inline-block rounded-xl bg-blue-500 px-6 py-3 font-semibold text-white transition hover:bg-blue-600"
                        >
                            {pick(block.buttonText, locale)}
                        </a>
                    )}
                </div>
            )

        case 'text':
            return (
                <article className="prose prose-lg dark:prose-invert max-w-none">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw, rehypeSanitize]}
                        components={{
                            img: ({ node, ...props }) => (
                                <img
                                    {...props}
                                    alt={props.alt || ''}
                                    className="max-w-full h-auto rounded-lg my-6"
                                />
                            ),
                            td: ({ children }) => (
                                <td className="px-4 py-2 align-top whitespace-normal break-words">
                                    {children}
                                </td>
                            ),
                        }}
                    >
                        {pick(block.content, locale)}
                    </ReactMarkdown>
                </article>
            )

        case 'image':
            return (
                <figure>
                    {safeHref(block.url) && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={safeHref(block.url)}
                            alt={pick(block.alt, locale)}
                            className="mx-auto max-w-full h-auto rounded-xl shadow-md"
                        />
                    )}
                    {pick(block.caption, locale) && (
                        <figcaption className="mt-2 text-sm opacity-70">
                            {pick(block.caption, locale)}
                        </figcaption>
                    )}
                </figure>
            )

        case 'cards':
            return (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {block.items.map((item, i) => (
                        <div
                            key={i}
                            className="rounded-2xl border border-black/10 bg-white/60 p-5 text-left shadow-sm dark:border-white/10 dark:bg-white/5"
                        >
                            <div className="mb-2 text-sm font-bold text-blue-500">
                                {String(i + 1).padStart(2, '0')}
                            </div>
                            <h3 className="mb-1.5 font-semibold">
                                {pick(item.title, locale)}
                            </h3>
                            <p className="text-sm opacity-80">
                                {pick(item.text, locale)}
                            </p>
                        </div>
                    ))}
                </div>
            )

        case 'stats':
            return (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {block.items.map((item, i) => (
                        <div
                            key={i}
                            className="rounded-2xl border border-black/10 bg-white/60 p-6 dark:border-white/10 dark:bg-white/5"
                        >
                            <div className="text-3xl font-bold text-blue-500">
                                {item.value}
                            </div>
                            <p className="mt-1 text-sm opacity-80">
                                {pick(item.label, locale)}
                            </p>
                        </div>
                    ))}
                </div>
            )

        case 'faq':
            return <Faq items={block.items} locale={locale} />

        case 'people':
            return <People items={block.items} locale={locale} />

        case 'docs':
            return <Docs items={block.items} locale={locale} />

        case 'orgchart':
            return <OrgChart root={block.root} nodes={block.nodes} locale={locale} />

        case 'gallery':
            return <Gallery images={block.images} cols={block.cols} locale={locale} />

        case 'video':
            return <Video url={block.url} title={pick(block.title, locale)} />

        case 'buttons':
            return (
                <div
                    className={`flex flex-wrap gap-3 ${
                        block.design?.align === 'center' ? 'justify-center' : ''
                    }`}
                >
                    {block.items.map((b, i) => {
                        const href = safeHref(b.url)
                        if (!href || !pick(b.text, locale)) return null
                        const external = /^https?:\/\//i.test(href)
                        return (
                            <a
                                key={i}
                                href={href}
                                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                className={
                                    b.variant === 'outline'
                                        ? 'rounded-xl border-2 border-current px-5 py-2.5 font-semibold transition hover:opacity-80'
                                        : 'rounded-xl bg-blue-500 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-600'
                                }
                            >
                                {pick(b.text, locale)}
                            </a>
                        )
                    })}
                </div>
            )

        case 'map':
            return <MapEmbed lat={block.lat} lng={block.lng} zoom={block.zoom} height={block.height} />

        case 'contact':
            return <Contact title={pick(block.title, locale)} showMap={block.showMap} locale={locale} />

        case 'feed':
            return (
                <Feed
                    title={pick(block.title, locale)}
                    source={block.source}
                    count={Number(block.count)}
                    locale={locale}
                />
            )

        default:
            return null
    }
}

// ─────────────────────────── Galereya ───────────────────────────

function Gallery({
    images,
    cols,
    locale,
}: {
    images: { url: string; alt?: Localized }[]
    cols: '2' | '3' | '4'
    locale: string
}) {
    const [open, setOpen] = useState<number | null>(null)
    const list = images.filter((im) => safeHref(im.url))
    const grid = { '2': 'sm:grid-cols-2', '3': 'sm:grid-cols-2 lg:grid-cols-3', '4': 'sm:grid-cols-2 lg:grid-cols-4' }[cols]
    const current = open !== null ? list[open] : null

    return (
        <>
            <div className={`grid grid-cols-1 gap-4 ${grid}`}>
                {list.map((im, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => setOpen(i)}
                        className="group aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 dark:bg-neutral-800"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={safeHref(im.url)}
                            alt={pick(im.alt, locale)}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                    </button>
                ))}
            </div>
            {current && (
                <div
                    className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 p-4"
                    onClick={() => setOpen(null)}
                    role="dialog"
                    aria-modal="true"
                >
                    <button
                        type="button"
                        onClick={() => setOpen(null)}
                        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                        aria-label="close"
                    >
                        <X className="h-6 w-6" />
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={safeHref(current.url)}
                        alt={pick(current.alt, locale)}
                        onClick={(e) => e.stopPropagation()}
                        className="max-h-[90vh] max-w-full rounded-lg object-contain"
                    />
                </div>
            )}
        </>
    )
}

// ─────────────────────────── Video ───────────────────────────

function Video({ url, title }: { url?: string; title: string }) {
    const yt = youtubeId(url)
    const file = !yt ? safeHref(url) : ''
    return (
        <div className="space-y-3">
            {title && <h3 className="text-xl font-semibold">{title}</h3>}
            <div className="aspect-video overflow-hidden rounded-xl bg-black">
                {yt ? (
                    <iframe
                        src={`https://www.youtube-nocookie.com/embed/${yt}`}
                        title={title || 'YouTube'}
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="h-full w-full"
                    />
                ) : file ? (
                    <video src={file} controls className="h-full w-full" />
                ) : null}
            </div>
        </div>
    )
}

// ─────────────────────────── Xarita ───────────────────────────

const SAMARQAND = { lat: 39.657179, lng: 66.965423 }

function useDetails() {
    return useQuery({
        queryKey: ['details'],
        queryFn: async () => (await api.get('/details')).data,
    })
}

function MapEmbed({
    lat,
    lng,
    zoom,
    height,
}: {
    lat?: string
    lng?: string
    zoom: string
    height: 'sm' | 'md' | 'lg'
}) {
    const { data: details } = useDetails()
    // Blokda koordinata bo'lmasa — "Asosiy ma'lumotlar"dagi, u ham bo'lmasa Samarqand
    const la = coord(lat, 90) ?? coord(String(details?.mapCoords?.lat ?? ''), 90) ?? SAMARQAND.lat
    const ln = coord(lng, 180) ?? coord(String(details?.mapCoords?.lng ?? ''), 180) ?? SAMARQAND.lng
    const z = ['12', '14', '16', '18'].includes(zoom) ? zoom : '16'
    const h = { sm: 'h-64', md: 'h-96', lg: 'h-[32rem]' }[height]
    return (
        <iframe
            src={`https://maps.google.com/maps?q=${la},${ln}&z=${z}&output=embed`}
            className={`w-full rounded-xl border-0 ${h}`}
            loading="lazy"
            title="map"
        />
    )
}

// ─────────────────────────── Kontakt ───────────────────────────

function Contact({ title, showMap, locale }: { title: string; showMap: boolean; locale: string }) {
    const t = useTranslations('blocks')
    const { data: d } = useDetails()
    const address = d?.address?.[locale] || d?.address?.uz
    const hours = d?.workingHours?.[locale] || d?.workingHours?.uz
    const phones: string[] = [d?.receptionPhone, ...(d?.trustLinePhones ?? [])].filter(Boolean)
    const emails: string[] = [d?.infoEmails, ...(d?.corporateEmails ?? [])].filter(Boolean)

    const Row = ({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) => (
        <div className="flex gap-3">
            <div className="mt-0.5 shrink-0 text-blue-500">{icon}</div>
            <div>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-60">{label}</p>
                <div className="mt-0.5">{children}</div>
            </div>
        </div>
    )

    return (
        <div className={`grid gap-8 text-left ${showMap ? 'lg:grid-cols-2' : ''}`}>
            <div className="space-y-5">
                {title && <h2 className="text-2xl font-bold">{title}</h2>}
                {address && <Row icon={<MapPin className="h-5 w-5" />} label={t('address')}>{address}</Row>}
                {phones.length > 0 && (
                    <Row icon={<Phone className="h-5 w-5" />} label={t('phone')}>
                        {[...new Set(phones)].map((p) => (
                            <a key={p} href={`tel:${p.replace(/[^\d+]/g, '')}`} className="block hover:text-blue-500">
                                {p}
                            </a>
                        ))}
                    </Row>
                )}
                {emails.length > 0 && (
                    <Row icon={<Mail className="h-5 w-5" />} label="E-mail">
                        {[...new Set(emails)].map((e) => (
                            <a key={e} href={`mailto:${e}`} className="block hover:text-blue-500">
                                {e}
                            </a>
                        ))}
                    </Row>
                )}
                {hours && <Row icon={<Clock className="h-5 w-5" />} label={t('workingHours')}>{hours}</Row>}
            </div>
            {showMap && <MapEmbed zoom="16" height="md" />}
        </div>
    )
}

// ─────────────────────────── Yangiliklar lentasi ───────────────────────────

/** HTML'dan oddiy matn (lentada qisqa izoh uchun; HTML chizilmaydi). */
function plainText(html: unknown): string {
    if (typeof html !== 'string') return ''
    return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&[a-z#0-9]+;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

function Feed({
    title,
    source,
    count,
    locale,
}: {
    title: string
    source: 'NEWS' | 'ANNOUNCEMENTS' | 'EVENTS'
    count: number
    locale: string
}) {
    const t = useTranslations('blocks')
    const { data = [], isLoading } = useQuery({
        queryKey: ['publications', 'all'],
        queryFn: async () => {
            const res = await api.get('/publication')
            return Array.isArray(res.data) ? res.data : []
        },
    })
    const items = (data as any[])
        .filter((p) => p.type === source)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, count)

    const loc = (o: any) => o?.[locale] || o?.uz || ''

    return (
        <div className="space-y-6 text-left">
            {title && <h2 className="text-2xl font-bold">{title}</h2>}
            {isLoading ? null : items.length === 0 ? (
                <p className="text-sm opacity-60">{t('noItems')}</p>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((p) => {
                        const img = p.url?.[0]
                        const isImg = img && !/\.(mp4|webm|ogg|mov)$/i.test(img)
                        return (
                            <Link
                                key={p.id}
                                href={`/publication/${p.id}`}
                                className="group overflow-hidden rounded-2xl border border-black/10 bg-white transition hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-neutral-900"
                            >
                                <div className="aspect-video bg-slate-100 dark:bg-neutral-800">
                                    {isImg && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={`${baseBackendUrl}${img}`}
                                            alt=""
                                            loading="lazy"
                                            className="h-full w-full object-cover"
                                        />
                                    )}
                                </div>
                                <div className="space-y-2 p-4 text-slate-900 dark:text-slate-100">
                                    <p className="text-xs opacity-60">
                                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString(locale) : ''}
                                    </p>
                                    <h3 className="line-clamp-2 font-semibold group-hover:text-blue-500">
                                        {loc(p.title)}
                                    </h3>
                                    <p className="line-clamp-3 text-sm opacity-75">{plainText(loc(p.content))}</p>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// ─────────────────────────── Rahbariyat ───────────────────────────

type Person = Extract<Block, { type: 'people' }>['items'][number]

function People({ items, locale }: { items: Person[]; locale: string }) {
    // Bo'linma (group) bo'yicha guruhlaymiz, tartibni saqlagan holda
    const groups: { title: string; people: Person[] }[] = []
    for (const p of items) {
        const title = pick(p.group, locale)
        const g = groups.find((x) => x.title === title)
        if (g) g.people.push(p)
        else groups.push({ title, people: [p] })
    }
    return (
        <div className="space-y-10 text-left">
            {groups.map((g, gi) => (
                <div key={gi} className="space-y-5">
                    {g.title && (
                        <h2 className="text-xl md:text-2xl font-bold">{g.title}</h2>
                    )}
                    <div className="space-y-5">
                        {g.people.map((p, i) => (
                            <PersonCard key={i} p={p} locale={locale} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

function PersonCard({ p, locale }: { p: Person; locale: string }) {
    const t = useTranslations('blocks')
    const [open, setOpen] = useState(false)
    const education = pick(p.education, locale)
    const hasBio = !!education || p.career.length > 0

    return (
        <div className="overflow-hidden rounded-2xl bg-[#0A0A3D] text-white shadow-lg">
            <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:p-8">
                <div className="mx-auto h-36 w-36 shrink-0 overflow-hidden rounded-full border-4 border-white/15 bg-white/10 md:mx-0">
                    {safeHref(p.photo) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={safeHref(p.photo)}
                            alt={pick(p.name, locale)}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <UserRound className="h-full w-full p-8 text-white/40" />
                    )}
                </div>
                <div className="flex-1 space-y-3 text-center md:text-left">
                    <h3 className="text-xl md:text-2xl font-bold uppercase tracking-wide text-blue-400">
                        {pick(p.name, locale)}
                    </h3>
                    {pick(p.position, locale) && (
                        <p className="text-white/85">{pick(p.position, locale)}</p>
                    )}
                    <div className="flex flex-col gap-2 pt-1 text-sm text-white/80 md:flex-row md:flex-wrap md:gap-x-6">
                        {p.phone && (
                            <a
                                href={`tel:${p.phone.replace(/[^\d+]/g, '')}`}
                                className="inline-flex items-center justify-center gap-2 hover:text-blue-300 md:justify-start"
                            >
                                <Phone className="h-4 w-4 text-blue-400" />
                                {p.phone}
                                {p.ext && (
                                    <span className="text-white/50">
                                        ({t('ext')}: {p.ext})
                                    </span>
                                )}
                            </a>
                        )}
                        {p.email && (
                            <a
                                href={`mailto:${p.email}`}
                                className="inline-flex items-center justify-center gap-2 hover:text-blue-300 md:justify-start"
                            >
                                <Mail className="h-4 w-4 text-blue-400" />
                                {p.email}
                            </a>
                        )}
                        {pick(p.reception, locale) && (
                            <span className="inline-flex items-center justify-center gap-2 md:justify-start">
                                <CalendarDays className="h-4 w-4 text-blue-400" />
                                {t('reception')}: {pick(p.reception, locale)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {hasBio && (
                <div className="border-t border-white/10">
                    <button
                        onClick={() => setOpen((o) => !o)}
                        className="flex w-full items-center justify-between px-6 py-3 text-sm font-semibold text-blue-300 hover:bg-white/5 md:px-8"
                    >
                        {t('biography')}
                        <ChevronDown
                            className={`h-5 w-5 transition-transform ${open ? 'rotate-180' : ''}`}
                        />
                    </button>
                    {open && (
                        <div className="space-y-5 px-6 pb-6 text-sm text-white/80 md:px-8">
                            {education && (
                                <div>
                                    <p className="mb-1 font-semibold text-white">
                                        {t('education')}
                                    </p>
                                    <p className="whitespace-pre-line">{education}</p>
                                </div>
                            )}
                            {p.career.length > 0 && (
                                <div>
                                    <p className="mb-2 font-semibold text-white">
                                        {t('career')}
                                    </p>
                                    <ul className="space-y-1.5">
                                        {p.career.map((c, i) => (
                                            <li key={i} className="flex gap-3">
                                                <span className="w-28 shrink-0 font-medium text-blue-300">
                                                    {c.year}
                                                </span>
                                                <span>{pick(c.text, locale)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ─────────────────────────── Hujjatlar ───────────────────────────

function Docs({
    items,
    locale,
}: {
    items: { name?: Localized; note?: Localized; url?: string }[]
    locale: string
}) {
    const t = useTranslations('blocks')
    return (
        <ul className="space-y-3 text-left">
            {items.map((d, i) => (
                <li
                    key={i}
                    className="flex flex-col gap-3 rounded-xl border border-black/10 bg-white/60 p-4 sm:flex-row sm:items-center dark:border-white/10 dark:bg-white/5"
                >
                    <FileText className="h-8 w-8 shrink-0 text-blue-500" />
                    <div className="flex-1">
                        <p className="font-medium">{pick(d.name, locale)}</p>
                        {pick(d.note, locale) && (
                            <p className="text-sm opacity-70">{pick(d.note, locale)}</p>
                        )}
                    </div>
                    {safeHref(d.url) && (
                        <a
                            href={safeHref(d.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0A0A3D] px-4 py-2 text-sm font-medium text-white hover:bg-blue-900"
                        >
                            {t('open')} <ExternalLink className="h-4 w-4" />
                        </a>
                    )}
                </li>
            ))}
        </ul>
    )
}

// ─────────────────────────── Tashkiliy tuzilma ───────────────────────────

type OrgNode = { id: string; name?: Localized; parentId: string }

function OrgChart({
    root,
    nodes,
    locale,
}: {
    root?: Localized
    nodes: OrgNode[]
    locale: string
}) {
    const childrenOf = (pid: string) => nodes.filter((n) => n.parentId === pid)
    // Mavjud bo'lmagan ota-onaga bog'langan tugunlar ildizga tushadi
    const ids = new Set(nodes.map((n) => n.id))
    const top = nodes.filter((n) => !n.parentId || !ids.has(n.parentId))

    const renderLevel = (list: OrgNode[], depth: number): ReactNode =>
        list.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 pt-6">
                {list.map((n) => (
                    <div key={n.id} className="flex flex-col items-center">
                        <div className="h-6 w-px bg-blue-400/60" />
                        <div
                            className={`rounded-xl px-4 py-3 text-sm font-medium shadow-sm ${
                                depth === 1
                                    ? 'bg-blue-500 text-white'
                                    : 'border border-black/10 bg-white text-slate-800 dark:border-white/15 dark:bg-neutral-800 dark:text-neutral-100'
                            }`}
                            style={{ maxWidth: 220 }}
                        >
                            {pick(n.name, locale)}
                        </div>
                        {depth < 6 && renderLevel(childrenOf(n.id), depth + 1)}
                    </div>
                ))}
            </div>
        )

    return (
        <div className="overflow-x-auto pb-2">
            <div className="flex min-w-fit flex-col items-center">
                <div className="rounded-2xl bg-[#0A0A3D] px-8 py-4 text-lg font-bold text-white shadow-lg">
                    {pick(root, locale)}
                </div>
                {renderLevel(top, 1)}
            </div>
        </div>
    )
}

function Faq({
    items,
    locale,
}: {
    items: { question?: any; answer?: any }[]
    locale: string
}) {
    const [open, setOpen] = useState<number | null>(null)
    return (
        <div className="space-y-3 text-left">
            {items.map((item, i) => (
                <div
                    key={i}
                    className="rounded-xl border border-black/10 dark:border-white/10"
                >
                    <button
                        onClick={() => setOpen(open === i ? null : i)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left font-medium"
                    >
                        {pick(item.question, locale)}
                        <ChevronDown
                            className={`h-5 w-5 shrink-0 transition-transform ${
                                open === i ? 'rotate-180' : ''
                            }`}
                        />
                    </button>
                    {open === i && (
                        <div className="px-4 pb-4 text-sm opacity-80">
                            {pick(item.answer, locale)}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
