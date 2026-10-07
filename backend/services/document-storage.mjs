import { resolve, sep } from 'node:path';
import { readFile, realpath, mkdir, writeFile, stat } from 'node:fs/promises';
export function documentStorage(config,fetchImpl=fetch,database){
 const valid=name=>/^[0-9a-f-]{36}\.(pdf|txt|csv|docx|xlsx|png|jpg|webp|mp4)$/.test(name);
 const headers={apikey:config.storageKey,Authorization:`Bearer ${config.storageKey}`};
 const url=name=>`${config.supabaseUrl}/storage/v1/object/${config.storageBucket}/${name}`;
 return {
  async read(name){
   if(!valid(name))throw new Error('invalid_document_path');
   if(config.storageProvider==='mongodb'){
    if(!database?.files)throw new Error('MongoDB document storage is not initialized');
    const file=await database.files.find({_id:name}).next();
    if(!file||file.length>50*1024*1024)throw new Error('document_unavailable');
    const chunks=[];let length=0;const stream=database.files.openDownloadStream(name);
    try{for await(const chunk of stream){length+=chunk.length;if(length>50*1024*1024)throw new Error('document_too_large');chunks.push(chunk);}return Buffer.concat(chunks);}
    finally{stream.destroy();}
   }
   if(config.storageProvider==='supabase'){
    const response=await fetchImpl(url(name),{headers,signal:AbortSignal.timeout(20000),redirect:'error'});
    if(!response.ok)throw new Error('document_unavailable');
    const declared=Number(response.headers.get('content-length')||0);if(declared>50*1024*1024)throw new Error('document_too_large');
    const chunks=[];let length=0;for await(const chunk of response.body){length+=chunk.length;if(length>50*1024*1024)throw new Error('document_too_large');chunks.push(chunk);}return Buffer.concat(chunks);
   }
   const root=await realpath(config.documentRoot);const path=await realpath(resolve(root,name));if(!path.startsWith(root+sep))throw new Error('invalid_document_path');const info=await stat(path);if(!info.isFile()||info.size>50*1024*1024)throw new Error('document_too_large');return readFile(path);
  },
  async write(name,bytes,mime){
   if(!valid(name))throw new Error('invalid_document_path');
   if(!bytes.length||bytes.length>50*1024*1024)throw new Error('document_too_large');
   if(config.storageProvider==='mongodb'){
    if(!database?.files)throw new Error('MongoDB document storage is not initialized');
    const stream=database.files.openUploadStreamWithId(name,name,{metadata:{mime}});
    await new Promise((resolve,reject)=>{stream.once('finish',resolve);stream.once('error',reject);stream.end(bytes);});
    return;
   }
   if(config.storageProvider==='supabase'){
    // Bucket must already be private; never create a public bucket implicitly.
    const bucket=await fetchImpl(`${config.supabaseUrl}/storage/v1/bucket/${config.storageBucket}`,{headers,signal:AbortSignal.timeout(15000),redirect:'error'});
    if(!bucket.ok || (await bucket.json()).public!==false)throw new Error('Private Supabase bucket is required');
    const response=await fetchImpl(url(name),{method:'POST',headers:{...headers,'Content-Type':mime,'x-upsert':'false'},body:bytes,signal:AbortSignal.timeout(30000),redirect:'error'});
    if(!response.ok)throw new Error('Document upload failed');return;
   }
   await mkdir(config.documentRoot,{recursive:true});await writeFile(resolve(config.documentRoot,name),bytes,{flag:'wx',mode:0o600});
  }
 };
}
