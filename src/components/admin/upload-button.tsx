'use client'

import { Button } from '@/components/ui/button'
import useNotify from '@/hooks/use-notify'
import { api, baseBackendUrl } from '@/models/axios'
import { Loader2, Upload } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'

/** Faylni /uploads ga yuklab, to'liq URL qaytaradi (rasm yoki hujjat). */
export default function UploadButton({
    accept,
    onUploaded,
    label,
}: {
    accept?: string
    onUploaded: (url: string) => void
    label: string
}) {
    const ref = useRef<HTMLInputElement>(null)
    const [busy, setBusy] = useState(false)
    const { toastError } = useNotify()
    const t = useTranslations()

    const pickFile = async (f?: File) => {
        if (!f) return
        const fd = new FormData()
        fd.append('file', f)
        setBusy(true)
        try {
            const res = await api.post('/uploads', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            const p = String(res.data?.uploadPath || '').replace(/^\/+/, '')
            if (p) onUploaded(`${baseBackendUrl}/${p}`)
        } catch {
            toastError(t('Xatolik'))
        } finally {
            setBusy(false)
            if (ref.current) ref.current.value = ''
        }
    }

    return (
        <>
            <input
                ref={ref}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0])}
            />
            <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => ref.current?.click()}
            >
                {busy ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                    <Upload className="mr-1 h-4 w-4" />
                )}
                {label}
            </Button>
        </>
    )
}
