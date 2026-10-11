# Task 2.1: Cảnh giới · Linh căn · Con đường · Bách nghệ — ĐÃ DUYỆT 2026-10-11 (kể cả các đề xuất)

Nội dung cho `content/realms.json`, `content/roots.json`, `content/aptitudes.json`. Các con số lấy đúng từ mục G và K của PLAN, mình chỉ thêm **tên, mô tả trong game và vài hệ số còn thiếu** (đánh dấu *mới*). Mọi con số sẽ nằm trong `balance.json`.

Đây là nội dung chung cho mọi thế giới; thế giới nào muốn khác (ví dụ linh khí mỏng hơn) thì chỉnh hệ số ở `world.json` của thế giới đó.


---

## A. Cảnh giới (Phàm Nhân → Hóa Thần)

| # | id | Tên | Tầng | Tốc độ gốc %/năm | Thọ nguyên | Chiến lực nền | Đột phá vào cảnh giới này |
|---|---|---|---|---|---|---|---|
| A0 | `pham_nhan` | Phàm Nhân | 7 cảnh giới võ đạo (Tam lưu → Ngũ khí triều nguyên, xem mortal-path-approved.md mục 2b) | — | 70 ±10 (+ thưởng võ đạo; dùng mục `lifespan` có sẵn trong balance.json) | 1 → 9 | — |
| A1 | `luyen_khi` | Luyện Khí | Tầng 1–9 | 25 | 120 ±10 | 10 | Khi có linh căn và công pháp: tự vào tầng 1 |
| A2 | `truc_co` | Trúc Cơ | Sơ · Trung · Hậu · Viên mãn | 8 | 200 ±15 (+20 nếu đạo cơ Hoàn mỹ) | 40 | 30% |
| A3 | `kim_dan` | Kim Đan | Sơ · Trung · Hậu · Viên mãn | 3 | 500 ±30 (+10 mỗi phẩm trên 5) | 160 | 20% |
| A4 | `nguyen_anh` | Nguyên Anh | Sơ · Trung · Hậu · Viên mãn | 1.2 | 1.000 ±50 | 640 | 12% |
| A5 | `hoa_than` | Hóa Thần | Sơ · Trung · Hậu · Viên mãn | 0.5 | 2.000 ±100 | 2.560 | 8% |

Lên tầng trong Luyện Khí 90%, lên tiểu cảnh giới từ Trúc Cơ trở lên 70% (G.2).

**Mô tả trong game** (hiện ở tooltip và màn tổng kết đời):
- **Phàm Nhân** — Ăn cơm, cày ruộng, sống bảy mươi năm. Trời cao bao nhiêu, phàm nhân chỉ biết ngẩng đầu mà đoán.
- **Luyện Khí** — Dẫn linh khí trời đất vào kinh mạch, từng chút một như kiến tha mồi. Đủ sức nhấc cối đá, chưa đủ sức bay.
- **Trúc Cơ** — Linh khí hóa lỏng, đắp nền cho đạo đồ. Từ đây mới thật sự bước qua cửa tiên, thọ thêm một đời người.
- **Kim Đan** — Linh lực ngưng thành một viên đan trong đan điền. Ngự kiếm phi hành, một mình giữ được một thành.
- **Nguyên Anh** — Đan vỡ thành anh, thân thể có hư đi thì Nguyên Anh vẫn còn. Một tiếng nói làm cả một vùng phải dè chừng.
- **Hóa Thần** — Thần thức trải ngàn dặm, nhất cử nhất động liên quan đến khí vận cả một đại vực.

*Mới:* **Cảnh giới cao hơn** (Luyện Hư trở lên) để GĐ7; trong game hiện thành ô "???" mờ, cho người chơi biết còn đường phía trước.

---

## B. Linh căn

### B1. Phẩm linh căn (kiểm tra lúc 6–12 tuổi)

