const TONE_GROUPS: Array<[string, string]> = [
  ['àáảãạ', 'a'],
  ['ằắẳẵặ', 'ă'],
  ['ầấẩẫậ', 'â'],
  ['èéẻẽẹ', 'e'],
  ['ềếểễệ', 'ê'],
  ['ìíỉĩị', 'i'],
  ['òóỏõọ', 'o'],
  ['ồốổỗộ', 'ô'],
  ['ờớởỡợ', 'ơ'],
  ['ùúủũụ', 'u'],
  ['ừứửữự', 'ư'],
  ['ỳýỷỹỵ', 'y'],
]

const VOWEL_FOLD: Record<string, string> = {
  ă: 'a',
  â: 'a',
  ê: 'e',
  ô: 'o',
  ơ: 'o',
  ư: 'u',
  đ: 'd',
}

const toneMap = new Map<string, string>()
for (const [chars, base] of TONE_GROUPS) {
  for (const char of chars) toneMap.set(char, base)
}

export function normalizeStrict(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Dùng cho giọng nói: bỏ dấu và nuốt lỗi nguyên âm của máy chép, nhưng giữ l khác n. */
export function normalizeLoose(value: string): string {
  const stripped = [...normalizeStrict(value)]
    .map((char) => toneMap.get(char) ?? char)
    .map((char) => VOWEL_FOLD[char] ?? char)
    .join('')
  return stripped.replace(/\s+/g, ' ').trim()
}

export function looseEqual(left: string, right: string): boolean {
  return normalizeLoose(left) === normalizeLoose(right)
}

export function strictEqual(left: string, right: string): boolean {
  return normalizeStrict(left) === normalizeStrict(right)
}

export function heardMatchesPhrase(heard: string, phrase: string): boolean {
  const heardWords = normalizeLoose(heard).split(' ').filter(Boolean)
  const phraseWords = normalizeLoose(phrase).split(' ').filter(Boolean)
  if (phraseWords.length === 0 || heardWords.length < phraseWords.length) return false
  const target = phraseWords.join(' ')
  for (let index = 0; index <= heardWords.length - phraseWords.length; index += 1) {
    if (heardWords.slice(index, index + phraseWords.length).join(' ') === target) return true
  }
  return false
}

export function matchesAny(heard: string, answers: string[]): boolean {
  return answers.some((answer) => looseEqual(heard, answer))
}
