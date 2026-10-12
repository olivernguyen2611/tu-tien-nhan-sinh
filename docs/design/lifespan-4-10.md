# Task 4.10 — Áp lực thọ nguyên

> Nội dung do Claude tự soạn theo lời chủ dự án (2026-10-12: "tự quyết định nội dung, mình sẽ xem lại sau"). Chưa qua duyệt.

## Kích hoạt
- Còn ≤ 10% thọ nguyên (`balance.lifespan.pressureLeftPct`), theo PLAN mục G.
- Sự kiện `urgent`: bật ngay năm đủ điều kiện, không qua tỉ lệ bật sự kiện hằng năm. Follow-up đến hạn vẫn đi trước.
- Năm cuối (còn ≤ 1 năm) thì Di ngôn đi trước mọi sự kiện khẩn khác.

## Chuỗi (thế giới Thương Lan, `events/lifespan.json`)
| Sự kiện | Ai gặp | Nhánh |
|---|---|---|
| Đại hạn sắp tới | Từ Luyện Khí | Liều phá cảnh · Tìm thọ đan → Thọ Nguyên Đan lên sàn · Tìm thân xác trẻ (nghiệp ≤ −20) → Đêm mưa đoạt xá · Thuận thiên mệnh |
| Tuổi già gõ cửa | Phàm nhân, từ 40 tuổi | Sâm trăm năm (+3 năm) · Cầu tiên (vận may 75: +8 năm) · Gia phả · Uống rượu |
| Thọ Nguyên Đan lên sàn | Follow-up | Mua 1000 linh thạch (+15%) · Cướp (đánh, +15%) · Tự luyện (+10%) · Bán mạng (+7%, cờ `no_mang_dau_gia`) · Bỏ về |
| Đêm mưa đoạt xá | Follow-up | Đoạt xá (Đạo tâm 60: +40%, nghiệp −40) · Bỏ đi |
| Di ngôn | Năm cuối, từ 40 tuổi | Truyền y bát · Chôn động phủ · Thư cho kẻ thù · Không để lại gì |

## Bổ sung kỹ thuật
- Thọ đan và đoạt xá cộng theo % thọ nguyên hiện tại (`lifespanPct`) để có giá trị ở mọi cảnh giới.
- Cờ để lại (`di_ngon_*`, `doat_xa`, `no_mang_dau_gia`) dành cho tiểu sử cuối đời và sự kiện về sau.
