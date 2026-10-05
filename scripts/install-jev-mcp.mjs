import { readFileSync,writeFileSync,existsSync,copyFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { projectRoot } from '../backend/config.mjs';
import { jevMcpHeaders } from './jev-mcp-headers.mjs';

try{
 jevMcpHeaders(); // Validate privately before changing the user's configuration.
 const path=resolve(process.env.CODEX_HOME||resolve(homedir(),'.codex'),'config.toml');
 const original=existsSync(path)?readFileSync(path,'utf8'):'';
 if(/^\[mcp_servers\.jev(?:\]|\.)/m.test(original)){
  console.log('MCP Jev đã tồn tại; giữ nguyên cấu hình. Kiểm tra server trong Settings và chọn Restart.');
  process.exit(0);
 }
 const helper=`"${process.execPath}" "${resolve(projectRoot,'scripts/jev-mcp-headers.mjs')}"`;
 const block=`\n[mcp_servers.jev]\nurl = "https://www.jevai.org/api/mcp"\nhttp_headers_helper = ${JSON.stringify(helper)}\nstartup_timeout_sec = 20\ntool_timeout_sec = 30\nenabled = true\nrequired = false\n`;
 if(existsSync(path))copyFileSync(path,path+'.before-jev-'+Date.now()+'.bak');
 writeFileSync(path,original+block,'utf8');
 console.log('Đã thêm MCP Jev; key chỉ đọc từ .env. Khởi động lại MCP trong Settings.');
}catch(error){
 console.error('Không cài được MCP Jev. Kiểm tra .env và quyền ghi cấu hình Codex; secret không được in.');process.exitCode=1;
}
