'use client'

import { api, baseBackendUrl } from '@/models/axios'
import { Bell, BellOff, MessageCircle, Send, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'

type Sender = 'VISITOR' | 'OPERATOR'

interface ChatMessage {
    id?: string
    seq: number
    sender: Sender
    text: string
    createdAt?: string
}

interface Registration {
    firstName: string
    lastName: string
    phone: string // normalized: +998XXXXXXXXX
}

const VISITOR_KEY = 'saminvest-chat-visitor'
const REG_KEY = 'saminvest-chat-reg'

function getOrCreateVisitorId(): string {
    if (typeof window === 'undefined') return ''
    let id = localStorage.getItem(VISITOR_KEY)
    if (!id) {
        id =
            typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `v_${Date.now()}_${Math.random().toString(36).slice(2)}`
        localStorage.setItem(VISITOR_KEY, id)
    }
    return id
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const raw = atob(base64)
    const output = new Uint8Array(new ArrayBuffer(raw.length))
    for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i)
    return output
}

/** Faqat raqamlarni oladi, 998 prefiksini olib tashlaydi, max 9 ta raqam. */
function extractPhoneDigits(input: string): string {
    let d = input.replace(/\D/g, '')
    if (d.startsWith('998')) d = d.slice(3)
    return d.slice(0, 9)
}

/** 9 ta raqamni "+998 90 123 45 67" ko'rinishida chiqaradi. */
function formatPhone(digits: string): string {
    const parts: string[] = []
    if (digits.length > 0) parts.push(digits.slice(0, 2))
    if (digits.length > 2) parts.push(digits.slice(2, 5))
    if (digits.length > 5) parts.push(digits.slice(5, 7))
    if (digits.length > 7) parts.push(digits.slice(7, 9))
    return `+998 ${parts.join(' ')}`.trimEnd()
}

