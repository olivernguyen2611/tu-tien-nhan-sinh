# 40 sự kiện tu luyện, tông môn & đời phàm nhân (task 2.8) — ĐÃ DUYỆT 2026-10-11

Thế giới Thương Lan. Dùng các thế lực, công pháp, thiên phú, đường phàm nhân đã duyệt. Chia nhóm: **Đời tông môn 9 · Tu luyện 7 · Kỳ ngộ công pháp 5 · Tán tu & ma đạo 4 · Đời phàm nhân & tiên duyên 15**.

**Quy ước đọc** (như sự kiện phàm nhân):
- `[Khí vận/Thiên phú]` = lựa chọn ẩn. `⚄ Ngộ tính 50` = kiểm tra chỉ số.
- `{sect}` = tên tông môn của người chơi, `{name}` = tên nhân vật.
- Hiệu ứng mới cho tu tiên: `tu vi +20%` (tiến độ tầng), `linh thạch +5`, `cống hiến +10` (điểm tông môn), `thăng nội môn`, `học <công pháp>`, `nhận <đan dược>`, `danh vọng Chính +5`.
- Không có sự kiện tình duyên (để GĐ3); sư huynh, sư tỷ ở đây chỉ là đồng môn.
- **Quy tắc (chủ dự án, 2026-10-11): lựa chọn nào cũng ảnh hưởng ít nhất một chỉ số** (Sức khỏe, Vui vẻ, Trí tuệ, Mị lực, Căn cốt, Ngộ tính, Khí vận, Đạo tâm); tiền, cống hiến, flag không tính là chỉ số.


---

## A. Đời tông môn (cần đang ở tông môn)

### 1. Động phủ đầu tiên `dong_phu_dau_tien`
Ngoại môn · chỉ một lần
> Chấp sự ném cho {name} ba tấm thẻ gỗ: "Chọn đi, chọn rồi không đổi."
- **Gần linh mạch** (ẩm thấp, chật chội) → "Linh khí dồi dào, nhưng đêm nào cũng nghe tiếng nước nhỏ giọt." `tu vi tốc độ +10% trong 5 năm` · `stat.happiness −3`
- **Gần nhà ăn** → "Ăn no, ngủ kỹ, quen hết các sư huynh nhà bếp." `stat.health +5` · `stat.happiness +5`
- **Gần Tàng Kinh Các** → "Tối nào cũng lén đọc sách tới khuya." `stat.comprehension +2`

### 2. Phí bảo kê của sư huynh `phi_bao_ke`
Ngoại môn · tag: funny
> Một gã sư huynh to béo chặn đường: "Đệ tử mới, mỗi tháng nộp ba khối linh thạch, sư huynh bảo kê cho."
- **Nộp** → "Ngươi nghèo đi, nhưng yên thân." `linh thạch −3` · `stat.happiness −3`
- **Không nộp, đánh** · ⚄ Căn cốt 55
  - Thắng: "Gã nằm đo đất. Từ đó ngoại môn gọi ngươi là 'tân tú'." `danh vọng tông môn +5` · `stat.happiness +5`
  - Thua: "Ngươi bị đánh bầm dập, linh thạch vẫn mất." `stat.health −10` · `linh thạch −3`
- **Mách chấp sự** → "Chấp sự phạt gã quét sân ba tháng. Gã nhìn ngươi rất lâu." `flag: ke_thu_su_huynh_beo` · `stat.daoHeart +1`
- `[Khéo Mồm]` **Khen gã một tràng rồi rủ đi ăn** → "Gã cảm động, từ đó bảo kê ngươi miễn phí." `stat.happiness +3`

### 3. Trông linh điền `trong_linh_dien`
Ngoại môn · chủ đề: herb · nhiệm vụ tông môn
> Nhiệm vụ: trông ruộng linh mễ một mùa. Đêm thứ ba, có tiếng sột soạt giữa ruộng.
- **Rình bắt** · ⚄ Thần thức / Ngộ tính 45
  - Thành công: "Một con thỏ trắng mắt đỏ, đang gặm linh mễ. Ngươi bắt được, nó là linh thú non." `cống hiến +10` · `flag: tho_trang_linh_thu` · `stat.happiness +5`
  - Thất bại: "Sáng ra mất nửa ruộng. Chấp sự trừ điểm." `cống hiến −5` · `stat.happiness −3`
- **Bày bù nhìn rồi đi ngủ** → "Bù nhìn bị gặm mất đầu." `cống hiến +2` · `stat.health +2` (ngủ ngon)
- `[Linh Tỵ]` **Ngửi ra mùi thú, chặn đúng hang** → "Bắt được cả ổ." `cống hiến +15` · `craft.herbalism +3` · `stat.happiness +3`

### 4. Đưa thư xuống núi `dua_thu_xuong_nui`
Ngoại môn · nhiệm vụ tông môn
> Mang thư của trưởng lão tới Khâm Thiên Giám ở Diên Châu. Đường đi qua quê nhà {hometown}.
- **Đi thẳng, xong việc về ngay** → "Trưởng lão khen ngươi biết điều." `cống hiến +10` · `stat.daoHeart +1` · `stat.happiness −2` (nhớ nhà)
- **Ghé thăm nhà** (còn cha mẹ) → "Mẹ ngươi khóc, cha ngươi giả vờ không khóc. Ngươi về trễ ba ngày." `stat.happiness +10` · `cống hiến +3`
- **Ghé Kim Thiềm Thương Minh xem hàng** → "Không mua gì, nhưng biết giá cả." `stat.intellect +2` · `flag: biet_gia_phuong_thi`

