# Hướng dẫn Musuroom

| Bạn muốn làm gì? | Tài liệu |
|---|---|
| Hồ sơ hũ mẫu, chấm điểm, ngoại tuyến, PDF và điều khoản | [Nâng cấp 1.8.0](UPGRADE_2026.md) |
| Cấu hình và kiểm chứng trợ lý tri thức | [Hỗ trợ phân tích](ASSISTANT.md) |
| Dùng 4 luồng Jev, phân loại theo lô và đối chiếu đề xuất | [Jev trong Musuroom](JEV_WORKFLOWS.md) |
| Chạy website và xem các trang | [README dự án](../README.md) |
| Xem các lỗi đã sửa và cải tiến ở bản 1.7.0 | [Ghi chú phát hành](RELEASE_NOTES.md) |
| Xem repository và trạng thái Supabase | [GitHub + Supabase](GITHUB_SUPABASE.md) |
| Sửa Supabase Preview và kiểm tra lịch sử migration | [Lịch sử migration](SUPABASE_MIGRATIONS.md) |
| Deploy Railway và in QR | [Triển khai cloud](DEPLOY_RAILWAY_SUPABASE.md) |
| Xử lý deployment Railway lỗi, chọn đúng project/service | [Khôi phục triển khai](RAILWAY_RECOVERY.md) |
| Xem API khảo sát, thống kê và đăng ký mẫu | [REST API](API.md) |
| Cấp mã giám khảo và thêm hồ sơ | [Cổng giám khảo](JUDGE_PORTAL.md) |
| Hiểu cấu trúc server và database | [Kiến trúc](ARCHITECTURE.md) |
| Đối chiếu kế hoạch và dữ liệu còn thiếu | [Kế hoạch](PLAN_REVIEW.md) |
| Đọc tài liệu TypeSafe/Jev đã lưu offline | [TypeSafe AI](typesafe-ai/README.md) |

## Cấu trúc mã nguồn

[Kho JSON, MongoDB Atlas và Jev](MONGODB_JEV.md): cấu hình ngoài Git, đồng bộ tăng dần, xuất dữ liệu và kiểm tra đề xuất.

```text
backend/               Express, xác thực, API và database adapters
dist/                  Website, JavaScript, CSS và font Roboto
supabase/migrations/   Schema PostgreSQL và migration bổ sung
scripts/               Setup, cấp mã, hồ sơ, QR và kiểm tra trước khi publish
tests/                 Kiểm thử API, PostgreSQL, QR và Jev
docs/                  Hướng dẫn và snapshot TypeSafe
```

`.env`, `data/`, database thực tế và các mã truy cập được tạo riêng trên máy chạy ứng dụng. Những tệp này không nằm trong repository.
