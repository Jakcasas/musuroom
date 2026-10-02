# Musuroom 1 — bản mã nguồn 1.7.0

Ngày cập nhật: **02.10.2026**.

## Bản 1.7.0

- Chọn cụ thể 1–5 bài để phân loại theo lô; giới hạn lựa chọn và đặt lại đồng ý khi thay đổi bài.
- API xem trước lô dùng cùng request builder với inference, ngân sách JSON UTF-8 18.000 bytes; rút gọn theo Unicode code points, không tách surrogate. Nội dung bị guard không được gửi.
- Hàng đề xuất có bộ lọc trạng thái/stale, chi tiết lý do/confidence, phân trang trước/sau và xuất JSON theo bộ lọc. SQL dùng danh sách filter cố định.
- Hủy chờ sắp xếp khi bỏ đồng ý, ngăn phản hồi đến muộn đổi thứ tự nguồn. Khóa thao tác đang xử lý và loại phản hồi của phiên đã đổi.
- **59/59 tests** đạt; kiểm tra giao diện chọn bài, preview, đối chiếu/lọc và hủy sắp xếp trong fixture riêng. Thành công provider là mock, chưa xác thực inference JevAI thật.
- Không thay đổi schema hoặc migration Supabase; giữ thông tin đăng nhập ngoài Git.

## Bản 1.6.0

- Thêm 4 luồng phù hợp với hình tham khảo: Guardrails, Reranking, Bulk labeling và Confidence gate. [Hướng dẫn đầy đủ](JEV_WORKFLOWS.md).
- Lô tối đa 5 bài dùng nhiều câu hỏi trong một yêu cầu quyết định. Guarded records không gửi; phản hồi lỗi xử lý độc lập theo từng bài.
- Kho tri thức có thao tác sắp xếp cùng Jev với đồng ý rõ ràng; kiểm tra Score và giữ nguồn/ID của bài. Phản hồi thấp ngưỡng hoặc sai schema giữ baseline.
- Khóa các ô tìm kiếm trong lúc tải kho ban đầu, tránh mất từ khóa được nhập trước khi giao diện sẵn sàng.
- Bảng đề xuất riêng có source revision/hash, version quyết định và trạng thái đối chiếu; ADMIN/CSRF/audit và chống xác nhận đề xuất đã cũ. RLS và quyền browser bị chặn.
- Tích hợp thêm MCP chính thức của JevAI; không gửi key đến provider khác. Hai lời gọi đồng thời dùng chung giới hạn trong tiến trình.
- **57/57 tests** đạt trên máy, gồm lỗi từng bài trong lô, consent, low-confidence, invalid probabilities, stale review, quyền/CSRF và replay SQL trống. Lịch sử Supabase **6/6**, không missing/pending/different; Advisors không có WARN/ERROR.
- Key JevAI hiện vẫn bị từ chối credentials/model access. Chưa có inference thật thành công; kết quả local không có confidence xác suất.

## Bản 1.5.1

- Sửa Supabase Preview thất bại do cả 5 version migration trong Git lệch với lịch sử Supabase. Khôi phục đúng tên và SQL đã áp dụng, gồm bước tạo ledger trong migration ban đầu.
- Trình chạy PostgreSQL nhận biết ledger đã tồn tại; startup không chạy lại migration được Supabase áp dụng, vẫn seed tri thức idempotent.
- Generator schema chỉ tạo candidate ngoài Git, không ghi đè lịch sử. `pnpm check` chặn version sai format hoặc trùng; `pnpm db:check-history` so sánh version/name/nội dung SQL với Supabase.
- **50/50 tests** đã đạt trên máy, gồm replay mọi migration trên database trống mà không dựa vào server bootstrap và giữ dữ liệu có sẵn qua startup. Đối chiếu cloud: 5/5 migrations, không missing/pending/different.
- Security/Performance Advisors chỉ có INFO: RLS thiếu policy là chủ ý chặn browser roles; 7 index chưa sử dụng chưa phải lý do bỏ index cần cho tải lớn.

[Chi tiết sửa lịch sử migration](SUPABASE_MIGRATIONS.md).

## Lịch sử: bản 1.5.0

- Sửa `.railwayignore` để giữ ảnh PNG trong `dist/qr`; bản upload CLI trước đó có trang A4/SVG nhưng thiếu ảnh PNG. Kiểm tra lại ảnh QR thật sau deploy.

- Tích hợp bộ phân loại cục bộ người dùng bổ sung; sửa khớp tiếng Việt và nguyên từ, ambiguity trả other, confidence=null. Giao diện hiển thị nhãn dự phòng và cho dùng cục bộ khi chưa có Jev/không chọn gửi từ xa. Có CLI thêm nhãn cục bộ vào JSON Atlas.
- Mã lỗi Atlas phân biệt xác thực, quyền, mạng và TLS bằng mã tĩnh; không đưa URI/error message vào API.