### 5. Lão nhân quét lá `lao_nhan_quet_la`
Đang ở tông môn · chỉ một lần · tag: rare
> Trước Tàng Kinh Các có một lão già quét lá. Lá rụng tới đâu lão quét tới đó, chưa ai thấy lão nghỉ.
- **Giúp lão quét lá** → "Lão nhìn ngươi, nói một câu: 'Quét lá cũng là tu.' Ngươi nghĩ mãi không hiểu." `stat.daoHeart +3` · `flag: lao_nhan_quet_la` *(mở chuỗi về sau)*
- **Hỏi lão có bí kíp gì không** → "Lão đưa ngươi cái chổi." `stat.happiness +1`
- **Đi qua** → "Sau lưng ngươi, tiếng chổi ngừng lại một nhịp." `stat.happiness +1`
- `[Linh Lung Tâm]` **Nhìn ra lão không hề đụng chổi xuống đất** → "Lão cười: 'Mắt tốt.' Rồi biến mất." `stat.comprehension +5` · `flag: lao_nhan_quet_la`

### 6. Ngoại môn tiểu bỉ `ngoai_mon_tieu_bi`
Ngoại môn · Luyện Khí tầng 4+ · mỗi 3 năm
> Ba năm một lần, ngoại môn tỷ thí. Mười người đứng đầu được vào nội môn.
- **Dốc sức tranh** · ⚄ Chiến lực (so với đồng môn cùng tầng)
  - Thắng: "Tên ngươi đứng thứ bảy trên bảng." `thăng nội môn` · `danh vọng tông môn +10` · `stat.happiness +8`
  - Thua: "Thua ở vòng hai. Năm sau làm lại." `stat.happiness −5`
- **Giấu sức, xem người khác đánh** → "Ngươi học được vài chiêu của người ta." `stat.comprehension +2`
- `[Kiếm Thai]` **Một kiếm định thắng** → "Đối thủ chưa kịp rút kiếm đã thua. Trưởng lão Tàng Phong Kiếm Các ngồi xem gật gù." `thăng nội môn` · `flag: kiem_cac_chu_y` · `stat.happiness +5`

### 7. Trưởng lão để mắt `truong_lao_de_mat`
Nội môn · chỉ một lần
> Một vị trưởng lão Trúc Cơ gọi {name} tới, hỏi vài câu rồi im lặng uống trà.
- **Quỳ xuống xin bái sư** · ⚄ Ngộ tính 55
  - Thành công: "Trưởng lão gật đầu. Từ nay ngươi có sư phụ." `flag: co_su_phu` · `tu vi tốc độ +10%` · `stat.happiness +5` · `stat.comprehension +2`
  - Thất bại: "Trưởng lão bảo: 'Chưa đủ.' Ngươi về, lòng nặng trĩu." `stat.happiness −5`
- **Rót thêm trà, chờ ông nói** → "Ông nói về đạo cả buổi chiều. Ngươi hiểu được một nửa." `stat.comprehension +3`
- **Xin phép về tu luyện** → "Trưởng lão nhíu mày, rồi cười." `stat.daoHeart +2`

### 8. Bị vu oan trộm đan `bi_vu_oan`
Đang ở tông môn
> Kho đan dược mất ba viên Tụ Khí Đan. Có người nói thấy {name} lảng vảng gần đó.
- **Tự tìm thủ phạm** · ⚄ Trí tuệ 55
  - Thành công: "Thủ phạm là gã đã tố cáo ngươi. Chấp sự phạt gã, thưởng ngươi." `cống hiến +15` · `karma +2` · `stat.intellect +2`
  - Thất bại: "Không tìm ra. Ngươi bị phạt quét sân một năm." `cống hiến −10` · `stat.happiness −5`
- **Nhận tội thay cho xong** → "Ngươi bị phạt, nhưng một người lặng lẽ ghi nhớ ơn này." `cống hiến −10` · `stat.daoHeart +3` · `flag: an_nhan_bi_mat`
- `[Quý Nhân Duyên]` **Một sư tỷ đứng ra làm chứng** → "Ngươi trong sạch, có thêm một người bạn." `npc ban: su_ty` · `stat.happiness +5`

### 9. Phát bổng lộc `phat_bong_loc`
Đang ở tông môn · mỗi năm có thể gặp · tag: funny
> Mỗi tháng tông môn phát hai viên Tụ Khí Đan. Tháng này chấp sự phát cho {name} một viên, nói viên kia "bị chuột ăn".
- **Đòi lại** → "Chấp sự lườm ngươi, rồi đưa. Tháng sau ngươi lại nhận đủ." `nhận tu_khi_dan` · `flag: chap_su_ghet` · `stat.daoHeart +2`
- **Thôi bỏ qua** → "Ngươi thắc mắc chuột nào ăn được đan." `stat.happiness −2` · `stat.intellect +1`
- `[Hòa Khí Sinh Tài]` **Rủ chấp sự góp vốn buôn đan** → "Chấp sự cảm động, từ đó phát cho ngươi ba viên." `nhận tu_khi_dan ×2` · `linh thạch +2` · `stat.charm +2`

