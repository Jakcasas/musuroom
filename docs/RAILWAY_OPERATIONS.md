# Vận hành Musuroom trên Railway

Đích production: **Musuroom 1 → musuroom-web → production**, GitHub `Jakcasas/musuroom`, nhánh `main`. Website và QR dùng <https://musuroom-web-production.up.railway.app>.

## Cấu hình bản 1.8.5

| Thiết lập | Giá trị | Mục đích |
|---|---|---|
| Region | Singapore, `asia-southeast1-eqsg3a` | Gần người dùng Việt Nam và database Singapore |
| Replica | 1 | Phù hợp lưu lượng hiện tại |
| Dockerfile | `Dockerfile` | Node 24, user node, dependency cố định |
| Cổng | 8080, host 0.0.0.0 | Khớp public domain và container |
| Healthcheck | `/healthz`, timeout 120 giây | Chỉ sẵn sàng sau khi database trả lời |
| Restart | ON_FAILURE, tối đa 5 lần | Khởi động lại sau lỗi process |
| Sleep | Tắt | Giữ cổng khảo sát/giám khảo hoạt động liên tục |
| Overlap | 10 giây | Giữ deployment trước trong lúc chuyển sang bản mới |
| Draining | 35 giây | Cho process xử lý SIGTERM trước SIGKILL |
| Backend shutdown | 30 giây | Chừa 5 giây trước deadline Railway |

Watch paths: `/backend/**`, `/dist/**`, `/supabase/**`, `/server.mjs`, `/Dockerfile`, `/.dockerignore`, `/package.json`, `/pnpm-lock.yaml`, `/railway.json`. Commit chỉ sửa README/docs/tests không tự build container mới; CI GitHub vẫn chạy. Khi chủ động cần triển khai cùng commit, dùng Deploy Latest Commit trong Railway.

Thiết lập đã được ghi trên dịch vụ Railway. `railway.json` giữ cấu hình tương ứng cho dịch vụ legacy hỗ trợ Config as Code. Dịch vụ mới không tự áp dụng file legacy; phải kiểm tra Settings và snapshot deployment thực tế sau khi nối GitHub. Railway đã công bố chuyển sang [Infrastructure as Code](https://docs.railway.com/infrastructure-as-code); file legacy ngừng được đọc từ 01.12.2026. Khi chuyển sang `.railway/railway.ts`, dùng import với `preserve()` cho secret, xem plan và chỉ apply các thay đổi đã kiểm chứng.

## Kiểm tra trước và sau cập nhật

1. Chạy `pnpm check`, `pnpm test`; kiểm tra migration nếu schema thay đổi.
2. Push `main`, theo dõi đúng deployment ID và commit SHA trong Railway. CI Linux/Windows và Supabase Preview phải đạt. Wait for CI hiện chưa bật trên nguồn GitHub; không coi quá trình build Railway là kiểm thử thay thế CI.
3. Xác nhận deployment SUCCESS ở Singapore, `/healthz` đúng version và `database=ok`, trang khảo sát/cổng giám khảo trả 200.
4. Tạo QR sau khi ứng dụng đúng version: `pnpm qr:generate https://musuroom-web-production.up.railway.app`. Commit tài sản QR, chờ deployment chứa manifest mới và kiểm tra hai đường dẫn công khai.
5. Khi rollback, chọn deployment đã SUCCESS trong Railway; giữ các thay đổi schema tương thích. Bản mới này không đổi schema.

Khi SIGTERM/SIGINT tới, server ngừng nhận kết nối mới, chuyển readiness sang 503, dừng lịch worker và chờ công việc đang chạy trước khi đóng database. Cleanup chỉ chạy một lần dù có tín hiệu lặp. Nếu quá 30 giây, process thoát với mã lỗi; các job Atlas đã lưu trong SQL và chưa hoàn tất vẫn cần được kiểm tra/thử lại theo lease và revision hiện có. Không coi deadline là đảm bảo mọi tác vụ ngoài hệ thống đã hoàn thành.

## Theo dõi tài nguyên

Trong Railway mở Metrics để xem CPU/RAM, Logs để xem request lỗi và Deployments để xem phiên bản/region. Mốc kiểm tra ngày 06.10.2026: RAM cao nhất khoảng 162 MB trong 24 giờ, CPU dưới 0.09 core, 1 phản hồi 5xx trên 633 request. Đây là số liệu quan sát của khoảng thời gian đó, không phải kết quả thử tải hoặc cam kết độ trễ.

Nếu health trả 503, xem kết nối database và log an toàn trước khi tăng số replica. Không đưa URL có mật khẩu, API key, mã giám khảo hoặc `.env` vào Git hoặc nội dung log.

[Deployment teardown](https://docs.railway.com/deployments/deployment-teardown) · [Watch paths](https://docs.railway.com/builds/build-configuration#configure-watch-paths) · [Regions](https://docs.railway.com/deployments/regions) · [Khôi phục deployment](RAILWAY_RECOVERY.md)
