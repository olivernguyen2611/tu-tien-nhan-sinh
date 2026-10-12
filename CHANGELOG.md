# Nhật ký thay đổi

## [Chưa phát hành]

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
