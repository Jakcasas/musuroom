import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {parseEnv} from 'node:util';
import {loadConfig,projectRoot} from '../backend/config.mjs';
import {readCloudEnvironment} from './cloud-config.mjs';
import {createJevClassifier} from '../backend/services/jev.mjs';
import {jevConnectionStatus} from '../backend/services/jev-client.mjs';
try{
 const path=resolve(projectRoot,'.env');
 const config=process.argv.includes('--cloud')?readCloudEnvironment().config:loadConfig({...(existsSync(path)?parseEnv(readFileSync(path,'utf8')):{}),...process.env});
 const result=await createJevClassifier(config)('Nhận xét minh họa kiểm tra kết nối Musuroom: mùi nấm thơm.',true);
 console.log(JSON.stringify({connection:jevConnectionStatus(config),verification:{mode:result.mode,reason:result.reason||null,requires_review:result.requires_review}},null,2));
 if(result.mode!=='jev')process.exitCode=1;
}catch{console.error('Không kiểm tra được Jev. Kiểm tra cấu hình riêng tư; key và phản hồi thô không được in.');process.exitCode=1;}
