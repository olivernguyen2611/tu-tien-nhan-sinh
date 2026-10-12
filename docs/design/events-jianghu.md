# 40 sự kiện giang hồ tu tiên (task 3.9) — ĐÃ DUYỆT 2026-10-11

Thế giới Thương Lan. Năm nhóm: **Tình duyên 10 · Giết người đoạt bảo 8 · Ma đạo cám dỗ 8 · Yêu thú 7 · Phường thị 7**. Dùng các thế lực, công pháp, khí vận, thiên phú và trạng thái cực trị đã duyệt.

**Quy ước đọc** (giống bộ 2.8):
- `[Khí vận/Thiên phú]` là lựa chọn ẩn. `⚄ Trí tuệ 55` là kiểm tra chỉ số.
- `{name}` là nhân vật, `{lover}` là người trong lòng (NPC đang có thiện cảm cao nhất), `{rival}` là tình địch, `{sect}` là tông môn của người chơi.
- Mọi kết quả đều đổi ít nhất một trong 8 chỉ số. Tiền, cống hiến, nhân quả, danh vọng và flag không tính là chỉ số.

**Ràng buộc bắt buộc cho nhóm A và sự kiện #22:**
- Nhân vật và mọi NPC liên quan đều **từ 18 tuổi trở lên**. Engine chặn bằng điều kiện tuổi của cả hai bên.
- NPC phải **còn sống**. Nếu `{lover}` chết, các sự kiện cần `{lover}` tự tắt.
- Cảnh thân mật dừng ở mức gợi ý rồi chuyển cảnh. Lô đỉnh là hành vi ác: nhân quả nặng, tâm ma, không bao giờ được thưởng về mặt "tình cảm".

---

## A. Tình duyên (18+, tag `mature` khi có gợi ý thân mật)

Nối với hệ thống 3.6 (thiện cảm nhiều nấc) và 3.7 (đạo lữ, song tu). Hiệu ứng mới: `thiện cảm {npc} ±n`, `kết đạo lữ`, `tình địch: {rival}`.

### 1. Chung ô dưới mưa `chung_o_duoi_mua`
Tuổi 18+ · có hoặc không có linh căn · chưa có đạo lữ · chủ đề: romance
> Mưa đổ bất chợt. Dưới mái hiên tiệm thuốc chỉ còn {name} và một người lạ đang ôm bọc sách ướt.
- **Đưa ô cho người ta, tự mình đội mưa về** → "Hôm sau ngươi cảm lạnh. Hôm sau nữa, có người mang ô tới trả, kèm một gói thuốc." `npc mới: người trong lòng` · `thiện cảm +15` · `stat.health −3` · `stat.charm +2`
- **Cùng đứng trú, bắt chuyện** · ⚄ Mị lực 45
  - Thành công: "Chuyện từ thời tiết sang thơ văn, mưa tạnh lúc nào không hay." `npc mới: người trong lòng` · `thiện cảm +10` · `stat.happiness +5`
  - Thất bại: "Ngươi khen sách người ta 'ướt rất đẹp'. Người ta đội mưa đi luôn." `stat.happiness −2` · `stat.intellect +1` (rút kinh nghiệm)
- **Dùng pháp thuật thổi khô mưa** (có linh căn) → "Người kia trố mắt, rồi vái ngươi như vái tiên." `stat.charm +2` · `stat.happiness +2`
- `[Đào Hoa Kiếp]` **Chưa kịp làm gì** → "Thêm hai người nữa chạy vào trú mưa, cả ba đều nhìn ngươi." `tình địch +2` · `stat.charm +3` · `stat.happiness −2`

### 2. Thư tình gửi nhầm `thu_tinh_gui_nham`
Tuổi 18+ · tag: funny
> Một phong thư thơm mùi hoa đặt trước cửa {name}. Đọc tới dòng cuối mới thấy tên người nhận là sư huynh phòng bên.
- **Đem trả tận tay sư huynh** → "Sư huynh đỏ mặt, ba hôm sau mời ngươi uống rượu mừng." `npc bạn: đồng môn` · `stat.happiness +3` · `karma +1`
- **Viết thư trả lời thay** · ⚄ Trí tuệ 50
  - Thành công: "Văn ngươi hay quá, người viết thư bắt đầu viết thư cho... ngươi." `npc mới: người trong lòng` · `stat.intellect +2` · `stat.charm +2`
  - Thất bại: "Bị lộ. Cả ngoại môn cười ba tháng." `stat.happiness −5` · `stat.charm −2`
- **Giữ lại làm mẫu tập viết thư** → "Chữ ngươi đẹp lên trông thấy." `stat.intellect +1` · `stat.daoHeart −1`

### 3. Tặng quà `tang_qua`
Đang theo đuổi `{lover}` · thiện cảm 20–70 · lặp lại được
> Sinh thần của {lover} sắp tới. Ngươi lật túi trữ vật tới lần thứ ba.
- **Tặng linh thảo quý** (linh thạch −5) → Nếu {lover} là đan sư hoặc thích hoa cỏ: `thiện cảm +15`, còn lại `thiện cảm +5`. `stat.happiness +2`
- **Tự tay làm một món** · ⚄ Trí tuệ 45 (hoặc có nghề bách nghệ cấp 2+)
  - Thành công: "Món quà xấu, nhưng {lover} giữ bên mình rất lâu." `thiện cảm +15` · `stat.happiness +5`
  - Thất bại: "Món quà nổ trong tay ngươi." `stat.health −3` · `thiện cảm +3` (vì thấy buồn cười)
- **Làm một bài thơ** → Nếu Trí tuệ ≥ 60: `thiện cảm +10` · `stat.charm +2`; nếu thấp hơn: "{lover} cười tới chảy nước mắt." `thiện cảm +5` · `stat.charm −1`
- **Quên mất** → "Ngươi nhớ ra lúc {lover} đang nhìn ngươi, tay không." `thiện cảm −10` · `stat.happiness −5`

### 4. Tình địch `tinh_dich_xuat_hien`
Đang theo đuổi `{lover}` · thiện cảm ≥ 40 · chủ đề: romance_trouble · `[Đào Hoa Kiếp]` ×2
> Thiếu gia một thế gia xuất hiện bên cạnh {lover}, mang theo cả xe lễ vật và một ánh mắt khinh khỉnh dành cho {name}.
- **Thách đấu** · ⚄ Chiến lực
  - Thắng: "Hắn ôm lễ vật về. {lover} nhìn ngươi lâu hơn thường lệ." `thiện cảm +10` · `flag: ke_thu_the_gia` · `stat.happiness +5` · `stat.charm +2`
  - Thua: "Ngươi nằm dưới đất, {lover} đứng giữa hai người không biết đỡ ai." `stat.health −10` · `thiện cảm +5` (thương hại) · `stat.happiness −5`
