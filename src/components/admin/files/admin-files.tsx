'use client'

import { Button } from '@/components/ui/button'
import useNotify from '@/hooks/use-notify'
import { api, baseBackendUrl } from '@/models/axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, FileText, Trash2, Upload } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'

interface FileItem {
    name: string
    url: string
    size: number
    modifiedAt: string
    isImage: boolean
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const AdminFiles = () => {
    const t = useTranslations()
    const queryClient = useQueryClient()
    const { toastSuccess, toastError } = useNotify()
    const inputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)

    const files = useQuery({
        queryKey: ['files'],
        queryFn: async () => {
            const res = await api.get('/uploads/list')
            return res.data as FileItem[]
        },
    })

    const deleteFile = useMutation({
        mutationFn: async (name: string) =>
            api.delete(`/uploads/${encodeURIComponent(name)}`),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['files'] })
            toastSuccess(t('Ochirildi'))
        },
        onError: () => toastError(t('Xatolik')),
    })

    const copyUrl = (url: string) => {
        navigator.clipboard
            .writeText(`${baseBackendUrl}${url}`)
            .then(() => toastSuccess(t('Havola nusxalandi')))
            .catch(() => toastError(t('Xatolik')))
    }

    const onUpload = async (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return
        const formData = new FormData()
        Array.from(fileList).forEach((f) => formData.append('files', f))
        setUploading(true)
        try {
            await api.post('/uploads/bulk', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            await queryClient.invalidateQueries({ queryKey: ['files'] })
            toastSuccess(t('Fayllar muvaffaqiyatli yuklandi'))
        } catch {
            toastError(t('Xatolik'))
        } finally {
            setUploading(false)
            if (inputRef.current) inputRef.current.value = ''
        }
    }

    return (
        <div className="container-cs py-10">
            <div className="flex items-center justify-between border-b pb-6">
                <div>
                    <h1 className="text-2xl font-bold">{t('Fayl menejeri')}</h1>
                    <p className="text-sm text-muted-foreground">
                        {t('Yuklangan fayllar royxati')}
                    </p>
                </div>
                <div>
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => onUpload(e.target.files)}
                    />
                    <Button
                        onClick={() => inputRef.current?.click()}
                        disabled={uploading}
                    >
                        <Upload className="mr-1 h-4 w-4" /> {t('Fayl yuklash')}
                    </Button>
                </div>
            </div>

            {files.isLoading ? (
                <p className="mt-6 text-sm text-muted-foreground">
                    {t('Yuklanmoqda')}...
                </p>
            ) : files.data?.length === 0 ? (
                <p className="mt-6 text-sm text-muted-foreground">
                    {t('Hali malumot yoq')}
                </p>
            ) : (
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {files.data?.map((f) => (
                        <div
                            key={f.name}
                            className="flex flex-col overflow-hidden rounded-xl border bg-background"
                        >
                            <div className="flex h-32 items-center justify-center bg-slate-100 dark:bg-neutral-800">
                                {f.isImage ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={`${baseBackendUrl}${f.url}`}
                                        alt={f.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <FileText className="h-12 w-12 text-slate-400" />
                                )}
                            </div>
                            <div className="flex flex-1 flex-col p-3">
                                <p
                                    className="truncate text-xs font-medium"
                                    title={f.name}
                                >
                                    {f.name}
                                </p>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    {formatSize(f.size)}
                                </p>
                                <div className="mt-3 flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => copyUrl(f.url)}
                                        title={t('Havolani nusxalash')}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => deleteFile.mutate(f.name)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default AdminFiles
