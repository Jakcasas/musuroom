import { createServer } from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
const root = resolve(import.meta.dirname, 'dist');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8' };
export function createApp() {
  return createServer(async (req, res) => {
    const send = (status, body, type = 'text/plain; charset=utf-8', headers = {}) => {
      res.writeHead(status, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache', ...headers });
      res.end(req.method === 'HEAD' ? undefined : body);
    };
    if (!['GET', 'HEAD'].includes(req.method)) return send(405, 'Method not allowed', undefined, { Allow: 'GET, HEAD' });
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname); }
    catch { return send(400, 'Invalid URL'); }
    if (pathname === '/healthz') return send(200, JSON.stringify({ app: 'musuroom', version: '1.0.0' }), mime['.json']);
    if (pathname.includes('\0') || pathname.includes('\\') || pathname.split('/').some(part => part.startsWith('.'))) return send(403, 'Forbidden');
    const target = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!target.startsWith(root + sep)) return send(403, 'Forbidden');
    try {
      const actual = await realpath(target);
      if (!actual.startsWith(root + sep)) return send(403, 'Forbidden');
      if (!(await stat(actual)).isFile()) return send(404, 'Không tìm thấy trang');
      const body = await readFile(actual);
      send(200, body, mime[extname(actual)] || 'application/octet-stream');
    } catch { send(404, 'Không tìm thấy trang'); }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT || 8766);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535');
  createApp().listen(port, '127.0.0.1', () => console.log(`Musuroom: http://127.0.0.1:${port}/`));
}
