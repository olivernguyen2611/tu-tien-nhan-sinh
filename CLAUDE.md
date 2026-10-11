# Tu Tiên Nhân Sinh — quy tắc làm việc cho AI

Game mô phỏng cuộc đời tu tiên kiểu BitLife (web, Vite + TypeScript + Preact). Kế hoạch đầy đủ: `PLAN.md`.

## Ngôn ngữ
- Trả lời chủ dự án bằng **tiếng Việt**.
- Code, tên biến, tên file: **tiếng Anh**. Văn bản hiển thị trong game: **tiếng Việt**.

## Quy tắc
1. **Mỗi lần chỉ làm một task** trong `PLAN.md`. Xong thì tóm tắt đã làm gì, cách chơi thử, đề xuất task kế tiếp.
2. Không viết lại toàn bộ file khi chỉ cần sửa một phần.
3. Code dễ đọc, chú thích ngắn, mỗi hệ thống một module. **Không đặt logic game trong UI** (`src/ui` chỉ hiển thị và gửi hành động).
4. Mọi con số cân bằng nằm trong `content/config/balance.json`, không hardcode.
5. Nội dung game (sự kiện, khí vận, vật phẩm…) là JSON trong `content/`. Thêm nội dung = thêm JSON, không sửa engine.
6. Random luôn đi qua RNG có seed (`src/core/rng.ts`), không gọi `Math.random()` trong logic game.
7. Khi xong task: đánh dấu `[x]` trong `PLAN.md` và ghi `CHANGELOG.md`.
8. Task nội dung (✍️): soạn nháp cho chủ dự án duyệt trước khi nhập vào JSON; kiểm tra trùng `id`.
9. Văn phong trong game: cổ phong, súc tích, có chút hài hước; dùng từ Hán Việt đúng nghĩa.
10. Nội dung nhạy cảm theo mục H của `PLAN.md`: không miêu tả trần trụi; nhân vật dưới 18 tuổi không vào sự kiện tình duyên/song tu.
11. Không dùng tên, hình, văn bản của BitLife, Quỷ Cốc Bát Hoang hay tiểu thuyết có bản quyền.
12. Giao diện phải dùng tốt **cả điện thoại lẫn máy tính**.

## Lệnh
- `npm run dev` — chạy thử trên máy
- `npm run build` — kiểm tra kiểu + build ra `dist/`
- `npm run typecheck` — chỉ kiểm tra kiểu
- `npm test` — chạy test (Vitest)
- `npm run validate` — kiểm tra toàn bộ JSON trong `content/` (schema ở `src/core/schemas.ts`)

## Cấu trúc
- `src/core/` — GameState, RNG, vòng lặp game, nạp nội dung
- `src/systems/` — từng hệ thống (cultivation, events, destiny, save…)
- `src/ui/` — components và screens (Preact)
- `content/` — dữ liệu JSON của game
- `tools/` — script hỗ trợ (validator nội dung)
- `tests/` — test theo seed
