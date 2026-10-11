# Task 2.8: ~25 sự kiện tu luyện & tông môn — NHÁP chờ duyệt

File đích: `content/worlds/thuong_lan/events/cultivation.json` (và `sect.json` cho nhóm B).
Quy ước: **TV** = tu vi (% thanh tầng hiện tại), **LT** = linh thạch, **ĐT** = Đạo tâm, **NT** = Ngộ tính, **CC** = Căn cốt, **KV** = Khí vận, **SK** = Sức khỏe, **HP** = Hạnh phúc, **NQ** = Nhân quả. "%" trong lựa chọn = kiểm tra chỉ số.

**Cần thêm cho engine (việc code nhỏ trong task 2.8):**
- Hiệu ứng `cultProgress` (cộng/trừ % thanh tu vi, kẹp 0–100).
- Điều kiện `hasRoot` (đã có linh căn tu được) cho sự kiện; nhóm B cần flag `in_sect` do task 2.5 đặt, nên nhóm B chỉ bật sau khi 2.5 xong.
- Mọi sự kiện có `conditions.realm.min: "luyen_khi"` nên phàm nhân không gặp.

---

## A. Tu luyện (15) — `cultivation.json`

| # | id | Tiêu đề | Khi nào | Mở đầu | Lựa chọn → kết quả |
|---|---|---|---|---|---|
| 1 | `dem_trang_tu_luyen` | Đêm trăng tròn | Luyện Khí+ | Trăng rằm, linh khí trời đất dày hơn mọi đêm. | **Ngồi thiền tới sáng** → TV +15, SK −2 · **Ngủ cho khỏe** → HP +3 |
| 2 | `linh_khi_nghich_luu` | Linh khí chạy ngược | Luyện Khí+ | Đang vận công, linh khí bỗng chạy ngược một vòng. | **Cố ép xuống** (ĐT 50%) → thành: TV +10, ĐT +2 / bại: SK −10, TV −10 · **Dừng ngay** → TV −5 |
| 3 | `ngo_dao_duoi_mua` | Ngộ đạo dưới mưa | Luyện Khí+, NT ≥ 40 | Mưa rơi trên lá chuối, từng giọt như có nhịp. | **Ngồi nghe mưa** (NT 60%) → thành: NT +2, TV +20 / bại: HP +2 (chỉ thấy ướt) · **Vào nhà trú** → SK +2 |
| 4 | `nhat_duoc_tan_quyen` | Tàn quyển bên đường | Luyện Khí+ | Một trang bí tịch rách kẹt dưới gốc cây. | **Đọc thử** (NT 55%) → thành: TV +15 / bại: SK −5, "tẩu khí nhẹ" · **Đem bán** → bạc +30 |
| 5 | `tan_tu_rao_ban_dan` | Tán tu bán đan | Luyện Khí+ | Một tán tu mặt mũi bặm trợn chìa ra viên đan đen sì: "Hai linh thạch, tu vi tăng vọt." | **Mua** (cần 2 LT; KV 45%) → thành: TV +25 / bại: SK −15 ("đan giả trộn phân dê") · **Mặc cả** (Mị lực 50%) → thành: −1 LT, TV +25 / bại: bị chửi, HP −2 · **Bỏ đi** → ĐT +1 |
| 6 | `bi_canh_nho` | Hang đá có linh tuyền | Luyện Khí 3+ | Đi hái thuốc lạc vào hang đá, giữa hang có vũng nước tỏa hơi lạnh. | **Ngâm mình** (CC 50%) → thành: CC +3, TV +20 / bại: SK −10 (lạnh thấu xương) · **Múc một bầu đem về** → LT +2 · **Đánh dấu rồi rời đi** → flag `biet_linh_tuyen` (chuỗi sau) |
| 7 | `tam_ma_lan_dau` | Tâm ma lần đầu | Luyện Khí 5+ | Nhắm mắt lại thấy chính mình đang cười nhạo mình. | **Đối diện** (ĐT 55%) → thành: ĐT +5 / bại: ĐT −5, HP −5 · **Mở mắt, đi rửa mặt** → TV −5 |
| 8 | `luyen_khi_chieu_dem` | Luyện công quá sức | Luyện Khí+ | Ngươi đã ngồi ba ngày ba đêm. | **Ngồi tiếp** (CC 50%) → thành: TV +20 / bại: SK −15 · **Nghỉ một hôm** → SK +5, HP +3 |
| 9 | `yeu_thu_cap_thap` | Yêu thú cản đường | Luyện Khí+ (bạo lực) | Một con lang yêu mắt đỏ chặn ngang đường núi. | **Đánh** (CC 50%) → thành: LT +3, TV +5 / bại: SK −20 · **Chạy** (KV 60%) → thành: không sao / bại: SK −10 · **Ném lương khô** → bạc −5, an toàn |
| 10 | `dong_dao_luan_dao` | Luận đạo bên suối | Luyện Khí 2+ | Một đạo hữu xa lạ ngồi bên suối, rủ ngươi bàn chuyện tu hành. | **Ngồi luận** (NT 50%) → thành: NT +2, TV +10 / bại: HP −2 (thua lý) · **Khoe khoang** → Mị lực −2, HP +3 |
| 11 | `ao_gam_ve_lang` | Áo gấm về làng | Luyện Khí 3+, không `no_parents` | Lâu lắm mới về quê. Cả làng ra đầu đình nhìn. | **Biểu diễn một chiêu** → HP +5, Mị lực +3 · **Lặng lẽ thăm nhà** → ĐT +3, HP +5 |
| 12 | `linh_dien_hoang` | Linh điền bỏ hoang | Luyện Khí+ | Ruộng linh thảo của ai đó bỏ hoang, cỏ mọc ngang lưng. | **Dọn lại trồng** → Linh Thực luyện thêm (cấp +3), bạc −5 · **Nhổ mấy cây còn sống** → LT +1, NQ −1 |
| 13 | `dao_si_xem_tuong` | Đạo sĩ xem tướng | Luyện Khí+ (hài) | Lão đạo sĩ nhìn ngươi chằm chằm: "Tướng này… hoặc đại phú, hoặc đại họa." | **Trả tiền nghe tiếp** → bạc −10, KV +2 · **Hỏi lão đã xem cho bao nhiêu người** → HP +3 ("ai lão cũng nói vậy") |
| 14 | `binh_canh_tuyet_vong` | Bình cảnh dày đặc | Đang ở đỉnh cảnh giới, thất bại ≥ 1 | Ngồi trước bình chướng mà như ngồi trước vách núi. | **Xuống núi đi một vòng** → HP +5, giảm 1 lần thất bại trước · **Cắn răng ngồi tiếp** (ĐT 60%) → thành: tỉ lệ đột phá lần sau +5 / bại: SK −5 |
| 15 | `thien_dia_dong_tam` | Thiên địa đồng tâm | Luyện Khí 7+, hiếm, KV ảnh hưởng | Một đêm, linh khí trong vòng mười dặm cùng đổ về phía ngươi. | **Thuận theo** → TV +40, KV +2 · **Chia cho đạo hữu bên cạnh** → TV +20, NQ +5 |

