# KẾ HOẠCH PHÁT TRIỂN — "TU TIÊN NHÂN SINH"

> Phiên bản: bản nháp 1 (2026-10-11) · Trạng thái: **chờ duyệt**
> Quy ước đánh dấu task: `[ ]` chưa làm · `[~]` đang làm · `[x]` xong

---

## A. Các quyết định đã chốt (trả lời câu hỏi làm rõ)

| # | Câu hỏi | Quyết định |
|---|---|---|
| 1 | Độ dài một đời | Không cố định. Dài hay ngắn tùy lựa chọn và cách người chơi xử lý tình huống. Engine phải hỗ trợ cả đời phàm nhân 40 năm lẫn đời tu sĩ vạn năm (tua nhanh, bế quan). |
| 2 | Giao diện | Bố cục kiểu BitLife (thanh chỉ số trên, nhật ký cuộn giữa, nút lớn dưới) nhưng **vẽ lại hoàn toàn theo phong cách cổ phong**. Không dùng logo, hình, chữ của BitLife. Ảnh AI chỉ dùng cho **tình tiết đặc biệt**. |
| 3 | Nội dung | Có giết chóc, ma đạo, lô đỉnh, cảnh nhạy cảm, nhưng **không miêu tả trần trụi** (xem mục H). |
| 4 | Thiết bị | Điện thoại và máy tính **quan trọng ngang nhau**. |
| 5 | Nơi lưu code | **Repo GitHub + GitHub Pages** để chơi thử bằng link trên mọi thiết bị. |
| 6 | Cách làm | **Từng bước nhỏ**, mỗi bước chơi thử được, tránh lỗi dây chuyền. |
| 7 | Nội dung (sự kiện, khí vận…) | **Claude soạn nháp, bạn duyệt** trước khi đưa vào game. |
| 8 | Nhiều thế giới | Game sẽ có **nhiều thế giới**, mỗi thế giới một tuyến cốt truyện riêng. Thế giới đầu tiên là **Thương Lan giới** (`thuong_lan`), các thế giới sau thêm dần. Engine không gắn với thế giới nào (xem C.7). |
| 9 | Đời không linh căn | Đời phàm nhân là một lối chơi trọn vẹn (4 con đường đời, võ đạo 7 cảnh giới), có cửa vào tiên lộ muộn và phúc báo cho đời sau. **Linh căn do trời sinh**, chỉ thiên địa kỳ vật mới tạo được. Chi tiết: `docs/design/mortal-path.md` (duyệt 2026-10-11). |

---

## B. Tóm tắt thiết kế

### Vòng lặp chính
1. **Tạo nhân vật** → bấm *Nghịch Thiên Bốc Mệnh* quay 3 ô Tiên Thiên Khí Vận (có reroll).
2. **Qua một năm** (1 chạm): tuổi +1 → tu vi tăng → kiểm tra thọ nguyên → có thể nảy ra sự kiện → người chơi chọn → hậu quả ghi vào nhật ký.
3. Lúc rảnh, người chơi mở các tab (Tu luyện, Tông môn, Túi đồ, Quan hệ, Khám phá, Nhân vật) để chủ động làm việc: đột phá, bái sư, đi phường thị, tỏ tình, gây chuyện…
4. **Chết** (già, đánh nhau, đột phá hỏng, thiên kiếp…) → màn **tổng kết đời** → nhận điểm Luân Hồi → mở khóa thiên phú → đời mới.

### Điểm hấp dẫn
- **Mỗi đời một câu chuyện**: khí vận quay ngẫu nhiên + sự kiện có điều kiện + nhân quả nhiều năm sau → không đời nào giống đời nào.
- **Nhân quả thật**: NPC nhớ việc bạn làm (sổ ân oán), cả ân oán lẫn tông môn tồn tại sang đời sau.
- **Build nhân vật**: khí vận + kim thủ chỉ + thiên phú Nghịch Thiên Cải Mệnh xếp chồng thành lối chơi riêng (kiếm tu tốc chiến, đan sư sống lâu, ma tu hút máu…).
- **Motif tu tiên kinh điển + hài hước**: phế vật nghịch tập, từ hôn, lão gia gia trong nhẫn, đồ đệ xuyên không gọi sư phụ là "NPC".

### Khác biệt so với BitLife
| BitLife | Tu Tiên Nhân Sinh |
|---|---|
| Đời người ~80 năm, cố định nhịp | Từ vài chục đến hàng nghìn năm; nhịp tự co giãn (bế quan, tua nhanh) |
| Chỉ số đời thường | Thêm hệ cảnh giới, linh căn, tu vi, thọ nguyên, nhân quả |
| Chết là hết | Luân hồi mang theo điểm, thành tựu, Thiên Thư; gặp lại tông môn mình lập |
| Quay ngẫu nhiên xuất thân | Quay khí vận có phẩm cấp, ác vận có lợi ích kèm, tổ hợp ẩn |
| NPC đứng yên | NPC quan trọng tự tu luyện, già đi, phản bội, báo thù |

### Nhịp chơi
- ~80% số năm chỉ cần 1 chạm, không popup.
- Có **Tua nhanh** (tự qua năm đến khi gặp sự kiện quan trọng) và **Bế quan X năm** ở cảnh giới cao.
- Độ dài đời do người chơi quyết định: liều mạng thì chết sớm, cẩn trọng thì sống lâu nhưng có thể lỡ cơ duyên.

---

## C. Kiến trúc kỹ thuật

### C.1 Công nghệ và lý do
| Thành phần | Chọn | Lý do |
|---|---|---|
| Build | **Vite** | Khởi động nhanh, cấu hình tối thiểu, build ra web tĩnh để đưa lên GitHub Pages. |
| Ngôn ngữ | **TypeScript** | Bắt lỗi kiểu dữ liệu sớm. Rất quan trọng khi vibe coding: AI sửa sai chỗ nào là trình biên dịch báo ngay. |
| Giao diện | **Preact** (~4 KB, cú pháp giống React) | Game có nhiều tab, popup, danh sách. Viết giao diện thuần JS sẽ rối nhanh; React đầy đủ thì nặng hơn mức cần. Preact nhẹ, dễ đọc, dễ chuyển sang React sau nếu cần. |
| Kiểm tra dữ liệu | **Zod** | Định nghĩa schema cho mọi file JSON; validator dùng chung schema đó. |
| Test | **Vitest** | Test engine bằng seed cố định, chạy cùng hệ thống Vite. |
| Lưu game | **localStorage** | Nhiều slot, tự lưu mỗi năm, xuất/nhập file `.json`. |
| Triển khai | **GitHub Actions → GitHub Pages** | Mỗi lần đẩy code, link chơi thử tự cập nhật. |
| Mở rộng sau | **PWA**, sau đó Capacitor nếu cần lên store | PWA cài được lên màn hình điện thoại, chơi offline. |

### C.2 Cấu trúc thư mục
```
tu-tien-nhan-sinh/
├─ index.html
├─ package.json · vite.config.ts · tsconfig.json
├─ PLAN.md · CHANGELOG.md · CLAUDE.md        (CLAUDE.md = quy tắc làm việc mục 8 của spec)
├─ .github/workflows/deploy.yml              (tự build và đưa lên GitHub Pages)
├─ public/
│  └─ img/events/                            (ảnh AI cho tình tiết đặc biệt)
├─ content/                                  (TOÀN BỘ NỘI DUNG GAME, dạng JSON)
│  ├─ config/balance.json                    (mọi con số cân bằng)          ┐
│  ├─ realms.json · roots.json · aptitudes.json                             │
│  ├─ traits.json · trait-combos.json        (Tiên Thiên Khí Vận, tổ hợp ẩn)│ dùng chung
│  ├─ golden-fingers.json · fate-talents.json                               │ cho mọi
│  ├─ techniques.json · items.json · pills.json · treasures.json            │ thế giới
│  ├─ achievements.json · rebirth-talents.json · end-badges.json            │
│  ├─ glossary.json                                                         ┘
│  └─ worlds/                                (mỗi thế giới một thư mục, xem C.7)
│     └─ thuong_lan/
│        ├─ world.json                       (id, tên, mô tả, thứ tự)
│        ├─ character/origins.json · names.json   (xuất thân, họ tên, quê quán)
│        ├─ regions.json · sects.json · npc-templates.json · protagonist-templates.json
│        └─ events/
│           ├─ childhood.json · root-test.json · sect-recruit.json
│           ├─ cultivation.json · fortune.json · romance.json · funny.json …
├─ src/
│  ├─ main.tsx
│  ├─ core/
│  │  ├─ types.ts            (kiểu dữ liệu dùng chung)
│  │  ├─ rng.ts              (random có seed)
│  │  ├─ state.ts            (GameState + tạo nhân vật mới)
│  │  ├─ gameLoop.ts         (xử lý một năm, nhận hành động người chơi)
│  │  └─ content.ts          (nạp + kiểm tra JSON)
│  ├─ systems/
│  │  ├─ time.ts             (TimeSystem: qua năm, tua nhanh, bế quan)
│  │  ├─ events/             (EventEngine: conditions.ts, effects.ts, picker.ts, text.ts)
│  │  ├─ cultivation.ts      (tu vi, đột phá, bình cảnh, tâm ma)
│  │  ├─ combat.ts
│  │  ├─ relationships.ts    (quan hệ, thiện cảm, sổ ân oán)
│  │  ├─ lineage.ts          (đạo lữ, con cháu, gia tộc, di truyền)
│  │  ├─ disciples.ts        (sư đồ, khí vận chi tử)
│  │  ├─ sect.ts             (lập tông phái)
│  │  ├─ destiny.ts          (khí vận, kim thủ chỉ, Nghịch Thiên Cải Mệnh)
│  │  ├─ inventory.ts
│  │  ├─ world.ts            (vùng, NPC thế giới sống, thiên kiêu bảng)
│  │  ├─ rebirth.ts          (luân hồi, thành tựu, Thiên Thư)
│  │  └─ save.ts             (SaveSystem)
│  └─ ui/
│     ├─ theme.css           (màu giấy cũ/mực + dark mode ngọc bích)
│     ├─ components/         (StatBar, LogBlock, EventPopup, Tooltip, TabBar…)
│     └─ screens/            (Title, CreateCharacter, DestinyRoll, Main, Death, Rebirth, Settings)
├─ tools/
│  └─ validate-content.ts    (npm run validate: kiểm tra schema, trùng id, tham chiếu hỏng)
└─ tests/                    (test engine theo seed)
```

