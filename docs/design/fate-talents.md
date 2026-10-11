# Nghịch Thiên Cải Mệnh lần đầu (task 2.7) — ĐÃ DUYỆT 2026-10-11

Khi đột phá **Trúc Cơ** thành công, người chơi được chọn **1 trong 3 thiên phú**. Thiên phú dùng chung bộ móc K.6 với khí vận nhưng mạnh hơn, và là thứ tạo nên **build** (kiếm tu tốc chiến, thể tu bất tử, đan sư sống lâu, ma tu hút máu, tán tu cẩu đạo…).


---

## 1. Luật quay

**Phẩm thiên phú theo phẩm đạo cơ** (đạo cơ do task 2.6 tính từ chuẩn bị: đan dược, nơi đột phá, đạo tâm):

| Đạo cơ | Lương | Ưu | Tuyệt | Thiên | Thần |
|---|---|---|---|---|---|
| Hạ | 60% | 30% | 10% | — | — |
| Trung | 35% | 40% | 20% | 5% | — |
| Thượng | — | 40% | 40% | 18% | 2% |
| Hoàn mỹ | — | — | 50% | 40% | 10% |

- Khí vận mỗi 10 điểm trên 50 dời 2% từ phẩm thấp nhất sang phẩm cao nhất của dòng đó.
- **Ô hợp đạo**: trong 3 ô, ô đầu tiên ưu tiên thiên phú hợp **con đường chiến đấu** hoặc **đạo thống** hiện tại (đánh dấu [Kiếm], [Ma]…), để build có hướng. Hai ô còn lại ngẫu nhiên.
- **Làm mới**: 1 lần mỗi lần đột phá; thêm 1 lần nếu khí vận ≥ 70; luân hồi mở thêm (GĐ 5b).
- Không ra thiên phú đã có. Thiên phú gắn đạo thống (Ma, Phật) chỉ ra khi đúng đạo thống.
- Các lần Nghịch Thiên Cải Mệnh sau (Kim Đan, Nguyên Anh…) dùng cùng danh sách, thêm thiên phú cấp cao ở task sau.

---

## 2. Danh sách 24 thiên phú

### Lương (xanh lục) · 6

| # | id | Tên | Mô tả trong game | Hiệu ứng |
|---|---|---|---|---|
| F1 | `dao_co_kien_co` | Đạo Cơ Kiên Cố | Nền móng đắp chắc, xây gì lên cũng không lún. | `breakthroughChance +8` (tiểu cảnh giới) |
| F2 | `linh_khi_than_hoa` | Linh Khí Thân Hòa | Linh khí quanh ngươi như mèo quen chủ, gọi là tới. | `cultivationSpeed +0.1` |
| F3 | `bi_nhuc_nhu_dong` | Bì Nhục Như Đồng | Muỗi đốt gãy vòi, ngươi chưa kịp thấy ngứa. | `injuryReduce +0.1` · `stat.health +10` |
| F4 | `than_thuc_so_khai` | Thần Thức Sơ Khai | Nhắm mắt vẫn biết sau lưng có ai, kể cả con mèo nhà hàng xóm. | `divineSense +0.15` |
| F5 | `hoa_khi_sinh_tai` | Hòa Khí Sinh Tài | Mua rẻ, bán đắt, ai cũng tưởng mình được lợi. | `priceDiscount +0.1` · `incomePct +0.15` |
| F6 | `thu_on_tam_tinh` | Thủ Ổn Tâm Tĩnh | Tay không run, lòng không loạn. Hợp mọi nghề cần tỉ mỉ. | `craft.<mọi nghệ>.success +0.08` |

### Ưu (xanh lam) · 6

| # | id | Tên | Hợp | Mô tả trong game | Hiệu ứng |
|---|---|---|---|---|---|
| F7 | `kiem_tam_so_thanh` | Kiếm Tâm Sơ Thành | [Kiếm] | Kiếm trong tay như ngón tay thứ sáu. | `path.sword.power +0.2` · `speed +0.1` |
| F8 | `thiet_cot` | Thiết Cốt | [Thể] | Xương cứng như sắt, ngã từ vách núi xuống chỉ thấy đau lưng. | `path.body.power +0.2` · `injuryReduce +0.1` |
| F9 | `ngu_hanh_tuong_sinh` | Ngũ Hành Tương Sinh | [Pháp] | Năm hệ trong tay không còn cãi nhau. | `element.<mọi hệ>.power +0.15` |
| F10 | `than_binh_huu_linh` | Thần Binh Hữu Linh | [Binh] | Binh khí ngươi dùng lâu ngày sinh linh tính, biết tự né đòn cho chủ. | `path.weapon.power +0.2` · thưởng pháp bảo +20% |
| F11 | `bach_bao_nang` | Bách Bảo Nang | [Thuật] | Túi ngươi lúc nào cũng còn một lá phù cuối cùng. | `path.arcane.power +0.2` · `craft.talisman.yield +1` |
| F12 | `dan_hoa_thuan_thanh` | Đan Hỏa Thuần Thanh | [Đan] | Lửa luyện đan xanh như ngọc, đan ra thơm như bánh mới. | `craft.alchemy.success +0.15` · `craft.alchemy.yield +1` |

