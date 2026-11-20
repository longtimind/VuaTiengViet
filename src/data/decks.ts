import { LN } from './ln.ts'

export type LnItem = { id: string; text: string }
export type OrderItem = { id: string; words: string[] }
export type GuessItem = { id: string; kind: 'Thành ngữ' | 'Từ'; prompt: string; answers: string[] }
export type SpellItem = { id: string; wrong: string; right: string }

const ORDER: OrderItem[] = [
  'Trâu chậm uống nước đục',
  'Ăn quả nhớ kẻ trồng cây',
  'Một cây làm chẳng nên non',
  'Uống nước nhớ nguồn',
  'Im lặng là vàng',
  'Mưa to gió lớn suốt đêm',
  'Bé Na đi học về muộn',
  'Chiều nay cả nhà ăn cơm',
  'Con sông chảy qua cánh đồng',
  'Ông già ngồi câu cá',
  'Mèo nhỏ trèo lên cây cau',
  'Ngoài sân có nắng rất đẹp',
  'Chúng tôi đang học bài mới',
  'Bát cơm để nguội từ lâu',
  'Đêm qua trời mưa rất to',
  'Cô giáo gọi tên từng bạn',
].map((sentence, index) => ({ id: `o${index + 1}`, words: sentence.split(' ') }))

const GUESSES: GuessItem[] = [
  {
    id: 'g1',
    kind: 'Thành ngữ',
    prompt: 'Làm ơn mãi mà người kia không thấm, chẳng khác đổ nước lên đầu con vật lông trơn.',
    answers: ['Nước đổ đầu vịt'],
  },
  {
    id: 'g2',
    kind: 'Thành ngữ',
    prompt: 'Càng đi xa, càng va vấp, càng hiểu chuyện đời.',
    answers: ['Đi một ngày đàng học một sàng khôn'],
  },
  {
    id: 'g3',
    kind: 'Thành ngữ',
    prompt: 'Ở gần thói xấu dễ nhiễm, ở gần điều hay dễ học được.',
    answers: ['Gần mực thì đen gần đèn thì sáng'],
  },
  {
    id: 'g4',
    kind: 'Thành ngữ',
    prompt: 'Kiên trì làm hoài một việc khó, lâu ngày cũng xong.',
    answers: ['Có công mài sắt có ngày nên kim'],
  },
  {
    id: 'g5',
    kind: 'Thành ngữ',
    prompt: 'Được hưởng thành quả thì nhớ người đã gây dựng từ đầu.',
    answers: ['Ăn quả nhớ kẻ trồng cây'],
  },
  {
    id: 'g6',
    kind: 'Thành ngữ',
    prompt: 'Nhận được ơn thì phải nhớ về gốc gác.',
    answers: ['Uống nước nhớ nguồn'],
  },
  {
    id: 'g7',
    kind: 'Thành ngữ',
    prompt: 'Chất bên trong đáng giá hơn lớp bóng bên ngoài.',
    answers: ['Tốt gỗ hơn tốt nước sơn'],
  },
  {
    id: 'g8',
    kind: 'Thành ngữ',
    prompt: 'Kẻ yếu mượn uy của kẻ mạnh để dọa người khác.',
    answers: ['Cáo mượn oai hùm'],
  },
  {
    id: 'g9',
    kind: 'Thành ngữ',
    prompt: 'Sự đã hỏng rồi mới cuống lên mà phòng, lúc ấy thì muộn.',
    answers: ['Mất bò mới lo làm chuồng'],
  },
  {
    id: 'g10',
    kind: 'Thành ngữ',
    prompt: 'Khởi đầu rất to, kết thúc thì cụt ngủn, chẳng ra gì.',
    answers: ['Đầu voi đuôi chuột'],
  },
  {
    id: 'g11',
    kind: 'Thành ngữ',
    prompt: 'Miệng ngọt quá mức, thường để lấy lòng hoặc để dụ.',
    answers: ['Mật ngọt chết ruồi'],
  },
  {
    id: 'g12',
    kind: 'Thành ngữ',
    prompt: 'Quyết tâm thật sự thì việc khó cũng làm được.',
    answers: ['Có chí thì nên'],
  },
  {
    id: 'g13',
    kind: 'Từ',
    prompt: 'Dụng cụ hai lưỡi, dùng để cắt giấy, vải hoặc tóc.',
    answers: ['cái kéo', 'kéo'],
  },
  {
    id: 'g14',
    kind: 'Từ',
    prompt: 'Nước từ mây rơi xuống, làm ướt đường và mái nhà.',
    answers: ['mưa', 'cơn mưa'],
  },
  {
    id: 'g15',
    kind: 'Từ',
    prompt: 'Con vật nuôi kêu meo meo, thích rình chuột.',
    answers: ['mèo', 'con mèo'],
  },
  {
    id: 'g16',
    kind: 'Từ',
    prompt: 'Đồ đội lên đầu để che nắng, hay gặp ngoài đồng.',
    answers: ['nón', 'cái nón', 'nón lá'],
  },
  {
    id: 'g17',
    kind: 'Từ',
    prompt: 'Hai bánh, không có máy, muốn đi thì phải đạp.',
    answers: ['xe đạp'],
  },
  {
    id: 'g18',
    kind: 'Từ',
    prompt: 'Món từ gạo nếp đồ chín, hạt dính, hay ăn buổi sáng.',
    answers: ['xôi'],
  },
  {
    id: 'g19',
    kind: 'Từ',
    prompt: 'Quả vỏ xanh hoặc vàng, vị chua, hay vắt vào nước uống.',
    answers: ['chanh', 'quả chanh'],
  },
  {
    id: 'g20',
    kind: 'Từ',
    prompt: 'Chỗ ngồi có mặt phẳng, thường có tựa lưng.',
    answers: ['ghế', 'cái ghế'],
  },
  {
    id: 'g21',
    kind: 'Từ',
    prompt: 'Chỗ trong nhà dùng để nấu nướng.',
    answers: ['bếp', 'nhà bếp'],
  },
  {
    id: 'g22',
    kind: 'Từ',
    prompt: 'Đồ cầm tay, bật lên thì một luồng sáng chiếu về phía trước.',
    answers: ['đèn pin'],
  },
]

