# Kinh thánh thế giới: Thương Lan giới (9.R7)

Nguồn cho mọi file `content/worlds/thuong_lan/*`. Mọi tên ở đây do dự án tự đặt; hàng rào tên cấm ở `docs/design/ten-cam.json` (validate báo lỗi nếu trùng). Thuật ngữ chung của thể loại (Luyện Khí, Trúc Cơ, Kim Đan, Nguyên Anh, Hóa Thần, linh căn, bí cảnh…) giữ nguyên.

Theo quyết định của chủ dự án (12/10): Claude tự quyết nội dung từ Giai đoạn 4, chủ dự án xem lại sau. Chỗ nào chủ dự án muốn đổi, sửa file này trước rồi mới sửa JSON.

## 1. Lịch sử (bốn thời kỳ)

| Thời kỳ | Chuyện chính | Dấu vết trong game |
|---|---|---|
| **Thái Cổ** | Thần tộc và cự yêu tranh thiên hạ. Trận cuối đánh vỡ đại lục phía tây thành **Thái Cổ chiến trường**. | Cổ địa, hóa thạch thần thú, di cốt; tri thức `bi_canh` |
| **Thượng Cổ** | Tiên nhân đầu tiên phi thăng qua **Thông Thiên lộ**. Một đêm cuối thời kỳ, đường ấy đứt: thiên hạ gọi là **Đoạn Thiên chi biến**. Từ đó phi thăng chỉ còn là truyền thuyết. | Chừa chỗ cho Tầng 3 (GĐ 14): điềm báo phi thăng trong sự kiện thiên hạ |
| **Trung Cổ** | Các tông môn lớn lập nên. **Tiên Ma đại chiến lần thứ nhất** đẩy Ma đạo về Huyết Uyên; Phật môn từ tây truyền sang. Đại Ung lập quốc ở Trung Nguyên. | Bích Lạc Tông, U Hà Ma Tông, Vô Ưu Tự có từ thời này |
| **Cận Thế** (hiện tại) | Năm thứ ba nghìn của **Thương Lan lịch**. Các tông giữ hòa ước Trung Cổ nhưng ngấm ngầm tranh đoạt; Ma đạo lại trỗi dậy; phàm quốc thay ngôi liên tục. | Thời cuộc (9.5), sự kiện thiên hạ |

## 2. Tám đại vực (mở dần theo cảnh giới)

Sáu vùng cũ giữ nguyên id để không vỡ save. Thêm hai vùng mới.

| # | Id | Tên | Mở từ | Linh khí | Đặc trưng |
|---|---|---|---|---|---|
| 1 | `thanh_van_chau` | Trung Nguyên | phàm nhân | 1.0 | Đất phàm quốc, võ lâm, chợ phiên. Ít kỳ ngộ. |
| 2 | `vo_chu_hoang_nguyen` | Vô Chủ hoang nguyên | Luyện Khí | 1.1 | Tán tu, cướp bóc, Vô Chủ Phường. |
| 3 | `van_thu_son_mach` | Vạn Thú sơn mạch | Trúc Cơ | 1.3 | Yêu tộc vực: rừng già, yêu thú, linh thảo. |
| 4 | `huyet_uyen` **(mới)** | Huyết Uyên ma vực | Trúc Cơ | 1.3 | Vực sâu phía nam, đất của Ma đạo. Ma công tu nhanh, tâm ma dễ sinh, chính đạo bị săn. |
| 5 | `dong_hai` | Đông Hải quần đảo | Kim Đan | 1.5 | Đảo, hải thị, giao tộc, bí cảnh dưới biển. |
| 6 | `thai_co_chien_truong` **(mới)** | Thái Cổ chiến trường | Kim Đan | 1.6 | Cổ địa phía tây: đất vỡ, di cốt thần thú, cấm chế thượng cổ còn sống. Kỳ ngộ nhiều nhất, chết cũng nhiều nhất. |
| 7 | `bac_minh_tuyet_vuc` | Bắc Minh tuyết vực | Nguyên Anh | 1.8 | Băng nguyên, cô độc, tâm ma khó sinh. |
| 8 | `trung_chau` | Thương Lan Trung Châu | Hóa Thần | 2.0 | Đại tông, thế gia ngàn năm, đại năng. |

Mỗi vùng: ≥ 3 tông môn hoặc thế lực, ≥ 3 sự kiện đặc trưng, một hộ vệ (guardian) khi vượt cảnh.

## 3. Năm phàm quốc (`nations.json`)

