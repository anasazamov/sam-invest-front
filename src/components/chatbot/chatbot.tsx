'use client'

import { api, baseBackendUrl } from '@/models/axios'
import { Bell, BellOff, MessageCircle, Send, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

type Sender = 'VISITOR' | 'OPERATOR'

interface ChatMessage {
    id?: string
    seq: number
    sender: Sender
    text: string
    createdAt?: string
}

const VISITOR_KEY = 'saminvest-chat-visitor'
const NAME_KEY = 'saminvest-chat-name'

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

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const raw = atob(base64)
    const output = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i)
    return output
}

const Chatbot = () => {
    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [name, setName] = useState('')
    const [visitorId, setVisitorId] = useState('')
    const [unread, setUnread] = useState(0)
    const [pushOn, setPushOn] = useState(false)
    const [sending, setSending] = useState(false)

    const seenSeqs = useRef<Set<number>>(new Set())
    const listEndRef = useRef<HTMLDivElement | null>(null)
    const openRef = useRef(open)
    openRef.current = open

    const addMessage = useCallback((msg: ChatMessage) => {
        if (typeof msg.seq !== 'number' || seenSeqs.current.has(msg.seq)) return
        seenSeqs.current.add(msg.seq)
        setMessages((prev) =>
            [...prev, msg].sort((a, b) => a.seq - b.seq)
        )
        if (msg.sender === 'OPERATOR' && !openRef.current) {
            setUnread((u) => u + 1)
        }
    }, [])

    // visitorId + saqlangan ism
    useEffect(() => {
        setVisitorId(getOrCreateVisitorId())
        const savedName = localStorage.getItem(NAME_KEY)
        if (savedName) setName(savedName)
        // push clickdan kelgan bo'lsa avtomatik ochamiz
        const params = new URLSearchParams(window.location.search)
        if (params.get('chat') === 'open') setOpen(true)
    }, [])

    // Tarixni yuklash
    useEffect(() => {
        if (!visitorId) return
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
    }, [visitorId])

    // Real-time SSE
    useEffect(() => {
        if (!visitorId) return
        const es = new EventSource(
            `${baseBackendUrl}/chat/stream?visitorId=${encodeURIComponent(visitorId)}`
        )
        es.onmessage = (e) => {
            if (!e.data || e.data === 'ping') return
            try {
                const msg = JSON.parse(e.data) as ChatMessage
                addMessage(msg)
            } catch {
                /* ping yoki noto'g'ri format — e'tibor bermaymiz */
            }
        }
        es.onerror = () => {
            // EventSource o'zi qayta ulanadi
        }
        return () => es.close()
    }, [visitorId, addMessage])

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

    const send = useCallback(async () => {
        const text = input.trim()
        if (!text || !visitorId || sending) return
        setSending(true)
        const trimmedName = name.trim()
        if (trimmedName) localStorage.setItem(NAME_KEY, trimmedName)
        try {
            const res = await api.post('/chat/message', {
                visitorId,
                text,
                name: trimmedName || undefined,
            })
            addMessage(res.data as ChatMessage)
            setInput('')
            // Birinchi xabardan keyin bildirishnomani taklif qilamiz
            if (!pushOn) enablePush()
        } catch {
            /* xatolik — keyinroq qayta urinib ko'radi */
        } finally {
            setSending(false)
        }
    }, [input, visitorId, sending, name, addMessage, pushOn, enablePush])

    return (
        <>
            {/* Suzuvchi tugma */}
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    aria-label="Chatni ochish"
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
                            <span className="font-semibold">Onlayn maslahat</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={enablePush}
                                aria-label="Bildirishnomalar"
                                title={
                                    pushOn
                                        ? 'Bildirishnomalar yoqilgan'
                                        : 'Bildirishnomalarni yoqish'
                                }
                                className="rounded p-1 hover:bg-white/20"
                            >
                                {pushOn ? (
                                    <Bell className="h-5 w-5" />
                                ) : (
                                    <BellOff className="h-5 w-5" />
                                )}
                            </button>
                            <button
                                onClick={() => setOpen(false)}
                                aria-label="Yopish"
                                className="rounded p-1 hover:bg-white/20"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Xabarlar */}
                    <div className="flex-1 space-y-2 overflow-y-auto bg-neutral-50 p-3 dark:bg-neutral-800/50">
                        {messages.length === 0 && (
                            <p className="mt-6 text-center text-sm text-neutral-500">
                                Savolingizni yozing — operatorlarimiz tez orada javob
                                beradi.
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

                    {/* Ism (ixtiyoriy) */}
                    <div className="border-t border-black/5 px-3 pt-2 dark:border-white/10">
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ismingiz (ixtiyoriy)"
                            className="w-full rounded-md bg-neutral-100 px-3 py-1.5 text-sm outline-none dark:bg-neutral-800 dark:text-neutral-100"
                        />
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
                            placeholder="Xabar yozing…"
                            className="max-h-24 flex-1 resize-none rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#0088cc] dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-100"
                        />
                        <button
                            onClick={send}
                            disabled={sending || !input.trim()}
                            aria-label="Yuborish"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0088cc] text-white transition-opacity disabled:opacity-40"
                        >
                            <Send className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}

export default Chatbot
