# Task 2.4: Sáu tông môn khởi đầu · Tám công pháp Hoàng/Huyền phẩm — NHÁP chờ duyệt

Thế giới: **Thương Lan giới**. Tên tông môn và công pháp đều tự đặt, ghép từ từ Hán Việt thông dụng; không lấy tên tông môn/công pháp của tiểu thuyết nào (quy tắc 11).
Mọi con số (tỉ lệ nhận, bổng lộc, hệ số) sẽ vào `balance.json`; JSON chỉ giữ tên, mô tả, điều kiện và móc K.6.

---

## A. Sáu tông môn

| id | Tên | Phe | Đạo thống | Con đường / nghệ sở trường | Nhận đệ tử khi |
|---|---|---|---|---|---|
| `van_khe_tong` | **Vân Khê Tông** | Chính | Tiên | Pháp, Trận Pháp | Tam linh căn trở lên |
| `co_phong_kiem_phai` | **Cô Phong Kiếm Phái** | Chính | Tiên | Kiếm | Có linh căn hệ Kim hoặc Phong, **hoặc** Căn cốt ≥ 60 |
| `bach_thao_coc` | **Bách Thảo Cốc** | Chính (trung lập) | Tiên | Luyện Đan, Linh Thực | Có linh căn, Ngộ tính ≥ 50 |
| `tinh_lien_tu` | **Tịnh Liên Tự** | Chính | Phật | Thể | Có linh căn và Đạo tâm ≥ 55 (cửa Phật duyên cho người không linh căn để task 3.12) |
| `huyet_nha_dien` | **Huyết Nha Điện** | Ma | Ma | Kiếm, Thuật | Nhận **mọi** linh căn, kể cả Ngũ linh căn; không hỏi xuất thân |
| `van_thu_son` | **Vạn Thú Sơn** | Yêu (sống chung yêu tộc) | Tiên | Ngự Thú, Thuật | Có linh căn; Mị lực ≥ 40 hoặc có sự kiện thân với thú vật |

**Mô tả trong game**
- **Vân Khê Tông** — Mây trắng phủ chín ngọn núi, chuông sớm vang tới tận chân núi. Tông môn lớn nhất Thương Lan, quy củ cũng nhiều nhất: đi sai một bước cũng có người ghi sổ.
- **Cô Phong Kiếm Phái** — Một ngọn núi trọc, một mái nhà tranh, trăm thanh kiếm cắm quanh sân. Đệ tử ít, ai cũng nghèo, ai cũng ngông.
- **Bách Thảo Cốc** — Cả thung lũng thơm mùi thuốc. Người trong cốc hiền lành, nhưng đắc tội với họ thì cả đời đừng mong mua được viên đan nào.
- **Tịnh Liên Tự** — Chùa cổ trên hồ sen, sư sãi tu tâm trước, tu lực sau. Cơm chay ngon nhất Thương Lan, nhưng không có thịt, tuyệt đối không.
- **Huyết Nha Điện** — Cửa điện luôn mở, ai tới cũng nhận. Ra thì khó hơn vào. Đồng môn gọi nhau là huynh đệ, nhưng ngủ vẫn ôm đao.
- **Vạn Thú Sơn** — Người và yêu thú sống chung một núi. Đệ tử mới đến hôm đầu đã bị khỉ lấy mất giày.

**Cấp bậc (dùng ở task 2.5):** Ký danh → Ngoại môn → Nội môn → Chân truyền. Huyết Nha Điện gọi khác: Huyết nô → Huyết vệ → Huyết sứ → Huyết tử.

**Được và mất khi vào tông môn (đề xuất):**

| Tông môn | Bổng lộc mỗi năm (ngoại môn) | Thưởng riêng (móc K.6) | Nghĩa vụ / cái giá |
|---|---|---|---|
| Vân Khê Tông | 3 linh thạch | `breakthroughChance +5` (có trưởng lão hộ pháp) | Nhiệm vụ tông môn nhiều; vi phạm môn quy bị phạt |
| Cô Phong Kiếm Phái | 1 linh thạch | `path.sword.affinity +15` | Nghèo; hay bị gọi đi thách đấu |
| Bách Thảo Cốc | 2 linh thạch + 1 viên đan/2 năm | `craft.alchemy.affinity +15`, `craft.farming.affinity +10` | Phải trông linh điền; chiến lực kém |
| Tịnh Liên Tự | 1 linh thạch | `heartDemonResist +0.15`, `stat.daoHeart +5` lúc nhập môn | Kiêng sát sinh, kiêng tình duyên (giết người: Đạo tâm −) |
| Huyết Nha Điện | 4 linh thạch | (đạo thống Ma: tu vi ×1.4) | Nhân quả −2 mỗi năm; chính đạo `faction.chinh.reputation −20`; đồng môn có thể đâm sau lưng |
| Vạn Thú Sơn | 2 linh thạch | `craft.beast.affinity +20` | Phải nuôi thú của sư môn; danh vọng chính đạo không lên |

**Hệ số đạo thống (K.3.1, vào `balance.json`):** Tiên ×1.0 · Ma ×1.4 · Phật ×0.8.

