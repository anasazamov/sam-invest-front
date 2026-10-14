'use client'

import SortableList from '@/components/admin/sortable-list'
import UploadButton from '@/components/admin/upload-button'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useNotify from '@/hooks/use-notify'
import { Localized } from '@/lib/blocks'
import {
    DEFAULT_ACCENT,
    DEFAULT_PRIMARY,
    FONTS,
    HOME_SECTION_LABELS,
    isHex,
    LinkItem,
    normalizeSettings,
    SITE_SETTINGS_KEY,
    SiteSettings,
    useSiteSettings,
} from '@/lib/site-settings'
import { languageNames, supportedLanguages } from '@/lib/utils'
import { api } from '@/models/axios'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Loader2, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ReactNode, useEffect, useState } from 'react'

type Lang = 'uz' | 'oz' | 'ru' | 'en'
const LANGS = supportedLanguages as Lang[]

const inputCls =
    'w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#0A0A3D] dark:border-white/15 dark:bg-neutral-800 dark:text-neutral-100'

const PRIMARY_PRESETS = ['#0A0A3D', '#0F172A', '#1E3A8A', '#14532D', '#7F1D1D', '#312E81']
const ACCENT_PRESETS = ['#3B82F6', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
    return (
        <div className="space-y-1">
            <p className="text-sm font-medium">{label}</p>
            {children}
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
    )
}

function LInput({
    value,
    lang,
    onChange,
    multiline,
}: {
    value: Localized
    lang: Lang
    onChange: (v: Localized) => void
    multiline?: boolean
}) {
    const v = (value as any)?.[lang] ?? ''
    const set = (s: string) => onChange({ ...value, [lang]: s })
    return multiline ? (
        <textarea rows={4} value={v} onChange={(e) => set(e.target.value)} className={inputCls} />
    ) : (
        <input value={v} onChange={(e) => set(e.target.value)} className={inputCls} />
    )
}

function ImageField({
    label,
    value,
    onChange,
    dark,
}: {
    label: string
    value: string
    onChange: (v: string) => void
    dark?: boolean
}) {
    const t = useTranslations()
    return (
        <Field label={label} hint={t('Havola http(s):// yoki / bilan boshlanishi kerak')}>
            <div className="flex items-center gap-3">
                <div
                    className={`flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border ${
                        dark ? 'bg-[#0A0A3D]' : 'bg-white'
                    }`}
                >
                    {value && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={value} alt="" className="max-h-full max-w-full object-contain" />
                    )}
                </div>
                <input value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
                <UploadButton accept="image/*" label={t('Yuklash')} onUploaded={onChange} />
            </div>
        </Field>
    )
}