---

## B. Tu luyện

### 10. Đốn ngộ trong mưa `don_ngo_trong_mua`
Luyện Khí trở lên · tag: rare
> Mưa rơi trên mái động phủ, từng giọt một. {name} ngồi nghe, chợt thấy mỗi giọt như một luồng linh khí.
- **Nhắm mắt cảm ngộ** · ⚄ Ngộ tính 55
  - Thành công: "Ba ngày ba đêm, ngươi tỉnh lại, tu vi đã tiến một bước dài." `tu vi +40%` · `stat.comprehension +2`
  - Thất bại: "Ngươi ngủ quên, cảm lạnh ba ngày." `stat.health −3`
- **Ra ngoài tắm mưa** → "Chẳng ngộ được gì, nhưng rất sảng khoái." `stat.happiness +5`
- `[Ngộ Đạo Thiên Tư]` **Ngủ trưa một giấc là thông** → `tu vi +60%` · `stat.happiness +3`

### 11. Bình cảnh Luyện Khí `binh_canh_luyen_khi`
Luyện Khí tầng 9, thất bại đột phá ≥ 1 lần
> Linh khí đầy tràn mà không qua được cửa. Ngươi đã ngồi trước bức tường này mấy năm.
- **Bế quan khổ tu** → "Ngươi đóng cửa ba năm." `bế quan 3 năm` · `bottleneck −50%` · `stat.daoHeart +3` · `stat.happiness −5`
- **Xuống núi lịch luyện** → "Thấy nhiều, nghĩ nhiều, lòng tự mở." `mở sự kiện lịch luyện` · `stat.daoHeart +3`
- **Tìm sư phụ chỉ điểm** (có `co_su_phu`) → "Sư phụ gõ đầu ngươi một cái: 'Nóng vội.'" `breakthroughChance +10 lần tới` · `stat.comprehension +2`

### 12. Tu luyện quá sức `tu_luyen_qua_suc`
Luyện Khí trở lên · chủ đề: mishap
> Muốn nhanh hơn người, {name} dẫn linh khí quá mạnh. Kinh mạch nóng rát như bị lửa đốt.
- **Dừng ngay, điều tức** → "Thoát nạn, nhưng mất mấy tháng công." `tu vi −10%` · `stat.daoHeart +2`
- **Cố thêm chút nữa** · ⚄ Căn cốt 60
  - Thành công: "Kinh mạch giãn ra, rộng hơn trước." `tu vi +25%` · `stat.physique +2`
  - Thất bại: "Tổn thương kinh mạch." `stat.health −20` · `tu vi tốc độ ×0.5 trong 5 năm`
- `[Hậu Bì]` hoặc `[Thiết Cốt]` **Gồng chịu** → "Da dày chịu được cả lửa trong người." `tu vi +20%` · `stat.physique +2`

### 13. Bóng cũ trong tâm `bong_cu_trong_tam`
Luyện Khí trở lên · nhân quả ≤ −10 · chủ đề: heart_demon
> Lúc nhập định, {name} thấy lại một gương mặt cũ, người từng bị ngươi làm hại.
- **Đối mặt, nhận lỗi trong lòng** · ⚄ Đạo tâm 50
  - Thành công: "Gương mặt tan đi. Lòng nhẹ hẳn." `stat.daoHeart +5`
  - Thất bại: "Gương mặt cười. Ngươi giật mình tỉnh dậy, mồ hôi ướt áo." `stat.daoHeart −5` · `tu vi −10%`
- **Gạt đi, tiếp tục tu** → "Bóng kia lui vào góc, chờ." `flag: tam_ma_am_i` · `stat.daoHeart −3`
- `[Bồ Đề Tâm]` **Mỉm cười với nó** → "Nó cũng mỉm cười, rồi đi." `stat.daoHeart +8`

### 14. Tìm Trúc Cơ Đan `tim_truc_co_dan`
Luyện Khí tầng 9
> Muốn Trúc Cơ, ai cũng cần một viên Trúc Cơ Đan (+25% tỉ lệ). Mà đan thì ít, người thì nhiều.
- **Đổi bằng cống hiến** (cần cống hiến ≥ 100) → "Ngươi dốc hết điểm tích mấy năm." `cống hiến −100` · `nhận truc_co_dan` · `stat.happiness +5`
- **Đến đấu giá Kim Thiềm** (cần linh thạch ≥ 50) · ⚄ Khí vận 50
  - Thành công: "Giành được với giá hời." `linh thạch −50` · `nhận truc_co_dan` · `stat.happiness +5`
  - Thất bại: "Bị một thiếu gia Tô gia trả giá cao hơn, còn cười khẩy." `flag: thu_to_gia_thieu_gia` · `stat.happiness −5`
- **Liều đột phá không cần đan** → "Ngươi tin vào bản thân." `stat.daoHeart +5` *(tỉ lệ Trúc Cơ thấp hơn)*
- `[Đan Thủ]` **Tự luyện** · ⚄ Luyện Đan 40 → thành công `nhận truc_co_dan` · thất bại `nổ lò, stat.health −5`

