# Sự kiện task 3.13: ĐÃ DUYỆT 2026-10-12


Gồm hai phần:
- **A.** Chuỗi "ma tu hứa khai mạch": 3 sự kiện.
- **B.** Sự kiện cho 4 con đường đời: 12 sự kiện, mỗi đường 3.

Tổng cộng 15 sự kiện. Mỗi lựa chọn đều đổi ít nhất một chỉ số. Bậc trong con đường đời đếm từ 0: Quan lộ 0 = Tú tài, 4 = Tể tướng.

---

## A. Ma tu hứa khai mạch: chuỗi tiếp của Hương Hỏa Hội

Sự kiện đã duyệt `huong_hoa_hoi` có lựa chọn "Tin theo, nhập hội", ghi chú *(chuỗi: nhận ra / trốn / bị bắt làm vật tế)*, nhưng phần chuỗi chưa ai viết. Ba sự kiện dưới đây là phần đó.

Theo luật linh căn đã chốt, không có kết cục nào khai mạch thật. Người chơi chỉ có thể nhận ra, trốn thoát, hoặc chết.

**Bổ sung kỹ thuật:** lựa chọn "Tin theo, nhập hội" của sự kiện đã duyệt cần thêm `followUp: hang_khai_mach sau 3 năm`. Chỉ thêm móc nối, văn bản giữ nguyên.

### H1. Hang khai mạch `hang_khai_mach`
Chuỗi (theo sau nhập hội) · tag: dark, demonic
> Ba năm thờ phụng, cuối cùng {name} cũng được dẫn vào một hang sâu "để khai mạch". Trong hang đã có chín người, ai cũng gầy rộc mà mắt sáng rực. Mỗi sáng, một vị "tiên sứ" mặt trắng như giấy phát cho mỗi người một bát canh đỏ, rồi lấy bút chấm máu vẽ bùa lên ngực từng người.

- **Uống canh, chờ ngày khai mạch** → "Canh ngọt lạ. Uống xong người nhẹ bẫng, chân tay lạnh dần." `stat.health −10` · `stat.happiness +3` · `flag: uong_canh_mau` · nối tiếp H2 ngay năm đó
- **Lén đổ canh đi** · kiểm tra Trí tuệ 45
  - Thành công → "Ngươi đổ canh vào khe đá. Đêm đó cỏ trong khe héo đen." `stat.intellect +2` · `flag: tinh_tao` · nối tiếp H2
  - Thất bại → "Tiên sứ nhìn ngươi một lúc lâu, rồi múc thêm bát nữa." `stat.health −5` · `flag: uong_canh_mau` · nối tiếp H2
- **Nhìn kỹ bùa trên ngực** *(ẩn: Mắt Tinh, Linh Lung Tâm)* → "Đây không phải bùa khai mạch. Đây là ấn đánh dấu súc vật trước khi mổ." `stat.daoHeart +3` · `flag: tinh_tao` · nối tiếp H2
- **Rủ người bên cạnh cùng trốn** · kiểm tra Mị lực 55
  - Thành công → "Đêm ấy ba người lẻn ra theo lối nước. Ra tới cửa hang, trời vừa sáng." `karma +10` · `stat.happiness +5` · `stat.health −5` · kết thúc chuỗi, `flag: ke_thu_u_ha`
  - Thất bại → "Gã bên cạnh mách ngay. Tiên sứ cười: 'Đứa này thịt dai, để cuối.'" `stat.happiness −10` · `flag: bi_canh_giu` · nối tiếp H2

### H2. Đêm huyết tế `dem_huyet_te`
Chuỗi (sau H1) · tag: dark, demonic, violence
> Đêm trăng tròn, chín người bị dẫn ra một trận đồ vẽ bằng máu. Tiên sứ cởi áo choàng: hắn là tu sĩ U Hà Ma Tông. "Linh căn không có, nhưng máu thịt thì có. Các ngươi góp chút máu, giúp bổn tọa Trúc Cơ, cũng coi như thành tiên."

