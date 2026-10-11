# Nhật ký thay đổi

## [Chưa phát hành]

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
