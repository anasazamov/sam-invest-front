'use client'

import { AutoForm, FormField } from '@/components/form/auto-form'
import MyTable, { IColumn } from '@/components/my-table'
import SortableList from '@/components/admin/sortable-list'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { api } from '@/models/axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Pencil, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

const AdminMenus = () => {
    const t = useTranslations()
    const [open, setOpen] = useState<boolean>(false)
    const [editing, setEditing] = useState<string | null>(null)
    const [reordering, setReordering] = useState(false)
    const queryClient = useQueryClient()
    const pathname = usePathname()
    const form = useForm()

    const menus = useQuery({
        queryKey: ['menus'],
        queryFn: async () => {
            const res = await api.get('/menu')
            return res.data
        },
    })

    const menu = useQuery({
        enabled: !!editing,
        queryKey: ['menu', editing],
        queryFn: async () => {
            const res = await api.get(`/menu/${editing}`)
            return res.data
        },
    })

    const createMenu = useMutation({
        mutationFn: async (data: Record<string, any>) => {
            const res = await api.post('/menu/create', data)
            return res.data
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['menus'],
            })
            setOpen(false)
            setEditing(null)
            form.reset({
                nameUz: '',
                nameOz: '',
                nameRu: '',
                nameEn: '',
                slug: '',
            })
        },
    })

    const updateMenu = useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: string
            data: Record<string, any>
        }) => {
            const res = await api.patch(`/menu/update/${id}`, data)
            return res.data
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['menus'],
            })
            setOpen(false)

            setEditing(null)
            form.reset({
                nameUz: '',
                nameOz: '',
                nameRu: '',
                nameEn: '',
                slug: '',
            })
        },
    })

    const deleteMenu = useMutation({
        mutationFn: async (id: string) => {
            const res = await api.delete(`/menu/delete/${id}`)
            return res.data
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['menus'],
            })
        },
    })

    const reorderMenu = useMutation({
        mutationFn: async (ids: string[]) => {
            const res = await api.patch('/menu/reorder', { ids })
            return res.data
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['menus'] })
        },
    })

    const columns = useMemo<IColumn[]>(
        () => [
            {
                title: t('Name UZ'),
                dataIndex: ['name', 'uz'],
                key: 'nameUz',
            },
            {
                title: t('Name OZ'),
                dataIndex: ['name', 'oz'],
                key: 'nameOz',
            },
            {
                title: t('Name RU'),
                dataIndex: ['name', 'ru'],
                key: 'nameRu',
            },
            {
                title: t('Name EN'),
                dataIndex: ['name', 'en'],
                key: 'nameEn',
            },
            {
                title: t('Path name'),
                dataIndex: 'slug',
                key: 'slug',
            },

            {
                title: t('Submenular soni'),
                dataIndex: 'submenus',
                key: 'submenus',
                render: (s: Record<string, any>[]) => s.length,
            },
            {
                title: t('Actions'),
                dataIndex: 'slug',
                key: 'action',
                render: (value, r: Record<string, any>) => (
                    <div className="flex gap-2">
                        <Link href={`${pathname}/${value}`}>
                            <Button variant="ghost" size="icon">
                                <ArrowRight color="green" />
                            </Button>
                        </Link>
                        <Button
                            onClick={() => setEditing(r.id)}
                            variant="ghost"
                            size="icon"
                        >
                            <Pencil color="blue" />
                        </Button>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    size={'icon'}
                                    variant="destructive"
                                    className="z-50 cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Trash2 />
                                </Button>
                            </DialogTrigger>
                            <DialogContent onClick={(e) => e.stopPropagation()}>
                                <p className="mb-4">
                                    Rostdan o‘chirmoqchimisiz?
                                </p>
                                <div className="flex gap-2">
                                    <DialogClose asChild>
                                        <Button
                                            variant="destructive"
                                            onClick={() =>
                                                deleteMenu.mutate(r.id)
                                            }
                                        >
                                            Ha, o‘chirish
                                        </Button>
                                    </DialogClose>
                                    <DialogClose asChild>
                                        <Button variant="outline">
                                            Bekor qilish
                                        </Button>
                                    </DialogClose>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                ),
            },
        ],
        [t]
    )

    const fields = useMemo<FormField[]>(
        () => [
            {
                label: t('Name UZ'),
                name: 'uz',
                type: 'text',
            },
            {
                label: t('Name OZ'),
                name: 'oz',
                type: 'text',
            },
            {
                label: t('Name RU'),
                name: 'ru',
                type: 'text',
            },
            {
                label: t('Name EN'),
                name: 'en',
                type: 'text',
            },
            {
                label: t('Path name'),
                name: 'slug',
                type: 'text',
            },
        ],
        [t]
    )

    useEffect(() => {
        if (editing) {
            form.reset({
                uz: menu.data?.name?.uz,
                oz: menu.data?.name?.oz,
                ru: menu.data?.name?.ru,
                en: menu.data?.name?.en,
                slug: menu.data?.slug,
            })
        }
    }, [editing, menu.data])

    return (
        <div className="p-4">
            {reordering ? (
                <div className="mx-auto max-w-2xl space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">
                            {t('Menyularni tartiblash')}
                        </h2>
                        <Button size="sm" onClick={() => setReordering(false)}>
                            {t('Tayyor')}
                        </Button>
                    </div>
                    <SortableList
                        items={(menus.data ?? []).map((m: any) => ({
                            id: m.id,
                            label: m.name?.uz || m.slug,
                        }))}
                        onReorder={(ids) => reorderMenu.mutate(ids)}
                    />
                </div>
            ) : (
                <MyTable
                    columns={columns}
                    dataSource={menus.data}
                    rangepickerFilter={false}
                    exportExcel={false}
                    showIndexColumn
                    showDataCount={false}
                    isLoading={menus.isLoading}
                    header={
                        <div className="flex gap-2">
                            <Button
                                size={'sm'}
                                variant="outline"
                                onClick={() => setReordering(true)}
                            >
                                {t('Tartiblash')}
                            </Button>
                            <Button size={'sm'} onClick={() => setOpen(true)}>
                                {t('Menu qoshish')}
                            </Button>
                        </div>
                    }
                />
            )}

            <Sheet
                open={open || !!editing}
                onOpenChange={() => {
                    setOpen(false)
                    setEditing(null)
                    form.reset({
                        nameUz: '',
                        nameOz: '',
                        nameRu: '',
                        nameEn: '',
                        slug: '',
                    })
                }}
            >
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>{t('Menu qoshish')}</SheetTitle>
                        <SheetDescription className="hidden" />
                    </SheetHeader>
                    <AutoForm
                        fields={fields}
                        form={form}
                        onSubmit={(values: Record<string, any>) => {
                            console.log(values)
                            const slug_cleaned = values.slug
                                .replace(/[^a-zA-Z0-9]+/g, '-')
                                .replace(/^-+|-+$/g, '')
                            if (editing) {
                                updateMenu.mutate({
                                    id: editing,
                                    data: {
                                        name: {
                                            uz: values.uz,
                                            oz: values.oz,
                                            ru: values.ru,
                                            en: values.en,
                                        } as any,
                                        slug: slug_cleaned,
                                    } as any,
                                })
                            } else {
                                createMenu.mutate({
                                    name: {
                                        uz: values.uz,
                                        oz: values.oz,
                                        ru: values.ru,
                                        en: values.en,
                                    },
                                    slug: slug_cleaned,
                                })
                            }
                        }}
                    />
                </SheetContent>
            </Sheet>
        </div>
    )
}

export default AdminMenus
