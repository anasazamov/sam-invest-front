// O'zbek lotin → kirill (uz → oz) soddalashtirilgan transliteratsiya.
// Markdown belgilarini (#, *, [], (), | ...) o'zgartirmaydi — faqat harflar.
// Multi-harf birikmalar avval, keyin bitta harflar almashtiriladi.

const DIGRAPHS: [RegExp, string][] = [
  [/o['`ʻ’‘]/g, 'ў'],
  [/g['`ʻ’‘]/g, 'ғ'],
  [/O['`ʻ’‘]/g, 'Ў'],
  [/G['`ʻ’‘]/g, 'Ғ'],
  [/sh/g, 'ш'],
  [/Sh/g, 'Ш'],
  [/SH/g, 'Ш'],
  [/ch/g, 'ч'],
  [/Ch/g, 'Ч'],
  [/CH/g, 'Ч'],
  [/ng/g, 'нг'],
  [/yo/g, 'ё'],
  [/Yo/g, 'Ё'],
  [/yu/g, 'ю'],
  [/Yu/g, 'Ю'],
  [/ya/g, 'я'],
  [/Ya/g, 'Я'],
  [/ye/g, 'е'],
  [/Ye/g, 'Е'],
  [/ts/g, 'ц'],
]

const SINGLES: Record<string, string> = {
  a: 'а', b: 'б', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'ҳ', i: 'и', j: 'ж',
  k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', q: 'қ', r: 'р', s: 'с',
  t: 'т', u: 'у', v: 'в', x: 'х', y: 'й', z: 'з',
  A: 'А', B: 'Б', D: 'Д', E: 'Е', F: 'Ф', G: 'Г', H: 'Ҳ', I: 'И', J: 'Ж',
  K: 'К', L: 'Л', M: 'М', N: 'Н', O: 'О', P: 'П', Q: 'Қ', R: 'Р', S: 'С',
  T: 'Т', U: 'У', V: 'В', X: 'Х', Y: 'Й', Z: 'З',
}

export function latinToCyrillic(input: string): string {
  if (!input) return ''
  let s = input
  for (const [re, rep] of DIGRAPHS) s = s.replace(re, rep)
  s = s
    .split('')
    .map((ch) => SINGLES[ch] ?? ch)
    .join('')
  return s
}