### 15. Linh khí triều tịch `linh_khi_trieu_tich`
Luyện Khí trở lên · cách 20 năm · tag: rare · chủ đề: fortune
> Hai mươi năm mới có một lần, linh khí trong Lan Sơn dâng lên như thủy triều, đêm trời sáng như ngày.
- **Lên đỉnh núi hứng trọn** · ⚄ Căn cốt 50
  - Thành công: "Linh khí đổ vào người như thác." `tu vi +50%` · `stat.physique +2`
  - Thất bại: "Quá sức, ngươi ngất trên đỉnh núi." `tu vi +15%` · `stat.health −10`
- **Ngồi trong động phủ hấp thu vừa phải** → `tu vi +20%` · `stat.health +2`
- **Đi gom linh thảo nở rộ đêm đó** → `linh thạch +15` · `craft.herbalism +3` · `stat.happiness +3`

### 16. Lò đan đầu tiên `lo_dan_dau_tien`
Luyện Khí · đã học Luyện Đan hoặc ở Bách Thảo Cốc · tag: funny
> Lần đầu tự mở lò. Lửa lên, thuốc vào, {name} nín thở.
- **Theo đúng sách** · ⚄ Luyện Đan 20
  - Thành công: "Ba viên Tụ Khí Đan tròn trịa." `nhận tu_khi_dan ×3` · `craft.alchemy +5` · `stat.happiness +5`
  - Thất bại: "Một tiếng nổ. Lông mày ngươi đi đâu mất." `stat.charm −3` · `craft.alchemy +2`
- **Thêm chút sáng tạo** · ⚄ Khí vận 60
  - Thành công: "Ra một viên đan lạ, uống vào thấy người nhẹ bẫng." `tu vi +15%` · `craft.alchemy +5` · `stat.health +3`
  - Thất bại: "Ra một cục than biết bốc khói." `craft.alchemy +3` · `stat.happiness −2`

---

## C. Kỳ ngộ công pháp (nối công pháp C9–C12, C15)

### 17. Động phủ có lò còn ấm `dong_phu_lo_am`
Luyện Khí trở lên, hoặc phàm nhân khí vận ≥ 60 · chỉ một lần · chủ đề: fortune
> Lạc đường trong núi, {name} lách qua khe đá, thấy một động phủ cổ. Lò luyện đan bên trong vẫn còn ấm.
- **Phá cấm chế vào trong** · ⚄ Khí vận 55
  - Thành công: "Bên lò có một quyển sách cháy sém." `nhận Hỏa Vân Quyết (C9)` · `linh thạch +10` · `stat.luck +2`
  - Thất bại: "Cấm chế phản phệ." `stat.health −20`
- **Ghi nhớ đường, về báo tông môn** → "Tông môn thưởng ngươi, rồi cử người tới lấy hết." `cống hiến +30` · `stat.happiness −3` · `karma +1`
- **Đi thôi, sợ có bẫy** → "Đêm đó ngươi trằn trọc mãi." `stat.happiness −3` · `stat.daoHeart +1`

### 18. Xác tán tu dưới hồ `xac_tan_tu_duoi_ho`
Luyện Khí trở lên · chỉ một lần · tag: dark (nhẹ)
> Nước hồ trong vắt. Dưới đáy có một bộ xương ngồi xếp bằng, bên hông đeo túi trữ vật.
- **Lặn xuống lấy túi** → `nhận Thủy Nguyệt Quan Tưởng Pháp (C10)` · `linh thạch +8` · `stat.health −3` (nước lạnh)
- **Lấy túi, rồi chôn cất người ấy** → "Ngươi đắp một nấm mồ bên hồ." `nhận C10` · `linh thạch +8` · `karma +3` · `stat.daoHeart +2`
- **Không đụng tới người chết** → `stat.daoHeart +1`

### 19. Chữ trên vách đá `chu_tren_vach_da`
Luyện Khí trở lên, hoặc võ giả Tuyệt đỉnh trở lên · chỉ một lần
> Cạo lớp rêu trên vách núi, {name} thấy chữ khắc sâu cả tấc, nét nào cũng như vết quyền.
- **Ngồi đọc ba ngày** · ⚄ Căn cốt 50
  - Thành công: `nhận Thạch Phu Luyện Thể Thiên (C11)` · `stat.physique +3`
  - Thất bại: "Đọc tới đâu đau xương tới đó. Ngươi bỏ cuộc." `stat.physique +1`
- **Chép lại đem bán** → `linh thạch +10` (hoặc `bạc +100` nếu là phàm nhân) · `stat.intellect +1`

### 20. Lão giả trong mộng `lao_gia_trong_mong`
Có `nghe_noi_tu_tien` · chỉ một lần · tag: rare
> Đêm nào cũng mơ thấy một lão già giảng kinh. Giọng quen quen, như ông lão xin ăn năm xưa.
- **Ghi nhớ từng chữ** · ⚄ Ngộ tính 50
  - Thành công: `nhận Mộng Trung Tàn Kinh (C12)` · `stat.comprehension +2`
  - Thất bại: "Sáng ra chỉ nhớ câu cuối: 'Đừng quên ăn sáng.'" `stat.health +2`