Đều nằm ở Trung Nguyên trừ Xích Sa (rìa Vô Chủ hoang nguyên). Vua: Ung Đế Triệu Khải, Cảnh Vương Lưu Mậu, Lạc Hà Vương Mộc Thiện, Bạch Lộc Công Hô Diên Liệt, Khả hãn Thiết Mộc Ba. Nối 12.1 (triều đình) về sau.

| Id | Tên | Thể chế | Nét riêng |
|---|---|---|---|
| `dai_ung` | Đại Ung vương triều | vương triều | Nước lớn nhất, có Khâm Thiên Giám tìm người có tiên duyên (cổng `hoang_that`). Vua ham trường sinh. |
| `canh_quoc` | Cảnh quốc | vương quốc | Nước nhỏ ven sông, nghề dệt và chè; trọng văn, khinh võ. |
| `lac_ha` | Lạc Hà quốc | vương quốc | Nước nhiều chùa, gần Vô Ưu Tự; vua tu Phật. |
| `bach_loc` | Bạch Lộc quốc | công quốc | Vùng núi phía bắc, săn bắn, kỵ binh; giáp băng nguyên. |
| `xich_sa` | Xích Sa hãn quốc | hãn quốc | Du mục sa mạc, buôn ngựa và muối với tán tu; luật kẻ mạnh. |

## 4. Mười hai tu tiên thế gia (`clans.json`)

Thế gia có **dòng đích** (con chính thất, được truyền công pháp gia tộc) và **dòng thứ** (làm việc vặt, tranh suất). Nối xuất thân `tu_tien_gia_toc` và cổng `the_gia`.

| Id | Tên | Vùng | Nghề / thế mạnh |
|---|---|---|---|
| `on_gia` | Ôn gia | Trung Nguyên | Luyện đan; thông gia với phàm quốc |
| `co_gia` | Cố gia | Trung Nguyên | Trận pháp, giữ cổng thành Đại Ung |
| `thac_bat` | Thác Bạt thị | Bắc Minh | Thể tu băng hệ, lạnh lùng, ít người |
| `hoang_phu` | Hoàng Phủ thế gia | Trung Châu | Kiếm tu, ngàn năm không ra khỏi châu |
| `au_duong` | Âu Dương thế gia | Đông Hải | Thuyền buôn, hải thị, giàu nhất Đông Hải |
| `tu_ma` | Tư Mã gia | Trung Châu | Phù lục, mưu sĩ của các đại tông |
| `khuong_gia` | Khương gia | Vạn Thú | Ngự thú, nuôi yêu sủng |
| `ninh_gia` | Ninh gia | Trung Nguyên | Linh thực, ruộng linh mễ |
| `doc_co` | Độc Cô thị | Huyết Uyên | Thế gia nửa chính nửa tà, luyện độc |
| `ta_gia` | Tạ gia | Vô Chủ | Tán tu lập gia, buôn tin tức |
| `bach_ly` | Bách Lý gia | Thái Cổ chiến trường | Đào di tích, giải cấm chế |
| `lan_gia` | Lan gia | Đông Hải | Huyết mạch giao tộc pha người |

## 5. Sáu tộc (`races.json`)

| Id | Tên | Ở đâu | Quan hệ với nhân tộc |
|---|---|---|---|
| `nhan_toc` | Nhân tộc | khắp nơi | — |
| `yeu_toc` | Yêu tộc | Vạn Thú | Hòa ước với Vạn Yêu Điện; đánh nhau với kẻ săn yêu đan |
| `giao_toc` | Giao tộc | Đông Hải | Buôn bán, nhưng thù kẻ đào phủ cũ của giao long |
| `linh_toc` | Linh tộc (thảo mộc thành tinh) | Bách Thảo Cốc, rừng già | Hiền, sợ lửa, bị săn làm thuốc |
| `quy_toc` | Quỷ tộc | U Minh dưới Huyết Uyên | Nối quỷ tu (đạo thống Quỷ) |
| `thach_toc` | Thạch tộc (người đá Thái Cổ) | Thái Cổ chiến trường | Ngủ ngàn năm, tỉnh dậy không nhớ ai là bạn |

## 6. Tông môn tu tiên (38, `sects.json`)

Mỗi tông có `region`, `tier` (đại, trung, tiểu), `allies` và đối thủ (`identity.rival`). Sáu tông cũ có `roaming`: mở hội thu đồ khắp nơi nên bái nhập được từ đâu cũng được. Các tông còn lại chỉ nhận người tự tìm tới vùng của mình.

