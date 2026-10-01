# Sửa Supabase Preview và quản lý lịch sử migration

## Lỗi đã xác định

GitHub Supabase Preview báo `Remote migration versions not found in local migrations directory`. Database production vẫn ACTIVE_HEALTHY; check này thất bại vì version trong tên file Git không khớp các version Supabase đã lưu. Hai job Windows/Linux đạt không đủ để kết luận Supabase Preview đạt.

| File cũ | Version đã áp dụng / tên file hiện tại |
|---|---|
| 001_musuroom.sql | 20260930100547_musuroom_initial_schema.sql |
| 20260930101047_musuroom_access_hardening.sql | 20260930101203_musuroom_access_hardening.sql |
| 20260930152855_sensory_distribution.sql | 20260930153838_musuroom_sensory_distribution.sql |
| 20260930155603_product_integrity.sql | 20260930160511_musuroom_product_integrity.sql |
| 20261001025801_data_sync_jobs.sql | 20261001031031_data_sync_jobs.sql |

Nội dung file khôi phục từ SQL đã áp dụng trong `supabase_migrations.schema_migrations`, không chỉ đổi tên. Migration đầu gồm tạo `public.schema_migrations`; cả 5 migration ghi key ledger ứng dụng `pg-*`. Trình chạy server kiểm tra ledger trước và không áp dụng lại migration đã được Supabase chạy. Test Preview chạy raw SQL trên PostgreSQL trống trước khi gọi server, rồi kiểm tra startup không mất dữ liệu có sẵn.

Lịch sử trước sửa được sao lưu riêng tại `data/backups/supabase-migration-history-before-fix.json`. Không reset production hoặc xóa migration history để làm check xanh.

## Quy trình kiểm tra trước publish

```powershell
pnpm check
pnpm test
pnpm db:check-history
```

`check` chặn tên file sai định dạng 14 chữ số hoặc trùng version. `db:check-history` dùng `data/cloud.env`, kiểm tra version/name và hash SQL sau chuẩn hóa CRLF/trim; chỉ in version bị lệch, không in URI/key/nội dung SQL. Với bản này, local=5, remote=5, missing/pending/different đều rỗng. Migration mới chưa áp dụng sẽ xuất hiện trong pending và cần được người vận hành xem xét.

Theo dõi cả **Supabase Preview**, **verify (ubuntu-24.04)** và **verify (windows-latest)** trên commit mới. Check cũ thất bại là lịch sử của commit cũ; không sửa/xóa kết quả đó.

## Khi cần đổi schema tiếp theo

- Giữ nguyên các file lịch sử đã áp dụng. `pnpm schema:postgres` chỉ tạo candidate tại `data/schema-review/`, không tạo thêm file 001 hoặc ghi đè migration.
- Dùng Supabase CLI `migration new <name>` để tạo migration mới; kiểm tra CLI `--help` theo phiên bản đang dùng. Review SQL và RLS, chạy Advisors và test trên database thử trước khi áp dụng cloud.
- Khi áp dụng qua công cụ tạo version phía cloud, đưa đúng version/SQL cloud về Git trước khi push để tránh lệch lịch sử. Hai hệ thống ledger có vai trò khác nhau: Supabase dùng timestamp, ứng dụng dùng key pg-*.
- Không dùng migration repair/reverted khi chưa đối chiếu schema và lịch sử thật. Không tắt Supabase Preview để che lỗi.

[Hướng dẫn GitHub integration](https://supabase.com/docs/guides/deployment/branching/github-integration), [database migrations](https://supabase.com/docs/guides/deployment/database-migrations).

## Kết quả xác minh 01.10.2026

Commit `2cd48c3` đã có cả 3 check success: Supabase Preview và verify Windows/Linux. Nhánh Supabase chuyển MIGRATIONS_FAILED → FUNCTIONS_DEPLOYED, project ACTIVE_HEALTHY. Railway health trả 1.5.1/database=ok. Production có 13 bảng RLS, 6 bài tri thức, không có phiếu/đăng ký giả.
# Bổ sung bản 1.6.0

Migration mới `20261001143510_knowledge_decision_reviews.sql` đã áp dụng qua Supabase MCP. Tệp ban đầu được tạo bằng Supabase CLI `migration new knowledge_decision_reviews`, sau đó đổi sang version thực tế do MCP cấp để khớp history. 5 migration cũ giữ nguyên. `pnpm db:check-history` xác nhận 6 local/6 remote, không missing/pending/different.

Bảng đề xuất bật RLS và chặn PUBLIC/anon/authenticated; Express đọc bằng kết nối PostgreSQL phía server và kiểm tra ADMIN/CSRF. Không tạo policy public chỉ để làm hết thông báo INFO của Advisors.

