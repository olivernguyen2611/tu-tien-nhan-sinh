# Tiên Thiên Khí Vận đợt 2 (task 3.10): ĐÃ DUYỆT 2026-10-12


Thêm **20 khí vận** (21–40), nâng tổng lên **40**. Giữ đúng tỉ lệ bản 1: Phàm 5 · Lương 4 · Ưu 4 · Tuyệt 2 · Thiên 1 · Thần 1 · Ác vận 3.

Mục tiêu đợt này là phủ những trục bản 1 còn bỏ trống:
- **Con đường:** Pháp, Binh, Thuật (bản 1 mới có Kiếm và Thể).
- **Bách nghệ:** Khí, Trận, Phù, Linh thực, Ngự thú (bản 1 mới có Đan).
- **Hệ:** Hỏa, Lôi, toàn hệ.
- **Khác:** tâm ma, thiên kiếp, phe phái, buôn bán, yêu thú, ma đạo.

Mọi hiệu ứng chỉ dùng bộ móc K.6 có sẵn, không thêm móc mới.

---

## Phàm (trắng) · 45%

**21. Mắt Tinh** `mat_tinh`
> Hàng giả liếc qua là biết. Người giả thì... liếc mãi chưa ra.
- Trí tuệ +3; mua bán rẻ hơn 5%; sự kiện phường thị xuất hiện nhiều hơn.
- `stat.intellect +3` · `priceDiscount +0.05` · `eventWeight.market ×1.3`

**22. Ngủ Ngon** `ngu_ngon`
> Trời sập cũng ngủ được. Tỉnh dậy câu đầu tiên là hỏi trời sập xong chưa.
- Hạnh phúc +5; kháng tâm ma +10%.
- `stat.happiness +5` · `heartDemonResist +0.1`

**23. Khéo Tay** `kheo_tay`
> Cái gì hỏng qua tay ngươi cũng lành, trừ trái tim cô hàng xóm.
- Tư chất Luyện khí +10; thu nhập +5%.
- `craft.forging.affinity +10` · `incomePct +0.05`

**24. Tay Xanh** `tay_xanh`
> Cắm chiếc đũa xuống đất, ba hôm sau đũa nảy lá.
- Tư chất Linh thực +15; Sức khỏe +3; hay gặp linh thảo.
- `craft.farming.affinity +15` · `stat.health +3` · `eventWeight.herb ×1.2`

**25. Thú Duyên** `thu_duyen`
> Chó nhà ai cũng theo ngươi về. Chủ chó thì không.
- Tư chất Ngự thú +15; Mị lực +2.
- `craft.beast.affinity +15` · `stat.charm +2`

## Lương (xanh lục) · 28%

**26. Bút Tẩu Long Xà** `but_tau_long_xa`
> Chữ viết ra như rồng bay rắn lượn. Thầy đồ khen đẹp, chỉ tiếc không ai đọc được.
- Tư chất Phù +15; vẽ phù thành công +10%; Trí tuệ +3.
- `craft.talisman.affinity +15` · `craft.talisman.success +0.1` · `stat.intellect +3`

**27. Trận Nhãn** `tran_nhan`
> Nhìn bàn cờ thấy ba nước, nhìn ruộng thấy chín cung, nhìn bát cơm cũng thấy trận.
- Tư chất Trận +15; bày trận thành công +10%; thần thức +10%.
- `craft.formation.affinity +15` · `craft.formation.success +0.1` · `divineSense +0.1`

**28. Hiệp Cốt** `hiep_cot`
> Thấy chuyện bất bình là không tha. Thấy chuyện bình thường... cũng hay nhảy vào.
- Đạo tâm +5; danh vọng Giang hồ +10; hay gặp chuyện bất bình.
- `stat.daoHeart +5` · `faction.giang_ho.reputation +10` · `eventWeight.justice ×2`

**29. Phúc Tinh** `phuc_tinh`
> Ngươi ở đâu, gà ở đó đẻ trứng hai lòng đỏ.
- Khí vận +8; tai nạn vặt ít hơn.
- `stat.luck +8` · `eventWeight.mishap ×0.7`

## Ưu (xanh lam) · 15%

**30. Pháp Tướng Thiên Thành** `phap_tuong_thien_thanh`
> Lúc nhỏ ngươi bóp tay một cái, đèn dầu cả nhà tắt theo.
- Tư chất con đường Pháp +20; uy lực Pháp +20%.
- `path.spell.affinity +20` · `path.spell.power +0.2`

**31. Binh Hồn** `binh_hon`
> Cầm cái chổi cũng tỏa sát khí. Mẹ ngươi không dám nhờ ngươi quét nhà nữa.
- Tư chất con đường Binh +20; uy lực Binh +15%; tư chất Luyện khí +10.
- `path.weapon.affinity +20` · `path.weapon.power +0.15` · `craft.forging.affinity +10`

**32. Huyễn Tâm** `huyen_tam`
> Ngươi nói dối giỏi đến mức chính ngươi cũng tin.
- Tư chất con đường Thuật +20; uy lực Thuật +15%; kháng mị thuật +20%.
- `path.arts.affinity +20` · `path.arts.power +0.15` · `charmResist +0.2`

**33. Thanh Tâm Như Thủy** `thanh_tam_nhu_thuy`
> Người khác gặp tâm ma thì đánh nhau với nó. Ngươi thì mời nó uống trà.
- Đạo tâm +5; kháng tâm ma +25%; bình cảnh dễ vượt hơn 10%.
- `stat.daoHeart +5` · `heartDemonResist +0.25` · `bottleneckResist +0.1`

## Tuyệt (tím) · 8%