- **Liều mạng bỏ chạy** · kiểm tra Khí vận 50
  - Thành công → "Một con dơi bay vào mặt hắn, chậm một nhịp. Đủ cho ngươi lao vào rừng." `stat.health −10` · `stat.daoHeart +5` · `flag: ke_thu_u_ha`
  - Thất bại → "Một luồng hắc khí quất trúng lưng. Ngươi lăn xuống dốc, sống được là nhờ trời." `stat.health −40` · `stat.daoHeart +3` · `flag: ke_thu_u_ha`
- **Đánh với hắn** → giao chiến thật
  - Đối thủ: "Ma tu U Hà", Luyện Khí tầng 9, đang lập trận nên chiến lực chỉ còn ×0.5, hệ Thủy, Ma đạo, muốn giết.
  - Thắng → "Trận đồ vỡ, máu chảy ngược về người hắn. Tám người còn lại quỳ lạy ngươi." `karma +15` · `danh vọng Chính +15` · `danh vọng Ma −15` · `stat.daoHeart +8` · `vật phẩm: huyet_dan` · `flag: ke_thu_u_ha`
  - Thua → "Ngươi gục trên trận đồ. Máu ngươi chảy theo nét vẽ." `stat.health −60` · `flag: ke_thu_u_ha`
- **Phá trận** *(chỉ có khi có flag `tinh_tao`)* → "Ngươi đã thấy nét vẽ ba đêm liền. Một bàn chân xóa đúng chỗ, trận đồ phản phệ, hắn phun máu bỏ chạy." `karma +10` · `stat.intellect +3` · `stat.daoHeart +5` · `flag: ke_thu_u_ha`
- **Quỳ xin tha** · kiểm tra Mị lực 70
  - Thành công → "Hắn bật cười: 'Thú vị. Ngươi làm tạp dịch cho bổn tọa.' Ba năm sau ngươi mới trốn được." `stat.happiness −15` · `stat.daoHeart −5` · `karma −5`
  - Thất bại → "Hắn không đáp, chỉ chấm bút vào máu." `stat.health −80`

### H3. Kẻ nhớ mặt `u_ha_nho_mat`
Có flag `ke_thu_u_ha` · 2–10 năm sau · tag: demonic
> Một đêm, có người gõ cửa. Ngoài cửa không ai, chỉ có một con hạc giấy đen. Trên cánh viết: "Bổn tọa nhớ mặt ngươi."

- **Đốt hạc giấy, dọn nhà đi** → `stat.happiness −5` · `silver −50` · `stat.daoHeart +2`
- **Mang tới Khâm Thiên Giám** → "Cung phụng Khâm Thiên Giám nhìn hạc giấy, mặt tái đi, rồi cho ngươi một lá bùa hộ thân." `danh vọng Triều đình +5` · `vật phẩm: bua_binh_an` · `stat.daoHeart +3`
- **Treo hạc giấy lên cửa, chờ** → tạo NPC "ma tu U Hà", oán 40 (sổ ân oán của task 3.4: từ đây y có thể tự tìm tới báo thù). `stat.daoHeart +5` · `stat.happiness −3`

---

## B. Sự kiện con đường đời

Đã có sẵn: Quan lộ 2 (Thi Hương, Án oan ở huyện), Thương lộ 2 (Mở tiệm, Thương chiến), Võ lâm 1 (Đại hội võ lâm), Y lộ 1 (Dịch bệnh Trung Nguyên).

Mỗi đường thêm 3 sự kiện ở các bậc giữa và cao, để leo được tới bậc 5 bằng sự kiện chứ không chỉ chờ tự thăng.

### Quan lộ

**Q1. Thi Hội ở kinh thành** `thi_hoi` · Quan lộ bậc 1 (Cử nhân)
> Ba nghìn cử nhân, ba trăm suất tiến sĩ. Ngoài trường thi có người bán "đề thi năm nay", giá năm trăm lượng, bao đỗ.
- **Dốc sức thi** · kiểm tra Trí tuệ 60
  - Thành công → thăng bậc · `stat.happiness +10` · `danh vọng Triều đình +10`
  - Thất bại → "Bảng vàng dài ba trượng, không có tên ngươi." `stat.happiness −10` · `stat.daoHeart +2`
