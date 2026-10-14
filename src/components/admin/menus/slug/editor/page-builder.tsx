'use client'

import UploadButton from '@/components/admin/upload-button'
import BlockRenderer from '@/components/blocks/block-renderer'
import { Button } from '@/components/ui/button'
import useNotify from '@/hooks/use-notify'
import { buildTemplate, TemplateId, TEMPLATES } from '@/lib/block-templates'
import {
    Block,
    BLOCK_PALETTE,
    BlockType,
    contentToBlocks,
    createBlock,
    createSimple,
    parseBlocks,
    defaultDesign,
    Design,
    emptyPerson,
    Localized,
    SIMPLE_PALETTE,
    SimpleBlock,
    uid,
    youtubeId,
} from '@/lib/blocks'
import { languageNames, supportedLanguages } from '@/lib/utils'
import { api } from '@/models/axios'
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
    ArrowDown,
    ArrowUp,
    ChevronDown,
    Copy,
    Eye,
    GripVertical,
    LayoutTemplate,
    Monitor,
    Plus,
    Redo2,
    Save,
    Smartphone,
    Tablet,
    Trash2,
    Undo2,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ReactNode, useCallback, useEffect, useState } from 'react'

type Lang = 'uz' | 'oz' | 'ru' | 'en'
const LANGS = supportedLanguages as Lang[]

const inputCls =
    'w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#0A0A3D] dark:border-white/15 dark:bg-neutral-800 dark:text-neutral-100'

// ─────────────────────────── Kichik UI qismlar ───────────────────────────

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                {label}
            </span>
            {children}
        </label>
    )
}

function LText({
    value,
    lang,
    onChange,
    multiline,
    placeholder,
}: {
    value: Localized | undefined
    lang: Lang
    onChange: (v: Localized) => void
    multiline?: boolean
    placeholder?: string
}) {
    const v = (value as any)?.[lang] ?? ''
    const set = (s: string) => onChange({ ...(value || {}), [lang]: s })
    return multiline ? (
        <textarea
            value={v}
            rows={5}
            placeholder={placeholder}
            onChange={(e) => set(e.target.value)}
            className={inputCls}
        />
    ) : (
        <input
            value={v}
            placeholder={placeholder}
            onChange={(e) => set(e.target.value)}
            className={inputCls}
        />
    )
}

function Choice<T extends string>({
    value,
    options,
    onChange,
}: {
    value: T
    options: { value: T; label: string }[]
    onChange: (v: T) => void
}) {
    return (
        <div className="flex flex-wrap gap-1">
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    onClick={() => onChange(o.value)}
                    className={`rounded-md border px-2.5 py-1 text-xs transition ${
                        value === o.value
                            ? 'border-[#0A0A3D] bg-[#0A0A3D] text-white'
                            : 'border-black/10 bg-white text-slate-600 hover:border-slate-300 dark:border-white/15 dark:bg-neutral-800 dark:text-neutral-200'
                    }`}
                >
                    {o.label}
                </button>
            ))}
        </div>
    )
}

// ── Avto-qoralama (localStorage). Har o'qish/yozish try/catch ichida: maxfiy
// rejim, to'lgan xotira (base64 rasmlar) yoki o'chirilgan storage — jim o'tadi.

function readDraft(key: string): { blocks: Block[]; savedAt: number } | null {
    try {
        const raw = localStorage.getItem(key)
        if (!raw) return null
        const d = JSON.parse(raw)
        const blocks = parseBlocks(d?.blocks) // saqlangan JSON ham sxemadan o'tadi
        return blocks.length && typeof d.savedAt === 'number' ? { blocks, savedAt: d.savedAt } : null
    } catch {
        return null
    }
}

function writeDraft(key: string, blocks: Block[]): boolean {
    try {
        localStorage.setItem(key, JSON.stringify({ blocks, savedAt: Date.now() }))
        return true
    } catch {
        return false
    }
}

function removeDraft(key: string) {
    try {
        localStorage.removeItem(key)
    } catch {
        /* storage mavjud emas */
    }
}

/** Rasmi bor, lekin o'zbekcha alt matni yo'q bloklar (ustunlar ichida ham). */
function lacksAlt(b: Block | SimpleBlock): boolean {
    const empty = (l?: Localized) => !l?.uz?.trim()
    if (b.type === 'image') return !!b.url && empty(b.alt)
    if (b.type === 'gallery') return b.images.some((im) => !!im.url && empty(im.alt))
    return false
}

function findMissingAlt(list: Block[]): { topId: string; childId?: string }[] {
    const out: { topId: string; childId?: string }[] = []
    for (const b of list) {
        if (b.type === 'columns') {
            for (const col of b.columns)
                for (const c of col) if (lacksAlt(c)) out.push({ topId: b.id, childId: c.id })
        } else if (lacksAlt(b)) out.push({ topId: b.id })
    }
    return out
}

/** Blokni (ustunlar ichida ham) id bo'yicha o'zgartiradi. */
function mapDeep(list: Block[], id: string, fn: (b: any) => any): Block[] {
    return list.map((b) => {
        if (b.id === id) return fn(b) as Block
        if (b.type === 'columns') {
            return {
                ...b,
                columns: b.columns.map((col) => col.map((c) => (c.id === id ? fn(c) : c))),
            } as Block
        }
        return b
    })
}

/** Blokni (ustunlar ichida ham) id bo'yicha topadi. */
function findDeep(list: Block[], id: string): Block | SimpleBlock | undefined {
    for (const b of list) {
        if (b.id === id) return b
        if (b.type === 'columns')
            for (const col of b.columns) for (const c of col) if (c.id === id) return c
    }
    return undefined
}

/** Massiv elementini yuqoriga/pastga surish. */
function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
    const j = i + dir
    if (j < 0 || j >= arr.length) return arr
    const next = [...arr]
    ;[next[i], next[j]] = [next[j], next[i]]
    return next
}

