// Placeholder data for the layout preview (task 0.5). Deleted once GameState
// drives the main screen in GĐ 1. No game rules live here.

export type Tone = 'normal' | 'good' | 'bad' | 'rare';
export interface PreviewLine { text: string; tone?: Tone }
export interface PreviewYear { age: number; lines: PreviewLine[]; popup?: boolean }

export const PREVIEW_START: PreviewYear[] = [
  { age: 0, lines: [
    { text: 'Ngươi chào đời tại Thanh Vân trấn, con thứ hai của một nhà nông.' },
    { text: 'Bà đỡ bảo đứa bé khóc to như sấm, ắt có phúc lớn.', tone: 'good' },
  ] },
  { age: 3, lines: [{ text: 'Ngươi ăn trộm bánh bao của chó nhà hàng xóm. Con chó không tha thứ.', tone: 'bad' }] },
  { age: 7, lines: [{ text: 'Một lão đạo sĩ đi ngang qua làng, nhìn ngươi rất lâu rồi lắc đầu bỏ đi.' }] },
  { age: 8, lines: [{ text: 'Ngươi học được 300 chữ ở trường làng. Thầy đồ khen là có chút sáng dạ.', tone: 'good' }] },
];

export const PREVIEW_NEXT: PreviewYear[] = [
  { age: 9, lines: [{ text: 'Ngươi theo cha lên núi hái thuốc.' }], popup: true },
  { age: 10, lines: [{ text: 'Mùa màng thất bát, cả nhà ăn cháo loãng suốt mùa đông.', tone: 'bad' }] },
  { age: 11, lines: [{ text: 'Đêm nằm mơ thấy một vị tiên nhân áo trắng chỉ tay vào ngươi.', tone: 'rare' }] },
  { age: 12, lines: [{ text: 'Thanh Vân Tông mở đại hội tuyển đệ tử ở trấn bên.' }] },
];

export const PREVIEW_POPUP = {
  kicker: 'Kỳ ngộ',
  title: 'Chiếc nhẫn gỉ sét',
  story: 'Dưới gốc tùng già, ngươi thấy một chiếc nhẫn cũ phủ đầy rêu. Khi chạm vào, nó hơi ấm như có hơi người.',
  choices: [
    { text: 'Đeo thử lên tay', hint: 'Khí vận ≥ 50' },
    { text: 'Đem bán ở chợ trấn', hint: '+ bạc' },
    { text: '[Linh mạch ẩn tàng] Vận khí vào nhẫn', hint: 'Lựa chọn ẩn từ khí vận', hidden: true },
  ],
};