- **Lùi một bước, để {lover} tự chọn** · ⚄ thiện cảm 60
  - Được chọn: "{lover} trả lại xe lễ vật." `thiện cảm +15` · `stat.daoHeart +3` · `stat.happiness +8`
  - Không được chọn: "Ngươi về, đóng cửa ba ngày." `mất {lover}` · `stat.happiness −15` · `stat.daoHeart +3`
- **Điều tra lai lịch tình địch** · ⚄ Trí tuệ 55
  - Thành công: "Hắn đã có ba vị hôn thê ở ba thành khác nhau." `tình địch bị lộ` · `thiện cảm +10` · `stat.intellect +2`
  - Thất bại: "Bị bắt quả tang đang rình nhà người ta." `thiện cảm −10` · `stat.charm −3`

### 5. Thế gia cầu thân `the_gia_cau_than`
Tuổi 18+ · có linh căn · Luyện Khí tầng 7+ hoặc danh vọng Chính ≥ 30 · chỉ một lần
> Hàn gia sai người mang thiếp tới: muốn gả người trong họ cho {name}, kèm của hồi môn là một động phủ có linh mạch.
- **Nhận lời** → "Tài nguyên dồi dào, ngày cưới linh đình. Nhưng người kia nhìn ngươi như nhìn một món hàng." `kết đạo lữ (hôn nhân chính trị, thiện cảm 20)` · `flag: re_han_gia` · `tu vi tốc độ +10%` · `stat.happiness −5`
- **Từ chối khéo** · ⚄ Mị lực 55
  - Thành công: "Hàn gia không vui, nhưng không mất mặt." `stat.charm +2` · `stat.daoHeart +2`
  - Thất bại: "Hàn gia coi là sỉ nhục." `flag: ke_thu_han_gia` · `stat.happiness −3` · `stat.daoHeart +2`
- **Gặp riêng người được gả trước khi quyết** → "Hóa ra người ta cũng bị ép. Hai người ngồi uống trà, nói chuyện rất hợp." `npc bạn: người Hàn gia (thiện cảm 30)` · `stat.happiness +3` · `stat.intellect +1`
- Có `{lover}`: thêm lựa chọn **"Ta đã có người trong lòng"** → `thiện cảm {lover} +20` · `flag: ke_thu_han_gia` · `stat.daoHeart +3`

### 6. Lời nhờ vả ngọt ngào `bi_loi_dung_tinh_cam`
Đang theo đuổi `{lover}` · thiện cảm ≥ 50 · {lover} có tính cách bản chất "tham lam" hoặc "mưu mô" (hệ 3.4)
> {lover} nắm tay {name}: "Muội/huynh đang kẹt ở bình cảnh, nếu có Trúc Cơ Đan thì tốt biết mấy…"
- **Đưa luôn** → "Một tháng sau, {lover} Trúc Cơ thành công, rồi bận tới mức không còn thời gian gặp ngươi." `mất vật phẩm` · `mất {lover}` · `stat.happiness −15` · `stat.daoHeart +5` (tỉnh ra)
- **Hỏi han kỹ trước** · ⚄ Trí tuệ 55
  - Thành công: "Ngươi phát hiện {lover} xin cùng một thứ từ ba người khác." `mất {lover}` · `stat.intellect +3` · `stat.happiness −8` · `stat.daoHeart +3`
  - Thất bại: "Câu hỏi của ngươi bị coi là nghi ngờ." `thiện cảm −15` · `stat.happiness −5`
- **"Cùng nhau đi kiếm"** → "Đi được nửa đường, {lover} viện cớ quay về." `thiện cảm −5` · `stat.intellect +2` · `stat.health −3`
- `[Linh Lung Tâm]` **Nhìn thấu ngay** → "Ngươi cười, lấy cớ thoái thác. Tim vẫn nhói một chút." `stat.daoHeart +5` · `stat.happiness −3`

### 7. Tỏ tình `to_tinh`
Thiện cảm với `{lover}` ≥ 70 · cả hai 18+ · chưa có đạo lữ
> Đêm rằm, trên vách núi chỉ có hai người. {name} biết nếu không nói bây giờ thì sẽ không bao giờ nói.
- **Nói thẳng** · ⚄ thiện cảm + Mị lực
  - Được nhận lời: "{lover} không trả lời, chỉ nắm tay ngươi." `thành đôi (mở 3.7 đạo lữ đại điển)` · `stat.happiness +15` · `stat.daoHeart +2`
  - Bị từ chối: "'Ta coi ngươi như huynh đệ/tỷ muội.' Gió trên núi lạnh hơn ngươi tưởng." `thiện cảm −10` · `stat.happiness −15` · `stat.daoHeart +3`
- **Viết thư rồi trốn đi bế quan** → Bế quan 1 năm, kết quả như trên nhưng `stat.happiness` thay đổi chỉ một nửa. `tu vi +10%` · `stat.comprehension +1`
- **Không nói, giữ trong lòng** → "Có những người, đứng cạnh là đủ." `stat.daoHeart +3` · `stat.happiness −5` · `thiện cảm +5`

### 8. Song tu `song_tu`
Đã có đạo lữ · cả hai có linh căn · cả hai 18+ · tag: mature · lặp lại (mỗi vài năm)
> Đạo lữ khẽ nói: "Bình cảnh của ta, có lẽ cần chàng/nàng giúp một tay." Ngọn đèn trong động phủ tắt. *(chuyển cảnh)*
- **Song tu theo phép chính đạo** → "Hai luồng linh khí hòa vào nhau như hai dòng suối nhập sông." `tu vi +20% (cả hai)` · `stat.happiness +8` · Nếu linh căn khắc nhau: chỉ `+5%` và `stat.health −3`
- **Nhường hết linh khí cho đạo lữ** → "Đạo lữ đột phá. Ngươi lùi lại nửa tầng." `đạo lữ tu vi +40%` · `tu vi −10%` · `thiện cảm +20` · `stat.daoHeart +3`
- **Hẹn khi khác, chuyên tâm bế quan** → `stat.comprehension +1` · `thiện cảm −5` · `stat.happiness −2`

### 9. Tóc bạc một bên `chia_ly_tho_nguyen`
Có đạo lữ hoặc `{lover}` là phàm nhân · {name} có linh căn · chênh lệch tuổi trông thấy ≥ 20 năm · chỉ một lần
> Sáng nay {lover} soi gương, nhặt ra một sợi tóc bạc, rồi lại nhìn khuôn mặt vẫn trẻ như cũ của {name}.
- **Ở bên tới cuối đời người ấy** → "Ngươi ít bế quan, nhiều năm nấu cơm. Người ấy đi lúc đang cười." `tu vi tốc độ −30% cho tới khi {lover} mất` · `stat.happiness +10` · `stat.daoHeart +5` · *(khi {lover} mất: Vui vẻ −30 theo bảng sự kiện hệ thống)*
- **Tìm Trú Nhan Đan, kéo dài tuổi xuân cho người ấy** → "Thuốc chỉ giữ được dung nhan, không giữ được thọ nguyên. Người ấy vẫn vui." `linh thạch −30` · `stat.happiness +5` · `stat.intellect +1`
- **Rời đi khi còn đẹp** → "Ngươi đi trong một đêm. Người ấy không đuổi theo." `mất {lover}` · `stat.happiness −20` · `stat.daoHeart +5` · `flag: tam_ma_nguoi_cu`
- `[Trường Xuân Thể]` **Cùng già đi một chút cho có đôi** → "Ngươi để tóc bạc theo, người ta tưởng hai người cùng tuổi." `stat.charm −3` · `stat.happiness +10`

