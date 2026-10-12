import { articles, updated } from './knowledge-data.js';
import { retrieve } from './retrieval.js';

export function localAnswer(question, { requestAttempted = false } = {}) {
  const matches = retrieve(question, articles);
  return {
    mode: 'bundled',
    answer: matches.length
      ? matches.map(a => `[${a.ref}] ${a.title}\n${a.summary}\nGiới hạn: ${a.limitation}`).join('\n\n')
      : 'Chưa tìm thấy nguồn phù hợp. Thử từ khóa ngắn hơn như “umami”, “phụ phẩm” hoặc “hoạt độ nước”.',
    sources: matches,
    note: `Tra cứu bản đi kèm website, đối chiếu ${updated}. Nội dung mới có thể chưa xuất hiện. ${requestAttempted ? 'Yêu cầu đã được gửi tới máy chủ nhưng chưa nhận được phản hồi thành công. Kết quả bên trên được tra cứu trong trình duyệt; yêu cầu trước đó có thể đã được xử lý.' : 'Câu hỏi này được xử lý trong trình duyệt, không gửi lên máy chủ.'}`,
  };
}