### C.3 Các module chính
| Module | Nhiệm vụ | Giai đoạn |
|---|---|---|
| **GameState** | Một object duy nhất chứa toàn bộ trạng thái đời đang chơi (nhân vật, chỉ số, flag, NPC, túi đồ, nhật ký, trạng thái RNG). | GĐ1 |
| **TimeSystem** | Qua năm, tua nhanh, bế quan; gọi các hệ thống khác theo thứ tự cố định. | GĐ1 |
| **EventEngine** | Lọc sự kiện theo điều kiện, rút theo trọng số (có khí vận), áp hậu quả, thay biến `{name}`, chuỗi sự kiện qua flag. | GĐ1 |
| **CultivationSystem** | Linh căn, tu vi, cảnh giới, đột phá, phẩm đạo cơ/Kim Đan/Nguyên Anh, bình cảnh, tâm ma, thiên kiếp. | GĐ2–4 |
| **CombatSystem** | So chỉ số + vài lựa chọn (đánh, pháp bảo, phù, chạy, cầu xin), xuất văn bản mô tả. | GĐ3 |
| **RelationshipSystem** | Cha mẹ, bằng hữu, sư phụ, kẻ thù; thiện cảm nhiều nấc; sổ ân oán. | GĐ1 (cơ bản) → GĐ3 |
| **LineageSystem** | Đạo lữ, song tu, sinh con, di truyền linh căn, gia tộc, chơi tiếp bằng con cháu. | GĐ3, GĐ5 |
| **DiscipleSystem** | Thu đồ đệ, khí vận chi tử, phản sư, truyền y bát. | GĐ4–5 |
| **SectSystem** | Gia nhập tông môn (GĐ2), lập tông phái + báo cáo năm (GĐ5). | GĐ2, GĐ5 |
| **DestinySystem** | Tiên Thiên Khí Vận, tổ hợp ẩn, Kim Thủ Chỉ, Nghịch Thiên Cải Mệnh. | GĐ1 → GĐ5b |
| **InventorySystem** | Bạc, linh thạch, vật phẩm, đan dược, pháp bảo. | GĐ3 |
| **SaveSystem** | Nhiều slot, tự lưu, xuất/nhập file, nâng cấp save cũ khi game đổi phiên bản. | GĐ1 |
| **UI** | Chỉ hiển thị và gửi hành động; **không chứa logic game**. | Mọi GĐ |

### C.4 Luồng dữ liệu
```
Người chơi bấm nút
   → UI gửi Action (vd: { type: "ADVANCE_YEAR" } / { type: "CHOOSE", choiceIndex: 1 })
   → gameLoop(state, action, content, rng)   ← hàm thuần, không đụng tới giao diện
        → TimeSystem → CultivationSystem → World/NPC → EventEngine → …
   → trả về GameState mới (+ dòng nhật ký, + sự kiện đang chờ chọn nếu có)
   → SaveSystem tự lưu
   → UI vẽ lại
```
Vì logic là hàm thuần + RNG có seed, **cùng seed + cùng chuỗi lựa chọn = cùng kết quả**. Khi bạn báo lỗi, chỉ cần gửi file save là tái hiện được.

### C.5 Định dạng file save
```json
{
  "saveVersion": 1,
  "gameVersion": "0.1.0",
  "slot": 1,
  "savedAt": "2026-10-11T14:00:00Z",
  "meta": { "rebirthPoints": 0, "livesPlayed": 3, "achievements": [], "codex": [], "pityCounter": 2 },
  "life": {
    "worldId": "thuong_lan",
    "seed": 123456789,
    "rngState": [1, 2, 3, 4],
    "year": 37,
    "character": { "name": "Lý Thanh Phong", "gender": "nam", "age": 37, "origin": "nong_dan", "region": "thanh_van_tran" },
    "stats": { "health": 80, "happiness": 60, "intellect": 55, "charm": 40 },
    "cult": { "realm": "luyen_khi", "stage": 6, "progress": 42, "root": "song_kim_hoa", "lifespan": 120 },
    "traits": ["an_khoe_ngu_ngon", "kiem_cot", "thien_sat_co_tinh"],
    "flags": { "found_old_cave": true },
    "npcs": [],
    "inventory": [],
    "log": []
  }
}
```
- `meta`: dữ liệu vĩnh viễn giữa các đời. `life`: đời hiện tại.
- Có hàm `migrate(save)` nâng cấp save cũ theo `saveVersion`, để bản cập nhật không làm hỏng save của bạn.
- Nhật ký quá dài sẽ được nén (giữ năm quan trọng) để không vượt giới hạn localStorage (~5 MB).
- `life.worldId`: đời này thuộc thế giới nào; mở save là nạp đúng nội dung thế giới đó.
- Bản đầu (task 1.9): `life` là nguyên `GameState`; `meta` (số kiếp đã trải…) lưu riêng ở khóa `tutien.meta`, không nằm trong từng ô lưu.

### C.7 Nhiều thế giới
Mỗi thế giới có tuyến cốt truyện riêng; engine không biết gì về thế giới cụ thể nào.
- **Riêng của thế giới** (`content/worlds/<id>/`): `world.json`, xuất thân, họ tên, quê quán, vùng đất, tông môn, NPC, thiên mệnh chi tử, sự kiện.
- **Dùng chung**: cân bằng, cảnh giới, linh căn, khí vận, thiên phú, công pháp, vật phẩm, thành tựu, luân hồi, thuật ngữ. Khi một thế giới cần khác (ví dụ hệ cảnh giới riêng), thêm file cùng tên trong thư mục thế giới để thay bản chung; làm khi thật sự cần.
- `loadContent(worldId)` gộp phần chung + phần của một thế giới thành một gói nội dung; hệ thống chỉ đọc gói đó. `GameState.worldId` ghi đời đang ở thế giới nào.
- Id sự kiện là duy nhất trên toàn game (không trùng giữa các thế giới), để save, thành tựu, Thiên Thư không nhầm.
- Thêm thế giới mới = thêm một thư mục trong `content/worlds/`, không sửa engine. Màn chọn thế giới làm khi có thế giới thứ hai.
- `meta` (thành tựu, điểm luân hồi) dùng chung giữa các thế giới.

### C.6 Cấu trúc sự kiện (cải tiến so với spec)
Giữ khung trong spec, thêm 5 điểm:
1. `conditions` gộp các điều kiện chỉ số vào một mảng `stats: [{ "stat": "luck", "gte": 50 }]` để không phải thêm trường mới cho mỗi chỉ số.
2. Mỗi lựa chọn có `requires` (điều kiện để hiện) và `hidden: true` → hiện như **lựa chọn ẩn** tô màu theo phẩm khí vận.
3. `followUp: { "event": "id", "afterYears": [3, 10] }` để hẹn sự kiện tiếp theo nhiều năm sau (nhân quả).
4. `tags`: dùng cho bộ lọc nội dung (`violence`, `dark`, `mature`) và cho thống kê.
5. `image` (tùy chọn): đường dẫn ảnh AI cho tình tiết đặc biệt; không có ảnh thì hiện khung mực mặc định.