| Vùng | Tông (in đậm = có từ trước, đi chiêu mộ khắp nơi) |
|---|---|
| Trung Nguyên | **Vô Ưu Tự** (Phật), Thanh Khê Kiếm Phái (tiểu, kiếm), Lạc Diệp Môn (tiểu, đan), Tử Trúc Am (trung, Phật, ni), Vân Mộng Các (tiểu, ảo thuật) |
| Vô Chủ hoang nguyên | Hắc Phong Trại (tiểu, tán tu), Phong Sa Môn (tiểu, thân pháp), Tán Tu Liên Minh (trung) |
| Vạn Thú sơn mạch | **Vạn Yêu Điện** (yêu), **Bách Thảo Cốc** (đan), Ngự Thú Tông (trung), Thanh Mộc Cung (trung, mộc), Bách Điểu Cốc (tiểu, yêu) |
| Huyết Uyên ma vực | **U Hà Ma Tông**, Huyết Ảnh Môn (trung, ám sát), Thi Âm Tông (trung, quỷ, luyện thi), Vạn Độc Giáo (trung, độc), Ma La Điện (đại) |
| Đông Hải quần đảo | Bích Ba Các (trung, thủy), Thận Lâu Đảo (trung, ảo thuật, buôn bán), Long Tích Đảo (đại, thể tu), Tiềm Long Phủ (tiểu), Hải Nguyệt Am (tiểu, Phật) |
| Thái Cổ chiến trường | Thủ Mộ Tông (trung), Phá Cấm Đường (tiểu, giải cấm chế), Chiến Thần Điện (đại, thể tu), Di Cốt Môn (tiểu, ma) |
| Bắc Minh tuyết vực | Băng Tâm Cung (đại, nữ tu), Tuyết Lang Bộ (trung, yêu), Hàn Sơn Tự (trung, Phật khổ tu), Phong Tuyết Kiếm Lư (tiểu, kiếm) |
| Trung Châu | **Bích Lạc Tông**, **Tàng Phong Kiếm Các**, Thái Huyền Đạo Cung (đại, pháp), Thiên Cơ Các (đại, bói toán, trận), Đại Diễn Thư Viện (đại, nho tu), Tinh La Điện (trung, tinh tú), Kim Thiềm Thương Minh (đại, thương minh) |

Khâm Thiên Giám là cơ quan triều đình Đại Ung (cổng tiên duyên `hoang_that`), không phải tông môn.

## 7. Sự kiện thiên hạ (`world-events.json`, ~30)

Chạy theo **pha** (báo trước → diễn ra → hậu quả), nối thời cuộc 9.5. Người chơi có thể dự hoặc né.

- Tiên Ma đại chiến (Huyết Uyên tràn lên; đan dược tăng giá, tông môn chiêu binh).
- Bí cảnh mở theo chu kỳ (Thái Cổ, Đông Hải; giới hạn cảnh giới vào).
- Đại hội đấu giá Kim Thiềm, Thận Lâu.
- Thú triều Vạn Thú sơn mạch.
- Phàm quốc đổi ngôi, chiến tranh Đại Ung với Xích Sa.
- Thiên kiêu đại hội (bảng thiên kiêu xếp lại).
- Điềm phi thăng: cột sáng ở Trung Châu (chừa chỗ cho Tầng 3; chỉ là truyền thuyết, không ai lên được).
- Đại năng tọa hóa, động phủ lộ ra.
- Ôn dịch phàm gian, nạn đói, đại hạn.

## 8. Nhân vật nổi tiếng (`figures.json`, ~25)

Đại năng có số mệnh riêng, sống chết theo thời gian; người chơi nghe tin đồn, có thể gặp. Ví dụ hướng: chưởng môn mỗi đại tông, một ma đầu Huyết Uyên, một tán tu huyền thoại, một vua Đại Ung ham trường sinh, một lão hòa thượng Hàn Sơn Tự, một thương nhân Kim Thiềm biết mọi bí mật. Tên đặt theo quy tắc mục 9.

## 9. Quy tắc đặt tên

- Tên người: họ Hán Việt + tên đệm + tên (kho `names.json`); tránh ghép ra tên trong hàng rào (validate kiểm).
- Tông môn: 2 chữ hình ảnh + loại (Tông, Môn, Các, Cung, Điện, Tự, Am, Đường, Phủ, Giáo). Ma đạo dùng chữ U, Huyết, Thi, Ma, Độc, Ảnh.
- Địa danh: hình ảnh thiên nhiên + vực/châu/hải/nguyên/sơn mạch.
- Không dùng tên riêng một bộ tiểu thuyết đã đặt ra; tên chung (Thiếu Lâm, Võ Đang, Côn Lôn, Nga Mi là địa danh, chùa có thật) được giữ trong võ lâm.

