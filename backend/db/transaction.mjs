export async function transaction(db, work) {
  if(db.transaction)return db.transaction(work);
  await db.exec('BEGIN IMMEDIATE');
  try{const result=await work();await db.exec('COMMIT');return result;}
  catch(error){await db.exec('ROLLBACK');throw error;}
}