/** Shablonlar to'ri — bitta bosishda sahifa tuzilmasi. */
function TemplatePicker({ onPick }: { onPick: (id: TemplateId) => void }) {
    const t = useTranslations()
    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((tp) => (
                <button
                    key={tp.id}
                    type="button"
                    onClick={() => onPick(tp.id)}
                    className="rounded-xl border bg-background p-4 text-left transition hover:border-[#0A0A3D] hover:shadow-sm"
                >
                    <p className="font-semibold">{t(tp.labelKey)}</p>
                    <p className="mt-1 text-xs text-slate-500">{t(tp.descKey)}</p>
                </button>
            ))}
        </div>
    )
}

// ─────────────────────────── Blok kartasi (sortable) ───────────────────────────

function SortableCard({
    id,
    header,
    children,
    open,
}: {
    id: string
    header: (handle: ReactNode) => ReactNode
    children: ReactNode
    open: boolean
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id })
    const handle = (
        <button
            type="button"
            className="cursor-grab touch-none text-slate-400 hover:text-slate-600 active:cursor-grabbing"
            {...attributes}
            {...listeners}
            aria-label="drag"
        >
            <GripVertical className="h-5 w-5" />
        </button>
    )
    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={`rounded-xl border bg-background ${
                isDragging ? 'z-10 opacity-80 shadow-lg' : ''
            }`}
        >
            {header(handle)}
            {open && <div className="border-t p-4 space-y-4">{children}</div>}
        </div>
    )
}

// ─────────────────────────── Asosiy komponent ───────────────────────────