- **Mua đề** → "Đề thật. Ngươi đỗ. Ba năm sau kẻ bán đề bị bắt, khai ra hai trăm cái tên." thăng bậc · `silver −500` · `karma −10` · `flag: mua_de` · `stat.happiness +5`
- **Bỏ thi, về quê dạy học** → `stat.happiness +5` · `stat.intellect +2` · rời con đường

**Q2. Hạn hán ba năm** `han_han_ba_nam` · Quan lộ bậc 3+ (Tri phủ)
> Ba năm không mưa. Kho lương của phủ đầy, nhưng chưa có chiếu chỉ thì không được mở.
- **Mở kho phát chẩn, chịu tội sau** → "Dân lập miếu sống thờ ngươi. Triều đình phạt ba năm bổng lộc." `karma +15` · `danh vọng Triều đình −10` · `stat.daoHeart +5` · `stat.charm +5`
- **Dâng sớ xin mở kho** · kiểm tra Mị lực 55
  - Thành công → thăng bậc · `danh vọng Triều đình +15` · `karma +5` · `stat.happiness +5`
  - Thất bại → "Chiếu chỉ về tới nơi thì dân đã chết một phần ba." `stat.happiness −15` · `karma −3`
- **Bán lương giá cao cho thương hội** → `silver +1000` · `karma −15` · `stat.daoHeart −5`

**Q3. Gian thần trong triều** `gian_than_trieu` · Quan lộ bậc 3 (Tri phủ)
> Thừa tướng gửi thư mời ngươi "uống trà". Ai uống trà với ông ta thì lên chức, ai không uống thì tự dưng ngã ngựa.
- **Uống trà, theo phe thừa tướng** → thăng bậc · `karma −10` · `stat.daoHeart −3` · `flag: phe_thua_tuong`
- **Dâng sớ vạch tội** · kiểm tra Trí tuệ 65
  - Thành công → "Chứng cứ rành rành, thừa tướng bị tịch biên. Thiên tử gọi ngươi vào cung." thăng bậc · `karma +10` · `danh vọng Triều đình +20` · `stat.daoHeart +5`
  - Thất bại → "Ngươi bị đánh bốn mươi trượng, cách chức, đuổi về quê." `stat.health −25` · `stat.happiness −10` · rời con đường
- **Cáo quan về quê** → `stat.happiness +10` · `stat.daoHeart +3` · rời con đường

### Thương lộ

**T1. Chuyến hàng qua núi** `hang_qua_nui` · Thương lộ bậc 1–2
> Một chuyến tơ lụa sang phủ bên lãi gấp ba, nhưng đường núi có sơn tặc.
- **Thuê tiêu cục** → thăng bậc · `silver −200` · `stat.happiness +5`
- **Đi đường vòng** → "Mất thêm hai tháng, lụa ẩm mất một nửa." `silver +50` · `stat.intellect +1`
- **Tự áp tải** → giao chiến thật
  - Đối thủ: "Đầu lĩnh sơn tặc", phàm nhân, chiến lực ×1.2, muốn cướp.
  - Thắng → thăng bậc · `silver +300` · `danh vọng Giang hồ +5` · `stat.physique +2`
  - Thua → `stat.health −10` · `stat.happiness −5`