| id | Tên | Tỉ lệ | Hệ số tu | Số hệ | Mô tả trong game |
|---|---|---|---|---|---|
| `none` | Không linh căn | 60% | 0 | 0 | Kinh mạch như ống tre bít đầu, linh khí chảy qua không đọng lại. Làm phàm nhân cũng có cái hay của phàm nhân. |
| `ngu` | Ngũ linh căn | 14% | 0.4 | 5 | Năm hệ đủ cả, hệ nào cũng mỏng. Người ta gọi là "phế linh căn", nhưng cũng có kẻ khổ tu mà thành. |
| `tu` | Tứ linh căn | 10% | 0.55 | 4 | Tạp mà không loạn. Tông môn nhỏ còn nhận, tông môn lớn thì lắc đầu. |
| `tam` | Tam linh căn | 8% | 0.7 | 3 | Tư chất trung bình của tu chân giới. Chăm chỉ thì Trúc Cơ không khó. |
| `song` | Song linh căn | 5% | 1.0 | 2 | Hai hệ tương trợ, tông môn nào cũng muốn giữ. |
| `don` | Thiên linh căn | 2% | 1.6 | 1 | Một hệ thuần khiết, linh khí vào như nước đổ xuống dốc. Thiên kiêu bảng có chỗ chờ sẵn. |
| `bien_di` | Biến dị linh căn | 0.9% | 1.8 | 1 (biến dị) | Linh căn đột biến thành hệ hiếm. Mạnh, nhưng công pháp phù hợp khó tìm. |
| `the_chat` | Thể chất đặc biệt | 0.1% | 2.0 | xem B4 | Trời sinh dị thể, trăm năm khó gặp. |

*Mới (đề xuất):* xuất thân **Hậu duệ gia tộc tu tiên** được quay linh căn 2 lần lấy kết quả tốt hơn; **Cô nhi** không bị ảnh hưởng.

### B2. Ngũ hành (Kim Mộc Thủy Hỏa Thổ)

| id | Hệ | Khắc | Bị khắc | Mô tả |
|---|---|---|---|---|
| `kim` | Kim | Mộc, Phong | Hỏa | Sắc bén, cương trực. Hợp kiếm, hợp binh khí. |
| `moc` | Mộc | Thổ | Kim | Sinh sôi, bền bỉ. Hợp linh thực, hồi phục. |
| `thuy` | Thủy | Hỏa | Thổ | Mềm mà khó cắt đứt. Hợp phòng thủ, ảo thuật. |
| `hoa` | Hỏa | Kim, Băng | Thủy | Bạo liệt, nhanh gọn. Hợp luyện đan, luyện khí. |
| `tho` | Thổ | Thủy, Lôi | Mộc | Dày nặng, vững chãi. Hợp luyện thể, trận pháp. |

### B3. Hệ biến dị *(mới: quan hệ khắc chế)*

| id | Hệ | Khắc | Bị khắc | Mô tả |
|---|---|---|---|---|
| `loi` | Lôi | Thủy, Ám | Thổ | Nhanh nhất trong các hệ. Thiên kiếp với người hệ Lôi nhẹ hơn một chút. |
| `bang` | Băng | Mộc, Thủy | Hỏa | Lạnh và tĩnh. Làm chậm đối thủ, hợp người đạo tâm vững. |
| `phong` | Phong | Thổ | Kim | Nhẹ và khó bắt. Bỏ chạy, né tránh giỏi nhất. |
| `am` | Ám | Mộc, Kim | Lôi | Ẩn trong bóng tối. Hợp ám sát, ma đạo, quỷ đạo. |

Hệ khắc hệ: +20% chiến lực (con đường Pháp +35%), theo K.3.3.

### B4. Thể chất đặc biệt (3 loại đầu tiên)

| id | Tên | Mô tả | Hiệu ứng (móc K.6) |
|---|---|---|---|
| `luu_ly_linh_the` | Lưu Ly Linh Thể | Thân trong như lưu ly, linh khí đi qua không vướng chút tạp chất. | Mọi công pháp đều coi là hợp hệ; `breakthroughChance +10` |
| `ban_thach_thanh_cot` | Bàn Thạch Thánh Cốt | Xương nặng như đá tảng. Lúc nhỏ ngã cầu thang, cầu thang gãy. | `stat.physique +20` · `path.body.affinity +30` · `injuryReduce +0.2` |
| `u_minh_hon_the` | U Minh Hồn Thể | Sinh ra đã thấy những thứ người khác không thấy. Đêm đêm có "bạn" tới chơi. | `divineSense +0.5` · `lifespanPct +0.2` · `stat.charm −10` |

### B5. Thể chất kinh điển của thể loại *(thêm theo yêu cầu)*

Các kiểu thể chất quen thuộc trong truyện tu tiên. Tên ghép từ thuật ngữ cổ điển dùng chung (âm dương, ngũ hành, Phật học, đạo học); **không dùng tên riêng do một tác phẩm cụ thể đặt ra** (quy tắc 11), nên người chơi nhận ra "kiểu" thể chất mà không đụng bản quyền. Mỗi loại có một cái giá đi kèm.