```json
{
  "id": "find_old_cave_01",
  "category": "fortune",
  "title": "Động phủ trong núi",
  "text": "Trên đường hái thuốc, {name} lạc vào một hang động có cấm chế mờ nhạt...",
  "tags": [],
  "image": null,
  "conditions": {
    "age": { "min": 10 },
    "realm": { "min": "pham_nhan", "max": "truc_co" },
    "region": ["thanh_van_son"],
    "flagsNone": ["found_old_cave"],
    "traitsAny": [],
    "stats": []
  },
  "weight": 5,
  "luckAffected": true,
  "cooldownYears": 0,
  "oncePerLife": true,
  "choices": [
    {
      "text": "Mạo hiểm phá cấm chế",
      "check": { "stat": "luck", "difficulty": 60 },
      "success": { "text": "...", "effects": { "addItems": ["ngoc_gian_01"], "setFlags": ["found_old_cave"] } },
      "fail":    { "text": "...", "effects": { "health": -30, "setFlags": ["found_old_cave"] } }
    },
    {
      "text": "[Lão gia gia] Hỏi ý tàn hồn trong nhẫn",
      "requires": { "goldenFinger": "lao_gia_gia" },
      "hidden": true,
      "result": { "text": "...", "effects": { "addItems": ["ngoc_gian_01"], "setFlags": ["found_old_cave"] } }
    },
    { "text": "Rời đi", "result": { "text": "...", "effects": {} } }
  ]
}
```
Validator (`npm run validate`) báo: sai schema, trùng `id`, tham chiếu tới vật phẩm/sự kiện/khí vận không tồn tại, flag được đòi hỏi nhưng không sự kiện nào đặt, ảnh khai báo mà không có file.

---

## D. Lộ trình theo giai đoạn

> Mỗi task = một lần trao đổi. Xong task nào, Claude đẩy code lên repo, bạn mở link GitHub Pages chơi thử, rồi duyệt hoặc báo lỗi.
> Task có ký hiệu ✍️ là task **nội dung**: Claude soạn nháp, bạn duyệt rồi mới nhập vào game.

### GĐ 0 — Khung dự án
**Mục tiêu:** có link chơi thử trống, mọi công cụ chạy được.

| # | Task | File chính |
|---|---|---|
| 0.1 | [x] Khởi tạo Vite + TypeScript + Preact, cấu trúc thư mục, `CLAUDE.md`, `CHANGELOG.md` | `package.json`, `vite.config.ts`, `src/main.tsx` |
| 0.2 | [x] GitHub Actions tự build và đưa lên GitHub Pages | `.github/workflows/deploy.yml` |
| 0.3 | [x] RNG có seed + Vitest + test đầu tiên | `src/core/rng.ts`, `tests/rng.test.ts` |
| 0.4 | [x] Nạp JSON + schema Zod + `npm run validate` | `src/core/content.ts`, `tools/validate-content.ts` |
| 0.5 | [x] Theme cổ phong (giấy cũ + dark mode ngọc bích), font tiếng Việt, khung bố cục co giãn điện thoại/máy tính | `src/ui/theme.css`, `src/ui/screens/Main.tsx` |

**Tiêu chí hoàn thành:** mở link GitHub Pages trên điện thoại và máy tính thấy màn hình tiêu đề "Tu Tiên Nhân Sinh" theo phong cách cổ phong, đổi được sáng/tối, không lỗi.

**Prompt mẫu:** `Bắt đầu GĐ 0, task 0.1.`

### GĐ 1 — MVP phàm nhân
**Mục tiêu:** sống trọn một đời phàm nhân từ lúc sinh tới lúc chết, có khí vận, sự kiện, lưu game.

| # | Task | File chính |
|---|---|---|
| 1.1 | [x] GameState + tạo nhân vật (tên, giới tính, xuất thân, quê quán, chỉ số phàm nhân) | `core/state.ts`, `screens/CreateCharacter.tsx` |
| 1.2 | [x] ✍️ Soạn ~20 Tiên Thiên Khí Vận (đủ phẩm Phàm→Thần + 3–4 ác vận) | `content/traits.json` |
| 1.3 | [x] Màn *Nghịch Thiên Bốc Mệnh*: quay 3 ô, thẻ lật, phát sáng theo màu, reroll giới hạn | `systems/destiny.ts`, `screens/DestinyRoll.tsx` |
| 1.4 | [x] Màn chính: thanh chỉ số trên, nhật ký cuộn, nút **Qua một năm**, thanh tab | `screens/Main.tsx`, `components/*` |
| 1.5 | [x] EventEngine lõi: lọc điều kiện, rút trọng số, áp hiệu ứng, thay biến văn bản, popup lựa chọn | `systems/events/*`, `components/EventPopup.tsx` |
| 1.6 | [x] ✍️ Soạn ~20 sự kiện phàm nhân (tuổi thơ, đi học, làm việc, hài hước, tai nạn) | `content/worlds/thuong_lan/events/childhood.json`, `study.json`, `work.json`, `funny.json`, `accident.json` |
| 1.7 | [x] Cha mẹ, anh chị em cơ bản (thiện cảm, già và mất theo thời gian) | `systems/relationships.ts` |
| 1.8 | [x] Lão hóa, bệnh, chết già; màn tổng kết đời đơn giản | `systems/time.ts`, `screens/Death.tsx` |
| 1.9 | [x] SaveSystem: 3 slot, tự lưu mỗi năm, xuất/nhập file, cảnh báo ghi đè | `systems/save.ts`, `screens/Settings.tsx` |
| 1.10 | [x] ✍️ Glossary + tooltip (chạm vào thuật ngữ gạch chân để xem giải thích) | `content/glossary.json`, `components/Tooltip.tsx` |
| 1.11 | [x] Tua nhanh (tự qua năm tới khi có sự kiện) | `core/state.ts` (cạnh `advanceYear`) |

**Tiêu chí hoàn thành:** tạo nhân vật, quay khí vận, chơi tới khi chết già; có ít nhất vài sự kiện chọn lựa; đóng trình duyệt mở lại vẫn chơi tiếp; xuất file save rồi nhập lại được.

**Prompt mẫu:** `Làm task 1.2: soạn nháp 20 khí vận cho mình duyệt.`

### GĐ 2 — Bước vào tu tiên
**Mục tiêu:** từ phàm nhân được phát hiện linh căn, vào tông môn, tu tới Trúc Cơ.

| # | Task | File chính |
|---|---|---|
| 2.1 | [x] ✍️ Bảng cảnh giới (Phàm Nhân → Hóa Thần) + linh căn + 5 con đường chiến đấu + 6 bách nghệ (mục K). **Nội dung đã duyệt**: `docs/design/realms-roots-paths.md`, chỉ còn nhập JSON | `content/realms.json`, `roots.json`, `aptitudes.json` |
| 2.2 | [x] Sự kiện kiểm tra linh căn (6–12 tuổi) + hiển thị linh căn; xuất thân Hậu duệ gia tộc tu tiên quay 2 lần lấy kết quả tốt hơn | `systems/cultivation.ts`, `content/worlds/thuong_lan/events/root-test.json` |
| 2.3 | [x] Tu vi tăng mỗi năm theo công thức mục G; thanh tu vi; đột phá tiểu cảnh giới Luyện Khí; móc mới `lineage.<đạo thống>.cultivationSpeed` và điều kiện `activeUntil: { realm }` (cho Thiên Sinh Ma Thể, Thiên Tuyệt Mạch) | `systems/cultivation.ts` |
| 2.4 | [x] ✍️ 6 tông môn khởi đầu (chính/ma/kiếm/đan/phật/yêu) + công pháp (C0–C16) | `content/worlds/thuong_lan/sects.json`, `content/techniques.json` — **đã duyệt**: `docs/design/sects.md`, `techniques.md` |
| 2.5 | [x] Tuyển đệ tử tông môn, cấp bậc ngoại môn/nội môn, nhiệm vụ tông môn đơn giản, sư phụ NPC | `systems/sect.ts`, `content/worlds/thuong_lan/events/sect-recruit.json` |
| 2.6 | [x] Đột phá Trúc Cơ: tỉ lệ thành công, phẩm đạo cơ (Hạ/Trung/Thượng/Hoàn mỹ), hậu quả thất bại | `systems/cultivation.ts` |
| 2.7 | [x] ✍️ + code: Nghịch Thiên Cải Mệnh lần đầu (chọn 1 trong 3 thiên phú khi Trúc Cơ) | `content/fate-talents.json`, `systems/destiny.ts` — **đã duyệt**: `docs/design/fate-talents.md` |
| 2.8 | [x] ✍️ 40 sự kiện tu luyện, tông môn & đời phàm nhân | `content/worlds/thuong_lan/events/*.json` — **đã duyệt**: `docs/design/cultivation-events.md` |
| 2.9 | [x] Đời đầu tiên dạng hướng dẫn + dòng "Mục tiêu hiện tại" | `systems/tutorial.ts` |
| 2.10 | [x] Chọn độ khó Dễ/Thường/Khó (Khó: không load lại) | `screens/CreateCharacter.tsx`, `balance.json` |
| 2.11 | [x] Đời không linh căn: 4 con đường đời (Quan, Thương, Võ lâm, Y; bậc thang 5 nấc + thu nhập + danh hiệu cuối đời) + cửa **Thiên địa kỳ vật** (tạo Ngũ/Tứ linh căn) và **Tạp dịch tông môn** (`mortal-path.md` mục 1, 2.1, 2.3) | `systems/career.ts`, `content/careers.json` |
| 2.12 | [x] Phàm nhân học Luyện Đan và Linh Thực từ cấp 0; nghề `nghe_thuoc` bắt đầu Luyện Đan cấp 10 (`realms-roots-paths.md` mục D) | `systems/crafts.ts` |

