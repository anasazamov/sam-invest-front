'use client'

import { STAT_ICONS, StatIcon } from '@/components/statistics-section/stat-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useNotify from '@/hooks/use-notify'
import { languageNames, supportedLanguages } from '@/lib/utils'
import { api } from '@/models/axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

type Localized = Record<string, string>
interface StatItem {
    id: string
    value: string
    label: Localized
    icon?: string | null
}

const LANGS = supportedLanguages

type StatPayload = { value: string; label: Localized; icon: string | null }

const emptyForm = () => ({
    value: '',
    label: LANGS.reduce((a, l) => ({ ...a, [l]: '' }), {} as Localized),
    icon: '', // '' — avtomatik (tartib bo'yicha asl ikonka)
})

const AdminStatistics = () => {
    const t = useTranslations()
    const locale = useLocale()
    const queryClient = useQueryClient()
    const { toastSuccess, toastError } = useNotify()

    const [open, setOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState(emptyForm())

    const stats = useQuery({
        queryKey: ['statistics'],
        queryFn: async () => {
            const res = await api.get('/statistic')
            return res.data as StatItem[]
        },
    })

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: ['statistics'] })

    const createStat = useMutation({
        mutationFn: async (data: StatPayload) => {
            const res = await api.post('/statistic', data)
            return res.data
        },
        onSuccess: async () => {
            await invalidate()
            close()
            toastSuccess(t('Saqlandi'))
        },
        onError: () => toastError(t('Xatolik')),
    })

    const updateStat = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: StatPayload }) => {
            const res = await api.patch(`/statistic/${id}`, data)
            return res.data
        },
        onSuccess: async () => {
            await invalidate()
            close()
            toastSuccess(t('Saqlandi'))
        },
        onError: () => toastError(t('Xatolik')),
    })

    const deleteStat = useMutation({
        mutationFn: async (id: string) => api.delete(`/statistic/${id}`),
        onSuccess: async () => {
            await invalidate()
            toastSuccess(t('Ochirildi'))
        },
        onError: () => toastError(t('Xatolik')),
    })

    const close = () => {
        setOpen(false)
        setEditingId(null)
        setForm(emptyForm())
    }

    const startEdit = (s: StatItem) => {
        setEditingId(s.id)
        setForm({
            value: s.value,
            label: LANGS.reduce(
                (a, l) => ({ ...a, [l]: s.label?.[l] || '' }),
                {} as Localized
            ),
            icon: s.icon || '',
        })
        setOpen(true)
    }

    const submit = () => {
        if (!form.value.trim()) return toastError(t('Qiymat majburiy'))
        const data = { ...form, icon: form.icon || null }
        if (editingId) updateStat.mutate({ id: editingId, data })
        else createStat.mutate(data)
    }

    // ESC/overlay yopilganda formani tozalash
    useEffect(() => {
        if (!open) {
            setEditingId(null)
            setForm(emptyForm())
        }
    }, [open])

    return (
        <div className="container-cs py-10">
            <div className="flex items-center justify-between border-b pb-6">
                <div>
                    <h1 className="text-2xl font-bold">{t('Statistika')}</h1>
                    <p className="text-sm text-muted-foreground">
                        {t('Bosh sahifadagi statistika kartalari')}
                    </p>
                </div>
                <Button onClick={() => setOpen(true)}>
                    <Plus className="mr-1 h-4 w-4" /> {t('Qoshish')}
                </Button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stats.data?.map((s, i) => (
                    <div
                        key={s.id}
                        className="rounded-xl border bg-background p-5"
                    >
                        <div className="flex items-center gap-3 text-3xl font-bold text-[#0A0A3D] dark:text-blue-400">
                            <StatIcon name={s.icon} index={i} className="h-7 w-7 text-cyan-500" />
                            {s.value}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {s.label?.[locale] || s.label?.uz}
                        </p>
                        <div className="mt-4 flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEdit(s)}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteStat.mutate(s.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
                {stats.data?.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        {t('Hali malumot yoq')}
                    </p>
                )}
            </div>

            <Sheet open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
                <SheetContent className="overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>
                            {editingId ? t('Tahrirlash') : t('Qoshish')}
                        </SheetTitle>
                        <SheetDescription className="hidden" />
                    </SheetHeader>

                    <div className="space-y-4 px-4 pb-6">
                        <div>
                            <Label className="pb-2">{t('Qiymat')}</Label>
                            <Input
                                value={form.value}
                                placeholder="16 / 1.9 mlrd $"
                                onChange={(e) =>
                                    setForm((p) => ({ ...p, value: e.target.value }))
                                }
                            />
                        </div>

                        <div>
                            <Label className="pb-2">{t('Ikonka')}</Label>
                            <div className="grid grid-cols-4 gap-2">
                                {[{ key: '', labelKey: 'statIcon.auto' }, ...STAT_ICONS].map((ic) => (
                                    <button
                                        key={ic.key || 'auto'}
                                        type="button"
                                        title={t(ic.labelKey)}
                                        onClick={() => setForm((p) => ({ ...p, icon: ic.key }))}
                                        className={`flex h-12 items-center justify-center rounded-lg border-2 text-cyan-600 transition ${
                                            form.icon === ic.key
                                                ? 'border-[#0A0A3D] bg-slate-100 dark:border-blue-400 dark:bg-neutral-800'
                                                : 'border-transparent bg-slate-50 hover:border-slate-300 dark:bg-neutral-900'
                                        }`}
                                    >
                                        {ic.key ? (
                                            <StatIcon name={ic.key} className="h-6 w-6" />
                                        ) : (
                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                                {t('statIcon.auto')}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Label className="pb-2">{t('Izoh')}</Label>
                            <Tabs defaultValue="uz">
                                <TabsList>
                                    {LANGS.map((l) => (
                                        <TabsTrigger key={l} value={l}>
                                            {languageNames[l]}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                                {LANGS.map((l) => (
                                    <TabsContent key={l} value={l}>
                                        <Input
                                            value={form.label[l]}
                                            onChange={(e) =>
                                                setForm((p) => ({
                                                    ...p,
                                                    label: {
                                                        ...p.label,
                                                        [l]: e.target.value,
                                                    },
                                                }))
                                            }
                                        />
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </div>

                        <Button
                            className="w-full"
                            onClick={submit}
                            disabled={createStat.isPending || updateStat.isPending}
                        >
                            {t('Saqlash')}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}

export default AdminStatistics
