import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createApp } from './backend/app.mjs';
import { loadConfig, projectRoot } from './backend/config.mjs';
import { openConfiguredDatabase } from './backend/db/configured.mjs';
import { startDataWorker } from './backend/services/data-worker.mjs';
export { createApp };
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const path = resolve(projectRoot, '.env');
  if (existsSync(path)) loadEnvFile(path);
  const config = loadConfig();
  const database=await openConfiguredDatabase(config);
  const server = createApp({ config,database });
  server.stopDataWorker=startDataWorker(database,config);
  server.listen(config.port, config.host, () => console.log(`Musuroom 1: ${config.publicOrigin || `http://${config.host}:${config.port}`}/`));
  server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? 'Port is already in use.' : 'Server could not start.'); process.exitCode = 1; });
  for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => {const force=setTimeout(()=>process.exit(1),10000);force.unref();server.close(async()=>{await server.databaseClosed;clearTimeout(force);process.exit(0);});});
}
