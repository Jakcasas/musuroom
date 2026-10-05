# Triển khai Musuroom 1 — Railway + Supabase

## Đích triển khai hiện tại

Project **Musuroom 1**, service **musuroom-web**, environment **production**, repository `Jakcasas/musuroom` nhánh `main`. Ngày 06.10.2026 đã triển khai bản 1.8.5 tại Singapore, health PostgreSQL ok; đã gỡ dịch vụ rỗng tạo thêm gây hai thông báo Railway failure trên cùng commit. [Chi tiết và quy trình khôi phục](RAILWAY_RECOVERY.md) · [Cấu hình vận hành 1.8.5](RAILWAY_OPERATIONS.md).

## Mốc triển khai ngày 02.10.2026

- Ứng dụng: **https://musuroom-web-production.up.railway.app**.
- Health `/healthz`: `app=musuroom`, `version=1.7.0`, `database=ok`.
- Railway project `Musuroom 1`: `2fb171d1-803d-4f5e-93cc-94837e2f42d4`; service `musuroom-web`: `1bb6900a-64d2-47c9-be06-648f6139ff6e`; environment `production`.
- Supabase project `hlkzngyuoqzcfhrfkuub`: PostgreSQL, 14 bảng Musuroom, 6 bài/nguồn tri thức; bucket `musuroom-dossier` riêng tư, tối đa 50 MB/file.
- Singapore: Supabase `ap-southeast-1`, Railway `asia-southeast1-eqsg3a`, một replica. [Các vùng Supabase](https://supabase.com/docs/guides/platform/regions), [các vùng Railway](https://docs.railway.com/deployments/regions). Chưa đo benchmark độ trễ thực tế từ Việt Nam.
- Mã cloud riêng có thời hạn đã tạo; bản giới thiệu BRIEF ở trạng thái DRAFT đã upload. Chưa có COA/dinh dưỡng/khảo sát thử nếm thực tế để công bố.

## 1. Chuẩn bị bên ngoài

Trong thư mục dự án, cài Node.js 24 và pnpm 11.19.0. Chạy `pnpm install --frozen-lockfile`. Railway CLI cần phiên đăng nhập của chủ dự án: `pnpm exec railway login --browserless`. Nếu binary CLI chưa được cài do scripts bị chặn, chạy `node node_modules/@railway/cli/npm-install/postinstall.js` rồi kiểm tra `pnpm exec railway --version`.

Trên máy mới, tạo `data/cloud.env` từ `cloud.env.example`. Trong Supabase **Connect**, lấy **Session pooler cổng 5432**; điền password đã percent-encode. Không dùng transaction pooler 6543 vì migration giữ advisory lock theo session. Khóa Storage chỉ lưu ở backend. Trên máy này **CAU_HINH_SUPABASE.cmd** nhập ẩn mật khẩu và ghi riêng vào `data/cloud.env`.

Đổi/reset mật khẩu thực hiện trong Supabase Dashboard rồi cập nhật helper. Lỗi 28P01 là mật khẩu chưa được chấp nhận. Sau đổi mật khẩu, preflight thử lại tối đa 2 lần với khoảng chờ 2 giây để xử lý thời gian cập nhật của pooler; nếu vẫn lỗi, dừng trước khi upload. Không đưa mật khẩu vào URL Git, README hoặc frontend.

CA được lấy từ **Database Settings > SSL configuration > Download certificate**. Máy này có CA trong `data/supabase-ca.crt` và `DATABASE_CA_CERT` lưu riêng. Backend luôn xác minh TLS/hostname; tham số SSL trong URL không được dùng để tắt xác minh. PEM một dòng trong `.env` dùng dấu nháy đơn và `\n` cho xuống dòng. [Hướng dẫn kết nối PostgreSQL](https://supabase.com/docs/guides/database/connecting-to-postgres).

Bucket Storage phải `public=false`. Khi chuẩn bị trên một project mới, chạy với `MUSUROOM_ENV_FILE=data/cloud.env`: `node scripts/database.mjs` và `node scripts/provision-storage.mjs`. Với fork dùng project khác, sửa IDs/domain tại `scripts/cloud-config.mjs` và project/pooler trong template trước khi cấu hình.

## 2. Kiểm tra và triển khai

```powershell
pnpm check
pnpm test
pnpm audit --prod --audit-level=moderate
pnpm db:check-history
pnpm cloud:check
pnpm cloud:deploy
```

`cloud:check` đọc file riêng, kiểm tra PostgreSQL/migration và private bucket; Atlas được kiểm tra nếu được cấu hình. Jev báo configured/disabled, chưa coi cấu hình là lời gọi dịch vụ đã thành công.

Atlas đã kết nối và nhận 6 tài liệu JSON được đọc kiểm chứng; SQL pending=0. `pnpm cloud:deploy` cấu hình worker trên Railway. Khi Atlas tạm không đáp ứng, có thể triển khai với `--without-atlas`; flag chỉ tắt worker trên deployment đó, bảo toàn URI trong file riêng. Jev dùng `JEV_API_KEY` từ www.jevai.org/agent/keys và `typesafe-ai/jev`; thử thật hiện báo credentials/model access rejected (MCP) và REST 502. Kiểm tra key/quyền model tại JevAI; không đổi sang provider khác để vượt lỗi này.

`cloud:deploy` kiểm tra trước, chuyển toàn bộ biến môi trường theo whitelist bằng stdin, chọn đúng project/service/production, upload, theo dõi ID deployment vừa tạo đến SUCCESS và chờ tối đa 10 phút cho `/healthz` đúng phiên bản package và database. Bản cũ cùng version không được dùng để xác nhận triển khai. QR chỉ tạo sau khi health và trang khảo sát/giám khảo đã hoạt động. Script không in giá trị bí mật. Có thể tách bước chuyển biến bằng `pnpm cloud:configure` và upload bằng:

```powershell
pnpm exec railway up --project 2fb171d1-803d-4f5e-93cc-94837e2f42d4 --environment production --service musuroom-web --detach
```

Trong Railway, domain gắn port **8080**; `HOST=0.0.0.0`, `PORT=8080`, `PUBLIC_ORIGIN=https://musuroom-web-production.up.railway.app`. Docker dùng Node 24, pnpm cố định, user `node`; `.dockerignore` chỉ cho phép backend/dist/schema cần thiết. `.railwayignore` và `.gitignore` loại data, `.env`, cache, dependencies, log và PID.

Để tự triển khai từ GitHub, vào Railway **Service > Settings > Source**, chọn `Jakcasas/musuroom`, nhánh `main`; nếu chưa có quyền repository, chủ tài khoản hoàn tất cài/quyền Railway GitHub App. CLI tương đương:

```powershell
pnpm exec railway service source connect --repo Jakcasas/musuroom --branch main --project 2fb171d1-803d-4f5e-93cc-94837e2f42d4 --environment production --service musuroom-web
```

Các lệnh upload thủ công vẫn dùng được khi GitHub App chưa được kết nối. Kiểm tra GitHub Actions của commit trước khi deploy; kết nối Source không tự bảo đảm rằng CI đã đạt.

Railway hiện thông báo chuyển từ `railway.json` sang [Infrastructure as Code](https://docs.railway.com/infrastructure-as-code). Cấu hình hiện tại vẫn được hỗ trợ; đối chiếu công cụ `railway config migrate` và hướng dẫn nhà cung cấp trước đợt nâng cấp cấu hình tiếp theo.

## 3. Cấp mã cloud và thêm hồ sơ

```powershell
$env:MUSUROOM_ENV_FILE='data/cloud.env'
node scripts/create-access.mjs --role JUDGE --days 7 --out data/cloud-judge-access.json
node scripts/create-access.mjs --role ADMIN --name 'Quản trị Musuroom' --days 7 --out data/cloud-admin-access.json
node scripts/add-document.mjs --file docs/project-brief.txt --title 'Giới thiệu đề tài Musuroom' --type BRIEF --status DRAFT
Remove-Item Env:MUSUROOM_ENV_FILE
```

Máy này đã có hai file mã cloud; script giữ file/tài khoản đã tồn tại. Mã giám khảo khác mật khẩu database. Gửi riêng đúng mã JUDGE cho người được mời; mã ADMIN chỉ dành cho người vận hành. Mã mặc định hết hạn sau 7 ngày; tạo file mới khi cần và thu hồi mã cũ bằng `scripts/revoke-access.mjs ACCOUNT_ID` với môi trường cloud.

Upload SOP/COGS/COA thật bằng cùng CLI và nhãn đúng nội dung. BRIEF DRAFT không trở thành kết quả kiểm nghiệm. File nằm trong private Storage; tải đi qua API có xác thực và kiểm tra hash/kích thước.

## 4. QR cho bao bì và poster

```powershell
pnpm qr:generate https://musuroom-web-production.up.railway.app
```

Kết quả: `dist/qr/survey.png`, `survey.svg`, `judge.png`, `judge.svg`, `IN_QR_A4.html` và `manifest.json`. Manifest ghi phiên bản, thời điểm kiểm tra và public origin. Survey trỏ `/trai-nghiem.html`; judge trỏ `/giam-khao.html`, không chứa mã truy cập. Dùng SVG trên poster; in A4 ở 100%, QR rộng 44 mm; quét bản in bằng điện thoại trước khi dán.

Khi tạo QR mới trên máy sau deploy, các tệp được đưa vào lần publish/upload kế tiếp nếu muốn cho tải từ `/qr/IN_QR_A4.html` trên website. Trước khi in lại sau thay domain, chạy lại generator với origin thật và cập nhật `PUBLIC_ORIGIN`.

## 5. Xác minh và vận hành

- Qua HTTPS, mở trang chủ/khảo sát/tri thức/minh bạch/giám khảo. Kiểm tra version bằng `/healthz`.
- API riêng trả 401 khi chưa đăng nhập. JUDGE không đọc liên hệ ADMIN hoặc kho JSON quản trị. Cookie production có `Secure`, `HttpOnly`, `SameSite=Strict`; POST yêu cầu CSRF. Kiểm tra đăng xuất làm phiên cũ trả 401.
- Database bật RLS và thu hồi quyền browser trên bảng Musuroom. Production không fallback sang SQLite hoặc lưu tệp lâu dài trong container.
- Một replica vì rate limit dùng bộ nhớ tiến trình. Khi tăng replica, cần kho điều phối chung cho rate limit.
- Backup PostgreSQL và Storage theo gói/lịch vận hành thực tế; NDJSON không thay backup. Theo dõi log Railway, lỗi kết nối, pending sync và hạn mã giám khảo.
- Cấu hình Atlas/Jev theo [kho JSON và hỗ trợ phân loại](MONGODB_JEV.md). Để hai phần này disabled nếu chưa có URI/key; chức năng khảo sát và hồ sơ vẫn hoạt động.

## Tài liệu nhà cung cấp

[Railway CLI](https://docs.railway.com/cli), [Railway Express](https://docs.railway.com/guides/express), [Supabase PostgreSQL](https://supabase.com/docs/guides/database/connecting-to-postgres), [Supabase Storage](https://supabase.com/docs/guides/storage/uploads/standard-uploads), [JevAI REST/MCP](https://www.jevai.org/mcp).

## Trạng thái đồng bộ trên Railway

Worker trên Railway hiện trả `atlas_network_unavailable`, dù đồng bộ từ máy này và đọc lại Atlas đã thành công. Cần kiểm tra Atlas Network Access và DNS/kết nối từ Railway trước khi xác nhận đồng bộ tự động trên cloud. Dữ liệu khảo sát vẫn lưu vào Supabase; có thể chạy `data:sync` từ máy đã được Atlas cho phép.

1. Trong Railway, xem Networking/Outbound và xác định IP egress ổn định nếu gói hiện có hỗ trợ; không tự nâng cấp gói.
2. Trong Atlas Network Access, cho phép chính IP/CIDR đó; kiểm tra database user vẫn có readWrite trên musuroom. Không mở toàn Internet để xử lý tạm lỗi.
3. Kiểm tra DNS/SRV/TLS từ môi trường cloud nếu lỗi vẫn còn. Mã lỗi mới phân biệt network/auth/permission/TLS và không chứa URI.
4. Deploy lại và kiểm tra ADMIN data/status: last_error_code=null, last_completed_at mới và pending giảm sau cập nhật thật. Nếu chưa có egress ổn định, dùng `pnpm cloud:deploy --without-atlas` và đồng bộ có kiểm soát từ máy hiện tại.

Source Railway đã gắn Jakcasas/musuroom, nhánh main. Push mới nhất chưa tự tạo deployment; bản này được triển khai bằng CLI sau khi CI đạt. Đối chiếu GitHub App/webhook trong Railway và thử push trước khi coi auto deploy đã hoạt động.


## Nâng cấp 1.8.0

### Bổ sung cho 1.8.2

Áp dụng migration `research_score_integrity` sau các migration nghiên cứu trước đó, đối chiếu `pnpm db:check-history`: 9/9 file, không missing/pending/different. Kiểm thử migration từ database rỗng trước khi áp dụng; không sửa lịch sử để che lỗi Preview. Deploy backend và frontend cùng bản 1.8.2; client chấm điểm phải gửi `sample_revision` từ setup. Trang mở từ bản cũ cần tải lại trước khi gửi. Sau deploy, kiểm tra health, đăng nhập ADMIN, danh sách minh chứng và API scores; tạo QR sau khi health đúng phiên bản, rồi triển khai các tài sản QR đã tạo.

Hàm kiểm tra database dùng SECURITY INVOKER, `search_path` cố định và thu hồi EXECUTE từ PUBLIC/anon/authenticated. Không mở Data API cho bảng nghiên cứu. Tham khảo [Supabase Database Functions](https://supabase.com/docs/guides/database/functions) và [xử lý lỗi branching/migrations](https://supabase.com/docs/guides/deployment/branching/troubleshooting).

### Các bước của bản 1.8.0

1. Sao lưu database theo quy trình vận hành trước khi nâng cấp; không chạy reset database. Bản này bổ sung `research_workspace` và `research_vectors`, giữ nguyên sáu migration cũ.
2. Áp dụng hai migration mới qua Supabase, giữ đúng version/name/SQL đã ghi trong lịch sử remote. Chạy `pnpm db:check-history`; phải có tám local/remote và không có missing/pending/different. Các bảng mới bật RLS, không mở quyền anon/authenticated.
3. Giữ nguyên secrets trong Railway Variables. Deploy commit đã kiểm thử bằng Railway CLI; kiểm tra deployment ID cụ thể SUCCESS và `/healthz` phiên bản 1.8.0, PostgreSQL ok.
4. Đăng nhập ADMIN kiểm tra `nghien-cuu.html`, thử chẩn đoán Atlas. Chỉ nhập hồ sơ thật đã được phép công bố. Không nhập dữ liệu minh họa vào database production.
5. Chạy `pnpm qr:generate https://musuroom-web-production.up.railway.app`; commit tài sản QR/manifest rồi triển khai lại và xác nhận đúng phiên bản. QR hũ mẫu được sinh trực tiếp sau khi công bố hồ sơ.
6. Nếu Atlas từ Railway còn lỗi, kiểm tra DNS, tài khoản database và Network Access theo địa chỉ outbound thực. Nếu Jev từ chối, kiểm tra key/quyền model tại www.jevai.org/agent/keys. Website dùng SQL và dự phòng cục bộ trong thời gian đó.

PWA chỉ hỗ trợ tài nguyên đã tải online; phiên bản service worker thay đổi theo bản phát hành. Phiếu lưu cục bộ không tự đẩy nền. Docker Compose chỉ dành cho local, không chứa cấu hình/secret production.