**Tiêu chí hoàn thành:** một đời có linh căn vào được tông môn và tu tới Trúc Cơ; đời không linh căn vẫn sống tiếp như phàm nhân; đột phá thất bại có hậu quả rõ ràng.

**Prompt mẫu:** `Làm task 2.3 theo công thức ở mục G của PLAN.md.`

### GĐ 3 — Thế giới tu chân
**Mục tiêu:** thế giới có tiền, đồ, đánh nhau, NPC sống, tình duyên.

| # | Task |
|---|---|
| 3.1 | [x] Túi đồ, bạc/linh thạch, đan dược dùng được (✍️ ~15 đan dược, ~15 vật phẩm) |
| 3.2 | [x] Phường thị: mua bán, trả giá đơn giản |
| 3.3 | [x] CombatSystem theo K.4: chiến lực, 3 hiệp × 5 hành động, văn bản theo con đường + hệ |
| 3.4 | [x] NPC có số mệnh riêng: tự tu luyện, già, chết; tính cách bề ngoài/bản chất; sổ ân oán |
| 3.5 | [x] Thiên kiêu bảng cập nhật mỗi năm |
| 3.6 | [x] Tình duyên: thiện cảm nhiều nấc, theo đuổi, tặng quà, bị từ chối, bị lợi dụng |
| 3.7 | [x] Đạo lữ đại điển, song tu, sinh con (di truyền linh căn, đột biến) |
| 3.8 | [x] Đạo thống (Tiên/Ma/Phật/Quỷ) × con đường (Kiếm/Thể/Pháp/Binh/Thuật) theo K.3 |
| 3.9 | [x] ✍️ 40 sự kiện: tình duyên, giết người đoạt bảo, ma đạo cám dỗ, yêu thú, phường thị — **đã duyệt**: `docs/design/events-jianghu.md` |
| 3.10 | [x] Tăng Tiên Thiên Khí Vận lên ~40, thêm tag cho sự kiện dùng |
| 3.11 | [x] Võ đạo nhập tiên: 7 cảnh giới võ đạo (Tam lưu → Ngũ khí triều nguyên). Hóa cảnh nhờ khổ luyện + Căn cốt ≥ 70; Tam hoa tụ đỉnh và Ngũ khí triều nguyên cần kỳ ngộ; Ngũ khí triều nguyên tính là Ngũ linh căn, vào Luyện Khí 1 (`mortal-path.md` mục 2.2, 2b). Kèm 4 sự kiện võ đạo đã duyệt #32–35 của `cultivation-events.md` (Lục Hợp Môn, khổ luyện, Hóa cảnh, đại hội võ lâm) |
| 3.12 | [x] Phật duyên: đạo tâm ≥ 70 tu Phật đạo không cần linh căn (`mortal-path.md` mục 2.4) |
| 3.13 | [x] ✍️ Sự kiện "ma tu hứa khai mạch" (lừa làm vật tế) + sự kiện cho 4 con đường đời |

**Tiêu chí hoàn thành:** đánh nhau có văn bản sinh động; một NPC bị bạn hại sẽ quay lại báo thù vài năm sau; kết được đạo lữ và có con mang linh căn di truyền.

**Prompt mẫu:** `Làm task 3.4, nhớ để mọi con số trong balance.json.`

### GĐ 4 — Chiều sâu
**Mục tiêu:** cảnh giới cao có trải nghiệm riêng, rủi ro lớn, nhịp chậm mà quy mô lớn.

| # | Task |
|---|---|
| 4.1 | [x] Bế quan X năm (lỡ sự kiện, người thân có thể qua đời) |
| 4.2 | [x] Mini-game kết đan (3 lượt xếp linh khí) → phẩm Kim Đan 1–9 + ✍️ đan văn |
| 4.3 | [x] Hình thái Nguyên Anh theo đạo đã tu (✍️ ~8 hình thái) |
| 4.4 | [x] Tâm ma chiến: ảo cảnh dựa trên chính những việc bạn đã làm (đọc sổ ân oán) |
| 4.5 | [x] Thiên kiếp ở các mốc lớn, cần pháp bảo/trận pháp |
| 4.6 | [x] Bí cảnh dạng chuỗi nhiều bước |
| 4.7 | [x] Bách nghệ cơ bản: Luyện đan + Luyện khí (các nghề khác để GĐ7) |
| 4.8 | [x] Bản đồ đại vực mở dần theo cảnh giới + ✍️ đại năng trấn giữ |
| 4.9 | [x] Thu đồ đệ (cơ bản) |
| 4.10 | [x] Áp lực thọ nguyên: chuỗi sự kiện sắp hết thọ, tìm thọ đan, đoạt xá, di ngôn |
| 4.11 | [x] Tàn hồn trong vật cũ: Kim Thủ Chỉ "lão gia gia" dẫn đường tới thiên địa kỳ vật, có thể đoạt xá (`mortal-path.md` mục 2.5) |
| 4.12 | [x] Quỷ tu: chết còn chấp niệm thì chơi tiếp bằng Quỷ đạo; móc mới `continueAfterDeath` (`mortal-path.md` mục 2.6) |

**Tiêu chí hoàn thành:** một đời tu tới Nguyên Anh có kết đan mini-game, ít nhất một lần tâm ma và một lần thiên kiếp; sắp hết thọ có lựa chọn liều mạng.

### GĐ 5 — Tông phái & truyền thừa
| # | Task |
|---|---|
| 5.1 | [x] Lập tông phái: điều kiện, đặt tên, đạo thống, tông quy |
| 5.2 | [x] Công trình + báo cáo tông môn hằng năm (1–3 quyết định, còn lại tự chạy) |
| 5.3 | [x] Sự kiện tông môn (khiêu khích, phản đồ, đại bỉ, ma đạo công sơn…) |
| 5.4 | [x] Gia tộc tu tiên: tộc phả, sản nghiệp, gia quy |
| 5.5 | [x] Khí vận chi tử làm đệ tử: ✍️ 3 mô bản đầu (Xuyên không, Phế vật nghịch tập, Trọng sinh giả) |
| 5.6 | [x] Vai trò Hộ đạo / Lợi dụng / Mặc kệ và hệ quả |
| 5.7 | [x] Chơi tiếp bằng con cháu hoặc đồ đệ khi chết |

**Tiêu chí hoàn thành:** lập được tông môn, nhận báo cáo năm; thu một khí vận chi tử và thấy chuỗi sự kiện riêng; chết rồi chơi tiếp bằng con.

### GĐ 5b — Luân hồi & giữ chân
| # | Task |
|---|---|
| 5b.1 | [x] Tổng kết đời đầy đủ + điểm Luân Hồi + ✍️ thiên phú luân hồi (Luân Hồi Đài) |
| 5b.2 | [x] Kim Thủ Chỉ (✍️ 6–8 loại, cấp thức tỉnh, rủi ro) + bảo hiểm pity |
| 5b.3 | [x] Khóa ô khí vận, mở rộng tới 5 ô; nâng khí vận lên ≥60 + ✍️ 10 tổ hợp ẩn |
| 5b.4 | [x] Thiên Thư (bộ sưu tập khí vận, tổ hợp, truyện khí vận chi tử) |
| 5b.5 | [x] Thành tựu, huy hiệu cuối đời, cáo phó dạng ảnh để chia sẻ |
| 5b.6 | [x] Thử thách tuần (seed chung theo tuần) |
| 5b.7 | [x] Gặp lại tông môn đời trước |
| 5b.8 | [x] Phúc báo đời phàm nhân sang đời sau; móc mới `rootReroll` (`mortal-path.md` mục 3.1) |
| 5b.9 | [x] Cầu đầu thai: tiêu điểm Luân Hồi chọn xuất thân đời sau (`mortal-path.md` mục 3.2) |
| 5b.10 | [x] Trùng sinh: Hồi Quang Kính, chết thì quay về năm 6 tuổi giữ ký ức; móc mới `rewindOnDeath` (`mortal-path.md` mục 3.3) |

