'use client'

import useNotify from '@/hooks/use-notify'
import {
    BlockTypeSelect,
    BoldItalicUnderlineToggles,
    Button,
    CreateLink,
    imagePlugin,
    InsertImage,
    InsertTable,
    InsertThematicBreak,
    ListsToggle,
    MDXEditor,
    Separator,
    toolbarPlugin,
    UndoRedo,
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
import { useEffect, useMemo, useState } from 'react'

import { UploadedFile } from '@/components/file-upload-zone'
import { parseBlocks } from '@/lib/blocks'
import { languageNames, supportedLanguages } from '@/lib/utils'
import PageBuilder from './page-builder'
import { latinToCyrillic } from '@/lib/transliterate'
import { api, baseBackendUrl } from '@/models/axios'
import {
    AdmonitionDirectiveDescriptor,
    codeBlockPlugin,
    diffSourcePlugin,
    directivesPlugin,
    frontmatterPlugin,
    headingsPlugin,
    linkDialogPlugin,
    linkPlugin,
    listsPlugin,
    markdownShortcutPlugin,
    quotePlugin,
    tablePlugin,
    thematicBreakPlugin,
} from '@mdxeditor/editor'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { History } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'

type Lang = 'uz' | 'oz' | 'ru' | 'en'
type Contents = Record<Lang, string>

const LANGS = supportedLanguages as Lang[]

/** Backend content (string | {uz,oz,ru,en,all} | null) → to'liq Contents obyekti. */
function toContents(raw: unknown): Contents {
    const base: Contents = { uz: '', oz: '', ru: '', en: '' }
    if (!raw) return base
    if (typeof raw === 'string') return { ...base, uz: raw }
    if (typeof raw === 'object') {
        const o = raw as Record<string, unknown>
        for (const l of LANGS) if (typeof o[l] === 'string') base[l] = o[l] as string
    }
    return base
}

const Editor = () => {
    const { id } = useParams()
    const t = useTranslations()
    const [, setFiles] = useState<UploadedFile[]>([])
    const { toastSuccess, toastError } = useNotify()

    const [contents, setContents] = useState<Contents>({
        uz: '',
        oz: '',
        ru: '',
        en: '',
    })
    const [activeLang, setActiveLang] = useState<Lang>('uz')
    const [saving, setSaving] = useState(false)
    const [showVersions, setShowVersions] = useState(false)
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        enabled: !!id,
        queryKey: ['sub-menu', id],
        refetchOnMount: true,
        refetchOnWindowFocus: false,
        queryFn: async () => {
            const response = await api.get(`/sub-menu/slug/${id}`)
            return response.data
        },
    })

    const versions = useQuery({
        enabled: showVersions && !!data?.id,
        queryKey: ['sub-menu-versions', data?.id],
        queryFn: async () => {
            const res = await api.get(`/sub-menu/versions/${data.id}`)
            return res.data as { id: string; content: any; createdAt: string }[]
        },
    })

    const revert = useMutation({
        mutationFn: async (versionId: string) => {
            const res = await api.patch(`/sub-menu/revert/${data.id}`, {
                versionId,
            })
            return res.data
        },
        onSuccess: async (updated) => {
            setContents(toContents(updated.content))
            toastSuccess(t('Versiya tiklandi'))
            setShowVersions(false)
            await queryClient.invalidateQueries({
                queryKey: ['sub-menu-versions', data?.id],
            })
        },
        onError: () => toastError(t('Malumotlar saqlashda xatolik yuzaga keldi')),
    })

    // Ma'lumot kelganda contents'ni to'ldiramiz (bir marta)
    useEffect(() => {
        if (data) setContents(toContents(data.content))
    }, [data])

    // Vizual konstruktor bloklari (memo — PageBuilder har renderda reset bo'lmasin)
    const initialBlocks = useMemo(() => parseBlocks(data?.blocks), [data?.blocks])
    const [mode, setMode] = useState<'text' | 'blocks' | null>(null)
    const activeMode = mode ?? (initialBlocks.length ? 'blocks' : 'text')

    // Qaysi tillar bo'sh — ko'rsatkich uchun
    const emptyLangs = useMemo(
        () => LANGS.filter((l) => !contents[l]?.trim()),
        [contents]
    )

    const handleSave = async () => {
        if (!data?.id || saving) return
        setSaving(true)
        // bo'sh tillarni yubormaymiz; 'all' bo'lsa saqlaymiz
        const payload: Record<string, string> = {}
        for (const l of LANGS) if (contents[l]?.trim()) payload[l] = contents[l]
        const existingAll = (data.content as any)?.all
        if (typeof existingAll === 'string' && existingAll.trim())
            payload.all = existingAll

        try {
            await api.patch(`/sub-menu/update/${data.id}`, { content: payload })
            toastSuccess(t('Malumotlar muvaffaqiyatli saqlandi'))
        } catch (error) {
            toastError(t('Malumotlar saqlashda xatolik yuzaga keldi'))
            console.error('Error saving menu:', error)
        } finally {
            setSaving(false)
        }
    }

    const imageUploadHandler = async (image: File): Promise<string> => {
        const formData = new FormData()
        formData.append('file', image)
        try {
            const response = await api.post('/uploads', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            const uploadPath = response.data?.uploadPath
            toastSuccess(t('Rasmlar muvaffaqiyatli yuklandi'))
            return `${baseBackendUrl}/${uploadPath}`
        } catch (error) {
            console.error('Image upload error:', error)
            toastError(t('Rasmlar yuklashda xatolik yuz berdi'))
            return 'https://via.placeholder.com/150?text=Upload+Failed'
        }
    }

    if (isLoading) {
        return <div>{t('Yuklanmoqda')}...</div>
    }

    const modeSwitch = (
        <div className="inline-flex self-start rounded-lg border p-1">
            {(
                [
                    ['text', t('Oddiy matn')],
                    ['blocks', t('Vizual konstruktor')],
                ] as const
            ).map(([m, label]) => (
                <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                        activeMode === m
                            ? 'bg-[#0A0A3D] text-white'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                    }`}
                >
                    {label}
                </button>
            ))}
        </div>
    )

    if (activeMode === 'blocks' && data?.id) {
        return (
            <div
                style={{ maxWidth: '1100px' }}
                className="mx-auto py-10 flex flex-col gap-4"
            >
                {modeSwitch}
                <p className="text-xs text-slate-500">
                    {t('Konstruktor izohi')}
                </p>
                <PageBuilder
                    submenuId={data.id}
                    initialBlocks={initialBlocks}
                    legacyContent={data.content}
                />
            </div>
        )
    }

    return (
        <div
            style={{ maxWidth: '900px' }}
            className="mx-auto py-10 flex flex-col gap-3"
        >
            {modeSwitch}
            {/* Til tablari */}
            <div className="flex flex-wrap items-center gap-2 border-b pb-3">
                {LANGS.map((l) => {
                    const active = l === activeLang
                    const empty = emptyLangs.includes(l)
                    return (
                        <button
                            key={l}
                            type="button"
                            onClick={() => setActiveLang(l)}
                            className={`relative rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                                active
                                    ? 'border-[#0A0A3D] bg-[#0A0A3D] text-white'
                                    : 'border-black/10 bg-white text-slate-600 hover:border-slate-300 dark:border-white/15 dark:bg-neutral-800 dark:text-neutral-200'
                            }`}
                            title={empty ? t('Bu til toldirilmagan') : undefined}
                        >
                            {languageNames[l]}
                            {empty && (
                                <span
                                    className="ml-1.5 inline-block h-2 w-2 rounded-full bg-amber-400 align-middle"
                                    aria-hidden
                                />
                            )}
                        </button>
                    )
                })}

                <div className="ml-auto flex gap-2">
                    {/* uz → oz transliteratsiya (ixtiyoriy yordam) */}
                    {activeLang === 'oz' && (
                        <button
                            type="button"
                            onClick={() =>
                                setContents((p) => ({
                                    ...p,
                                    oz: latinToCyrillic(p.uz),
                                }))
                            }
                            disabled={!contents.uz?.trim()}
                            className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm text-slate-600 hover:border-slate-300 disabled:opacity-40 dark:border-white/15 dark:bg-neutral-800 dark:text-neutral-200"
                            title={t('Lotindan kirillga ogirish')}
                        >
                            ⇄ {t('Lotindan kirillga')}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setShowVersions((s) => !s)}
                        className="flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm text-slate-600 hover:border-slate-300 dark:border-white/15 dark:bg-neutral-800 dark:text-neutral-200"
                    >
                        <History className="h-4 w-4" />
                        {t('Versiyalar')}
                    </button>
                </div>
            </div>

            {showVersions && (
                <div className="rounded-lg border bg-slate-50 p-4 dark:bg-neutral-800/50">
                    <h3 className="mb-3 text-sm font-semibold">
                        {t('Versiyalar tarixi')}
                    </h3>
                    {versions.isLoading ? (
                        <p className="text-sm text-slate-500">{t('Yuklanmoqda')}...</p>
                    ) : !versions.data?.length ? (
                        <p className="text-sm text-slate-500">
                            {t('Hali versiyalar yoq')}
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {versions.data.map((v, i) => (
                                <li
                                    key={v.id}
                                    className="flex items-center justify-between rounded-md border bg-background px-3 py-2"
                                >
                                    <span className="text-sm text-slate-600 dark:text-slate-300">
                                        {i === 0 && (
                                            <span className="mr-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                {t('Oxirgi')}
                                            </span>
                                        )}
                                        {new Date(v.createdAt).toLocaleString()}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => revert.mutate(v.id)}
                                        disabled={revert.isPending}
                                        className="rounded-md border border-black/10 px-3 py-1 text-sm hover:bg-slate-100 disabled:opacity-40 dark:border-white/15"
                                    >
                                        {t('Qaytarish')}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {emptyLangs.length > 0 && (
                <p className="text-xs text-amber-600">
                    {t('Toldirilmagan tillar')}:{' '}
                    {emptyLangs.map((l) => languageNames[l]).join(', ')}
                </p>
            )}

            {/* Har til uchun alohida editor (key bilan remount) */}
            <MDXEditor
                key={activeLang}
                className="shadow-sm"
                markdown={contents[activeLang] || ''}
                onChange={(md) =>
                    setContents((p) => ({ ...p, [activeLang]: md }))
                }
                plugins={[
                    headingsPlugin(),
                    listsPlugin(),
                    quotePlugin(),
                    thematicBreakPlugin(),
                    markdownShortcutPlugin(),
                    tablePlugin(),
                    linkPlugin(),
                    linkDialogPlugin(),
                    imagePlugin({ imageUploadHandler }),
                    frontmatterPlugin(),
                    codeBlockPlugin(),
                    directivesPlugin({
                        directiveDescriptors: [AdmonitionDirectiveDescriptor],
                    }),
                    diffSourcePlugin({
                        diffMarkdown: 'An older version',
                        viewMode: 'rich-text',
                    }),
                    toolbarPlugin({
                        toolbarContents: () => (
                            <>
                                <UndoRedo />
                                <Separator />
                                <BoldItalicUnderlineToggles />
                                <Separator />
                                <BlockTypeSelect />
                                <ListsToggle />
                                <Separator />
                                <CreateLink />
                                <InsertImage />
                                <Separator />
                                <InsertTable />
                                <InsertThematicBreak />
                                <Separator />
                                <Button onClick={handleSave} title="Saqlash">
                                    💾 {t('Saqlash')}
                                </Button>
                            </>
                        ),
                    }),
                ]}
            />
        </div>
    )
}

export default Editor