## B. Tông môn (10) — `sect.json` (bật sau task 2.5, cần flag `in_sect`)

| # | id | Tiêu đề | Khi nào | Mở đầu | Lựa chọn → kết quả |
|---|---|---|---|---|---|
| 16 | `phat_bong_loc` | Ngày phát bổng lộc | trong tông môn | Quản sự phát linh thạch, đếm thiếu một viên. | **Đòi lại** (Mị lực 50%) → thành: LT +1 / bại: quản sự ghét, HP −3 · **Thôi kệ** → ĐT +1 |
| 17 | `nhiem_vu_hai_thuoc` | Nhiệm vụ hái thuốc | ngoại môn | Tông môn giao đi hái mười gốc Ngưng Huyết Thảo. | **Đi cẩn thận** → LT +2 · **Đi đường tắt qua khe núi** (KV 50%) → thành: LT +4 / bại: SK −10 |
| 18 | `su_huynh_bat_nat` | Sư huynh bắt nạt | ngoại môn | Một sư huynh bắt ngươi giặt đồ cho hắn cả tháng. | **Nhịn** → HP −5, ĐT +2 · **Thách đấu** (CC 45%) → thành: Mị lực +5, HP +5 / bại: SK −10 · **Mách trưởng lão** → HP +2, flag `bi_su_huynh_ghet` |
| 19 | `tang_kinh_cac` | Tàng Kinh Các | trong tông môn | Được vào Tàng Kinh Các một canh giờ. | **Đọc công pháp** → TV +10 · **Đọc tạp thư** → Trí tuệ +3, NT +1 · **Ngủ gật** → HP +3 (hài) |
| 20 | `dai_bi_ngoai_mon` | Đại bỉ ngoại môn | ngoại môn, Luyện Khí 4+ | Đại bỉ mỗi ba năm, ai lọt top mười được lên nội môn. | **Dốc toàn lực** (CC 55%) → thành: flag `top_dai_bi` (2.5 dùng để lên nội môn), LT +5 / bại: SK −10 · **Giữ sức** → không sao |
| 21 | `su_phu_chi_diem` | Sư phụ chỉ điểm | có sư phụ | Sư phụ gọi vào, gõ đầu ngươi ba cái rồi bỏ đi. | **Canh ba tới tìm** (NT 55%) → thành: NT +3, TV +15 / bại: bị mắng ngu, HP −3 · **Không hiểu, đi ngủ** → HP +2 |
| 22 | `dong_mon_muon_lt` | Đồng môn vay linh thạch | trong tông môn | Đồng môn cùng phòng xin vay ba viên linh thạch "để mua đan cứu mạng". | **Cho vay** (cần 3 LT; KV 50%) → thành: sau 2–3 năm trả 5 LT (followUp) / bại: mất luôn, NQ +2 · **Từ chối** → không sao |
| 23 | `canh_gac_son_mon` | Gác sơn môn ban đêm | ngoại môn | Đêm gác cổng, có bóng người lén lút ngoài sơn môn. | **Hô hoán** → danh vọng chính +5 · **Lén theo dõi** (KV 50%) → thành: LT +3 / bại: SK −10 · **Giả vờ ngủ** → NQ −2 |
| 24 | `ma_tu_du_do` | Ma tu dụ dỗ | trong tông môn chính đạo, Luyện Khí 3+ | Một kẻ áo đen hứa cho ngươi bí pháp tu nhanh gấp đôi. | **Nghe thử** → flag `ma_tu_du_do` (chuỗi 3.9) · **Báo trưởng lão** → danh vọng chính +10, LT +3 · **Đuổi đi** → ĐT +3 |
| 25 | `tong_mon_le_hoi` | Lễ tế tổ sư | trong tông môn (hài) | Lễ tế tổ sư, đệ tử phải quỳ ba canh giờ. | **Quỳ nghiêm chỉnh** → ĐT +3, SK −2 · **Lén ăn bánh cúng** (KV 55%) → thành: HP +5 / bại: phạt quét sân, HP −5 |

---

## C. Cần chủ dự án chốt
1. Duyệt nội dung 25 sự kiện (sửa chữ, đổi hiệu ứng, bỏ/thêm sự kiện).
2. Đồng ý thêm hiệu ứng `cultProgress` và điều kiện `hasRoot` cho sự kiện.
3. Nhóm B (tông môn) chờ task 2.5. Có muốn làm nhóm A trước, nhóm B sau không? Đề xuất: **có**.
4. Sự kiện #12 cộng cấp bách nghệ cần thêm hiệu ứng `craft.<nghệ>` trong sự kiện; nếu không muốn thêm thì đổi thành "Linh Thực: lần luyện tới +2".
