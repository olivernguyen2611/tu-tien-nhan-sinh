# Nhật ký thay đổi


## Thức tỉnh thể chất đặc biệt (2026-10-12)
- Hiệu ứng sự kiện mới `awakenBody`: người đã có linh căn dùng được (chưa có thể chất) thức tỉnh một thể chất tiềm ẩn, thay linh căn ngũ hành bằng thể chất và nhận chỉ số một lần. Người không linh căn không bao giờ nhận được (giữ luật linh căn trời sinh).
- 8 kỳ ngộ mới (`body-awakening.json`) cho Cửu Dương, Thái Âm, Kim Cương, Bàn Thạch, Vạn Độc, U Minh, Tiên Thiên Đạo Cốt, Thiên Sinh Ma Thể; mỗi kỳ ngộ có điều kiện chỉ số riêng, hao sức khỏe, có thể từ chối. Lưu Ly, Hỗn Độn, Thiên Tuyệt Mạch vẫn chỉ trời sinh.
- Developer mode: chọn thể chất + nút "Thức tỉnh" (áp dụng cả khi không linh căn).

## [Chưa phát hành]

### Thái Sơ Diễn Đạo Kinh lên Vô Thượng phẩm (2026-10-15)
- Phẩm công pháp mới **Vô Thượng** (trên Thiên phẩm; hệ số tu luyện ×3,0 so với ×2,0 của Thiên). Thái Sơ Diễn Đạo Kinh là công pháp duy nhất ở phẩm này: thiên địa tự diễn luyện, không ai viết ra.
- Mạnh hơn: tốc độ tu luyện +30%, đột phá +10 (đại cảnh giới +20), vượt bình cảnh +30%, kháng tâm ma +30%, thọ nguyên +20%, chiến lực +25%, uy lực mọi hệ +15%, đỡ thiên lôi 15%; phần bù cho linh căn yếu gấp đôi (ngũ linh căn +100%).
- Khó đạt hơn nhiều: bỏ khỏi phường thị; kỳ ngộ Di tích thượng cổ nay cần Khí vận ≥ 90, Ngộ tính ≥ 80, Đạo tâm ≥ 70, hiếm gấp ba lần so với trước, và phải qua phép thử Ngộ tính độ khó 95 (thất bại bị phản phệ, mất cơ duyên).
- Test `tests/thai-so.test.ts`.

### 9.0.4: bản sắc tông môn, gia phong gia tộc (bước đầu) (2026-10-15)
- Mỗi tông môn có mục **Bản sắc** (`sects.json` trường `identity`): truyền thống, tuyệt kỹ, giai thoại, đối thủ (Bích Lạc và Tàng Phong tranh kiếm đạo, Bách Thảo Cốc và U Hà Ma Tông thù nhau vì độc), nhân vật nổi bật (chưởng môn, thiên tài, các chủ…). Hiện ở bảng Tông môn và danh sách xin bái nhập.
- Gia quy của gia tộc có thêm **gia phong** (`clan.json` trường `tradition`) hiện dưới từng gia quy.
- Chưa làm (để cho 10.11, 13.4): chuỗi sự kiện theo thế hệ (tế tổ, tranh gia chủ, hôn nhân liên gia), nhân vật nổi bật ảnh hưởng gameplay, thi đua tông-tông/tộc-tộc.

### 9.0.3: tương tác theo mức thân và sự kiện chung (2026-10-15)
- Người quen có **việc làm theo mức thân** (`content/npc-acts.json`): quen biết thì uống trà, hỏi thăm tin tức; từ có cảm tình thì rủ uống rượu, ngao du, nhờ giúp đỡ, cùng tu luyện (hai tu sĩ); thân thiết thì tâm sự, xin chỉ điểm; người có hiềm khích thì dò la, cầu hòa, đối đầu. Mỗi việc một lần mỗi năm mỗi người. Người thân bậc 3 thấy ít nhất 6 việc khác nhau.
- **Sự kiện chung** mới (`events/bond.json`, 10 sự kiện): bạn thân thỉnh thoảng tìm tới (trigger `bond`, `balance.npcs.bondAt/bondChance/bondGapYears`): cùng uống rượu, nhờ việc, hiểu lầm, cùng gặp nạn, thiệp mời, bạn sa cơ, kẻ thù chung, cùng ngộ đạo; từ thân 85 là kết nghĩa kim lan; từ 90 là tâm sự đêm khuya. Điều kiện sự kiện thêm `npc.minAffinity/maxAffinity`.
- Chưa làm: thiện cảm người cũ tự phai theo năm, chuỗi riêng từng cặp theo nhiều bước (hiện chia theo bậc thân).

### 9.0.5: giao diện thu gọn, bấm mới xổ danh sách (2026-10-15)
- Component `Fold` (mục thu gọn, đầu mục kèm số lượng, nhớ mục đã mở trong phiên). Áp dụng cho bảng Tông môn (nhiệm vụ, chuỗi, bảo khố, công pháp, sư phụ, đồng môn), bảng Tu luyện (bí tịch, bế quan, động phủ, võ đạo, đường đời, đạo thống, bách nghệ, bảng xếp hạng), tông môn riêng (trưởng lão, chiêu mộ, công trình) và mỗi người quen trong Quan hệ (mục "Tương tác" chứa các nút).
- Chưa làm: tách tab riêng cho tông môn, bố cục hai cột máy tính, chấm báo việc cần làm; chờ dock mới (9.7). Chưa kiểm ảnh 320/390/1280.

### 9.0.2: tặng đồ từ túi cho mọi người quen (2026-10-15)
- Mỗi người quen còn sống (trừ đồ đệ và đạo lữ đã có đường riêng) có hàng **Tặng đồ**: chọn một món trong túi, danh sách chia nhóm theo loại, gợi ý "hợp gu / không hợp gu" khi đã biết bản chất họ. Mỗi người một món mỗi năm.
- Phản ứng theo bản chất: tham lam mê pháp khí, mưu mô thích trận pháp và phù lục, v.v. (`balance.npcGift.taste`). Tu sĩ nhận đan dược thì tu vi tăng, nhận pháp khí thì tư chất tăng; phàm nhân chỉ cất giữ nên thiện cảm tăng ít hơn. Người đang lạnh nhạt có thể từ chối (đồ ở lại túi); tặng cho người có hiềm khích làm nguôi bớt thù oán.
- Mã nguồn `systems/npcGift.ts`, UI `NpcGiftRow.tsx`, lời trong `life-texts.json`. Trường tùy chọn `Npc.lastGift` (save cũ không cần migration). Test `tests/npc-gift.test.ts`.

### 9.0.1: người cũ vẫn tương tác được (2026-10-15)
- Chia tay hay hòa ly xong, người cũ không còn bị khóa: có 4 hành động riêng là **Xin lỗi, đền bù** (tốn tiền, tăng thiện cảm), **Hóa giải hiềm khích**, **Nối lại duyên** (cần thiện cảm đủ cao, xác suất theo thiện cảm và mị lực, thành công thì thành đôi lại) và **Cắt đứt hẳn** (không theo đuổi lại được). Mọi con số nằm ở `balance.romance`, lời ở `romance.json`.
- Save: thêm trường tùy chọn `romance.cut`, save cũ không cần migration. Test mới `tests/romance-ex.test.ts`.
- Chưa làm: thiện cảm người cũ tự phai/hồi theo năm và cờ mức độ phũ của sự kiện từ hôn; để dành cho 9.0.3.

### GĐ 6d.4: cao nhân trở lại ở Ngũ khí triều nguyên (2026-10-15)
- Đạt Ngũ khí triều nguyên, lão nhân năm xưa hiện ra lần nữa, bấy giờ đã có linh căn Ngũ khí nên **Cửu Chuyển Kim Cốt Quyết** tu được: vào Luyện Khí 1 với chính công pháp này (thay Dẫn Khí Quyết mặc định), Tiên Võ thể đi kèm. Luôn được tặng kể cả khi đi tắt bằng dev mode.

### GĐ 6d.3: Hóa cảnh, cao nhân tặng kinh chưa tu được (2026-10-15)
- Đạt **Hóa cảnh** là một cao nhân hiện ra tặng **Cửu Chuyển Kim Cốt Quyết** (vào mục Bí tịch). Vì chưa có linh căn nên chưa tu được (hiện đúng lý do "Không có linh căn…"), kinh nằm đó chờ tới Ngũ khí.
- Cao nhân dạy thay một công phu phàm nhân, **Dưỡng Nguyên Vận Thể Công** (`martial.json` `manual`): sức chiến +20%, thọ nguyên +8 năm, Căn cốt +3 một lần. Vừa phải, không bằng công pháp tu sĩ; bỏ đi khi đạt Ngũ khí. Hiện ở mục Võ đạo của bảng Tu luyện.
- Sửa kèm: sức chiến của phàm nhân nay tính theo cảnh giới võ đạo (`balance.martial.combatPower`, trước đây bảng này chưa được nối vào giao chiến).
- Save: người đã ở Hóa cảnh/Tam hoa được tặng muộn (không cộng thọ nguyên). Dev mode: chọn cảnh giới võ đạo từ Hóa cảnh trở lên cũng nhận quà.

### GĐ 6d.2: linh căn Ngũ khí và Tiên Võ thể (2026-10-15)
- Hạng linh căn mới **Ngũ khí** (`roots.json`, không lăn ngẫu nhiên, chỉ có khi đạt Ngũ khí triều nguyên): tốc độ tu 1,25 (ngũ linh căn 0,4; song 1,0) cùng hiệu ứng riêng +25% tốc độ tu, +0,1 chống nghẽn, +4% đột phá. Hạng linh căn giờ có thể mang `effects`.
- Thể chất mới **Tiên Võ thể** (không lăn ngẫu nhiên): Căn cốt +10, thân luyện +40, giảm thương tích 30%, sức chiến +15%, thọ +10%. Đạt Ngũ khí triều nguyên là có cả hai (`martial.json` `ascend`); hiệu ứng nhập tiên cũ giảm tốc độ +100% xuống +25% vì linh căn đã mạnh hơn.
- Save v3 cũng nâng người đã nhập tiên bằng võ đạo (Ngũ linh căn cũ) lên Ngũ khí + Tiên Võ thể. Dev mode có thêm nhóm "Linh căn võ đạo".

### GĐ 6d.1: tách thể chất khỏi linh căn (2026-10-15)
- Thể chất đặc biệt không còn thay linh căn: bỏ hạng `the_chat`. Linh căn lăn riêng; thể chất lăn riêng (`balance.roots.bodyChance` 0,4%) lúc thử linh căn, chỉ thêm hiệu ứng đặc biệt. Người không linh căn có thể chất vẫn không tu được. Công pháp tự thích ứng (Thái Sơ) chỉ xét linh căn; Lưu Ly Linh Thể vẫn hợp mọi công pháp.
- Thức tỉnh thể chất giữ nguyên linh căn. Con cái thừa hưởng thể chất của cha mẹ riêng với linh căn. Linh căn biến dị chỉ chứa một hệ biến dị, không kèm hệ thường (có test).
- Save v3: đời cũ có thể chất thay linh căn được trả một linh căn Tam hoặc Song (lăn theo seed của đời, ổn định), con cái cũng vậy; thể chất được giữ.
- Dev mode: đặt linh căn không còn xóa thể chất, đặt thể chất không đụng linh căn. Giao diện hiện hai dòng Linh căn và Thể chất riêng.

### GĐ 6c.9: cân lại trần đột phá, giao diện, dọn PLAN (2026-10-13)
- Trần cộng dồn đột phá đại cảnh giới chốt lại sau khi các bước 6c.2-6c.5 làm game khó thêm: Trúc Cơ 34, Kim Đan 32, Nguyên Anh 30, Hóa Thần 26 điểm (`majorModifierCap`; trước đó 36/36/34/38). Chặn trên của tỉ lệ thành công (cơ sở + trần): Trúc Cơ 64%, Kim Đan 52%, Nguyên Anh 42%, Hóa Thần 34%, so với 87% và 81% ở Nguyên Anh và Hóa Thần trong bản đánh giá.
- Người chơi máy (`--profile player`) đột phá từ 30% trở lên (trước 40%), vì trần mới thấp hơn.
- Mô phỏng 1500 đời `--profile player`, tổng sau 6c.1-6c.9: Kim Đan 13.5%, Nguyên Anh 3.3%, Hóa Thần 0.5% (trước 6c: 21.3% / 8.3% / 4%), tuổi thọ trung vị 68 (trước 78). Hơi thấp hơn chỉ tiêu trong kế hoạch (15-25 / 4-8 / 1-3) vì người chơi máy yếu hơn người thật: chết sớm vì giao chiến (50% số cái chết), không ngao du, không dùng khí vận. Người chơi thật vẫn có nhiều đòn bẩy hơn; cần một lượt chơi giao diện sau khi merge để xác nhận Hóa Thần còn tới được.
- Giao diện: bảng Tu luyện, Tông môn dùng hai cột trên màn từ 1100px (đã chụp ảnh 1280px); dev panel không còn tràn ngang ở 390px và 320px (`flex-wrap`); màn 320px có avatar, nhãn dock, thẻ mục tiêu và hướng dẫn gọn hơn.
- PLAN.md: đánh dấu 5c.7, thêm hàng 5c.8 còn thiếu.

### GĐ 6c.8: di nguyện, mục tiêu hậu Hóa Thần (2026-10-13)
- Không thêm cảnh giới. Từ Hóa Thần, dòng **Mục tiêu** hiện **di nguyện chưa thành** đầu tiên thay cho "Đường tu còn dài": đứng trên đỉnh Hóa Thần, có người nối nghiệp, mở sơn môn muôn đời, con cháu đầy nhà, bạn đường trăm năm, tay không vấy máu oan, tên khắc trên bảng vàng, dựng gia tộc, lòng như nước lặng, hưởng trọn thọ nguyên (10 di nguyện trong `achievements.json`, dùng lại bộ kiểm tra của thành tựu).
- Mỗi di nguyện đã thành khi lìa đời cho thêm 4 điểm Luân Hồi (`rebirth.wish`), hiện thành dòng "Di nguyện: …" ở màn kết thúc. Nhờ vậy 118 năm sau viên mãn có việc để làm, và kiếp sau hưởng được.
- Test mới (`tests/wishes.test.ts`).

### GĐ 6c.7: sự kiện Kim Đan, Nguyên Anh, Hóa Thần (2026-10-13)
- 30 sự kiện mới (`events/high-realm.json`, id `hr_`): 10 từ Kim Đan, 10 từ Nguyên Anh, 10 từ Hóa Thần. Nội dung do Claude quyết theo luật GĐ 4+, chủ dự án duyệt sau. Mọi lựa chọn đều đổi ít nhất một chỉ số; validator sạch.
- Ba chủ đề trước đây thiếu: **báo ứng** (oan hồn đòi nợ khi nghiệp nặng, thư đền ơn khi nhiều thiện, ác nghiệp chồng chất, di vật kẻ bại trận), **lừa đảo** (bảo vật tổ truyền, đan độc bán rẻ), **bi kịch gia đình** (tin cha mẹ già và mất, đệ tử bỏ sơn môn, đạo lữ giấu chuyện, người xưa gõ cửa, bạn cũ mất tích, bạn cũ nhập ma). Kèm kịch bản cảnh giới cao: Nguyên Anh rời thể, thiên cơ rối loạn, chư thiên giáng thế, kiếp nạn chồng kiếp nạn, đệ tử cuối, thọ nguyên cạn, thiên đạo hỏi.
- **Kháng mị thuật (`charmResist`) có tác dụng**: lựa chọn có kiểm tra thêm trường `check.resist` (`charmResist` hoặc `heartDemonResist`); mỗi điểm hook làm cửa kiểm tra dễ đi `events.check.resistPoints` (100) điểm độ khó. Hai sự kiện mị hoặc ("Nụ cười không rõ gốc gác", "Ma nữ cầu bạn đồng hành") dùng nó, chỉ cho nhân vật từ 18 tuổi.
- Mô phỏng 250 đời `--profile player`: các sự kiện Kim Đan xuất hiện 34-49 lần; Nguyên Anh 8-12 lần; Hóa Thần và các sự kiện cần đạo lữ, tông môn, cha mẹ còn sống không xuất hiện vì bot không có (đã có test kiểm tra trọng số).

### GĐ 6c.6: bớt lặp nhật ký và văn bản (2026-10-13)
- "Báo cáo của tông" (tông môn tự lập) chỉ vào nhật ký mỗi 5 năm (`founding.reportLogEvery`), hoặc ngay khi tông biến động mạnh (số đệ tử đổi từ 10% hoặc kho cạn). Bảng Tông môn vẫn có báo cáo và quyết định mỗi năm. Bản đánh giá ghi dòng này chiếm 110 trong 141 năm.
- "Báo ân" và các lần NPC đến trả ơn cách nhau ít nhất 8 năm (`npcs.repayGapYears`); trước đó tới 21 lần một đời.
- Thêm biến thể văn bản: Song tu 1 → 6, Bầu bạn 6 → 10, Hỏi han 2 → 6, Phụ việc nhà 2 → 5, Chăm sóc 2 → 5, Cãi nhau 2 → 5, Xin tiền 1 → 3, Luận bàn / Luận đạo / Truyền công pháp / Tặng vật phẩm với con và đạo lữ 3 → 5 mỗi loại.
- Ghi chú: `romance.texts.dualCult` đổi từ một chuỗi thành danh sách.

### GĐ 6c.5: kinh tế người tu (2026-10-13)
- Bạc không còn vô dụng sau khi nhập đạo: mỗi năm Thương hội tự đổi bạc của người tu từ Luyện Khí trở lên lấy linh thạch, 100 bạc một linh thạch (`economy.silverPerStone`, giá bất lợi), ghi một dòng nhật ký.
- Nuôi người: từ Trúc Cơ, mỗi con, đạo lữ, đồ đệ còn sống (tối đa 6) ăn tiêu linh thạch mỗi năm theo cảnh giới (Trúc Cơ 0,5, Kim Đan 1, Nguyên Anh 2, Hóa Thần 4). Thiếu linh thạch thì mất 3 hạnh phúc và hết sạch linh thạch.
- Mô phỏng: linh thạch lúc chết trung vị 218 → 174, số đời còn từ 500 linh thạch 14% → 13%.
- Test mới (`tests/economy.test.ts`).

### GĐ 6c.4: chỉ số không còn dính 100 (2026-10-13)
- Hạnh phúc, trí tuệ và mị lực tăng chậm dần khi đã cao (`statGain`): từ 70 điểm chỉ tính một nửa, từ 90 chỉ tính một phần tư. Chỉ áp cho phần cộng thường (kết quả sự kiện thường, nhiệm vụ tông); kỳ ngộ, mất điểm và các chỉ số khác giữ nguyên. Bản đánh giá ghi Trí tuệ 100 từ tuổi 23, Mị lực 100 từ 53, Hạnh phúc dính 93-100.
- Bộ mô phỏng in thêm "Số năm sống có chỉ số từ 95" cho từng chỉ số (bản mô phỏng người chơi máy ra hạnh phúc 0%, trí tuệ 6%, mị lực 6%; người thật chơi lâu và ngao du nhiều hơn nên cao hơn, cần đối chiếu lại bằng bot giao diện).
- Test mới cho độ nén.

### GĐ 6c.3: tai ương trên đường tu (2026-10-13)
- Người tu từ Trúc Cơ trở lên không còn an toàn tuyệt đối: mỗi năm có khả năng gặp **tai ương** (phản phệ linh khí, tán tu báo thù, độc chướng, yêu thú, đan độc, cấm chế nổ), mất sức khỏe. Tỉ lệ và mức mất theo cảnh giới (`aging.calamity`: Trúc Cơ 2%, Kim Đan 5%, Nguyên Anh 7%, Hóa Thần 9% mỗi năm); khí vận và thể chất giảm tỉ lệ, sàn 1%. Bản đánh giá ghi cơ thể người tu già chậm nên chẳng còn mối nguy nào sau Trúc Cơ.
- Nguyên nhân chết mới `calamity` ("Mất năm N tuổi vì tai ương trên đường tu"): người tu từ Trúc Cơ cạn sức khỏe thì chết vì tai ương, phàm nhân và Luyện Khí vẫn là bệnh. Thêm vào dev mode, thành tựu, hồn ma (`ghost.causeChance.calamity` 0.2).
- Mô phỏng `--profile player` 300 đời: tuổi thọ trung bình 118.7 → 106.2, tai ương 29% số cái chết (phần lớn vốn là các ca cạn sức khỏe, trước ghi là bệnh).

### GĐ 6c.2: hãm vòng cày an toàn của tông môn (2026-10-13)
- Nhiệm vụ tông: làm xong phải nghỉ `missionCooldown` (2) năm mới nhận việc tiếp (bước chuỗi nhiệm vụ cũng tính). Trước đó năm nào cũng làm được.
- Thất bại nhiệm vụ cấp Nội môn trở lên (`missionFail`): 30% bị thương 2 năm và mất 8 sức khỏe.
- Bảo khố: mỗi lần đổi lại cùng một món đắt thêm 20% (`treasuryPriceStepPct`); bảng hiển thị giá hiện tại.
- Mô phỏng `--profile player` 300 đời (sau 6c.1 → sau 6c.2): Kim Đan 18% → 14%, Nguyên Anh 5% → 3%, Hóa Thần 3% → 0.7%, trung vị tuổi thọ 78 → 68. Cố ý để thấp tạm thời; sẽ chỉnh lại trần ở bước cân bằng cuối (6c.9) sau khi các bước sinh tồn xong.
- Không đụng "Cải mệnh": chưa tìm thấy mục này trong code hiện tại, ghi lại để xem ở bước sau.

### GĐ 6c.1: đường cong đột phá (2026-10-13)
- Các điểm cộng vào tỉ lệ đột phá (ngộ tính, đạo tâm, hook, vật phẩm, tích lũy chờ đỉnh) không còn cộng dồn vô hạn: quá `modifierKnee` (20 điểm) chỉ tính một nửa (`modifierShare`), và đột phá đại cảnh giới có trần cộng theo cảnh giới đích (`majorModifierCap`: Trúc Cơ 36, Kim Đan 36, Nguyên Anh 34, Hóa Thần 38). Điểm trừ (thất bại, độ khó khó) không bị giới hạn. Bản chơi thử 13/10 thấy Nguyên Anh 87%, Hóa Thần 81% vì cộng dồn không trần.
- Thất bại đột phá vào Nguyên Anh và Hóa Thần nặng hơn (`failureWeightsByRealm`): tử vong 3 → 5 và 8, hao thọ 15 → 17 và 18, tẩu hỏa 7 → 8 và 9.
- Mô phỏng `--profile player` 900 đời (trước 300 đời): Kim Đan 21.3% → 19.1%, Nguyên Anh 8.3% → 6.2%, Hóa Thần 4% → 2.3%, tuổi thọ trung vị 78 → 81.
- Đan dược hỗ trợ vẫn cộng đủ số ghi trên vật phẩm (chỉ chịu trần). Test mới cho độ nén và trần cộng dồn.

### GĐ 6c.0: vá lỗi nhanh sau đợt chơi thử 13/10 (2026-10-13)
- **Vòng đá ngũ hành** chơi được: trò này không có gì để ghi nhớ nên nhận nhập liệu ngay (trước đó bị coi là "đang hiện đáp án" và bỏ qua mọi lần bấm, chặn cả chuỗi Tam hoa tụ đỉnh và Ngũ khí triều nguyên). Có test thắng trò.
- Tiêu đề sự kiện có `{lover}` ("{lover} lâm bệnh") được điền tên ở thẻ kết quả và nhật ký.
- Con có linh căn dùng được không còn chết đúng 120 tuổi: tuổi thọ dao động theo `lifespan.mortalVariance` như người thường.
- Sửa câu chết bệnh dùng "bạn" thay vì "ngươi", và dòng "Để GĐ 7 làm đầy đủ." lộ ra ở nhược điểm Yêu đạo.

### GĐ 6b.14: động phủ linh mạch, chỗ tiêu linh thạch (2026-10-13)
- Bảng Tu luyện có mục **Động phủ linh mạch**: thuê 1 năm hoặc 10 năm (giảm 10%), tu vi ×1.5 suốt thời hạn, cộng dồn với bế quan. Giá mỗi năm theo cảnh giới: Luyện Khí 10, Trúc Cơ 30, Kim Đan 80, Nguyên Anh 200, Hóa Thần 500 linh thạch (`balance.caveRent`). Bản đánh giá ghi các kiếp tu chết với hơn 1.000 linh thạch không biết tiêu vào đâu.
- Mô phỏng 300 đời `--profile player` (bot thuê 10 năm khi có gấp đôi giá): linh thạch lúc chết trung bình 606 → 388, số đời còn từ 500 linh thạch 39% → 21%. Tỉ lệ lên cảnh giới gần như không đổi, vì đường tu vẫn bị chặn ở đột phá chứ không ở tốc độ. Bộ mô phỏng in thêm dòng linh thạch lúc chết.

