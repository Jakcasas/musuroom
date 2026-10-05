# 1.9.0 — 06.10.2026

- Cải tiến giao diện desktop: màu kem/xanh rừng, Roboto, bố cục rộng, menu trang chủ gọn và ba thẻ truy cập nhanh.
- Biểu mẫu khảo sát có các nhóm nội dung rõ và chỉ báo số tiêu chí đã chọn; đồng bộ khi thay đổi, khôi phục nháp hoặc đặt lại.
- Cổng giám khảo thêm nút hiện/ẩn mã, tự che khi gửi hoặc chuyển khỏi tab. Không thay đổi xác thực hay quyền dữ liệu.
- Đồng bộ hình thức bảng, hồ sơ, kho tri thức; bổ sung tài sản công khai vào service worker 1.9.0. Không thêm migration.
- Canva/Figma chưa có công cụ thao tác trong phiên này; Higgsfield từ chối tạo ảnh do gói tài khoản. Sử dụng hình minh họa hiện có và triển khai thiết kế trực tiếp trong mã nguồn.

# 1.8.5 — 06.10.2026

- Railway cấu hình Singapore, một replica, giữ hoạt động liên tục; watch paths chỉ theo dõi mã/tài sản runtime và dependency/config build.
- Overlap 10 giây, draining 35 giây; backend xử lý SIGTERM/SIGINT bằng cùng handler, bỏ qua tín hiệu lặp, ngừng worker ngay và chờ request đang chạy. Deadline 30 giây, log không chứa lỗi provider hoặc credentials.
- Cleanup vẫn đóng database khi worker dừng lỗi. Healthcheck trả 503 khi database không sẵn sàng; request mới trong giai đoạn dừng nhận 503 và Retry-After.
- Bổ sung kiểm thử request đang chạy, tín hiệu lặp, deadline, readiness và lỗi cleanup. Giữ thang điểm/phiếu/database hiện có; không thêm migration.
- Kiểm tra local: 78/78 kiểm thử đạt, 110 tệp mã và 138 liên kết tài sản đạt. Deployment mã 1.8.5 tại Singapore đã SUCCESS; QR được tạo sau khi kiểm tra health/database và hai trang đích công khai.

# 1.8.4 — 05.10.2026

- Guardrails chuẩn hóa Unicode, loại ký tự ẩn và chặn/che mật khẩu tiếng Việt, Bearer token, URI database có credentials, private key trước khi gọi Jev.
- Reranking chỉ xử lý tối đa 5 nguồn đã tìm thấy, truyền cả giới hạn áp dụng, giới hạn JSON UTF-8 18.000 bytes, giữ thứ tự khi hòa điểm và giữ nguyên nguồn phía sau.
- Bulk labeling hiển thị số đề xuất Jev/cục bộ/cần xem lại. Confidence gate v2 lưu `review_reason` và `probability_margin`; chênh lệch hai nhãn dưới 0.1 cần đối chiếu. Ngưỡng này là chính sách thận trọng, chưa phải ngưỡng đã hiệu chuẩn.
- Cài MCP Codex không lưu key vào config; có chẩn đoán riêng handshake, danh sách công cụ và inference. Lần thử hiện tại: local 401, cloud `tools/call` từ chối credentials/model access; chưa có inference thật thành công.
- Dùng bảng `knowledge_decision_reviews` hiện có; không cần migration mới. Quyền Data API của bảng vẫn đóng, thao tác qua API ADMIN/CSRF của backend.
- Kiểm chứng: 74/74 kiểm thử đạt; 9 migration local/remote khớp version, tên và SQL. Các trường hợp provider thành công được kiểm thử bằng mock; kết quả gọi Jev thật được ghi riêng, không suy ra từ kiểm thử mock.
- Kiểm tra production 05.10.2026: health 1.8.4/PostgreSQL ok; phân loại hai lô 5+1 bài, lưu 6 đề xuất `pending`, `mode=local`, policy v2. Lô đầu nhận `jev_auth_failed`, lô sau và reranking dùng dự phòng trong thời gian cooldown. QR được xác minh lại với hai trang đích công khai. Supabase Preview, CI Linux và Windows đều thành công cho commit mã xử lý.
- Kiểm tra tiếp trên tài khoản Jev: key cloud khớp key đang hiển thị; đã đồng bộ local và loại bỏ lỗi 401. Inference vẫn bị từ chối qua MCP; preset dùng phiên đăng nhập trên Jev Agent cũng báo phản hồi HTML thay vì JSON. Đây là phần còn cần phía Jev kiểm tra; chưa xác nhận model hoạt động.

# 1.8.3 — 05.10.2026

Mã Giám khảo mặc định được người vận hành lựa chọn và băm bằng scrypt. Chỉ một tài khoản JUDGE được cấu hình, không dùng mã mặc định để đăng nhập ADMIN. Đổi mã thu hồi phiên cũ, giữ thời hạn; kiểm tra lại credential/tài khoản khi tạo phiên để chặn thao tác đồng thời với thu hồi. Không đưa giá trị mã vào Git, frontend hoặc QR. Bỏ qua metadata `.vs/` của Visual Studio.

# 1.8.2 — 05.10.2026

Chọn minh chứng từ tài liệu có sẵn, hiển thị thông tin hũ/lô/nguồn/quy trình khi chấm. Phiếu cũ có nhắc đối chiếu; bảng trung bình chỉ tính đúng revision hiện tại. API yêu cầu `sample_revision`, có thông báo cụ thể cho xung đột và mã hũ trùng. Migration mới kiểm tra thang điểm, số tiêu chí, trọng số và tổng ở database; giữ bộ tiêu chí đã lưu bất biến. Kiểm thử cùng tình huống trên SQLite và PostgreSQL. Không tạo dữ liệu minh họa trên production.

# 1.8.1 — 05.10.2026

Sửa đọc kết quả MCP theo cấu trúc chính thức JevAI; giữ hỗ trợ envelope cũ. Trạng thái kết nối có thời gian kiểm tra, thông báo lỗi rõ và thời gian chờ khi dùng phân loại cục bộ. ADMIN có nút kiểm tra bằng câu minh họa cố định; API được giới hạn tần suất, phân quyền và CSRF. CLI `jev:check` không in key. Không xác nhận inference Jev thật khi dịch vụ vẫn từ chối credentials/model access.

# 1.8.0 — 05.10.2026

Hồ sơ nghiên cứu, QR từng hũ, tiêu chí và điểm trọng số; PWA lưu phiếu khi mất mạng; radar tương tác và báo cáo A4; điều khoản có nguồn, API pgvector; Zod và circuit breaker Jev. Thêm giấy phép, hướng dẫn đóng góp, banner và cấu hình Docker local. [Phạm vi kiểm chứng và việc cần bổ sung](UPGRADE_2026.md).

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
