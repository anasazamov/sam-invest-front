import rehypeParse from 'rehype-parse'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import { unified } from 'unified'

// Admin muharriridan (Quill) kelgan HTML'ni chizishdan oldin tozalaydi.
// Olib tashlanadi: <script>, on* hodisalar, style, javascript:/vbscript: havolalar,
// ruxsatsiz iframe'lar. Qoldiriladi: oddiy matn teglari, class (Quill
// tekislash/chekinish), YouTube/Vimeo iframe, rasm (http(s) yoki data:image).

const schema = {
    ...defaultSchema,
    // input (GitHub vazifa ro'yxati uchun standartda bor) — Quill kontentida kerak emas
    tagNames: [
        ...(defaultSchema.tagNames ?? []).filter((t) => t !== 'input'),
        'iframe',
        'u',
        's',
        'mark',
        'figure',
        'figcaption',
    ],
    attributes: {
        ...defaultSchema.attributes,
        '*': [...(defaultSchema.attributes?.['*'] ?? []), 'className'],
        iframe: ['src', 'allowFullScreen', 'frameBorder', 'allow', 'width', 'height', 'title'],
        img: [...(defaultSchema.attributes?.img ?? []), 'width', 'height', 'loading'],
    },
    protocols: {
        ...defaultSchema.protocols,
        src: ['http', 'https', 'data'],
    },
}

const IFRAME_HOSTS =
    /^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com|player\.vimeo\.com)\/(embed|video)\//i
const DATA_IMAGE = /^data:image\/(png|jpe?g|gif|webp);base64,/i

/** Sanitize'dan keyin: iframe faqat ruxsatli xostlardan, data: faqat rasm uchun. */
function restrictMedia() {
    const walk = (node: any) => {
        if (!Array.isArray(node.children)) return
        node.children = node.children.filter((child: any) => {
            if (child.type !== 'element') return true
            const src = child.properties?.src
            if (child.tagName === 'iframe') {
                if (typeof src !== 'string' || !IFRAME_HOSTS.test(src)) return false
            } else if (typeof src === 'string' && src.startsWith('data:')) {
                if (child.tagName !== 'img' || !DATA_IMAGE.test(src)) delete child.properties.src
            }
            walk(child)
            return true
        })
    }
    return (tree: any) => walk(tree)
}

const processor = unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeSanitize, schema)
    .use(restrictMedia)
    .use(rehypeStringify)

// Bir xil matn qayta-qayta tozalanmasligi uchun kichik kesh
const cache = new Map<string, string>()
const MAX_CACHE = 300

export function sanitizeHtml(html: unknown): string {
    if (typeof html !== 'string' || !html) return ''
    const hit = cache.get(html)
    if (hit !== undefined) return hit
    let out = ''
    try {
        out = String(processor.processSync(html))
    } catch {
        out = '' // buzilgan HTML — hech narsa chizmaymiz
    }
    if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value as string)
    cache.set(html, out)
    return out
}