---

## B. Tám công pháp

| id | Tên | Phẩm | Hệ | Đạo thống | Tông môn | Hiệu ứng thêm (móc K.6) |
|---|---|---|---|---|---|---|
| `dan_khi_quyet` | **Dẫn Khí Quyết** | Hoàng | Vô hệ (hợp mọi linh căn) | Tiên | (tiên sư để lại lúc thử linh căn; tán tu) | — |
| `luu_van_ngu_hanh_kinh` | **Lưu Vân Ngũ Hành Kinh** | Huyền | Ngũ hành (hợp mọi linh căn ngũ hành) | Tiên | Vân Khê Tông | `bottleneckResist +0.1` |
| `canh_kim_kiem_kinh` | **Canh Kim Kiếm Kinh** | Huyền | Kim | Tiên | Cô Phong Kiếm Phái | `path.sword.power +0.1` |
| `liet_hoa_dan_tam_quyet` | **Liệt Hỏa Đan Tâm Quyết** | Huyền | Hỏa | Tiên | Bách Thảo Cốc | `craft.alchemy.success +0.1` |
| `thanh_moc_truong_sinh_cong` | **Thanh Mộc Trường Sinh Công** | Hoàng | Mộc | Tiên | Bách Thảo Cốc, Vạn Thú Sơn | `lifespanPct +0.05` |
| `hau_tho_kim_than_quyet` | **Hậu Thổ Kim Thân Quyết** | Hoàng | Thổ | Phật | Tịnh Liên Tự | `injuryReduce +0.1`, `path.body.affinity +10` |
| `huyet_sat_ma_cong` | **Huyết Sát Ma Công** | Huyền | Vô hệ | Ma | Huyết Nha Điện | `lifesteal +0.1`, `heartDemonResist −0.15`, `karmaShift −1` |
| `van_thu_linh_khe_thuat` | **Vạn Thú Linh Khế Thuật** | Hoàng | Thủy | Tiên | Vạn Thú Sơn | `craft.beast.success +0.1` |

**Mô tả trong game**
- **Dẫn Khí Quyết** — Một trang giấy, mười hai câu khẩu quyết. Ai cũng tu được, tu tới đâu thì tùy trời.
- **Lưu Vân Ngũ Hành Kinh** — Năm hệ như năm đám mây, tụ rồi tan, tan rồi tụ. Tạp linh căn tu cũng không bị chê.
- **Canh Kim Kiếm Kinh** — Lấy kim khí nuôi kiếm ý. Tu lâu, nhìn cái gì cũng muốn chém thử.
- **Liệt Hỏa Đan Tâm Quyết** — Luyện lửa trong đan điền trước, rồi mới luyện lửa trong lò. Lông mày thường cháy mất nửa bên.
- **Thanh Mộc Trường Sinh Công** — Chậm như cây lớn, bền như rễ già. Người tu sống lâu, tính cũng chậm.
- **Hậu Thổ Kim Thân Quyết** — Mỗi ngày gánh đá lên núi, tụng kinh xuống núi. Mười năm sau, đá gánh ngươi cũng được.
- **Huyết Sát Ma Công** — Tu nhanh như lửa bén rơm. Ai cũng biết lửa ấy đốt cái gì.
- **Vạn Thú Linh Khế Thuật** — Học tiếng thú trước, học khẩu quyết sau. Có đệ tử nói chuyện với ngựa giỏi hơn với người.

**Luật hợp hệ (G.1, K.3.3):**
- Công pháp có hệ X: hợp nếu linh căn có hệ X; không hợp thì tu vi ×0.7.
- "Vô hệ": hợp mọi linh căn. "Ngũ hành": hợp mọi linh căn có ít nhất một hệ ngũ hành (không hợp biến dị).
- Thể chất đặc biệt: Lưu Ly Linh Thể hợp mọi công pháp; thể chất khác coi như hợp công pháp vô hệ, không hợp công pháp có hệ.
- Phẩm: Hoàng ×1.0, Huyền ×1.2 (đã có ở G.1).

---

## C. Cần chủ dự án chốt
1. **Tên** sáu tông môn và tám công pháp: giữ hay đổi?
2. **Dẫn Khí Quyết** làm công pháp mặc định mà tiên sư để lại (đúng với câu "tiên sư để lại một tờ khẩu quyết dẫn khí" ở task 2.3). Vào tông môn thì đổi sang công pháp của tông môn.
3. **Chỗ đặt file:** bảng D của PLAN ghi `content/worlds/thuong_lan/techniques.json`, nhưng mục C.7 xếp công pháp vào nhóm **dùng chung**. Đề xuất: công pháp ở `content/techniques.json` (dùng chung), tông môn ở `content/worlds/thuong_lan/sects.json` (riêng thế giới).
4. **Huyết Nha Điện** nhận cả Ngũ linh căn: cửa cho đời tạp linh căn, đổi lại nhân quả xấu dần. Có ổn không?
5. **Vạn Thú Sơn** thuộc phe Yêu nhưng đạo thống vẫn là Tiên (Yêu đạo để GĐ7).