### 10. Người cũ trở về `nguoi_cu_tro_ve`
Từng bị từ chối hoặc từng rời bỏ một người (còn sống) · ít nhất 10 năm sau · chỉ một lần
> Ở phường thị, một bóng người quen dừng lại trước mặt {name}. Mười năm, cảnh giới người ấy đã cao hơn, hoặc thấp hơn, so với ngươi.
- **Mời một chén rượu, nói chuyện cũ** → "Không ai nhắc tới chuyện năm xưa. Chén rượu uống rất chậm." `npc bạn: người cũ` · `stat.happiness +5` · `stat.daoHeart +2` · xóa `flag: tam_ma_nguoi_cu`
- **Làm như không quen** → `stat.daoHeart −2` · `stat.happiness −3`
- **Thử nối lại** (chưa có đạo lữ) · ⚄ Mị lực 55 → thành công: `thiện cảm 50, thành {lover}` · `stat.happiness +10` · thất bại: `stat.happiness −8`
- Nếu người cũ đã nhập ma đạo: thêm lựa chọn **"Khuyên quay đầu"** · ⚄ Đạo tâm 60 → thành công: `karma +10` · `stat.daoHeart +5` · thất bại: `chiến đấu` · `stat.happiness −10`

---

## B. Giết người đoạt bảo (tag: violence, dark)

