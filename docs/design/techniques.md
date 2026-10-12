# Công pháp khởi đầu (task 2.4) — ĐÃ DUYỆT 2026-10-11 (kể cả giới hạn cảnh giới theo phẩm và phí đổi công pháp)

Công pháp chính quyết định **đạo thống, hệ và tốc độ tu** (K.3, G.1). Gồm 3 nhóm: **8 bộ của tông môn** (theo 6 tông ★, cộng một bộ tán tu mua ở chợ), **4 bộ tán tu vô tình nhặt được** (C9–C12), và **4 bộ cực phẩm nền tảng** chỉ có qua kỳ ngộ lớn (C13–C16). Hiệu ứng chỉ dùng móc K.6.

Nhắc lại hệ số đã chốt: Hoàng ×1.0 · Huyền ×1.2 · không hợp linh căn ×0.7 · Ma đạo ×1.4 · Phật đạo ×0.8.

**Đề xuất mới:**
- **Giới hạn cảnh giới theo phẩm**: Hoàng phẩm tu tới Trúc Cơ viên mãn, Huyền tới Kim Đan viên mãn, Địa tới Nguyên Anh, Thiên không giới hạn. Muốn đi xa phải tìm công pháp tốt hơn, tạo động lực leo cấp bậc tông môn hay đi tìm kỳ ngộ.
- **Đổi công pháp**: mất 20% tiến độ tầng hiện tại (tán công trùng tu).


---

| # | id | Tên | Phẩm | Tông | Đạo thống | Hệ | Điều kiện học |
|---|---|---|---|---|---|---|---|
| C1 | `bich_lac_dan_khi_quyet` | Bích Lạc Dẫn Khí Quyết | Hoàng | Bích Lạc Tông | Tiên | Theo linh căn chính | Đệ tử ngoại môn |
| C2 | `ngu_hanh_luan_chuyen_kinh` | Ngũ Hành Luân Chuyển Kinh | Huyền | Bích Lạc Tông | Tiên | Ngũ hành | Chân truyền; linh căn từ 3 hệ trở lên |
| C3 | `tang_phong_kiem_kinh` | Tàng Phong Kiếm Kinh | Huyền | Tàng Phong Kiếm Các | Tiên | Kim | Qua Kiếm Tâm quan (Đạo tâm ≥ 50) |
| C4 | `thanh_moc_truong_sinh_cong` | Thanh Mộc Trường Sinh Công | Hoàng | Bách Thảo Cốc | Tiên | Mộc | Đệ tử ngoại môn |
| C5 | `vo_uu_thien_tam_phap` | Vô Ưu Thiền Tâm Pháp | Hoàng | Vô Ưu Tự | Phật | Thổ | Quy y; **không cần linh căn** (cửa Phật duyên) |
| C6 | `u_ha_huyet_anh_cong` | U Hà Huyết Ảnh Công | Huyền | U Hà Ma Tông | Ma | Ám, Thủy | Đệ tử chính thức |
| C7 | `van_thu_thong_linh_thuat` | Vạn Thú Thông Linh Thuật | Hoàng | Vạn Yêu Điện | Tiên | Mộc, Phong | Khách khanh Ngự Thú |
| C8 | `tho_nap_tan_quyen` | Thổ Nạp Tàn Quyển | Hoàng | Tán tu (mua ở Vô Chủ Phường) | Tiên | Vô thuộc tính | Có bạc là mua được |

---

### C1. Bích Lạc Dẫn Khí Quyết
> Công pháp nhập môn ai cũng học. Không nhanh, không chậm, không bao giờ sai. Đệ tử Bích Lạc gọi nó là "bát cơm trắng".
- Hệ tự khớp với linh căn chính (không bao giờ bị phạt ×0.7).
- `breakthroughChance +5` (chỉ trong Luyện Khí).

### C2. Ngũ Hành Luân Chuyển Kinh
> Bí truyền của Bích Lạc, viết cho kẻ tạp linh căn: năm hệ không đấu nhau mà xoay vòng nuôi nhau.
- Coi như hợp với mọi hệ trong linh căn.
- `cultivationSpeed +0.15` nếu linh căn có từ 3 hệ trở lên · `element.<mọi hệ>.power +0.1`.
- Lối thoát cho người Tam/Tứ/Ngũ linh căn, và người đi đường võ đạo lên Ngũ khí triều nguyên.

### C3. Tàng Phong Kiếm Kinh
> Kiếm giấu trong vỏ trăm năm, ra khỏi vỏ một lần. Trang đầu chỉ có một chữ: "Nhẫn".
- `path.sword.affinity +15` · `path.sword.power +0.15`.
- Đạo tâm dưới 50 thì tu vi ×0.8 (kiếm ý không thuần).

