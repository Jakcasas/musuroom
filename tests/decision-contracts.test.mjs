import test from 'node:test';
import assert from 'node:assert/strict';
import {decisionSchemas,labelRunRequestSchema,validKnowledgeState,decisionEventSchema,mongoDecisionValidator} from '../backend/services/decision-contracts.mjs';
import {labelScope,createAtlasLabeling} from '../backend/services/atlas-labeling.mjs';
test('JSON contracts constrain batch limits and refuse arbitrary remote data or decision fields',()=>{
 assert.deepEqual(labelRunRequestSchema.parse({allow_remote:false}),{limit:100,allow_remote:false});
 for(const request of [{limit:10001,allow_remote:true},{limit:5,allow_remote:'true'},{limit:5,allow_remote:true,collection:'app_judge_accounts'}])assert.equal(labelRunRequestSchema.safeParse(request).success,false);
 assert.equal(validKnowledgeState({data:{title:'Nấm',summary:'',body:'Thử nghiệm',limitation:''}}).success,true);
 assert.equal(validKnowledgeState({data:{title:{$where:'code'}}}).success,false);
 assert.equal(decisionSchemas.knowledge_state.additionalProperties,false);
 const mongo=mongoDecisionValidator().$jsonSchema;assert.equal(mongo.additionalProperties,false);assert.equal(mongo.properties.fallback_used.bsonType,'bool');assert.deepEqual(mongo.properties.source_revision.bsonType,['int','long','double']);
 assert.equal(decisionEventSchema.safeParse({provider:'jev',confidence:2}).success,false);
});
test('Labeling scope fixes source, public record type, keyset cursor and high water mark',()=>{
 assert.deepEqual(labelScope('musuroom-production','a','z'),{source:'musuroom-production',type:'knowledge',active:true,_id:{$gt:'a',$lte:'z'}});
 assert.throws(()=>createAtlasLabeling({dialect:'sqlite'},{}),error=>error.code==='atlas_primary_required');
});