- **Hỏi lão là ai** → "Lão cười, không đáp, rồi giảng tiếp." `nhận C12` · `stat.daoHeart +2`

### 21. Kiếm trủng `kiem_trung`
Trúc Cơ · tư chất Kiếm ≥ 40 · chỉ một lần · tag: rare
> Sâu trong Lan Sơn có một thung lũng cắm đầy kiếm gãy. Kiếm minh vang lên khi {name} bước vào.
- **Đi tới thanh kiếm ở giữa** · ⚄ Đạo tâm 65
  - Thành công: "Người chết vẫn cầm kiếm. Kiếm buông tay khi ngươi tới." `nhận Nhất Tuyến Thiên Kiếm Điển (C15)` · `flag: hoai_bich` *(có thể bị truy đoạt)* · `stat.daoHeart +5`
  - Thất bại: "Kiếm ý ép ngươi quỳ xuống. Ngươi bò ra khỏi thung lũng." `stat.health −25`
- **Nhặt một thanh kiếm gãy rồi đi** → "Kiếm gãy nhưng vẫn sắc." `nhận pháp bảo: kiếm gãy` · `stat.happiness +2`
- **Cúi chào rồi đi** → `stat.daoHeart +3`

---

## D. Tán tu & ma đạo

### 22. Vô Chủ Phường `vo_chu_phuong_tan_quyen`
Có linh căn · chưa có tông môn hoặc đang xuống núi · tag: funny
> Một gã bán hàng rong ở Vô Chủ Phường thì thầm: "Thượng cổ thần công, ba lạng thôi."
- **Mua** → "Bìa ghi 'Thượng cổ thần công'. Trang cuối ghi 'Giá: ba lạng'." `nhận Thổ Nạp Tàn Quyển (C8)` · `bạc −3` · `stat.happiness +3`
- **Mặc cả** · ⚄ Mị lực 50 → thành công: mua với giá hai lạng, `stat.charm +1` · thất bại: gã đổi ý, đòi năm lạng, `stat.happiness −2`.
- **Bỏ đi** → "Gã gọi với theo: 'Hai lạng! Một lạng rưỡi!'" `stat.intellect +1`

### 23. Lời mời từ U Hà `loi_moi_u_ha`
Luyện Khí trở lên · nhân quả ≤ 0 hoặc vừa bị tông môn phạt · tag: dark
> Một người áo đen ngồi đối diện {name} trong quán trà: "Ở tông ngươi bao năm mới tới tầng này? Theo ta, ba năm."
- **Theo hắn** → "Ngươi đổi sang U Hà Huyết Ảnh Công." `đạo thống → Ma` · `danh vọng Ma +20, Chính −20` · `rời tông môn` · `stat.daoHeart −5`
- **Từ chối** → "Hắn cười, để lại một tấm lệnh bài đen." `flag: lenh_bai_u_ha` · `stat.daoHeart +3`
- **Báo cho tông môn** → "Tông môn cử người truy bắt, hắn đã đi mất. Ngươi được ghi công." `cống hiến +20` · `danh vọng Chính +5` · `stat.daoHeart +2`

### 24. Kẻ bị thương mang bảo `ke_bi_thuong_mang_bao`
Luyện Khí trở lên · tag: dark, violence
> Bên đường có một tán tu bị thương nặng, ôm chặt một cái hộp gỗ. Hắn nhìn {name}, ánh mắt vừa cầu cứu vừa đề phòng.
- **Cứu hắn** → "Hắn sống, tặng ngươi một viên linh thạch và một lời hứa." `karma +5` · `linh thạch +1` · `npc ân nhân: tan_tu` · `stat.happiness +3` *(sổ ân oán)*
- **Giết người đoạt bảo** → "Trong hộp có ba viên đan và một tấm bản đồ." `karma −15` · `nhận tu_khi_dan ×3` · `flag: ban_do_bi_canh` · `stat.daoHeart −5`
- **Đi tiếp, không dính vào** → "Tiếng rên sau lưng nhỏ dần." `stat.daoHeart −2` · `stat.happiness −2`

### 25. Thiên kiêu Hàn gia `thien_kieu_han_gia`
Luyện Khí tầng 6+ · chỉ một lần
> Thiếu gia Hàn gia, kiếm tu trẻ nhất Lan Sơn, đứng chắn đường {name}: "Nghe nói ngươi cũng có chút tiếng tăm. Đấu một trận."
- **Nhận lời** · ⚄ Chiến lực
  - Thắng: "Hắn nhìn thanh kiếm gãy làm đôi, mặt trắng bệch. Tên ngươi lan khắp Lan Sơn." `danh vọng Chính +10` · `flag: thang_han_gia` *(đối thủ trọn đời)* · `stat.happiness +8` · `stat.charm +3`
  - Thua: "Hắn thu kiếm: 'Mười năm sau đấu lại.'" `stat.health −10` · `flag: thua_han_gia`
- **Từ chối** → "Hắn cười khẩy bỏ đi. Đồng môn bàn tán mấy tháng." `stat.happiness −5`
- `[Kim Thiền Thoát Xác]` **Đồng ý, rồi chạy** → "Lúc hắn rút kiếm, ngươi đã ở chân núi." `stat.happiness +3` · `flag: han_gia_truy_tim`

