import { MongoClient } from 'mongodb';
import validator from './mongo-schema.json' with {type:'json'};
export function mongoOperations(items) {
 // Match by _id, then replace only with an equal/newer revision. This also clears withdrawn fields.
 return items.map(document=>({updateOne:{filter:{_id:document._id},update:[{$replaceWith:{$cond:[{$lte:[{$ifNull:['$source_revision',0]},document.source_revision]},{$literal:document},'$$ROOT']}}],upsert:true}}));
}
export async function openMongoStore(config) {
 if(!config.mongoEnabled)throw new Error('MongoDB is disabled');
 const client=new MongoClient(config.mongoUri,{appName:'musuroom',maxPoolSize:3,minPoolSize:0,serverSelectionTimeoutMS:10000,connectTimeoutMS:10000,socketTimeoutMS:15000,timeoutMS:15000,tls:true});
 try{
  await client.connect();const db=client.db(config.mongoDatabase);await db.command({ping:1});
  if(!(await db.listCollections({name:'documents'},{nameOnly:true}).toArray()).length){try{await db.createCollection('documents',{validator,validationLevel:'strict',validationAction:'error'});}catch(error){if(error.code!==48)throw error;}}
  const documents=db.collection('documents');
  await documents.createIndex({source:1,type:1,resource_id:1},{unique:true,name:'source_type_resource'});
  await documents.createIndex({source:1,type:1,_id:1},{name:'source_type_cursor'});
  await documents.createIndex({source:1,'jev.topic':1,'jev.requires_review':1},{name:'jev_review'});
  return{async write(items){if(items.length)await documents.bulkWrite(mongoOperations(items),{ordered:true});},async read(after='',limit=25,type){return documents.find({source:config.mongoSource,_id:{$gt:after},...(type?{type}:{})}).sort({_id:1}).limit(limit).toArray();},close:()=>client.close()};
 }catch{await client.close().catch(()=>{});throw new Error('MongoDB connection or index setup failed. Check private URI, database user and Atlas network access.');}
}
