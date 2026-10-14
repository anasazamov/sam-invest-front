import { Block, createBlock, emptyPerson, Localized, uid } from '@/lib/blocks'

// Tayyor sahifa shablonlari. Har chaqiruvda yangi id'li bloklar qaytadi
// (bir shablonni bir necha marta qo'llash mumkin). Matnlar — joy egallovchi.

export type TemplateId =
    | 'blank'
    | 'article'
    | 'leadership'
    | 'documents'
    | 'faq'
    | 'structure'

export interface TemplateMeta {
    id: TemplateId
    labelKey: string // i18n: template.<id>
    descKey: string // i18n: template.<id>Desc
}

export const TEMPLATES: TemplateMeta[] = [
    { id: 'article', labelKey: 'template.article', descKey: 'template.articleDesc' },
    { id: 'leadership', labelKey: 'template.leadership', descKey: 'template.leadershipDesc' },
    { id: 'documents', labelKey: 'template.documents', descKey: 'template.documentsDesc' },
    { id: 'faq', labelKey: 'template.faq', descKey: 'template.faqDesc' },
    { id: 'structure', labelKey: 'template.structure', descKey: 'template.structureDesc' },
    { id: 'blank', labelKey: 'template.blank', descKey: 'template.blankDesc' },
]

const l = (uz: string, oz: string, ru: string, en: string): Localized => ({ uz, oz, ru, en })

function hero(title: Localized, subtitle: Localized): Block {
    const b = createBlock('hero')
    return { ...b, title, subtitle } as Block
}

export function buildTemplate(id: TemplateId): Block[] {
    switch (id) {
        case 'blank':
            return []

        case 'article': {
            const text = createBlock('text')
            return [
                hero(
                    l('Sahifa sarlavhasi', 'Саҳифа сарлавҳаси', 'Заголовок страницы', 'Page title'),
                    l('Qisqacha tavsif', 'Қисқача тавсиф', 'Краткое описание', 'Short description')
                ),
                {
                    ...text,
                    content: l(
                        '## Bo\'lim sarlavhasi\n\nMatnni shu yerga yozing.',
                        '## Бўлим сарлавҳаси\n\nМатнни шу ерга ёзинг.',
                        '## Заголовок раздела\n\nНапишите текст здесь.',
                        '## Section heading\n\nWrite your text here.'
                    ),
                } as Block,
            ]
        }

        case 'leadership': {
            const people = createBlock('people')
            return [
                hero(
                    l('Rahbariyat', 'Раҳбарият', 'Руководство', 'Leadership'),
                    l(
                        '«Samarqand Invest kompaniyasi» AJ rahbariyati',
                        '«Самарқанд Инвест компанияси» АЖ раҳбарияти',
                        'Руководство АО «Самарканд Инвест»',
                        'Management of Samarqand Invest Company JSC'
                    )
                ),
                {
                    ...people,
                    items: [
                        {
                            ...emptyPerson(),
                            position: l('Direktor', 'Директор', 'Директор', 'Director'),
                        },
                        {
                            ...emptyPerson(),
                            position: l(
                                'Direktor o\'rinbosari',
                                'Директор ўринбосари',
                                'Заместитель директора',
                                'Deputy Director'
                            ),
                        },
                    ],
                } as Block,
            ]
        }

        case 'documents': {
            const docs = createBlock('docs')
            return [
                hero(
                    l('Hujjatlar', 'Ҳужжатлар', 'Документы', 'Documents'),
                    l(
                        'Me\'yoriy-huquqiy hujjatlar va hisobotlar',
                        'Меъёрий-ҳуқуқий ҳужжатлар ва ҳисоботлар',
                        'Нормативно-правовые документы и отчёты',
                        'Regulatory documents and reports'
                    )
                ),
                {
                    ...docs,
                    items: [
                        { name: l('Kompaniya ustavi', 'Компания устави', 'Устав компании', 'Company charter'), note: {}, url: '' },
                        { name: l('Yillik hisobot', 'Йиллик ҳисобот', 'Годовой отчёт', 'Annual report'), note: {}, url: '' },
                    ],
                } as Block,
            ]
        }

        case 'faq': {
            const faq = createBlock('faq')
            return [
                hero(
                    l('Savol-javob', 'Савол-жавоб', 'Вопрос-ответ', 'FAQ'),
                    l(
                        'Ko\'p beriladigan savollar',
                        'Кўп бериладиган саволлар',
                        'Часто задаваемые вопросы',
                        'Frequently asked questions'
                    )
                ),
                {
                    ...faq,
                    items: [
                        { question: l('Savol?', 'Савол?', 'Вопрос?', 'Question?'), answer: l('Javob.', 'Жавоб.', 'Ответ.', 'Answer.') },
                        { question: l('Savol?', 'Савол?', 'Вопрос?', 'Question?'), answer: l('Javob.', 'Жавоб.', 'Ответ.', 'Answer.') },
                    ],
                } as Block,
            ]
        }

        case 'structure': {
            const org = createBlock('orgchart')
            const a = uid()
            const b = uid()
            return [
                hero(
                    l('Tashkiliy tuzilma', 'Ташкилий тузилма', 'Организационная структура', 'Organizational structure'),
                    l('', '', '', '')
                ),
                {
                    ...org,
                    nodes: [
                        { id: a, name: l('Bo\'linma 1', 'Бўлинма 1', 'Подразделение 1', 'Division 1'), parentId: '' },
                        { id: b, name: l('Bo\'linma 2', 'Бўлинма 2', 'Подразделение 2', 'Division 2'), parentId: '' },
                        { id: uid(), name: l('Bo\'lim 1.1', 'Бўлим 1.1', 'Отдел 1.1', 'Unit 1.1'), parentId: a },
                    ],
                } as Block,
            ]
        }
    }
}