---

## E. Đời phàm nhân & tiên duyên (người không linh căn)

Nối với 4 con đường đời, thang võ đạo và các cửa vào tiên lộ đã duyệt. Hiệu ứng mới: `lên nấc <đường đời>`, `lên cảnh giới võ đạo`, `danh vọng Triều đình/Giang hồ`.

### 26. Ngày tiên môn tuyển đồ `tien_mon_tuyen_do_truot`
Không linh căn · tuổi 8–14 · chỉ một lần
> Mười năm một lần, Bích Lạc Tông xuống Diên Châu tuyển người. {name} đặt tay lên viên đá thử, đá không sáng. Tiên sư phất tay: "Người kế tiếp."
- **Về nhà, theo nghề của mình** → "Mẹ ngươi nấu một nồi cháo, không hỏi gì." `stat.happiness −5` · `stat.daoHeart +2`
- **Xin làm tạp dịch trên núi** · ⚄ Căn cốt 45 → thành công: "Chấp sự nhìn tay chân ngươi, gật đầu: 'Gánh nước được.'" `flag: tap_dich` *(cửa 2.3)* · `stat.happiness +3` · thất bại: "Không cần người." `stat.happiness −5`
- **Đứng ngoài cổng không chịu về** → "Ba ngày ba đêm. Một vị sư già đi ngang, nhìn ngươi rất lâu." `stat.daoHeart +5` · `flag: su_gia_de_y` *(gợi Phật duyên)*

### 27. Tiên nhân bay ngang trời `tien_nhan_bay_ngang`
Không linh căn · mọi tuổi · tag: funny
> Một vệt sáng xé trời, có người đứng trên thanh kiếm bay qua làng. Cả làng ngẩng cổ nhìn, gà quên gáy.
- **Quỳ xuống lạy** → "Tiên nhân không thấy. Nhưng ngươi thấy lòng yên." `stat.luck +1`
- **Chạy theo** → "Chạy tới bờ ruộng thì ngã." `stat.health −2` · `stat.happiness +3`
- **Làm một bài thơ** → "Bài thơ truyền khắp huyện, còn hay hơn cả tiên nhân." `stat.intellect +2` · `stat.charm +2`

### 28. Thi Hương `thi_huong`
Quan lộ · có `tu_tai` · tuổi 17–35
> Kỳ thi ở phủ, ba ngày nhốt trong lều thi chật như lồng gà.
- **Dốc sức** · ⚄ Trí tuệ 65 → đỗ: "Cử nhân! Cả họ mở tiệc." `lên nấc Quan lộ (Cử nhân)` · `danh vọng Triều đình +10` · `stat.happiness +10` · trượt: `stat.happiness −8`
- **Viết thẳng về tệ nạn quan trường** · ⚄ Trí tuệ 75 → đỗ: "Quan chủ khảo đỏ mặt, nhưng không dám đánh trượt." `lên nấc` · `karma +3` · `flag: thanh_quan` · `stat.daoHeart +5` · trượt: "Bài bị đánh dấu 'cuồng sĩ'." `danh vọng Triều đình −10` · `stat.happiness −8` · `stat.daoHeart +3`

### 29. Án oan ở huyện `an_oan_o_huyen`
Quan lộ · đã làm quan · chủ đề: justice
> Một nông dân bị vu giết người. Kẻ vu oan là con trai một phú hộ, lễ vật đã đặt sẵn sau bình phong.
- **Xử công minh** → "Dân cả huyện đốt pháo. Phú hộ viết thư lên trên." `karma +8` · `danh vọng Triều đình −5` · `flag: ke_thu_phu_ho` · `stat.daoHeart +3` · `stat.happiness +3`
- **Nhận lễ vật** → "Bạc nặng tay. Đêm đó ngươi ngủ không yên." `bạc +300` · `karma −10` · `stat.daoHeart −5`
- `[Linh Lung Tâm]` **Nghe một câu là biết ai nói dối, lấy luôn lời khai làm bằng** → "Phú hộ cứng họng." `karma +8` · `danh vọng Triều đình +5` · `stat.charm +3`

### 30. Mở tiệm `mo_tiem`
Thương lộ · tuổi 18+ · bạc ≥ 50
> Một gian hàng mặt phố đang cho thuê. Tứ Phương Thương Hội cũng ngỏ ý cho vay.
- **Tự bỏ vốn** → `bạc −50` · `lên nấc Thương lộ (Chủ tiệm)` · `stat.happiness +5`
- **Vay thương hội** → "Có vốn lớn, nhưng tháng nào cũng phải trả lãi." `lên nấc Thương lộ` · `flag: no_thuong_hoi` · `stat.happiness −3` (lo trả nợ)
- `[Hòa Khí Sinh Tài]` hoặc `[Khéo Mồm]` **Nói chủ nhà giảm nửa tiền thuê** → `bạc −25` · `lên nấc Thương lộ` · `stat.charm +2`