**34. Cổ Huyết** `co_huyet`
> Trong huyết quản có tiếng gầm của một thứ gì đó rất già, rất to, và rất đói.
- Căn cốt +10; thọ nguyên +10%; uy lực con đường Thể +20%; hút máu 10%.
- `stat.physique +10` · `lifespanPct +0.1` · `path.body.power +0.2` · `lifesteal +0.1`

**35. Độ Kiếp Thể** `do_kiep_the`
> Sét đánh trúng ngươi, chính sét cũng thấy ngại.
- Uy lực khi chống thiên kiếp +30%; uy lực hệ Lôi +20%; đột phá đại cảnh giới +5%.
- `tribulationPower +0.3` · `element.loi.power +0.2` · `breakthroughChance.major +0.05`

## Thiên (vàng) · 3.5%

**36. Đại Khí Vãn Thành** `dai_khi_van_thanh`
> Ba mươi tuổi, người ta Trúc Cơ, ngươi còn ngồi đếm linh khí. Ba trăm tuổi, người ta nằm dưới mộ, ngươi vẫn còn ngồi đếm. Chỉ có điều, giờ đếm bằng núi.
- Trước Trúc Cơ tu luyện chậm hơn 20%. Đổi lại: đột phá đại cảnh giới +15%, bình cảnh dễ vượt hơn 30%, thọ nguyên +20%.
- `cultivationSpeed −0.2 (activeUntil: truc_co)` · `breakthroughChance.major +0.15` · `bottleneckResist +0.3` · `lifespanPct +0.2`

## Thần (đỏ) · 0.5%

**37. Tiên Thiên Đạo Thai** `tien_thien_dao_thai`
> Lúc ngươi chào đời, linh khí trăm dặm lặng đi một nhịp, như cúi đầu.
- Uy lực mọi hệ +30%; không bị hệ khắc; tu luyện +20%; Ngộ tính +10.
- `element.all.power +0.3` · `ignoreElementWeakness` · `cultivationSpeed +0.2` · `stat.comprehension +10`

## Ác vận (xám) · 12% mỗi ô

**38. Ma Tâm Chủng** `ma_tam_chung`
> Trong lòng có một hạt giống đen, tưới bằng giận dữ, lớn rất nhanh.
- Kháng tâm ma −20%; ma đạo cám dỗ gặp gấp đôi. Đổi lại: nếu tu Ma đạo thì nhanh hơn 30%.
- `heartDemonResist −0.2` · `eventWeight.demonic ×2` · `lineage.ma.cultivationSpeed +0.3`

**39. Tán Tài Đồng Tử** `tan_tai_dong_tu`
> Tiền vào túi ngươi như nước vào rổ. Nhưng rổ đi đâu cũng có người đổ nước vào.
- Thu nhập −20%. Đổi lại: chiến lợi phẩm +30%, Khí vận +5, kỳ ngộ gặp nhiều hơn.
- `incomePct −0.2` · `lootPct +0.3` · `stat.luck +5` · `eventWeight.fortune ×1.3`

**40. Chiêu Yêu Thể** `chieu_yeu_the`
> Yêu thú ngửi thấy ngươi như người ngửi thấy thịt nướng.
- Gặp yêu thú gấp đôi. Đổi lại: tư chất Ngự thú +20 và tư chất con đường Thể +5.
- `eventWeight.beast ×2` · `craft.beast.affinity +20` · `path.body.affinity +5`

---

## Tag sự kiện (phần "thêm tag cho sự kiện dùng" của 3.10)

Mọi `eventWeight.<tag>` ở trên đều dùng tag đã có trong 110 sự kiện hiện tại: market 9, herb 3, justice 1, mishap 4, beast 7, demonic 8, fortune 10.

**Tag `justice` mới có 1 sự kiện**, nên Hiệp Cốt gần như không có tác dụng. Mình đề xuất gắn thêm `justice` vào các sự kiện đã duyệt sau (chỉ thêm tag, không đổi văn bản):
- `an_oan_o_huyen`
- `huong_hoa_hoi_bao_quan`
- `dai_hoi_vo_lam`
- các sự kiện "giết người đoạt bảo" có lựa chọn cứu người trong `plunder.json`

**Lựa chọn ẩn cho khí vận mới** (giống Khéo Mồm, Linh Tỵ ở bản 1):
- Mắt Tinh: mở lựa chọn "nhận ra hàng giả hoặc kẻ lừa" ở sự kiện phường thị, và ở sự kiện ma tu (task 3.13).
- Hiệp Cốt: mở lựa chọn "ra tay" ở `an_oan_o_huyen`.
- Thú Duyên, Chiêu Yêu Thể: mở lựa chọn "thuần phục" ở 1–2 sự kiện yêu thú.

Phần lựa chọn ẩn này sẽ thêm vào sự kiện đã duyệt, nên bạn duyệt riêng: "ok tag", "ok lựa chọn ẩn", hoặc bỏ.

## Bổ sung kỹ thuật (ghi để duyệt, không đổi nội dung)

- Một số móc đã có trong bộ K.6 nhưng engine chưa dùng tới: `heartDemonResist`, `divineSense`, `charmResist`, `tribulationPower`, `priceDiscount`.
  - Khí vận bản 1 cũng đang dùng các móc này.
  - Khi nhập đợt 2, mình nối các móc nào đã có hệ thống tương ứng: chiết khấu phường thị và kháng tâm ma. Các móc còn lại sẽ có tác dụng khi hệ thống của chúng ra đời: thần thức ở giai đoạn 4, thiên kiếp ở giai đoạn 4.
- `activeUntil: truc_co` của Đại Khí Vãn Thành: chậm cho tới khi **đạt** Trúc Cơ.
- Tên 37 tránh trùng thể chất "Hỗn Độn Thể" trong roots.json.