### GĐ 6b.13: giao diện (2026-10-13)
- Ô tên chỉ nhận chữ cái (có dấu) và dấu cách, tối đa 24 chữ, có dòng đếm. Tên gõ vào được làm sạch lần nữa trước khi đầu thai, nên họ của cả nhà không còn lấy từ ký tự lạ (lỗi #14).
- Thẻ kết quả sự kiện bỏ qua lần chạm trong 300 ms đầu: bấm đúp vào lựa chọn không còn bấm luôn "Tiếp tục" (lỗi #16).
- Nút Back của điện thoại đóng bảng đang mở (Tu luyện, Tông môn, Quan hệ, Túi đồ…) thay vì rời game (lỗi #17).
- Khối Mục tiêu dính đầu nhật ký có nền đặc phủ kín bề ngang và cả phần đệm phía trên, thêm bóng mờ, chữ nhật ký không còn lộ qua (lỗi #18).
- Màn tiêu đề ghi "Bản thử nghiệm 0.6.0" (lấy từ `package.json`, nay là 0.6.0) thay vì "Bản dựng khung · đang xây dựng" (lỗi #20).

### GĐ 6b.12: bớt lặp, Dấu ấn một đời (2026-10-13)
- "[Hệ thống] Nhiệm vụ định kỳ": Hệ thống giao việc mỗi 10 năm (trước 3), mỗi nhiệm vụ chờ 15 năm mới lặp. "Khảo hạch cuối năm" chờ 10 năm (trước 5). Mô phỏng 300 đời: ba nhiệm vụ Hệ thống trước đứng đầu bảng lặp (trung bình 66 lần một đời, có đời 177 lần), nay không sự kiện nào quá 3 lần mỗi 100 năm sống (lỗi #10).
- Bộ mô phỏng in thêm dòng "Sự kiện lặp dày nhất" (lần mỗi 100 năm sống).
- Năm thử linh căn: đoạn công bố linh căn và câu vào Luyện Khí chỉ ghi một lần trong kết quả sự kiện, không thêm dòng riêng lặp lại. Bái nhập tông môn qua sự kiện cũng vậy (lỗi #11).
- "Dấu ấn một đời" bỏ câu đã xuất hiện hơn một lần trong đời, ưu tiên câu hiếm và đột phá đại cảnh giới (lỗi #19).

### GĐ 6b.11: tình duyên trong tông môn (2026-10-13)
- Sự kiện mới "Đêm ở Tàng Kinh Các" (đệ tử tông môn, 18–80 tuổi, chưa có người thương): nhường sách rồi đọc chung (thử mị lực 35) thì quen một đồng môn cùng lứa và bắt đầu theo đuổi (lỗi #9).
- "Đồng môn cùng lứa" mở cho 16–30 tuổi, lặp lại sau 12 năm (trước: chỉ 16–17 tuổi, một lần một đời).
- Tab Người quen ghi rõ khi tình duyên bị đóng, ví dụ "Tình duyên đóng: Phật đạo kiêng tình duyên." (kiếp F tu ở Vô Ưu Tự nên không có nút Theo đuổi mà không biết vì sao).
- Thọ nguyên cộng thẳng từ sự kiện (`lifespanYears`) nay cũng chịu trần `lifespan.eventCapPct` như `lifespanPct`. Giới hạn an toàn của bộ mô phỏng nâng từ 3000 lên 6000 tuổi: một Hóa Thần đủ mọi phần thưởng thọ nguyên sống quá 3000 là hợp lệ, trước bị tính là "kẹt".

### GĐ 6b.10: người không linh căn tu Phật (2026-10-13)
- Mục tiêu "Không có linh căn: sống trọn một đời phàm nhân" chỉ hiện khi còn là phàm nhân. Người không linh căn đã vào Luyện Khí qua đường Phật thấy mục tiêu tu luyện như mọi người (lỗi #8).
- Bảng Tu luyện ghi công pháp không cần linh căn (Vô Ưu Thiền Tâm Pháp) là "không cần linh căn" thay vì "hợp linh căn" khi người tu không có linh căn.

### GĐ 6b.9: tư chất không trôi (2026-10-13)
- Căn cốt, ngộ tính, khí vận tăng từ nguồn thường (sự kiện không phải kỳ ngộ, nhiệm vụ tông môn, đồng môn, chuỗi nhiệm vụ, luận đạo với đạo lữ) nay giảm dần: từ 60 chỉ còn ×0.5, từ 80 còn ×0.2, phần lẻ làm tròn theo xác suất (`balance.aptitudeGain`). Kỳ ngộ (sự kiện `rare`), đan dược, khí vận, thiên phú, thể chất không bị giảm; mất tư chất không bị giảm (lỗi #7).
- Mô phỏng 300 đời `--profile player`: tư chất tăng trung bình 42.8 → 33.7 điểm mỗi đời; số đời kết thúc với một chỉ số từ 90: 52.3% → 29.3%. Tỉ lệ cảnh giới gần như không đổi (Kim Đan 26% → 23%). Bộ mô phỏng in thêm dòng tư chất.
- Test `cultivation` chọn lựa chọn đầu tiên đủ điều kiện (trước đó có thể kẹt mãi ở sự kiện mà lựa chọn 0 cần bạc).

### GĐ 6b.8: không hỏi tha/giết hai lần (2026-10-13)
- Trận đánh mà phần thắng hẹn tiếp sự kiện ngay trong năm (`followUp.afterYears` = [0, 0]) bỏ bước chung Tha / Lột đồ / Giết; sự kiện tiếp theo tự quyết số phận đối thủ. Trước đó "Bảng treo thưởng" cho chọn Tha rồi ngay sau lại hỏi Giao nộp / Thả đi (lỗi #6).

### GĐ 6b.7: lời văn giao chiến (2026-10-13)
- Kẻ địch nhiều người ("Hai tán tu", "Ba tán tu bị thương", "Hai đồng đội") có `plural: true`; lời văn giao chiến dùng chỗ trống `{y}` / `{Y}`, đọc là "bọn chúng" thay vì "y" (lỗi #12). Câu ý định "Kẻ này muốn lấy mạng" đổi thành "Đối phương muốn lấy mạng".
- "Rủ rê phục kích": câu thua không còn nói hộ vệ là Trúc Cơ (đối thủ cùng cảnh giới với người chơi, lỗi #5).

### GĐ 6b.6: hành động hợp ngữ cảnh (2026-10-13)
- Tông môn chỉ nhận người từ 8 tuổi (`sects.minJoinAge`); trước đó trẻ 0 tuổi bái nhập được Vô Ưu Tự (lỗi #4).
- Bảo khố khóa món chỉ gồm đan đột phá cho cảnh giới đã qua, ghi "Vô dụng ở cảnh giới này." (Trúc Cơ Đan khi đã Trúc Cơ, lỗi #13).
- Sự kiện "Học nghề" (lò rèn, tiệm thuốc, quán trọ) không đến với đệ tử tông môn (lỗi #15).

### GĐ 6b.5: thể chất đặc biệt hiếm lại (2026-10-13)
- Trước: 8 kỳ ngộ thức tỉnh thể chất, mỗi cái trọng số 0.4 và là một cơ hội riêng, điều kiện chỉ số thấp (55–60), nên đời sống lâu gần như chắc gặp một cái. Mô phỏng: 31% số đời mang thể chất.
- Sau: **mỗi đời tối đa một cơ duyên** (gặp một kỳ ngộ thức tỉnh, nhận hay từ chối, là hết: cờ `duyen_the_chat`); trọng số 0.02 (Vạn Độc 0.05); ngưỡng chỉ số cao hơn: Cửu Dương căn cốt 70, Thái Âm trí tuệ 70, Bàn Thạch căn cốt 80 + đạo tâm 60, U Minh khí vận 70 + đạo tâm 65, Thiên Sinh Ma Thể danh ma 40 + đạo tâm 60.
- Mô phỏng 300 đời `--profile player`: thể chất 31% → 9% số đời. Tỉ lệ Kim Đan theo linh căn nay đi đúng thứ tự: Đơn 33.3%, Song 31.7%, Tam 29.3%, Tứ 22.6%, Ngũ 17.5% (trước: Đơn 9.1%, Tam 18.2%).

### GĐ 6b.4: bức tường công pháp (2026-10-13)
- Dòng **Mục tiêu** nói rõ khi công pháp chặn đường: "{công pháp} chỉ tu tới {cảnh giới}, không mở được cửa {cảnh giới sau}…" kèm chỗ tìm (lên cấp trong tông, phường thị, đấu giá, bí cảnh). Thêm mục tiêu "Đã tới đỉnh … thử đột phá" cho mọi cảnh giới.
- **Kỳ ngộ bảo đảm** khi kẹt: "Ngọc giản dưới gốc tùng" (sau 8 năm kẹt) và "Tán tu bán bí tịch" (sau 20 năm), mỗi cái cách nhau ít nhất 30 năm. Hiệu ứng mới `gainFittingTechnique` cho một bí tịch học được, tu xa hơn cảnh giới hiện tại, ưu tiên hợp linh căn và phẩm thấp nhất đủ dùng. Điều kiện mới `techniqueWall.minYears` (chỉ đúng khi có công pháp như vậy); `cult.wallSince` ghi năm bắt đầu kẹt.
- Tông môn mở công pháp huyền phẩm ở cấp Nội môn cho mọi linh căn: Bích Lạc Thanh Vân Kinh (Bích Lạc Tông), Bách Thảo Xuân Sinh Quyết (Bách Thảo Cốc). Trước đó công pháp cao hơn của Bích Lạc cần linh căn từ 3 hệ, nên đơn, song linh căn kẹt ở Trúc Cơ.
- Mô phỏng 300 đời `--profile player`: năm kẹt vì công pháp TB 7.3 → 2.6 năm/đời; Kim Đan 25.3% → 27%; Nguyên Anh 11.3% → 14.3%.

### GĐ 6b.3: hạnh phúc không rơi về 0 cả đời (2026-10-13)
- Trước: hạnh phúc chỉ trôi về mức nghỉ (50) trong "năm bình lặng", mà đời trong tông gần như không có năm như vậy; "Lòng như tro nguội" bào sức khỏe và đạo tâm hàng chục năm.
- Sau: **mỗi năm** hạnh phúc trôi về 50 thêm `extremes.happinessDrift` = 2; năm bình lặng và năm bế quan thêm `happinessQuietDrift` = 3 (tổng 5, trước là 2).
- Hành động mới **Ngao du** (dưới thanh chỉ số, hiện khi hạnh phúc dưới 50): mỗi năm một lần, từ 8 tuổi; tu sĩ trả 3 linh thạch, phàm nhân 5 lượng bạc, hạnh phúc +8–14; hết tiền thì đi dạo miễn phí +3–5; nếu hạnh phúc ≤ 20 thì đạo tâm +1 (`balance.leisure`). Đây cũng là chỗ tiêu linh thạch giữa đời.
- Khi đang "Lòng như tro nguội", dưới thanh chỉ số có dòng cảnh báo nói rõ hậu quả và lối ra.
- Đo bằng `npm run simulate -- --profile player` (300 đời, người chơi máy đi Ngao du khi hạnh phúc < 30): hạnh phúc chạm 0 39.3% → 0% số đời; đạo tâm chạm 0 22.7% → 14%; Kim Đan 17% → 25.3%; Nguyên Anh 7% → 11.3%.
- Sửa kèm (lộ ra khi đời tu sống lâu hơn): vài đời Hóa Thần sống quá 3000 năm vì thọ nguyên cộng dồn theo %. Nay `lifespanPct` từ sự kiện không đẩy thọ nguyên quá thọ nguyên gốc của cảnh giới × 1.5 (`lifespan.eventCapPct` = 0.5), và thọ nguyên từ trạng thái "Thân cường thể tráng" chỉ nhận một lần mỗi đời. Đời dài nhất trong 300 đời: 2774 tuổi, không còn đời bất tử.

### GĐ 6b.2: người chơi máy kiểu "người chơi" (2026-10-13)
- `npm run simulate -- --profile player`: chọn sự kiện ngẫu nhiên, vào tông môn đầu tiên đủ điều kiện, mỗi năm làm nhiệm vụ có tỉ lệ cao nhất, xin bái sư, đổi đồ ở bảo khố, chuyển sang công pháp tu được xa nhất, đột phá khi tỉ lệ ≥ 40%. Chỉ gọi hàm của game.
- Báo cáo thêm: tỉ lệ Kim Đan và số năm kẹt vì công pháp theo từng linh căn; số đời hạnh phúc chạm 0 và số năm ở 0; số đời đạo tâm chạm 0; số năm đầy thanh tu vi mà không tiến được.
- Mốc hiện tại (300 đời, seed `sim`, độ khó thường): Trúc Cơ 55.7%, Kim Đan 17%, Nguyên Anh 7%; hạnh phúc chạm 0 ở 39.3% số đời (TB 11.8 năm), đạo tâm chạm 0 ở 22.7%; TB 28.6 năm đầy thanh/đời, 6.1 năm vì công pháp; thể chất đặc biệt 29% số đời.

### GĐ 6b.1: thử linh căn không lặp vô hạn (2026-10-13)
- Trước: chọn "trốn" ở "Tiên sư thử linh căn" hẹn lại chính sự kiện đó năm sau, không giới hạn; một kiếp gặp 145 lần tới năm 153 tuổi.
- Sau: trốn lần 1 → "Tiên sư lại ghé" (`thu_linh_can_lai`); trốn lần 2 → "Lần ghé cuối của tiên sư" (`thu_linh_can_cuoi`), cả hai lựa chọn ở lần này đều thử linh căn. Mỗi đời gặp tối đa 3 lần, linh căn luôn được thử.

### GĐ 6.7: rà soát nhiều cỡ màn hình (2026-10-12)
- Chạy bản build trong Chromium ở 320×568 (điện thoại nhỏ), 390×844, 768×1024 (máy tính bảng), 1366×768 (máy tính): màn hình tên, tạo nhân vật, màn chính và các bảng Tu luyện, Tông môn, Quan hệ, Khám phá, Bản đồ, Túi, Sổ. Không có trang nào tràn ngang, không lỗi console.
- Sửa: ô avatar ở đầu màn chính cắt chữ khi họ dài (ví dụ "Thượng"); nay chỉ hiện chữ cái đầu, cỡ chữ lớn hơn.

### GĐ 6.6: tối ưu tốc độ (2026-10-12)
- Trước: một gói JS 1163 kB (gzip 331 kB). Sau: 4 gói tách theo vai trò, `vendor` 68 kB, `index` 165 kB, `systems` 284 kB, `content` 653 kB (gzip tổng ≈ 334 kB). Tách để bản cập nhật chỉ code không bắt tải lại nội dung và trình duyệt tải song song.
- Lệnh mới `npm run perf`: nạp nội dung ≈ 200 ms, tạo nhân vật ≈ 3 ms, tua 1 năm ≈ 9 ms (máy dev). Màn hình đầu tiên hiện sau ≈ 1.3 giây trên Chromium giả lập điện thoại (kể cả khởi động trình duyệt).
- Nạp nội dung chậm theo từng thế giới sẽ cần engine nạp bất đồng bộ; để dành cho GĐ 7 khi có thế giới thứ hai.

### GĐ 6.5: hiệu ứng nhẹ (2026-10-12)
- Mỗi màn hình trượt nhẹ vào khi chuyển cảnh.
- Đột phá/lên tầng: viền vàng loé quanh màn hình khoảng 1.6 giây; qua đời: viền tối dần (qua `<html data-fx>`, không đụng logic game).
- Tôn trọng `prefers-reduced-motion`: tắt mọi animation/transition (gồm cả hiệu ứng cũ như hiện popup) và ẩn viền loé.

### GĐ 6.4: âm thanh tổng hợp (2026-10-12)
- `src/ui/audio.ts`: chuông/mõ tạo bằng Web Audio (không dùng file âm thanh). 4 tiếng: qua năm (nhẹ), có sự kiện, đột phá/lên tầng, qua đời. Không có thiết bị âm thanh thì im lặng.
- **Mặc định tắt.** Bật/tắt ở Sổ lưu → "Âm thanh", ghi nhớ trong trình duyệt (`tutien.sound`).
- Chọn tiếng nào do hàm `cueFor` (có test), UI chỉ phát.

### GĐ 6.3: PWA, cài lên điện thoại và chơi offline (2026-10-12)
- `manifest.webmanifest` + biểu tượng chữ 仙 (192/512, maskable, apple-touch-icon) để "Thêm vào màn hình chính".
- `public/sw.js`: trang tải qua mạng trước (ra bản mới), có bản lưu làm dự phòng khi mất mạng; file build và font cache-first. Chỉ đăng ký ở bản production.
- Đã thử bằng trình duyệt: tải một lần, tắt mạng, tải lại vẫn vào được menu.

### GĐ 6.2: cân bằng theo mô phỏng (2026-10-12)
- Số liệu 200 đời/loại người chơi máy, seed mặc định, độ khó thường. Trước: tuổi thọ trung vị 75 (random) / 66 (steady); đạt Trúc Cơ 48% / 45%; chết vì lão suy 2.5% / 0.5%. Sau: trung vị 86 / 84; đạt Trúc Cơ 57.5% / 58.5%; lão suy 4% / 1%; p90 tuổi thọ 143→170 (random).
- Nguyên nhân: sức khỏe bị bào mòn (bệnh 41–57%, giao chiến 36–53% tổng số ca chết). Đã chỉnh trong `balance.json`: `combat.roundInjury` [6,12]→[4,9]; `aging.recoverPerYear` 3→4; `aging.recoverCap` 70→80.
- Còn thấp (ghi nhận, chưa chỉnh): Kim Đan chỉ 2.5–4%, chưa ai tới Nguyên Anh; phần lớn người chơi máy kẹt ở bình cảnh Trúc Cơ đỉnh. Người chơi máy chọn khá ngẫu nhiên nên con số thật có thể tốt hơn.
- `npm run simulate` in thêm tuổi trung bình khi vào từng cảnh giới; thêm hook `observe` cho công cụ phân tích.

### GĐ 6.1: mô phỏng tự động (2026-10-12)
- Lệnh mới `npm run simulate -- --count 500 --profile both --difficulty normal --seed sim`: một **người chơi máy** sống trọn từng đời theo seed (quay khí vận, trả lời sự kiện, đánh trận, kết đan, vượt tâm ma, chọn thiên phú, đột phá) bằng chính các hàm của game, rồi in thống kê: tuổi thọ (trung bình, trung vị, p10, p90), nguyên nhân chết, tỉ lệ từng đạt mỗi cảnh giới, tuổi thọ theo linh căn.
- Hai kiểu máy: `random` (chọn ngẫu nhiên, luôn thử đột phá) và `steady` (chọn lựa chọn đầu, chỉ đột phá khi từ 50%).
- Mã: `src/systems/simulate.ts` (không có luật game riêng); script `tools/simulate.ts` chạy bằng vite-node. Có test.
- Lần chạy đầu (100 đời, độ khó thường): tuổi thọ trung vị 74 (random) và 52 (steady); chết do chiến đấu 45% và 72%; chỉ khoảng 3% lên Kim Đan, chưa ai lên Nguyên Anh. Đây là đầu vào cho 6.2.

### Developer mode: sửa các nút không làm gì (2026-10-12)
- **Nhận khí vận chi tử làm đệ tử** giờ bấm lúc nào cũng được: trước đây nếu đời này đã có một khí vận chi tử (còn sống hay đã mất) thì nút im lặng không làm gì. Nay người cũ được thả ra (vẫn là người quen, không còn là chi tử hay đồ đệ) và người mới vào thay. Cũng sửa lỗi sập khi nhật ký còn trống.
- Mọi nút cheat không làm đổi gì (thành thân khi chưa đủ tuổi hay theo Phật đạo, học công pháp đang tu, đặt võ đạo khi đã tu tiên, chuỗi võ đạo ở giai đoạn không có…) giờ **báo lý do** ngay trên bảng Dev thay vì im lặng.
- Test `dev-buttons` chạy từng nút Dev trên một đời mà nút ấy được bật và kiểm tra đời thật sự đổi.

### Developer mode: cheat cho người có quan hệ (2026-10-12)
- Mục mới **Người có quan hệ** trong bảng Dev: chọn tên trong danh sách thả (chia nhóm Gia đình / Người quen) rồi chỉnh người đó, không chỉ nhân vật chính.
- Người quen: thiện cảm, ân, oán, tư chất, tuổi, thọ nguyên, cho chết hoặc sống lại, cho hoặc bỏ linh căn, đặt cảnh giới, lên tầng, xóa khỏi thế giới (không xóa được đạo lữ và đồ đệ). Người thân: thiện cảm, tuổi, thọ nguyên, sống chết, linh căn. Mọi thay đổi ghi `[Dev]` trong nhật ký.
- Mã: `src/systems/devPeople.ts`.

### Nhập nhân vật đã lưu thành NPC (2026-10-12)
- Bảng Quan hệ, tab Người quen có nút **Nhập nhân vật đã lưu**. Chọn một người trong Sổ nhân vật hoặc nhân vật chính của một ô lưu khác (chỉ người còn sống), rồi thiết lập: **tên** trong đời này (đổi khi trùng tên), **vai trò** với nhân vật chính (bằng hữu, tri kỷ, ân nhân, đồng môn, đối thủ, kẻ thù, người lạ có duyên, hoặc tự đặt), **thiện cảm, ân, oán** ban đầu (thanh trượt, mở sẵn theo vai trò) và giữ tuổi cũ hay bằng tuổi mình.
- Người nhập vào giữ cảnh giới, tư chất, linh căn có hay không, tính cách và mục tiêu của họ; từ đó sống, tu luyện và già đi như mọi người quen khác. Nhật ký ghi lại lúc họ xuất hiện.
- Nội dung (vai trò mẫu, lời văn) do Claude tự soạn theo yêu cầu của chủ dự án, chưa qua duyệt.

### Sổ nhân vật (2026-10-12)
- Mục mới **Sổ nhân vật** trong Sổ lưu: lưu lại người đã gặp để mang sang đời khác. Ghi được hai loại: **người quen** (nút "Ghi vào sổ nhân vật" trong bảng Quan hệ, tab Người quen) và **nhân vật chính của một ô lưu** (nút cùng tên trên thẻ ô lưu). Sổ giữ tối đa 40 người (`balance.npcs.libraryMax`), có nút Xóa.
- Mỗi người ghi lại tên, giới tính, tuổi, thọ nguyên, linh căn có hay không, tư chất, cảnh giới, tính cách và mục tiêu. Sổ nằm trong dữ liệu meta của trình duyệt, không đổi theo ô lưu nào.
- Phần mang vào đời mới (bảng thiết lập vai trò) ở bản cập nhật kế tiếp; lõi nhập (`importPerson`) đã có sẵn và có test.
- Nội dung (vai trò mẫu, lời văn) do Claude tự soạn theo yêu cầu của chủ dự án, chưa qua duyệt.

### 9 ô lưu (2026-10-12)
- Sổ lưu tăng từ 3 lên **9 ô**. Save cũ ở ô 1 đến 3 giữ nguyên.

### Công pháp Nguyên Anh / Hóa Thần và Thái Sơ Diễn Đạo Kinh (2026-10-12)
- **Mở cửa đột phá lên Hóa Thần** (`majorBreakthrough.openRealms`): trước đây không ai lên được vì cửa đóng. Công pháp Địa phẩm vẫn dừng ở Nguyên Anh, muốn lên Hóa Thần phải có công pháp Thiên phẩm hoặc không giới hạn.
- **Thái Sơ Diễn Đạo Kinh tự thích ứng** (`adaptive`): hợp mọi linh căn; linh căn càng yếu càng được bù thêm tốc độ tu (ngũ linh căn +50%, đơn linh căn +10%), thể chất đặc biệt (thay linh căn) được +25%. Mở tới Hóa Thần trước; các chương sau để niêm phong, về sau mở dần bằng cách nâng `maxRealm` khi thêm cảnh giới mới. Số ở `balance.techniques.adaptive`.
- **7 công pháp mới**: Địa phẩm cho Nguyên Anh (Hộ Anh Thanh Liên Quyết, Huyết Hải Phần Anh Công, Vạn Kiếm Quy Tông Quyết, Bất Động Kim Thân Quyết, Vạn Yêu Hóa Hình Pháp) và Thiên phẩm cho Hóa Thần (Hư Không Hóa Thần Kinh, Thiên Ma Giải Thể Đại Pháp).
- 6 kỳ ngộ mới (`cao-cap-cong-phap.json`) để có chúng, và 3 lô đấu giá ở Thiên Bảo Lâu.
- Nội dung do Claude tự soạn theo yêu cầu của chủ dự án, chưa qua duyệt.

### Developer mode: tua ngược thời gian (2026-10-12)
- Bảng Dev có thêm hai nút **Tua ngược 1 năm** và **Tua ngược 10 năm**: về lại đầu năm đó (trước khi chọn gì), để làm lại các lựa chọn và sự kiện. Nút chỉ sáng khi đã có ảnh chụp của năm ấy.
- Khi bật Dev mode, game chụp trạng thái đầu mỗi năm (giữ 12 năm gần nhất, kể cả khi bỏ qua nhiều năm hay bế quan). Ảnh chụp chỉ nằm trong bộ nhớ, không vào file lưu; đổi kiếp thì chụp lại từ đầu. Nhật ký ghi dòng `[Dev]`.
- Số liệu ở `balance.dev`. Mã: `src/systems/timeline.ts`; `advanceYear` báo cho người nghe sau mỗi năm.

### Danh sách thả có đề mục (2026-10-12)
- Developer mode: các danh sách chọn dài giờ chia nhóm bằng đề mục (`optgroup`) cho dễ tìm: **Vật phẩm** theo loại (đan dược, pháp khí, phù lục, trận bàn, linh vật, khác), **Công pháp** theo phẩm (Hoàng, Huyền, Địa, Thiên), **Khí vận** theo độ hiếm, **Linh căn** (thường / biến dị), **Sự kiện** theo loại.
- Thành phần dùng chung `GroupedSelect` (cũng dùng trong tab Gia đạo cho danh sách công pháp và vật phẩm tặng). Danh sách ngắn (cảnh giới, thể chất, tông môn…) giữ nguyên.

### Gia đạo: tương tác với con cái và đạo lữ (2026-10-12)
- Tab mới **Gia đạo** trong bảng Quan hệ: với mỗi người con và đạo lữ có bốn việc, mỗi việc một lần mỗi năm: **Luận bàn**, **Luận đạo** (cần Ngộ tính 40), **Truyền công pháp** (chọn một công pháp mình đã học; cần có linh căn) và **Tặng vật phẩm** (chọn trong túi, danh sách chia nhóm theo loại). Mọi việc đều cộng thiện cảm và đổi chỉ số của mình một chút.
- Con cái tích **ngộ** (0–100) qua các việc ấy, nhớ công pháp được truyền. Khi con nối nghiệp, nhận Ngộ tính tương ứng (tối đa +12) và học luôn công pháp cha mẹ truyền, nhật ký ghi rõ. Đạo lữ đang tu thì tiến độ tu luyện nhích lên.
- **Hậu thiên linh căn**: tặng vật quý nghìn năm (Linh chi, Băng Tâm Liên, Địa nhũ, Hà thủ ô nghìn năm) cho con (hoặc đạo lữ) không linh căn thì có tỉ lệ mở Tứ/Ngũ linh căn hậu thiên; tối đa 2 lần mỗi người, thất bại thì vật quý mất và mình buồn. Luật linh căn trời sinh vẫn giữ: không vật quý thì không có đường tắt, người đã có linh căn hay thể chất thì không bị đổi.
- 2 vật phẩm mới (Địa nhũ nghìn năm, Hà thủ ô nghìn năm) kèm 2 kỳ ngộ để có (`ngu-linh-can.json`) và 2 lô đấu giá. Số liệu ở `balance.familyBond`, lời văn ở `life-texts.json` (`familyBond`).
- Developer mode: làm lại các việc gia đạo trong năm, đặt con cái không linh căn hay song linh căn.
- Thêm `GroupedSelect` (danh sách thả có đề mục) để dùng chung; việc áp dụng cho các danh sách khác nằm ở mục riêng.
- Nội dung do Claude tự soạn theo yêu cầu của chủ dự án, chưa qua duyệt.

### Võ đạo: chuỗi nhiệm vụ và mini-game tới Ngũ khí triều nguyên (2026-10-12)
- Lên **Hóa cảnh** thì sang năm mở chuỗi "Tầm Tam hoa" (4 ải); lên **Tam hoa tụ đỉnh** thì sang năm mở chuỗi "Hợp Ngũ khí" (4 ải). Mỗi năm làm một ải trong bảng Tu luyện, mục Võ đạo; qua ải cuối thì lên cảnh giới kế. Các kỳ ngộ ngẫu nhiên cũ vẫn là đường thứ hai.
- Ải là **mini-game** hoặc thử sức theo chỉ số. Hai mini-game: **Vòng đá ngũ hành** (chạm đá theo thế tương sinh hay tương khắc, đá đầu cho sẵn) và **Điều tức quan tưởng** (nhớ rồi nhắc lại thứ tự Tinh, Khí, Thần). Sai quá số lần cho phép thì hỏng ải: mất sức khỏe, năm sau thử lại. Có thể dùng vật phẩm hỗ trợ (Ngộ Đạo Trà, Định Tâm Đan…) để được sai thêm một lần hay tăng tỉ lệ. Qua ải được cộng Đạo tâm.
- **Ngũ khí triều nguyên** tu nhanh hơn ngũ linh căn thường (tốc độ tu luyện +100%, trong `martial.json` `ascendEffects`) và có thêm 3 công pháp cho ngũ linh căn: Ngũ Hành Đồng Tâm Công, Ngũ Khí Triều Nguyên Quyết, Vạn Pháp Quy Nhất Kinh, kèm 3 kỳ ngộ để học (`ngu-linh-can.json`). Điều kiện sự kiện mới `root.minElements`.
- Số liệu ở `balance.martial.quest`; chuỗi, ải, lời văn ở `martial.json` (`quests`, `games`). Mã: `src/systems/martialQuest.ts`, giao diện `MiniGamePopup.tsx`.
- Developer mode: bắt đầu chuỗi ngay, qua ải ngay, được thử lại năm nay; đặt cảnh giới võ đạo cũng đặt lại chuỗi.
- Nội dung do Claude tự soạn theo yêu cầu của chủ dự án, chưa qua duyệt.

### Khí vận tiên thiên quyết định chỉ số khởi đầu (2026-10-12)
- Mỗi khí vận được chấm điểm theo độ hiếm (`balance.traits.fate.rarityScore`: Phàm 0, Lương 1, Ưu 2.5, Tuyệt 5, Thiên 8, Thần 12; khí vận Ác 1). Tổng điểm nâng **sàn** của các chỉ số (sức khỏe, trí tuệ, mị lực, căn cốt, ngộ tính, khí vận, đạo tâm) và cộng thêm một khoản cố định, đều tỉ lệ thuận với điểm và có trần. Thiên tài sinh ra không còn chỉ số thấp; khí vận Phàm thì không đổi gì.
- Làm lúc xác nhận khí vận, sau phần thưởng riêng của từng khí vận; xác định theo seed, không dùng RNG nên không xáo các lần tung khác. Điểm đủ cao thì nhật ký sinh ra ghi một dòng "Khí vận hộ thể…" (`lifeTexts.fateLift`).
- Con số nằm ở `balance.json` mục `traits.fate`. Nội dung do Claude tự soạn theo yêu cầu của chủ dự án, chưa qua duyệt.

### Tách linh căn và thể chất (2026-10-12)
- Thể chất đặc biệt không còn nằm trong linh căn: mỗi người có `cult.bodyId` riêng (con cái có `bodyId` riêng). Có thể chất đặc biệt thì thể chất **thay thế** linh căn (linh căn giữ chỗ `the_chat`, không cần ngũ hành); không có thì là **Phàm thể** (hiện sau khi thử linh căn).
- Bảng nhân vật và bảng Tu luyện hiện hai dòng riêng "Linh căn" và "Thể chất"; thể chất thay thế thì dòng linh căn ghi rõ. Lời báo kết quả thử linh căn có câu riêng cho thể chất (`revealBodyText`, `plainBody` trong `roots.json`).
- Hàm đổi: `rollRoot` trả `{root, bodyId}`; `techniqueMatches` nhận thêm `bodyId`; `inheritRoot` trả `{root, bodyId}`.
- Save cũ: `root.body` được chuyển sang `cult.bodyId` (cả con cái) khi nạp.
- Developer mode: đặt linh căn và đặt thể chất riêng (đặt không thưởng, hoặc về phàm thể); đặt linh căn ngũ hành sẽ bỏ thể chất đặc biệt.

### Save cũ tự bổ sung hệ thống mới (2026-10-12)
- `SAVE_VERSION` lên 2. Sau các bước nâng cấp theo phiên bản, `migrate` còn **bổ sung tự động** mọi trường mà đời cũ còn thiếu bằng giá trị của một đời mới tinh (`backfillLife`), nên thêm hệ thống mới không cần viết bước migration tay nữa.
- Giá trị đã có (kể cả `null`, `0`, `false`) không bao giờ bị đè; lịch trình thử thách gốc (`events.followUps`) và `pastSect` không bị chép từ đời mới.
- Khi có gì được bổ sung, nhật ký năm hiện tại ghi một dòng "Game vừa cập nhật…". Áp dụng cả khi nạp ô save lẫn nhập file.
### Chiêu mộ người quen vào tông 5c.9 (2026-10-12)
- Chưởng môn có mục "Chiêu mộ người quen" trong bảng Tông môn: mời NPC đã quen (có linh căn, đủ 16 tuổi, thiện cảm từ 55) gia nhập tông. Tốn 20 linh thạch lễ vật từ kho; tỉ lệ nhận lời theo thiện cảm, ân tình, oán hận (hiện ngay trên nút); mỗi người một lần mỗi năm.
- Nhận lời: thêm một đệ tử, danh vọng +1, thiện cảm tăng, hạnh phúc +2, và mỗi năm người ấy nộp thêm 2 linh thạch vào kho. Từ chối: thiện cảm giảm nhẹ, hạnh phúc −1.
- Số trong `balance.founding.recruit`, lời văn trong `founding.json` (`recruitYes`, `recruitNo`). Đệ tử, đồng môn tông khác không bị mời.

### Sư phụ – đồ đệ 5c.8 (2026-10-12)
- Ngoài "Chỉ điểm", mỗi đồ đệ có thêm 4 việc, mỗi việc một lần mỗi năm: **Luận bàn** (tỉ lệ theo Chiến lực; thắng hay thua đồ đệ đều tiến bộ, thầy đổi chỉ số), **Luận đạo** (thử Ngộ tính), **Truyền công pháp** (chọn công pháp mình đã học; đồ đệ tu nhanh hơn theo phẩm: Hoàng +5% … Thiên +30%) và **Tặng vật phẩm** (chọn đồ đang giữ; đan dược cộng tu vi, pháp bảo cộng căn cốt…).
- Mọi việc đều đổi chỉ số của thầy. Số trong `balance.disciples.acts`, lời văn trong `disciples.json`. Nội dung do Claude tự soạn, chưa qua duyệt.
- Save cũ vẫn chạy: các trường mới đều tùy chọn.

### Tông môn 5c.7 — Phía tông chủ (2026-10-12)
- **Trưởng lão có tên**: tông mình (lập, kế vị hoặc đòi lại) có 3 trưởng lão là NPC thật (có tuổi, tu luyện, nhớ ơn). Chưởng môn ban thưởng từ kho (30 linh thạch, mỗi người một lần mỗi năm) để tăng thiện cảm và danh vọng.
- **Danh vọng** 0–100 với 5 bậc (Vô danh, Có tiếng, Danh môn, Đại tông, Thánh địa): mỗi năm tiến dần về mức tương ứng số đệ tử và công trình; bậc cao thì người đến bái sư đông hơn. Số trong `balance.founding.prestige`, bậc trong `founding.json`.
- 4 sự kiện của chưởng môn (`events/own-sect-life.json`): Tông bạn đến thăm, Đệ tử xin xuống núi lịch luyện, Trưởng lão bất mãn, Đại điển thu đồ. Hiệu ứng `ownSect` thêm `prestige`. Nội dung do Claude tự soạn, chưa qua duyệt.

### Tông môn 5c.6 — Tranh ngôi chưởng môn, phe phái (2026-10-12)
- **Ba phe trong tông** (giữ nếp cũ, cải cách, chuộng thực lực): từ Nội môn, đệ tử chọn theo một phe (hoặc đứng ngoài). Chọn phe lưu bằng cờ và mở lối đi riêng ở vòng bàn bạc kế vị.
- **Tranh ngôi**: Chân truyền (từ Trúc Cơ) gặp chưởng môn muốn truyền ngôi; được tranh ngôi, ủng hộ người khác hoặc từ chối. Tranh ngôi qua vòng bàn bạc rồi luận võ kế vị với một chân truyền khác. Thắng thì thành chưởng môn thật của tông đó.
- Hiệu ứng sự kiện mới `succeedSect`: người thuộc tông nhận ghế chưởng môn của chính tông ấy (không tốn phí khai tông), tông thành `ownSect` với `balance.founding.inheritMembers` đệ tử và `inheritTreasury` linh thạch, mở khóa báo cáo năm, xây dựng, quyết định của chưởng môn. Nội dung do Claude tự soạn, chưa qua duyệt.

### Tông môn 5c.5 — Sự kiện lớn của tông (2026-10-12)
- 12 sự kiện mới (`events/sect-grand.json`): **Thí luyện sơn môn** (3 ải, có đánh yêu thú canh cốc, chọn một phần thưởng ở đỉnh), **Chuông báo địch** (ngoại địch tập kích, ra trận hay giữ trận nhãn hay lẩn trốn, rồi sau trận), **Kẻ nội gián** (nội loạn, tố cáo hay đối chất, mật điều tra, đêm bắt phản đồ có đánh) và **Đại hội tông môn** (nhiều lựa chọn, ba năm một lần).
- Mỗi lựa chọn đều đổi chỉ số; thí luyện, ngoại địch, nội loạn chỉ xảy ra một lần mỗi đời. Nội dung do Claude tự soạn, chưa qua duyệt.

### Tông môn 5c.4 — Bảo khố (2026-10-12)
- Mục "Bảo khố" trong bảng Tông môn: đổi cống hiến lấy 12 món (đan dược, bùa, phi kiếm, ngọc bội, linh thạch, một năm tĩnh tu cạnh linh mạch, tới Trúc Cơ Đan cho Chân truyền). Mỗi món có cấp bậc tối thiểu và số suất mỗi đời.
- Đổi đồ không làm tụt cấp: tổng cống hiến để thăng cấp giữ nguyên, bảng ghi riêng phần đã tiêu (`sect.spent`). Nội dung do Claude tự soạn, chưa qua duyệt.

### Tông môn 5c.3 — Nhiệm vụ chuỗi (2026-10-12)
- Mục "Chuỗi nhiệm vụ" trong bảng Tông môn: nhận một chuỗi 3 bước, mỗi năm làm một bước (dùng suất nhiệm vụ của năm), tiến độ lưu theo đời. Bước hỏng thì thử lại năm sau; hỏng `balance.sects.chainMaxFails` (2) bước thì bị rút lại. Xong chuỗi nhận thưởng lớn và thân hơn với đồng môn được nhắc tên.
- 3 chuỗi đầu: **Linh dược thất lạc** (chấp sự), **Tấm bia đá nứt** (trưởng lão), **Giúp đồng môn vượt ải** (đồng môn cùng lứa). Mọi kết quả đều đổi chỉ số. Nội dung do Claude tự soạn, chưa qua duyệt.

### Tông môn 5c.2 — Đại tỉ và Luận đạo hội (2026-10-12)
- Hai cuộc thi định kỳ của tông, năm năm một lần (đại tỉ ở tuổi chia hết cho 5, luận đạo hội lệch hai năm), cho đệ tử từ Ngoại môn: ba trận với đồng môn cùng lứa. Đại tỉ so Chiến lực, luận đạo hội thử Ngộ tính.
- Thưởng theo số trận thắng (cống hiến, linh thạch, thanh tu vi, chỉ số; kể cả thua trắng vẫn đổi chỉ số): số trong `balance.sects.tournaments`, lời văn trong `sect-life.json`. Nhớ thành tích tốt nhất mỗi đời; kình địch ghim thù khi bị thắng, đồng môn khác thân hơn sau trận.
- Nút "Ghi danh" trong bảng Tông môn. Nội dung do Claude tự soạn, chưa qua duyệt.

### Tông môn 5c.1 — Đồng môn có tên (2026-10-12)
- Nhập môn là gặp một nhóm đồng môn có tên (`balance.sects.cast`): 1 trưởng lão, 1 chấp sự, 1 sư huynh/tỷ, 2 đồng môn cùng lứa, 1 kình địch. Họ là NPC thường (có tuổi, tu luyện, chết, sổ ân oán), thuộc về đời đó nên mỗi đời một dàn khác.
- Xin bái sư giờ chọn một trưởng lão thật của tông làm sư phụ (hoặc sinh trưởng lão mới); sư phụ chết thì nhật ký báo và mất sư phụ.
- Mục "Đồng môn" trong bảng Tông môn: 9 cách đi lại (xin chỉ điểm, hầu trà, dâng quà, luận đạo, tỉ thí, uống trà, hóa giải hiềm khích, đối đầu, nhờ giúp việc) với tỉ lệ hiện sẵn. Mỗi người một lần mỗi năm, tối đa `talksPerYear` người/năm; mọi kết quả đều đổi chỉ số; tỉ thí dùng Chiến lực.
- NPC tối đa 20 → 30 để chứa đồng môn.
- Nội dung do Claude tự soạn theo yêu cầu của chủ dự án, chưa qua duyệt.

### Vá lỗ hổng danh mục công pháp & vật phẩm, Developer mode lấy được mọi thứ (2026-10-12)
- Nội đan cấp 3 giờ lấy được (sự kiện **Yêu vương hấp hối**, từ Kim Đan), nên công thức Kết Kim Đan luyện được.
- Thái Sơ Diễn Đạo Kinh (C13): sự kiện **Di tích thượng cổ** (từ Trúc Cơ, khí vận ≥ 75). Cửu Chuyển Kim Cốt Quyết (C14): **Lời lão trong nhẫn** (có Lão gia gia) hoặc **Cao nhân dưới gốc cây** (võ giả Hóa cảnh).
- Cái giá "hoài bích kỳ tội": cờ `hoai_bich` (đã đặt từ Kiếm trủng nhưng chưa ai dùng) giờ mở sự kiện **Hoài bích kỳ tội** (kẻ đoạt bảo tìm tới: đánh, mua bình yên, trốn, nhờ chính đạo).
- Thổ Nạp Tàn Quyển: chuỗi **Nửa quyển còn lại** → **Lão thầy bói và trang sách cũ**, tìm đủ thì học Thổ Nạp Hoàn Quyển (Huyền phẩm, mới).
- Giải Độc Hoàn có tác dụng thật: sự kiện **Chén trà lạ vị** đặt cờ `trung_doc`, **Độc cũ phát tác** buộc phải giải (thuốc, vận công, thầy lang, hoặc chịu).
- Phi kiếm có chủ có cái giá: sự kiện **Kiếm Các hỏi tội** khi mang kiếm này.
- Developer mode: mục Vật phẩm thêm **Nhận mọi vật phẩm**, **Nhận mọi bí tịch**, chọn công pháp rồi **Học ngay** (bỏ qua điều kiện linh căn, tông môn, Đạo tâm).
- **Tăng hiệu quả đồ "một lần mỗi đời"**: Khai Trí Đan Trí tuệ +3 → +8; Tẩy Tủy Đan Căn cốt +5 → +12; Ngộ Đạo Trà Ngộ tính +2 → +6; Trú Nhan Đan Mị lực +3 → +8; Diên Thọ Đan thọ +5 → +20 năm; Linh chi nghìn năm thọ +3 → +15 năm và Sức khỏe +20 → +40.
- **29 món cấp cao mới** (theo `catalog/de-xuat-bo-sung-cap-cao.md`): 11 đan dược (Ngưng Anh Đan, Hóa Thần Đan, Kết Kim Đan thượng phẩm, Cửu Chuyển Hoàn Hồn Đan, Tuế Nguyệt Đan, Hồi Xuân Tạo Hóa Đan, Định Tâm Đan, Tụ Nguyên Đại Đan, Hộ Mạch Đan, Dịch Cân Tẩy Cốt Đan, Thiên Lôi Đan), 10 pháp bảo, trận bàn, bùa, 8 nguyên liệu và kỳ vật (Nội đan cấp 4, Huyền Băng Tủy, Chu Quả Vạn Năm, Lá Ngộ Đạo Cổ Thụ, Hỗn Độn Thạch, Tinh Hồn Châu, Thiên Cơ Bàn, Phượng Hoàng Tinh Huyết).
- 10 sự kiện nguồn mới (đấu giá, Băng Phong Cốc, Hỗn Độn bí cảnh, Cổ thụ trên đỉnh danh sơn, Cờ đen trong miếu hoang…) và 10 công thức luyện mới.
- Móc dùng vật phẩm mới: `heartDemon` (giảm tâm ma), `lifespanPct` (thọ theo %), `setFlag.<tên>`; Hộ Mạch Đan giảm thêm 20% sát thương thiên kiếp kế tiếp (`balance.tribulation.hoMachReduce`).
- **Buff 7 Kim Thủ Chỉ** (trước đó yếu hơn cả khí vận Thiên/Thần phẩm dù hiếm hơn nhiều): mọi hiệu ứng bậc 1–3 tăng khoảng 30–100%, thêm bậc 4 cho mỗi cái (Nguyên Anh hoặc Hóa Thần), Hệ thống thêm bậc 5. Ví dụ Lão gia gia khi đủ bậc: tốc độ tu +25%, đột phá đại cảnh +8, Chiến lực +20%, bình cảnh +20%; Bình nhỏ thần bí bậc 3: Căn cốt +8, thọ +15%. Tùy thân động thiên giữ nguyên (đã mạnh nhất), chỉ thêm bậc cuối.
- Nội dung (19 sự kiện, 30 món đồ, 1 công pháp) do Claude tự soạn theo đề xuất của chủ dự án, chưa qua duyệt chi tiết; chủ dự án đã đồng ý hướng đề xuất.

### Chơi thử 2 — Các mục nhỏ còn lại (2026-10-12)
- Tích lũy đột phá: mỗi năm chờ ở đỉnh cảnh giới cộng 1% cho lần đột phá lớn kế tiếp, tối đa 25% (`balance.majorBreakthrough.peakWaitPerYear`, `peakWaitMax`), nên kẹt ở Luyện Khí tầng 9 không còn chờ cả đời.
- Bế quan bị chặn nói rõ lý do: đang giao chiến, đang chờ Cải Mệnh, hay còn một chuyện chờ quyết định.
- Xin bái sư bị từ chối nói rõ vì ngộ tính còn kém và hẹn năm sau.
- Trận đấu: hai bên ghi "lực" thay vì chỉ một con số trông như tầng tu vi.
- Huy hiệu "Một Đời Bình Thường" chỉ hiện khi đời đó không đạt huy hiệu nào khác.
- Nội dung do Claude tự soạn theo yêu cầu của chủ dự án, chưa qua duyệt.

### Chơi thử 2 — Tình duyên, con cái, bớt nhật ký lặp (2026-10-12)
- Người gặp trong sự kiện tình duyên giờ cùng lứa với nhân vật (±3 tuổi, `balance.npcs.peerAgeOffset`; `meetNpc.peer`), không còn lớn hơn 10–15 tuổi.
- 7 sự kiện gặp người cùng lứa (`events/peers.json`): bạn đồng song, đồng môn cùng lứa (16–17 tuổi, chỉ là bạn); hội hoa đăng, cứu người rơi xuống sông, đối thơ ở tửu lâu, cùng làm nhiệm vụ tông môn, gặp lại bạn thuở nhỏ (từ 18 tuổi).
- "Bà mối tới nhà": xem mặt thành thì có người đính ước thật (trước đây chỉ đặt cờ `da_dinh_than`).
- Sinh con: nút hiện tỉ lệ năm nay; mỗi lần không thành, lần sau dễ hơn 10% (tối đa 90%); tu sĩ ít bị giảm khả năng sinh nở hơn (`cultivatorFertility` 0.4 → 0.6).
- Nhật ký bớt lặp: bổng lộc tông môn chỉ ghi năm đầu mỗi cấp rồi mười năm một lần; câu "bỏ bê bạn đời" không phải năm nào cũng hiện và có 5 biến thể; "Bầu bạn" có 6 biến thể.
- Nội dung do Claude tự soạn theo yêu cầu của chủ dự án, chưa qua duyệt.

### Chơi thử 2 — Phường thị theo vùng và hội đấu giá (2026-10-12)
- Phường thị gắn với vùng (`regions` trong `markets.json`): mỗi đại vực có chợ riêng. Thanh Vân châu: Chợ phiên, Vô Chủ Phường, Hội đấu giá Kim Thiềm; Vạn Thú sơn mạch: Thú Thị Vạn Thú; Đông Hải: Hải thị Thận Lâu, Hội đấu giá Thận Lâu; Bắc Minh: Băng Phách Phường; Trung Châu: Vạn Bảo Phường, Thiên Bảo Lâu. Kim Thiềm Thương Minh có ở mọi vùng.
- Hàng bày đổi theo năm (`stock`), có đặc sản riêng (`items`) và bán bí tịch công pháp (`techniques`).
- Hội đấu giá (`auction`): mỗi năm vài lô (đan dược quý, pháp bảo, bí tịch tới Thiên phẩm), ra giá một lần; giá càng cao càng dễ thắng, thua không mất gì (`balance.market.auctionBids`, `auctionRival`).
- 10 vật phẩm mới: kẹo hồ lô, rượu thuốc, sách vỡ lòng, hộp phấn son, nhân sâm rừng, dao găm phòng thân, trân châu giao nhân, Băng Tâm Liên, yêu huyết tinh luyện, giáp vảy giao long. "Cái bát" không còn bày bán.
- Nội dung do Claude tự soạn theo yêu cầu của chủ dự án, chưa qua duyệt.

### Chơi thử 2 — Mục Kim Thủ Chỉ (2026-10-12)
- Nút 指 trên thanh trên cùng (chỉ hiện khi có Kim Thủ Chỉ, có chấm báo khi còn việc làm được năm nay) mở mục riêng: các tầng thức tỉnh, tầng kế tiếp mở ở cảnh giới nào, và các hành động dùng Kim Thủ Chỉ.
- 23 hành động cho 7 Kim Thủ Chỉ (`actions` trong `golden-fingers.json`): hỏi lão gia gia, xin đan phương, mượn sức phá bình cảnh; điểm danh hệ thống, vòng quay may mắn; tưới linh dịch, uống một giọt; nhớ lại kiếp trước; đọc tâm ở chợ; tu trong động thiên; xem thiên đạo bảng… Mỗi hành động có tầng tối thiểu và thời gian hồi (năm); dùng từ 6 tuổi (`balance.goldenFinger.actionMinAge`).
- Điện thoại: thanh trên cùng xuống hai dòng (tên và cảnh giới không còn bị cắt).
- Dev mode: nút "Dùng lại hành động" cho Kim Thủ Chỉ.
- Nội dung do Claude tự soạn theo yêu cầu của chủ dự án, chưa qua duyệt.

### Chơi thử 2 — Nhiệm vụ và sự kiện tông môn (2026-10-12)
- Bảng nhiệm vụ tông môn: mỗi năm hiện 4 việc (`balance.sects.missionBoard`) chọn từ các việc cấp bậc cho phép, đổi theo năm. Nhiệm vụ có thể chỉ riêng một số tông (`sects`).
- 21 nhiệm vụ mới (tổng 26), đủ bốn cấp Ký danh → Chân truyền, có việc riêng cho Bách Thảo Cốc, Vô Ưu Tự, Tàng Phong Kiếm Các, U Hà Ma Tông.
- 12 sự kiện tông môn mới (`events/sect-life.json`): ngoại môn đại bỉ, trưởng lão giảng đạo, khảo hạch cuối năm, tranh chỗ tu luyện, lễ tế tổ, linh thú sổng chuồng, đồng môn hỏi vay, yêu thú công sơn, bí cảnh luyện thí, chưởng môn triệu kiến, nhà bếp thiếu người, tin đồn nội gián.
- Nội dung do Claude tự soạn theo yêu cầu của chủ dự án, chưa qua duyệt.

### Chơi thử 2 — Kỳ ngộ cắt ngang bế quan (2026-10-12)
- Mỗi năm bế quan có 20% gặp chuyện (`balance.seclusion.interruptChance`): cửa động phủ mở, người chơi trả lời sự kiện rồi tự quyết bế quan tiếp hay không.
- 10 sự kiện bế quan mới (chủ đề `be_quan`, chỉ đến khi đang bế quan): đốn ngộ, linh mạch dâng trào, tâm ma gõ cửa, yêu thú đào hang, dị tượng ngoài núi, kẻ trộm động phủ, tiểu hồ ly lạc vào, phù truyền tin của người nhà, cảm ngộ chiêu thức, địa chấn.
- Nội dung do Claude tự soạn theo yêu cầu của chủ dự án, chưa qua duyệt.

### Chơi thử 2 — Nhiều sự kiện hơn mỗi năm (2026-10-12)
- Tỉ lệ một năm có sự kiện tăng từ 50% lên 80%. Từ Nguyên Anh (đời dài hàng nghìn năm) là 50% (`balance.events.popupChanceHighRealm`, `highRealmFrom`); trước đây cảnh giới cao vẫn dùng 50%.
- Đệ tử tông môn gặp sự kiện tông môn nhiều gấp 2,5 lần (`balance.events.sectMemberMul`).

### Chơi thử 2 — Tu sĩ không già như phàm nhân (2026-10-12)
- Thân thể già theo thọ nguyên: quá thọ phàm nhân (`balance.lifespan.mortalBase` = 70) thì đồng hồ thân thể chạy chậm theo tỉ lệ 70 / thọ nguyên. Trúc Cơ thọ 200 ở tuổi 62 có thân thể như người 22 tuổi; suy yếu, đổ bệnh và các mốc 60/70/80 chỉ tới gần cuối thọ nguyên.
- Trước đây 9/10 đời tu sĩ trong lần chơi thử chết bệnh ở 62–80 tuổi và không đủ sức khỏe vượt thiên kiếp.

### Chơi thử 2 — Sửa lỗi hiển thị và cái chết ẩn (2026-10-12)
- Tiêu đề sự kiện điền tên người (trước hiện nguyên "{lover} lâm bệnh").
- Ăn linh quả / ngâm linh mạch mà chết thì chỉ còn câu chết, không kèm câu thành công. Các lựa chọn đó ghi rõ "càng lớn tuổi càng dễ mất mạng".
- Bỏ ghi chú cũ "(GĐ 3–4)" trong Cải mệnh; câu già yếu, qua đời xưng "ngươi" thay vì "bạn".
- Bạn đời / người thương qua đời không còn bị gọi là "người quen".
- Có linh căn mà chưa nhập đạo thì bảng Tu luyện nói rõ cần công pháp, tông môn hoặc tiên sư (trước ghi "Không có linh căn").
- Tu sĩ chết có văn bia riêng, không còn "Một kiếp phàm nhân".
- "Động phủ có lò còn ấm" không xảy ra trước 14 tuổi.

### Góp ý chơi thử 7 — Tu luyện nhanh theo tư chất, kỳ ngộ theo khí vận (2026-10-12)
- Hệ số tư chất trong tốc độ tu luyện đổi từ tuyến tính rất phẳng (0.75–1.25) sang lũy thừa: `3 ^ ((Căn cốt + Ngộ tính − 100) / 100)` (`balance.cultivation.aptitudeGrowth` = 3, tối thiểu 0.3). Người 50/50 giữ nguyên tốc độ; 95/95 nhanh gấp khoảng 2.7 lần (trước 1.2).
- Ví dụ thiên tài (Đơn linh căn, Căn cốt và Ngộ tính 95, khí vận Hỗn Độn Linh Thể): Luyện Khí khoảng 6 năm, Trúc Cơ 8, Kim Đan 22, Nguyên Anh 55 (trước 13 / 18 / 49 / 121), chưa tính đột phá thất bại.
- Kỳ ngộ (mọi sự kiện loại Cơ duyên, Bí cảnh và các sự kiện đánh dấu `luckAffected`) theo Khí vận mạnh hơn: trọng số × (1 + (Khí vận − 50) × 0.02), thấp nhất × 0.2. Khí vận 95 gặp nhiều gấp 1.9 lần người thường.

### Developer mode — công cụ cho đợt góp ý chơi thử (2026-10-12)
- Mục mới **Linh căn & võ đạo**: đặt linh căn bất kỳ (mọi cấp, từng hệ biến dị, từng thể chất), đặt bậc võ đạo của phàm nhân, bật nhanh cảm ứng Tam hoa / Ngũ khí để thử kỳ ngộ.
- Mục mới **Phu thê**: thành thân ngay với một người mới, chỉnh thiện cảm bạn đời ±20 (thử nhà ấm / nhà lạnh / bỏ đi).
- Sự kiện & cờ: nút **Xóa lịch sử sự kiện** (bỏ thời gian chờ và mức giảm do lặp lại).

### Góp ý chơi thử 6 — Linh căn biến dị là tổ hợp 2 hành (2026-10-12)
- Mỗi hệ biến dị là 2 hệ ngũ hành dung hợp: **Lôi = Kim + Hỏa**, **Băng = Kim + Thủy**, **Phong = Mộc + Hỏa**, **Ám = Thủy + Thổ** (`components` trong `roots.json`; validator kiểm tra đúng 2 hệ ngũ hành khác nhau).
- Người có linh căn biến dị tương thích cả 2 hệ gốc: hợp công pháp của 2 hệ đó (và công pháp ngũ hành), đủ điều kiện tông môn đòi hệ gốc, kết đan được cộng như hệ của mình.
- Tên linh căn ghi rõ: "Biến dị linh căn (Lôi: Kim + Hỏa)".
- Con cái đột biến linh căn thường nghiêng về hệ biến dị có chứa hệ của cha mẹ.
- Nội dung (phép phối hệ, mô tả) do Claude tự soạn theo yêu cầu của chủ dự án, chưa qua duyệt.

### Góp ý chơi thử 5 — Khí vận tu hành thì chắc chắn có linh căn (2026-10-12)
- Tiên Thiên Khí Vận có tác dụng cho tu tiên (tốc độ tu luyện, đột phá, bình cảnh, thiên kiếp, ngũ hành, kiếm/pháp/binh/thuật tu, ma đạo) thì chắc chắn có linh căn. Cấp khí vận càng cao, linh căn tối thiểu càng mạnh: Phàm/Ác vận → Ngũ linh căn, Lương → Tứ, Ưu → Tam, Tuyệt → Song, Thiên → Đơn, Thần → Biến dị hoặc thể chất đặc biệt. Có nhiều khí vận thì lấy mức cao nhất.
- Khí vận Thể tu không bảo đảm linh căn vì vẫn có ích cho đường võ phàm nhân.
- Không có khí vận tu hành thì thử linh căn như cũ (khoảng 60% không có).
- Thẻ khí vận lúc đầu thai ghi rõ "Bảo đảm có linh căn, ít nhất …"; lúc thử linh căn, nhật ký nhắc khí vận nào đã định sẵn.
- Số liệu ở `balance.roots.cultivationHooks` và `balance.roots.traitFloor`.

### Góp ý chơi thử 4 — Bớt gặp lại cùng một sự kiện (2026-10-12)
- Sự kiện lặp lại được giờ phải cách ít nhất 6 năm (`balance.events.minCooldownYears`), kể cả sự kiện trước đây không có thời gian chờ.
- Mỗi lần đã gặp trong đời này, sự kiện đó hiếm đi: trọng số × 0.3 cho mỗi lần (`balance.events.repeatDecay`). Đời cũ trong save được tính như đã gặp 1 lần.
- Chạy thử 60 đời: số sự kiện gặp từ 3 lần trở lên trong một đời giảm từ 14 xuống 6, số sự kiện khác nhau xuất hiện tăng nhẹ.

### Góp ý chơi thử 3 — Phu thê có chiều sâu (2026-10-12)
- Với bạn đời / đạo lữ giờ có: **Bầu bạn** (thiện cảm và vui vẻ, mỗi năm một lần), **Tặng quà**, **Song tu** (cả hai cùng tu hành: tu vi hai người cùng tăng, nhiều hơn khi tình cảm sâu), **Làm lành** (khi thiện cảm dưới 50, tỉ lệ theo Mị lực), **Sinh con / Nhận con nuôi**, **Hòa ly / Giải trừ đạo lữ**.
- Mỗi năm: cả năm không chăm sóc (không bầu bạn, quà, song tu, làm lành, con cái) thì bạn đời nguội dần. Nhà ấm (thiện cảm ≥ 70) thêm vui vẻ mỗi năm; nhà lạnh (< 30) mỗi năm buồn thêm; dưới 15 thì bạn đời có thể bỏ đi.
- 9 sự kiện hôn nhân mới: ngày cưới năm xưa, thân thích bên nhà, ghen, bạn đời lâm bệnh, cãi vã, đạo lữ tới bình cảnh, du ngoạn, chung nhà khác lòng, hoạn nạn có nhau.
- Số liệu mới trong `balance.romance` (companyAffinity, dualCultProgress, neglectAffinity, warmAt/coldAt, leaveBelow, reconcile*, divorce*).
- Nội dung do Claude tự soạn theo yêu cầu của chủ dự án, chưa qua duyệt.

### Góp ý chơi thử 2 — Kỳ ngộ Tam hoa tụ đỉnh và Ngũ khí triều nguyên (2026-10-12)
- Bước vào Hóa cảnh thì **cảm ứng Tam hoa**: biết con đường tụ tinh, khí, thần, nhưng "trăm người Hóa cảnh may ra một người".
- 3 kỳ ngộ hiếm cho Tam hoa tụ đỉnh, mỗi cái thử một tư chất khó: thác băng ngàn năm (Đạo tâm), tiếng mõ nửa đêm (Ngộ tính), sét đánh đỉnh núi (Căn cốt).
- Tụ Tam hoa xong thì **ngũ tạng cộng minh**. 2 đường tới Ngũ khí triều nguyên: gom đủ 5 khối linh tinh ngũ hành, hoặc gặp đêm ngũ tinh liên châu (cực hiếm). Thành công thì hóa Ngũ linh căn, bước vào Luyện Khí như trước.
- Nội dung do Claude tự soạn theo yêu cầu của chủ dự án, chưa qua duyệt.

### Góp ý chơi thử 1 — Luyện võ đột phá theo xác suất (2026-10-12)
- Bỏ kiểu đếm ngược số năm: năm nào luyện võ cũng có cơ hội đột phá. Tỉ lệ theo Căn cốt và Ngộ tính (mọi bậc đều tính cả hai), tăng dần theo số năm đã luyện tới số năm thường cần của bậc đó (`balance.martial.yearMul` = 0.3 phần tỉ lệ mỗi năm).
- Bỏ "thất bại lùi năm"; luyện quá lâu mà chưa thành thì nhật ký nhắc xem lại gân cốt, ngộ tính.
- Bảng tu luyện hiện tỉ lệ đột phá của năm nay.

### Developer mode — cập nhật toàn diện sau GĐ 5b (2026-10-12)
- Bảng Dev chia thành mục gập được (dễ dùng trên điện thoại): Chỉ số · Tu luyện & thời gian · Khí vận & Kim Thủ Chỉ · Tông môn, gia tộc, người quen · Vật phẩm & đánh thử · Sự kiện & cờ · Kết thúc đời · Luân hồi.
- Mới: đặt cảnh giới bất kỳ (phàm nhân được cấp linh căn), lên 1 tầng, đầy tu vi, thọ +50, xóa tâm ma, +500 linh thạch.
- Thêm / bỏ từng Tiên Thiên Khí Vận (thấy ngay tổ hợp ẩn), nhận / bỏ Kim Thủ Chỉ, ép cấp thức tỉnh.
- Vào tông môn bất kỳ, khai tông và lập gia tộc miễn phí, tạo tông môn đời trước để thử 5b.7, nhận khí vận chi tử theo mô bản.
- Lọc sự kiện theo id / tên / loại; bật tắt cờ bất kỳ (vd. `biet_truoc` để thấy lựa chọn "Ta biết chuyện này sẽ xảy ra").
- Chết ngay theo từng nguyên nhân để thử màn tổng kết, huy hiệu, cáo phó, trùng sinh, quỷ tu.
- Luân hồi: ± điểm Luân Hồi, chỉnh cấp từng thiên phú luân hồi, mở hết Thiên Thư và thành tựu (chọn được mọi Kim Thủ Chỉ khi đầu thai), làm đầy bảo hiểm Kim Thủ Chỉ.
- Thử thách tuần: ở chế độ Dev chọn được thử thách bất kỳ; Thiên Thư và Thử thách tuần hiện ngay từ kiếp đầu.

### Task 5b.10 — Trùng sinh: nội dung (2026-10-12)
- 2 kỳ ngộ hiếm cho **Hồi Quang Kính**: gương đồng ở tiệm cầm đồ (mua / mặc cả) và đáy giếng miếu hoang (từ Luyện Khí, thử đạo tâm).
- Lựa chọn ẩn **"Ta biết chuyện này sẽ xảy ra"** trong 8 sự kiện có sẵn: Lũ quét, Cha lâm bệnh, Bóng người sau lưng, Bản đồ giá rẻ, Hang khai mạch, Thú triều, Đổ thạch, Yêu thú xuống làng. Vài lựa chọn có thử thách nhỏ, vì thế giới đổi khác một chút nên ký ức không phải lúc nào cũng đúng.
- Lựa chọn ẩn mở bằng cờ `biet_truoc`: đời trùng sinh (Hồi Quang Kính, Nhất Niệm Hồi Quang) và Kim Thủ Chỉ Ký ức kiếp trước đều có.
- Nội dung do Claude tự soạn theo yêu cầu của chủ dự án, chưa qua duyệt.

### Task 5b.7 — Gặp lại tông môn đời trước (2026-10-12)
- Đời nào có tông môn tự lập (khai tông hoặc kế thừa), khi mất thì tông môn ấy được ghi lại. Các đời sau trong cùng thế giới sinh ra đã "có duyên" với nó; mỗi đời trôi qua đệ tử còn lại ít đi (`balance.pastSect.decay`), quá 6 đời thì tông môn tan (`maxLives`).
- 7 sự kiện mới (`events/past-sect.json`): nghe nhắc tên tông cũ, gặp bia sơn môn khắc tên mình kiếp trước (xin vào / tự xưng tổ sư / quay đi), tông môn tàn lụi, viếng mộ chính mình, đồ đệ năm xưa nhận ra đường kiếm, tông cũ gặp nạn (đánh giữ núi), và từ Kim Đan được mời **ngồi lại ghế chưởng môn**.
- Nhận lại sơn môn: tông cũ thành tông môn của đời này với một nửa số đệ tử còn lại và 200 linh thạch trong kho (`claimShare`, `claimTreasury`); rời tông đang ở như khi khai tông.
- Điều kiện `pastSect` (has / status / minMembers), hiệu ứng `pastSect` (met / claimed / spurned), chỗ chèn `{pastSect}` và `{pastFounder}`; validator báo lỗi khi nhắc tông cũ mà thiếu điều kiện.
- Nội dung do Claude tự soạn theo yêu cầu của chủ dự án, chưa qua duyệt.

### Task 5b.6 — Thử thách tuần (2026-10-12)
- Màn **Thử thách tuần** mở từ màn tiêu đề (sau kiếp đầu). Mỗi tuần (theo tuần ISO) có một thử thách của thế giới, giống nhau với mọi người chơi: cùng hạt giống, cùng xuất thân / độ khó / khí vận định sẵn.
- 8 thử thách cho Thương Lan (`content/worlds/thuong_lan/challenges.json`), ví dụ "Phàm Nhân Trường Thọ" (nhà nông, sống tới 90), "Tay Trắng Làm Giàu" (cô nhi, để lại 3.000 lượng), "Thuần Linh Kết Đan".
- Đời thử thách không mang thiên phú luân hồi, Phúc báo hay Kim Thủ Chỉ; khí vận định sẵn bị khóa, không bốc lại (trừ khi luật cho). Phúc báo đang chờ được giữ cho đời thường kế tiếp.
- Mục tiêu đọc lúc mất; màn tổng kết đời ghi Đạt / Chưa đạt và điểm (điểm Luân Hồi của đời). Meta lưu số lần thử, điểm cao nhất, đã đạt chưa (giữ 12 tuần). Điểm Luân Hồi vẫn được cộng, tính riêng từng lần thử.
- Nội dung do Claude tự soạn theo yêu cầu của chủ dự án, chưa qua duyệt.

### Task 5b.5 — Thành tựu, huy hiệu cuối đời, cáo phó (2026-10-12)
- 30 **thành tựu** lưu vĩnh viễn (`content/achievements.json`): cảnh giới, trăm tuổi, khai tông, lập gia tộc, đạo lữ, Thiên kiêu bảng, đại thiện / đại ác, khí vận chi tử ("Sư phụ của nhân vật chính", "Phản diện bị vả mặt", "Bị đồ đệ gọi là NPC"), Kim Thủ Chỉ, tổ hợp ẩn, trùng sinh, mười / trăm kiếp… Thành tựu ẩn hiện "???" tới khi đạt.
- 6 thành tựu **mở khóa Kim Thủ Chỉ**: từ đó lúc đầu thai được chọn thẳng Kim Thủ Chỉ ấy với 30 điểm Luân Hồi (`balance.goldenFinger.chooseCost`).
- 19 **huy hiệu cuối đời** có độ ưu tiên; màn tổng kết đời hiện 3 huy hiệu hợp nhất (`balance.badges.max`), ví dụ "Lão Tổ Cô Độc", "Phàm Nhân Hạnh Phúc Nhất". Đời nào cũng có ít nhất "Một Đời Bình Thường".
- Màn tổng kết đời hiện các thành tựu mới đạt. Thiên Thư có thêm mục **Thành tựu**.
- Nút **Lưu cáo phó**: vẽ cáo phó thành ảnh PNG (tên, cảnh giới, cách mất, văn bia, huy hiệu). Trình duyệt hỗ trợ thì mở bảng chia sẻ, không thì tải ảnh về.
- Điều kiện chung `LifeCheck` cho thành tựu và huy hiệu; validator kiểm tra cảnh giới và Kim Thủ Chỉ được nhắc tới.
- Nội dung do Claude tự soạn theo yêu cầu của chủ dự án, chưa qua duyệt.

### Task 5b.4 — Thiên Thư (2026-10-12)
- Màn **Thiên Thư** mở từ màn tiêu đề (sau kiếp đầu), có 4 mục:
  - Khí vận: đã mang / tổng số; cái chưa gặp hiện "???" kèm phẩm cấp.
  - Tổ hợp ẩn: đã thức tỉnh thì hiện tên, khí vận cần có và hiệu ứng; chưa thì chỉ báo cần mấy khí vận.
  - Kim Thủ Chỉ: đã từng có / tổng số.
  - Truyện khí vận chi tử: mỗi đời có đồ đệ khí vận chi tử để lại một đoạn kết theo vai trò (Hộ đạo, Lợi dụng rồi diệt, Lợi dụng mà nó còn sống, Mặc kệ, chết sớm, chưa chọn).
- Ghi lúc xác nhận khí vận và lúc đời kết thúc (meta `codex`, giữ 50 truyện gần nhất).
- Lời dẫn và đoạn kết trong `content/codex.json`.
- Nội dung do Claude tự soạn theo yêu cầu của chủ dự án, chưa qua duyệt.

### Task 5b.3 — Khóa ô, 5 ô khí vận, tổ hợp ẩn (2026-10-12)
- **Khóa ô**: ở màn bốc mệnh, bấm "Khóa ô này" để giữ một khí vận khi quay lại. Mỗi ô khóa tốn 3 điểm Luân Hồi, trừ khi xác nhận (`balance.traits.locks`, `lockCost`). Developer mode khóa miễn phí.
- **Thêm ô**: thiên phú luân hồi mới Mệnh Bàn Thêm Ô (4 rồi 5 ô, tối đa `balance.traits.maxSlots`) và Định Mệnh Ấn (khóa được 2 ô).
- **60 khí vận** (thêm 20): 5 Phàm, 4 Lương, 3 Ưu, 3 Tuyệt, 2 Thiên, 1 Thần, 2 Ác vận. Chỉ dùng móc đã có tác dụng.
- **12 tổ hợp ẩn** trong `content/trait-combos.json`: có đủ 2–3 khí vận nhất định thì lúc xác nhận hiện dòng "Tổ hợp ẩn" và nhận hiệu ứng bí mật (chỉ số cộng một lần, các móc khác suốt đời). Ví dụ: Truy Phong, Đèn Cạn Gặp Dầu, Gian Thương Trời Sinh. Validator kiểm tra id khí vận trong tổ hợp.
- GameState `destiny` có thêm `slots`, `locked`, `maxLocks` (save cũ được bù mặc định).
- Nội dung do Claude tự soạn theo yêu cầu của chủ dự án, chưa qua duyệt.

### Task 5b.2 — Kim Thủ Chỉ (2026-10-12)
- 7 loại trong `content/golden-fingers.json`: Lão gia gia trong nhẫn, Hệ thống, Bình nhỏ thần bí, Ký ức kiếp trước, Đọc tâm, Tùy thân động thiên, Thiên đạo bảng. Mỗi loại 3–4 cấp thức tỉnh theo cảnh giới (cấp sau cộng thêm vào cấp trước) và một rủi ro.
- Cách nhận:
  - lúc chào đời: 0.3% + 0.05% mỗi kiếp đã chơi (tối đa 1%); **bảo hiểm**: 15 kiếp liền không có thì kiếp sau chắc chắn có (`balance.goldenFinger`, meta `fingerPity`);
  - kỳ ngộ hiếm "Sao băng rơi sau núi" (khí vận ≥ 70);
  - chiếc nhẫn có tàn hồn (task 4.11) giờ chính là Lão gia gia; tháo nhẫn hay đuổi tàn hồn thì mất. Đoạt nhẫn của Phế vật nghịch tập (task 5.6) cũng được.
- Mỗi đời tối đa một. Màn bốc mệnh và hồ sơ nhân vật hiện Kim Thủ Chỉ, cấp hiện tại và rủi ro.
- Sự kiện riêng (`events/golden-finger.json`):
  - Hệ thống giao nhiệm vụ 3 năm một lần (gà gáy giờ Tý, ngâm thơ giữa chợ, khiêu chiến vượt cấp), làm hỏng hay từ chối đều bị phạt;
  - sự kiện "lộ bí mật" cho Bình nhỏ, Ký ức kiếp trước, Đọc tâm, Động thiên (có thể mất Kim Thủ Chỉ), Thiên đạo bảng.
- Engine:
  - điều kiện `goldenFinger {has, id, minLevel}`;
  - hiệu ứng `goldenFinger` (id hoặc `random`) và `loseGoldenFinger`;
  - móc mới `readMind` (Đọc tâm: thấy bản chất mọi người quen);
  - validator kiểm tra id Kim Thủ Chỉ và cảnh giới của từng cấp.
- Ký ức kiếp trước bật cờ `biet_truoc`, dùng cho lựa chọn ẩn "Ta biết chuyện này" (task 5b.10).
- Mở khóa Kim Thủ Chỉ bằng thành tựu để chọn thẳng lúc tạo nhân vật: làm ở task 5b.5.
- Nội dung do Claude tự soạn theo yêu cầu của chủ dự án, chưa qua duyệt.

### Task 5b.1 — Thiên phú luân hồi, Luân Hồi Đài (2026-10-12)
- 11 thiên phú luân hồi trong `content/rebirth-talents.json`, mỗi cái 2–3 tầng, giá tăng dần.
  - Thêm lượt bốc mệnh, ngộ tính, khí vận, căn cốt, đạo tâm.
  - Thử linh căn thêm lần (`rootReroll`), thọ nguyên, tốc độ tu luyện.
  - Bạc lúc chào đời, lượt làm mới Nghịch Thiên Cải Mệnh, kỳ ngộ dễ gặp hơn.
- Màn **Luân Hồi Đài**: mở từ màn tiêu đề (sau kiếp đầu) và màn tổng kết đời. Tiêu điểm Luân Hồi để mở hoặc nâng tầng; thiên phú theo mọi kiếp sau.
- Tầng n cho trọn hiệu ứng của tầng ấy (không cộng dồn với tầng dưới).
  - `stat.*` và `lifespanPct` cộng một lần lúc chào đời.
  - Các móc khác có tác dụng suốt đời qua `lifeHooks`.
- Meta có thêm `rebirthTalents`; GameState có `rebirthTalents` (save cũ nhận `{}`).
- Nội dung do Claude tự soạn theo yêu cầu của chủ dự án, chưa qua duyệt.

### Task 5.6 — Hộ đạo / Lợi dụng / Mặc kệ (2026-10-12)
- Cuối chuỗi của mỗi mô bản là một ngã rẽ sư đồ có ba lựa chọn (hiệu ứng `chosenRole`, điều kiện `chosen.role`):
  - **Hộ đạo**: khí vận lan sang sư phụ (kỳ ngộ ×1.3, đột phá +3%). Vài năm sau đồ đệ thành danh về báo đáp: lễ vật, danh tiếng, hoặc làm khách khanh cho tông môn tự lập.
  - **Lợi dụng**: lợi lớn ngay (Phế vật: đoạt luôn chiếc nhẫn có tàn hồn), nhưng nhân quả nặng.
    - Thiên kiếp +25%, kháng tâm ma −10%, kỳ ngộ ×0.7.
    - Đồ đệ ôm hận rồi quay về báo thù với hào quang ×1.6.
    - Thắng cũng mang tâm ma; thua mất nửa tu vi và 20 năm thọ.
  - **Mặc kệ**: đồ đệ rời sư môn, về sau trở lại thành thiên kiêu số một (uống trà, khoe khoang, hoặc so chiêu).
- Móc của vai trò chỉ còn tác dụng khi khí vận chi tử còn sống. Danh sách quan hệ hiện vai trò đã chọn.
- Validator chấp nhận hiệu ứng `ownSect` khi chính lựa chọn ấy yêu cầu `ownSect.has`.
- Nội dung do Claude tự soạn theo yêu cầu của chủ dự án, chưa qua duyệt.

### Task 5.5 — Khí vận chi tử làm đệ tử (2026-10-12)
- Mô bản trong `content/chosen-ones.json`: Người xuyên không, Phế vật nghịch tập, Trọng sinh giả.
- Từ Trúc Cơ có thể gặp dị tượng báo trước (mỗi mô bản một sự kiện, hiếm, mỗi đời chỉ một người).
- Nhận làm đồ đệ thì có thêm một đồ đệ, vượt cả giới hạn đồ đệ của cảnh giới.
- Mỗi mô bản có chuỗi 3 sự kiện riêng nối nhau bằng follow-up (`content/worlds/thuong_lan/events/chosen.json`). Sự kiện tự gắn với đồ đệ ấy ({npc}, hiệu ứng `npc`, đánh với đồ đệ bằng `fromNpc`).
- Hào quang nhân vật chính (`balance.chosen`):
  - tu nhanh ×1.6;
  - đột phá +15%;
  - không bao giờ chết vì tai nạn;
  - rắc rối kéo tới sư phụ (Phế vật: gia chủ thế gia tới đòi nợ).
- Engine:
  - điều kiện `chosen {has, template, minYears}`;
  - hiệu ứng `chosenOne`;
  - validator kiểm tra id mô bản;
  - danh sách quan hệ hiện nhãn "Khí vận chi tử · <mô bản>".
- Nội dung do Claude tự soạn theo yêu cầu của chủ dự án, chưa qua duyệt.

### Task 5.3 — Sự kiện tông môn (phần nội dung, 2026-10-12)
- 12 sự kiện cho tông môn tự lập (`content/worlds/thuong_lan/events/own-sect.json`, nhóm "Bổn tông"):
  - láng giềng khiêu khích;
  - phản đồ trộm công pháp;
  - đại bỉ nội môn;
  - ma đạo công sơn (đánh có Hộ Sơn Đại Trận đỡ; trận cấp 2 thì cố thủ được);
  - tán tu xin nương nhờ, kéo theo gián tế;
  - linh mạch suy yếu;
  - thánh chỉ sắc phong;
  - tranh ngôi chân truyền;
  - Luyện Đan Phòng nổ;
  - đại bỉ liên tông;
  - tượng tổ sư.
- Mọi sự kiện cần `ownSect.has`. Sự kiện lớn đòi số đệ tử tối thiểu.
- Nhãn nhóm sự kiện "Thọ nguyên" và "Bổn tông" trên popup.
- Nội dung do Claude tự soạn theo yêu cầu của chủ dự án, chưa qua duyệt.

### Sửa móc hiệu ứng sai đơn vị và nối móc còn treo (rà soát sau GĐ 4, 2026-10-12)
- Sửa 10 móc viết sai đơn vị: Long tượng chi lực chiến lực +10% (trước là +1000%), Thân như liễu yếu thương tích +20%, Khuynh quốc khuynh thành mua rẻ 10%, Đạo tâm như bàn thạch kháng tâm ma 20% (trước là miễn hoàn toàn); Độ Kiếp Thể và Đại Khí Vãn Thành đột phá đại cảnh giới +5% / +15% (trước gần như 0); Trung Châu đột phá +2%; trạng thái cực hạn cộng thọ nguyên theo tỉ lệ như mọi nơi khác.
- Validator báo lỗi khi móc tính theo tỉ lệ (0.2 = 20%) mang số lớn hơn 2, hoặc móc tính theo điểm phần trăm (đột phá, thiên kiếp, bệnh) mang số dưới 1.
- Nối các móc nội dung đã hứa mà engine chưa đọc: `npcAffinityStart` (thiện cảm khởi đầu với người mới), `ignoreElementWeakness` (bị khắc hệ không bị phạt), `divineSense` (thần thức giúp chạy trốn, `balance.combat.divineSenseEscape`), `craft.all.success`, `agingSlow` (già chậm `balance.aging.slowAgingYears` năm), `cannotWork` (liệt giường không đi làm được), `noLineageChange` (không đổi đạo thống), `trigger.everyNYears` (Tử Khí Đông Lai: mỗi 10 năm chắc có kỳ ngộ).
- **Còn treo**: `charmResist` (chưa có hệ thống mị thuật), `counter` của Đảo Môi Tinh, `trigger.cheatDeath` từ trạng thái Phúc tinh cao chiếu.
### Task 5b.9 — Cầu đầu thai (2026-10-12)
- Theo `mortal-path.md` mục 3.2 và quyết định của chủ dự án (cách 2):
  - Xuất thân thường vẫn chọn miễn phí.
  - Xuất thân hiếm phải tiêu điểm Luân Hồi mỗi lần chọn: Con nhà quan 10 điểm, Hậu duệ gia tộc tu tiên 30 điểm (trường `rebirthCost` trong `origins.json`).
  - "Để trời định" vẫn miễn phí và vẫn có thể quay ra xuất thân hiếm.
- Màn tạo nhân vật ghi giá dưới xuất thân hiếm. Không đủ điểm thì nút bị khóa và hiện số điểm đang có.
- Điểm chỉ bị trừ khi xác nhận khí vận ("Thuận theo thiên ý"); quay lại giữa chừng thì không mất.
- **Bổ sung kỹ thuật**: chọn xuất thân nào có giá, và giá bao nhiêu điểm.

### Task 5b.10 — Trùng sinh (phần code, 2026-10-12)
- Móc `rewindOnDeath` nay có tác dụng: khi chết, màn tổng kết đời có nút **Trùng sinh** (`src/systems/rewind.ts`).
  - **Hồi Quang Kính** (vật phẩm mới, `{ "hook": "rewindOnDeath", "at": 6 }`): quay về năm 6 tuổi (`mortal-path.md` 3.3).
  - Thiên phú **Nhất Niệm Hồi Quang** (F23, đã có từ 2.7): quay về lúc mới vào đại cảnh giới hiện tại (`fate-talents.md`).
- Sau khi trùng sinh:
  - Linh căn giữ nguyên.
  - Bật cờ `ky_uc_kiep_truoc`, nên sự kiện có thể có lựa chọn ẩn "Ta biết chuyện này sẽ xảy ra" (`requires.flags`).
  - Mỗi đời chỉ một lần.
  - Bộ sinh ngẫu nhiên đổi hạt, nên những năm về sau không lặp lại y như cũ ("con bướm vỗ cánh").
- Game tự lưu hai mốc để quay về: lúc 6 tuổi, và lúc mới vào mỗi đại cảnh giới. Save cũ được bổ sung mốc rỗng.
- **Bổ sung kỹ thuật**: mô tả Hồi Quang Kính, câu chữ lúc trùng sinh (`life-texts.json`: `rewindOffer`, `rewindAge6`, `rewindRealm`).
- **Chưa làm** (nội dung ✍️, chờ file của chủ dự án): sự kiện kỳ ngộ nhận Hồi Quang Kính, các lựa chọn ẩn "Ta biết chuyện này sẽ xảy ra", thiên phú luân hồi trùng sinh (5b.1).

### Task 5b.8 — Phúc báo (2026-10-12)
- Theo `mortal-path.md` mục 3.1, dữ liệu trong `content/blessings.json`. Đời kết thúc khi còn là phàm nhân thì nhận Phúc báo cho kiếp sau:
  - **Đại thiện nhân** (nhân quả ≥ +60): đo linh căn quay 2 lần, lấy kết quả tốt hơn. Dùng móc mới `rootReroll`.
  - **Danh chấn một nghề** (lên nấc 5 của một con đường đời): +5 chỉ số chính của đường đó.
  - **Bách tuế** (sống tới 100): thọ nguyên kiếp sau +10%.
  - **Xả thân cứu người** (chết trong trận ra tay cứu người): thêm một lần quay khí vận.
- Phúc báo hiện ở màn tổng kết đời, rồi ở màn quay khí vận và dòng đầu nhật ký của kiếp sau.
- Phúc báo chỉ trao cho lần **đầu thai kiếp mới** kế tiếp. Chơi tiếp bằng con cháu thì Phúc báo vẫn chờ.
- Trận đánh có cờ `rescue`; chết trong trận ấy thì bật cờ `chet_vi_cuu_nguoi`. Đã gắn cho trận "Ra tay giết ma tu, cứu người" (sự kiện `lo_dinh_cam_do`).
- "Con cháu ≥ 5 → chơi tiếp bằng con cháu": task 5.7 đã cho chơi tiếp bằng con đã lớn mà không cần đủ 5, nên không thêm gì.
- **Bổ sung kỹ thuật**:
  - "Chỉ số chính" lấy chỉ số đầu tiên trong `mainStats` của con đường.
  - Câu chữ ngắn trên màn hình cho 4 Phúc báo.

### Task 5b.1 — Tổng kết đời + điểm Luân Hồi (phần code, 2026-10-12)
- **Màn tổng kết đời đầy đủ hơn**: cảnh giới, tông môn, gia tộc, đạo lữ, con cái, đệ tử, hạng Thiên kiêu bảng, đường đời, linh thạch.
- **Dấu ấn một đời**: 5 khoảnh khắc hiếm gần nhất trong nhật ký.
- **Điểm Luân Hồi** (`src/systems/rebirth.ts`, số trong `balance.rebirth`), tính theo:
  - năm tháng đã sống, cảnh giới (hoặc bậc võ đạo nếu là phàm nhân), nấc đường đời;
  - số biến cố đã trải, đại thiện/đại ác (nhân quả ±60), con cái;
  - khai tông lập phái, lập gia tộc, lên Thiên kiêu bảng.
- Điểm cộng dồn qua các kiếp, lưu trong meta của trình duyệt; màn mở đầu hiện tổng điểm.
  - Mỗi đời chỉ nhận điểm một lần.
  - Quỷ tu chết lần nữa chỉ nhận phần chênh lệch.
- **Bổ sung kỹ thuật** (PLAN và `mortal-path.md` không ghi cách tính điểm): các nguồn điểm và mức điểm ở trên.
- **Chưa làm**: ✍️ thiên phú luân hồi (dùng điểm để mua), chờ file thiết kế của chủ dự án.

### Task 5.3 — Sự kiện tông môn (phần engine, 2026-10-12)
- Điều kiện sự kiện `ownSect`: đã lập tông môn, khoảng số đệ tử, công trình đạt cấp tối thiểu.
- Hiệu ứng `ownSect`: thêm/bớt đệ tử, kho linh thạch, đà tăng đệ tử năm sau. Validator đòi sự kiện có hiệu ứng này phải có `conditions.ownSect.has = true`.
- Đối thủ trận đánh có cờ `againstSect`: mỗi cấp Hộ Sơn Đại Trận làm kẻ công sơn yếu đi 10%, tối đa 50% (`balance.founding`).
- `{sect}` trong sự kiện nay hiện tên tông môn tự lập khi có.
- **Chưa làm**: nội dung sự kiện (khiêu khích, phản đồ, đại bỉ, ma đạo công sơn…), chờ file thiết kế của chủ dự án.

### Task 5.4 — Gia tộc tu tiên (2026-10-12)
- **Lập gia tộc** (tab Gia đình, mục Gia tộc):
  - Điều kiện: từ Trúc Cơ, có con, 100 linh thạch dựng từ đường (`balance.clan`).
  - Tên theo họ, ví dụ "Lâm gia". Chọn tối đa 2 gia quy.
- **4 gia quy** (`content/clan.json`):
  - Trọng tu luyện: con sinh trong tộc quay linh căn thêm một lần, lấy kết quả tốt nhất.
  - Trọng thương nghiệp: sản nghiệp sinh lời ×1.5.
  - Độc đinh truyền thừa: người kế thừa giữ thêm 20% gia sản.
  - Tích thiện: nhân quả +2 mỗi năm, sản nghiệp ×0.9.
- **4 loại sản nghiệp**, mua bằng bạc hoặc linh thạch, mỗi năm sinh lời và ghi vào nhật ký: Ruộng tốt, Cửa hiệu, Linh điền, Mỏ linh thạch nhỏ.
- **Tộc phả**: các đời trước (5.7), người đang sống, rồi tới con cháu.
- **Gia tộc truyền sang người kế thừa** cùng gia quy và sản nghiệp.
- **Bổ sung kỹ thuật** (PLAN chỉ ghi "tộc phả, sản nghiệp, gia quy"): điều kiện, 4 gia quy, 4 sản nghiệp, giá, lợi tức, câu văn.

### Task 5.7 — Chơi tiếp bằng con cháu hoặc đồ đệ (2026-10-12)
- **Màn hình chết** liệt kê người kế thừa: con còn sống từ 6 tuổi (kèm linh căn nếu đã thử) và đồ đệ còn sống (kèm cảnh giới). Chọn một người thì chơi tiếp bằng người đó.
- **Con kế thừa**:
  - Giữ linh căn di truyền đã quay lúc sinh (3.7); đủ tuổi thử linh căn thì vào Luyện Khí ngay.
  - Người vừa mất thành cha/mẹ đã khuất; đạo lữ còn sống thành cha/mẹ; các con khác thành anh chị em.
- **Đồ đệ kế thừa**: giữ cảnh giới, tầng và tu vi; có linh căn dùng được và Dẫn Khí Quyết.
- **Kế thừa** (`balance.heir`):
  - 80% bạc và linh thạch, toàn bộ túi đồ.
  - Tông môn tự lập (5.1): người kế thừa thành chưởng môn.
  - 30% nhân quả và danh vọng (phúc ấm).
  - Thế giới giữ nguyên: NPC và sổ ân oán, nên kẻ thù cũ sẽ tìm tới người kế thừa; Thiên kiêu bảng cũng giữ nguyên.
- **Tộc phả**: mỗi đời ghi tên, cảnh giới, tuổi mất, nguyên nhân, và ai kế thừa. Màn hình chết hiện tộc phả và "đời thứ N". Phần này dùng tiếp cho gia tộc ở 5.4.
- Câu văn ở `content/heir.json`.
- **Bổ sung kỹ thuật** (PLAN chỉ ghi "chơi tiếp bằng con cháu hoặc đồ đệ khi chết"): tỉ lệ kế thừa, tuổi tối thiểu, câu văn.

### Task 5.2 — Công trình và báo cáo tông môn (2026-10-12)
- **Tông môn tự chạy mỗi năm** (`balance.founding`):
  - Đệ tử mới = số đệ tử × (5% + công trình + quyết định năm trước), ít nhất 1, nhân hệ số tông quy.
  - 2% đệ tử bỏ đi mỗi năm.
  - Số đệ tử tối đa theo cảnh giới chưởng môn: Kim Đan 100, Nguyên Anh 500, Hóa Thần 2000.
  - Kho nhận 0.5 linh thạch mỗi đệ tử, cộng thu nhập công trình, trừ bảo trì. Nhân quả đổi theo tông quy.
- **Báo cáo cuối năm**:
  - Nhật ký ghi số đệ tử và kho, kèm mức thay đổi.
  - Bảng Tông môn hiện 1–3 việc cần quyết: chia linh thạch cho đệ tử, mở đại hội thu đồ, rút linh thạch về tay chưởng môn, cứu tế dân làng.
  - Mỗi việc quyết một lần; việc nào bỏ qua thì trưởng lão tự lo, tông môn vẫn chạy bình thường.
- **5 công trình**, mỗi cái 3 cấp, xây bằng kho tông môn:
  - Tàng Kinh Các: chưởng môn tu nhanh hơn 5% mỗi cấp.
  - Linh Điền: thu nhập.
  - Nghênh Khách Đường: thu thêm đệ tử.
  - Hộ Sơn Đại Trận: phòng thủ, dùng cho sự kiện 5.3.
  - Luyện Đan Phòng: mỗi năm dâng chưởng môn Tụ Khí Đan theo cấp.
- Chưởng môn **góp 50 linh thạch vào kho** bằng một nút.
- Validator kiểm tra trùng id công trình/quyết định, cảnh giới, vật phẩm của Luyện Đan Phòng.
- **Bổ sung kỹ thuật** (PLAN chỉ ghi "công trình + báo cáo, 1–3 quyết định"): mọi con số, 5 công trình, 5 quyết định và câu văn trong `founding.json`.

### Task 5.1 — Khai tông lập phái (2026-10-12)
- **Điều kiện**: từ Kim Đan, có 300 linh thạch (`balance.founding`). Bảng Tông môn có mục **Khai tông lập phái**.
- **Khi khai tông**:
  - Đặt tên tông môn, có nút gợi ý tên ghép từ `content/founding.json`, ví dụ "Thanh Tiêu Tông".
  - Tông môn theo đạo thống của người chơi.
  - Chọn tối đa 3 tông quy.
  - Đang ở tông môn nào thì rời đi (không quay lại được).
  - Ngày khai tông có 10 đệ tử ở Kim Đan, 40 ở Nguyên Anh, 120 ở Hóa Thần.
- **6 tông quy**, mỗi quy đổi tốc độ thu đệ tử (dùng ở 5.2), nhân quả mỗi năm, danh vọng lúc khai tông và móc K.6 cho chưởng môn:
  - Cấm sát sinh;
  - Kẻ mạnh làm vua;
  - Trọng tình nghĩa;
  - Mở cửa cho tán tu;
  - Bế môn tự thủ (tu luyện +5%);
  - Môn quy nghiêm minh (đột phá +2).
- Dòng danh hiệu trên đầu hiện "{tên tông} · Chưởng môn". Bảng Tông môn hiện tên, đạo thống, năm khai tông, số đệ tử, các tông quy.
- **Bổ sung kỹ thuật** (PLAN chỉ ghi "điều kiện, đặt tên, đạo thống, tông quy"): mọi con số, bộ chữ ghép tên, 6 tông quy và câu văn trong `founding.json`.
### Task 4.8 — Bản đồ đại vực (2026-10-12)
- **Bản đồ** (nút 圖 trên thanh trên cùng): 6 đại vực của Thương Lan giới, mở dần theo cảnh giới. Mỗi năm đi được một chuyến. Thanh trên cùng hiện vùng đang ở.
  | Vùng | Mở từ | Linh khí | Đặc điểm |
  |---|---|---|---|
  | Thanh Vân châu (quê nhà) | Từ đầu | ×1 | Yên ổn |
  | Vô Chủ hoang nguyên | Luyện Khí | ×1.1 | Cướp bóc ×2, chiến lợi phẩm +20% |
  | Vạn Thú sơn mạch | Trúc Cơ | ×1.3 | Yêu thú ×3, linh thảo ×2, chiến lực −5% |
  | Đông Hải quần đảo | Kim Đan | ×1.5 | Bí cảnh ×2, kỳ ngộ ×1.5, mua rẻ hơn 5% |
  | Bắc Minh tuyết vực | Nguyên Anh | ×1.8 | Kháng tâm ma +20%, Tốc −10%, ít tình duyên |
  | Thương Lan Trung Châu | Hóa Thần | ×2 | Đột phá +2, bí cảnh ×2 |
- **Đại năng trấn giữ**: mỗi vùng có một đại năng (Thanh Vân Tử, Bạch Cốt Bà Bà, Kim Mao Hống, Thương Hải Lão Tổ, Hàn Sơn Kiếm Tôn, Thiên Diễn Đạo Quân). Lần đầu đặt chân tới thì nghe chuyện về họ; ở đó có một sự kiện gặp mặt riêng.
- Engine (dùng chung mọi thế giới): `content/worlds/<id>/regions.json`; linh khí vùng nhân vào công thức tu luyện (PLAN G.1); điều kiện `region` của sự kiện nay có tác dụng. Validator kiểm tra cảnh giới, id vùng trong sự kiện, và cấm móc `stat.*` cho vùng (móc đó chỉ cộng một lần).
- Dev mode: đi được mọi vùng, không giới hạn mỗi năm một chuyến.
- **Nội dung do Claude tự soạn** theo lời chủ dự án, chưa qua duyệt.

### Task 4.6 — Bí cảnh dạng chuỗi nhiều bước (2026-10-12)
- **Bí cảnh đi liền nhiều bước trong cùng một năm**: chọn xong một bước thì bước sau mở ngay; bước nào cũng có lựa chọn rời bí cảnh. Năm chỉ trôi khi ra khỏi bí cảnh.
- **Vạn Kiếm Trủng** (Luyện Khí đến Trúc Cơ), 4 bước: Rừng kiếm gãy, Kiếm khí trận, Kiếm hồn canh mộ (đánh thật, hoặc đi khe hở trận nếu đã tính ra quy luật), Mộ kiếm chủ (chọn một: kiếm, kiếm kinh, vò rượu, hoặc khấu đầu).
- **Long Uyên Thủy Phủ** (từ Kim Đan), 3 bước: Hành lang ngọc trai, Giao hồn, Long châu. Lập đội thì ở bước cuối phải chia đều hoặc ra tay trước với đồng đội.
- Engine (dùng chung mọi thế giới): hiệu ứng `chain` mở sự kiện kế tiếp ngay lập tức, đặt được trong kết quả thắng/thua của trận đánh. Validator báo chain tới sự kiện không tồn tại, và chain đặt cạnh trận đánh.
- **Nội dung do Claude tự soạn** theo lời chủ dự án, chưa qua duyệt.

### Task 4.11 — Tàn hồn "lão gia gia" (2026-10-12)
- **Cửa 2.5 của đường phàm nhân** (`mortal-path.md`): từ 12 tuổi, cực hiếm, mua nhầm chiếc nhẫn biết ho ở chợ hoặc mò được dưới sông. Đeo vào thì có **Nhẫn cổ tàn hồn** (mang theo: tốc độ tu luyện +20%, bình cảnh dễ vượt hơn 10%).
- **Chuỗi sự kiện** (`content/worlds/thuong_lan/events/remnant-soul.json`):
  1. **Lão gia gia trong nhẫn** chỉ đường tới ao linh tủy. Đi theo, hỏi vặn lão (thử Trí lực: thấy lão hỏi ngày giờ sinh hơi kỹ), hoặc cất nhẫn đi.
  2. **Ao linh tủy Hắc Phong** (thiên địa kỳ vật): phàm nhân không linh căn được khai mạch (Tứ hoặc Ngũ linh căn); người đã tu thì hấp thu linh khí; hoặc nhường ao cho lão.
  3. **Thức hải có khách**, 5–12 năm sau (nhường ao thì 3–6 năm): lão đoạt xá. Có phù trấn hồn nếu đã nhìn ra lão; cố thủ thức hải (Đạo tâm 55, lão đã hồi phục thì 75); hoặc thương lượng tìm xác khác (Mị lực 60). Thua thì thần hồn tổn thương và lão quay lại lần sau.
- Hệ Kim Thủ Chỉ đầy đủ vẫn ở task 5b.2; lần này lão gia gia đi bằng vật phẩm, cờ và sự kiện, không cần engine mới.
- **Nội dung do Claude tự soạn** theo lời chủ dự án, chưa qua duyệt.

### Task 4.10 — Áp lực thọ nguyên (2026-10-12)
- **Đại hạn sắp tới**: khi thọ nguyên còn lại ≤ 10% (`balance.lifespan.pressureLeftPct`), sự kiện bật ngay năm đó, không phải chờ quay ngẫu nhiên. Người tu tiên gặp "Đại hạn sắp tới", phàm nhân gặp "Tuổi già gõ cửa". Mỗi đời một lần.
  - Người tu tiên chọn: bế quan liều phá cảnh (đột phá kế +15, bế quan 3 năm), đi tìm thọ đan, tìm thân xác trẻ (chỉ khi nghiệp ≤ −20), hoặc thuận theo thiên mệnh (giảm tâm ma).
  - Phàm nhân chọn: mua sâm trăm năm, lên núi cầu tiên (thử vận may), chép gia phả, rủ bạn cũ uống rượu.
- **Thọ Nguyên Đan lên sàn**: trả giá 1000 linh thạch, chặn đường cướp (đánh thật), tự luyện (cần luyện đan cấp 3), bán mạng cho lão giàu, hoặc bỏ về. Thọ đan cộng theo **% thọ nguyên** nên có giá trị ở mọi cảnh giới.
- **Đêm mưa đoạt xá**: thử Đạo tâm; thành thì thọ nguyên +40%, nghiệp −40, tâm ma +20; bại thì thần hồn nứt. Hoặc bỏ đi, để lại linh thạch cho người kia.
- **Di ngôn**: năm cuối đời, chọn truyền y bát, chôn động phủ cho người hữu duyên, viết thư cho kẻ thù, hoặc không để lại gì.
- Engine mới (dùng chung mọi thế giới): điều kiện `lifespan` (`nearEnd`, `maxLeft`), hiệu ứng `lifespanPct`, cờ sự kiện `urgent` (bật ngay khi đủ điều kiện, sau follow-up đến hạn).
- **Nội dung do Claude tự soạn** theo lời chủ dự án, chưa qua duyệt. Ghi chú thiết kế: `docs/design/lifespan-4-10.md`.

### Task 4.3 — Hình thái Nguyên Anh (2026-10-12)
- **Mở đột phá Nguyên Anh** (`majorBreakthrough.openRealms`). Thiên kiếp 6 đạo lôi và tâm ma chiến của phiên trước áp dụng như các đại cảnh giới khác.
- **Kim Đan vỡ, hóa thành Nguyên Anh** với hình thái theo con đường đã đi (`content/nascent-souls.json`). Xét theo thứ tự, luật đầu tiên khớp thì lấy:
  1. Kim Đan Nhất hoặc Nhị phẩm: **Đạo Anh**.
  2. Theo đạo thống: Ma thì **Huyết Anh**, Phật thì **Xá Lợi Phật Anh**, Quỷ thì **U Hồn Anh**, Yêu thì **Yêu Linh Anh**.
  3. Theo con đường chiến đấu chính: Kiếm thì **Kiếm Anh**, Thể thì **Bất Hoại Kim Anh**, Pháp thì **Pháp Tướng Anh**, Binh thì **Thần Binh Anh**, Thuật thì **Huyễn Ảnh Anh**.
  4. Còn lại: **Thanh Liên Anh**.
- Mỗi hình thái có hiệu ứng riêng qua bộ móc K.6. Bảng Tu luyện hiện hình thái; nhật ký ghi lúc hóa anh.
- Chỉ số và thọ nguyên của hình thái cộng một lần lúc hóa anh. Chỉ dùng các móc đã có tác dụng (bỏ thần thức, kháng mị thuật, tư chất Ngự thú vì hệ thống của chúng chưa có).
- **Nội dung do Claude tự soạn** theo lời chủ dự án, chưa qua duyệt.

### Task 4.2 — Đan văn (2026-10-12)
- **Kim Đan thành thì mặt đan hiện đan văn**, sinh ra từ chính 3 luồng linh khí người chơi đã dẫn khi kết đan. Mỗi đan văn có hiệu ứng riêng qua bộ móc K.6.
- **12 đan văn** trong `content/core-patterns.json`. Xét theo thứ tự, gặp luật đầu tiên khớp thì lấy:
  1. **Liệt Văn**: đan từng rạn. Đột phá khó hơn một chút, đổi lại Đạo tâm vững hơn.
  2. **Tam Sinh Tuần Hoàn**: cả 3 luồng tương sinh nối nhau. Tu nhanh hơn, đột phá dễ hơn.
  3. **Thuần Nhất Đan Văn**: 3 luồng cùng một hệ.
  4. **Đan văn biến dị**: có luồng biến dị thì ra Lôi Văn, Hàn Băng, Phong Văn hoặc U Ám.
  5. **Đan văn ngũ hành**: theo hệ dẫn nhiều nhất (Canh Kim, Thanh Mộc, Huyền Thủy, Ly Hỏa, Hậu Thổ); hòa thì lấy luồng sau.
- Bảng Tu luyện hiện phẩm Kim Đan và đan văn cùng tác dụng. Nhật ký ghi lúc đan văn thành hình.
- Chỉ số và thọ nguyên của đan văn cộng một lần lúc đan văn thành hình; các tác dụng khác đi qua bộ móc K.6.
- Móc `element.root.power` và `element.all.power` (đã có ở vài khí vận nhưng trước đây không có tác dụng) giờ được tính khi khắc chế hệ trong trận.
- **Nội dung do Claude tự soạn** theo lời chủ dự án ("tự quyết định nội dung, mình sẽ xem lại sau"), chưa qua duyệt.

### Task 4.9 — Thu đồ đệ (cơ bản) (2026-10-12)
- **Thu đồ đệ** (tab Người quen):
  - Từ Trúc Cơ, mỗi năm thu được một đồ đệ.
  - Số đồ đệ tối đa theo cảnh giới: Trúc Cơ 1, Kim Đan 3, Nguyên Anh 5, Hóa Thần 9 (`balance.disciples`).
  - Đồ đệ là NPC 12–16 tuổi, có linh căn, tư chất 30–85, bái sư xong vào Luyện Khí. Đồ đệ tự tu luyện, già, chết theo hệ NPC 3.4.
  - Đồ đệ cũng có tính cách bề ngoài/bản chất, nên vẫn có thể lộ bộ mặt thật.
- **Chỉ điểm**, mỗi đồ đệ mỗi năm một lần:
  - Đồ đệ được +30% thanh tu vi, nhân với (0.5 + Ngộ tính của thầy / 100).
  - Thiện cảm +5, ân +5. Ân đủ nhiều thì đồ đệ có thể tới báo ân (sự kiện 3.4).
  - Người thầy được +3% tu vi ("dạy học tương trưởng").
- Câu văn ở `content/disciples.json`.
- **Bổ sung kỹ thuật** (PLAN chỉ ghi "Thu đồ đệ (cơ bản)"): mọi con số và câu văn trên.
- **Chưa làm**: đồ đệ giúp đánh nhau, truyền công pháp, đồ đệ phản sư; để GĐ 5 (tông phái và truyền thừa).

### Task 4.7 — Luyện đan và luyện khí (2026-10-12)
- Mục Bách nghệ có thêm **Luyện chế** dưới Luyện Đan và Luyện Khí. Luyện một mẻ chiếm lượt luyện nghề của năm đó (như Luyện tập).
- **Tỉ lệ thành công** = 60% + 2% mỗi cấp trên mức công thức yêu cầu + 0.5% mỗi điểm Ngộ tính trên 50 + móc `craft.<nghề>.success` (Thủ Ổn Tâm Tĩnh, Đan Hỏa Thuần Thanh…). Trong khoảng 10–95%.
  - Móc `craft.<nghề>.yield` cho thêm sản phẩm.
- **Thành bại**:
  - Thành công: cấp nghề +3.
  - Thất bại: cấp nghề +1, nguyên liệu mất. Lò đan hỏng còn lại một **Phế Đan**, đúng ghi chú đã duyệt của Đ15.
- **Phàm nhân** chỉ luyện được phàm dược (Bổ Khí Tán).
- **Công thức** (`content/recipes.json`, số liệu ở `balance.crafting`):
  - Luyện đan: Bổ Khí Tán, Hồi Xuân Đan, Tụ Khí Đan ×2, Thanh Tâm Đan, Phá Chướng Đan, Trúc Cơ Đan, Diên Thọ Đan, Kết Kim Đan. Dùng linh thảo trăm năm, linh chi nghìn năm, nội đan các cấp, và linh thạch.
  - Luyện khí: Thanh Phong Kiếm (linh tinh Kim), Huyền Thiết Giáp (linh tinh Thổ), Hộ Thân Ngọc Bội (linh tinh Thủy + Lôi Tinh).
  - Validator kiểm tra mọi nguyên liệu và sản phẩm đều có trong `items.json`.
- **Bổ sung kỹ thuật, cần chủ dự án duyệt**: bản duyệt `items.md` chỉ ghi vật phẩm nào là nguyên liệu, chưa có công thức. Toàn bộ công thức, cấp yêu cầu và giá là bổ sung, chỉ dùng vật phẩm đã duyệt. Muốn đổi chỉ cần sửa `recipes.json`.
- **Chưa làm**: sửa Pháp bảo cổ (V4) vì chưa có món "pháp bảo cổ đã sửa"; các nghề khác để GĐ 7 như PLAN.

### Task 4.4 — Tâm ma chiến (2026-10-12)
- **Khi nào xảy ra**: trước khi đột phá Kim Đan, Nguyên Anh hay Hóa Thần, nếu thuộc một trong ba trường hợp (`balance.heartDemon`):
  - còn hạt tâm ma (từ các lựa chọn đen tối của 3.9);
  - Đạo tâm dưới 30;
  - nhân quả từ −50 trở xuống.
  - Bảng đột phá báo trước: "Lòng còn vướng bận: trước khi đột phá phải qua tâm ma."
- **3 ảo cảnh dựng từ chính quá khứ** (`content/heart-demon.json`), lấy theo thứ tự ưu tiên:
  1. Việc ác đã làm: lô đỉnh, giết người đoạt bảo, làm gián điệp cho U Hà, rời bỏ người cũ.
  2. Người đã chết dưới tay ngươi (có hậu duệ, tra theo sổ ân oán 3.4).
  3. Kẻ còn ôm oán.
  4. Người cũ còn sống.
  5. Người thân đã mất.
  - Không đủ thì bù bằng nỗi sợ vô danh.
- **Mỗi ảo cảnh chọn một cách**:
  - Đối diện, nhận lỗi: thử Đạo tâm; thắng thì Đạo tâm +2.
  - Chém tan ảo ảnh: thử Ngộ tính.
  - Nhắm mắt niệm tâm pháp: thử Đạo tâm, cộng kháng tâm ma của công pháp, thiên phú, trạng thái.
  - Độ khó 50, mỗi hạt tâm ma +5.
- **Kết quả**:
  - Qua 2/3 ảo cảnh: xóa 2 hạt tâm ma, đột phá +5% rồi đi tiếp (Kim Đan thì sang kết đan).
  - Thua: tâm ma phản phệ, Đạo tâm −5, đột phá thất bại như thường.
- **Bổ sung kỹ thuật** (PLAN chỉ ghi "ảo cảnh dựa trên chính những việc bạn đã làm"): luật chơi và con số trên, cùng toàn bộ câu văn trong `heart-demon.json`. Chủ dự án duyệt hoặc sửa thì chỉ cần sửa file JSON này.

### Task 4.5 — Thiên kiếp (2026-10-12)
- **Đột phá thành công vào Kim Đan, Nguyên Anh hay Hóa Thần thì phải qua thiên kiếp** trước khi vào cảnh giới mới (`balance.tribulation`):
  - Kim Đan: 3 đạo lôi, mỗi đạo khoảng 15 sức khỏe.
  - Nguyên Anh: 6 đạo, khoảng 14 mỗi đạo.
  - Hóa Thần: 9 đạo, khoảng 13 mỗi đạo.
  - Mỗi đạo dao động ×0.7–1.3; đạo cuối nặng ×1.5.
- **Giảm sát thương** (tối đa 80%):
  - Giáp và pháp bảo hộ thân (`injuryReduce`).
  - Móc K.6 mới `tribulationDefense` cho trận pháp hoặc pháp bảo chuyên chống kiếp.
  - Căn cốt trên 50.
  - Linh căn hệ Lôi giảm 10% (đúng mô tả đã duyệt trong `realms-roots-paths.md`).
- **Nặng hơn**: các móc đã có `tribulationPct` (Phúc tinh cao chiếu, Ác quán mãn doanh) và `tribulationPower` (Thiên Mệnh Sở Quy +30%).
- **Hộ Thân Ngọc Bội** vỡ thay ngươi, đỡ cả phần kiếp còn lại (còn 1 sức khỏe).
- **Kết quả**:
  - Qua kiếp: thân thể được tôi luyện, Căn cốt +3.
  - Không qua: chết, nguyên nhân mới "Mất dưới thiên kiếp", có lời kết riêng. Chết vì thiên kiếp có 10% hóa quỷ tu.
- **Báo trước**: bảng đột phá và popup kết đan đều ghi số đạo lôi, sát thương ước tính và sức khỏe hiện có, để kịp uống đan hồi sức hoặc mặc giáp.
- **Popup kết đan**: luồng đúng hệ công pháp nay ghi rõ "Hợp công pháp" thay vì "Bình thường".
- **Bổ sung kỹ thuật** (PLAN chỉ ghi "ở các mốc lớn, cần pháp bảo/trận pháp"): mọi con số trên, 6 câu văn thiên kiếp trong `realms.json` và `life-texts.json`.
- **Chưa có**: trận pháp hay pháp bảo chuyên chống kiếp. Móc `tribulationDefense` đã sẵn, chờ thêm vật phẩm trong file thiết kế.

### Task 4.12 — Quỷ tu (2026-10-12)
- **Chấp niệm khi chết** (`mortal-path.md` mục 2.6, số liệu ở `balance.ghost`): tùy cách chết mà có cơ hội hồn không tan.
  - Tử trận 25%; đột phá hoặc thiên địa kỳ vật 10%; bệnh 5%; chết già 0.
  - Khí vận mỗi điểm trên 50 cộng 0.4%. Móc K.6 mới `continueAfterDeath` cộng thêm. Tối đa 60%.
  - Mỗi đời một lần. Dùng dòng ngẫu nhiên riêng theo seed.
- **Màn hình chết** có thêm lựa chọn "Hóa quỷ tu, tu tiếp bằng Quỷ đạo". Chọn thì chơi tiếp:
  - Ít nhất Luyện Khí.
  - Tu Bất Tử U Minh Lục (công pháp chỉ quỷ tu đọc được), theo Quỷ đạo.
  - Không cần linh căn: tu theo Đạo tâm như Phật duyên.
  - Sức khỏe về 60, thọ nguyên thêm 150 năm.
- **Cái giá**:
  - Sức khỏe không hồi phục, cũng không suy theo tuổi; Quỷ đạo làm Sức khỏe −1 mỗi năm.
  - Người sống sợ hãi: Mị lực −10 khi theo Quỷ đạo (task 3.8).
- **Chưa làm**: ánh mặt trời gây hại (chưa có hệ ngày/đêm hay nơi chốn).
- **Bổ sung kỹ thuật** (thiết kế chỉ mô tả bằng lời): mọi tỉ lệ, cảnh giới, sức khỏe, thọ nguyên trên, và hai câu văn trong `life-texts.json`.

### Task 4.2 — Kết đan (phần code, 2026-10-12)
- **Mở đột phá Kim Đan** (`majorBreakthrough.openRealms`). Đột phá không còn là một lần quay, mà là **mini-game kết đan 3 lượt**. Năm sau phải chờ kết đan xong.
- **Mỗi lượt** hiện 3 luồng linh khí, thỉnh thoảng có một luồng biến dị (Lôi, Băng, Phong, Ám). Chọn 1 luồng dẫn vào đan:
  - +6 độ thuần.
  - Đúng hệ linh căn: thêm +10.
  - Tương sinh với luồng trước (Mộc→Hỏa→Thổ→Kim→Thủy→Mộc): thêm +10.
  - Đúng hệ công pháp: thêm +4.
  - Tương khắc với luồng trước: −10 và đan rạn. Rạn 2 lần thì đan vỡ, tính là đột phá thất bại.
  - Nút nào cũng hiện trước hiệu quả.
- **Độ thuần ban đầu** = 20 + (Ngộ tính − 50) × 0.3 + thưởng theo phẩm đạo cơ Trúc Cơ (hạ −8, thượng +8, hoàn mỹ +15).
- **Kết quả**:
  - Tỉ lệ thành công = tỉ lệ đột phá thường + (độ thuần − 50) × 0.3.
  - Thành công thì độ thuần định phẩm, từ Nhất phẩm (≥ 95) tới Cửu phẩm.
  - Phẩm Kim Đan thay đạo cơ quyết định tốc độ tu từ Kim Đan trở đi (×1.3 tới ×0.8).
  - Phẩm trên Ngũ phẩm thì thọ thêm 10 năm mỗi phẩm.
  - Phẩm cũng quyết định độ hiếm của thiên phú Nghịch Thiên Cải Mệnh lần này.
- **Mô phỏng**: người chơi cẩn thận (Song linh căn, Ngộ tính 60, đạo cơ trung phẩm) thành công khoảng 31%, phẩm thường là Tam hoặc Tứ phẩm. Nhất, Nhị phẩm cần đạo cơ hoàn mỹ và Ngộ tính cao.
- **Kỹ thuật**: tách phần thành công/thất bại của đột phá đại cảnh giới thành `majorSuccess` / `majorFailure` để kết đan dùng chung. Validator kiểm tra cảnh giới, hệ và phẩm đạo cơ trong `balance.coreForming`.
- **Bổ sung kỹ thuật** (PLAN chỉ ghi "3 lượt xếp linh khí → phẩm 1–9"): toàn bộ luật chơi và con số trên, tên phẩm, và 7 câu nhật ký trong `realms.json`.
- **Chưa làm**: ✍️ đan văn, chờ file thiết kế của chủ dự án.

### Task 4.1 — Bế quan (2026-10-12)
- **Bảng Tu luyện có mục Bế quan.** Số năm chọn được theo cảnh giới (`balance.seclusion.options`):
  - Luyện Khí: 1, 3, 5.
  - Trúc Cơ: thêm 10.
  - Kim Đan: 3, 10, 30.
  - Nguyên Anh và Hóa Thần: 10, 30, 100.
- **Trong lúc bế quan**:
  - Tu vi ×1.5 (PLAN G.1).
  - Không có sự kiện thường; các sự kiện nối chờ tới lúc xuất quan.
  - Năm tháng vẫn trôi: người thân già đi và có thể qua đời, thế giới và Thiên kiêu bảng vẫn đổi.
  - Người trong lòng và đạo lữ nhạt dần, thiện cảm −1 mỗi năm.
  - Nhật ký mỗi năm ghi "Bế quan tĩnh tu", lúc ra ghi tu vi mới.
- **Xuất quan sớm** khi tu vi đã viên mãn cần đột phá, hoặc khi thọ nguyên chỉ còn 5 năm.
- **Hiệu ứng sự kiện mới `seclusionYears`**: đóng cửa ngay sau sự kiện, và không dừng vì viên mãn (mục đích là ngồi qua bình cảnh). Sự kiện đã duyệt "Bình cảnh Luyện Khí → Bế quan khổ tu" nay bế quan 3 năm đúng thiết kế; trước đây tạm không trôi thời gian.
- Save cũ: không đang bế quan.
- **Bổ sung kỹ thuật** (PLAN chỉ ghi "Bế quan X năm"): bảng số năm theo cảnh giới, ngưỡng xuất quan sớm, thiện cảm nhạt dần, và 5 câu nhật ký trong `realms.json`.

### Task 3.13 — Ma tu hứa khai mạch + sự kiện con đường đời (2026-10-12)
- **15 sự kiện** theo bản đã duyệt `docs/design/events-3-13.md`.
- **Chuỗi Hương Hỏa Hội** (`mortal-path.json`):
  - Hang khai mạch → Đêm huyết tế → Kẻ nhớ mặt.
  - Không kết cục nào khai mạch thật: chỉ có nhận ra, trốn thoát, hoặc chết.
  - Đánh ma tu U Hà là trận thật với Luyện Khí tầng 9 (chiến lực ×0.5).
  - Lựa chọn "Phá trận" chỉ hiện khi có flag `tinh_tao`.
  - Lựa chọn "Treo hạc giấy" ghi một kẻ thù vào sổ ân oán (task 3.4).
- **12 sự kiện con đường đời** (`careers.json` mới), mỗi đường 3 sự kiện ở bậc giữa và cao:
  - Quan lộ: Thi Hội, Hạn hán ba năm, Gian thần trong triều.
  - Thương lộ: Chuyến hàng qua núi, Khách hàng đeo kiếm bay, Tuyển hoàng thương.
  - Võ lâm: Mở võ quán, Thư hẹn đỉnh núi, Huyết án võ lâm.
  - Y lộ: Bệnh lạ, Khách nửa đêm, Hoàng hậu lâm bệnh.
- **Phần bổ sung kỹ thuật** (bản duyệt chưa ghi chi tiết):
  - Nối chuỗi:
    - "Tin theo, nhập hội" của sự kiện đã duyệt có thêm `followUp` tới Hang khai mạch sau 3 năm. Nhánh thất bại của "Hỏi kỹ" (cũng nhập hội) có cùng `followUp`.
    - "Nối tiếp ngay" được làm thành `followUp` sau 0 năm, nên Đêm huyết tế tới vào năm kế.
    - Kẻ nhớ mặt là sự kiện ngẫu nhiên cho người có flag `ke_thu_u_ha`, một lần mỗi đời. Thiết kế ghi "2–10 năm sau" nhưng không ghi cách hẹn giờ.
  - Lựa chọn tốn bạc (Mua đề 500, Thuê tiêu cục 200, Đút lót 2000, Mở quán 100) đòi đủ bạc mới chọn được.
  - Thêm văn bản kết quả ngắn cho những lựa chọn mà bản duyệt chỉ ghi hiệu ứng.
  - Tuổi tối thiểu 16 cho Kẻ nhớ mặt.

### Task 3.10 — Tiên Thiên Khí Vận lên 40 (2026-10-12)
- **20 khí vận mới** theo bản đã duyệt `docs/design/traits-2.md`, nâng tổng lên 40. Phân bố: Phàm 5, Lương 4, Ưu 4, Tuyệt 2, Thiên 1, Thần 1, Ác vận 3.
  - Lấp các trục bản 1 còn trống: con đường Pháp/Binh/Thuật; nghề Khí, Trận, Phù, Linh thực, Ngự thú; tâm ma; thiên kiếp; ma đạo.
- **Tag sự kiện:** gắn thêm `justice` cho Án oan ở huyện, Hương Hỏa Hội lộ mặt, Đại hội võ lâm, Bảng treo thưởng (lựa chọn tiếp) và Rủ rê phục kích. Nhờ vậy Hiệp Cốt có tác dụng.
- **Lựa chọn ẩn cho khí vận mới:**
  - Mắt Tinh: cùng Thông Minh Vặt mở lựa chọn "Thấy mực trên bản đồ còn mới" ở Bản đồ giá rẻ.
  - Hiệp Cốt: lựa chọn mới "tự mình đi bắt kẻ vu oan" ở Án oan ở huyện.
  - Thú Duyên, Chiêu Yêu Thể: lựa chọn mới "Ngồi xuống, chìa tay ra" ở Hồ ly bị thương, và "nhìn thẳng vào mắt hổ" ở Yêu thú xuống làng.
  - Văn bản 3 lựa chọn mới là **phần bổ sung**, vì bản duyệt chỉ ghi chỗ đặt.
- **Nối 2 móc đã có trong K.6:**
  - `priceDiscount`: Khéo Mồm, Mắt Tinh làm giá mua ở phường thị rẻ hơn, tối đa `balance.market.maxDiscount` (30%).
  - `heartDemonResist`: tâm ma nhận vào giảm theo tỉ lệ. Kháng âm (Ma Tâm Chủng) thì tâm ma tăng thêm.
- **Chưa có tác dụng:** `divineSense`, `charmResist`, `tribulationPower` chờ hệ thống thần thức và thiên kiếp ở giai đoạn 4.

### Task 3.4 — NPC có số mệnh riêng (2026-10-12)
- **Engine** (phiên làm `task/3.4-npcs`):
  - NPC già đi, tự tu luyện và đột phá, rồi chết.
  - Sổ ân oán phai dần theo năm. Oán ≥ 30 thì có thể tìm tới báo thù, ân ≥ 30 thì tới báo ân. Giết một NPC thì người thân cùng họ nhận một nửa mối thù.
  - Giao chiến với NPC dùng đúng cảnh giới của người đó.
  - Bảng Quan hệ có tab Người quen. Developer mode có nút gặp nhanh bạn, thù, ân nhân.
- **Nội dung theo bản đã duyệt** `docs/design/npcs.md`:
  - `content/npc-traits.json`: 8 bề ngoài, 8 bản chất, 6 mục tiêu đời.
  - Theo bảng "bề ngoài che giấu bản chất": người Ôn hòa có thể là Tham lam, Mưu mô hoặc Thù dai, và lộ ra qua sự kiện Bộ mặt thật.
  - Bản chất đổi luật chơi:
    - Trung hậu: báo ân ×2.
    - Mưu mô: thiện cảm tăng một nửa.
    - Thù dai: oán không phai, báo thù ×1.5.
    - Nhân hậu: oán phai ×3, báo thù ×0.5.
    - Cuồng vọng: tu nhanh ×1.3, mỗi năm 1% chết sớm.
    - Chân thành: lộ bản chất ngay từ đầu (thêm trường `honest`).
- **4 sự kiện ân oán** (`events/npcs.json`, mục "Ân oán"): Cố nhân tìm tới, Báo ân, Hậu duệ báo thù, Bộ mặt thật.
  - Đánh nhau là trận thật với chính NPC đó.
  - Bồi thường trả bạc nếu là phàm nhân, linh thạch nếu là tu sĩ.
  - Văn bản 4 sự kiện là **phần bổ sung** dựa trên khung đã duyệt (bản nháp ghi "viết sau khi bạn duyệt khung này").
- Placeholder mới `{npcSurface}`, `{npcNature}`.
- **Chưa làm** (bản duyệt có nhắc nhưng chưa có hệ thống tương ứng):
  - Mục tiêu đời mới chỉ hiển thị, chưa đổi hành vi NPC.
  - Hèn nhát chưa "đâm sau lưng".
  - NPC chưa có phe và chưa lập gia đình.
  - Chưa có "ra tay giúp khi ngươi gặp nạn".

### Task 3.9 — 40 sự kiện giang hồ (2026-10-12)
- **Nhập đủ 40 sự kiện đã duyệt** của `docs/design/events-jianghu.md` vào `content/worlds/thuong_lan/events/`:
  - `romance.json`: Tình duyên, 10 sự kiện.
  - `plunder.json`: Giết người đoạt bảo, 8 sự kiện, cộng 1 sự kiện nối cho lựa chọn tiếp của #14.
  - `demonic.json`: Ma đạo cám dỗ, 8 sự kiện.
  - `beasts.json`: Yêu thú, 7 sự kiện.
  - `market.json`: Phường thị, 7 sự kiện.
- **"⚄ Chiến lực" nay là trận đánh thật** (task 3.3), thắng thua theo kết quả trong thiết kế. Thắng thì vẫn chọn tha, cướp hay giết như mọi trận.
- **Engine thêm cho bộ này**:
  - Hiệu ứng: `lifespanYears` (đốt thọ nguyên), `heartDemon` (đếm tâm ma cho hệ tâm ma sau này), `relativeDies` (người thân mất cuối năm), `romance.loverAffinity`, `meetNpc.adult`.
  - Điều kiện: `family` (có người thân đã mất, cha mẹ còn sống), `itemsAll` (mang theo vật phẩm), `romance.target: "ex"` (người cũ). Danh vọng từng phe đọc được trong điều kiện (`reputation.yeu`…).
  - Placeholder `{deceased}`, `{loverSelf}` (huynh/muội), `{playerDear}` (chàng/nàng).
  - Sự kiện tình duyên đến qua đường nối (follow-up) vẫn gắn đúng người trong lòng.
  - Lựa chọn có hai biến thể cùng chữ, chỉ hiện biến thể đang áp dụng. Chữ trong lựa chọn được thay tên.
- **Validator**:
  - Báo `{deceased}` thiếu điều kiện `family.deadAny`.
  - Đếm cả flag đặt trong kết quả trận đánh.
  - "cha ta", "mẹ hắn", "yêu thú mẹ" không còn bị coi là cha mẹ của người chơi.
- **Chỗ xấp xỉ** (engine chưa có hệ thống tương ứng):
  - Chưa có vùng đất: bỏ điều kiện "ở Lan Sơn, Vạn Yêu Lĩnh, Vô Chủ Phường…".
  - Chưa có linh thú: dùng flag `co_linh_thu`, `linh_thu_truong_thanh`.
  - Chưa có món nợ có lãi: chỉ đặt flag `no_kim_thiem`.
  - Kiểm tra theo chỉ số khác:
    - "⚄ Tốc độ" tính theo Căn cốt, "⚄ Thần thức" theo Ngộ tính.
    - "⚄ thiện cảm + Mị lực" (Tỏ tình) tính theo Mị lực.
    - "⚄ nghề bách nghệ" (Bày sạp) tính theo cấp Luyện Đan.
  - Điều kiện chuyển sang thứ engine đã có:
    - "Kẹt bình cảnh ≥ 5 năm" thành "đột phá thất bại ≥ 2 lần".
    - "Chênh lệch tuổi trông thấy" thành "đã Trúc Cơ".
    - Bản chất "tham lam/mưu mô" thành "bộ mặt che bản chất khác" (hệ NPC 3.4).
    - "Người thân bệnh nặng" thành "mẹ còn sống, người chơi ≥ 30 tuổi".
  - "⚄ thiện cảm 60" (Tình địch) và "⚄ linh thạch so với đối thủ" (Đấu giá) thành hai biến thể theo ngưỡng.
  - Cấm thuật đốt huyết là sự kiện riêng: kẻ địch mạnh hơn một đại cảnh giới chặn đường. "Chiến lực ×2/×3" quy thành đối thủ yếu đi một nửa hoặc còn một phần ba.
- **Phần còn thiếu**:
  - Song tu: chưa xét linh căn hai người khắc nhau.
  - Người cũ: chưa có lựa chọn "Khuyên quay đầu" (NPC chưa có đạo thống).
  - Tặng linh thảo: chưa xét sở thích của người trong lòng, dùng thiện cảm +10.
  - Bốc thăm ở bí cảnh: chưa có 30% bị phục kích.
  - Phi kiếm có chủ: chưa có 30% bị Kiếm Các hỏi tội.
  - Quá hạn nợ Kim Thiềm: chưa có người tới đòi.
- **Câu kết quả tự bổ sung** cho những lựa chọn thiết kế chỉ ghi hiệu ứng, ví dụ "Ngươi rút binh khí…" ở các lựa chọn mở trận đánh.

### Task 3.7 — Đạo lữ, song tu, sinh con (2026-10-12)
- **Thành thân / Đạo lữ đại điển**: đã thành đôi thì cưới được. Phàm nhân trả bạc, tu sĩ trả linh thạch; Vui vẻ +20. Người kia thành Bạn đời (phàm nhân) hoặc Đạo lữ (tu sĩ).
- **Song tu** (PLAN G.1): có đạo lữ đang tu luyện thì tu vi mỗi năm ×1.3.
- **Sinh con**: mỗi năm thử một lần.
  - Tỉ lệ cơ bản 50%; mỗi bên là tu sĩ thì nhân 0.4 (tu sĩ khó có con).
  - Mẹ phàm nhân quá 45 tuổi thì thôi, mẹ tu sĩ tới 300 tuổi. Tối đa 6 con.
  - Hai người cùng giới thì nhận con nuôi.
  - Con mang họ cha, vào tab Gia đình (Con trai/Con gái), dùng chung các hành động gia đình.
  - Con qua đời thì Vui vẻ −25 tới −40.
- **Di truyền linh căn**:
  - Mỗi bên cha mẹ có linh căn cho con thêm một lần quay, giữ lần tốt nhất.
  - Hệ của con ưu tiên lấy hệ của người chơi.
  - Có 20% truyền lại thể chất đặc biệt, và 3% đột biến thành biến dị linh căn (Lôi, Băng, Phong, Ám).
  - Con lên tuổi thử linh căn (6) thì nhật ký báo kết quả và tab Gia đình hiện linh căn. Con có linh căn dùng được thì sống lâu như tu sĩ Luyện Khí.
- **Cho sự kiện** (dùng ở 3.9): hiệu ứng `romance.marry` (cưới người của sự kiện, có thể đặt thiện cảm ban đầu cho hôn nhân chính trị) và `romance.partnerProgress` (tu vi của đạo lữ).
- **Bổ sung kỹ thuật** (PLAN chỉ liệt kê tính năng): mọi con số mới trong `balance.romance` và `balance.family.grief.child`, cùng câu nhật ký cưới, sinh con, thử linh căn của con.

### Task 3.6 — Tình duyên (2026-10-12)
- **Thiện cảm nhiều nấc** (`content/romance.json`): Chán ghét, Lạnh nhạt, Quen biết, Có cảm tình, Tâm đầu ý hợp, Khắc cốt ghi tâm. Tab Người quen hiện nấc bên thanh thiện cảm.
- **Hành động với người quen**, mỗi việc một lần mỗi năm, số liệu ở `balance.romance`:
  - Theo đuổi: mỗi lúc chỉ một người.
  - Tặng quà: phàm nhân trả bạc, tu sĩ trả linh thạch. Thiện cảm tăng theo Mị lực.
  - Tỏ tình: cần thiện cảm 70. Tỉ lệ theo thiện cảm và Mị lực.
  - Thôi theo đuổi, hoặc chia tay.
- **Bị từ chối**: thiện cảm dưới 30 thì quà có thể bị trả lại. Tỏ tình thất bại thì Vui vẻ −15, Đạo tâm +3, thiện cảm −10.
- **Bị lợi dụng**: người có bộ mặt hiền che bản chất khác (hệ NPC 3.4) có thể moi thêm tiền sau khi nhận quà.
- **Tình địch** làm thiện cảm của người trong lòng giảm mỗi năm. Người trong lòng hoặc đạo lữ qua đời thì Vui vẻ −30, nhật ký ghi lại.
- **Cho sự kiện**:
  - Điều kiện `romance`: có người trong lòng, đã thành đôi, có đạo lữ, khoảng thiện cảm, người kia có linh căn, có người cũ.
  - `romance.target` gắn sự kiện vào người trong lòng hoặc đạo lữ, để `{npc}`, `{lover}` và hiệu ứng `npc` áp lên người đó.
  - Hiệu ứng `romance`: bắt đầu theo đuổi, mất người, thành đôi, thêm tình địch, vạch mặt tình địch.
- **Mục H của PLAN**:
  - Mọi điều kiện `romance` đòi người chơi và người kia đủ 18 tuổi, còn sống, và người chơi không theo Phật đạo (kiêng tình duyên, phần còn nợ của task 3.12).
  - Người gặp trong sự kiện tình duyên luôn được tạo từ 18 tuổi.
  - Validator báo lỗi nếu sự kiện có chủ đề `romance*`, tag `mature` hoặc hiệu ứng `romance` mà không có `conditions.romance` hay `age.min ≥ 18`.
- **Bổ sung kỹ thuật** (PLAN chỉ liệt kê tính năng): tên các nấc, câu nhật ký của các hành động, và mọi con số trong `balance.romance`.

### Task 3.5 — Thiên kiêu bảng (2026-10-12)
- Thế giới có 12 thiên kiêu riêng (`balance.rankings`). Họ tự tu luyện nhanh hơn người thường, tự đột phá, có thể vẫn lạc. Ai quá 100 tuổi thì rời bảng, người trẻ mới lên thay.
- Mỗi năm bảng xếp 10 người theo cảnh giới, tầng và tu vi. Người chơi có tên trên bảng nếu đã tu luyện và chưa quá 100 tuổi.
- Nhật ký ghi khi người chơi lên bảng, lên hạng, đứng đầu, rớt bảng, quá tuổi, và khi một thiên kiêu trên bảng vẫn lạc.
- Bảng Tu luyện có mục **Thiên kiêu bảng** (tên, cảnh giới, tông môn, tuổi; dòng của người chơi được tô).
- Bảng được tạo vào năm đầu cần tới, kể cả save cũ. Thiên kiêu lớn tuổi hơn sẽ tu bù những năm đã qua. Bảng dùng dòng ngẫu nhiên riêng theo seed, không làm đổi các lần quay khác của kiếp.
- **Bổ sung kỹ thuật** (PLAN chỉ ghi "cập nhật mỗi năm"): các con số trong `balance.rankings` và 8 câu văn trong `content/rankings.json`.

### Task 3.8 — Đạo thống × con đường (2026-10-12)
- **Đạo thống** (PLAN K.3.1, file mới `content/lineages.json`): do công pháp chính quyết định, đổi công pháp là đổi đạo thống.
  - Tiên đạo: đột phá +3%.
  - Ma đạo: tu vi ×1.4 (đã có), nhân quả −1 mỗi năm.
  - Phật đạo: tu vi ×0.8 (đã có), Đạo tâm +5 lần đầu theo, thương tích −10%.
  - Quỷ đạo: Mị lực −10 lần đầu theo, Sức khỏe −1 mỗi năm.
  - Yêu đạo: Căn cốt +5 lần đầu theo, phần còn lại để GĐ 7.
  - Hút máu, kháng tâm ma, thọ nguyên, thần thức đã nằm trong công pháp của chủ dự án nên không cộng lặp.
- **Con đường chiến đấu** (K.3.2): mỗi kiếp quay tư chất 5 con đường (Kiếm, Thể, Pháp, Binh, Thuật) từ 5 đến 30 theo seed. Công pháp và thiên phú cộng thêm qua móc `path.<id>.affinity`; sự kiện cộng qua hiệu ứng mới `pathAffinity`.
- **Con đường chính** là con đường cao nhất (bằng nhau thì chưa định hướng). Nó chỉnh tốc độ tu theo `balance.paths`: Kiếm +10%, Thể −10%, còn lại 0. Giao chiến (task 3.3) nay dùng chính con đường này thay cho cách suy tạm từ thiên phú.
- Bảng Tu luyện có mục **Đạo thống · con đường**: điểm mạnh, cái giá, 5 thanh tư chất, con đường chính.
- **Bổ sung kỹ thuật** (PLAN chỉ mô tả bằng lời): Tiên đạo +3% đột phá; các con số lần đầu theo và mỗi năm của Phật/Quỷ/Ma/Yêu.
- Save cũ: 5 con đường bắt đầu từ 0 (chưa định hướng), đạo thống hiện tại coi như đã theo.

### Task 3.12 — Phật duyên (2026-10-12)
- **Vô Ưu Tự nhận người không linh căn** nếu Đạo tâm ≥ 70 (`sects.json`: `rootlessMinDaoHeart`); các tông khác vẫn cần linh căn. Bảng Tông môn ghi rõ lý do.
- Người không linh căn vào chùa, sau một năm (lên Ngoại môn) học Vô Ưu Thiền Tâm Pháp, rồi vào Luyện Khí. Tốc độ tu theo Đạo tâm (tối đa 0.7) × Phật đạo 0.8. Cùng một luật cho cả đường sự kiện Hạ viện Vô Ưu Tự (task 2.8).
- **Giới luật** (`techniques.md` C5, `balance.json` mục `buddhism`): người tu Phật đạo giết người thì Đạo tâm −10, nhật ký ghi "Phá giới sát sinh". Phá giới 3 lần thì bị Vô Ưu Tự trục xuất, không quay lại được.
- Hiệu ứng sự kiện mới `kill` đánh dấu lựa chọn giết người. Đã gắn cho "Giết người đoạt bảo"; các sự kiện giết người ở task 3.9 sẽ dùng chung.
- **Bổ sung kỹ thuật**: số lần phá giới tối đa (3) và hai câu nhật ký (phá giới, trục xuất) do thiết kế ghi "phá giới nhiều lần" mà không nêu số.
- **Chưa làm**: kiêng tình duyên, để task 3.6 chặn sự kiện tình duyên với Phật đạo.

### Task 3.11 — Võ đạo nhập tiên (2026-10-12)
- **7 cảnh giới võ đạo** theo `mortal-path.md` mục 2b (`content/martial.json`): Tam lưu → Nhị lưu → Nhất lưu → Tuyệt đỉnh → Hóa cảnh → Tam hoa tụ đỉnh → Ngũ khí triều nguyên.
- **Luyện võ**: phàm nhân từ 10 tuổi, mỗi năm một lần (bảng Tu luyện, mục Võ đạo).
  - Đủ số năm thì xung kích cảnh giới tiếp, kiểm tra Căn cốt (Nhất lưu và Hóa cảnh tính trung bình Căn cốt + Ngộ tính).
  - Thất bại thì lùi vài năm khổ luyện.
  - Quá 50 tuổi tỉ lệ giảm một nửa.
- **Điều kiện riêng**:
  - Nhất lưu cần bí kíp hoặc sư phụ: Lục Hợp Môn, có sư phụ, đường Võ lâm, hoặc xuất thân Con nhà võ.
  - Hóa cảnh cần Căn cốt ≥ 70, không cần kỳ ngộ. Mô phỏng: võ giả Căn cốt 75, có thầy, chuyên tâm luyện thì khoảng 42% chạm Hóa cảnh, sát gợi ý 40% của thiết kế.
  - Tam hoa tụ đỉnh và Ngũ khí triều nguyên chỉ lên được qua kỳ ngộ (hiệu ứng sự kiện `martialPromote`; sự kiện kỳ ngộ chờ file thiết kế).
- **Mỗi cảnh giới**: thêm thọ nguyên (+5, +10, +30, +20, +20) và chiến lực nền (1 → 9, để dùng ở task 3.3). Thanh trên hiện "Phàm Nhân · Nhất lưu".
- **Ngũ khí triều nguyên**: hóa Ngũ linh căn, vào Luyện Khí tầng 1 với Dẫn Khí Quyết, giữ lợi thế thân thể (tư chất Thể +30, thương tích −15%).
- **4 sự kiện võ đạo đã duyệt** (#32–35 của `cultivation-events.md`): Bái nhập Lục Hợp Môn, Khổ luyện vượt ải, Hóa cảnh, Đại hội võ lâm.
  - Chỗ làm gần đúng: "⚄ Chiến lực/Cảnh giới võ đạo" và "Căn cốt + Ngộ tính" tạm kiểm tra bằng Căn cốt; "độ khó theo cảnh giới" ở #33 là 55 (Nhị lưu) và 65 (Nhất lưu).
- Engine:
  - điều kiện `martial` (min, max, ready = đủ năm khổ luyện) và `origins`;
  - hiệu ứng `martialPromote`, `martialAttempt`, `martialYears`, `martialBonus`.
- **Bổ sung kỹ thuật** (thiết kế không có): 4 câu nhật ký ngắn (luyện võ, đột phá, thất bại, nhập tiên) trong `martial.json`, số năm khổ luyện và độ khó từng bước trong `balance.json` mục `martial`.

### Task 3.1 — Đan dược và vật phẩm (2026-10-12)
- Nhập 45 món theo bản duyệt `docs/design/items.md` (bản 2): 18 đan dược, pháp bảo, bùa, trận bàn, nguyên liệu (Nội đan 3 cấp, Linh tinh 5 hệ, Lôi Tinh…).
- Đan có tác dụng khi dùng từ túi; pháp bảo, bùa, trận bàn có tác dụng khi mang theo. Có giá bạc hoặc linh thạch để mua bán ở phường thị.
- Không món nào mở được linh căn.
- Vật phẩm mới có thể chỉ dành cho một đạo thống (Nội đan: ma tu hấp thu) hoặc mạnh hơn với một đạo thống (Huyết Đan). Thêm móc dùng `karma`.
- Món hiếm (`forSale: false`) không bày bán ở chợ nhưng vẫn bán lại được.
- Developer mode: tặng vật phẩm bất kỳ, xóa kháng thuốc.

### Task 3.3 — Giao chiến (2026-10-11)
- **Chiến lực** theo K.4.1: nền cảnh giới × tầng × Căn cốt × phẩm công pháp × đạo thống × (1 + pháp bảo, thiên phú, con đường). Chênh một đại cảnh giới gần như thua chắc.
- **Trận đánh** tối đa 3 hiệp, ai thắng 2 hiệp trước là thắng. Mỗi hiệp chọn 1 trong 5 hành động, có hiện tỉ lệ:
  - Toàn lực;
  - Pháp bảo / Phù (đốt một lá bùa trong túi);
  - Thủ;
  - Bỏ chạy (so Tốc);
  - Cầu xin (theo Mị lực; ma tu ít khi tha).
- Thắng: chọn tha (nhân quả +), cướp đồ (bạc hoặc linh thạch), giết (nhân quả −; Phật tu mất Đạo tâm).
- Thua: theo ý đồ đối phương:
  - dạy dỗ thì bị thương;
  - cướp thì mất 30% tiền và một món đồ, trừ khi có túi trữ vật;
  - muốn giết thì chết, trừ khi Hộ Thân Ngọc Bội vỡ thay hoặc Khí vận cho thoát.
- Tử trận có lời kết riêng.
- Hệ khắc hệ +20% (con đường Pháp +35%, bị khắc −25%). Kiếm tu mạnh hiệp đầu. Thể tu chịu đòn tốt. Thuật tu dùng bùa mạnh gấp đôi.
- Đã có tác dụng: các móc `injuryReduce`, `lifesteal`, `speed`, `escapeChance`, `combatPower.vsHigherRealm`, `path.<x>.power`, `artifactPct`, `lootPct`.
- Đan uống trước trận (Huyết Khí Hoàn) có tác dụng cả trận kế tiếp. Bùa đốt trong trận chỉ có tác dụng một hiệp.
- Sự kiện gây ra trận đánh bằng `fight` trong kết quả, gồm đối thủ, kết quả thắng/thua/chạy. Validator kiểm tra cảnh giới, hệ, con đường, đạo thống của đối thủ.
- Developer mode có thêm mục "Đánh thử", với đối thủ yếu hơn, ngang sức hoặc mạnh hơn.
- Văn bản trận đánh ở `content/combat.json`. Số liệu ở `balance.combat`.
- Con đường chính tạm suy ra từ thiên phú. Task 3.8 sẽ thay bằng tư chất con đường thật.

### Task 3.2 — Phường thị (2026-10-11)
- Nút **遊 Khám phá** mở bảng Phường thị: chọn chợ, xem hàng và giá, mua, bán lại đồ trong túi.
- 3 chợ ở `content/worlds/thuong_lan/markets.json`:
  - Chợ phiên huyện: trả bằng bạc, bán phàm dược, bùa, đồ lặt vặt;
  - Kim Thiềm Các: cần linh căn, giá ×1.2;
  - Chợ không chủ: cần linh căn, giá ×0.7 nhưng 15% mua phải đan giả (đặt flag `mua_hang_gia`).
- Bán lại được nửa giá gốc. Trả giá mỗi chợ một lần mỗi năm; tỉ lệ theo Mị lực và Trí tuệ; thắng thì giá năm đó ×0.85, thua thì ×1.1.
- Dưới 8 tuổi chưa được đi chợ. Số liệu ở `balance.market`.
- Giá thật của từng món có khi nhập danh sách vật phẩm task 3.1 (đang chờ duyệt).

### Task 2.8 — Sự kiện tu luyện, tông môn và đời phàm nhân (2026-10-11)
- **36/40 sự kiện** theo bản duyệt `docs/design/cultivation-events.md`, chia 5 file trong `events/`:
  - `sect.json`: 9 sự kiện đời tông môn;
  - `cultivation.json`: 7 sự kiện tu luyện;
  - `fortune.json`: 5 kỳ ngộ công pháp;
  - `rogue.json`: 4 sự kiện tán tu và ma đạo;
  - `mortal-path.json`: 11 sự kiện đời phàm nhân, thêm 1 sự kiện nối tiếp "Hương Hỏa Hội lộ mặt" (lựa chọn báo Khâm Thiên Giám cần flag do chính sự kiện đó đặt, nên tách ra xảy ra sau).
- **4 sự kiện võ đạo (#32–35) chuyển sang task 3.11**, vì cần thang cảnh giới võ đạo.
- "Linh quả nghìn năm" bản duyệt thay cho bản mình viết ở task 2.11.
- Engine thêm:
  - hiệu ứng `cultProgress` (± % thanh tu vi), `speedBuff` (tốc tu × có thời hạn), `craftXp`, `reputation` (thêm phe Triều đình, Giang hồ);
  - `nextBreakthroughBonus`, `reducePeakFails`, `gainTechnique` (bí tịch: học sau ở mục Bí tịch của bảng Tu luyện);
  - `joinCareer`, `careerPromote`, `leaveCareer`, `gainMaster`; `addItems`/`removeItems` nay lưu vào túi;
  - điều kiện `anyOf`, `stage`, `career`, `peakFails`, `talentsAny`, `sect.notId`;
  - đọc được `craft.<nghệ>` và `sect.contribution` trong điều kiện và kiểm tra chỉ số;
  - chữ `{sect}` trong văn bản; lựa chọn ẩn theo thiên phú hiện tên thiên phú.
- **Vật phẩm tối thiểu** (`content/items.json`): Tụ Khí Đan (+5 khi lên tầng Luyện Khí), Trúc Cơ Đan (+25 khi đột phá Trúc Cơ). Cả hai tự dùng khi đột phá, đúng bảng G.2. Thêm kiếm gãy. Túi đồ đầy đủ làm ở task 3.1; thẻ nhân vật có dòng "Mang theo".
- **Phật duyên qua sự kiện**: người không linh căn quy y Vô Ưu Tự thì tu Vô Ưu Thiền Tâm Pháp, vào Luyện Khí, tốc độ theo Đạo tâm (tối đa 0.7).
- Validator:
  - mỗi kết quả phải đổi ít nhất một trong 8 chỉ số (tiền, cống hiến, nhân quả, flag không tính), theo quy tắc của chủ dự án;
  - kiểm tra id vật phẩm, bí tịch, đường đời, thiên phú nhắc trong sự kiện.
- Chỗ làm gần đúng vì hệ thống chưa có (sẽ chỉnh khi có):
  - "⚄ Chiến lực" tạm kiểm tra bằng Căn cốt;
  - bế quan 3 năm ở #11 chưa làm trôi thời gian;
  - NPC bạn hay ân nhân chỉ đặt flag;
  - "tư chất Kiếm ≥ 40" ở Kiếm trủng chưa kiểm tra.

### Task 2.7 — Nghịch Thiên Cải Mệnh lần đầu (2026-10-11)
- Đột phá Trúc Cơ thành công thì hiện màn **Nghịch Thiên Cải Mệnh**: chọn 1 trong 3 thiên phú. Không đóng được; chọn xong mới qua năm tiếp.
- **24 thiên phú** theo bản duyệt (`content/fate-talents.json`): Lương 6, Ưu 6, Tuyệt 6, Thiên 4, Thần 2.
- Luật quay (`balance.json` mục `fate`):
  - phẩm theo phẩm đạo cơ (Hạ không ra Thiên/Thần; Hoàn mỹ chỉ từ Tuyệt trở lên);
  - mỗi 10 Khí vận trên 50 dời 2% từ phẩm thấp nhất sang phẩm cao nhất của dòng đó;
  - ô đầu ưu tiên thiên phú hợp build: đạo thống, bách nghệ cấp 20+, con đường mà công pháp, thể chất, khí vận đang thiên về;
  - không ra thiên phú đã có; Huyết Hải Bất Khô chỉ cho Ma đạo, Bồ Đề Tâm chỉ cho Phật đạo;
  - làm mới 1 lần, Khí vận ≥ 70 thêm 1 lần; Developer mode làm mới không giới hạn.
- Thiên phú cộng chỉ số và thọ nguyên ngay; các móc khác tính vào tốc độ tu, tỉ lệ đột phá… như khí vận. Móc mới: `breakthroughChance.minor`, `artifactPct`, `tribulationPower`, `ignoreElementWeakness`, `rewindOnDeath`. Hiệu ứng về chiến đấu, thoát chết, hồi quang có tác dụng khi các hệ thống đó làm xong (popup có ghi chú).
- Thẻ nhân vật hiện thiên phú đã chọn. Save cũ: chưa có thiên phú.

### Task 2.5 — Vào tông môn (2026-10-11)
- **Tông môn tuyển đồ**: có linh căn thì 1–3 năm sau khi thử, các tông môn cùng tới mời (`events/sect-recruit.json`). Tông nào không đủ điều kiện thì lựa chọn bị khóa ("Chưa đủ điều kiện"). Có thể không theo ai, làm tán tu.
- **Bảng Tông môn** (nút ở dock):
  - **Khi đã vào tông**: cấp bậc, cống hiến, điều kiện lên cấp tiếp, nghĩa vụ.
    - mỗi năm một **nhiệm vụ** (gánh nước, hái thuốc, tuần núi, diệt yêu thú, hộ tống thương đội): kiểm tra chỉ số, thưởng cống hiến và linh thạch;
    - **công pháp của tông** mở theo cấp bậc (Bích Lạc Dẫn Khí Quyết từ Ngoại môn, Ngũ Hành Luân Chuyển Kinh ở Chân truyền…);
    - **xin bái sư** từ Nội môn (mỗi năm một lần, tỉ lệ theo Ngộ tính): có sư phụ thì tu nhanh hơn 10%, đặt flag `co_su_phu`;
    - **rời tông**: mất cấp bậc, không được quay lại tông đó.
  - **Khi chưa có tông**: danh sách tông kèm lý do chưa đủ điều kiện, có nút xin bái nhập.
- **Cấp bậc**: Ký danh một năm thì lên Ngoại môn. Lên Nội môn cần 60 cống hiến và Luyện Khí tầng 4; lên Chân truyền cần 200 cống hiến và Trúc Cơ.
- **Bổng lộc** mỗi năm theo tông và cấp bậc. Thưởng riêng của từng tông áp dụng khi là đệ tử. U Hà Ma Tông: danh vọng Chính −20 khi vào, nhân quả −2 mỗi năm.
- Sự kiện dùng được:
  - điều kiện `sect` (đang ở tông, tông nào, cấp bậc, đủ điều kiện vào tông nào);
  - hiệu ứng `joinSect`, `sectContribution`, `sectPromote`, `leaveSect`.
- Thẻ nhân vật hiện tông môn và cấp bậc; mẹo hướng dẫn khi vào tông. Tên loại sự kiện mới hiện tiếng Việt trong popup. Save cũ: chưa có tông môn.

### Task 2.4 — Tông môn và công pháp (2026-10-11)
- **17 công pháp** (`content/techniques.json`, dùng chung): Dẫn Khí Quyết (mặc định, tiên sư để lại lúc thử linh căn) + C1–C16 theo `docs/design/techniques.md`.
- **6 tông môn Thương Lan** (`content/worlds/thuong_lan/sects.json`): Bích Lạc Tông, Tàng Phong Kiếm Các, Bách Thảo Cốc, Vô Ưu Tự, U Hà Ma Tông, Vạn Yêu Điện. Có điều kiện nhận đệ tử, cấp bậc, công pháp truyền theo cấp, thưởng và nghĩa vụ. Vạn Yêu Điện (đạo thống Yêu) chưa nhận đệ tử, để làm sau. Việc gia nhập tông môn làm ở task 2.5.
- Engine công pháp:
  - hệ số tu = phẩm (Hoàng ×1, Huyền ×1.2, Địa ×1.5, Thiên ×2) × hợp linh căn (không hợp ×0.7) × đạo thống (Ma ×1.4, Phật ×0.8); thay hệ số 1.0 tạm thời ở task 2.3;
  - phẩm giới hạn cảnh giới (Hoàng tới Trúc Cơ, Huyền tới Kim Đan, Địa tới Nguyên Anh; tàn quyển thấp hơn): công pháp không đủ thì nút đột phá ghi rõ lý do;
  - đổi công pháp mất 20% thanh tu vi, đạo thống đổi theo, thọ nguyên theo móc `lifespanPct` của công pháp; thưởng chỉ số của công pháp chỉ nhận một lần;
  - công pháp vô hệ, "theo linh căn", "hợp mọi hệ" luôn hợp; Ngũ Hành Luân Chuyển Kinh hợp mọi linh căn ngũ hành; Lưu Ly Linh Thể hợp mọi công pháp;
  - móc có điều kiện `activeIf` (đủ số hệ linh căn, Đạo tâm dưới mức); móc mới `element.all.power`, `craft.all.*`, `lineage.yeu.*`;
  - hiệu ứng sự kiện `learnTechnique`.
- Bảng Tu luyện hiện công pháp: phẩm, đạo thống, hợp linh căn hay không, tu tới đâu, mô tả và luật riêng.
- Save cũ: người đang tu được Dẫn Khí Quyết.
- Lưu bản duyệt của chủ dự án vào `docs/design/`: `fate-talents.md` (2.7), `cultivation-events.md` (2.8), `techniques.md`, `sects.md` (2.4), `events-jianghu.md` (3.9).

### Task 2.11 — Đời không linh căn: đường đời, Tạp dịch, Thiên địa kỳ vật (2026-10-11)
- **Đường đời** (bảng Tu luyện, chỉ cho phàm nhân, từ 14 đến 40 tuổi): Quan lộ, Thương lộ, Võ lâm, Y lộ, mỗi đường 5 nấc theo `mortal-path.md`. Mỗi năm có thu nhập theo nấc (10 → 200 lượng). Ở một nấc đủ 3 năm thì mỗi năm có cơ hội lên nấc, theo trung bình hai chỉ số chính. Flag nghề cũ giúp lên nhanh hơn: `tu_tai`, `nghe_quan`, `nghe_ren` (và xuất thân Con nhà võ), `nghe_thuoc`.
- **Tạp dịch tông môn** cho người đã thử mà không có linh căn: 2 nấc, thu nhập thấp, đôi khi nghe lỏm đạo lý (Ngộ tính +1), sự kiện kỳ vật ×3.
- **Thiên địa kỳ vật**: 3 sự kiện hiếm cho người không linh căn có Khí vận ≥ 70 (linh quả nghìn năm, nước tủy linh mạch, sét đánh không chết). Luyện hóa thì được **Ngũ linh căn** (20% Tứ), vào Luyện Khí tầng 1, Sức khỏe −30. Quá 30 tuổi, mỗi năm thêm 2% tỉ lệ chết (tối đa 60%).
- Màn tổng kết đời hiện đường đời và **danh hiệu**: Trạng nguyên khai khoa, Phú giáp một phương, Thiên hạ đệ nhất võ phu, Thần y cứu thế (đạt nấc cuối), Bình an trăm tuổi (phàm nhân sống tới 100).
- Engine:
  - điều kiện sự kiện `realm.min/max` nay chạy thật theo thứ tự cảnh giới;
  - thêm điều kiện `root: { tested, usable }` và hiệu ứng `grantRoot`;
  - móc của thể chất đặc biệt và đường đời được tính vào trọng số sự kiện (ví dụ Vạn Độc Thể không còn gặp sự kiện ngộ độc).
- Số liệu ở `balance.json` mục `careers`, `kyVat`; nội dung ở `content/careers.json`, `events/ky-vat.json`.
- Nháp chờ duyệt: task 2.7 (`docs/design/fate-talents.md`) và task 2.8 (`docs/design/cultivation-events.md`).

### Task 2.12 — Bách nghệ cho phàm nhân (2026-10-11)
- Bảng **Tu luyện** có mục **Bách nghệ**: từ 10 tuổi, mỗi năm chuyên tâm luyện một nghề (tốn ít bạc mua nguyên liệu).
- Phàm nhân học được **Luyện Đan** và **Linh Thực** từ cấp 0; đã có tu vi thì mở cả 6 nghệ.
- Mỗi lần luyện: cấp tăng theo tư chất nghệ (quay lần đầu 5–30, cộng móc `craft.<nghệ>.affinity`) và ngộ tính; tư chất nghệ tăng dần khi luyện.
- Danh hiệu theo cấp: Học đồ luyện đan → Đan Đồ → Đan Sư → Đại Đan Sư → Đan Tông; lên danh hiệu có dòng nhật ký.
- Nghề **thuốc** (`nghe_thuoc`) cho Luyện Đan cấp 10 ngay; nghề **rèn** (`nghe_ren`) cho Luyện Khí cấp 10 khi đã có tu vi.
- Chưa làm ra đồ: đan dược, pháp bảo… sẽ nối ở GĐ 3 (túi đồ, phường thị). Số liệu trong `balance.json` mục `crafts`, câu chữ trong `aptitudes.json`. Save cũ được thêm sổ bách nghệ trống.

### Task 2.9 — Hướng dẫn đời đầu + "Mục tiêu hiện tại" (2026-10-11)
- Đầu nhật ký luôn có dòng **Mục tiêu** theo tình trạng đời này: chờ thử linh căn → sống đời phàm nhân (không linh căn) → tu tới Luyện Khí tầng 9 → đột phá Trúc Cơ → tu tới Trúc Cơ viên mãn.
- **Đời đầu tiên** trên trình duyệt có thẻ hướng dẫn, mỗi lần một mẹo, đúng lúc: bấm +1 năm, chạm thuật ngữ, lựa chọn sự kiện, Quan hệ, tua nhanh, khi có/không có linh căn, khi đầy thanh cần đột phá. Nút "Đã hiểu" và "Tắt hướng dẫn".
- Nội dung trong `content/tutorial.json` (điều kiện: tuổi, số sự kiện, đã thử linh căn, có linh căn, cảnh giới, đầy thanh). Thêm mục tiêu/mẹo = thêm JSON. Save cũ không hiện mẹo.

### Task 2.10 — Chọn độ khó (2026-10-11)
- Màn tạo nhân vật có mục **Độ khó: Dễ / Thường / Khó** kèm một dòng giải thích. Mặc định Thường.
- Độ khó là bộ móc K.6 áp cho cả đời, chỉnh ở `balance.json` mục `difficulty`:
  - **Dễ**: tốc độ tu +25%, tỉ lệ đột phá +10, bệnh tuổi già −50%, thêm 2 lượt Nghịch thiên cải mệnh.
  - **Thường**: như trước.
  - **Khó**: tốc độ tu −10%, tỉ lệ đột phá −5, bệnh tuổi già +25%, bớt 1 lượt cải mệnh; **không load lại**: đời còn sống thì Sổ lưu không cho xuất file, cũng không nhập lại save Khó còn sống. Game vốn tự lưu sau mỗi thay đổi nên không còn đường quay lại.
- Cùng một seed thì độ khó không đổi nhân vật (tên, tư chất…), chỉ đổi luật chơi.
- Thẻ nhân vật hiện độ khó. Tên và mô tả trong `content/difficulties.json`; save cũ tính là Thường.

### Task 2.6 — Đột phá Trúc Cơ (2026-10-11)
- Nút **Tu luyện** ở dock mở bảng tu luyện: cảnh giới, linh căn, đạo cơ, thanh tu vi, tốc độ mỗi năm, bình cảnh.
- Tới Luyện Khí tầng 9 đầy thanh: nút **Đột phá Trúc Cơ** hiện tỉ lệ thành công (gốc 30% theo G.2, cộng/trừ ngộ tính, đạo tâm, khí vận, `breakthroughChance.major`, −5% mỗi lần thất bại trước), hỏi xác nhận, mỗi năm thử một lần.
- Thành công: vào Trúc Cơ sơ kỳ, thọ nguyên +80 ±15, quay **phẩm đạo cơ** Hạ/Trung/Thượng/Hoàn mỹ (ngộ tính và đạo tâm cao thì dễ được phẩm tốt). Hoàn mỹ thêm 20 năm thọ. Phẩm đạo cơ nhân tốc độ tu ở Trúc Cơ (×0.9 → ×1.2). Thiên Tuyệt Mạch được phá giải.
- Thất bại theo bảng đại cảnh giới: mất 30% thanh (40%), tổn thương kinh mạch (35%), giảm 5% thọ (15%), **tẩu hỏa nhập ma** (7%: Sức khỏe −30, Đạo tâm −10, đặt flag `tau_hoa_nhap_ma` cho chuỗi sự kiện sau), **tử vong** (3%, màn tổng kết ghi "Mất khi đột phá").
- **Bình cảnh**: thất bại 2 lần ở đỉnh cảnh giới thì tu vi chỉ còn ×0.3 (móc `bottleneckResist` giảm bớt).
- Lên tiểu cảnh giới trong Trúc Cơ dùng gốc 70%; Trúc Cơ viên mãn dừng chờ Kim Đan (GĐ 4).
- Số liệu trong `balance.json` mục `majorBreakthrough`; câu chữ và phẩm đạo cơ trong `realms.json`; câu chết khi đột phá trong `life-texts.json`.
- Nháp task 2.4 (tông môn, công pháp) ở `docs/design/sects-techniques.md`, chờ duyệt.

### Task 2.3 — Tu vi mỗi năm, lên tầng Luyện Khí (2026-10-11)
- Có linh căn thì ngay sau khi thử, tiên sư để lại khẩu quyết dẫn khí: vào **Luyện Khí tầng 1**, thọ nguyên tăng theo cảnh giới (120 ±10, nhân hệ số thọ của khí vận/thể chất). Không linh căn thì vẫn là phàm nhân.
- Tu vi tăng mỗi năm theo công thức G.1: tốc độ gốc × hệ số linh căn × (0.75 + (căn cốt + ngộ tính)/400) × linh khí thế giới × hệ số công pháp (tạm 1.0 tới khi có công pháp ở task 2.4) × (1 + thưởng tốc độ từ khí vận, thể chất, trạng thái đặc biệt).
- Thanh tu vi đầy thì tự xung kích tầng tiếp theo theo G.2 (gốc 90%, cộng/trừ theo ngộ tính, đạo tâm, khí vận, mỗi lần thất bại trước ở mốc đó −5%, kẹp 3–95%). Thất bại: mất 30% thanh, tổn thương kinh mạch (Sức khỏe −20, tu chậm một nửa trong 5 năm), hoặc giảm 5% thọ nguyên.
- Tới Luyện Khí tầng 9 đầy thanh thì dừng, chờ đột phá Trúc Cơ (task 2.6).
- Thanh trên hiện cảnh giới ("Luyện Khí tầng 3"), thanh Tu vi hiện cảnh giới và phần trăm.
- Móc mới có tác dụng: `lineage.<đạo thống>.cultivationSpeed` (tính khi đời này theo đạo thống đó, chọn ở GĐ 3) và `activeUntil: { realm }` (Thiên Tuyệt Mạch trả lại thọ nguyên khi lên Trúc Cơ).
- Số liệu mới trong `balance.json` mục `cultivation`; câu chữ trong `realms.json` mục `texts`; `world.json` có `qi` (linh khí của thế giới). Save cũ tự được bổ sung trường mới.

### Task 2.2 — Thử linh căn (2026-10-11)
- Mỗi đời được hẹn một lần **"Tiên sư thử linh căn"** ở tuổi ngẫu nhiên 6–12 (`balance.roots.testAge`). Đặt tay lên đá thì biết linh căn; trốn thì năm sau tiên sư quay lại.
- Linh căn quay theo bảng tỉ lệ của task 2.1: phẩm, các hệ (Ngũ linh căn đủ 5 hệ, Biến dị lấy hệ hiếm), hoặc một thể chất đặc biệt.
- Xuất thân **Hậu duệ gia tộc tu tiên** quay 2 lần, giữ kết quả tốt hơn (`origins.json`: `cultivatorClan`).
- Thể chất đặc biệt áp ngay chỉ số và thọ nguyên (ví dụ Thiên Tuyệt Mạch còn khoảng 3/10 thọ nguyên phàm nhân); các móc khác chờ hệ thống tương ứng.
- Hiển thị: kết quả trong popup và nhật ký (tô màu theo độ quý), dòng **Linh căn** trong thẻ nhân vật ("Chưa thử" trước khi thử).
- Engine không gắn cứng sự kiện: thế giới khai báo `rootTestEvent` trong `world.json`; hiệu ứng mới `testRoot` trong lựa chọn sự kiện. Validator kiểm tra sự kiện đó có thật.

### Task 2.1 — Cảnh giới, linh căn, con đường, bách nghệ (2026-10-11)
- Nhập nội dung đã duyệt (`docs/design/realms-roots-paths.md`) thành dữ liệu dùng chung cho mọi thế giới:
  - `content/realms.json`: 6 cảnh giới Phàm Nhân → Hóa Thần, các tầng (7 cảnh giới võ đạo, Luyện Khí 1–9, Sơ/Trung/Hậu/Viên mãn), mô tả; ô "???" cho cảnh giới cao hơn.
  - `content/roots.json`: 8 phẩm linh căn, 5 hệ ngũ hành + 4 hệ biến dị kèm quan hệ khắc chế, 11 thể chất đặc biệt với hiệu ứng theo móc K.6.
  - `content/aptitudes.json`: 5 con đường chiến đấu (Kiếm, Thể, Pháp, Binh, Thuật), 6 bách nghệ, danh hiệu theo cấp (Học đồ → … Tông).
- Mọi con số nằm trong `balance.json`: tốc độ tu, thọ nguyên, chiến lực nền, tỉ lệ đột phá từng cảnh giới; tỉ lệ và hệ số tu từng phẩm linh căn; tỉ lệ thể chất (Hỗn Độn Thể, Tiên Thiên Đạo Cốt hiếm gấp đôi); hệ số con đường; cấp bách nghệ khởi đầu theo nghề.
- `npm run validate` kiểm tra thêm: id cảnh giới/linh căn/thể chất/con đường khớp với số liệu trong `balance.json`, hệ khắc hệ tồn tại, danh hiệu bách nghệ tăng dần, sự kiện không nhắc cảnh giới không có thật.
- Schema nhận trước móc `lineage.<đạo thống>.cultivationSpeed` và `activeUntil: { realm }` (Thiên Sinh Ma Thể, Thiên Tuyệt Mạch); có tác dụng từ task 2.3.
- Glossary: thêm các phẩm linh căn, thể chất đặc biệt, bách nghệ.
- Id con đường/bách nghệ dùng đúng móc khí vận đã có: Thuật = `arts`, Linh Thực = `farming`.

### Chỉ số ở đáy/đỉnh quá lâu (2026-10-11)
- 18 trạng thái đặc biệt đã duyệt (`content/stat-extremes.json`), cho 8 chỉ số và Nhân quả. Ví dụ: Bệnh nằm liệt giường, Lòng như tro nguội, Ngây ngô, Xui tận mạng, Công đức kim quang.
- Luật (`balance.json` mục `extremes`):
  - chỉ số ≤ 5 hoặc ≥ 95 đủ 3 năm liền thì sinh trạng thái (Sức khỏe đáy chỉ cần 2 năm); Nhân quả dùng mốc ≤ −80 / ≥ +80;
  - năm trước đó nhật ký có dòng cảnh báo và thanh chỉ số nhấp nháy;
  - trạng thái hết khi chỉ số về lại ≥ 20 (đáy) hoặc ≤ 80 (đỉnh);
  - phần thưởng một lần chỉ nhận lại sau 10 năm.
- Đã có tác dụng ngay:
  - đổi chỉ số hằng năm; sàn chỉ số ("ngốc mà vui": Hạnh phúc không dưới 30);
  - tỉ lệ chết mỗi năm khi liệt giường; bệnh tuổi già dễ hơn hoặc miễn hẳn;
  - sự kiện xui/kỳ ngộ nhiều hơn; tốn bạc mỗi năm; thọ nguyên và chỉ số một lần;
  - "Bĩ cực thái lai" sau 6 năm xui, "Đại trí nhược ngu" 1% mỗi năm.
- Các móc tu luyện, chiến đấu, đột phá, thiên kiếp, danh vọng đã ghi sẵn trong dữ liệu, sẽ có tác dụng khi các hệ thống đó được làm.
- Thẻ nhân vật hiện các trạng thái đang mắc. Móc K.6 mới: `statPerYear.*`, `statFloor.*`, `silverPerYear`, `deathChancePerYear`, `illnessChancePct`, `tribulationPct`, `cannotWork`, `noLineageChange`, `blockEvent.*`.
- Theo bảng sự kiện hệ thống đã duyệt:
  - cha hoặc mẹ mất: Hạnh phúc −20 (tới −30 nếu rất thân) và Đạo tâm +2;
  - anh chị em mất: Hạnh phúc −15;
  - tuổi 60, 70, 80: Sức khỏe −5, Mị lực −3, có dòng nhật ký;
  - năm yên ả: Hạnh phúc trôi dần về 50 (±2 mỗi năm).

### Developer mode (2026-10-11)
- Chạm con dấu 仙 ở màn hình chính 20 lần liền (mỗi lần cách nhau không quá 2 giây) để bật; 5 lần cuối có đếm ngược. Bật rồi thì thanh trên của màn chơi có nút **Dev**.
- Khi bật, **Nghịch thiên cải mệnh quay không giới hạn** (nút hiện ∞).
- Bảng thử nghiệm: cộng/trừ 8 chỉ số, thêm bạc, linh thạch, nhân quả, qua 1 hoặc 10 năm, hồi đầy sức khỏe, gọi bất kỳ sự kiện nào (bỏ qua điều kiện), xem seed, tắt Developer mode.
- Mọi thay đổi ghi dòng "[Dev] …" vào nhật ký. Logic nằm ở `src/systems/dev.ts`; trạng thái bật/tắt lưu trong trình duyệt (`tutien.dev`).
- Đây chỉ là ẩn nút, không phải khóa bảo mật: ai chạm đủ 20 lần trên trang công khai cũng bật được.
- Thẻ bật lên (sự kiện, gia đình…) quá cao giờ cuộn bên trong thay vì tràn khỏi màn hình.

### Sửa lỗi — Biến cố phải đổi chỉ số (2026-10-11)
- Lỗi: cha mất mà Hạnh phúc gần như không đổi. Giờ cha hoặc mẹ mất trừ 20 Hạnh phúc (tới 30 nếu rất thân), anh chị em 10–15 (`balance.json` mục `family.grief`). Số trừ ghi ngay trong nhật ký.
- Lỗi: cha đã mất mà sự kiện "Cha mẹ lâm bệnh" vẫn xảy ra. Engine giờ đặt flag riêng `no_father`, `no_mother` khi từng người mất (`no_parents` khi mất cả hai); sự kiện đổi tên "Cha lâm bệnh" và chỉ xảy ra khi cha còn sống.
- Validator báo lỗi khi sự kiện hay lựa chọn có chữ "cha"/"mẹ" mà không loại trường hợp người đó đã mất; ba câu kết quả nhắc cha/mẹ trong tình huống có thể không còn họ được viết lại không gọi tên.
- Lựa chọn nào cũng đổi ít nhất một chỉ số: đồng bộ 19 lựa chọn theo bản sự kiện phàm nhân đã duyệt lại; validator báo lỗi kết quả không đổi số nào.
- Kết quả sự kiện và hành động gia đình có thêm dòng thay đổi chỉ số, ví dụ "Hạnh phúc −3 · Bạc +10" (`src/systems/deltas.ts`).

### Sửa lỗi — Người thân trùng tên (2026-10-11)
- Lỗi: em trai sinh ra có thể trùng tên với nhân vật chính (hay với anh chị em khác).
- Giờ tên người thân không bao giờ trùng tên (phần sau họ) với nhân vật chính hay bất kỳ ai trong nhà.
- Thêm nhiều tên: 40 họ (thêm Tư Mã, Gia Cát, Nam Cung…), và tên ghép từ tên đệm + tên (25 × 40 cho mỗi giới), cộng 12 tên đẹp có sẵn mỗi giới: hơn 1.000 tên cho mỗi giới.
- Sửa luôn lỗi họ kép: người họ Thượng Quan, Âu Dương… trước đây có cha anh chị em mang họ "Thượng", "Âu"; giờ giữ đủ họ kép.

### Task 1.11 — Tua nhanh (2026-10-11) · xong GĐ 1
- Nút tròn **»** cạnh nút "+1 năm": tự qua nhiều năm liền, dừng khi có sự kiện cần chọn, khi có chuyện đáng chú ý (tin vui, tin dữ, đổ bệnh, người thân mất…), khi nhân vật mất, hoặc sau tối đa 10 năm (`balance.json` mục `fastForward`).
- Tua nhanh cho kết quả y hệt bấm "+1 năm" từng lần, chỉ đỡ bấm. Hàm `fastForward` nằm cạnh `advanceYear` trong `core/state.ts`.
- Đủ tiêu chí hoàn thành GĐ 1: sống trọn một đời phàm nhân, có khí vận, sự kiện, gia đình, lưu game và xuất/nhập file.

### Task 1.10 — Giải thích thuật ngữ (2026-10-11)
- 36 thuật ngữ đã duyệt trong `content/glossary.json`: chỉ số, tiền bạc, quan hệ, khí vận, tu tiên và các cảnh giới.
- Thuật ngữ trong nhật ký, thẻ sự kiện, thẻ khí vận và thẻ nhân vật được gạch chân chấm (chỉ lần đầu trong mỗi đoạn); chạm vào hiện thẻ giải thích, chạm ra ngoài hoặc bấm Esc để đóng.
- Chạm vào tên chỉ số (Hạnh phúc, Sức khỏe, Căn cốt, Tu vi, Tuổi…) và chữ "lượng bạc", "linh thạch" ở thanh trên cũng hiện giải thích.
- So khớp không phân biệt hoa thường, ưu tiên cụm dài ("Tiên Thiên Khí Vận" trước "Khí vận"), chỉ khớp nguyên từ; không dùng tên khác nhiều nghĩa để khỏi gạch chân nhầm.

### Task 1.9 — Lưu game (2026-10-11)
- 3 ô lưu trong trình duyệt. Game tự lưu vào ô đang chơi sau mỗi năm, mỗi lựa chọn và mỗi tương tác gia đình; đóng trình duyệt mở lại bấm **Tiếp tục** là chơi tiếp.
- Màn **Sổ lưu** (mở từ màn đầu hoặc nút 簿 ở màn chính): xem từng ô (tên, tuổi, còn sống hay đã mất, thế giới, giờ lưu), Chơi, Xuất file `.json`, Xóa (có hỏi lại), Nhập file save, đổi giao diện sáng/tối.
- Nhập thế khi cả 3 ô đều có đời: phải chọn ô để ghi đè, có hỏi lại. Nhập file cũng chọn ô như vậy. Bỏ kiếp này hoặc đầu thai sau khi mất thì đời mới thay vào ô đang chơi.
- File save có `saveVersion` và hàm `migrate` để bản cập nhật sau không làm hỏng save cũ; save từ bản mới hơn, file lạ hay thế giới chưa có đều báo lỗi rõ ràng.
- Save quá lớn thì bỏ bớt các năm "bình lặng" trong nhật ký; trình duyệt chặn hoặc đầy bộ nhớ thì màn chính hiện cảnh báo, nhắc xuất file.
- Màn đầu hiện số kiếp đã trải.

### Task 1.8 — Lão hóa, bệnh tật, chết già và màn tổng kết (2026-10-11)
- Thân thể thay đổi theo năm: dưới 50 tuổi Sức khỏe tự hồi 3 điểm mỗi năm (tối đa 70); từ 50 tuổi giảm 1 điểm mỗi năm; từ 60 tuổi mỗi năm có tỉ lệ đổ bệnh `(tuổi − 60) × 0.8%` (G.3), bệnh trừ 5–15 Sức khỏe và 5 Hạnh phúc.
- Chết khi hết thọ nguyên (chết già) hoặc khi Sức khỏe về 0 (chết bệnh, kể cả do sự kiện). Nhật ký ghi năm mất.
- Khi đã mất, nút "+1 năm" đổi thành 終 **Tổng kết**, mở màn tổng kết: cách mất, câu văn bia theo thiện ác, thiện ác, gia tài, số biến cố đã trải, người thân còn sống, chỉ số cuối đời, khí vận; có nút "Xem lại nhật ký" và "Đầu thai kiếp mới".
- Câu chữ bệnh tật, cái chết và văn bia là dữ liệu trong `content/life-texts.json` (bản nháp chờ duyệt); con số nằm trong `balance.json` mục `aging`.
- Mô phỏng 500 đời: tuổi mất giữa khoảng 72 (10% sớm nhất trước 63, 10% muộn nhất sau 80), khoảng 9% chết vì bệnh.

### Kế hoạch — Cảnh giới, linh căn và đời không linh căn (2026-10-11)
- Lưu hai bản thiết kế đã duyệt vào `docs/design/`: `realms-roots-paths.md` (cảnh giới, linh căn, 11 thể chất đặc biệt, 5 con đường, 6 bách nghệ) và `mortal-path.md` (đời phàm nhân, cửa vào tiên lộ muộn, võ đạo 7 cảnh giới, phúc báo, cầu đầu thai, trùng sinh).
- PLAN.md: quyết định số 9 (linh căn do trời sinh, đời phàm nhân là lối chơi trọn vẹn); task 2.1 ghi nội dung đã duyệt; thêm task 2.11–2.12, 3.11–3.13, 4.11–4.12, 5b.8–5b.10; K.6 ghi các móc mới đã duyệt và task sẽ thêm chúng.

### Gia đình — thêm tương tác (2026-10-11)
- Chạm vào một người thân trong bảng Quan hệ để chọn việc làm cùng: Hỏi han, Tặng quà (5 bạc), Dẫn đi du ngoạn (10 bạc, từ 14 tuổi), Phụ việc nhà, Xin tiền (cha mẹ, bị từ chối nếu thiện cảm thấp), Chăm sóc lúc tuổi già (người thân từ 60 tuổi), Cãi nhau. Mỗi việc một lần mỗi năm với mỗi người.
- Kết quả hiện ngay dưới tên người đó và ghi vào nhật ký; du ngoạn có lúc gặp chuyện dở khóc dở cười.
- Tương tác là dữ liệu trong `content/family-actions.json` (bản nháp, sửa câu chữ hay thêm việc mới không cần sửa code).

### Task 1.7 — Gia đình (2026-10-11)
- Nhân vật sinh ra có cha, mẹ và 0–2 anh chị; cha mẹ còn trẻ thì mỗi năm có thể sinh thêm em (tối đa 4 anh chị em). Cô nhi không có gia đình.
- Người thân già đi theo năm và mất khi hết thọ (cùng công thức thọ nguyên phàm nhân); nhật ký ghi lại, Hạnh phúc giảm theo thiện cảm với người mất.
- Khi cả cha lẫn mẹ đã mất, các sự kiện cần cha mẹ không xuất hiện nữa (flag `no_parents`).
- Nút 緣 **Quan hệ** mở bảng gia đình: tên, tuổi, thiện cảm; mỗi năm "Hỏi han" mỗi người một lần để tăng thiện cảm (thiện cảm tự giảm nhẹ mỗi năm nếu không hỏi han).
- Mọi con số nằm trong `balance.json` mục `family`.

### Task 1.5 — Bộ máy sự kiện (2026-10-11)
- Bấm "+1 năm" giờ có thể gặp sự kiện: thẻ sự kiện hiện câu chuyện và các lựa chọn, chọn xong hiện kết quả rồi ghi vào nhật ký năm đó.
- Lọc sự kiện theo tuổi, flag, khí vận, chỉ số, "chỉ một lần", "cách N năm"; rút theo trọng số, khí vận nhân trọng số theo chủ đề (ví dụ Thiết Vị không bao giờ gặp ngộ độc, Đảo Môi Tinh gặp xui ×1.5).
- Lựa chọn ẩn chỉ hiện khi có khí vận tương ứng, ghi tên khí vận và tô màu theo phẩm; lựa chọn thiếu điều kiện (ví dụ không đủ bạc) hiện mờ.
- Kiểm tra chỉ số hiện % thành công: 50% + 1.5% mỗi điểm chênh so với độ khó, trong khoảng 5–95% (`balance.json`).
- Sự kiện nối hẹn trước (Ông lão xin ăn → Ông lão trở lại sau 3–8 năm) đến đúng hạn, ưu tiên hơn sự kiện ngẫu nhiên.
- Tỉ lệ có sự kiện mỗi năm tạm để 50% (G.4 là 20%) vì mới có 20 sự kiện: 20% thì cả đời 60 năm chỉ gặp khoảng 9 sự kiện, 50% thì khoảng 16. Sẽ hạ dần khi thêm nội dung.
- Task 1.4 (màn chính) đánh dấu xong: đã làm trong task 0.5 và 1.1.

### Task 1.6 — 20 sự kiện phàm nhân của Thương Lan giới (2026-10-11)
- Nhập 20 sự kiện đã duyệt vào `content/worlds/thuong_lan/events/`: tuổi thơ 7, đi học 4, làm việc 5, hài hước 2, tai nạn 2.
- Mỗi sự kiện có lựa chọn ẩn theo khí vận, kiểm tra chỉ số (thành công/thất bại), chuỗi "Ông lão xin ăn → Ông lão trở lại" sau 3–8 năm.
- Schema sự kiện: thêm `themes` (chủ đề để khí vận nhân trọng số, tách khỏi `tags` lọc nội dung); hiệu ứng và điều kiện dùng đúng tên như móc khí vận (`stat.<tên>`, `silver`, `karma`…), sai tên là báo lỗi.
- Xuất thân cô nhi đặt flag `no_parents`; sự kiện cần cha mẹ dùng `flagsNone: ["no_parents"]`.
- Validator: chủ đề tình duyên phải từ 18 tuổi; lựa chọn nhắc tới khí vận không tồn tại thì báo lỗi.
- Sự kiện sẽ xuất hiện khi chơi sau khi xong bộ máy sự kiện (task 1.5).

### Chuẩn bị cho nhiều thế giới (2026-10-11)
- Nội dung riêng của thế giới chuyển vào `content/worlds/thuong_lan/` (xuất thân, họ tên, sự kiện) kèm `world.json`. Thế giới đầu tiên: **Thương Lan giới** (`thuong_lan`); cân bằng, khí vận, thuật ngữ vẫn dùng chung.
- `loadContent(worldId)` nạp phần chung + phần của một thế giới; nhân vật lưu `worldId`.
- Validator nhận diện file theo thế giới, báo lỗi khi id trong `world.json` khác tên thư mục.
- PLAN.md: quyết định số 8 và mục C.7 "Nhiều thế giới"; đường dẫn sự kiện trong các task cập nhật theo thư mục mới. Trong game chưa có gì thay đổi.

### Task 1.3 — Nghịch Thiên Bốc Mệnh (2026-10-11)
- Sau khi đầu thai, màn quay hiện 3 khí vận dạng thẻ lật, màu theo phẩm (Phàm, Lương xanh lục, Ưu xanh lam, Tuyệt tím, Thiên cam, Thần đỏ, Ác vận xám); Tuyệt trở lên có viền sáng.
- Quay theo tỉ lệ phẩm trong `balance.json`, mỗi ô có 12% ra ác vận, 3 ô không trùng nhau; "Nghịch thiên cải mệnh" quay lại được 3 lần (theo seed, chơi lại cùng seed ra cùng kết quả).
- "Thuận theo thiên ý" áp ngay các móc chỉ số (`stat.*`) và thọ nguyên (`lifespanPct`); các móc khác chờ hệ thống tương ứng. Nhật ký năm sinh ghi khí vận, khí vận Thiên/Thần có thêm dòng hiếm.
- Bấm ảnh đại diện xem lại khí vận của nhân vật.

### Task 1.2 — 20 Tiên Thiên Khí Vận (2026-10-11)
- Nhập 20 khí vận đã duyệt vào `content/traits.json`: Phàm 5, Lương 4, Ưu 3, Tuyệt 2, Thiên 1, Thần 1, Ác vận 4.
- Schema móc hiệu ứng theo mục K.6: chỉ chấp nhận móc có trong bộ móc, đúng kiểu giá trị (`add`, `mul`, cờ, `trigger.everyNYears`, `counter`).
- Validator: trùng id khí vận; móc `eventWeight.romance*` bắt buộc `activeFrom.age ≥ 18` (mục H). Tag sự kiện trong `eventWeight` chưa có sự kiện thì không báo lỗi.
- Hiệu ứng sẽ được áp vào nhân vật ở task 1.3 (màn quay khí vận).

### Task 1.1 — Tạo nhân vật (2026-10-11)
- `GameState` theo các lớp chỉ số ở mục K: phàm thân (sức khỏe, hạnh phúc, trí tuệ, mị lực), tư chất (căn cốt, ngộ tính, khí vận, đạo tâm), tu vi, tiền, nhân quả/danh vọng, nhật ký.
- `createLife`: tạo nhân vật từ seed (cùng seed ra cùng nhân vật), thọ nguyên phàm nhân theo G.3, xuất thân cộng chỉ số qua móc `stat.<tên>`.
- Nội dung nháp: 6 xuất thân, họ tên, quê quán (`content/character/`).
- Màn "Một kiếp mới": đặt tên hoặc bốc tên ngẫu nhiên, chọn giới tính, chọn xuất thân hoặc để trời định.
- Màn chính hiện nhân vật thật; bấm ảnh đại diện xem tư chất và đầu thai lại. Nút "+1 năm" tạm thời chỉ tăng tuổi (sự kiện ở task 1.5).

### Kế hoạch — Khung hệ thống lõi (2026-10-11)
- PLAN.md thêm mục **K. Khung hệ thống lõi** (đã chốt): 4 lớp chỉ số, hai trục đạo thống × con đường chiến đấu, ngũ hành, chiến lực và chiến đấu 3 hiệp, hệ thống phụ, bộ móc hiệu ứng cho khí vận/thiên phú.
- G.1: tốc độ tu luyện dùng cả căn cốt lẫn ngộ tính.
- Task 2.1, 3.3, 3.8 cập nhật theo mục K.

### Task 0.5 — Giao diện cổ phong (2026-10-11)
- Theme giấy cũ + mực (sáng) và ngọc bích (tối), nút đổi Tự động/Sáng/Tối (nhớ lựa chọn).
- Font Noto Serif cho chữ truyện, Be Vietnam Pro cho giao diện (đủ dấu tiếng Việt).
- Màn tiêu đề với ấn triện và nút "Nhập thế".
- Màn chính theo bố cục kiểu BitLife (vẽ lại cổ phong): thanh trên (nhân vật, bạc/linh thạch, túi đồ), nhật ký theo từng tuổi có tô màu tốt/xấu/hiếm, thanh dưới 4 mục + nút tròn lớn "+1 năm" ở giữa, thanh chỉ số đổi màu theo giá trị, popup sự kiện có lựa chọn ẩn. Dữ liệu mẫu để duyệt bố cục.
- Máy tính (≥900px): cột nhật ký + cột chỉ số bên phải; popup ở giữa màn hình.

### Task 0.4 — Nạp và kiểm tra dữ liệu JSON (2026-10-11)
- Schema Zod cho sự kiện, cấu hình cân bằng, thuật ngữ (`src/core/schemas.ts`).
- `npm run validate`: báo sai schema, trùng id, followUp tới sự kiện không tồn tại, flag không ai đặt, ảnh thiếu, sự kiện "mature" cho nhân vật dưới 18 tuổi.
- Game nạp nội dung lúc khởi động; dữ liệu lỗi thì hiện thông báo thay vì trang trắng.
- `content/config/balance.json` bản đầu (nhịp sự kiện, tỉ lệ khí vận); CI chạy validate trước test và build.

### Task 0.3 — Random có seed + test (2026-10-11)
- `src/core/rng.ts`: bộ sinh số ngẫu nhiên có seed, lưu/khôi phục được trạng thái, có chọn theo trọng số.
- Cài Vitest, `npm test` chạy 7 test cho RNG; CI chạy test trước khi build.
- PLAN.md: thêm GĐ 8 — AI tuỳ chọn (hướng an toàn, rẻ).

### Task 0.2 — Link chơi thử (2026-10-11)
- GitHub Actions tự build mỗi PR và tự đưa bản mới lên GitHub Pages mỗi khi merge vào `main`.
- Link chơi thử: https://olivernguyen2611.github.io/tu-tien-nhan-sinh/

### Task 0.1 — Khung dự án (2026-10-11)
- Khởi tạo dự án Vite + TypeScript + Preact.
- Tạo cấu trúc thư mục `src/`, `content/`, `tools/`, `tests/`, `public/img/events/`.
- Thêm `CLAUDE.md` (quy tắc làm việc), `PLAN.md` (kế hoạch), `CHANGELOG.md`.
- Màn hình tiêu đề tạm thời.
