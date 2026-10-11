# Đường phàm nhân — ĐÃ DUYỆT 2026-10-11 (kể cả đề xuất xếp vào PLAN)

Vấn đề: 60% nhân vật quay ra **Không linh căn**. Đời đó không được là "đời bỏ đi". Thiết kế gồm 3 phần:
1. **Phàm nhân lộ**: đời phàm nhân có cốt truyện và mục tiêu riêng, chơi trọn vẫn vui.
2. **Cửa vào tiên lộ muộn**: nhiều cách hiếm để phàm nhân bước vào tu tiên, mỗi cách có giá.
3. **Chuyển sinh và trùng sinh**: đời phàm nhân làm tốt thì đời sau (hoặc chính đời này làm lại) có tiên lộ rộng mở hơn.

Mọi hiệu ứng dùng móc K.6; tỉ lệ nằm trong `balance.json`. Nội dung sự kiện cụ thể sẽ soạn ở các task ✍️ sau.


---

## 1. Phàm nhân lộ: bốn con đường đời

Từ 14–16 tuổi, phàm nhân có thể theo một **con đường đời** (nối với nghề đã có trong sự kiện phàm nhân). Mỗi đường có **bậc thang** 5 nấc; lên nấc qua sự kiện + kiểm tra chỉ số.

| Con đường | Bậc thang | Chỉ số chính | Nối với flag có sẵn |
|---|---|---|---|
| **Quan lộ** | Tú tài → Cử nhân → Tiến sĩ → Tri phủ → Tể tướng | Trí tuệ, Mị lực | `tu_tai` |
| **Thương lộ** | Gánh hàng rong → Chủ tiệm → Phú hộ → Đại thương gia → Hoàng thương | Mị lực, Khí vận | `nghe_quan`, buôn chuyến đầu |
| **Võ lâm** | Võ sinh → Võ sư → Cao thủ → Tông sư → Võ lâm minh chủ | Căn cốt, Sức khỏe | xuất thân Con nhà võ, `nghe_ren` |
| **Y lộ** | Học việc → Lang y → Danh y → Ngự y → Thần y | Trí tuệ, Ngộ tính | `nghe_thuoc` |

- Mỗi bậc cho thu nhập, danh vọng, và mở sự kiện riêng (án oan trong quan trường, thương chiến, đại hội võ lâm, dịch bệnh…).
- Chuyện đời thường vẫn chạy song song: thành gia, con cái, cha mẹ già (task 1.7), bạn bè, kẻ thù.
- Phàm nhân vẫn thấy bóng dáng tu tiên: tiên nhân bay ngang trời, tông môn xuống núi tuyển người, đạo sĩ dạo mua gà (`ban_ga_cho_dao_si`). Thế giới tu tiên là cái phàm nhân **ngước nhìn**.
- **Kết cục phàm nhân** có danh hiệu riêng ở màn tổng kết: "Trạng nguyên khai khoa", "Phú giáp một phương", "Thiên hạ đệ nhất võ phu", "Thần y cứu thế", "Bình an trăm tuổi".

## 2. Cửa vào tiên lộ muộn

**Nguyên tắc (đã chốt):** linh căn do trời sinh. Không ai, không nghi lễ nào khai mạch được cho người không linh căn; chỉ **thiên địa kỳ vật** (kỳ ngộ cực lớn) mới tạo được linh căn. Các cửa khác là **đường tu không cần linh căn**, hoặc là **con đường dẫn tới kỳ ngộ đó**, chứ không tự tạo linh căn.

Sáu cửa, mỗi cửa một kiểu truyện quen thuộc. Phần lớn rất hiếm và đều có cái giá.