**T2. Khách hàng đeo kiếm bay** `khach_deo_kiem` · Thương lộ bậc 2+ (Phú hộ)
> Một tu sĩ hạ kiếm trước tiệm, muốn mua ba trăm thạch gạo. "Bạc thì ta không có. Linh thạch, lấy không?"
- **Lấy linh thạch** → `spiritStones +20` · `danh vọng Tán tu +5` · `stat.luck +1`
- **Đòi bạc** → "Tu sĩ lục túi, đưa ra một thỏi vàng to bằng nắm tay." `silver +800` · `stat.happiness +3`
- **Xin y chỉ đường tu tiên** · kiểm tra Mị lực 60
  - Thành công → "Y cười, để lại một quyển sách mỏng: 'Có duyên thì đọc.'" `stat.comprehension +2` · `stat.daoHeart +3` · `flag: tu_si_chi_duong`
  - Thất bại → "Y nhìn ngươi như nhìn một bao gạo." `stat.happiness −3`

**T3. Tuyển hoàng thương** `tuyen_hoang_thuong` · Thương lộ bậc 3 (Đại thương gia)
> Nội vụ phủ chọn nhà cung ứng cho hoàng cung. Thái giám phụ trách ra giá rất rõ ràng.
- **Đút lót thái giám** → thăng bậc · `silver −2000` · `karma −5` · `stat.happiness +5`
- **Dâng hàng tốt nhất** · kiểm tra Khí vận 55
  - Thành công → thăng bậc · `danh vọng Triều đình +10` · `stat.happiness +10`
  - Thất bại → "Hàng tốt, nhưng thái giám chê 'màu không hợp mệnh'." `silver −500` · `stat.happiness −5`
- **Không màng** → `stat.happiness +5` · `stat.daoHeart +3`

### Võ lâm

**V1. Mở võ quán** `mo_vo_quan` · Võ lâm bậc 0–1
> Trong trấn chưa có võ quán. Bên trấn bên kia có, và thầy ở đó tuyên bố "đánh đâu thắng đó".
- **Thuê nhà mở quán** → thăng bậc · `silver −100` · `stat.charm +2`
- **Đi làm tiêu sư kiếm vốn** → `silver +150` · `stat.physique +2`
- **Sang đá quán bên kia** → giao chiến thật
  - Đối thủ: "Quán chủ", phàm nhân, ngang sức, chỉ muốn dạy dỗ.
  - Thắng → "Tấm biển 'đánh đâu thắng đó' được mang sang treo ở quán ngươi." thăng bậc · `danh vọng Giang hồ +10` · `stat.happiness +5`
  - Thua → `stat.health −10` · `stat.charm −3`

**V2. Thư hẹn đỉnh núi** `thu_hen_dinh_nui` · Võ lâm bậc 2 (Cao thủ)
> Một cao thủ thành danh gửi thư hẹn: "Rằm tháng tám, đỉnh Vọng Nguyệt, phân cao thấp."
- **Nhận lời** → giao chiến thật
  - Đối thủ: "Cao thủ thành danh", phàm nhân, chiến lực ×1.1, chỉ muốn dạy dỗ.
  - Thắng → thăng bậc · `danh vọng Giang hồ +15` · `stat.happiness +10`
  - Thua → `stat.health −10` · `stat.happiness −10`
- **Từ chối** → "Giang hồ đồn ngươi sợ." `stat.charm −3` · `stat.daoHeart +2`
- **Mang rượu lên núi trước** → "Đánh thì chưa đánh, uống thì đã say. Từ đó thành bằng hữu." tạo NPC bằng hữu, thiện cảm +25 · `stat.charm +3` · `stat.happiness +5`

**V3. Huyết án võ lâm** `huyet_an_vo_lam` · Võ lâm bậc 3 (Tông sư)
> Cả một môn phái bị diệt trong một đêm. Xác không có vết thương, chỉ khô quắt như bị hút cạn. Võ lâm nhìn về phía ngươi.
- **Dẫn người truy tìm** → giao chiến thật
  - Đối thủ: "Ma tu hút máu", Luyện Khí tầng 1, chiến lực ×0.8, Ma đạo, muốn giết. Phàm nhân đánh tu sĩ là liều mạng.
  - Thắng → "Một tông sư phàm nhân giết được tu sĩ: chuyện trăm năm chưa có." thăng bậc · `danh vọng Giang hồ +25` · `danh vọng Chính +10` · `stat.daoHeart +5`
  - Thua → `stat.health −30` · `stat.happiness −5`
