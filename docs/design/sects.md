# Sáu tông môn khởi đầu của Thương Lan (task 2.4) — ĐÃ DUYỆT 2026-10-11

Chủ dự án đồng ý 4 câu hỏi đầu của bản nháp (giữ tên và mô tả, Dẫn Khí Quyết là công pháp mặc định, công pháp dùng chung còn tông môn riêng từng thế giới, ma tông nhận cả Ngũ linh căn). Tên tông môn theo bộ công pháp và sự kiện đã duyệt (`techniques.md`, `cultivation-events.md`). **Vạn Yêu Điện** có đạo thống **Yêu**, để dành làm sau: dữ liệu có sẵn nhưng chưa nhận đệ tử.

Công pháp: `docs/design/techniques.md` (C1–C16) + **Dẫn Khí Quyết** (C0, Hoàng phẩm, hệ theo linh căn, không thêm hiệu ứng): tiên sư để lại lúc thử linh căn.

| id | Tên | Phe | Đạo thống | Nhận đệ tử khi | Công pháp truyền |
|---|---|---|---|---|---|
| `bich_lac_tong` | **Bích Lạc Tông** | Chính | Tiên | Có linh căn | C1 (ngoại môn), C2 (chân truyền) |
| `tang_phong_kiem_cac` | **Tàng Phong Kiếm Các** | Chính | Tiên | Linh căn Kim/Phong **hoặc** Căn cốt ≥ 60; qua Kiếm Tâm quan (Đạo tâm ≥ 50) | C3 |
| `bach_thao_coc` | **Bách Thảo Cốc** | Chính | Tiên | Có linh căn, Ngộ tính ≥ 50 | C4 |
| `vo_uu_tu` | **Vô Ưu Tự** | Chính | Phật | Có linh căn và Đạo tâm ≥ 55 (cửa Phật duyên cho người không linh căn: task 3.12) | C5 |
| `u_ha_ma_tong` | **U Hà Ma Tông** | Ma | Ma | Mọi linh căn, kể cả Ngũ linh căn | C6 |
| `van_yeu_dien` | **Vạn Yêu Điện** | Yêu | Yêu *(để sau)* | — | C7 |

**Mô tả trong game**
- **Bích Lạc Tông**: Mây trắng phủ chín ngọn núi, chuông sớm vang tới tận chân núi. Tông môn lớn nhất Thương Lan, quy củ cũng nhiều nhất: đi sai một bước cũng có người ghi sổ.
- **Tàng Phong Kiếm Các**: Một ngọn núi trọc, một mái nhà tranh, trăm thanh kiếm cắm quanh sân. Đệ tử ít, ai cũng nghèo, ai cũng ngông.
- **Bách Thảo Cốc**: Cả thung lũng thơm mùi thuốc. Người trong cốc hiền lành, nhưng đắc tội với họ thì cả đời đừng mong mua được viên đan nào.
- **Vô Ưu Tự**: Chùa cổ trên núi, sư sãi tu tâm trước, tu lực sau. Cơm chay ngon nhất Thương Lan, nhưng không có thịt, tuyệt đối không.
- **U Hà Ma Tông**: Cửa tông luôn mở, ai tới cũng nhận. Ra thì khó hơn vào. Đồng môn gọi nhau là huynh đệ, nhưng ngủ vẫn ôm đao.
- **Vạn Yêu Điện**: Người và yêu tộc sống chung một núi. Đệ tử mới đến hôm đầu đã bị khỉ lấy mất giày.

**Cấp bậc:** Ký danh → Ngoại môn → Nội môn → Chân truyền. U Hà Ma Tông: Huyết nô → Huyết vệ → Huyết sứ → Huyết tử.

| Tông môn | Bổng lộc mỗi năm (ngoại môn) | Thưởng riêng khi là đệ tử (móc K.6) | Nghĩa vụ / cái giá |
|---|---|---|---|
| Bích Lạc Tông | 3 linh thạch | `breakthroughChance +5` (có trưởng lão hộ pháp) | Nhiệm vụ tông môn nhiều; vi phạm môn quy bị phạt |
| Tàng Phong Kiếm Các | 1 linh thạch | `path.sword.affinity +15` | Nghèo; hay bị gọi đi thách đấu |
| Bách Thảo Cốc | 2 linh thạch | `craft.alchemy.affinity +15`, `craft.farming.affinity +10` | Phải trông linh điền; chiến lực kém |
| Vô Ưu Tự | 1 linh thạch | `heartDemonResist +0.15` | Kiêng sát sinh, kiêng tình duyên |
| U Hà Ma Tông | 4 linh thạch | (đạo thống Ma: tu vi ×1.4) | Nhân quả −2 mỗi năm; danh vọng Chính −20 khi gia nhập |
| Vạn Yêu Điện | 2 linh thạch | `craft.beast.affinity +20` | (để sau) |

Hệ số đạo thống: Tiên ×1.0 · Ma ×1.4 · Phật ×0.8 · Yêu ×1.0 (tạm).