| id | Tên | Kiểu quen thuộc | Mô tả trong game | Hiệu ứng (móc K.6) |
|---|---|---|---|---|
| `cuu_duong_the` | Cửu Dương Thể | Thể chất dương cực thịnh | Mùa đông cởi trần vẫn đổ mồ hôi. Nồi cơm nhà ngươi chưa bao giờ cần nhóm lửa. | `element.hoa.power +0.3` · `cultivationSpeed +0.2` · `stat.daoHeart −5` (nóng tính) |
| `thai_am_the` | Thái Âm Thể | Thể chất âm cực thịnh | Người lạnh như ngọc, đi qua đâu hoa cỏ đọng sương. Mùa hè cả nhà tranh nhau ngồi cạnh. | `element.bang.power +0.3` · `element.thuy.power +0.2` · `divineSense +0.2` · `stat.happiness −5` |
| `hon_don_the` | Hỗn Độn Thể | Đại khí vãn thành, càng về sau càng mạnh | Linh khí vào người như rơi xuống vực, mãi không thấy đáy. Người ngoài nhìn thì tưởng phế vật. | `cultivationSpeed −0.25` · `combatPower +0.3` · `combatPower.vsHigherRealm +0.3` |
| `tien_thien_dao_cot` | Tiên Thiên Đạo Cốt | Sinh ra đã gần với đạo | Ba tuổi ngồi xem mây cả buổi, năm tuổi nói một câu khiến lão đạo sĩ bỏ đi suy nghĩ ba ngày. | `stat.comprehension +20` · `bottleneckResist +0.3` · `heartDemonResist +0.15` |
| `kim_cuong_than` | Kim Cương Thân | Thân bất hoại kiểu Phật môn | Bị trâu húc, trâu gãy sừng. Sư cụ chùa bên cứ lấp ló ngoài cổng nhà ngươi. | `injuryReduce +0.3` · `path.body.affinity +20` · `heartDemonResist +0.1` |
| `thien_sinh_ma_the` | Thiên Sinh Ma Thể | Trời sinh hợp ma đạo | Lúc sinh ra, chó cả làng sủa suốt đêm. Lớn lên đẹp đến mức đáng ngờ. | Ma đạo tu vi thêm +20% · `heartDemonResist +0.3` · `faction.chinh.reputation −30` |
| `van_doc_the` | Vạn Độc Thể | Bách độc bất xâm, độc trong người làm vũ khí | Rắn cắn ngươi, rắn chết. Muỗi cũng không dám lại gần. | `eventWeight.poisoning ×0` · `path.arts.affinity +30` · `npcAffinityStart −10` |
| `thien_tuyet_mach` | Thiên Tuyệt Mạch | Thiên tài đoản mệnh, phải tu mới sống | Đại phu bảo không sống quá hai mươi. Trời cho ngươi tài, lấy lại tuổi thọ. | `cultivationSpeed +0.5` · `lifespanPct −0.7` cho tới khi lên Trúc Cơ thì phá giải |

Tỉ lệ trong 0.1% thể chất đặc biệt: chia đều cho 11 loại (B4 + B5), riêng Hỗn Độn Thể và Tiên Thiên Đạo Cốt hiếm gấp đôi.

*Cần thêm cho engine:* "Ma đạo tu vi thêm" dùng móc mới `lineage.ma.cultivationSpeed`; Thiên Tuyệt Mạch cần điều kiện `activeUntil: { realm: "truc_co" }` (ngược với `activeFrom`). Cả hai là việc code nhỏ, sẽ ghi vào task 2.3.

---

## C. Năm con đường chiến đấu

Tư chất mỗi con đường 0–100, khởi đầu ngẫu nhiên thấp (5–30), tăng khi luyện tập, sự kiện, khí vận. Con đường chính là con đường có tư chất cao nhất trong số đã học thần thông.