### Tuyệt (tím) · 6

| # | id | Tên | Hợp | Mô tả trong game | Hiệu ứng |
|---|---|---|---|---|---|
| F13 | `huyet_hai_bat_kho` | Huyết Hải Bất Khô | [Ma] (chỉ Ma đạo) | Máu kẻ thù là suối nguồn, đánh càng lâu càng khỏe. | `lifesteal +0.15` · `heartDemonResist +0.1` |
| F14 | `bo_de_tam` | Bồ Đề Tâm | [Phật] (chỉ Phật đạo) | Tâm như cây bồ đề, gió nào cũng không làm gãy. | `heartDemonResist +0.3` · `stat.daoHeart +10` |
| F15 | `truong_sinh_dao_the` | Trường Sinh Đạo Thể | [Đan] | Năm tháng đi qua người ngươi như nước chảy qua đá. | `lifespanPct +0.3` · `agingSlow` |
| F16 | `ngo_dao_thien_tu` | Ngộ Đạo Thiên Tư | | Người khác bế quan mười năm, ngươi ngủ trưa một giấc là thông. | `stat.comprehension +15` · `bottleneckResist +0.2` |
| F17 | `tien_duyen_bat_doan` | Tiên Duyên Bất Đoạn | | Đi đường hay vấp, mà vấp toàn vào bảo vật. | `stat.luck +15` · `eventWeight.fortune ×1.5` |
| F18 | `kim_thien_thoat_xac` | Kim Thiền Thoát Xác | [Cẩu đạo] | Đánh không lại thì để lại cái áo, người đã ở ngoài trăm dặm. | `escapeChance +0.3` · `speed +0.2` |

### Thiên (cam) · 4

| # | id | Tên | Hợp | Mô tả trong game | Hiệu ứng |
|---|---|---|---|---|---|
| F19 | `kiem_khai_thien_mon` | Kiếm Khai Thiên Môn | [Kiếm] | Một kiếm chém ra, mây trên trời tách làm đôi, ba ngày chưa khép. | `path.sword.power +0.4` · `combatPower.vsHigherRealm +0.2` |
| F20 | `van_kiep_bat_hoai` | Vạn Kiếp Bất Hoại | [Thể] | Thân này đã qua vạn kiếp, thêm một kiếp cũng chẳng sao. | `injuryReduce +0.3` · `trigger.cheatDeath 1` |
| F21 | `thien_dao_thu_can` | Thiên Đạo Thù Cần | | Trời thưởng kẻ chăm. Mà ngươi thì chăm thật. | `cultivationSpeed +0.35` · `breakthroughChance.major +10` |
| F22 | `van_tuong_quy_nguyen` | Vạn Tượng Quy Nguyên | [Pháp] | Mọi hệ về một mối, không còn hệ nào khắc được ngươi. | `element.<mọi hệ>.power +0.3` · bị khắc hệ không bị phạt |

### Thần (đỏ) · 2

| # | id | Tên | Mô tả trong game | Hiệu ứng | Cái giá |
|---|---|---|---|---|---|
| F23 | `nhat_niem_hoi_quang` | Nhất Niệm Hồi Quang | Trước lúc chết, một niệm quay đầu, thời gian chảy ngược. | Lần đầu chết: quay về đầu đại cảnh giới hiện tại, giữ ký ức (`rewindOnDeath`, 1 lần) | Thế giới hơi khác đi, ký ức không chắc đúng |
| F24 | `thien_menh_so_quy` | Thiên Mệnh Sở Quy | Thiên mệnh dồn về một người. Trời cho nhiều, trời cũng sẽ đòi. | `stat.luck +30` · `combatPower +0.2` · `cultivationSpeed +0.2` | Thiên kiếp mạnh hơn 30%; thiên kiêu khác coi ngươi là cái gai |

---

## Build mẫu (để kiểm cảm giác)
- **Kiếm tu tốc chiến**: Kiếm Thai (khí vận) + Tàng Phong Kiếm Kinh + F7 → F19.
- **Thể tu bất tử**: Hậu Bì + Cửu Chuyển Kim Cốt Quyết + F8 → F20.
- **Đan sư sống lâu**: Đan Thủ + Thanh Mộc Trường Sinh Công + F12 → F15.
- **Ma tu hút máu**: U Hà Huyết Ảnh Công + F13.
- **Tán tu cẩu đạo**: Khoái Cước + F18 + F5.

## Ghi chú cho thread làm repo
- File `content/fate-talents.json`; trường giống `traits.json` + `fits` (con đường/đạo thống/nghệ) + `requiresLineage`.
- Bảng phẩm theo đạo cơ, số lần làm mới vào `balance.json`.
- Móc mới: `element.all.power`, `craft.all.success`, `ignoreElementWeakness`, `tribulationPower` (cho F24). `rewindOnDeath` đã có trong đề xuất đường phàm nhân.