### GĐ 5c — Tông môn sâu hơn (theo góp ý chủ dự án 2026-10-12)
Nhìn từ hai phía: **đệ tử** cần thăng cấp, tài nguyên, sư phụ chỉ dạy, bạn và đối thủ, công trạng đổi đồ; **tông chủ** muốn tông thịnh, đệ tử giỏi, kho đầy, danh tiếng. Mỗi task một PR nhỏ, nhánh từ main.
| # | Task |
|---|---|
| 5c.1 | [x] Đồng môn có tên (sư phụ, trưởng lão, chấp sự, sư huynh/tỷ, sư đệ/muội, kình địch) lưu theo từng đời; đi lại, luận đạo, tỉ thí nhẹ, hầu trà, hóa giải hiềm khích |
| 5c.2 | [x] Đại tỉ nội môn và Luận đạo hội (5 năm một lần, ba trận với đồng môn, thưởng theo số trận thắng) |
| 5c.3 | [x] Nhiệm vụ chuỗi nhiều bước (nhận ở bảng nhiệm vụ, nhớ tiến độ, thưởng cuối chuỗi) |
| 5c.4 | [x] Công trạng đổi đồ: Bảo khố tông môn, cống hiến đổi đan dược, công pháp, linh thạch |
| 5c.5 | [x] Sự kiện lớn của tông: đại hội, thí luyện, ngoại địch, nội loạn |
| 5c.6 | [x] Tranh ngôi chưởng môn, phe phái trong tông (hiệu ứng mới `succeedSect`) |
| 5c.7 | [ ] Phía tông chủ: tông môn mình lập có đệ tử NPC, trưởng lão, sự kiện lớn, thịnh suy, danh tiếng |
| 5c.9 | [x] Chiêu mộ người quen (NPC có quan hệ) vào tông của mình |

### GĐ 6 — Hoàn thiện
Cân bằng bằng **mô phỏng tự động** (chạy hàng nghìn đời giả lập, xem thống kê tuổi chết/cảnh giới), âm thanh, hiệu ứng, PWA cài lên điện thoại, chơi offline, tối ưu tốc độ, rà soát hiển thị trên nhiều cỡ màn hình.
| # | Task |
|---|---|
| 6.1 | [x] Mô phỏng tự động: người chơi máy sống trọn đời theo seed, chạy hàng loạt, báo tuổi chết, nguyên nhân chết, cảnh giới, linh căn (`npm run simulate`) |
| 6.2 | [x] Cân bằng theo kết quả mô phỏng (chỉnh `balance.json`, ghi lại trước/sau) |
| 6.3 | [x] PWA: cài lên điện thoại và chơi offline (manifest, service worker, biểu tượng) |
| 6.4 | [x] Âm thanh tổng hợp bằng code (không dùng file nhạc), bật/tắt được, mặc định tắt |
| 6.5 | [x] Hiệu ứng nhẹ (chuyển cảnh, nổi bật khi đột phá), tôn trọng chế độ giảm chuyển động |
| 6.6 | [x] Tối ưu tốc độ (cắt nhỏ gói tải, đo thời gian khởi động và tua năm) |
| 6.7 | [x] Rà soát hiển thị nhiều cỡ màn hình (điện thoại nhỏ, máy tính bảng, máy tính) |