| id | Tên | Mô tả trong game | Hệ số chiến đấu *(mới)* |
|---|---|---|---|
| `sword` | Kiếm | Một kiếm phân thắng bại. Kiếm tu không thích đánh lâu, vì đánh lâu là thua. | Chiến lực +15%; hiệp 1 thêm +10%; thương tích nhận vào +10% |
| `body` | Thể | Lấy thân làm pháp bảo. Đao chém không đứt, nhưng tốn cơm. | Thương tích nhận vào −25%; Sức khỏe tối đa +10; thưởng pháp bảo chỉ còn một nửa |
| `spell` | Pháp | Hô phong hoán vũ, gọi lửa gọi sấm. Đánh đúng hệ thì một chiêu bằng ba. | Thưởng khắc hệ +35% (thay vì +20%); bị khắc thì −25% |
| `weapon` | Binh | Đao, thương, côn, kích. Không chói lọi nhưng chắc chắn, càng nhiều đồ tốt càng mạnh. | Thưởng pháp bảo ×1.5 |
| `arts` | Thuật | Phù, trận, độc, thú. Kẻ chuẩn bị kỹ không bao giờ đánh một trận công bằng. | Hành động Pháp bảo/Phù mạnh ×2; tay không chiến lực −20% |

Tốc theo con đường *(mới)*: Kiếm +10%, Thể −10%, các đường khác 0.

---

## D. Sáu bách nghệ

Mỗi nghệ có **cấp 0–100** (tăng khi làm) và **tư chất 0–100** (tăng tốc lên cấp). Tỉ lệ thành công = cấp + ngộ tính + tư chất (công thức ở task code sau).

| id | Tên | Mô tả trong game | Làm ra | Nối vào |
|---|---|---|---|---|
| `alchemy` | Luyện Đan | Một lò, một lửa, trăm vị thuốc. Sai một vị là đan thành than. | Đan dược | Tu vi, đột phá, thọ nguyên, hồi phục |
| `forging` | Luyện Khí | Nung sắt thành kiếm, nung kiếm thành pháp bảo. Tiếng búa ba năm không ngớt. | Pháp bảo, binh khí | Chiến lực |
| `formation` | Trận Pháp | Vài lá cờ, mấy hòn đá, đặt đúng chỗ thì nghìn quân không qua. | Trận bàn | Đột phá, phòng thủ động phủ, bẫy địch |
| `talisman` | Phù Lục | Một nét bút sai là cháy cả tay áo. Một nét bút đúng là cháy cả đối thủ. | Phù | Vật phẩm chiến đấu, thoát thân |
| `farming` | Linh Thực | Trồng linh thảo, chăm linh điền. Cây lớn chậm, nhưng không bao giờ phản bội ngươi. | Linh thảo | Nguyên liệu luyện đan, thu nhập |
| `beast` | Ngự Thú | Nuôi, thuần, kết khế ước với linh thú. Nó cắn người khác, đôi khi cắn cả ngươi. | Linh thú đồng hành | Cộng chiến lực, dò đường |

**Danh hiệu theo cấp** *(mới)*, ghép tiền tố theo nghệ (Đan, Khí, Trận, Phù, Linh Thực, Ngự Thú):

| Cấp | Danh hiệu | Ví dụ |
|---|---|---|
| 0–19 | Học đồ | Học đồ luyện đan |
| 20–39 | … Đồ | Đan Đồ |
| 40–59 | … Sư | Đan Sư |
| 60–79 | Đại … Sư | Đại Đan Sư |
| 80–100 | … Tông | Đan Tông |

**Phàm nhân cũng học được** *(mới)*: Luyện Đan và Linh Thực từ cấp 0 (thầy lang, nhà nông); các nghệ còn lại cần Luyện Khí trở lên. Người có nghề `nghe_thuoc` từ sự kiện phàm nhân bắt đầu với Luyện Đan cấp 10; `nghe_ren` bắt đầu Luyện Khí cấp 10 khi đã có linh căn.

---

## Ghi chú cho thread làm repo
- **Đã chốt khi nhập JSON (2026-10-11):** khắc chế hai chiều (Thổ khắc Lôi, Hỏa khắc Băng, Kim khắc Phong, suy từ cột "bị khắc" của B3); id `arts` (Thuật) và `farming` (Linh Thực) theo móc khí vận có sẵn; thọ nguyên Phàm Nhân lấy từ `balance.lifespan`; tên 5 con đường không đưa vào glossary (chữ một âm dễ gạch chân nhầm).
- id dùng đúng các móc khí vận đã có: `path.sword`, `path.body`, `craft.alchemy`; các id còn lại ở trên.
- Hệ số chiến đấu theo con đường và tỉ lệ linh căn đưa vào `balance.json`; `realms.json`/`roots.json`/`aptitudes.json` giữ tên, mô tả, thứ tự, khắc chế.
- Tên các mục (cảnh giới, linh căn, hệ, con đường, nghệ) nên vào `glossary.json` để có tooltip.