## 10. Kế hoạch nhập dữ liệu

| Task | Việc |
|---|---|
| 9.R7a | Hàng rào tên cấm + validate; file này |
| 9.R7b | Hai đại vực mới (Huyết Uyên, Thái Cổ chiến trường), sự kiện đặc trưng, mỗi vùng ≥ 3 thế lực và ≥ 3 sự kiện |
| 9.R7c | `nations.json`, `clans.json`, `races.json` (schema, nạp, hiện trong Sổ tri thức / bản đồ) |
| 9.R7d | Tông môn ~40 có vùng, đồng minh, đối thủ |
| 9.R7e | `world-events.json`, `figures.json`, bí cảnh và phường thị bổ sung |

## 11. Sử Thương Lan cho người chơi tự khám phá (tổng tra, 23/10)

Claude bổ sung (chủ dự án xem lại sau). Mục 1 giữ nguyên; đây là phần "sự thật" phía sau, người chơi ghép lại qua nhiều đời. Sổ tri thức có nhóm mới **Sử Thương Lan** (`group: lich_su`, 14 mục), nguồn là cờ do sự kiện `events/su-thuong-lan.json` (tiền tố `stl_`) và các sự kiện cũ đặt.

| Mảnh sử | Sự thật | Tìm ở đâu |
|---|---|---|
| Thần và yêu | Thần tộc sinh từ ánh sáng, cự yêu từ lòng đất; trận cuối vỡ đại lục tây. Yêu tộc là con cháu cự yêu. | Ông lão kể chuyện (phàm), xương dưới ruộng (phàm), hài cốt Thái Cổ |
| Đạo binh bằng đá | Thạch tộc do thần tộc nặn làm đạo binh; ngủ chờ lệnh. | Thạch nhân hỏi đường (Thái Cổ, Kim Đan) |
| Kẻ giữ cửa | Di cốt thần tộc đều chết khi giữ một cánh cửa đá. | Chữ "Thủ" trên hài cốt, người trong băng (Bắc Minh, Nguyên Anh) |
| Thông Thiên lộ | Đường sáng chín nghìn bậc ở Trung Châu; linh khí thượng giới rót xuống theo đó. | Ngọc giản tàng kinh các, bích họa phủ giao long (Đông Hải), bậc thứ nhất (Trung Châu) |
| Đoạn Thiên chi biến | Một đêm đường đứt; không ai phi thăng được từ đó. | Chuyện dân gian, cột sáng, yến đại năng |
| Hạ giới cạn | Không còn linh khí thượng giới, linh mạch cạn dần. | Lão tổ thấy linh khí loãng, di ngôn đại năng |
| Gốc ma đạo | Ma đạo sinh vì đói linh khí, không phải vì ác tâm. | Mộ tán tu Trung Cổ (Vô Chủ, Huyết Uyên) |
| Tiên Ma đại chiến I, Thương Lan lịch | Ma đạo bị đẩy xuống Huyết Uyên; năm ký hòa ước là năm 1. | Tấm bia bên sông (phàm), chép sử cho Khâm Thiên Giám |
| Cửa U Minh | Ma tông bị đuổi xuống Huyết Uyên cũng là để giữ cửa U Minh. | Lão ma giữ vực, sao chổi đỏ |
| Người tăng phương tây | Phật môn từ tây sang, "linh khí cạn thì tu tâm". | Tranh vách chùa cổ (phàm), Vô Ưu Tự |
| Khế ước tiên phàm | Tổ tiên vua Đại Ung là phàm nhân; tiên môn được chọn trẻ có linh căn, tu sĩ không can ngôi vua. | Khâm Thiên Giám thuê chép sách (phàm, trí lực ≥ 55) |
| Cột sáng Trung Châu | Đại năng sắp thọ tận thử bước lên đường đã đứt. | Sự kiện thiên hạ "Điềm phi thăng" |
| Thuyết thứ ba (bí mật cuối) | Có kẻ chém Thông Thiên lộ để thứ sau cánh cửa Thái Cổ không leo lên; hạ giới cạn là cái giá. | "Ghép lại sử cũ": Kim Đan, đời sinh ra đã biết 4 mảnh (từ các đời trước) |

Chừa chỗ cho Tầng 3 (GĐ 14): thứ sau cánh cửa, kẻ đã chém đường, và việc nối lại Thông Thiên lộ.