### 31. Thương chiến `thuong_chien`
Thương lộ · đã là Chủ tiệm trở lên
> Tiệm đối diện hạ giá một nửa, quyết dìm chết {name}.
- **Hạ giá theo** · ⚄ Khí vận 50 → thắng: "Tiệm kia đóng cửa trước." `bạc +100` · `stat.happiness +5` · thua: `bạc −80` · `stat.happiness −8`
- **Đổi hàng khác, không đấu** → "Ngươi bán thứ họ không có." `stat.intellect +2` · `bạc +30`
- **Mua luôn tiệm đối diện** (bạc ≥ 300) → "Chủ tiệm kia thành người làm của ngươi." `bạc −300` · `lên nấc Thương lộ (Phú hộ)` · `stat.happiness +5` · `karma −2`

### 32. Bái nhập Lục Hợp Môn `bai_nhap_luc_hop_mon`
Võ lâm · tuổi 10–20 · chỉ một lần
> Lục Hợp Môn mở cửa nhận đệ tử. Bài thử: đứng tấn một nén nhang dưới nắng trưa.
- **Đứng tấn** · ⚄ Căn cốt 50 → thành công: `flag: luc_hop_mon` · `lên cảnh giới võ đạo (Tam lưu)` · `danh vọng Giang hồ +5` · `stat.physique +2` · thất bại: "Ngươi ngã sau nửa nén." `stat.physique +1`
- `[Thiết Vị]` **Đứng tấn, tranh thủ ăn bánh** → "Sư phụ tức cười, nhận luôn." `flag: luc_hop_mon` · `lên cảnh giới võ đạo (Tam lưu)` · `stat.happiness +3`

### 33. Khổ luyện vượt ải `kho_luyen_vuot_ai`
Võ đạo Nhị lưu hoặc Nhất lưu · lặp lại được
> Võ công dậm chân tại chỗ. Sư phụ bảo: "Lên núi tuyết, ba năm."
- **Lên núi tuyết** · ⚄ Căn cốt (độ khó theo cảnh giới) → thành công: `lên cảnh giới võ đạo` · `stat.health −5` · thất bại: `stat.physique +2`
- **Xuống giang hồ tìm người so chiêu** → `stat.comprehension +2` · `danh vọng Giang hồ +5` · có thể gặp kẻ thù

### 34. Hóa cảnh `dot_pha_hoa_canh`
Võ đạo Tuyệt đỉnh viên mãn · Căn cốt ≥ 70
> Đứng trên đỉnh núi, quyền phong cuốn mây. Bức tường vô hình trước mặt {name} rung lên.
- **Một quyền phá tường** · ⚄ Căn cốt + Ngộ tính → thành công: "Xương cốt kêu răng rắc, rồi im bặt. Ngươi thấy thân thể nhẹ như lông, nặng như núi." `lên Hóa cảnh` · `thọ +30` · `danh vọng Giang hồ +30` · `stat.physique +10` · `stat.health +20` · thất bại: `stat.health −15` · `breakthroughChance +10 lần sau`
- **Chưa vội, rèn thêm** → `bottleneck −20%` · `stat.physique +2`

### 35. Đại hội võ lâm `dai_hoi_vo_lam`
Võ lâm · võ đạo Nhất lưu trở lên · mỗi 10 năm
> Quần hùng tụ về Diên Châu tranh ngôi minh chủ. Lục Hợp Môn, Thính Vũ Kiếm Phái đều có người, Vô Diện Lâu đâu đó trong đám đông.
- **Lên đài** · ⚄ Cảnh giới võ đạo → thắng: `lên nấc Võ lâm` (Tông sư hoặc Minh chủ nếu đã Hóa cảnh) · `danh vọng Giang hồ +20` · `stat.happiness +10` · thua: `stat.health −10`
- **Đứng xem, kết giao** → `npc bạn: võ giả` · `danh vọng Giang hồ +5` · `stat.charm +2`
- **Rình bắt sát thủ Vô Diện Lâu** · ⚄ Trí tuệ 60 → thành công: `danh vọng Giang hồ +15` · `flag: thu_vo_dien_lau` · `stat.charm +3` · thất bại: `stat.health −8`

### 36. Dịch bệnh Diên Châu `dich_benh_dien_chau`
Y lộ hoặc có `nghe_thuoc` · mọi tuổi 16+ · tag: dark (nhẹ)
> Dịch lan khắp ba huyện. Hồi Xuân Đường đóng cửa vì thầy thuốc cũng ngã bệnh.
- **Ở lại chữa bệnh** · ⚄ Trí tuệ 60 → thành công: "Ngươi tìm ra bài thuốc. Dân gọi ngươi là thần y." `lên nấc Y lộ` · `karma +10` · `stat.intellect +3` · `stat.daoHeart +3` · thất bại: `stat.health −20` · `karma +5`
- **Bán thuốc giá cao** → `bạc +200` · `karma −10` · `stat.daoHeart −5`
- **Đưa cả nhà lánh đi** → `stat.happiness −5`