const Chatbot = () => {
    const t = useTranslations('chat')

    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [visitorId, setVisitorId] = useState('')
    const [unread, setUnread] = useState(0)
    const [pushOn, setPushOn] = useState(false)
    const [sending, setSending] = useState(false)

    // Majburiy forma
    const [registered, setRegistered] = useState(false)
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [phoneDigits, setPhoneDigits] = useState('')
    const [consent, setConsent] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [registering, setRegistering] = useState(false)

    const seenSeqs = useRef<Set<number>>(new Set())
    const listEndRef = useRef<HTMLDivElement | null>(null)
    const openRef = useRef(open)
    openRef.current = open

    const addMessage = useCallback((msg: ChatMessage) => {
        if (typeof msg.seq !== 'number' || seenSeqs.current.has(msg.seq)) return
        seenSeqs.current.add(msg.seq)
        setMessages((prev) => [...prev, msg].sort((a, b) => a.seq - b.seq))
        if (msg.sender === 'OPERATOR' && !openRef.current) {
            setUnread((u) => u + 1)
        }
    }, [])

    // visitorId + saqlangan ro'yxatdan o'tish
    useEffect(() => {
        setVisitorId(getOrCreateVisitorId())
        try {
            const saved = localStorage.getItem(REG_KEY)
            if (saved) {
                const reg = JSON.parse(saved) as Registration
                if (reg?.firstName && reg?.lastName && reg?.phone) {
                    setFirstName(reg.firstName)
                    setLastName(reg.lastName)
                    setPhoneDigits(extractPhoneDigits(reg.phone))
                    setConsent(true)
                    setRegistered(true)
                }
            }
        } catch {
            /* localStorage o'qilmadi — forma qaytadan so'raladi */
        }
        const params = new URLSearchParams(window.location.search)
        if (params.get('chat') === 'open') setOpen(true)
    }, [])

    // Tarixni yuklash (faqat ro'yxatdan o'tgandan keyin sessiya bo'ladi)
    useEffect(() => {
        if (!visitorId || !registered) return
        api
            .get('/chat/messages', { params: { visitorId, afterSeq: 0 } })
            .then((res) => {
                const data: ChatMessage[] = Array.isArray(res.data) ? res.data : []
                setMessages((prev) => {
                    const bySeq = new Map<number, ChatMessage>()
                    for (const m of [...prev, ...data]) {
                        if (typeof m.seq === 'number') {
                            bySeq.set(m.seq, m)
                            seenSeqs.current.add(m.seq)
                        }
                    }
                    return [...bySeq.values()].sort((a, b) => a.seq - b.seq)
                })
            })
            .catch(() => {})
    }, [visitorId, registered])

    // Real-time SSE
    useEffect(() => {
        if (!visitorId || !registered) return
        const es = new EventSource(
            `${baseBackendUrl}/chat/stream?visitorId=${encodeURIComponent(visitorId)}`
        )
        es.onmessage = (e) => {
            if (!e.data || e.data === 'ping') return
            try {
                const msg = JSON.parse(e.data) as ChatMessage
                addMessage(msg)
            } catch {
                /* ping yoki noto'g'ri format */
            }
        }
        es.onerror = () => {
            /* EventSource o'zi qayta ulanadi */
        }
        return () => es.close()
    }, [visitorId, registered, addMessage])

    // Ochilganda pastga scroll + unread reset
    useEffect(() => {
        if (open) {
            setUnread(0)
            requestAnimationFrame(() =>
                listEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            )
        }
    }, [open, messages])

    const enablePush = useCallback(async () => {
        try {
            if (
                !('serviceWorker' in navigator) ||
                !('PushManager' in window) ||
                !visitorId
            )
                return
            const perm = await Notification.requestPermission()
            if (perm !== 'granted') return

            const reg = await navigator.serviceWorker.register('/chat-sw.js')
            await navigator.serviceWorker.ready

            const { data } = await api.get('/chat/vapid-public-key')
            if (!data?.publicKey) return

            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(data.publicKey),
            })
            await api.post('/chat/push/subscribe', {
                visitorId,
                subscription: sub.toJSON(),
            })
            setPushOn(true)
        } catch {
            /* push yoqilmadi — muhim emas */
        }
    }, [visitorId])

    const submitRegistration = useCallback(async () => {
        if (!visitorId || registering) return
        const fn = firstName.trim()
        const ln = lastName.trim()
        if (!fn) return setFormError(t('firstNameRequired'))
        if (!ln) return setFormError(t('lastNameRequired'))
        if (phoneDigits.length !== 9) return setFormError(t('phoneInvalid'))
        if (!consent) return setFormError(t('consentRequired'))

        const phone = `+998${phoneDigits}`
        setFormError(null)
        setRegistering(true)
        try {
            await api.post('/chat/session', {
                visitorId,
                firstName: fn,
                lastName: ln,
                phone,
                consent: true,
            })
            const reg: Registration = { firstName: fn, lastName: ln, phone }
            try {
                localStorage.setItem(REG_KEY, JSON.stringify(reg))
            } catch {
                /* localStorage yozilmadi — muhim emas */
            }
            setRegistered(true)
        } catch {
            setFormError(t('sendError'))
        } finally {
            setRegistering(false)
        }
    }, [visitorId, registering, firstName, lastName, phoneDigits, consent, t])

    const send = useCallback(async () => {
        const text = input.trim()
        if (!text || !visitorId || sending || !registered) return
        setSending(true)
        try {
            const res = await api.post('/chat/message', { visitorId, text })
            addMessage(res.data as ChatMessage)
            setInput('')
            if (!pushOn) enablePush()
        } catch {
            setFormError(t('sendError'))
        } finally {
            setSending(false)
        }
    }, [input, visitorId, sending, registered, addMessage, pushOn, enablePush, t])

    const formValid =
        firstName.trim() && lastName.trim() && phoneDigits.length === 9 && consent

    return (
        <>
            {/* Suzuvchi tugma */}
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    aria-label={t('open')}
                    className="fixed bottom-5 right-5 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-[#0088cc] text-white shadow-lg transition-transform hover:scale-105 focus:outline-none"
                >
                    <MessageCircle className="h-7 w-7" />
                    {unread > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                            {unread > 9 ? '9+' : unread}
                        </span>
                    )}
                </button>
            )}

            {/* Chat oynasi */}
            {open && (
                <div className="fixed bottom-5 right-5 z-[9999] flex h-[70vh] max-h-[560px] w-[92vw] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-neutral-900">
                    {/* Header */}
                    <div className="flex items-center justify-between bg-[#0088cc] px-4 py-3 text-white">
                        <div className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5" />
                            <span className="font-semibold">{t('title')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            {registered && (
                                <button
                                    onClick={enablePush}
                                    aria-label={pushOn ? t('notifOn') : t('notifOff')}
                                    title={pushOn ? t('notifOn') : t('notifOff')}
                                    className="rounded p-1 hover:bg-white/20"
                                >
                                    {pushOn ? (
                                        <Bell className="h-5 w-5" />
                                    ) : (
                                        <BellOff className="h-5 w-5" />
                                    )}
                                </button>
                            )}
                            <button
                                onClick={() => setOpen(false)}
                                aria-label={t('close')}
                                className="rounded p-1 hover:bg-white/20"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {!registered ? (
                        /* ───── Majburiy forma ───── */
                        <div className="flex-1 overflow-y-auto p-4">
                            <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-100">
                                {t('formTitle')}
                            </h3>
                            <p className="mt-1 mb-4 text-sm text-neutral-500 dark:text-neutral-400">
                                {t('formSubtitle')}
                            </p>

                            <div className="space-y-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                                        {t('firstName')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#0088cc] dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-100"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                                        {t('lastName')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#0088cc] dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-100"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                                        {t('phone')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        inputMode="tel"
                                        value={formatPhone(phoneDigits)}
                                        onChange={(e) =>
                                            setPhoneDigits(extractPhoneDigits(e.target.value))
                                        }
                                        placeholder={t('phonePlaceholder')}
                                        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm tabular-nums outline-none focus:border-[#0088cc] dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-100"
                                    />
                                </div>
                                <label className="flex cursor-pointer items-start gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                                    <input
                                        type="checkbox"
                                        checked={consent}
                                        onChange={(e) => setConsent(e.target.checked)}
                                        className="mt-0.5 h-4 w-4 shrink-0 accent-[#0088cc]"
                                    />
                                    <span>
                                        {t('consent')} <span className="text-red-500">*</span>
                                    </span>
                                </label>

                                {formError && (
                                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-300">
                                        {formError}
                                    </p>
                                )}

                                <button
                                    onClick={submitRegistration}
                                    disabled={!formValid || registering}
                                    className="w-full rounded-lg bg-[#0088cc] py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                                >
                                    {t('start')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Xabarlar */}
                            <div className="flex-1 space-y-2 overflow-y-auto bg-neutral-50 p-3 dark:bg-neutral-800/50">
                                {messages.length === 0 && (
                                    <p className="mt-6 text-center text-sm text-neutral-500">
                                        {t('empty')}
                                    </p>
                                )}
                                {messages.map((m) => (
                                    <div
                                        key={m.seq}
                                        className={`flex ${
                                            m.sender === 'VISITOR'
                                                ? 'justify-end'
                                                : 'justify-start'
                                        }`}
                                    >
                                        <div
                                            className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
                                                m.sender === 'VISITOR'
                                                    ? 'rounded-br-sm bg-[#0088cc] text-white'
                                                    : 'rounded-bl-sm bg-white text-neutral-800 shadow-sm dark:bg-neutral-700 dark:text-neutral-100'
                                            }`}
                                        >
                                            {m.text}
                                        </div>
                                    </div>
                                ))}
                                <div ref={listEndRef} />
                            </div>

                            {/* Yozish */}
                            <div className="flex items-end gap-2 p-3">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            send()
                                        }
                                    }}
                                    rows={1}
                                    placeholder={t('messagePlaceholder')}
                                    className="max-h-24 flex-1 resize-none rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#0088cc] dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-100"
                                />
                                <button
                                    onClick={send}
                                    disabled={sending || !input.trim()}
                                    aria-label={t('send')}
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0088cc] text-white transition-opacity disabled:opacity-40"
                                >
                                    <Send className="h-5 w-5" />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    )
}

export default Chatbot
