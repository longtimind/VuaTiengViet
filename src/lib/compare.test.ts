import { heardMatchesPhrase, looseEqual, strictEqual } from './compare.ts'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

assert(looseEqual('Lá', 'là'), 'tones fold')
assert(!looseEqual('làn', 'nàn'), 'l and n stay distinct')
assert(looseEqual('Nước đổ đầu vịt', 'nuoc do dau vit'), 'idiom fold')
assert(looseEqual('sẽ', 'sẻ'), 'voice fold does not police s/x')
assert(!strictEqual('sẽ', 'sẻ'), 'spelling keeps sẽ and sẻ apart')
assert(strictEqual('Sẽ sang nhà bạn chơi.', 'sẽ sang nhà bạn chơi'), 'spelling ignores case')
assert(heardMatchesPhrase('ờ nó lấy nón rồi lên non', 'Nó lấy nón rồi lên non.'), 'extra words ok')
assert(!heardMatchesPhrase('nó nấy nón rồi lên non', 'Nó lấy nón rồi lên non.'), 'wrong consonant fails')

console.log('compare ok')