Hiệu ứng mới: `npc thù: …` (sổ ân oán 3.4), `flag: da_giet_doat_bao` (đếm số lần, mở #17).

### 11. Bí cảnh chia của `bi_canh_chia_cua`
Luyện Khí tầng 5+ · có `ban_do_bi_canh` hoặc ngẫu nhiên khi ở Lan Sơn
> Bốn người tán tu lập đội vào bí cảnh. Tới gian cuối, trên đài đá chỉ có một viên đan và ba ánh mắt đổi màu.
- **Ra tay trước** · ⚄ Chiến lực (một đấu ba, đối thủ đã bị thương)
  - Thắng: "Ngươi bước ra một mình." `nhận Trúc Cơ Đan` · `karma −20` · `flag: da_giet_doat_bao` · `stat.daoHeart −8` · `stat.health −10`
  - Thua: "Ngươi bò ra khỏi bí cảnh, mất sạch." `stat.health −30` · `stat.happiness −10`
- **Đề nghị bốc thăm** · ⚄ Khí vận 50
  - Trúng: "Ba người kia nhìn nhau. Ngươi rời đi thật nhanh." `nhận Trúc Cơ Đan` · `stat.luck +1` · `stat.happiness +5` · *(30%: bị phục kích trên đường về)*
  - Trượt: "Ngươi về tay không, nhưng còn sống." `stat.happiness −3` · `stat.daoHeart +2`
- **Nhường, lùi ra cửa** → "Sau lưng vang lên tiếng binh khí. Ngươi không quay lại." `stat.daoHeart +3` · `stat.happiness −2`
- `[Thần Thức Sơ Khai]` **Cảm được sát ý từ trước, rút lui khi còn ở gian giữa** → "Ngươi nhặt được hai món họ bỏ sót." `nhận vật phẩm ngẫu nhiên` · `stat.luck +2`

### 12. Bóng người sau lưng `bi_theo_doi`
Vừa mua hoặc bán món đắt ở phường thị (> 50 linh thạch)
> Rời phường thị chưa được mười dặm, {name} nghe tiếng lá động ở cả hai bên đường.
- **Chạy** · ⚄ Tốc độ
  - Thoát: `stat.health −2` · `stat.physique +1`
  - Bị đuổi kịp: `chiến đấu với 2 tán tu` · `stat.happiness −3`
- **Dừng lại, quay đầu phục kích** · ⚄ Chiến lực
  - Thắng: "Hai cái túi trữ vật, một cái rỗng tuếch." `linh thạch +20` · `karma −5` (giết người) hoặc `karma 0` (đánh rồi tha) · `stat.daoHeart +2` · `stat.health −5`
  - Thua: `mất món vừa mua` · `stat.health −15`
- **Quay về phường thị, ở trọ có thủ vệ** → "Mất thêm ba ngày, tốn thêm năm khối linh thạch." `linh thạch −5` · `stat.intellect +1`
- `[Kim Thiền Thoát Xác]` **Để lại áo choàng trên cành cây** → "Chúng chém vào áo choàng tới lúc trời sáng." `stat.happiness +5`

### 13. Túi trữ vật vô chủ `tui_tru_vat_vo_chu`
Luyện Khí trở lên · ngẫu nhiên khi đi đường
> Bên khe núi có xác một tu sĩ, áo mang phù hiệu Tàng Phong Kiếm Các. Túi trữ vật còn đeo bên hông.
- **Lấy hết** → "Ba mươi khối linh thạch và một thanh phi kiếm khắc tên." `linh thạch +30` · `nhận pháp bảo: phi kiếm có chủ` · `stat.daoHeart −2` · *(cầm kiếm này đi lại: 30% bị Kiếm Các hỏi tội)*
- **Lấy, rồi chôn cất tử tế** → `linh thạch +30` · `karma +2` · `stat.daoHeart +1`
- **Mang thi thể và túi về Kiếm Các** → "Sư đệ của người chết quỳ xuống cảm tạ ngươi." `danh vọng Chính +10` · `npc ân nhân: kiếm tu` · `stat.happiness +3` · `stat.daoHeart +3`
- **Xem kỹ vết thương** · ⚄ Trí tuệ 55 → thành công: "Vết thương của U Hà Huyết Ảnh Công. Kẻ giết còn ở gần." `flag: dau_vet_u_ha` · `stat.intellect +2` · thất bại: `stat.intellect +1`

### 14. Bảng treo thưởng `bang_treo_thuong`
Có linh căn · ở Vô Chủ Phường · lặp lại được
> Tờ cáo thị mới: "Truy nã kẻ trộm đan của Kim Thiềm Thương Minh. Sống hay chết đều được, thưởng 50 linh thạch."
- **Nhận việc, săn người** · ⚄ Chiến lực → thắng rồi phát hiện kẻ bị truy nã là một tán tu nghèo trộm thuốc cứu con. Chọn tiếp:
  - **Giao nộp** → `linh thạch +50` · `karma −5` · `stat.daoHeart −3`
  - **Thả đi, báo là đã chết** → `karma +8` · `stat.daoHeart +3` · `flag: lua_kim_thiem` *(bị lộ: nợ thương minh)*
  - Thua → `stat.health −10` · `stat.happiness −3`
- **Kiếm việc khác: hộ tống thương đội** → `linh thạch +15` · `stat.physique +1`
- **Đọc hết bảng rồi về** → "Biết thêm ai đang bị truy nã, ai đang đi săn." `stat.intellect +2`

### 15. Rủ rê phục kích `ru_phuc_kich`
Tán tu hoặc nhân quả ≤ 10 · Luyện Khí trở lên
> Một gã tán tu quen mặt ghé tai: "Thiếu gia Tô gia mang theo cả rương linh thạch đi ngang hẻm núi. Chia ba bảy, ngươi bảy."
- **Tham gia** · ⚄ Chiến lực (với hộ vệ Tô gia)
  - Thành công: `linh thạch +60` · `karma −15` · `flag: ke_thu_to_gia` · `stat.daoHeart −5` · `stat.happiness +3`
  - Thất bại: "Hộ vệ Tô gia là Trúc Cơ." `stat.health −25` · `flag: ke_thu_to_gia`
- **Từ chối** → `stat.daoHeart +2` · `stat.happiness −1` (tiếc rương linh thạch)
- **Báo trước cho Tô gia** → "Tô gia trả công hậu, gã tán tu từ đó nhìn ngươi như nhìn xác chết." `linh thạch +20` · `npc ân nhân: Tô gia` · `npc thù: gã tán tu` · `stat.charm +2`

### 16. Bảo quang xung thiên `bao_vat_xuat_the`
Có linh căn · gần Lan Sơn hoặc Vạn Yêu Lĩnh · hiếm
> Cột sáng vọt lên từ khe núi. Nửa ngày sau đã có trăm tu sĩ vây quanh, ai cũng chờ người khác ra tay trước.
- **Lao vào tranh** · ⚄ Chiến lực + Khí vận
  - Thành công: "Ngươi ôm được bảo vật, chạy trối chết." `nhận pháp bảo hoặc công pháp hiếm (C9–C12)` · `stat.health −15` · `stat.happiness +10` · `flag: bi_truy_tim_bao_vat`
  - Thất bại: `stat.health −20` · `stat.happiness −5`
- **Ngư ông đắc lợi: chờ hai bên đánh nhau** · ⚄ Khí vận 60 → thành công: `nhận pháp bảo` · `karma −3` · `stat.intellect +2` · thất bại: "Bảo vật bị một lão quái Kim Đan thu mất." `stat.intellect +1` · `stat.happiness −2`
- **Đứng ngoài xem** → "Ngươi học được ba chiêu, thấy năm người chết." `stat.comprehension +2` · `stat.daoHeart +2`

### 17. Kẻ đến đòi nợ máu `bao_thu_doat_bao`
Có `da_giet_doat_bao` · 3–15 năm sau
> Một thanh niên đứng chặn cửa động phủ: "Mười năm trước ở hẻm núi, ngươi còn nhớ cha ta không?"
- **Đánh** · ⚄ Chiến lực (người này đã tu luyện để báo thù, mạnh hơn ngươi tưởng)
  - Thắng, giết: `karma −10` · `flag: da_giet_doat_bao` (+1) · `stat.daoHeart −5`
  - Thắng, tha: "Hắn đi, nhưng sẽ quay lại." `stat.daoHeart +2` · `flag: thu_tro_lai`
  - Thua: `stat.health −30` · `mất một pháp bảo`
- **Nhận tội, bồi thường** → "Hắn cầm linh thạch, không nhìn ngươi." `linh thạch −50` · `karma +10` · `stat.daoHeart +5` · `stat.happiness −5`
- **Bỏ chạy, rời vùng** → `stat.happiness −8` · `stat.daoHeart −3` · *(hắn tiếp tục truy tìm)*
- `[Huyết Hải Bất Khô]` **Cười lớn, rút kiếm** → `chiến đấu (+lifesteal)` · `stat.daoHeart −2`

### 18. Bản đồ giá rẻ `ban_do_bay`
Có linh căn · tán tu hoặc đang xuống núi
> Gã bán bản đồ bí cảnh ở Vô Chủ Phường giá rẻ bất ngờ. Trên bản đồ có đánh dấu một cái hang.
- **Mua và đi theo bản đồ** → "Trong hang không có bảo vật, chỉ có sáu kẻ cầm đao. Bản đồ là mồi." `chiến đấu (bị phục kích)` · thắng: `linh thạch +30` · `stat.happiness +3` · thua: `stat.health −25` · `mất linh thạch`
- **Mua, nhưng bán lại cho kẻ khác** → `linh thạch +3` · `karma −5` · `stat.intellect +2`
- **Báo cho chấp sự phường thị** · ⚄ Mị lực 45 → thành công: `danh vọng Tán tu +10` · `stat.charm +2` · thất bại: "Chấp sự ăn chia với gã bán bản đồ." `stat.happiness −3` · `flag: ke_thu_vo_chu_phuong`
- `[Thông Minh Vặt]` **Thấy mực trên bản đồ còn mới** → `stat.intellect +2` · `stat.luck +1`

---

## C. Ma đạo cám dỗ (tag: dark)

Tăng tần suất khi Đạo tâm ở đáy (trạng thái S15) hoặc nhân quả ≤ −50. Hiệu ứng mới: `tâm ma +1` (đếm cho hệ tâm ma), `thọ nguyên −n`.

### 19. Giọng nói trong bình cảnh `huyet_te_dot_pha`
Đang kẹt bình cảnh ≥ 5 năm · tag: dark, violence
> Đêm thứ một trăm bế quan, có tiếng thì thầm: "Ngoài núi có một thôn ba trăm người. Chỉ cần ba trăm giọt máu đầu tim, bình cảnh sẽ vỡ."
- **Làm theo** → "Bình cảnh vỡ. Thôn ấy từ đó không còn tiếng gà gáy." `đột phá +40%` · `karma −40` · `tâm ma +2` · `stat.daoHeart −15` · `danh vọng Chính −30`
- **Từ chối, tiếp tục khổ tu** → `stat.daoHeart +5` · `bottleneck −10%`
- **Truy tìm nguồn của giọng nói** · ⚄ Đạo tâm 60 → thành công: "Là một tàn hồn ma tu bám vào động phủ. Ngươi diệt nó." `stat.daoHeart +8` · `stat.comprehension +2` · thất bại: `tâm ma +1` · `stat.health −10`

### 20. Ma công tàn quyển `ma_cong_tan_quyen`
Có linh căn · không phải Phật đạo
> Trong đáy một chiếc rương mua lại ở chợ đen có quyển sách da đen. Chữ đầu tiên: "Lấy huyết luyện khí, nhanh gấp ba."
- **Tu thử** → "Tu vi tăng vùn vụt. Đêm ngủ bắt đầu nghe tiếng ai khóc." `học U Hà Huyết Ảnh Công (C6)` · `đạo thống → Ma` · `stat.daoHeart −5` · `stat.health −5`
- **Đốt** → "Sách cháy ra khói đỏ, có tiếng thét rất nhỏ." `stat.daoHeart +3` · `karma +2`
- **Bán lại cho U Hà** → `linh thạch +40` · `danh vọng Ma +5` · `karma −5` · `stat.daoHeart −2`
- **Đọc để biết, không tu** · ⚄ Đạo tâm 55 → thành công: "Biết người biết ta." `stat.intellect +3` · `kháng ma công +10%` · thất bại: `tâm ma +1` · `stat.daoHeart −3`

### 21. Khuôn mặt người đã khuất `tam_ma_nguoi_than`
Có người thân đã mất · Trúc Cơ trở lên hoặc Đạo tâm ≤ 30
> Giữa lúc nhập định, {deceased} đứng trước mặt {name}, giọng y như ngày còn sống: "Sao con không cứu ta?"
- **Đáp lời, nói chuyện với bóng người** → "Bóng người cười, càng lúc càng gần." `tâm ma +1` · `stat.happiness −5` · `stat.daoHeart −5`
- **Nhắm mắt niệm tâm pháp** · ⚄ Đạo tâm 55 → thành công: "Bóng người tan như sương." `stat.daoHeart +5` · `heartDemonResist +5%` · thất bại: `tâm ma +1` · `stat.health −10`
- **Khóc một trận cho xong** → "Ngươi khóc như hồi bảy tuổi. Bóng người cũng không còn." `stat.happiness +5` · `stat.daoHeart +2`
- `[Bồ Đề Tâm]` **Nhìn thẳng, không động** → `stat.daoHeart +8` · `tâm ma −1`

### 22. Chợ lô đỉnh `lo_dinh_cam_do`
Có linh căn · ở Vô Chủ Phường hoặc U Hà · tuổi 18+ · tag: dark, mature · *ẩn khi bật "ẩn nội dung nhạy cảm"*
> Một ma tu dắt theo một nữ tu (hoặc nam tu) bị phong ấn tu vi, tay đeo xiềng. Hắn mời {name}: "Lô đỉnh tốt, linh căn Mộc thuần, giá phải chăng."
*(Người bị bán là người trưởng thành; engine chặn nếu tuổi < 18.)*
- **Mua để dùng làm lô đỉnh** → "Tu vi của ngươi tăng. Mỗi đêm ngươi ngủ ít đi một chút." `tu vi +30%` · `karma −35` · `tâm ma +2` · `stat.daoHeart −15` · `danh vọng Chính −20` · `flag: dung_lo_dinh`
- **Mua rồi giải phong ấn, thả đi** → "Người ấy đi, không ngoảnh lại. Ba năm sau gửi tới một túi linh thảo." `linh thạch −40` · `karma +15` · `npc ân nhân` · `stat.daoHeart +5` · `stat.happiness +3`
- **Ra tay giết ma tu, cứu người** · ⚄ Chiến lực → thắng: `karma +15` · `danh vọng Chính +10, Ma −15` · `stat.daoHeart +5` · thua: `stat.health −25` · `flag: ke_thu_u_ha`
- **Quay đi** → `stat.daoHeart −3` · `stat.happiness −3`

### 23. Lão nhân trong nhẫn `lao_ma_trong_nhan`
Có linh căn · chỉ một lần · tag: rare
> Chiếc nhẫn sắt nhặt bên đường bỗng nói: "Tiểu tử, căn cốt không tệ. Ta dạy ngươi tu luyện, đổi lại, mai này giúp ta một việc nhỏ."
- **Nhận lời** → "Lão chỉ điểm rất tận tình. Thỉnh thoảng lão nhìn thân thể ngươi bằng ánh mắt của người đi mua nhà." `tu vi tốc độ +25%` · `stat.comprehension +3` · `flag: lao_ma_doat_xa` *(chuỗi: tới Kim Đan, lão đòi đoạt xá; thắng thì nuốt tàn hồn, thua thì Game Over đặc biệt)*
- **Hỏi kỹ "việc nhỏ" là gì** · ⚄ Trí tuệ 60 → thành công: "Lão ấp úng. Ngươi đã hiểu." `stat.intellect +2` · `stat.daoHeart +2` · thất bại: như "Nhận lời"
- **Mang nhẫn lên Vô Ưu Tự** → "Phương trượng niệm kinh bảy ngày, chiếc nhẫn thành sắt vụn. Ngài tặng ngươi một chuỗi hạt." `karma +10` · `stat.daoHeart +5` · `danh vọng Chính +5`
- **Ném xuống sông** → "Ba năm sau, có người kể nhặt được một chiếc nhẫn biết nói." `stat.happiness +1` · `stat.luck −1`

### 24. Thuốc cứu mạng có giá `u_ha_giao_dich`
Có người thân đang bệnh nặng · đang ở tông môn chính đạo
> Người áo đen lại ngồi đối diện {name}: "Mẹ ngươi chỉ còn ba tháng. U Hà có thuốc. Đổi lại, mỗi năm một lá thư về chuyện trong {sect}."
- **Nhận lời** → "Mẹ ngươi khỏi bệnh. Mỗi năm ngươi viết một lá thư, mỗi năm ngủ ít đi một chút." `người thân khỏi bệnh` · `flag: gian_te_u_ha` · `karma −10` · `stat.happiness +10` · `stat.daoHeart −8`
- **Từ chối, tự đi tìm thuốc** · ⚄ Khí vận 55 → thành công: `người thân khỏi bệnh` · `stat.daoHeart +5` · `stat.happiness +10` · thất bại: `người thân mất` · `stat.daoHeart +3` (hối hận đi kèm tỉnh táo)
- **Báo tông môn, xin tông môn cứu** → "Bách Thảo Cốc ra tay, đòi ngươi trả bằng ba năm cống hiến." `người thân khỏi bệnh` · `cống hiến −60` · `stat.happiness +8` · `stat.daoHeart +2`

### 25. Huyết đan ở chợ đen `huyet_dan_cho_den`
Có linh căn · ở Vô Chủ Phường
> Viên đan đỏ thắm, rẻ một nửa so với Tụ Khí Đan. Người bán cười: "Đừng hỏi làm từ gì."
- **Mua và uống** → `tu vi +15%` · `karma −10` · `stat.daoHeart −5` · `stat.health +3`
- **Hỏi xem làm từ gì** · ⚄ Mị lực 50 → thành công: "Từ phàm nhân mất tích ở Diên Châu." `flag: nguon_huyet_dan` · `stat.intellect +2` · `stat.happiness −5` · thất bại: "Người bán bỏ đi, ngươi bị theo dõi." `stat.happiness −3` · `kích hoạt #12`
- **Đập vỡ sạp hàng** · ⚄ Chiến lực → thắng: `karma +8` · `danh vọng Chính +5` · `stat.daoHeart +3` · thua: `stat.health −15`
- Có `nguon_huyet_dan` và `nghi_huong_hoa_hoi`: lựa chọn **"Nối hai đầu mối, báo Bích Lạc Tông"** → `danh vọng Chính +20` · `flag: ke_thu_u_ha` · `stat.intellect +3` · `stat.daoHeart +3`

### 26. Cấm thuật đốt huyết `cam_thuat_dot_huyet`
Đang trong trận chiến thua chắc · có đồng đội, người thân hoặc đạo lữ bên cạnh
> Kẻ địch mạnh hơn cả một đại cảnh giới. Trong đầu {name} hiện lên một khẩu quyết đã thấy ở đâu đó: đốt mười năm thọ nguyên, đổi một nén nhang sức mạnh.
- **Đốt huyết** → "Ngươi thắng. Tóc ngươi bạc mất một nửa." `chiến lực ×2 trận này` · `thọ nguyên −10 năm` · `stat.health −15` · `stat.charm −3` · `stat.daoHeart +3` (vì người khác)
- **Đốt huyết, lại thêm hai mươi năm** → "Kẻ địch chết. Ngươi nằm liệt ba tháng." `chiến lực ×3` · `thọ nguyên −30 năm` · `stat.health −30` · `stat.physique −5`
- **Liều chạy, cõng theo người bên cạnh** · ⚄ Tốc độ → thành công: `stat.happiness +5` · `stat.health −10` · thất bại: `người bên cạnh trọng thương hoặc mất` · `stat.happiness −20`

---

## D. Yêu thú (tag: violence khi có giao chiến)

Vạn Yêu Điện và nhân tộc đang căng thẳng: săn yêu lấy nội đan là kết thù, ngự thú sư thì được nể. Hiệu ứng mới: `nội đan (cấp n)`, `nhận linh thú`, `danh vọng Yêu ±n`.

### 27. Yêu thú xuống làng `yeu_thu_ha_son`
Mọi người (có hoặc không có linh căn) · gần Vạn Yêu Lĩnh hoặc Nam Cương
> Đêm qua, một con hổ to bằng con trâu ba mắt tha mất hai con bò. Làng đổ xô tới nhà {name}, vì "nhà ngươi có người biết võ".
- **Cầm đao đi săn** · ⚄ Chiến lực (phàm nhân dùng cảnh giới võ đạo)
  - Thắng: "Cả làng ăn thịt hổ ba ngày." `nội đan cấp 1` (nếu là yêu thú) · `danh vọng Giang hồ +5` · `stat.happiness +5` · `stat.physique +1` · `danh vọng Yêu −3`
  - Thua: `stat.health −20` · `stat.happiness −3`
- **Bày bẫy** · ⚄ Trí tuệ 50 → thành công: `stat.intellect +2` · `stat.happiness +3` · thất bại: "Bẫy bắt được trưởng thôn." `stat.charm −2` · `stat.happiness +2`
- **Đưa cả làng lên miếu Thành Hoàng tránh** → `karma +3` · `stat.daoHeart +2` · `stat.happiness −2`
- `[Linh Tỵ]` **Ngửi thấy mùi máu non, nó đang nuôi con** → lựa chọn **đuổi đi chứ không giết** → `danh vọng Yêu +5` · `karma +3` · `stat.daoHeart +2`

### 28. Ổ trứng trong hang `trung_yeu_thu`
Có linh căn · ở Vạn Yêu Lĩnh hoặc rừng sâu
> Trong hang có một quả trứng to bằng đầu người, vỏ đỏ như than hồng. Ngoài cửa hang có dấu chân to bằng cái nong.
- **Ôm trứng chạy** · ⚄ Tốc độ → thành công: `nhận trứng linh thú (Hỏa)` · `stat.happiness +5` · `danh vọng Yêu −5` · thất bại: `stat.health −25` · `stat.happiness −5`
- **Để trứng lại, xem từ xa** → "Yêu thú mẹ về, ấp trứng, nhìn về phía ngươi rất lâu rồi thôi." `danh vọng Yêu +3` · `stat.daoHeart +2`
- **Mang trứng đi bán** (thành công như trên) → `linh thạch +40` · `stat.happiness +2`
- `[Ngự Thú cấp 2+]` **Để lại một viên linh đan thay trứng** → "Yêu thú mẹ không đuổi theo." `nhận trứng linh thú` · `danh vọng Yêu +2` · `craft.beast +5` · `stat.luck +1`

### 29. Hồ ly bị thương `yeu_ho_bi_thuong`
Có linh căn · bất kỳ đâu
> Bên bụi cỏ có một con hồ ly trắng dính bẫy, chân đầm máu. Nó nhìn {name}, không kêu.
- **Gỡ bẫy, băng bó** → "Hồ ly khập khiễng đi mất. Mấy năm sau, có kẻ trộm ghé nhà ngươi, sáng ra thấy hắn nằm ngất ngoài cổng, trên người toàn vết cào." `danh vọng Yêu +8` · `karma +5` · `stat.happiness +3` · `flag: ho_ly_bao_an`
- **Giết lấy nội đan** → "Nội đan có hai trăm năm tu vi. Nó là con của một trưởng lão Vạn Yêu Điện." `nội đan cấp 2` · `danh vọng Yêu −25` · `karma −8` · `stat.daoHeart −3` · `flag: ke_thu_van_yeu_dien`
- **Mang về nuôi** · ⚄ Mị lực 50 hoặc `craft.beast` cấp 1+ → thành công: `nhận linh thú: hồ ly` · `stat.charm +2` · thất bại: "Nó cắn ngươi rồi chạy." `stat.health −3` · `stat.happiness −1`

### 30. Đội săn yêu `doi_san_yeu`
Luyện Khí tầng 5+ · ở Vạn Yêu Lĩnh hoặc Vân Hải tam đảo · lặp lại được
> Năm tán tu lập đội săn một con hùng yêu sắp hóa hình. Họ cần thêm một người.
- **Đánh tiền tuyến** · ⚄ Chiến lực → thắng: `nội đan cấp 2 (chia đều)` · `linh thạch +20` · `stat.physique +2` · `stat.health −10` · thua: `stat.health −30`
- **Đứng sau yểm trợ** → `linh thạch +10` · `stat.intellect +1`
- **Trước khi đánh, lén thăm dò hang** · ⚄ Thần thức → thành công: "Hùng yêu đang canh một gốc linh chi nghìn năm." `nhận linh chi` · `stat.luck +2` · thất bại: `stat.health −5`
- Có `danh vọng Yêu ≥ 30`: **Báo cho hùng yêu bỏ chạy** → `danh vọng Yêu +15` · `danh vọng Tán tu −10` · `stat.daoHeart +2`

### 31. Thú triều `thu_trieu`
Ở gần Vạn Yêu Lĩnh · mỗi khoảng 30 năm · ảnh hưởng mọi nhân vật trong vùng
> Trống đồng trên tường thành đánh ba hồi. Từ bìa rừng, đàn yêu thú tràn ra như nước vỡ đê.
- **Lên tường thành giữ thành** · ⚄ Chiến lực → thắng: `danh vọng Triều đình +15` (hoặc Chính) · `nội đan ×3` · `stat.physique +2` · `stat.health −15` · thua: `stat.health −35`
- **Che chở phàm nhân rút vào nội thành** → `karma +10` · `stat.daoHeart +3` · `stat.health −5`
- **Chạy trước** → `stat.happiness −5` · `stat.daoHeart −5` · `danh vọng Triều đình −10`
- Phàm nhân không võ công: lựa chọn **"Nấu cháo cho người giữ thành"** → `karma +3` · `stat.happiness +3`

### 32. Khách lạ không có bóng `yeu_tu_hoa_hinh`
Có linh căn · tuổi 18+ · ở thành thị
> Một người khách trọ cùng quán với {name} không có bóng dưới ánh nến. Nửa đêm, y gõ cửa phòng ngươi: "Đội săn yêu đang tới. Cho ta nấp một đêm."
- **Cho nấp** → "Sáng ra y đã đi, để lại một chiếc vảy bạc." `danh vọng Yêu +10` · `nhận vảy hộ thân` · `stat.daoHeart +2` · `stat.happiness +2`
- **Báo đội săn yêu** → `linh thạch +20` · `danh vọng Yêu −15` · `stat.daoHeart −2`
- **Hỏi vì sao bị săn** · ⚄ Mị lực 45 → thành công: "Y chưa từng hại ai, chỉ là nội đan quá giá trị." `danh vọng Yêu +5` · `stat.intellect +2` · `npc bạn: yêu tu` · thất bại: "Y bỏ đi qua cửa sổ." `stat.happiness −1`

### 33. Linh thú trưởng thành `linh_thu_tien_hoa`
Đã có linh thú (`tho_trang_linh_thu`, hồ ly, trứng đã nở…) · nuôi ≥ 10 năm
> Linh thú của {name} biếng ăn ba ngày, rồi phát sáng cả một đêm.
- **Canh bên cạnh suốt đêm** → "Sáng ra nó lớn gấp đôi, liếm tay ngươi." `linh thú lên cấp` · `stat.happiness +8` · `stat.health −2` (thức trắng)
- **Cho nuốt nội đan yêu thú** (có nội đan) → `linh thú lên hai cấp` · `stat.luck +2` · `danh vọng Yêu −3`
- **Mời ngự thú sư Vạn Yêu Điện xem** → `linh thạch −10` · `craft.beast +5` · `stat.intellect +1` · `linh thú lên cấp`
- Nếu `tho_trang_linh_thu`: "Con thỏ trắng giờ to bằng con nghé, vẫn gặm linh mễ." `stat.happiness +3` (thêm)

---

## E. Phường thị

Nối với hệ thống 3.1 (túi đồ, đan dược) và 3.2 (mua bán, trả giá). Phường thị chính: Kim Thiềm Thương Minh (có quy củ, đắt), Vô Chủ Phường (chợ đen, rẻ, rủi ro).

### 34. Đấu giá Kim Thiềm `dau_gia_kim_thiem`
Có linh căn · linh thạch ≥ 50 · mỗi 5 năm
> Món cuối cùng: một viên Trúc Cơ Đan thượng phẩm. Ở phòng VIP bên cạnh, có người nâng giá đúng lúc {name} giơ thẻ.
- **Theo tới cùng** · ⚄ linh thạch so với đối thủ (ngẫu nhiên Hàn gia hoặc Tô gia) → thắng: `nhận Trúc Cơ Đan thượng phẩm` · `linh thạch −(giá)` · `stat.happiness +5` · `flag: ke_thu_doi_thu_dau_gia` · thua: `stat.happiness −3` · `stat.daoHeart +1`
- **Nâng giá rồi bỏ đúng lúc** · ⚄ Trí tuệ 55 → thành công: "Đối thủ mua với giá gấp ba." `stat.intellect +2` · `stat.happiness +5` · thất bại: "Không ai theo nữa. Ngươi phải mua." `linh thạch −(giá gấp đôi)` · `stat.happiness −5`
- **Chỉ xem, ghi chép giá cả** → `stat.intellect +2` · `flag: biet_gia_phuong_thi`
- `[Hòa Khí Sinh Tài]` **Gặp riêng đối thủ, mua lại sau buổi đấu giá** → `nhận Trúc Cơ Đan` · `linh thạch −(giá thấp)` · `stat.charm +2`

### 35. Đổ thạch `do_thach`
Có linh căn · ở phường thị · lặp lại được · tag: funny
> Chủ sạp đập đá cười toe: "Năm khối linh thạch một viên. Trong đá có linh tinh hay chỉ có đá, trời biết."
- **Mua một viên** · ⚄ Khí vận
  - Khí vận ≥ 80 (5%): "Bên trong là một khối Lôi Tinh." `nhận vật phẩm hiếm` · `stat.happiness +10` · `stat.luck +1`
  - Thường: "Đá." `linh thạch −5` · `stat.happiness −2`
- **Mua mười viên** → 90%: "Mười viên đá." `linh thạch −50` · `stat.happiness −8` · `stat.intellect +1` · 10%: `nhận vật phẩm hiếm` · `stat.happiness +10`
- **Đứng xem người khác đập** → "Một gã đập trúng linh tinh, cả phường thị reo hò. Ngươi tức anh ách." `stat.happiness −1` · `stat.intellect +1`
- `[Thần Thức Sơ Khai]` hoặc thần thức ≥ 50 **Quét thần thức qua từng viên** → "Chủ sạp đuổi ngươi đi, nhưng ngươi đã chọn được một viên." `nhận linh tinh` · `stat.luck +1` · `linh thạch −5`

### 36. Đan dược hàng giả `hang_gia_phuong_thi`
Vừa mua đan dược ở Vô Chủ Phường
> Viên Tụ Khí Đan mua hôm qua, cắn ra bên trong là bột mì trộn mật ong. Khá ngon.
- **Quay lại đòi tiền** · ⚄ Chiến lực hoặc Mị lực 50 → thành công: `linh thạch +5` · `stat.happiness +3` · thất bại: "Sạp đã dọn đi." `stat.happiness −3`
- **Ăn hết cho đỡ phí** → "No, nhưng không tăng tu vi." `stat.health +2` · `stat.happiness +1`
- **Đi rao khắp phường thị** → `danh vọng Tán tu +3` · `stat.charm +1` · `flag: ke_thu_ban_hang_gia`
- **Học cách phân biệt** · ⚄ Trí tuệ 50 → `craft.alchemy +3` · `stat.intellect +2` · *(sau này khó bị lừa hàng giả)*

### 37. Vay linh thạch `vay_kim_thiem`
Có linh căn · linh thạch < 20 · cần tiền (đột phá, cứu người, mua đan)
> Quầy cho vay của Kim Thiềm Thương Minh có treo con cóc vàng ngậm đồng xu. Lãi ba phần mỗi năm.
- **Vay 100** → `linh thạch +100` · `flag: no_kim_thiem (100, lãi 30%/năm)` · `stat.happiness +3` · *(quá 5 năm không trả: người đòi nợ tới tận động phủ)*
- **Vay, thế chấp pháp bảo** → `linh thạch +60` · `mất pháp bảo (chuộc lại được)` · `stat.happiness −2` · `stat.daoHeart +1`
- **Không vay, nhận việc của thương minh trả công** → `linh thạch +20` · `stat.physique +1` · `stat.health −3`
- Có `no_kim_thiem` quá hạn: lựa chọn **"Trốn nợ"** → `danh vọng Tán tu −10` · `stat.happiness −5` · `stat.luck −2` · *(thương minh treo thưởng)*

### 38. Bày sạp `bay_sap_phuong_thi`
Có nghề bách nghệ cấp 1+ (đan, khí, phù, linh thực…) · lặp lại được
> {name} trải tấm vải ra đất, bày ra mấy món tự làm. Hàng xóm bên trái bán phù, bên phải bán thịt yêu thú nướng.
- **Bán rẻ lấy tiếng** → `linh thạch +5` · `danh vọng Tán tu +5` · `stat.charm +2`
- **Bán đắt, nói là hàng của đại sư** · ⚄ Mị lực 55 → thành công: `linh thạch +25` · `stat.charm +1` · thất bại: "Có người nhận ra ngươi không phải đại sư." `stat.charm −2` · `stat.happiness −3`
- **Làm tại chỗ cho khách xem** · ⚄ nghề bách nghệ → thành công: `craft +3` · `linh thạch +15` · `stat.happiness +3` · thất bại: "Lò đan nổ, khói bay sang sạp thịt nướng." `stat.health −3` · `stat.happiness +1`
- `[Khéo Mồm]` **Rao hàng** → "Sạp ngươi đông nhất phố." `linh thạch +20` · `stat.happiness +3`

### 39. Báu vật dưới lớp bụi `bau_vat_lop_bui`
Ở phường thị · hiếm
> Trên sạp đồ cũ có một cái bát mẻ đựng đinh. Lúc {name} chạm vào, bát ấm lên.
- **Mua luôn cả bát lẫn đinh** · ⚄ Trí tuệ hoặc Thần thức 55 → thành công: "Là pháp bảo cổ, đã mất linh nhưng sửa được." `nhận pháp bảo cổ` · `linh thạch −2` · `stat.luck +2` · thất bại: "Là cái bát." `linh thạch −2` · `stat.happiness +1` (ít ra có bát)
- **Nói thật với ông chủ** → "Ông lão nhìn ngươi, rồi bán cho ngươi với giá một khối." `nhận pháp bảo cổ` · `karma +5` · `stat.daoHeart +3` · `npc bạn: ông lão bán đồ cũ`
- **Hỏi nguồn gốc** → "Đào từ một ngôi mộ ở Bắc Mạc." `flag: mo_co_bac_mac` · `stat.intellect +2`

### 40. Toán mệnh ở Toán Tinh Các `toan_menh`
Có linh căn · linh thạch ≥ 10 · mỗi 10 năm
> Thầy bói của Toán Tinh Các chống cằm: "Một quẻ mười khối. Không chuẩn không lấy tiền. Mà quẻ nào ta cũng chuẩn."
- **Hỏi tu đồ** → Gợi ý cơ duyên lớn trong 5 năm tới (cho biết vùng). `linh thạch −10` · `stat.luck +3` · `stat.daoHeart +1`
- **Hỏi nhân duyên** (tuổi 18+) → "Người ấy đã ở gần ngươi, ngươi chỉ chưa nhìn kỹ." `thiện cảm của NPC phù hợp +10` · `stat.happiness +3` · `linh thạch −10`
- **Hỏi thọ nguyên** → Thầy bói nhìn lâu, rồi trả lại tiền. `stat.happiness −5` · `stat.daoHeart +3`
- **Không hỏi, mà xem thầy bói tự bói cho mình** → "Lão đánh rơi mai rùa. Hôm sau Toán Tinh Các đóng cửa sạp." `stat.intellect +2` · `stat.happiness +3`
- `[Thiên Võng Hữu Lậu]` **Ngồi xuống** → "Lão bói ba lần, ba lần quẻ trắng. Lão cúi chào ngươi." `stat.luck +3` · `stat.charm +2`

---

## Ghi chú cho thread làm repo
- File: `content/worlds/thuong_lan/events/romance.json` (A), `plunder.json` (B), `demonic.json` (C), `beasts.json` (D), `market.json` (E).
- **Điều kiện tuổi**: mọi sự kiện nhóm A, #22, #32 và lựa chọn "Hỏi nhân duyên" ở #40 cần `minAge: 18` cho nhân vật **và** cho mọi NPC được nhắc. Dùng tag `mature` cho #8 và #22. Nếu NPC không còn sống, sự kiện bị tắt (`npcAlive`).
- Điều kiện mới: `npcAffinity {target, min, max}`, `hasPartner`, `npcTrait` (tính cách bản chất, 3.4), `inRegion`, `inMarket`, `hasPet`, `hasDeadRelative`, `stuckYears` (năm kẹt bình cảnh), `inBattleLosing` (#26), `spiritStones {min,max}`, `craftLevel`.
- Hiệu ứng mới: `npc.affinity`, `npc.create {role}`, `npc.remove` (mất `{lover}`), `partner.marry {political}`, `partner.cultProgress`, `heartDemon ±n`, `lifespan −n`, `pet.gain`, `pet.levelUp`, `item.gain/lose`, `debt {amount, rate}`, `faction.yeu.reputation`, `combat.powerMul {mul, scope: battle}`.
- Placeholder mới: `{lover}`, `{rival}`, `{deceased}`. Xưng hô "huynh/muội", "chàng/nàng" chọn theo giới tính hai bên.
- Flag mở chuỗi về sau: `da_giet_doat_bao` (đếm, mở #17), `lao_ma_doat_xa`, `gian_te_u_ha`, `nguon_huyet_dan`, `ho_ly_bao_an`, `ke_thu_van_yeu_dien`, `no_kim_thiem`, `dung_lo_dinh`, `tam_ma_nguoi_cu`, `mo_co_bac_mac`.
- Chủ đề cho `eventWeight`: `romance`, `romance_trouble` (Đào Hoa Kiếp), `plunder`, `demonic` (×3 khi ở trạng thái S15), `beast`, `market`.
