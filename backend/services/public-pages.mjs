import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const publicPages = ['/', '/index.html', '/tri-thuc.html', '/trai-nghiem.html', '/minh-bach.html', '/dieu-khoan.html', '/quyen-rieng-tu.html'];
const descriptions = {
  '/minh-bach.html': 'Hồ sơ mẫu Musuroom đã được công bố, với chỉ tiêu đo và phạm vi sử dụng số liệu.',
  '/dieu-khoan.html': 'Tiêu chuẩn và nguồn đối chiếu do dự án Musuroom cung cấp, kèm phiên bản và giới hạn áp dụng.',
};
const escape = text => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

// Explicit allowlist: never read a file name supplied by the visitor.
export function publicPageRenderer(root, origin) {
  const pages = new Map(publicPages.map(path => {
    let html = readFileSync(resolve(root, path === '/' ? 'index.html' : path.slice(1)), 'utf8');
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1] || 'Musuroom ver 1';
    const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1] || descriptions[path] || 'Dự án Musuroom nghiên cứu bột gia vị từ phụ phẩm nấm ăn.';
    let metadata = descriptions[path] ? `<meta name="description" content="${escape(description)}">` : '';
    if (origin) {
      const canonical = origin + (path === '/index.html' ? '/' : path);
      metadata += `<link rel="canonical" href="${escape(canonical)}"><meta property="og:type" content="website"><meta property="og:locale" content="vi_VN"><meta property="og:site_name" content="Musuroom ver 1"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${escape(canonical)}"><meta property="og:image" content="${escape(origin)}/assets/mushroom-seasoning.webp"><meta property="og:image:alt" content="Hình ảnh minh họa nấm ăn và bột gia vị Musuroom">`;
    }
    html = html.replace('</head>', metadata + '</head>');
    return [path, html];
  }));
  return path => pages.get(path);
}