export default function PageBuilder({
    submenuId,
    initialBlocks,
    legacyContent,
}: {
    submenuId: string
    initialBlocks: Block[]
    legacyContent?: unknown // eski markdown kontent — "Mavjud matndan boshlash" uchun
}) {
    const t = useTranslations()
    const { toastSuccess, toastError } = useNotify()

    const [blocks, setBlocks] = useState<Block[]>(initialBlocks)
    const [past, setPast] = useState<Block[][]>([])
    const [future, setFuture] = useState<Block[][]>([])
    const [lang, setLang] = useState<Lang>('uz')
    const [openId, setOpenId] = useState<string | null>(null)
    const [openChild, setOpenChild] = useState<string | null>(null) // ustun ichidagi ochiq blok
    const [preview, setPreview] = useState(false)
    const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
    const [saving, setSaving] = useState(false)
    const [dirty, setDirty] = useState(false)
    const [showTemplates, setShowTemplates] = useState(false)
    // Brauzerdagi avto-qoralama (serverga emas — saqlanmagan o'zgarish saytda ko'rinmaydi)
    const draftKey = `saminvest-builder-draft:${submenuId}`
    const [pendingDraft, setPendingDraft] = useState<{ blocks: Block[]; savedAt: number } | null>(null)
    const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null)

    useEffect(() => {
        setBlocks(initialBlocks)
        setPast([])
        setFuture([])
        setDirty(false)
        // Saqlanmagan qoralama bormi? (server holatidan farq qilsagina taklif qilamiz)
        const draft = readDraft(draftKey)
        if (draft && JSON.stringify(draft.blocks) !== JSON.stringify(initialBlocks)) {
            setPendingDraft(draft)
        } else {
            setPendingDraft(null)
            if (draft) removeDraft(draftKey)
        }
    }, [initialBlocks, draftKey])

    // O'zgarishdan ~1,5 s keyin qoralamani yozamiz. Tiklash/o'chirish tanlanmaguncha
    // yozmaymiz — aks holda eski qoralama ustidan yozilib yo'qolardi.
    useEffect(() => {
        if (!dirty || pendingDraft) return
        const h = setTimeout(() => {
            if (writeDraft(draftKey, blocks)) setDraftSavedAt(Date.now())
        }, 1500)
        return () => clearTimeout(h)
    }, [blocks, dirty, pendingDraft, draftKey])

    // Saqlanmagan o'zgarish bilan sahifani yopishda ogohlantirish
    useEffect(() => {
        if (!dirty) return
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault()
            e.returnValue = ''
        }
        window.addEventListener('beforeunload', onBeforeUnload)
        return () => window.removeEventListener('beforeunload', onBeforeUnload)
    }, [dirty])

    // ── Tarix (undo/redo) ──
    const commit = useCallback(
        (next: Block[]) => {
            setPast((p) => [...p.slice(-49), blocks])
            setFuture([])
            setBlocks(next)
            setDirty(true)
        },
        [blocks]
    )
    const undo = () => {
        if (!past.length) return
        const prev = past[past.length - 1]
        setFuture((f) => [blocks, ...f])
        setPast((p) => p.slice(0, -1))
        setBlocks(prev)
        setDirty(true)
    }
    const redo = () => {
        if (!future.length) return
        const next = future[0]
        setPast((p) => [...p, blocks])
        setFuture((f) => f.slice(1))
        setBlocks(next)
        setDirty(true)
    }

    // ── Operatsiyalar ──
    // id'lar global unikal — ustun ichidagi bloklar ham shu funksiyalar bilan yangilanadi
    const update = (id: string, patch: Record<string, any>) =>
        commit(mapDeep(blocks, id, (b) => ({ ...b, ...patch })))
    const updateDesign = (id: string, patch: Partial<Design>) => {
        const b = findDeep(blocks, id)
        update(id, { design: { ...defaultDesign, ...(b?.design || {}), ...patch } })
    }
    const add = (type: BlockType) => {
        const nb = createBlock(type)
        commit([...blocks, nb])
        setOpenId(nb.id)
    }
    const remove = (id: string) => commit(blocks.filter((b) => b.id !== id))
    // Shablon qo'llash (undo bilan qaytariladi). Bloklar bo'lsa — tasdiq so'raymiz.
    const applyTemplate = (id: TemplateId) => {
        if (blocks.length && !window.confirm(t('Shablon tasdiq'))) return
        commit(buildTemplate(id))
        setShowTemplates(false)
        setOpenId(null)
    }
    const duplicate = (id: string) => {
        const i = blocks.findIndex((b) => b.id === id)
        if (i === -1) return
        const copy = { ...structuredClone(blocks[i]), id: uid() } as Block
        // Ustunlar ichidagi bloklar ham yangi id oladi (id'lar global unikal bo'lishi shart)
        if (copy.type === 'columns') {
            copy.columns = copy.columns.map((col) => col.map((c) => ({ ...c, id: uid() })))
        }
        const next = [...blocks]
        next.splice(i + 1, 0, copy)
        commit(next)
    }

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    )
    const onDragEnd = (e: DragEndEvent) => {
        const { active, over } = e
        if (!over || active.id === over.id) return
        const from = blocks.findIndex((b) => b.id === active.id)
        const to = blocks.findIndex((b) => b.id === over.id)
        if (from === -1 || to === -1) return
        commit(arrayMove(blocks, from, to))
    }

    const save = async () => {
        // Rasmlarda alt matni (kamida o'zbekcha) majburiy — saqlashni to'xtatamiz
        const missing = findMissingAlt(blocks)
        if (missing.length) {
            const first = missing[0]
            setPreview(false)
            setLang('uz')
            setOpenId(first.topId)
            setOpenChild(first.childId ?? null)
            toastError(t('Alt majburiy', { count: missing.length }))
            return
        }
        setSaving(true)
        try {
            await api.patch(`/sub-menu/update/${submenuId}`, { blocks })
            setDirty(false)
            removeDraft(draftKey)
            setDraftSavedAt(null)
            toastSuccess(t('Malumotlar muvaffaqiyatli saqlandi'))
        } catch {
            toastError(t('Malumotlar saqlashda xatolik yuzaga keldi'))
        } finally {
            setSaving(false)
        }
    }

    // Ctrl+Z / Ctrl+Shift+Z
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA') return
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault()
                if (e.shiftKey) redo()
                else undo()
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    })

    // ── Bitta blok tahrirlash formasi ──
    const renderFields = (b: Block) => {
        const items = (b as any).items as any[] | undefined
        const setItems = (next: any[]) => update(b.id, { items: next })
        const setItem = (i: number, patch: Record<string, any>) =>
            setItems(items!.map((it, j) => (j === i ? { ...it, ...patch } : it)))

        const itemHeader = (i: number, total: number, onSet: (next: any[]) => void, list: any[]) => (
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">#{i + 1}</span>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => onSet(move(list, i, -1))}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        aria-label="up"
                    >
                        <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        disabled={i === total - 1}
                        onClick={() => onSet(move(list, i, 1))}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        aria-label="down"
                    >
                        <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onSet(list.filter((_, j) => j !== i))}
                        className="p-1 text-red-500 hover:text-red-600"
                        aria-label="remove"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>
        )

        const itemsEditor = (
            fields: {
                key: string
                label: string
                plain?: boolean
                multiline?: boolean
                upload?: string // accept atributi — yuklash tugmasi chiqadi
            }[],
            empty: Record<string, any>
        ) => (
            <div className="space-y-3">
                {items?.map((it, i) => (
                    <div key={i} className="rounded-lg border bg-slate-50 p-3 space-y-2 dark:bg-neutral-800/50">
                        {itemHeader(i, items.length, setItems, items)}
                        {fields.map((f) => (
                            <Field key={f.key} label={f.label}>
                                {f.plain ? (
                                    <div className="flex gap-2">
                                        <input
                                            value={it[f.key] ?? ''}
                                            onChange={(e) => setItem(i, { [f.key]: e.target.value })}
                                            className={inputCls}
                                        />
                                        {f.upload !== undefined && (
                                            <UploadButton
                                                accept={f.upload}
                                                label={t('Yuklash')}
                                                onUploaded={(url) => setItem(i, { [f.key]: url })}
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <LText
                                        value={it[f.key]}
                                        lang={lang}
                                        multiline={f.multiline}
                                        onChange={(v) => setItem(i, { [f.key]: v })}
                                    />
                                )}
                            </Field>
                        ))}
                    </div>
                ))}
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setItems([...(items || []), empty])}
                >
                    <Plus className="mr-1 h-4 w-4" /> {t('Element qoshish')}
                </Button>
            </div>
        )

        switch (b.type) {
            case 'hero':
                return (
                    <>
                        <Field label={t('Sarlavha')}>
                            <LText value={b.title} lang={lang} onChange={(v) => update(b.id, { title: v })} />
                        </Field>
                        <Field label={t('Kichik sarlavha')}>
                            <LText value={b.subtitle} lang={lang} multiline onChange={(v) => update(b.id, { subtitle: v })} />
                        </Field>
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field label={t('Tugma matni')}>
                                <LText value={b.buttonText} lang={lang} onChange={(v) => update(b.id, { buttonText: v })} />
                            </Field>
                            <Field label={t('Tugma havolasi')}>
                                <input
                                    value={b.buttonUrl ?? ''}
                                    placeholder="/calc"
                                    onChange={(e) => update(b.id, { buttonUrl: e.target.value })}
                                    className={inputCls}
                                />
                            </Field>
                        </div>
                    </>
                )
            case 'text':
                return (
                    <Field label={`${t('Matn')} (Markdown)`}>
                        <textarea
                            value={(b.content as any)?.[lang] ?? ''}
                            rows={10}
                            onChange={(e) =>
                                update(b.id, { content: { ...(b.content || {}), [lang]: e.target.value } })
                            }
                            className={`${inputCls} font-mono`}
                        />
                    </Field>
                )
            case 'image':
                return (
                    <>
                        <Field label={t('Rasm havolasi')}>
                            <div className="flex gap-2">
                                <input
                                    value={b.url ?? ''}
                                    placeholder="https://api.saminvestcompany.uz/uploads/..."
                                    onChange={(e) => update(b.id, { url: e.target.value })}
                                    className={inputCls}
                                />
                                <UploadButton
                                    accept="image/*"
                                    label={t('Yuklash')}
                                    onUploaded={(url) => update(b.id, { url })}
                                />
                            </div>
                            <span className="mt-1 block text-[11px] text-slate-400">
                                {t('Fayl menejeridan havolani nusxalab qoying')}
                            </span>
                        </Field>
                        <Field label={`${t('Alt matn')} *`}>
                            <LText value={b.alt} lang={lang} onChange={(v) => update(b.id, { alt: v })} />
                            {b.url && !b.alt?.uz?.trim() && (
                                <span className="mt-1 block text-[11px] text-red-500">
                                    {t('Alt ozbekcha majburiy')}
                                </span>
                            )}
                        </Field>
                        <Field label={t('Izoh')}>
                            <LText value={b.caption} lang={lang} onChange={(v) => update(b.id, { caption: v })} />
                        </Field>
                    </>
                )
            case 'cards':
                return itemsEditor(
                    [
                        { key: 'title', label: t('Sarlavha') },
                        { key: 'text', label: t('Matn'), multiline: true },
                    ],
                    { title: {}, text: {} }
                )
            case 'stats':
                return itemsEditor(
                    [
                        { key: 'value', label: t('Qiymat'), plain: true },
                        { key: 'label', label: t('Izoh') },
                    ],
                    { value: '', label: {} }
                )
            case 'faq':
                return itemsEditor(
                    [
                        { key: 'question', label: t('Savol') },
                        { key: 'answer', label: t('Javob'), multiline: true },
                    ],
                    { question: {}, answer: {} }
                )
            case 'docs':
                return itemsEditor(
                    [
                        { key: 'name', label: t('Hujjat nomi') },
                        { key: 'note', label: t('Izoh') },
                        { key: 'url', label: t('Havola yoki fayl'), plain: true, upload: '' },
                    ],
                    { name: {}, note: {}, url: '' }
                )

            case 'people': {
                const people = b.items
                const setPeople = (next: any[]) => update(b.id, { items: next })
                const setP = (i: number, patch: Record<string, any>) =>
                    setPeople(people.map((p, j) => (j === i ? { ...p, ...patch } : p)))
                return (
                    <div className="space-y-4">
                        {people.map((p, i) => (
                            <div key={i} className="space-y-3 rounded-lg border bg-slate-50 p-3 dark:bg-neutral-800/50">
                                {itemHeader(i, people.length, setPeople, people)}
                                <div className="flex items-center gap-3">
                                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border bg-white dark:bg-neutral-900">
                                        {p.photo && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={p.photo} alt="" className="h-full w-full object-cover" />
                                        )}
                                    </div>
                                    <UploadButton
                                        accept="image/*"
                                        label={t('Rasm yuklash')}
                                        onUploaded={(url) => setP(i, { photo: url })}
                                    />
                                    {p.photo && (
                                        <button
                                            type="button"
                                            onClick={() => setP(i, { photo: '' })}
                                            className="text-xs text-red-500 hover:underline"
                                        >
                                            {t('Ochirish')}
                                        </button>
                                    )}
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <Field label={t('FISh')}>
                                        <LText value={p.name} lang={lang} onChange={(v) => setP(i, { name: v })} />
                                    </Field>
                                    <Field label={t('Lavozim')}>
                                        <LText value={p.position} lang={lang} onChange={(v) => setP(i, { position: v })} />
                                    </Field>
                                    <Field label={t('Telefon')}>
                                        <input value={p.phone ?? ''} placeholder="+998 66 ..." onChange={(e) => setP(i, { phone: e.target.value })} className={inputCls} />
                                    </Field>
                                    <Field label={t('Ichki raqam')}>
                                        <input value={p.ext ?? ''} onChange={(e) => setP(i, { ext: e.target.value })} className={inputCls} />
                                    </Field>
                                    <Field label="E-mail">
                                        <input value={p.email ?? ''} onChange={(e) => setP(i, { email: e.target.value })} className={inputCls} />
                                    </Field>
                                    <Field label={t('Qabul kuni')}>
                                        <LText value={p.reception} lang={lang} placeholder={t('Masalan Dushanba 10 00 12 00')} onChange={(v) => setP(i, { reception: v })} />
                                    </Field>
                                    <Field label={t('Bolinma ixtiyoriy')}>
                                        <LText value={p.group} lang={lang} onChange={(v) => setP(i, { group: v })} />
                                    </Field>
                                </div>
                                <Field label={t('Malumoti')}>
                                    <LText value={p.education} lang={lang} multiline onChange={(v) => setP(i, { education: v })} />
                                </Field>
                                <div>
                                    <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                                        {t('Mehnat faoliyati')}
                                    </p>
                                    <div className="space-y-2">
                                        {p.career.map((c, ci) => (
                                            <div key={ci} className="flex gap-2">
                                                <input
                                                    value={c.year}
                                                    placeholder="2015–2020"
                                                    onChange={(e) =>
                                                        setP(i, {
                                                            career: p.career.map((x, k) => (k === ci ? { ...x, year: e.target.value } : x)),
                                                        })
                                                    }
                                                    className={`${inputCls} w-32 shrink-0`}
                                                />
                                                <LText
                                                    value={c.text}
                                                    lang={lang}
                                                    onChange={(v) =>
                                                        setP(i, {
                                                            career: p.career.map((x, k) => (k === ci ? { ...x, text: v } : x)),
                                                        })
                                                    }
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setP(i, { career: p.career.filter((_, k) => k !== ci) })}
                                                    className="p-1 text-red-500"
                                                    aria-label="remove"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setP(i, { career: [...p.career, { year: '', text: {} }] })}
                                        >
                                            <Plus className="mr-1 h-4 w-4" /> {t('Qator qoshish')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <Button type="button" size="sm" variant="outline" onClick={() => setPeople([...people, emptyPerson()])}>
                            <Plus className="mr-1 h-4 w-4" /> {t('Xodim qoshish')}
                        </Button>
                    </div>
                )
            }

            case 'orgchart': {
                const nodes = b.nodes
                const setNodes = (next: any[]) => update(b.id, { nodes: next })
                // Tugun va uning barcha avlodlari (o'ziga bo'ysundirib bo'lmaydi — sikl)
                const descendants = (id: string): Set<string> => {
                    const out = new Set<string>([id])
                    let grew = true
                    while (grew) {
                        grew = false
                        for (const n of nodes)
                            if (n.parentId && out.has(n.parentId) && !out.has(n.id)) {
                                out.add(n.id)
                                grew = true
                            }
                    }
                    return out
                }
                const pickName = (l?: Localized) => (l as any)?.[lang] || l?.uz || '—'
                return (
                    <div className="space-y-3">
                        <Field label={t('Ildiz')}>
                            <LText value={b.root} lang={lang} onChange={(v) => update(b.id, { root: v })} />
                        </Field>
                        {nodes.map((n, i) => {
                            const banned = descendants(n.id)
                            return (
                                <div key={n.id} className="flex flex-col gap-2 rounded-lg border bg-slate-50 p-3 md:flex-row md:items-end dark:bg-neutral-800/50">
                                    <div className="flex-1">
                                        <Field label={t('Bolinma nomi')}>
                                            <LText
                                                value={n.name}
                                                lang={lang}
                                                onChange={(v) => setNodes(nodes.map((x, k) => (k === i ? { ...x, name: v } : x)))}
                                            />
                                        </Field>
                                    </div>
                                    <div className="md:w-64">
                                        <Field label={t('Boysunadi')}>
                                            <select
                                                value={n.parentId}
                                                onChange={(e) =>
                                                    setNodes(nodes.map((x, k) => (k === i ? { ...x, parentId: e.target.value } : x)))
                                                }
                                                className={inputCls}
                                            >
                                                <option value="">{pickName(b.root)}</option>
                                                {nodes
                                                    .filter((x) => !banned.has(x.id))
                                                    .map((x) => (
                                                        <option key={x.id} value={x.id}>
                                                            {pickName(x.name)}
                                                        </option>
                                                    ))}
                                            </select>
                                        </Field>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            // o'chirilgan tugunning bolalari uning ota-onasiga o'tadi
                                            setNodes(
                                                nodes
                                                    .filter((x) => x.id !== n.id)
                                                    .map((x) => (x.parentId === n.id ? { ...x, parentId: n.parentId } : x))
                                            )
                                        }
                                        className="p-2 text-red-500"
                                        aria-label="remove"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            )
                        })}
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setNodes([...nodes, { id: uid(), name: {}, parentId: '' }])}
                        >
                            <Plus className="mr-1 h-4 w-4" /> {t('Bolinma qoshish')}
                        </Button>
                    </div>
                )
            }

            case 'gallery': {
                const imgs = b.images
                const setImgs = (next: any[]) => update(b.id, { images: next })
                return (
                    <div className="space-y-3">
                        <Field label={t('Ustunlar soni')}>
                            <Choice
                                value={b.cols}
                                onChange={(v) => update(b.id, { cols: v })}
                                options={[
                                    { value: '2', label: '2' },
                                    { value: '3', label: '3' },
                                    { value: '4', label: '4' },
                                ]}
                            />
                        </Field>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {imgs.map((im, i) => (
                                <div key={i} className="space-y-2 rounded-lg border bg-slate-50 p-3 dark:bg-neutral-800/50">
                                    {itemHeader(i, imgs.length, setImgs, imgs)}
                                    <div className="aspect-video overflow-hidden rounded bg-white dark:bg-neutral-900">
                                        {im.url && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={im.url} alt="" className="h-full w-full object-cover" />
                                        )}
                                    </div>
                                    <Field label={`${t('Alt matn')} *`}>
                                        <LText
                                            value={im.alt}
                                            lang={lang}
                                            onChange={(v) => setImgs(imgs.map((x, k) => (k === i ? { ...x, alt: v } : x)))}
                                        />
                                        {im.url && !im.alt?.uz?.trim() && (
                                            <span className="mt-1 block text-[11px] text-red-500">
                                                {t('Alt ozbekcha majburiy')}
                                            </span>
                                        )}
                                    </Field>
                                </div>
                            ))}
                        </div>
                        <UploadButton
                            accept="image/*"
                            label={t('Rasm qoshish')}
                            onUploaded={(url) => setImgs([...imgs, { url, alt: {} }])}
                        />
                    </div>
                )
            }

            case 'video': {
                const yt = youtubeId(b.url)
                return (
                    <>
                        <Field label={t('Video havolasi')}>
                            <div className="flex gap-2">
                                <input
                                    value={b.url ?? ''}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    onChange={(e) => update(b.id, { url: e.target.value })}
                                    className={inputCls}
                                />
                                <UploadButton
                                    accept="video/mp4,video/webm"
                                    label={t('Yuklash')}
                                    onUploaded={(url) => update(b.id, { url })}
                                />
                            </div>
                            <span className="mt-1 block text-[11px] text-slate-400">
                                {b.url ? (yt ? `YouTube: ${yt}` : t('Video fayl')) : t('Video izohi')}
                            </span>
                        </Field>
                        <Field label={t('Sarlavha')}>
                            <LText value={b.title} lang={lang} onChange={(v) => update(b.id, { title: v })} />
                        </Field>
                    </>
                )
            }

            case 'buttons': {
                const btns = b.items
                const setBtns = (next: any[]) => update(b.id, { items: next })
                return (
                    <div className="space-y-3">
                        {btns.map((it, i) => (
                            <div key={i} className="space-y-2 rounded-lg border bg-slate-50 p-3 dark:bg-neutral-800/50">
                                {itemHeader(i, btns.length, setBtns, btns)}
                                <div className="grid gap-3 md:grid-cols-2">
                                    <Field label={t('Tugma matni')}>
                                        <LText
                                            value={it.text}
                                            lang={lang}
                                            onChange={(v) => setBtns(btns.map((x, k) => (k === i ? { ...x, text: v } : x)))}
                                        />
                                    </Field>
                                    <Field label={t('Tugma havolasi')}>
                                        <input
                                            value={it.url}
                                            placeholder="/calc  ·  https://..."
                                            onChange={(e) =>
                                                setBtns(btns.map((x, k) => (k === i ? { ...x, url: e.target.value } : x)))
                                            }
                                            className={inputCls}
                                        />
                                    </Field>
                                </div>
                                <Choice
                                    value={it.variant}
                                    onChange={(v) => setBtns(btns.map((x, k) => (k === i ? { ...x, variant: v } : x)))}
                                    options={[
                                        { value: 'primary', label: t('Toldirilgan') },
                                        { value: 'outline', label: t('Ramkali') },
                                    ]}
                                />
                            </div>
                        ))}
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setBtns([...btns, { text: {}, url: '', variant: 'primary' }])}
                        >
                            <Plus className="mr-1 h-4 w-4" /> {t('Element qoshish')}
                        </Button>
                    </div>
                )
            }

            case 'map':
                return (
                    <>
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Latitude (lat)">
                                <input value={b.lat ?? ''} placeholder="39.657179" onChange={(e) => update(b.id, { lat: e.target.value })} className={inputCls} />
                            </Field>
                            <Field label="Longitude (lng)">
                                <input value={b.lng ?? ''} placeholder="66.965423" onChange={(e) => update(b.id, { lng: e.target.value })} className={inputCls} />
                            </Field>
                        </div>
                        <p className="text-[11px] text-slate-400">{t('Xarita izohi')}</p>
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field label={t('Masshtab')}>
                                <Choice
                                    value={b.zoom}
                                    onChange={(v) => update(b.id, { zoom: v })}
                                    options={[
                                        { value: '12', label: t('Shahar') },
                                        { value: '14', label: t('Tuman') },
                                        { value: '16', label: t('Kocha') },
                                        { value: '18', label: t('Bino') },
                                    ]}
                                />
                            </Field>
                            <Field label={t('Balandlik')}>
                                <Choice
                                    value={b.height}
                                    onChange={(v) => update(b.id, { height: v })}
                                    options={[
                                        { value: 'sm', label: 'S' },
                                        { value: 'md', label: 'M' },
                                        { value: 'lg', label: 'L' },
                                    ]}
                                />
                            </Field>
                        </div>
                    </>
                )

            case 'contact':
                return (
                    <>
                        <Field label={t('Sarlavha')}>
                            <LText value={b.title} lang={lang} onChange={(v) => update(b.id, { title: v })} />
                        </Field>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={b.showMap}
                                onChange={(e) => update(b.id, { showMap: e.target.checked })}
                            />
                            {t('Xaritani korsatish')}
                        </label>
                        <p className="text-[11px] text-slate-400">{t('Kontakt izohi')}</p>
                    </>
                )

            case 'feed':
                return (
                    <>
                        <Field label={t('Sarlavha')}>
                            <LText value={b.title} lang={lang} onChange={(v) => update(b.id, { title: v })} />
                        </Field>
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field label={t('Manba')}>
                                <Choice
                                    value={b.source}
                                    onChange={(v) => update(b.id, { source: v })}
                                    options={[
                                        { value: 'NEWS', label: t('Yangiliklar') },
                                        { value: 'ANNOUNCEMENTS', label: t('Elonlar') },
                                        { value: 'EVENTS', label: t('Tadbirlar') },
                                    ]}
                                />
                            </Field>
                            <Field label={t('Soni')}>
                                <Choice
                                    value={b.count}
                                    onChange={(v) => update(b.id, { count: v })}
                                    options={(['3', '4', '6', '8'] as const).map((n) => ({ value: n, label: n }))}
                                />
                            </Field>
                        </div>
                    </>
                )

            case 'columns': {
                const cols = b.columns
                const setCols = (next: SimpleBlock[][]) => update(b.id, { columns: next })
                const setCount = (n: 2 | 3) => {
                    if (n === cols.length) return
                    if (n === 3) setCols([...cols, []])
                    // 3 → 2: uchinchi ustundagi bloklar ikkinchisiga qo'shiladi (yo'qolmaydi)
                    else setCols([cols[0], [...cols[1], ...(cols[2] || [])]])
                }
                return (
                    <div className="space-y-3">
                        <Field label={t('Ustunlar soni')}>
                            <Choice
                                value={String(cols.length) as '2' | '3'}
                                onChange={(v) => setCount(Number(v) as 2 | 3)}
                                options={[
                                    { value: '2', label: '2' },
                                    { value: '3', label: '3' },
                                ]}
                            />
                        </Field>
                        <div className={`grid gap-3 ${cols.length === 3 ? 'lg:grid-cols-3' : 'md:grid-cols-2'}`}>
                            {cols.map((col, ci) => (
                                <div key={ci} className="space-y-2 rounded-lg border-2 border-dashed p-2">
                                    <p className="text-xs font-semibold text-slate-500">
                                        {t('Ustun')} {ci + 1}
                                    </p>
                                    {col.map((child, k) => {
                                        const meta = SIMPLE_PALETTE.find((m) => m.type === child.type)
                                        const isOpen = openChild === child.id
                                        const setCol = (next: SimpleBlock[]) =>
                                            setCols(cols.map((c, j) => (j === ci ? next : c)))
                                        return (
                                            <div key={child.id} className="rounded-lg border bg-background">
                                                <div className="flex items-center gap-1 px-2 py-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setOpenChild(isOpen ? null : child.id)}
                                                        className="flex flex-1 items-center gap-2 truncate text-left text-xs font-medium"
                                                    >
                                                        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                                        <span className="truncate">{meta ? t(meta.labelKey) : child.type}</span>
                                                        <span className="truncate text-slate-400">{summary(child, lang)}</span>
                                                    </button>
                                                    <button type="button" disabled={k === 0} onClick={() => setCol(move(col, k, -1))} className="p-1 text-slate-400 disabled:opacity-30" aria-label="up">
                                                        <ArrowUp className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button type="button" disabled={k === col.length - 1} onClick={() => setCol(move(col, k, 1))} className="p-1 text-slate-400 disabled:opacity-30" aria-label="down">
                                                        <ArrowDown className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button type="button" onClick={() => setCol(col.filter((_, j) => j !== k))} className="p-1 text-red-500" aria-label="remove">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                                {isOpen && (
                                                    <div className="space-y-3 border-t p-3">
                                                        {renderFields(child)}
                                                        {renderDesign(child)}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                    <select
                                        value=""
                                        onChange={(e) => {
                                            const type = e.target.value as Exclude<BlockType, 'columns'>
                                            if (!type) return
                                            const nb = createSimple(type)
                                            setCols(cols.map((c, j) => (j === ci ? [...c, nb] : c)))
                                            setOpenChild(nb.id)
                                        }}
                                        className={`${inputCls} text-xs`}
                                    >
                                        <option value="">+ {t('Blok qoshish')}</option>
                                        {SIMPLE_PALETTE.map((m) => (
                                            <option key={m.type} value={m.type}>
                                                {t(m.labelKey)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            case 'divider':
                return <p className="text-xs text-slate-500">{t('Sozlanadigan maydon yoq')}</p>
        }
    }

    const renderDesign = (b: Block) => {
        const d = { ...defaultDesign, ...(b.design || {}) }
        return (
            <div className="grid gap-3 rounded-lg border border-dashed p-3 md:grid-cols-2">
                <Field label={t('Fon')}>
                    <Choice
                        value={d.bg}
                        onChange={(v) => updateDesign(b.id, { bg: v })}
                        options={[
                            { value: 'white', label: t('Oq') },
                            { value: 'light', label: t('Och kulrang') },
                            { value: 'dark', label: t('Toq kok') },
                            { value: 'gradient', label: t('Gradient') },
                        ]}
                    />
                </Field>
                <Field label={t('Ichki boshliq')}>
                    <Choice
                        value={d.padding}
                        onChange={(v) => updateDesign(b.id, { padding: v })}
                        options={[
                            { value: 'sm', label: 'S' },
                            { value: 'md', label: 'M' },
                            { value: 'lg', label: 'L' },
                        ]}
                    />
                </Field>
                <Field label={t('Kenglik')}>
                    <Choice
                        value={d.width}
                        onChange={(v) => updateDesign(b.id, { width: v })}
                        options={[
                            { value: 'narrow', label: t('Tor') },
                            { value: 'medium', label: t('Orta') },
                            { value: 'full', label: t('Toliq') },
                        ]}
                    />
                </Field>
                <Field label={t('Tekislash')}>
                    <Choice
                        value={d.align}
                        onChange={(v) => updateDesign(b.id, { align: v })}
                        options={[
                            { value: 'left', label: t('Chap') },
                            { value: 'center', label: t('Markaz') },
                        ]}
                    />
                </Field>
            </div>
        )
    }

    const deviceWidth = { desktop: '100%', tablet: '768px', mobile: '390px' }[device]

    return (
        <div className="space-y-4">
            {pendingDraft && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
                    <div>
                        <p className="text-sm font-semibold">{t('Saqlanmagan qoralama topildi')}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                            {new Date(pendingDraft.savedAt).toLocaleString()} ·{' '}
                            {t('Qoralama izohi', { count: pendingDraft.blocks.length })}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={() => {
                                commit(pendingDraft.blocks)
                                setPendingDraft(null)
                            }}
                        >
                            {t('Tiklash')}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                removeDraft(draftKey)
                                setPendingDraft(null)
                            }}
                        >
                            {t('Ochirish')}
                        </Button>
                    </div>
                </div>
            )}

            {/* Asboblar paneli */}
            <div className="sticky top-[76px] z-20 flex flex-wrap items-center gap-2 rounded-xl border bg-background/95 p-3 backdrop-blur">
                {LANGS.map((l) => (
                    <button
                        key={l}
                        type="button"
                        onClick={() => setLang(l)}
                        className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                            lang === l
                                ? 'border-[#0A0A3D] bg-[#0A0A3D] text-white'
                                : 'border-black/10 bg-white text-slate-600 dark:border-white/15 dark:bg-neutral-800 dark:text-neutral-200'
                        }`}
                    >
                        {languageNames[l]}
                    </button>
                ))}
                <div className="ml-auto flex items-center gap-1">
                    {dirty && draftSavedAt && (
                        <span className="mr-2 hidden text-xs text-slate-500 md:inline" title={t('Qoralama brauzerda')}>
                            {t('Qoralama saqlandi')}{' '}
                            {new Date(draftSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                    <Button size="icon" variant="ghost" onClick={undo} disabled={!past.length} title="Ctrl+Z">
                        <Undo2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={redo} disabled={!future.length} title="Ctrl+Shift+Z">
                        <Redo2 className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant={showTemplates ? 'default' : 'outline'}
                        onClick={() => {
                            setShowTemplates((s) => !s)
                            setPreview(false)
                        }}
                    >
                        <LayoutTemplate className="mr-1 h-4 w-4" /> {t('Shablon')}
                    </Button>
                    <Button
                        size="sm"
                        variant={preview ? 'default' : 'outline'}
                        onClick={() => setPreview((p) => !p)}
                    >
                        <Eye className="mr-1 h-4 w-4" /> {t('Korinish')}
                    </Button>
                    <Button size="sm" onClick={save} disabled={saving || !dirty}>
                        <Save className="mr-1 h-4 w-4" />
                        {t('Saqlash')}
                        {dirty && <span className="ml-1.5 h-2 w-2 rounded-full bg-amber-400" />}
                    </Button>
                </div>
            </div>

            {preview ? (
                <div className="space-y-3">
                    <div className="flex justify-center gap-1">
                        {(
                            [
                                ['desktop', Monitor],
                                ['tablet', Tablet],
                                ['mobile', Smartphone],
                            ] as const
                        ).map(([d, Icon]) => (
                            <Button
                                key={d}
                                size="icon"
                                variant={device === d ? 'default' : 'outline'}
                                onClick={() => setDevice(d)}
                            >
                                <Icon className="h-4 w-4" />
                            </Button>
                        ))}
                    </div>
                    <div
                        className="mx-auto overflow-hidden rounded-xl border shadow-sm transition-all"
                        style={{ width: deviceWidth, maxWidth: '100%' }}
                    >
                        {blocks.length ? (
                            <BlockRenderer blocks={blocks} locale={lang} />
                        ) : (
                            <p className="p-10 text-center text-sm text-slate-500">
                                {t('Hali bloklar yoq')}
                            </p>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    {/* Bloklar ro'yxati */}
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-3">
                                {blocks.map((b) => {
                                    const meta = BLOCK_PALETTE.find((m) => m.type === b.type)
                                    const open = openId === b.id
                                    return (
                                        <SortableCard
                                            key={b.id}
                                            id={b.id}
                                            open={open}
                                            header={(handle) => (
                                                <div className="flex items-center gap-3 px-3 py-2.5">
                                                    {handle}
                                                    <button
                                                        type="button"
                                                        onClick={() => setOpenId(open ? null : b.id)}
                                                        className="flex flex-1 items-center gap-2 text-left"
                                                    >
                                                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
                                                            {meta ? t(meta.labelKey) : b.type}
                                                        </span>
                                                        <span className="truncate text-sm text-slate-500">
                                                            {summary(b, lang)}
                                                        </span>
                                                        <ChevronDown
                                                            className={`ml-auto h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
                                                        />
                                                    </button>
                                                    <Button size="icon" variant="ghost" onClick={() => duplicate(b.id)} title={t('Nusxalash')}>
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" onClick={() => remove(b.id)} title={t('Ochirish')}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            )}
                                        >
                                            {renderFields(b)}
                                            {renderDesign(b)}
                                        </SortableCard>
                                    )
                                })}
                            </div>
                        </SortableContext>
                    </DndContext>

                    {!blocks.length && contentToBlocks(legacyContent).length > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40">
                            <div>
                                <p className="text-sm font-semibold">{t('Mavjud matndan boshlash')}</p>
                                <p className="text-xs text-slate-600 dark:text-slate-300">
                                    {t('Mavjud matn izohi')}
                                </p>
                            </div>
                            <Button size="sm" onClick={() => commit(contentToBlocks(legacyContent))}>
                                {t('Matnni blokka kochirish')}
                            </Button>
                        </div>
                    )}

                    {(showTemplates || !blocks.length) && (
                        <div className="rounded-xl border border-dashed p-4">
                            <p className="mb-3 text-sm font-semibold">
                                {blocks.length ? t('Shablon tanlash') : t('Shablondan boshlash')}
                            </p>
                            <TemplatePicker onPick={applyTemplate} />
                        </div>
                    )}

                    {/* Blok qo'shish paneli */}
                    <div className="rounded-xl border bg-slate-50 p-4 dark:bg-neutral-800/50">
                        <p className="mb-3 text-sm font-semibold">{t('Blok qoshish')}</p>
                        <div className="flex flex-wrap gap-2">
                            {BLOCK_PALETTE.map((m) => (
                                <Button key={m.type} size="sm" variant="outline" onClick={() => add(m.type)}>
                                    <Plus className="mr-1 h-4 w-4" /> {t(m.labelKey)}
                                </Button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

/** Yopiq kartada ko'rinadigan qisqa tavsif. */
function summary(b: Block, lang: Lang): string {
    const p = (l?: Localized) => ((l as any)?.[lang] || l?.uz || '') as string
    switch (b.type) {
        case 'hero':
            return p(b.title)
        case 'text':
            return p(b.content).slice(0, 80)
        case 'image':
            return p(b.alt) || b.url || ''
        case 'cards':
        case 'stats':
        case 'faq':
        case 'docs':
            return `${b.items.length} ta`
        case 'people':
            return b.items.map((x) => p(x.name)).filter(Boolean).join(', ') || `${b.items.length} ta`
        case 'orgchart':
            return `${p(b.root)} · ${b.nodes.length} ta`
        case 'gallery':
            return `${b.images.length} ta`
        case 'buttons':
            return b.items.map((x) => p(x.text)).filter(Boolean).join(' · ')
        case 'video':
        case 'contact':
        case 'feed':
            return p(b.title) || (b.type === 'video' ? b.url || '' : b.type === 'feed' ? b.source : '')
        case 'map':
            return b.lat && b.lng ? `${b.lat}, ${b.lng}` : ''
        case 'columns':
            return b.columns.map((c) => c.length).join(' + ')
        default:
            return ''
    }
}