- Railway chạy qua HTTPS, PostgreSQL xác thực thành công với Supabase Singapore; private Storage đã kiểm tra và BRIEF DRAFT đã upload.
- Sửa lỗi generator QR giữ cứng phiên bản 1.4.0; dùng phiên bản package hiện tại và kiểm tra health/database/trang đích trước khi tạo PNG/SVG/A4/manifest.
- Thêm kho JSON trong cổng ADMIN: lọc nhóm, phân trang, xem bản ghi, xuất JSON trang và preview yêu cầu Jev.
- Thêm outbox trong SQLite/PostgreSQL, revision, lease và worker Atlas; chỉ mirror tri thức, thống kê tổng hợp và mẫu đo được công bố. Upsert có điều kiện giữ revision mới; tombstone loại nội dung đã rút.
- Thêm NDJSON export, sync CLI, cloud preflight/configure/deploy; CLI Railway chọn rõ project/service/production, giữ giới hạn AI/auth và chuyển secret qua stdin. Cập nhật Docker ignore và kiểm tra lịch sử cho URI Atlas.
- Dùng chung HTTP client Jev với deadline/body limit/retry hữu hạn; rubric tri thức, confidence và cờ cần xem lại. Enrichment tự động mặc định false.
- Migration pg-005 áp dụng lên Supabase thật: 13 bảng RLS, 6 jobs pending; Advisors chỉ có INFO. Cloud JUDGE/ADMIN, cookie Secure và logout đã kiểm tra; không nạp phiếu/đăng ký giả.
- **49/49 tests** đã đạt trên máy; `pnpm check` và production dependency audit đạt. SQLite/PGlite, provider/Mongo writer mock; đã đồng bộ và đọc kiểm chứng 6 tài liệu Atlas thật; JevAI còn từ chối key/quyền model; chưa có benchmark Big Data hoặc inference thành công.

Hướng dẫn [triển khai](DEPLOY_RAILWAY_SUPABASE.md), [Atlas/Jev](MONGODB_JEV.md), [API](API.md).

---

## Lịch sử: bản 1.4.2 (30.09.2026)

## Hoàn thiện bản 1.4.2

| Phần | Lỗi đã sửa / cải tiến |
|---|---|
| Khảo sát | Khóa input/submit/reset khi đang gửi; ngăn gửi lặp; phiếu đã lưu chỉ mở qua “Phiếu mới”; giữ mã đợt/mẫu từ QR sau reset |
| Đăng ký mẫu | Kiểm tra số điện thoại 8–15 chữ số, chuẩn hóa số Việt Nam; nhận diện cả định dạng cũ mà không sửa đăng ký đã lưu |
| Kho tri thức | Tìm nhiều từ khớp từ đầy đủ, tránh “ẩm” khớp một phần của “phẩm”; tìm một từ vẫn hỗ trợ tiền tố |
| Minh chứng mẫu đo | Loại tên chỉ tiêu thuộc prototype, yêu cầu số đo thực; minh chứng FINAL COA/REPORT; tự ẩn mẫu công khai khi minh chứng thay đổi |
| Database | SQLite triggers và 5 PostgreSQL CHECK constraints bảo vệ object, chỉ tiêu rỗng và tên không được hỗ trợ |
| Jev | Giới hạn theo IP sau đăng nhập; deadline gồm đọc body, tối đa 64 KiB, chặn redirect; fallback khi treo/lỗi/quá lớn |
| Tệp và HTTP | Kiểm tra kích thước hồ sơ local trước khi đọc; CSP chỉ dùng font/style cùng server; vô hiệu quyền camera/microphone/vị trí |
| Vận hành | Phiên bản health/status đọc từ package; cố định phiên bản dependencies/pnpm; kiểm tra cú pháp và tài nguyên; GitHub Actions Windows/Linux |
| Tài liệu | README, API, kiến trúc, cổng giám khảo, hướng dẫn cloud và đối chiếu kế hoạch cập nhật cùng bản mã nguồn |

## Kiểm chứng bản 1.4.2