| # | Cửa | Điều kiện / cách gặp | Kết quả | Cái giá |
|---|---|---|---|---|
| 2.1 | **Thiên địa kỳ vật** (cửa duy nhất tạo linh căn) | Cực hiếm (khí vận ≥ 70): linh quả nghìn năm, nước tủy trong lòng linh mạch, tinh hoa thiên lôi đánh trúng người mà không chết… | Tạo **Ngũ linh căn** (hiếm hơn: Tứ) | Tẩy tủy đau đớn: Sức khỏe −30; quá 30 tuổi thì tỉ lệ sống sót giảm |
| 2.2 | **Võ đạo nhập tiên** | Đường Võ lâm, khổ luyện tới **Hóa cảnh** (nỗ lực + căn cốt), rồi cần kỳ ngộ cho 2 cảnh giới sau (mục 2b) | Đạt **Ngũ khí triều nguyên** thì được tính như **Ngũ linh căn**, bước vào Luyện Khí | Rất lâu, nhiều cửa ải cần kỳ ngộ; phần lớn võ giả dừng ở Tuyệt đỉnh |
| 2.3 | **Tạp dịch tông môn** | Xin vào tông môn làm tạp dịch (gánh nước, quét sân, trông linh điền) | **Không có linh căn**, nhưng ở gần tiên duyên: học Linh Thực, Luyện Đan cấp phàm; nghe lỏm đạo lý (Ngộ tính +); cơ hội gặp cửa 2.1 và 2.5 ×3 | Thanh xuân trôi qua; bị đệ tử chính thức coi thường, sai vặt |
| 2.4 | **Phật duyên** | Đạo tâm ≥ 70, gặp cao tăng hoặc tự tu ở chùa | Vào **Phật đạo**: tu bằng đạo tâm thay cho linh căn (hệ số theo đạo tâm, tối đa 0.7) | Kiêng sát sinh, tình duyên; tu chậm |
| 2.5 | **Tàn hồn trong vật cũ** | Mua phải đồ cổ ở chợ, nhặt nhẫn dưới sông… (cực hiếm) | **Kim Thủ Chỉ** "lão gia gia": biết nơi cất giấu một **thiên địa kỳ vật** và dẫn đường tới đó (mở chuỗi sự kiện tới cửa 2.1) | Tàn hồn có mục đích riêng; có thể đoạt xá ngươi về sau |
| 2.6 | **Chấp niệm thành quỷ tu** | Lúc chết còn chấp niệm lớn (bị hại oan, hận chưa báo) + khí vận | **Chơi tiếp sau khi chết** bằng **Quỷ đạo**: thân xác mất, hồn tu tiếp | Sức khỏe không hồi; người sống sợ hãi; ánh mặt trời gây hại |

Gợi ý tỉ lệ: một đời phàm nhân bình thường có khoảng **15–25%** cơ hội chạm được ít nhất một cửa; cửa nào cũng là chuỗi sự kiện nhiều bước, có lựa chọn từ chối.

## 2b. Cảnh giới võ đạo (cho cửa 2.2)

Phàm nhân luyện võ có thang cảnh giới riêng. Đây là **sức mạnh**, khác với bậc thang danh vọng của đường Võ lâm ở mục 1 (một Tuyệt đỉnh cao thủ có thể chỉ là kẻ vô danh ẩn cư). Tên cảnh giới là thuật ngữ võ hiệp và đạo gia dùng chung. Mình chỉ mượn cơ chế "võ đạo đi tới tận cùng thì chạm cửa tiên", không lấy văn bản hay nhân vật của bộ truyện bạn tham khảo.

| # | Cảnh giới | Đột phá | Chiến lực nền | Thọ nguyên | Mô tả trong game |
|---|---|---|---|---|---|
| V1 | **Tam lưu** | Luyện võ đủ năm (Căn cốt) | 1 | — | Đánh ba tên côn đồ không thở dốc. |
| V2 | **Nhị lưu** | Luyện võ + kiểm tra Căn cốt | 1.5 | — | Được tiêu cục mời áp tiêu, trả lương hậu. |
| V3 | **Nhất lưu** | Kiểm tra Căn cốt + Ngộ tính; cần bí kíp hoặc sư phụ | 2 | +5 | Một mình giữ một võ quán, cả huyện kiêng nể. |
| V4 | **Tuyệt đỉnh** | Kiểm tra khó; nhiều năm khổ luyện | 3 | +10 | Đỉnh của người thường. Phần lớn võ giả dừng chân ở đây cả đời. |
| V5 | **Hóa cảnh** | **Nỗ lực + căn cơ**: Tuyệt đỉnh viên mãn (đủ năm khổ luyện) và Căn cốt ≥ 70; kiểm tra Căn cốt + Ngộ tính. Không cần kỳ ngộ | 5 | +30 | **Thoát thai hoán cốt.** Một trong những người mạnh nhất phàm gian; tu sĩ Luyện Khí sơ kỳ cũng phải dè chừng. |
| V6 | **Tam hoa tụ đỉnh** | Tinh, khí, thần tụ trên đỉnh đầu; cần Đạo tâm cao + kỳ ngộ | 7 | +20 | Khí tức nội liễm, nhìn như người thường, ra tay như sét đánh. |
| V7 | **Ngũ khí triều nguyên** | Ngũ tạng hợp với ngũ hành; cửa ải cuối, cần kỳ ngộ | 9 | +20 | Ngũ khí trong người hóa thành **Ngũ linh căn**. Từ đây bước vào Luyện Khí tầng 1, tiếp tục như tu sĩ. |

