import { openDatabase } from './database.mjs';
export async function openConfiguredDatabase(config) {
 if(config.databaseProvider==='mongodb'){
  const {openMongoDatabase}=await import('./mongodb.mjs');
  return openMongoDatabase(config);
 }
 if(config.databaseProvider!=='postgres')return openDatabase(config.databasePath);
 const { openPostgres }=await import('./postgres.mjs');
 return openPostgres(config);
}
