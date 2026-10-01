import QRCode from 'qrcode';
import { mkdir,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isIP } from 'node:net';
import { releaseInfo } from '../backend/version.mjs';
import { readProviderJson } from '../backend/services/provider-response.mjs';
export function publicLinks(base){
 let u;try{u=new URL(base);}catch{throw new Error('Use a public HTTPS origin.');}if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||u.pathname!=='/'||isIP(u.hostname.replaceAll(/[\[\]]/g,''))||u.hostname==='localhost'||/\.(localhost|local|internal)$/.test(u.hostname)||!u.hostname.includes('.'))throw new Error('Use the real public HTTPS origin, without credentials or query parameters.');
 return{survey:new URL('/trai-nghiem.html',u).href,judge:new URL('/giam-khao.html',u).href};
}
export async function qrAssets(url){return{png:await QRCode.toBuffer(url,{type:'png',width:1000,margin:4,errorCorrectionLevel:'Q',color:{dark:'#10271eff',light:'#ffffffff'}}),svg:await QRCode.toString(url,{type:'svg',margin:4,errorCorrectionLevel:'Q',color:{dark:'#10271eff',light:'#ffffffff'}})};}
export async function generateQr(base,directory,{fetchImpl=fetch}={}){
 const links=publicLinks(base);
 const deadline=AbortSignal.timeout(15000);
 const health=await fetchImpl(new URL('/healthz',base),{redirect:'error',signal:deadline});
 if(!health.ok)throw new Error('Public health check failed. No print QR generated.');
 const result=await readProviderJson(health,deadline);
 if(result.app!==releaseInfo.app||result.version!==releaseInfo.version||result.database!=='ok')throw new Error('Public application version or database check failed. No print QR generated.');
 for(const url of Object.values(links)){const page=await fetchImpl(url,{redirect:'error',signal:AbortSignal.timeout(15000)});await page.body?.cancel();if(!page.ok||!page.headers.get('content-type')?.includes('text/html'))throw new Error('Public destination unavailable. No print QR generated.');}
 await mkdir(directory,{recursive:true});
 for(const[key,url]of Object.entries(links)){const assets=await qrAssets(url);await writeFile(resolve(directory,key+'.png'),assets.png);await writeFile(resolve(directory,key+'.svg'),assets.svg);}
 const cards=[['survey','Chia sẻ trải nghiệm','Khảo sát cảm quan mẫu thử Musuroom'],['judge','Cổng giám khảo','Đăng nhập để xem hồ sơ & kết quả']];
 const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
 const card=([key,title,description])=>`<article><div class="brand">m. <span>musuroom</span></div><h2>${title}</h2><p>${description}</p><img src="${key}.svg" alt="QR ${title}"><a href="${escape(links[key])}">${escape(links[key])}</a><small>Musuroom 1 · Mẫu thử nghiên cứu</small></article>`;
 await writeFile(resolve(directory,'IN_QR_A4.html'),`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Musuroom 1 · QR để in</title><style>@page{size:A4;margin:12mm}*{box-sizing:border-box}body{margin:0;color:#10271e;background:#f5f6ef;font-family:Arial,sans-serif}.instructions{max-width:186mm;margin:20px auto}.sheet{width:186mm;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:8mm}article{background:white;border:1px dashed #b5beb0;border-radius:6mm;padding:7mm;text-align:center;break-inside:avoid}.brand{font-size:24px;font-weight:bold}.brand span{font-size:16px}h2{font-size:20px;margin:5mm 0 2mm}p{font-size:13px;margin:0}img{display:block;width:44mm;height:44mm;margin:4mm auto}a{display:block;overflow-wrap:anywhere;font-size:10px;color:inherit}small{display:block;font-size:10px;margin-top:3mm}@media print{body{background:white}.instructions{display:none}.sheet{width:auto}}</style><div class="instructions"><h1>Musuroom 1 — QR bao bì & poster</h1><p>In A4 ở tỉ lệ 100%. Mỗi QR rộng 44 mm, giữ nguyên nền trắng và khoảng trống. Dùng file SVG để phóng lớn trên poster. Quét thử bản in bằng điện thoại trước khi dán. QR giám khảo chỉ mở cổng đăng nhập; gửi mã truy cập riêng cho người được mời.</p></div><main class="sheet">${[...cards,...cards,...cards].map(card).join('')}</main></html>`);
 await writeFile(resolve(directory,'manifest.json'),JSON.stringify({...releaseInfo,generated_at:new Date().toISOString(),verified_public_origin:new URL(base).origin,links,access_codes_included:false},null,2));
 console.log('Verified public QR and printable A4 sheet:',directory);
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const base=process.argv[2];if(!base)throw new Error('Usage: pnpm qr:generate https://REAL-DOMAIN');await generateQr(base,resolve(import.meta.dirname,'../dist/qr'));}