- **Báo Khâm Thiên Giám** → `danh vọng Triều đình +10` · `danh vọng Giang hồ −5` · `stat.intellect +1`
- **Đóng cửa giữ mình** → `stat.happiness −5` · `danh vọng Giang hồ −10` · `stat.health +2`

### Y lộ

**Y1. Bệnh lạ** `benh_la` · Y lộ bậc 0–1
> Bệnh nhân sốt hầm hập mà sờ vào lạnh như băng. Thầy ngươi lắc đầu, đi ngủ.
- **Thử phương mới** · kiểm tra Trí tuệ 50
  - Thành công → thăng bậc · `karma +3` · `stat.intellect +2`
  - Thất bại → "Bệnh nhân không chết, nhưng cả nhà họ ghi nhớ ngươi." `karma −3` · `stat.happiness −5`
- **Lật sách cả đêm** → `stat.intellect +3` · `stat.health −2`
- **Dùng linh thảo trăm năm** *(cần có `linh_thao_tram_nam` trong túi)* → "Một lát cắt linh thảo, bệnh lui như nước rút." thăng bậc · bỏ đi `linh_thao_tram_nam` · `karma +5` · `stat.happiness +3`

**Y2. Khách nửa đêm** `khach_nua_dem` · Y lộ bậc 2 (Danh y)
> Nửa đêm có người đập cửa. Một tu sĩ máu me đầy người: "Chữa cho ta. Đừng hỏi."
- **Chữa** · kiểm tra Trí tuệ 60
  - Thành công → "Sáng ra y biến mất, để lại năm viên linh thạch, và một câu: 'Ơn này ta nhớ.'" `spiritStones +5` · tạo NPC "người mang ơn", ân 30 · `stat.comprehension +2`
  - Thất bại → "Y tự băng bó rồi đi, không nhìn lại." `stat.happiness −3` · `stat.intellect +1`
- **Báo quan** → `danh vọng Triều đình +5` · `karma −3` · `stat.daoHeart −2`
- **Không mở cửa** → `stat.daoHeart −2` · `stat.health +1`

**Y3. Hoàng hậu lâm bệnh** `hoang_hau_lam_benh` · Y lộ bậc 3 (Ngự y)
> Hoàng hậu bệnh đã ba tháng. Mười ngự y trước ngươi đều kê thuốc bổ, và đều còn đầu.
- **Bắt mạch thật kỹ, chữa thật** · kiểm tra Trí tuệ 65
  - Thành công → thăng bậc · `danh vọng Triều đình +20` · `stat.happiness +10`
  - Thất bại → "Bệnh nặng thêm. Ngươi bị phạt trượng, may còn đầu." `stat.health −20` · `stat.happiness −10`
- **Kê thuốc bổ như mọi người** → `silver +200` · `stat.happiness −3` · `stat.daoHeart −2`
- **Nhận ra hoàng hậu bị đầu độc** *(ẩn: Mắt Tinh, Linh Lung Tâm)* → "Thuốc độc nằm trong hương trầm. Hoàng hậu khỏi bệnh, còn kẻ hạ độc thì ngươi chưa biết là ai." thăng bậc · `karma +10` · `stat.intellect +3` · `flag: ke_thu_hoang_cung`

---

## Bổ sung kỹ thuật

- Mọi trận đánh dùng giao chiến của task 3.3. Hai trận "ma tu hút máu" và "ma tu U Hà" là phàm nhân đánh tu sĩ, khó thắng có chủ ý.
- H3 dùng `meetNpc` của task 3.4 để tạo kẻ thù trong sổ ân oán. V2 và Y2 dùng nó để tạo bằng hữu và người mang ơn.
- Y1 cần thêm một điều kiện "có vật phẩm trong túi" cho lựa chọn. Phiên kia đã thêm điều kiện vật phẩm ở 3.9, nên không cần code mới.
- Không trùng `id` với 110 sự kiện hiện có (đã kiểm tra).