- **37/37 bài kiểm thử thành công** trên Node.js 24; database bộ nhớ/tạm, provider bằng mock. Không tạo phiếu giả vào database dự án.
- Kiểm tra cú pháp JavaScript và liên kết tài nguyên HTML bằng `pnpm check`; audit dependencies sản xuất không phát hiện lỗ hổng đã công bố ở thời điểm kiểm tra.
- Kiểm tra giao diện thực tế: gửi phiếu/đăng ký với request chậm, khóa/reset, giữ mã QR, đăng nhập/đăng xuất, Mean/SD/radar, nhận xét mô tả và hỏi đáp có nguồn. Kiểm tra màn hình nhỏ cho các trang chính.
- Migration pg-004 đã áp dụng lên Supabase thực, 5 constraints được validate; 11 bảng bật RLS, 6 bài tri thức. Security/Performance Advisors sau migration không có WARN/ERROR; INFO RLS không policy là chủ ý chặn role trình duyệt, index chưa dùng trên database mới.
- GitHub Actions chạy cùng bộ kiểm tra trên Windows/Linux; xem trạng thái của commit tại [Actions](https://github.com/Jakcasas/musuroom/actions/workflows/ci.yml).

Chưa gọi OpenRouter/Jev thật khi chưa có key/model. Website Railway và QR để in vẫn chờ hoàn tất xác thực kết nối PostgreSQL của server; cập nhật Supabase không đồng nghĩa website cloud đã deploy. FINAL là nhãn của người vận hành, không tự xác nhận giá trị khoa học/chứng nhận của báo cáo.

Hướng dẫn ở [README](../README.md), hợp đồng request/response ở [API](API.md), trạng thái cloud ở [GitHub + Supabase](GITHUB_SUPABASE.md).

---

## Lịch sử: bản mã nguồn 1.4.1

Ngày cập nhật: **30.09.2026**.

## Các cải tiến

| Phần | Thay đổi | Lợi ích |
|---|---|---|
| Tài liệu gửi mô hình | Tối đa ba bài, JSON tài liệu tối đa 12.000 ký tự mặc định; đánh dấu nội dung rút gọn | Hạn chế dung lượng đầu vào khi kho tri thức lớn dần |
| Điều phối OpenRouter | Một gateway dùng chung cho hỏi đáp/cảm quan, mặc định hai yêu cầu đồng thời | Hạn chế tải đồng thời ở server và provider |
| Xử lý gián đoạn | Tạm ngừng gọi sau lỗi, xử lý thời gian chờ của provider, không tự retry | Giảm lời gọi lặp khi dịch vụ đang lỗi |
| Phản hồi provider | Timeout bao gồm đọc body, chặn redirect, giới hạn 64 KiB, loại câu trả lời bị cắt/lọc | Giữ thời gian và dung lượng xử lý có giới hạn |
| Cấu hình | Kiểm tra placeholder, key/model và khoảng giá trị; bổ sung hạn mức API nhận xét | Báo lỗi cấu hình sớm, hạn chế yêu cầu lặp |
| Thống kê cảm quan | Database tổng hợp phân bố, server nhận tối đa 49 dòng/đợt/mẫu | Không tải góp ý/phiếu thô chỉ để tính các chỉ số |
| Supabase | Hàm tổng hợp SECURITY INVOKER, thu hồi quyền gọi của role trình duyệt | Giữ truy cập dữ liệu cảm quan qua server có xác thực |
| Giao diện | Diễn đạt chế độ trợ lý rõ hơn, hiển thị thời gian chờ, trạng thái truy cập hỗ trợ đọc màn hình | Người dùng hiểu kết quả có nguồn và chế độ dự phòng |

Mean, median, SD mẫu, phân bố, radar và `basis` giữ cấu trúc phản hồi. CSV vẫn xuất phiếu thô theo quyền. Giới hạn điều phối áp dụng cho một tiến trình/replica, chưa phải hạn mức tiền tệ cho tài khoản OpenRouter.

## Kiểm chứng và trạng thái

- **32/32 kiểm thử thành công**, chạy toàn bộ `tests/*.test.mjs` trên Node.js hiện tại.
- Kiểm thử SQLite/PostgreSQL, xác thực, hạn mức, cooldown, body bị treo/quá lớn, nguồn trích dẫn và phản hồi dự phòng bằng mock.
- So sánh thuật toán phân bố với thuật toán từ phiếu thô; kiểm tra histogram một triệu phiếu giả lập mà không mở rộng thành mảng điểm. Đây là kiểm thử thuật toán, chưa phải benchmark hiệu năng dữ liệu thực.
- Migration mới đã áp dụng lên Supabase. Kiểm tra hàm, quyền gọi và Security Advisors không có WARN/ERROR; 6 bài tri thức, 0 phiếu thực tế trên cloud.
- Chưa gọi OpenRouter thật vì chưa có key/model. Website Railway vẫn chờ hoàn tất cấu hình kết nối database của server; migration Supabase thành công không đồng nghĩa website cloud đã deploy.

Hướng dẫn cấu hình ở [README](../README.md), hợp đồng request/response ở [API](API.md), trạng thái cloud ở [GitHub + Supabase](GITHUB_SUPABASE.md).
