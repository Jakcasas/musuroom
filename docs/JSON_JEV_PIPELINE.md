# JSON → JSON Schema → MongoDB Atlas → quyết định Jev

Musuroom 1.12.0 thêm tác vụ phân loại có tiến độ lưu trên Atlas. Backend đọc JSON tri thức công khai, kiểm tra hợp đồng, chạy guardrails, gọi Jev theo lô tối đa 5 bài và lưu đề xuất vào hàng chờ đối chiếu. Các điểm cảm quan, quyền truy cập và thao tác ghi nguồn vẫn do code quyết định.

## Hợp đồng dữ liệu

- [knowledge_state.schema.json](schemas/knowledge_state.schema.json): các trường văn bản được phép dùng làm state.
- [label_run.schema.json](schemas/label_run.schema.json): giới hạn 1–10.000 bản ghi và lựa chọn gửi ra ngoài.
- [decision_event.schema.json](schemas/decision_event.schema.json): chủ đề, provider, confidence, phiên bản chính sách, hash/revision nguồn, thời gian xử lý và kết quả lưu.

`backend/services/decision-contracts.mjs` là nguồn Zod của các schema. `pnpm schema:decisions` xuất JSON Schema chuẩn; validator BSON cho nhật ký được tạo từ cùng hợp đồng. Không đưa Mongo filter, tên collection hoặc tên công cụ do người gọi tùy chọn vào yêu cầu Jev.

Ví dụ yêu cầu tạo tác vụ:

```json
{"limit":100,"allow_remote":true}
```

`allow_remote=false` dùng luật cục bộ, luôn ghi `provider=local`, `confidence=null` và `requires_review=true`. Kết quả Jev được kiểm tra Choice, tập nhãn và phân phối xác suất trước khi lưu. Confidence gate đưa kết quả chưa rõ vào hàng chờ; ngay cả đề xuất độ tin cậy cao cũng không tự sửa nguồn hoặc chứng nhận chất lượng.

## Dùng trên website

Đăng nhập quản trị → Kho dữ liệu → **Xử lý kho JSON theo lô**. Xem JSON/JSON Schema, chọn giới hạn, đánh dấu đồng ý nếu muốn gửi tới Jev rồi tạo tác vụ. Bấm cập nhật để đọc tiến độ và nhật ký. Khi key/model bị từ chối, tác vụ `blocked` giữ nguyên cursor; sau khi sửa cấu hình có thể tiếp tục. Dừng tác vụ thu hồi lease; kết quả đang gọi dịch vụ sẽ không được lưu sau khi dừng.

API nằm dưới `/api/v1/admin/data`, chỉ quản trị được truy cập; POST cần phiên và CSRF:

| Endpoint | Chức năng |
| --- | --- |
| `GET /schemas` | JSON Schema |
| `POST /label-runs/preview` | Đếm phạm vi, xem lô đầu; chưa gọi Jev |
| `POST /label-runs` | Tạo tác vụ, HTTP 202 |
| `GET /label-runs?after=...&limit=25` | Danh sách dùng cursor |
| `GET /label-runs/:id` | Tiến độ và mã lỗi an toàn |
| `GET /label-runs/:id/events?after=...&limit=25` | Nhật ký JSON phân trang |
| `POST /label-runs/:id/control` | `{"action":"resume"}` hoặc `{"action":"cancel"}` |

## Dùng trên máy vận hành

```sh
pnpm data:label --cloud --limit 100
pnpm data:label --cloud --run --allow-remote --limit 100
pnpm data:label --cloud --id RUN_ID
pnpm data:label --cloud --id RUN_ID --resume
```

Lệnh đầu chỉ xem trước. `--run` không có `--allow-remote` chỉ xử lý cục bộ. Website worker lấy mỗi lô sau khoảng 10 giây; giới hạn này tránh dồn yêu cầu lên cluster miễn phí. CLI và website dùng chung lease, không chạy đồng thời cùng một tác vụ. Không chạy lệnh nhiều lần để khắc phục lỗi xác thực Jev.

## Lưu bền và xử lý dữ liệu lớn

- `app_label_runs`: cursor, giới hạn, mốc ID trên, lease, trạng thái, số bản ghi và lượt Jev. Mỗi nguồn chỉ có một tác vụ hoạt động; index ngăn tạo trùng.
- `app_decision_events`: nhật ký không có toàn văn state, tài khoản, contact hoặc nhận xét thô. Dùng hash và revision để đối chiếu; index theo source/run/id.
- Mỗi lô dùng truy vấn keyset, tối đa 5 bản ghi trong bộ nhớ. Không kéo toàn bộ collection vào prompt. Mốc ID giới hạn phạm vi tác vụ; đây không phải snapshot bất biến của toàn bộ collection. Nếu dữ liệu bị rút hoặc đổi phiên bản, bản ghi được bỏ qua hoặc ghi `stale`; tạo tác vụ mới sau đồng bộ để xử lý phiên bản mới.
- Ghi event, đề xuất, bản chiếu và checkpoint trong cùng transaction. Write fence phát hiện nguồn sửa đồng thời. Checkpoint bền tránh ghi lặp sau restart; một lời gọi Jev vẫn có thể bị lặp nếu tiến trình chết sau phản hồi nhưng trước commit. Không hứa exactly-once cho API bên ngoài.
- Lỗi mạng/rate-limit được thử lại tối đa 3 lần với khoảng nghỉ tăng; lỗi key/model dừng ngay. Không lưu fallback thành kết quả Jev. Hủy và hết lease không ghi kết quả của worker cũ.
- Kho hiện có 6 bài tri thức, chưa benchmark hàng triệu bản ghi. Để dùng thực tế ở quy mô lớn cần đo tải, chi phí/token, tăng năng lực cluster và thiết lập retention/backup cho nhật ký. Không tự gửi mọi collection cá nhân sang Jev.

## Trạng thái Jev

Thử lại ngày 08.10.2026: MCP initialize và tools/list HTTP 200; tools/call vẫn báo quyền key/model bị từ chối. Tích hợp và kiểm thử mock đã sẵn sàng; chưa có kết quả suy luận thật được xác minh. Người vận hành cần xử lý quyền tại https://www.jevai.org/agent/keys rồi tiếp tục tác vụ bị chặn.

Nguồn thiết kế: [bài Decision Layer do chủ dự án cung cấp](https://noncodersuccess.medium.com/jev-vs-openai-decisions-api-why-ai-agents-need-a-decision-layer-not-another-llm-157cc01539d3); định dạng API đối chiếu [TypeSafe primitives](https://docs.typesafe.ai/primitives), [confidence routing](https://docs.typesafe.ai/patterns/confidence-routing). Bài viết là nguồn ý tưởng; các tuyên bố về dịch vụ/model khác không được dùng làm hợp đồng API của Musuroom.