### 37. Hương Hỏa Hội `huong_hoa_hoi`
Không linh căn · tuổi 14+ · tag: dark · *ma tu hứa khai mạch (lừa đảo)*
> Người của Hương Hỏa Hội phát bánh trước chợ: "Tiên Tôn thương người không linh căn. Thành tâm thờ phụng, ba năm khai mạch thành tiên."
- **Tin theo, nhập hội** → "Ba năm sau, ngươi được dẫn vào một hang sâu 'để khai mạch'." *(chuỗi: nhận ra / trốn / bị bắt làm vật tế)* · `flag: huong_hoa_hoi` · `stat.happiness +5` (tạm thời có hy vọng)
- **Hỏi kỹ** · ⚄ Trí tuệ 55 → thành công: "Lời họ có chỗ không khớp. Ngươi để ý thấy người nhập hội cũ không ai quay về." `flag: nghi_huong_hoa_hoi` · `stat.intellect +2` · thất bại: như "Tin theo"
- **Báo Khâm Thiên Giám** (có `nghi_huong_hoa_hoi`) → "Mấy ngày sau, tiên sư Bích Lạc xuống núi. Hương Hỏa Hội biến mất trong một đêm." `danh vọng Triều đình +10` · `danh vọng Chính +10` · `flag: ke_thu_u_ha` · `stat.daoHeart +3`

### 38. Linh quả nghìn năm `linh_qua_nghin_nam`
Không linh căn · khí vận ≥ 70 · đang ở Nam Cương hoặc rừng sâu · cực hiếm · *cửa 2.1 thiên địa kỳ vật*
> Giữa rừng thiêng, một cây nhỏ mang đúng một quả đỏ như máu, tỏa hương khiến muông thú quanh đó nằm rạp.
- **Ăn ngay** · ⚄ Sức khỏe (quá 30 tuổi khó hơn) → thành công: "Ba ngày tẩy tủy như lửa đốt. Ngươi tỉnh dậy, cảm được linh khí." `tạo linh căn (Ngũ, hiếm Tứ)` · `stat.health −30` · thất bại: "Thân phàm không chịu nổi." `stat.health −50` *(quá 40 tuổi có thể chết)*
- **Mang về cho con** (có con) → "Con ngươi có linh căn. Ngươi không có, nhưng thấy đủ." `con: có linh căn` · `karma +5` · `stat.happiness +10`
- **Bán cho tu sĩ** → "Một tu sĩ Trúc Cơ trả cái giá đủ cho ba đời ăn tiêu." `bạc +5000` · `lên nấc Thương lộ` · `stat.happiness +5` · `stat.daoHeart −3` (tiếc mãi)

### 39. Hạ viện Vô Ưu Tự `ha_vien_vo_uu`
Không linh căn · Đạo tâm ≥ 70 (hoặc có `su_gia_de_y`) · *cửa 2.4 Phật duyên*
> Chùa nhỏ dưới chân núi, sư thầy hiền, cơm chay ngon. Sư thầy nhìn {name}: "Thí chủ có duyên."
- **Quy y** → "Ngươi cạo tóc, học ngồi thiền đếm hơi thở." `học Vô Ưu Thiền Tâm Pháp (C5)` · `đạo thống → Phật` · `rời con đường đời` · `stat.daoHeart +5`
- **Ở lại ăn chay một thời gian** → `stat.daoHeart +5` · `stat.health +5`
- **Cảm ơn rồi về** → "Hương trầm theo ngươi về tới tận nhà." `stat.happiness +2`

### 40. Đời tạp dịch `doi_tap_dich`
Có `tap_dich` · lặp lại (mỗi vài năm)
> Gánh nước, quét sân, trông linh điền. Đệ tử chính thức đi qua không ai nhìn {name}.
- **Nghe lén trưởng lão giảng đạo** · ⚄ Ngộ tính 50 → thành công: `stat.comprehension +2` · thất bại: bị phạt `stat.happiness −3`
- **Học trồng linh thảo** → `craft.herbalism +5` · `stat.happiness +2`
- **Tranh thủ tìm quanh núi** → `cơ hội gặp #17, #19, #38 ×3` *(theo cửa 2.3)* · `stat.physique +1`
- `[đã gặp #5]` **Giúp lão nhân quét lá** → "Lão nói: 'Không có linh căn, quét lá vẫn là tu.'" `stat.daoHeart +5`

---

## Ghi chú cho thread làm repo
- File `content/worlds/thuong_lan/events/cultivation.json` (A, B), `fortune.json` (C), `rogue.json` (D), `mortal-path.json` (E).
- Nhóm E cần thêm: điều kiện `lifePath`/`lifeRank`, `martialRealm`, `hasRoot`, `hasChildren`; hiệu ứng `lifePath.promote`, `martialRealm.promote`, `createRoot`, `childRoot`.
- Điều kiện mới: `sect` (có/không, id), `sectRank` (ngoại môn/nội môn), `realm` + `stage`, `pathAffinity`, `martialRealm` (cho phàm nhân võ giả ở #19).
- Hiệu ứng mới: `cult.progress` (% tầng), `cult.speedBuff {mul, years}`, `spiritStones`, `sect.contribution`, `sect.promote`, `learnTechnique`, `retreat {years}`, `changeLineage`, `leaveSect`.
- Đan dược dùng: `tu_khi_dan`, `truc_co_dan` (G.2); sẽ có đầy đủ ở task 3.1.
- Chủ đề mới: `heart_demon`. Flag mở chuỗi về sau: `lao_nhan_quet_la`, `hoai_bich`, `ban_do_bi_canh`, `lenh_bai_u_ha`, `thang_han_gia`/`thua_han_gia`, `an_nhan_bi_mat`.
