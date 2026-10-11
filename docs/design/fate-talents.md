# Task 2.7: Nghịch Thiên Cải Mệnh lần đầu — NHÁP chờ duyệt

**Lúc nào:** ngay khi đột phá Trúc Cơ thành công, hiện màn **Nghịch Thiên Cải Mệnh**: chọn **1 trong 3** thiên phú. Không quay lại được, không bỏ qua được (xem câu hỏi 3–4 ở mục C).
**Khác khí vận:** thiên phú mạnh hơn khí vận một bậc, chỉ có từ Trúc Cơ trở lên, và **giữ suốt đời**. Mọi hiệu ứng chỉ dùng móc K.6 đang có; không cần móc mới.
**Sau này:** Kim Đan, Nguyên Anh, Hóa Thần mỗi lần đột phá lại được chọn thêm một thiên phú (GĐ 4), nên bảng này sẽ dài thêm.

---

## A. Phẩm và tỉ lệ (vào `balance.json`)

| Phẩm | id | Tỉ lệ mỗi ô | Ghi chú |
|---|---|---|---|
| Huyền | `huyen` | 60% | Tăng mạnh một mặt |
| Địa | `dia` | 32% | Đổi lối chơi |
| Thiên | `thien` | 8% | Hiếm, có thể có cái giá |

- Ba ô không trùng nhau. Khí vận cao thì nhích tỉ lệ phẩm cao: mỗi 10 điểm Khí vận trên 50 → Thiên +1%, Địa +2% (lấy bớt từ Huyền).
- **Hợp đạo:** ít nhất 1 trong 3 ô hợp con đường hoặc linh căn của nhân vật nếu bảng có thiên phú như vậy (ví dụ người hệ Kim hay được ô hệ Kim).

---

## B. Mười tám thiên phú

### Huyền phẩm (8)

| id | Tên | Mô tả trong game | Hiệu ứng (móc K.6) |
|---|---|---|---|
| `tu_tam_nhu_thuy` | Tu Tâm Như Thủy | Lòng lặng như mặt hồ, linh khí vào không gợn sóng. | `cultivationSpeed +0.2` |
| `kim_cot_ngoc_co` | Kim Cốt Ngọc Cơ | Xương như vàng, da như ngọc. Đao chém trượt, gió thổi không lạnh. | `stat.physique +10` · `injuryReduce +0.15` |
| `minh_tam_kien_tinh` | Minh Tâm Kiến Tính | Nhìn một lần là hiểu, hiểu rồi khó quên. | `stat.comprehension +10` · `bottleneckResist +0.15` |
| `bat_dong_dao_tam` | Bất Động Đạo Tâm | Núi sập trước mặt, mặt không đổi sắc. | `stat.daoHeart +10` · `heartDemonResist +0.2` |
| `tran_dau_kiem_y` | Trần Đầu Kiếm Ý | Kiếm chưa ra khỏi vỏ, đối thủ đã thấy lạnh gáy. | `path.sword.affinity +20` · `path.sword.power +0.15` |
| `bach_luyen_thiet_than` | Bách Luyện Thiết Thân | Trăm lần tôi luyện, thân như sắt nguội. | `path.body.affinity +20` · `path.body.power +0.15` |
| `dan_dao_linh_thu` | Đan Đạo Linh Thủ | Ngửi khói lò là biết đan thành mấy phần. | `craft.alchemy.success +0.15` · `craft.alchemy.affinity +15` |
| `phuc_duyen_tham_hau` | Phúc Duyên Thâm Hậu | Đi đường hay nhặt được của, ngồi quán hay gặp người tốt. | `stat.luck +10` · `lootPct +0.15` |

### Địa phẩm (7)

| id | Tên | Mô tả trong game | Hiệu ứng (móc K.6) |
|---|---|---|---|
| `nghich_canh_dot_pha` | Nghịch Cảnh Đột Phá | Càng bị dồn vào đường cùng, càng dễ vượt qua. | `breakthroughChance.major +12` · `bottleneckResist +0.3` |
| `nguyen_than_kien_co` | Nguyên Thần Kiên Cố | Thần hồn vững như bàn thạch, ảo thuật vô dụng. | `divineSense +0.4` · `charmResist +0.3` · `heartDemonResist +0.15` |
| `sinh_co_bat_tuyet` | Sinh Cơ Bất Tuyệt | Sinh cơ dồi dào, già chậm hơn người. | `lifespanPct +0.2` · `agingSlow` |
| `ngu_hanh_tuong_sinh` | Ngũ Hành Tương Sinh | Các hệ trong người không khắc mà sinh nhau. | `element.root.power +0.25` · `cultivationSpeed +0.1` |
| `viet_cap_chi_chien` | Việt Cấp Chi Chiến | Đánh với kẻ mạnh hơn mới thấy mình sống. | `combatPower.vsHigherRealm +0.35` · `escapeChance +0.15` |
| `van_thu_than_hoa` | Vạn Thú Thân Hòa | Thú dữ gặp ngươi thì cúi đầu, linh thú gặp ngươi thì vẫy đuôi. | `craft.beast.affinity +25` · `craft.beast.success +0.2` · `eventWeight.beast ×1.5` |
| `danh_vong_tu_lai` | Danh Vọng Tự Lai | Chưa làm gì to tát, thiên hạ đã truyền tai tên ngươi. | `faction.chinh.reputation +20` · `npcAffinityStart +10` · `incomePct +0.15` |

### Thiên phẩm (3)

| id | Tên | Mô tả trong game | Hiệu ứng (móc K.6) |
|---|---|---|---|
| `thien_dao_thu_can` | Thiên Đạo Thù Cần | Trời thương kẻ chăm. Mỗi năm tu luyện đều được thêm một chút. | `cultivationSpeed +0.4` · `breakthroughChance +5` |
| `bat_tu_bat_diet` | Bất Tử Bất Diệt | Một lần đáng chết mà không chết. | `trigger.cheatDeath +1` · `injuryReduce +0.2` |
| `nghich_menh_chi_nhan` | Nghịch Mệnh Chi Nhân | Mệnh trời đã định, ngươi không chịu. Cái giá là trời cũng không buông tha. | `breakthroughChance.major +20` · `combatPower +0.2` · `tribulationPct +30` (thiên kiếp nặng hơn) · `eventWeight.misfortune ×1.3` |

---

## C. Cần chủ dự án chốt
1. **Tên và hiệu ứng** 18 thiên phú: giữ hay sửa? (Tên tự đặt từ từ Hán Việt thông dụng, không lấy từ tác phẩm nào.)
2. **Tỉ lệ phẩm** 60/32/8 và khí vận nhích tỉ lệ: ổn không?
3. **Quay lại:** cho dùng lượt "Nghịch thiên cải mệnh" còn dư lúc sinh để quay lại 3 ô này? Đề xuất: **không**, mỗi lần chỉ một bộ 3 ô (Developer mode thì quay thoải mái).
4. **Nếu người chơi đóng màn chọn:** đề xuất **không cho đóng**, bắt chọn xong mới chơi tiếp.
5. Một số móc (`agingSlow`, `trigger.cheatDeath`, `escapeChance`, `lootPct`…) đã có trong K.6 nhưng hệ thống dùng chúng làm ở GĐ 3–4; chọn thiên phú đó thì tác dụng tới khi hệ thống ấy có. Thẻ thiên phú sẽ ghi "(có tác dụng từ GĐ sau)" cho rõ. Ổn không?