### C4. Thanh Mộc Trường Sinh Công
> Tu như cây mọc: chậm, nhưng sống lâu. Đệ tử Bách Thảo Cốc thường già hơn tuổi thật về tính nết, trẻ hơn tuổi thật về dung mạo.
- `cultivationSpeed −0.1` · `lifespanPct +0.1` · `craft.alchemy.affinity +10` · `craft.herbalism.affinity +10`.

### C5. Vô Ưu Thiền Tâm Pháp
> Ngồi thiền đếm hơi thở. Đếm tới một vạn mà lòng không động, linh khí tự tới.
- **Không cần linh căn**: hệ số tu theo Đạo tâm (tối đa 0.7), đã chốt ở cửa Phật duyên.
- `heartDemonResist +0.2` · `path.body.affinity +10`.
- **Giới luật**: giết người thì Đạo tâm −10; phá giới nhiều lần thì bị trục xuất.

### C6. U Hà Huyết Ảnh Công
> Lấy huyết khí kẻ thù bồi cho mình. Tu nhanh như nước lũ, và cũng đục như nước lũ.
- Ma đạo: tu vi ×1.4 · `lifesteal +0.1`.
- `heartDemonResist −0.2` · mỗi lần giết người lấy huyết khí: nhân quả −5.
- Tag `dark`; mô tả không ghê rợn (mục H).

### C7. Vạn Thú Thông Linh Thuật
> Học nghe tiếng thú trước, học nói tiếng người sau. Đệ tử học xong hay quên cách chào hỏi đồng loại.
- `craft.beast.affinity +20` · `craft.beast.success +0.15` · `faction.yeu.reputation +10`.

### C8. Thổ Nạp Tàn Quyển
> Bìa ghi "Thượng cổ thần công". Trang cuối ghi "Giá: ba lạng".
- Vô thuộc tính: không bị phạt ×0.7, nhưng `cultivationSpeed −0.1`.
- **Tàn quyển**: chỉ tu tới **Luyện Khí viên mãn**. Mở chuỗi sự kiện tìm nửa sau (`unlockChain.tim_tan_quyen`), tìm đủ thì nâng thành Huyền phẩm.
- Đường vào tiên lộ của tán tu không tông môn.

---

## Nhóm 2. Công pháp tán tu vô tình nhặt được

Không cần tông môn. Gặp qua sự kiện khám phá (động phủ cổ, xác tán tu, vách đá, giấc mơ…). Mỗi bộ chỉ nhặt được một lần mỗi đời, có lựa chọn "bán đi" hoặc "học".

| # | id | Tên | Phẩm | Đạo thống | Hệ | Gặp ở đâu |
|---|---|---|---|---|---|---|
| C9 | `hoa_van_quyet` | Hỏa Vân Quyết | Hoàng | Tiên | Hỏa | Động phủ cổ trong núi (nối sự kiện *Động phủ trong núi*) |
| C10 | `thuy_nguyet_quan_tuong_phap` | Thủy Nguyệt Quan Tưởng Pháp | Huyền | Tiên | Thủy, Băng | Túi trữ vật trên xác một tán tu dưới đáy hồ |
| C11 | `thach_phu_luyen_the_thien` | Thạch Phu Luyện Thể Thiên | Hoàng | Tiên | Thổ | Chữ khắc trên vách đá, rêu phủ kín |
| C12 | `mong_trung_tan_kinh` | Mộng Trung Tàn Kinh | Huyền | Tiên | Vô thuộc tính | Giấc mơ, sau khi đọc sách của ông lão năm xưa (flag `nghe_noi_tu_tien`) |

### C9. Hỏa Vân Quyết
> Chủ động phủ chết đã trăm năm, lò luyện đan vẫn còn ấm. Quyển sách bên lò cháy sém một góc, phần còn lại vẫn đọc được.
- `element.hoa.power +0.1` · `craft.forging.affinity +10` · `craft.alchemy.affinity +5`.

### C10. Thủy Nguyệt Quan Tưởng Pháp
> Người tu nó ngắm trăng dưới nước, ngắm lâu tới mức quên đường lên bờ. Ngươi nhặt được túi của người đó.
- `divineSense +0.15` · nhìn thấu ảo trận cấp thấp.
- Đạo tâm dưới 40: mỗi năm có tỉ lệ nhỏ "mê trong ảo cảnh" (mất một năm).

### C11. Thạch Phu Luyện Thể Thiên
> Ai đó khắc cả bộ công pháp lên vách núi bằng tay không. Chữ cuối cùng khắc lệch, chắc lúc đó tay đã gãy.
- `path.body.affinity +15` · `injuryReduce +0.1`.
- Võ giả Tuyệt đỉnh trở lên **đọc hiểu được** dù chưa có linh căn: tăng tốc đột phá thang võ đạo.

