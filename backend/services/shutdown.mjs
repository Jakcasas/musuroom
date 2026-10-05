// Railway sends SIGTERM before its draining deadline. Stop new work, preserve
// requests already running, and leave enough time to close database resources.
export function createShutdownHandler(server,{timeoutMs=30000,exit=code=>process.exit(code),log=message=>console.log(message),error=message=>console.error(message)}={}) {
 let started=false,finished=false;
 const finish=code=>{if(finished)return;finished=true;clearTimeout(force);exit(code);};
 let force;
 return ()=>{
  if(started)return;
  started=true;
  server.setDraining?.();
  log('Musuroom is draining requests before shutdown.');
  force=setTimeout(()=>{server.closeAllConnections?.();error('Shutdown deadline reached; unfinished work will retry after restart.');finish(1);},timeoutMs);
  force.unref();
  const stopWorker=server.stopDataWorker;
  const workerStopped=Promise.resolve().then(()=>stopWorker?.());
  // Capture a rejection immediately, then surface it through databaseClosed.
  workerStopped.catch(()=>{});
  server.stopDataWorker=()=>workerStopped;
  server.close(async closeError=>{
   try{await server.databaseClosed;if(closeError)throw closeError;log('Musuroom shutdown completed.');finish(0);}
   catch{error('Shutdown cleanup failed; no credentials were logged.');finish(1);}
  });
 };
}