### GĐ 6b — Sửa theo bản đánh giá chơi thử 12/10 (`danh-gia-2026-10-12.html`)
Mỗi vấn đề một task, theo mức nghiêm trọng trong bản đánh giá.
| # | Task |
|---|---|
| 6b.1 | [x] Sự kiện thử linh căn không lặp vô hạn: trốn tối đa 2 lần, lần thứ 3 tiên sư tự lôi ra thử (lỗi #1) |
| 6b.2 | [x] Người chơi máy kiểu "người chơi" cho `npm run simulate` (vào tông, nhiệm vụ, bái sư, bảo khố, đổi công pháp) + số đo hạnh phúc 0, đạo tâm 0, năm kẹt vì công pháp |
| 6b.3 | [x] Hạnh phúc không rơi về 0 cả đời: trôi về mức nghỉ mỗi năm, có lối ra, cảnh báo (lỗi #2) |
| 6b.4 | [x] Bức tường công pháp: Mục tiêu nói rõ cần công pháp nào và tìm ở đâu, kỳ ngộ bảo đảm khi kẹt lâu (lỗi #3) |
| 6b.5 | [x] Cân lại thể chất đặc biệt (quá phổ biến) và linh căn tốt kẹt lâu hơn linh căn kém |
| 6b.6 | [x] Sự kiện, hành động không hợp ngữ cảnh: bái nhập lúc 0 tuổi, học nghề khi đã vào tông, Trúc Cơ Đan khi đã Trúc Cơ (lỗi #4, #13, #15) |
| 6b.7 | [x] Giao chiến: cảnh giới đối thủ khớp lời văn, đại từ số nhiều (lỗi #5, #12) |
| 6b.8 | [x] Tha kẻ trộm rồi không bị hỏi giao nộp (lỗi #6) |
| 6b.9 | [x] Tư chất không trôi quá nhiều theo nhiệm vụ, sự kiện thường (lỗi #7) |
| 6b.10 | [x] Người không linh căn tu Phật: Mục tiêu và nhãn công pháp không mâu thuẫn (lỗi #8) |
| 6b.11 | [x] Đồng môn cùng lứa để theo đuổi trong tông (lỗi #9) |
| 6b.12 | [x] Giảm lặp nhật ký/sự kiện, công bố linh căn một lần, Dấu ấn một đời chọn câu đáng nhớ (lỗi #10, #11, #19) |
| 6b.13 | [x] Giao diện: ô tên, bấm đúp, nút Back, khối Mục tiêu, nhãn phiên bản (lỗi #14, #16, #17, #18, #20) |
| 6b.14 | [x] Chỗ tiêu linh thạch giữa đời |

### GĐ 7 — Mở rộng nội dung
Thêm **thế giới mới** với tuyến cốt truyện riêng (mục C.7) + màn chọn thế giới. Linh giới/Tiên giới, thêm hàng trăm sự kiện, các nghề bách nghệ còn lại (Trận pháp, Phù lục, Linh thực, Ngự thú), thêm mô bản khí vận chi tử, Capacitor nếu muốn lên store.

### GĐ 8 — AI tuỳ chọn (để sau, khi bản chơi được đã xong)
> Quyết định 2026-10-11: đi hướng **an toàn và rẻ trước**. Đến lúc đó nội dung vẫn là JSON soạn sẵn (Claude soạn nháp, bạn duyệt, validator kiểm tra).

Nguyên tắc: AI chỉ viết lời, **không quyết định cơ chế**; game luôn chơi trọn vẹn khi không có AI; **không đưa API key vào code** (người chơi tự nhập key nếu muốn).

Thứ tự theo rủi ro tăng dần, mỗi mục là một task riêng:
| # | Task |
|---|---|
| 8.1 | [ ] Tiểu sử cuối đời do AI viết (1 lần gọi mỗi đời), có văn bản dự phòng khi không có AI |
| 8.2 | [ ] Tô màu lời văn sự kiện soạn sẵn (bật/tắt được, mặc định tắt) |
| 8.3 | [ ] Trò chuyện với NPC (giới hạn lượt, chỉ ảnh hưởng nhẹ thiện cảm) |
| 8.4 | [ ] Kỳ ngộ do AI tạo theo khuôn JSON + validator |

Tuỳ chọn bất kỳ lúc nào: script trong `tools/` xuất nháp JSON theo chủ đề để soạn nội dung nhanh hơn (vẫn qua bước duyệt và kiểm trùng `id`).

---

## E. Danh sách tính năng theo mức ưu tiên

| Bắt buộc (MVP: GĐ 0–2) | Nên có (GĐ 3–5b) | Để sau (GĐ 6–7) |
|---|---|---|
| Tạo nhân vật, xuất thân | Túi đồ, đan dược, phường thị | Trận pháp, Phù lục, Linh thực, Ngự thú |
| Quay khí vận (~20, có reroll) | Chiến đấu lựa chọn | Đấu giá hội |
| Nút Qua một năm, nhật ký, tua nhanh | NPC số mệnh riêng, sổ ân oán | Thế giới "sống" (tông môn hưng suy, chiến tranh chính ma) |
| EventEngine + validator | Thiên kiêu bảng | Linh giới / Tiên giới |
| ~45 sự kiện | Tình duyên, đạo lữ, sinh con | Âm thanh, hiệu ứng nâng cao |
| Cha mẹ, anh chị em | Bế quan, kết đan mini-game, Nguyên Anh | PWA / Capacitor |
| Linh căn, tư chất đạo đồ | Tâm ma, thiên kiếp, bí cảnh | Mini-game đổ thạch, thoát trận |
| Luyện Khí → Trúc Cơ, phẩm đạo cơ | Đại vực + đại năng | Thử thách tuần |
| 6 tông môn, sư phụ | Thu đồ đệ, khí vận chi tử | Mô bản khí vận chi tử thứ 4 trở đi |
| Nghịch Thiên Cải Mệnh lần đầu | Lập tông phái, gia tộc | Cáo phó dạng ảnh |
| Lưu 3 slot, xuất/nhập file | Luân hồi, Kim Thủ Chỉ, Thiên Thư | |
| Glossary + tooltip, đời đầu hướng dẫn | Chơi tiếp bằng con cháu/đồ đệ | |
| Theme cổ phong sáng/tối, đủ tốt trên điện thoại và máy tính | Ảnh AI cho tình tiết đặc biệt | |

---

## F. Rủi ro & cách giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| **Phình phạm vi** (spec rất lớn) | Bám bảng mục E. Ý tưởng mới ghi vào mục "Để sau", không chen vào giai đoạn đang làm. Mỗi giai đoạn phải chơi được trước khi sang giai đoạn sau. |
| **Mất cân bằng** (tu quá nhanh/chậm, chết quá sớm) | Mọi con số nằm trong `balance.json`. Từ GĐ2 có script mô phỏng nhanh 1.000 đời để xem phân bố cảnh giới và tuổi chết trước khi bạn chơi. |
| **Code rối khi vibe coding** | TypeScript chặt, logic tách khỏi UI, mỗi hệ thống một file, test theo seed cho phần tính toán, `CLAUDE.md` ghi quy tắc để mọi phiên AI làm giống nhau. |
| **Lỗi dữ liệu JSON** (trùng id, sai tham chiếu) | `npm run validate` chạy tự động trước mỗi lần đưa lên GitHub Pages; lỗi thì không đưa lên. |
| **Save cũ hỏng khi cập nhật** | `saveVersion` + hàm `migrate`; luôn có nút xuất file save. |
| **Nội dung lặp, nhàm** | Sự kiện có cooldown, `oncePerLife`, chuỗi nhân quả; theo dõi tỉ lệ xuất hiện trong script mô phỏng. |
| **Thuật ngữ không thống nhất** | `glossary.json` là nguồn chuẩn; validator cảnh báo thuật ngữ lạ trong văn bản sự kiện. |
| **Giao diện tốt trên một thiết bị, vỡ trên thiết bị khác** | Thiết kế co giãn từ đầu (GĐ0.5); mỗi task giao diện đều kiểm tra ở khổ điện thoại và máy tính trước khi giao. |
| **localStorage đầy** | Nén nhật ký các năm bình thường, giữ năm quan trọng; cảnh báo khi gần đầy. |
| **Bản quyền** | Không dùng tên, hình, văn bản của BitLife, Quỷ Cốc Bát Hoang hay tiểu thuyết có bản quyền; mọi tên đều tự sáng tác. |
| **Nội dung nhạy cảm vượt mức** | Theo quy tắc mục H; mọi sự kiện có tag để lọc. |

---

## G. Công thức cân bằng ban đầu

> Tất cả nằm trong `content/config/balance.json`, chỉnh số là đổi được, không cần sửa code. Đây là điểm xuất phát, sẽ tinh chỉnh bằng mô phỏng ở GĐ2 và GĐ6.

### G.1 Tốc độ tu luyện
Tu vi tính theo **% thanh tiến độ của tầng hiện tại** (đầy 100% là đủ điều kiện lên tầng/đột phá).

```
tu vi mỗi năm (%) = tốc_độ_gốc[cảnh giới]
                  × hệ_số_linh_căn
                  × (0.75 + (căn_cốt + ngộ_tính) / 400)   → 0.75 đến 1.25
                  × linh_khí_vùng                  → 0.5 đến 2.0
                  × hệ_số_công_pháp                → ×0.7 nếu không hợp linh căn
                  × (1 + tổng_thưởng_khí_vận_thiên_phú)
```

| Cảnh giới | Tốc độ gốc (%/năm) | Số tầng | Số năm/tầng ở hệ số 1.0 | Tổng số năm ở hệ số 1.0 |
|---|---|---|---|---|
| Luyện Khí | 25 | 9 | 4 | ~36 |
| Trúc Cơ | 8 | 4 | 12.5 | ~50 |
| Kim Đan | 3 | 4 | 33 | ~133 |
| Nguyên Anh | 1.2 | 4 | 83 | ~333 |
| Hóa Thần | 0.5 | 4 | 200 | ~800 |
| Luyện Hư trở lên | 0.2 → 0.05 | 4 | để GĐ7 | |

| Linh căn | Tỉ lệ xuất hiện | Hệ số tu luyện |
|---|---|---|
| Không linh căn | 60% | 0 (phàm nhân) |
| Ngũ linh căn | 14% | 0.4 |
| Tứ linh căn | 10% | 0.55 |
| Tam linh căn | 8% | 0.7 |
| Song linh căn | 5% | 1.0 |
| Đơn linh căn (Thiên linh căn) | 2% | 1.6 |
| Biến dị linh căn | 0.9% | 1.8 |
| Thể chất đặc biệt | 0.1% | 2.0 + hiệu ứng riêng |

| Hệ số khác | Giá trị |
|---|---|
| Công pháp Hoàng / Huyền / Địa / Thiên | ×1.0 / ×1.2 / ×1.5 / ×2.0 |
| Bế quan | ×1.5 tốc độ, không có sự kiện thường |
| Song tu với đạo lữ (công pháp phù hợp) | ×1.3 |

*Ví dụ kiểm tra cảm giác* (căn cốt và ngộ tính cùng giá trị nên số không đổi): đơn linh căn, căn cốt và ngộ tính 70, linh khí 1.2, công pháp Huyền: 25 × 1.6 × 1.1 × 1.2 × 1.2 ≈ 63%/năm → Luyện Khí viên mãn sau ~14 năm (bái sư năm 12 tuổi → thử Trúc Cơ ~26 tuổi: thiên tài). Ngũ linh căn căn cốt và ngộ tính 40, linh khí 1.0, Hoàng phẩm: ≈ 9.5%/năm → ~95 năm, gần hết thọ 120 mới chạm Trúc Cơ (đúng chất "tạp linh căn khổ tu").

### G.2 Tỉ lệ đột phá
```
tỉ lệ (%) = gốc[mốc]
          + (ngộ_tính − 50) × 0.3
          + (đạo_tâm − 50) × 0.2
          + thưởng_đan_dược + thưởng_địa_điểm + thưởng_khí_vận
          − 5 × số_lần_thất_bại_trước_ở_mốc_này
          → kẹp trong [3%, 95%]
```

| Mốc | Gốc | Đan dược hỗ trợ (ví dụ) |
|---|---|---|
| Lên tầng trong Luyện Khí | 90% | Tụ Khí Đan +5 |
| Luyện Khí → Trúc Cơ | 30% | Trúc Cơ Đan +25 |
| Tiểu cảnh giới trong Trúc Cơ trở lên | 70% | +5 đến +10 |
| Trúc Cơ → Kim Đan | 20% | Kết Kim Đan +20 |
| Kim Đan → Nguyên Anh | 12% | +15 |
| Nguyên Anh → Hóa Thần | 8% | +10 |

**Bình cảnh:** ở mỗi đại cảnh giới viên mãn, nếu thất bại 2 lần thì tốc độ tu vi ×0.3 cho tới khi gặp sự kiện cơ duyên hoặc ngộ đạo.

**Hậu quả thất bại** (rút ngẫu nhiên, đại cảnh giới càng cao càng nặng):

| Kết quả | Tiểu cảnh giới | Đại cảnh giới |
|---|---|---|
| Chỉ mất tu vi (−30% thanh) | 70% | 40% |
| Tổn thương kinh mạch (Sức khỏe −20, tu vi ×0.5 trong 5 năm) | 25% | 35% |
| Giảm thọ (−5% thọ nguyên tối đa) | 5% | 15% |
| Tẩu hỏa nhập ma (sự kiện chuỗi) | 0% | 7% |
| Tử vong | 0% | 3% |

### G.3 Thọ nguyên
| Cảnh giới | Thọ nguyên gốc | Biến thiên ngẫu nhiên |
|---|---|---|
| Phàm Nhân | 70 | ±10 (Sức khỏe ảnh hưởng thêm ±10) |
| Luyện Khí | 120 | ±10 |
| Trúc Cơ | 200 (+20 nếu đạo cơ Hoàn mỹ) | ±15 |
| Kim Đan | 500 (+10 mỗi phẩm Kim Đan trên 5) | ±30 |
| Nguyên Anh | 1.000 | ±50 |
| Hóa Thần | 2.000 | ±100 |

- Còn ≤10% thọ nguyên: kích hoạt chuỗi sự kiện **"Đại hạn sắp tới"** (liều đột phá, thọ đan, đoạt xá, di ngôn).
- Phàm nhân trên 60 tuổi: mỗi năm có tỉ lệ bệnh `(tuổi − 60) × 0.8%`.

### G.4 Nhịp sự kiện
| Thông số | Giá trị ban đầu |
|---|---|
| Tỉ lệ một năm có popup lựa chọn | 20% (cảnh giới thấp; **tạm 50%** khi mới có ~20 sự kiện, hạ dần khi thêm nội dung) → 10% (Kim Đan trở lên, nhưng sự kiện lớn hơn) |
| Tỉ lệ một năm có dòng nhật ký thường (không cần chọn) | 60% |
| Ảnh hưởng của Khí vận lên sự kiện tốt | trọng số × (1 + (khí_vận − 50) / 100) |
| Sự kiện hiếm | trọng số ≤1, nhiều cái cần khí vận ≥70 |

### G.5 Tiên Thiên Khí Vận
Giữ tỉ lệ trong spec: Phàm 45% · Lương 28% · Ưu 15% · Tuyệt 8% · Thiên 3.5% · Thần 0.5%. Mỗi ô có 12% là ác vận thay vì khí vận thường. Reroll ban đầu: 3 lượt/đời. Kim Thủ Chỉ: 0.3% khi quay, pity sau 15 đời.

---

## H. Quy tắc nội dung nhạy cảm
- **Giết chóc, ma đạo, đoạt xá, diệt môn:** được phép; tả kết quả và cảm xúc, không tả chi tiết ghê rợn.
- **Lô đỉnh, song tu, quan hệ thân mật:** được nhắc tới và có hậu quả trong cốt truyện (lô đỉnh là hành vi ác, ảnh hưởng nhân quả và tâm ma); cảnh thân mật dừng ở mức gợi ý rồi chuyển cảnh, không miêu tả tình dục.
- **Không bao giờ:** nội dung tình dục liên quan trẻ vị thành niên (nhân vật dưới 18 tuổi không tham gia bất kỳ sự kiện tình duyên/song tu/lô đỉnh nào; engine chặn bằng điều kiện tuổi).
- Mỗi sự kiện có tag `violence` / `dark` / `mature`; phần Cài đặt có tùy chọn **ẩn nội dung nhạy cảm** cho ai muốn chơi nhẹ nhàng.

## I. Ảnh AI cho tình tiết đặc biệt
- Chỉ dùng cho khoảnh khắc lớn: quay trúng khí vận Thiên/Thần, kim thủ chỉ thức tỉnh, kết đạo lữ, thiên kiếp, phi thăng, tâm ma, đại năng xuất hiện. Dự kiến 20–30 ảnh cho tới GĐ5b.
- Claude không tự tạo ảnh được trong dự án này. Cách làm: Claude viết **prompt ảnh thống nhất phong cách** (tranh thủy mặc cổ phong) vào `content/image-prompts.md`; bạn tạo ảnh bằng công cụ AI bạn chọn và gửi lại, Claude nén ảnh và gắn vào sự kiện.
- Thiếu ảnh thì hiện khung mực mặc định, game vẫn chạy bình thường. Việc này bắt đầu từ GĐ3, không chặn các giai đoạn trước.

## J. Cách làm việc mỗi task
1. Bạn gửi prompt mẫu của task (hoặc chỉ cần nói "làm task tiếp theo").
2. Claude làm đúng một task, đẩy code lên repo, link GitHub Pages tự cập nhật.
3. Claude báo: đã làm gì, cách chơi thử, task đề xuất tiếp theo; đánh dấu `[x]` trong PLAN.md và ghi `CHANGELOG.md`.
4. Task ✍️: Claude gửi bản nháp nội dung dạng bảng dễ đọc để bạn duyệt/sửa, sau đó mới nhập vào JSON.
5. Báo lỗi: mô tả bước tái hiện, hoặc gửi file save xuất ra từ game.

---

## K. Khung hệ thống lõi (đã chốt 2026-10-11)

> Mọi khí vận, thiên phú, kim thủ chỉ, đan dược, pháp bảo chỉ tác động lên game qua **bộ móc hiệu ứng ở K.6**. Thêm móc mới là một task code riêng. Các con số là điểm xuất phát và nằm trong `balance.json`.
> Đã chốt: hai trục tu luyện (đạo thống × con đường chiến đấu), gộp 10 tư chất đạo thành 5 con đường + 6 bách nghệ, chiến đấu 3 hiệp có lựa chọn, công thức G.1 có căn cốt.

### K.1 Sơ đồ tổng thể

```
                 ┌──────────── TƯ CHẤT TIÊN THIÊN ────────────┐
                 │ Căn cốt · Ngộ tính · Khí vận · Đạo tâm      │
                 │ Linh căn (ngũ hành) · Tư chất đạo           │
                 └──────────────────────┬─────────────────────┘
                                        ▼
   CÔNG PHÁP CHÍNH ─────────►  TU LUYỆN (xương sống)  ◄───── LINH KHÍ NƠI Ở
   (đạo thống + hệ + phẩm)     tu vi → tầng → đột phá → cảnh giới
                                        │        ▲
                    ┌───────────────────┼────────┴──────────┐
                    ▼                   ▼                   │
              THỌ NGUYÊN          CHIẾN LỰC            TÀI NGUYÊN
             (áp lực thời gian)  (chiến đấu)        đan · pháp bảo · phù · trận
                                        │                   ▲
                                        ▼                   │
                     NHÂN QUẢ & QUAN HỆ ◄──────────► BÁCH NGHỆ · TÔNG MÔN · KHÁM PHÁ
                     (thiện/ác, ân oán, tâm ma)
```

Một câu: **tu vi là trục chính**; mọi hệ thống phụ hoặc *làm tu nhanh hơn*, hoặc *giúp đột phá*, hoặc *giúp sống sót* (chiến đấu, thọ nguyên), hoặc *tạo hậu quả* (nhân quả).

---

### K.2 Chỉ số

Chia 4 lớp để người chơi dễ hiểu và khí vận dễ móc vào.

| Lớp | Chỉ số | Thang | Thay đổi thế nào |
|---|---|---|---|
| **Phàm thân** | Sức khỏe `health`, Vui vẻ `happiness`, Trí tuệ `intellect`, Mị lực `charm` | 0–100 | Lên xuống theo sự kiện từng năm |
| **Tư chất** | Căn cốt `physique`, Ngộ tính `comprehension`, Khí vận `luck`, Đạo tâm `daoHeart` | 0–100 | Định lúc sinh (quay), chỉ đổi qua kỳ ngộ, khí vận, thiên phú. Đạo tâm thì lên xuống theo lựa chọn đạo đức. |
| **Tu vi** | Cảnh giới, tầng, tiến độ %, thọ nguyên | — | Theo G.1–G.3 |
| **Tính ra** | Chiến lực, Tốc, Thần thức | số | Không lưu, luôn tính từ các lớp trên + trang bị |
| **Xã hội** | Danh vọng theo phe (Chính/Ma/Tán tu/Yêu), Nhân quả (−100 ác … +100 thiện) | | Theo hành động |

Vai trò của mỗi tư chất (để khí vận nào cũng có chỗ bám):
- **Căn cốt**: tốc độ hấp thu linh khí (thay cho một phần ngộ tính trong G.1), chiến lực thể chất, sức chịu thương, bệnh tật.
- **Ngộ tính**: tốc độ tu, tỉ lệ đột phá, học công pháp/bách nghệ.
- **Khí vận**: trọng số sự kiện tốt, rơi đồ, thoát chết.
- **Đạo tâm**: chống tâm ma, đột phá đại cảnh giới, chống mê hoặc.

Công thức G.1 dùng `(0.75 + (căn_cốt + ngộ_tính)/400)` để căn cốt cũng có tác dụng ✅ (đã sửa ở G.1).

---

### K.3 Tu luyện: hai trục "đạo thống" và "con đường"

Spec đang gộp nhiều thứ khác loại vào "con đường tu luyện" (Kiếm, Thể, Đan, Ma, Phật, Quỷ). Mình đề xuất tách làm **hai trục độc lập**, nhân chéo ra nhiều build:

#### K.3.1 Đạo thống (nguồn sức mạnh, do công pháp chính quyết định)
| Đạo thống | Mạnh | Yếu / cái giá |
|---|---|---|
| **Tiên đạo** (chính thống) | Cân bằng, đột phá ổn định | Không có gì nổi trội |
| **Ma đạo** | Tu vi ×1.4, chiến đấu hút máu | Tâm ma tăng, nhân quả xấu, chính đạo truy sát |
| **Phật đạo** | Đạo tâm +, kháng tâm ma, hộ thể | Tu vi ×0.8, kiêng sát sinh (giết người giảm đạo tâm) |
| **Quỷ đạo** | Thọ nguyên dài, đánh thần thức | Sức khỏe giảm dần, NPC sợ hãi (Mị lực −) |
| **Yêu đạo** (về sau, cho yêu tộc/ngự thú) | Căn cốt + | để GĐ7 |

#### K.3.2 Con đường chiến đấu (cách đánh, do tư chất đạo + thần thông quyết định)
| Con đường | Kiểu đánh |
|---|---|
| **Kiếm** | Sát thương cao, thắng nhanh, khó thủ |
| **Thể** (luyện thể, quyền) | Chịu đòn tốt, khó chết, không cần pháp bảo |
| **Pháp** (ngũ hành thuật) | Hưởng tương khắc ngũ hành mạnh nhất |
| **Binh** (đao, thương…) | Cân bằng, hợp pháp bảo |
| **Thuật** (phù, trận, độc, ngự thú) | Dựa vào đồ chuẩn bị trước; yếu khi tay không |

Ví dụ build: *Ma đạo + Kiếm* = ma kiếm tu tốc chiến hút máu; *Phật đạo + Thể* = kim cương bất hoại; *Tiên đạo + Thuật* = trận sư cẩu đạo.

✅ 10 "tư chất đạo" trong spec (Kiếm, Đao, Thương, Quyền, Chỉ, Phù, Đan, Khí, Trận, Thú) được gộp thành **5 con đường chiến đấu ở trên + 6 bách nghệ ở K.5**.

#### K.3.3 Ngũ hành
- Linh căn có hệ (Kim Mộc Thủy Hỏa Thổ, biến dị Lôi Băng Phong Ám). Công pháp có hệ.
- Công pháp không hợp linh căn: tu vi ×0.7 (đã có trong G.1).
- Chiến đấu: hệ khắc hệ được +20% chiến lực; con đường Pháp được +35%.

#### K.3.4 Đột phá đại cảnh giới (giữ spec 4.9.3–4.9.4)
Mỗi đại cảnh giới cho ra **một "phẩm" kết quả** (đạo cơ, Kim Đan 1–9 phẩm, hình thái Nguyên Anh) + chọn **1 trong 3 thiên phú Nghịch Thiên Cải Mệnh**. Thiên phú dùng chung bộ móc ở K.6, chỉ mạnh hơn khí vận.

---

### K.4 Chiến đấu

#### K.4.1 Chiến lực (một con số cho dễ so)
```
Chiến lực = nền[cảnh giới] × (1 + 0.1 × tầng)
          × (0.8 + căn_cốt/250)                 → 0.8 đến 1.2
          × hệ_số_công_pháp × hệ_số_đạo_thống
          × (1 + thưởng pháp bảo + thần thông + khí vận/thiên phú)
```
| Cảnh giới | Nền |
|---|---|
| Phàm nhân (võ phu tới cao thủ võ lâm) | 1 → 3 |
| Luyện Khí | 10 |
| Trúc Cơ | 40 |
| Kim Đan | 160 |
| Nguyên Anh | 640 |
| Hóa Thần | 2.560 |

Mỗi đại cảnh giới ×4: **chênh một đại cảnh giới gần như thua chắc**, chỉ khí vận/thiên phú "vượt cấp" mới lật được. Đúng chất truyện.

Hai chỉ số phụ:
- **Tốc** = nền nhỏ theo cảnh giới + con đường + pháp bảo phi hành → quyết định bỏ chạy và ra tay trước.
- **Thần thức** = theo cảnh giới + đạo tâm → phát hiện mai phục, chống ảo thuật, dò xét đồ vật.

#### K.4.2 Một trận đánh
- Tối đa **3 hiệp**, ai thắng 2 hiệp là thắng. Mỗi hiệp người chơi chọn 1 trong 5 hành động:

| Hành động | Tác dụng |
|---|---|
| **Toàn lực** | Tỉ lệ thắng hiệp +, nhưng thua hiệp thì bị thương nặng hơn |
| **Pháp bảo / Phù** | Tốn vật phẩm, tăng mạnh tỉ lệ hiệp này |
| **Thủ** | Tỉ lệ thắng −, nhưng thua cũng nhẹ; kéo dài để chờ chạy |
| **Bỏ chạy** | So Tốc hai bên; thành công là kết thúc trận |
| **Cầu xin / Đàm phán** | So Mị lực, danh vọng, tính cách đối thủ; ma tu thường không tha |

- Tỉ lệ thắng một hiệp: `p = A^k / (A^k + B^k)`, `A, B` là chiến lực, `k = 1.5`. Ví dụ chênh 1 đại cảnh giới (×4): p ≈ 89% cho bên mạnh.
- **Thắng**: chọn tha / cướp đồ / giết / bắt về → nhân quả và sổ ân oán.
- **Thua**: hậu quả theo **ý đồ của đối phương** (dạy dỗ, cướp, giết): bị thương, mất đồ, giảm tu vi, hoặc chết. Có lượt "thoát chết" theo khí vận.
- Văn bản mô tả lấy từ mẫu theo con đường + hệ, nên kiếm tu và thể tu đánh ra chữ khác nhau.

✅ Dùng bản 3 hiệp có lựa chọn.

---

### K.5 Hệ thống phụ và chỗ nó nối vào xương sống

| Hệ thống | Nối vào | Ghi chú |
|---|---|---|
| **Bách nghệ**: Đan, Khí (luyện pháp bảo), Trận, Phù, Linh thực, Ngự thú | Đan → tu vi, đột phá, thọ nguyên. Khí → chiến lực. Trận → đột phá, phòng động phủ. Phù → vật phẩm chiến đấu. Linh thực → nguyên liệu đan. Ngự thú → thêm một đồng đội cộng chiến lực. | Mỗi nghệ có cấp 0–100, tăng khi làm; tỉ lệ thành công theo cấp + ngộ tính + tư chất |
| **Công pháp & thần thông** | Công pháp chính: tốc tu, đạo thống, hệ. Thần thông (tối đa 3 ô): cộng chiến lực theo con đường | Phẩm Hoàng/Huyền/Địa/Thiên (G.1) |
| **Tông môn** | Cho công pháp, tài nguyên, nhiệm vụ, sư phụ; đổi lại tự do và nghĩa vụ | Cấp bậc ngoại môn → chưởng môn |
| **Khám phá & bí cảnh** | Nguồn kỳ ngộ, nguyên liệu, công pháp; rủi ro chiến đấu | Vùng có linh khí và độ nguy hiểm |
| **Quan hệ & nhân quả** | Đồng minh giúp đánh/đột phá, kẻ thù báo thù; nhân quả xấu → tâm ma | Sổ ân oán theo spec |
| **Tâm ma** | Chặn đột phá đại cảnh giới, kích hoạt khi đạo tâm thấp | Ảo cảnh dựa trên việc đã làm |
| **Thọ nguyên** | Áp lực thời gian xuyên suốt; hết thì chết | G.3 |

---

### K.6 Bộ móc hiệu ứng (nền cho khí vận, thiên phú, đồ vật)

Mọi khí vận/thiên phú chỉ được viết bằng các móc dưới đây. Thêm móc mới = một task code riêng, không lén thêm trong nội dung.

| Nhóm | Móc | Ví dụ giá trị |
|---|---|---|
| Chỉ số | `stat.<tên>` cộng thẳng (health, charm, physique, comprehension, luck, daoHeart…) | `+10` |
| Tu luyện | `cultivationSpeed`, `breakthroughChance`, `breakthroughChance.major`, `bottleneckResist` | `+0.15`, `+10` |
| Thọ nguyên | `lifespanPct`, `agingSlow` | `+0.25` |
| Chiến đấu | `combatPower`, `combatPower.vsHigherRealm` (vượt cấp), `speed`, `divineSense`, `escapeChance`, `injuryReduce`, `lifesteal` | `+0.2` |
| Ngũ hành / con đường | `element.<hệ>.power`, `path.<con đường>.affinity`, `path.<con đường>.power` | `+20` |
| Bách nghệ | `craft.<nghệ>.success`, `craft.<nghệ>.yield`, `craft.<nghệ>.affinity` | `+0.15` |
| Tâm cảnh | `heartDemonResist`, `charmResist` | `+0.2` |
| Sự kiện | `eventWeight.<tag>` (nhân trọng số sự kiện có tag), `unlockChain.<id>` | `×2` |
| Xã hội | `npcAffinityStart`, `faction.<phe>.reputation`, `karmaShift` | `+10` |
| Kinh tế | `priceDiscount`, `incomePct`, `lootPct` | `+0.1` |
| Kích hoạt đặc biệt | `trigger.cheatDeath` (số lần), `trigger.everyNYears` (sự kiện đảm bảo), `counter` (đếm dấu rồi thưởng) | |
| *Đã duyệt, thêm ở task sau* | `lineage.<đạo thống>.cultivationSpeed` (2.3), `rootReroll` (5b.8), `continueAfterDeath` (4.12), `rewindOnDeath` (5b.10) | `+0.2`, `1` |

Quy tắc an toàn:
- Móc có điều kiện tuổi/cảnh giới được (`activeFrom: { age: 18 }`), dùng cho khí vận tình duyên theo mục H. Điều kiện ngược `activeUntil: { realm }` (hết tác dụng khi lên cảnh giới đó) thêm ở task 2.3.
- Id dùng trong code giữ theo K: con đường Thuật là `arts` (tài liệu thiết kế viết `arcane`), Linh Thực là `farming` (tài liệu viết `herbalism`).
- Mọi hiệu ứng `%` cộng dồn có **trần** trong `balance.json` (ví dụ tốc tu từ khí vận + thiên phú tối đa +150%) để không vỡ game.

---