function ColorField({
    label,
    value,
    presets,
    onChange,
}: {
    label: string
    value: string
    presets: string[]
    onChange: (v: string) => void
}) {
    const [text, setText] = useState(value)
    useEffect(() => setText(value), [value])
    return (
        <Field label={label}>
            <div className="flex flex-wrap items-center gap-2">
                <input
                    type="color"
                    value={isHex(value) ? value : '#000000'}
                    onChange={(e) => onChange(e.target.value.toUpperCase())}
                    className="h-10 w-14 cursor-pointer rounded border"
                />
                <input
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value)
                        if (isHex(e.target.value)) onChange(e.target.value.toUpperCase())
                    }}
                    className={`${inputCls} w-28 font-mono ${isHex(text) ? '' : 'border-red-400'}`}
                />
                {presets.map((p) => (
                    <button
                        key={p}
                        type="button"
                        onClick={() => onChange(p)}
                        title={p}
                        className={`h-8 w-8 rounded-full border-2 ${
                            value.toUpperCase() === p ? 'border-slate-900 dark:border-white' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: p }}
                    />
                ))}
            </div>
        </Field>
    )
}

function LinksEditor({
    items,
    lang,
    onChange,
    titleLabel,
}: {
    items: LinkItem[]
    lang: Lang
    onChange: (next: LinkItem[]) => void
    titleLabel: string
}) {
    const t = useTranslations()
    const set = (i: number, patch: Partial<LinkItem>) =>
        onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x)))
    const move = (i: number, d: -1 | 1) => {
        const j = i + d
        if (j < 0 || j >= items.length) return
        const next = [...items]
        ;[next[i], next[j]] = [next[j], next[i]]
        onChange(next)
    }
    return (
        <div className="space-y-3">
            {items.map((it, i) => (
                <div key={i} className="space-y-3 rounded-xl border p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">#{i + 1}</span>
                        <div className="flex gap-1">
                            <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)}>
                                <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                                <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => onChange(items.filter((_, j) => j !== i))}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                        </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        <Field label={titleLabel}>
                            <LInput value={it.title} lang={lang} onChange={(v) => set(i, { title: v })} />
                        </Field>
                        <Field label={t('Havola')}>
                            <input
                                value={it.url}
                                placeholder="https://..."
                                onChange={(e) => set(i, { url: e.target.value })}
                                className={inputCls}
                            />
                        </Field>
                    </div>
                    <ImageField label={t('Logotip')} value={it.logo} onChange={(v) => set(i, { logo: v })} />
                </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => onChange([...items, { title: {}, url: '', logo: '' }])}>
                <Plus className="mr-1 h-4 w-4" /> {t('Qoshish')}
            </Button>
        </div>
    )
}

export default function AdminDesign() {
    const t = useTranslations()
    const queryClient = useQueryClient()
    const { toastSuccess, toastError } = useNotify()
    const settings = useSiteSettings()

    const [form, setForm] = useState<SiteSettings | null>(null)
    const [lang, setLang] = useState<Lang>('uz')
    const [saving, setSaving] = useState(false)

    // Header tabidagi menyular ro'yxati (ko'rinish uchun)
    const menus = useQuery({
        queryKey: ['menus'],
        queryFn: async () => (await api.get('/menu')).data as { id: string; slug: string; name?: Localized }[],
    })

    // Haqiqiy ma'lumot kelgach (placeholder emas) formani bir marta to'ldiramiz
    useEffect(() => {
        if (!form && settings.data && !settings.isPlaceholderData) setForm(settings.data)
    }, [form, settings.data, settings.isPlaceholderData])

    if (!form) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    const patch = (p: Partial<SiteSettings>) => setForm((f) => (f ? { ...f, ...p } : f))

    const save = async () => {
        setSaving(true)
        try {
            const res = await api.patch('/site-settings', form)
            const fresh = normalizeSettings(res.data)
            queryClient.setQueryData(SITE_SETTINGS_KEY, fresh)
            setForm(fresh)
            toastSuccess(t('Saqlandi'))
        } catch {
            toastError(t('Xatolik'))
        } finally {
            setSaving(false)
        }
    }

    const langTabs = (
        <div className="flex flex-wrap gap-1">
            {LANGS.map((l) => (
                <button
                    key={l}
                    type="button"
                    onClick={() => setLang(l)}
                    className={`rounded-md border px-3 py-1 text-xs font-medium ${
                        lang === l
                            ? 'border-[#0A0A3D] bg-[#0A0A3D] text-white'
                            : 'border-black/10 text-slate-600 dark:border-white/15 dark:text-neutral-300'
                    }`}
                >
                    {languageNames[l]}
                </button>
            ))}
        </div>
    )

    return (
        <div className="container-cs space-y-6 py-10">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-6">
                <div>
                    <h1 className="text-2xl font-bold">{t('Dizayn')}</h1>
                    <p className="text-sm text-muted-foreground">{t('Dizayn izohi')}</p>
                </div>
                <div className="flex items-center gap-3">
                    {langTabs}
                    <Button onClick={save} disabled={saving}>
                        {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                        {t('Saqlash')}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="general">
                <TabsList className="flex-wrap">
                    <TabsTrigger value="general">{t('Umumiy')}</TabsTrigger>
                    <TabsTrigger value="header">Header</TabsTrigger>
                    <TabsTrigger value="colors">{t('Ranglar va shrift')}</TabsTrigger>
                    <TabsTrigger value="footer">Footer</TabsTrigger>
                    <TabsTrigger value="home">{t('Bosh sahifa')}</TabsTrigger>
                    <TabsTrigger value="links">{t('Foydali havolalar')}</TabsTrigger>
                    <TabsTrigger value="partners">{t('Hamkorlar')}</TabsTrigger>
                </TabsList>

                {/* Umumiy */}
                <TabsContent value="general" className="space-y-5 pt-4">
                    <Field label={t('Sayt nomi')} hint={t('Bosh bolsa standart nom korsatiladi')}>
                        <LInput value={form.siteName} lang={lang} onChange={(v) => patch({ siteName: v })} />
                    </Field>
                    <ImageField label={t('Logo yorug fon uchun')} value={form.logoLight} onChange={(v) => patch({ logoLight: v })} />
                    <ImageField label={t('Logo toq fon uchun')} value={form.logoDark} onChange={(v) => patch({ logoDark: v })} dark />
                    <ImageField label="Favicon" value={form.favicon} onChange={(v) => patch({ favicon: v })} />
                </TabsContent>

                {/* Header va preheader */}
                <TabsContent value="header" className="max-w-2xl space-y-6 pt-4">
                    <div className="space-y-2">
                        <p className="text-sm font-semibold">{t('Menyu bandlari')}</p>
                        <p className="text-xs text-muted-foreground">{t('Menyu bandlari izohi')}</p>
                        {(
                            [
                                ['showHome', t('Bosh sahifa')],
                                ['showCalc', t('Kalkulyator')],
                                ['showPress', t('Matbuot')],
                            ] as const
                        ).map(([key, label]) => (
                            <div key={key} className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                                <span className={form.header[key] ? '' : 'text-muted-foreground line-through'}>{label}</span>
                                <Switch
                                    checked={form.header[key]}
                                    onCheckedChange={(v) => patch({ header: { ...form.header, [key]: v } })}
                                />
                            </div>
                        ))}
                        {(menus.data ?? []).map((m) => {
                            const visible = !form.header.hiddenMenus.includes(m.id)
                            return (
                                <div key={m.id} className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                                    <span className={visible ? '' : 'text-muted-foreground line-through'}>
                                        {(m.name as any)?.[lang] || m.name?.uz || m.slug}
                                    </span>
                                    <Switch
                                        checked={visible}
                                        onCheckedChange={(v) =>
                                            patch({
                                                header: {
                                                    ...form.header,
                                                    hiddenMenus: v
                                                        ? form.header.hiddenMenus.filter((id) => id !== m.id)
                                                        : [...form.header.hiddenMenus, m.id],
                                                },
                                            })
                                        }
                                    />
                                </div>
                            )
                        })}
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-semibold">Preheader</p>
                        {(
                            [
                                ['showAddress', t('Manzilni korsatish')],
                                ['showEmail', t('E-pochtani korsatish')],
                            ] as const
                        ).map(([key, label]) => (
                            <div key={key} className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                                <span>{label}</span>
                                <Switch
                                    checked={form.preheader[key]}
                                    onCheckedChange={(v) => patch({ preheader: { ...form.preheader, [key]: v } })}
                                />
                            </div>
                        ))}
                        <Field label={t('Elon qatori')} hint={t('Elon qatori izohi')}>
                            <LInput
                                value={form.preheader.text}
                                lang={lang}
                                onChange={(v) => patch({ preheader: { ...form.preheader, text: v } })}
                            />
                        </Field>
                    </div>
                </TabsContent>

                {/* Ranglar va shrift */}
                <TabsContent value="colors" className="space-y-6 pt-4">
                    <ColorField
                        label={t('Asosiy rang')}
                        value={form.colors.primary}
                        presets={PRIMARY_PRESETS}
                        onChange={(v) => patch({ colors: { ...form.colors, primary: v } })}
                    />
                    <ColorField
                        label={t('Aksent rang')}
                        value={form.colors.accent}
                        presets={ACCENT_PRESETS}
                        onChange={(v) => patch({ colors: { ...form.colors, accent: v } })}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => patch({ colors: { primary: DEFAULT_PRIMARY, accent: DEFAULT_ACCENT } })}
                    >
                        <RotateCcw className="mr-1 h-4 w-4" /> {t('Standart ranglar')}
                    </Button>

                    {/* Jonli ko'rinish */}
                    <div className="overflow-hidden rounded-2xl border">
                        <div className="p-6 text-white" style={{ backgroundColor: form.colors.primary }}>
                            <p className="text-lg font-bold">{t('Namuna sarlavha')}</p>
                            <p className="mt-1 text-sm opacity-80">{t('Namuna matn')}</p>
                            <span
                                className="mt-4 inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white"
                                style={{ backgroundColor: form.colors.accent }}
                            >
                                {t('Namuna tugma')}
                            </span>
                        </div>
                        <div className="p-6">
                            <p className="font-semibold" style={{ color: form.colors.accent }}>
                                {t('Namuna havola')}
                            </p>
                        </div>
                    </div>

                    <Field label={t('Shrift')}>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {FONTS.map((f) => (
                                <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => patch({ font: f.id })}
                                    className={`rounded-xl border p-4 text-left transition ${
                                        form.font === f.id ? 'border-[#0A0A3D] ring-2 ring-[#0A0A3D]/20' : 'hover:border-slate-300'
                                    }`}
                                    style={{ fontFamily: `var(${f.cssVar}), sans-serif` }}
                                >
                                    <p className="font-semibold">{f.label}</p>
                                    <p className="text-sm text-muted-foreground">Samarqand Invest — Самарқанд Инвест</p>
                                </button>
                            ))}
                        </div>
                    </Field>
                </TabsContent>

                {/* Footer */}
                <TabsContent value="footer" className="space-y-5 pt-4">
                    <Field label={t('Footer matni')} hint={t('Bosh bolsa standart matn korsatiladi')}>
                        <LInput multiline value={form.footerText} lang={lang} onChange={(v) => patch({ footerText: v })} />
                    </Field>
                    <Field label={t('Mualliflik qatori')} hint={t('Yil avtomatik qoshiladi')}>
                        <LInput value={form.copyright} lang={lang} onChange={(v) => patch({ copyright: v })} />
                    </Field>
                    <p className="text-xs text-muted-foreground">{t('Ijtimoiy tarmoqlar izohi')}</p>
                </TabsContent>

                {/* Bosh sahifa seksiyalari */}
                <TabsContent value="home" className="max-w-2xl space-y-3 pt-4">
                    <p className="text-sm text-muted-foreground">{t('Bosh sahifa izohi')}</p>
                    <SortableList
                        items={form.homeSections.map((s) => ({
                            id: s.key,
                            label: (
                                <div className="flex items-center justify-between gap-3">
                                    <span className={s.enabled ? '' : 'text-muted-foreground line-through'}>
                                        {t(HOME_SECTION_LABELS[s.key])}
                                    </span>
                                    <Switch
                                        checked={s.enabled}
                                        onCheckedChange={(checked) =>
                                            patch({
                                                homeSections: form.homeSections.map((x) =>
                                                    x.key === s.key ? { ...x, enabled: checked } : x
                                                ),
                                            })
                                        }
                                    />
                                </div>
                            ),
                        }))}
                        onReorder={(ids) =>
                            patch({
                                homeSections: ids
                                    .map((id) => form.homeSections.find((s) => s.key === id))
                                    .filter(Boolean) as SiteSettings['homeSections'],
                            })
                        }
                    />
                </TabsContent>

                {/* Foydali havolalar */}
                <TabsContent value="links" className="space-y-3 pt-4">
                    <p className="text-sm text-muted-foreground">{t('Foydali havolalar izohi')}</p>
                    <LinksEditor
                        items={form.usefulLinks}
                        lang={lang}
                        titleLabel={t('Nomi')}
                        onChange={(v) => patch({ usefulLinks: v })}
                    />
                </TabsContent>

                {/* Hamkorlar */}
                <TabsContent value="partners" className="space-y-3 pt-4">
                    <p className="text-sm text-muted-foreground">{t('Hamkorlar izohi')}</p>
                    <LinksEditor
                        items={form.partners}
                        lang={lang}
                        titleLabel={t('Nomi')}
                        onChange={(v) => patch({ partners: v })}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
