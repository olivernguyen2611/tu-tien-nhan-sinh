# Nhật ký thay đổi

## [Chưa phát hành]

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
