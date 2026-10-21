# Bảng tra văn hóa (9.10)

Nguồn tra cứu khi viết nội dung cho thế giới Thương Lan và các thế giới cổ phong khác. Bảng thuật ngữ theo tầng có bản máy đọc được ở `content/worlds/<id>/tier-terms.json`; validator **cảnh báo** (không chặn) khi sự kiện của tầng dưới dùng từ của tầng trên.

## 1. Khoa cử (một hệ duy nhất)

| Bậc | Thi gì | Đỗ thì gọi |
|---|---|---|
| 1 | Thi huyện, thi phủ | **Đồng sinh** |
| 2 | Thi viện (do học chính chủ trì) | **Tú tài** |
| 3 | Thi hương (ở tỉnh, ba năm một lần) | **Cử nhân** |
| 4 | Thi hội (ở kinh thành) | **Cống sĩ** |
| 5 | Thi Đình (vua ra đề) | **Tiến sĩ** |

- Ba người đầu thi Đình: **Trạng nguyên**, **Bảng nhãn**, **Thám hoa**.
- Không trộn tên của hệ khác (không dùng "Hương cống", "Sinh đồ", "Giải nguyên" như một bậc riêng).
- Đỗ Cử nhân trở lên mới được bổ làm quan; Tú tài được miễn lao dịch, dạy học, làm thầy đồ.

## 2. Xưng hô theo vai vế

| Hoàn cảnh | Tự xưng | Gọi người |
|---|---|---|
| Ngang hàng, lịch sự | tại hạ | các hạ, huynh đài |
| Kẻ dưới nói với bậc trên (tuổi, tu vi) | vãn bối | tiền bối |
| Đạo sĩ, tu sĩ đạo môn | bần đạo | đạo trưởng, chân nhân |
| Tăng nhân | bần tăng, lão nạp (đã già) | đại sư, thiền sư |
| Vua | **trẫm** (chỉ vua dùng) | bệ hạ, hoàng thượng |
| Quan với dân | bản quan | (dân gọi) đại nhân, quan lớn |
| Dân với quan | tiểu nhân, thảo dân | đại nhân |
| Hỏi thăm con nhà người | — | lệnh lang (con trai), lệnh ái (con gái), lệnh tôn (cha), lệnh đường (mẹ) |
| Nói về nhà mình khiêm tốn | — | khuyển tử (con trai), tiểu nữ (con gái), gia phụ, gia mẫu |
| Tu sĩ ngang hàng | ta, tại hạ | đạo hữu |
| Ma tu, kẻ ngạo mạn | bổn tọa, lão phu | tiểu tử, nhãi ranh |

**Quy ước thầy trò:** võ giả phàm gian gọi thầy là **"sư phụ"**; đệ tử tu tiên gọi là **"sư tôn"** (kể cả khi nói thân mật). Thợ nghề phàm (thợ rèn, đầu bếp) cũng là "sư phụ". Đã sửa các sự kiện tu tiên còn dùng "sư phụ" sang "sư tôn" (9.10).

## 3. Thuật ngữ theo tầng

| Ý | Phàm gian (võ, dân thường) | Tu chân | Tầng cao (Hóa Thần trở lên) |
|---|---|---|---|
| Sức trong người | sức lực, **nội lực** | **chân khí**, linh lực | chân nguyên, tiên nguyên |
| Sách dạy | **bí kíp**, võ công | **công pháp** | đạo kinh, truyền thừa |
| Vũ khí quý | **thần binh**, bảo kiếm | **pháp bảo**, phi kiếm | linh bảo, tiên khí |
| Thuốc | **thuốc**, cao đơn hoàn tán, sâm núi | linh dược, **đan dược** | tiên đan |
| Tiền | bạc, vàng, quan tiền | **linh thạch** | thượng phẩm linh thạch, tiên tinh |
| Cảm nhận | tai mắt, linh tính | **thần thức** | thần niệm |
| Người tu | tiên nhân, tiên sư (nghe đồn) | tu sĩ, đạo hữu | lão tổ, đại năng |

Phàm nhân không biết tên cảnh giới (Luyện Khí, Trúc Cơ…): chỉ gọi là "tiên nhân", "lão tổ". Khi một tu sĩ nói chuyện với phàm nhân bằng từ của mình, hoặc phàm nhân thức tỉnh cảm được linh khí, sự kiện đặt `"crossTier": true` để validator không cảnh báo.

## 4. Điểm nhạy cảm

- Không miêu tả trần trụi bạo lực, tình dục; nhân vật dưới 18 tuổi không vào tình duyên, song tu (PLAN.md mục H).
- Không dùng tên triều đại, niên hiệu, nhân vật có thật làm nhân vật trong game; triều đại và niên hiệu của Thương Lan tự đặt (`world-state.json`).
- Tôn giáo: Phật, Đạo là đạo thống trong game, viết trân trọng; tăng nhân phá giới chỉ là nhân vật, không chế giễu giáo lý.
- Không dùng từ ngữ miệt thị dân tộc, vùng miền, người khuyết tật.

## 5. Cách validator kiểm (tier-terms.json)

- `tiers[]`: mỗi tầng có danh sách `words` (từ của tầng trên, kèm từ nên dùng). Sự kiện thuộc tầng khi `conditions.tier` chỉ có tầng đó, hoặc (với tầng đầu) `maxTier` là nó hay `realm.max` là `pham_nhan`, hoặc `category` nằm trong `categories`.
- `selfWords[]`: từ tự xưng chỉ một số người dùng được (trẫm). Cảnh báo khi một lựa chọn của người chơi dùng nó mà sự kiện không yêu cầu flag trong `allowFlags`.
- Lần chạy đầu (445 sự kiện): 6 cảnh báo; sửa 2 chỗ sai rõ ("chân khí võ đạo" thành "nội lực võ đạo", "tu sĩ Trúc Cơ" kể với phàm nhân thành "vị tiên nhân"), 4 sự kiện còn lại là tu sĩ gặp phàm nhân có chủ ý, đã đặt `crossTier`.