### C12. Mộng Trung Tàn Kinh
> Đêm nào cũng mơ thấy một lão già giảng kinh. Sáng ra chỉ nhớ được một nửa, nhưng nửa đó đủ dùng.
- `stat.comprehension +5` · `bottleneckResist +0.1`.
- Tàn kinh: tu tới Kim Đan viên mãn.

---

## Nhóm 3. Cực phẩm nền tảng (chỉ qua kỳ ngộ lớn)

Công pháp nền tảng của tông môn thượng cổ đã diệt vong hoặc của đại năng. **Không giới hạn cảnh giới** (hoặc rất cao), mạnh vượt trội, nhưng **"hoài bích kỳ tội"**: có sự kiện *lộ bí mật*, bị kẻ mạnh truy đoạt, giống cái giá của Kim Thủ Chỉ.

| # | id | Tên | Phẩm | Đạo thống × Con đường | Hệ | Kỳ ngộ |
|---|---|---|---|---|---|---|
| C13 | `thai_so_dien_dao_kinh` | Thái Sơ Diễn Đạo Kinh | Thiên | Tiên × mọi đường | Hợp mọi hệ | Di tích thượng cổ trong bí cảnh; khí vận ≥ 75 |
| C14 | `cuu_chuyen_kim_cot_quyet` | Cửu Chuyển Kim Cốt Quyết | Địa | Tiên × Thể | Kim, Thổ | Tàn hồn trong vật cũ (cửa 2.5), hoặc võ giả Hóa cảnh gặp cao nhân |
| C15 | `nhat_tuyen_thien_kiem_dien` | Nhất Tuyến Thiên Kiếm Điển | Địa | Tiên × Kiếm | Kim | Kiếm trủng (mộ kiếm) sâu trong Lan Sơn; tư chất Kiếm ≥ 40 |
| C16 | `bat_tu_u_minh_luc` | Bất Tử U Minh Lục | Địa | Quỷ | Ám | Sau khi thành quỷ tu (cửa 2.6), gặp trong Âm Sơn |

### C13. Thái Sơ Diễn Đạo Kinh
> Trang đầu trống trơn. Người đọc ngộ ra tới đâu, chữ hiện tới đó. Ngươi là người thứ hai trong mười vạn năm thấy được chữ.
- Thiên phẩm ×2.0; khớp mọi hệ; không giới hạn cảnh giới.
- `breakthroughChance.major +10` · `heartDemonResist +0.1`.
- Kỳ ngộ hiếm nhất trong số công pháp; cả Thương Lan giới chỉ có một bản.

### C14. Cửu Chuyển Kim Cốt Quyết
> Mỗi lần chuyển là một lần xương cốt vỡ ra rồi liền lại. Chín lần như vậy, thân thể thành pháp bảo.
- `path.body.power +0.3` · `injuryReduce +0.2` · `lifespanPct +0.1`.
- Mỗi đại cảnh giới là một "chuyển": Căn cốt +5.
- Hợp nhất với người lên tiên lộ từ võ đạo (Ngũ khí triều nguyên).

### C15. Nhất Tuyến Thiên Kiếm Điển
> Một đường kiếm chia trời làm hai. Người viết kiếm điển này chết trong kiếm trủng, tay vẫn cầm kiếm.
- `path.sword.power +0.35` · `combatPower.vsHigherRealm +0.2`.
- Thương tích nhận vào +10% (đã là kiếm tu thì không biết thủ).

### C16. Bất Tử U Minh Lục
> Sách viết cho người chết đọc. Người sống mở ra chỉ thấy giấy trắng.
- Chỉ quỷ tu học được. `lifespanPct +0.5` · `divineSense +0.3`.
- Ánh mặt trời gây hại giảm một nửa.
- Chính đạo phát hiện thì truy diệt: `faction.chinh.reputation −30`.

---

## Ghi chú cho thread làm repo
- File: `content/worlds/thuong_lan/techniques.json`. Trường: `id`, `name`, `grade` (`hoang|huyen|dia|thien`), `sect`, `lineage` (`tien|ma|phat|quy|yeu`), `elements` (mảng hoặc `"root"`/`"any"`/`"none"`), `requires`, `maxRealm`, `effects` (móc K.6), `flavor`.
- Giới hạn cảnh giới theo phẩm đặt trong `balance.json`.
- Kỳ ngộ của C9–C16 là sự kiện ✍️ sẽ soạn ở task 2.8 / GĐ3; cần sự kiện *lộ bí mật* chung cho công pháp cực phẩm.
- Móc mới: điều kiện hiệu ứng theo số hệ linh căn (C2) và theo Đạo tâm (C3); `rootless: true` cho C5.