Ghi chú cân bằng:
- Chiến lực Hóa cảnh (5) bằng một nửa Luyện Khí tầng 1 (~11): mạnh nhất phàm gian nhưng vẫn kém tiên nhân, đúng tinh thần "phàm nhân ngước nhìn".
- Khi vào Luyện Khí qua đường này, người chơi **giữ lợi thế thân thể**: tư chất con đường **Thể** +30, `injuryReduce +0.15`. Bù cho Ngũ linh căn tu chậm.
- **Hóa cảnh** là phần thưởng cho người chơi kiên trì theo võ đạo và có căn cốt tốt; **Tam hoa tụ đỉnh** và **Ngũ khí triều nguyên** mới cần kỳ ngộ.
- Tỉ lệ đột phá đặt trong `balance.json`; gợi ý: võ giả căn cốt cao, chuyên tâm luyện võ có khoảng 40% chạm Hóa cảnh cả đời; khoảng 5% đi tới Ngũ khí triều nguyên.
- Tuổi càng cao càng khó: quá 50 tuổi tỉ lệ đột phá giảm một nửa.

## 3. Chuyển sinh và trùng sinh

### 3.1 Phúc báo (đầu thai đời sau tốt hơn)
Đời phàm nhân sống tốt tích **Phúc báo**, mang sang đời sau qua Luân Hồi (GĐ 5b):

| Thành tựu đời phàm nhân | Phúc báo đời sau |
|---|---|
| Nhân quả ≥ +60 lúc chết (đại thiện nhân) | Quay linh căn 2 lần lấy kết quả tốt hơn |
| Lên nấc 5 của một con đường đời | +5 cho chỉ số chính của đường đó |
| Sống tới 100 tuổi | Thọ nguyên đời sau +10% |
| Có con cháu đầy đàn (≥ 5) | Có thể chọn **chơi tiếp bằng con cháu** (con có thể có linh căn, đột biến di truyền) |
| Chết vì cứu người | Một lần quay thêm khí vận |

### 3.2 Cầu đầu thai
Cuối đời, phàm nhân có thể **thắp hương ở miếu Thành Hoàng / cầu trước Luân Hồi đài**: tiêu điểm Luân Hồi để **chọn xuất thân** đời sau (ví dụ Hậu duệ gia tộc tu tiên), thay vì quay ngẫu nhiên.

### 3.3 Trùng sinh (làm lại chính đời này)
Kiểu truyện "trọng sinh về năm mười tuổi":
- Cực hiếm: vật phẩm **Hồi Quang Kính** (kỳ ngộ) hoặc thiên phú luân hồi đắt tiền.
- Khi chết: quay về **năm 6 tuổi**, giữ **ký ức kiếp trước** (flag `ky_uc_kiep_truoc` → mở lựa chọn ẩn "Ta biết chuyện này sẽ xảy ra"), **linh căn giữ nguyên** (vẫn là thân xác cũ). Lợi thế nằm ở ký ức: biết trước thiên địa kỳ vật nằm đâu, kẻ nào sẽ hại mình.
- Giới hạn: một lần mỗi đời; thế giới có thể thay đổi nhẹ ("con bướm vỗ cánh"), nên ký ức không phải lúc nào cũng đúng.

---

## Đề xuất đưa vào PLAN (thread làm PLAN quyết định vị trí)
- GĐ 2: thêm task **"Đời không linh căn"**: 4 con đường đời (bậc thang + thu nhập) + cửa 2.1, 2.3.
- GĐ 3: cửa 2.2 (Võ đạo nhập tiên, gồm 7 cảnh giới võ đạo ở 2b), 2.4 (Phật duyên) + ✍️ sự kiện "ma tu hứa khai mạch" (lừa đảo: thực ra muốn bắt làm vật tế, người chơi phải nhận ra hoặc trốn thoát) + sự kiện con đường đời.
- GĐ 4: cửa 2.5 (cùng hệ Kim Thủ Chỉ), 2.6 (Quỷ tu sau khi chết).
- GĐ 5b: Phúc báo, Cầu đầu thai, Trùng sinh (cùng hệ Luân Hồi).
- Móc mới cần cho engine: `rootReroll` (chỉ dùng cho Phúc báo đời sau), `continueAfterDeath` (quỷ tu), `rewindOnDeath` (trùng sinh).