const SPELLS: SpellItem[] = [
  { id: 's1', wrong: 'Sẻ sang nhà bạn chơi', right: 'Sẽ sang nhà bạn chơi' },
  { id: 's2', wrong: 'Con mèo chèo cây cao', right: 'Con mèo trèo cây cao' },
  { id: 's3', wrong: 'Nó dành chiến thắng rồi', right: 'Nó giành chiến thắng rồi' },
  { id: 's4', wrong: 'Xuất ăn còn nóng hổi', right: 'Suất ăn còn nóng hổi' },
  { id: 's5', wrong: 'Là này xanh quá đi', right: 'Lá này xanh quá đi' },
  { id: 's6', wrong: 'Cơn gió nạnh buổi sớm', right: 'Cơn gió lạnh buổi sớm' },
  { id: 's7', wrong: 'Dải rác khắp con đường', right: 'Rải rác khắp con đường' },
  { id: 's8', wrong: 'Chăng treo trên cành cây', right: 'Trăng treo trên cành cây' },
  { id: 's9', wrong: 'Ngĩ ngợi một lúc lâu', right: 'Nghĩ ngợi một lúc lâu' },
  { id: 's10', wrong: 'Xổ lồng chim từ sáng', right: 'Sổ lồng chim từ sáng' },
  { id: 's11', wrong: 'Dió rung hàng cây cao', right: 'Gió rung hàng cây cao' },
  { id: 's12', wrong: 'Nắng xuyến qua kẽ lá', right: 'Nắng xuyên qua kẽ lá' },
  { id: 's13', wrong: 'Nọ hoa để trên bàn', right: 'Lọ hoa để trên bàn' },
  { id: 's14', wrong: 'Chẻ con chạy ngoài sân', right: 'Trẻ con chạy ngoài sân' },
  { id: 's15', wrong: 'Nó sé tờ giấy vụn', right: 'Nó xé tờ giấy vụn' },
  { id: 's16', wrong: 'Ròng sông chảy rất siết', right: 'Dòng sông chảy rất siết' },
  { id: 's17', wrong: 'Xương sớm giăng mờ lối', right: 'Sương sớm giăng mờ lối' },
  { id: 's18', wrong: 'Nó lỗi hẹn cả buổi sáng', right: 'Nó lỡ hẹn cả buổi sáng' },
]

export function shuffle<T>(list: T[]): T[] {
  const next = [...list]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    const current = next[index]
    next[index] = next[swap] as T
    next[swap] = current as T
  }
  return next
}

export function takeRound<T>(list: T[], size = 8): T[] {
  return shuffle(list).slice(0, Math.min(size, list.length))
}

export function lnRound(): LnItem[] {
  return takeRound(LN, 20)
}

export function orderRound(): OrderItem[] {
  return takeRound(ORDER)
}

export function guessRound(): GuessItem[] {
  const idioms = takeRound(GUESSES.filter((item) => item.kind === 'Thành ngữ'), 4)
  const words = takeRound(GUESSES.filter((item) => item.kind === 'Từ'), 4)
  return shuffle([...idioms, ...words])
}

export function spellRound(): SpellItem[] {
  return takeRound(SPELLS)
}

export function syllableCount(answer: string): number {
  return answer.trim().split(/\s+/).filter(Boolean).length
}
