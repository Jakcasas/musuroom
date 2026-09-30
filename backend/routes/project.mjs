import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { codePattern } from '../services/sensory-metrics.mjs';
export const isMeasurementEvidence = doc => doc?.evidence_status === 'FINAL' && ['COA','REPORT'].includes(doc.doc_type);
export function validateSample(body){
 const errors={};const result={};
 if(!body || typeof body!=='object' || Array.isArray(body))return{errors:{body:'Cần JSON object.'}};
 for(const [key,min,max]of [['sample_code',3,50],['label',2,120],['origin',2,500],['process_notes',0,2000]]){const value=body[key]??'';if(typeof value!=='string'||value.trim().length<min||value.length>max)errors[key]='Độ dài nội dung không hợp lệ.';else result[key]=value.trim();}
 if(!codePattern.test(result.sample_code||''))errors.sample_code='Mã mẫu cần 3–50 ký tự chữ/số/_/-.';
 if(typeof body.measured_at!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(body.measured_at)||!Number.isFinite(Date.parse(body.measured_at))||new Date(body.measured_at).toISOString().slice(0,10)!==body.measured_at)errors.measured_at='Cần ngày đo thực tế YYYY-MM-DD.';
 result.measured_at=body.measured_at;
 if(typeof body.evidence_document_id!=='string'||!/^[0-9a-f-]{36}$/i.test(body.evidence_document_id))errors.evidence_document_id='Cần ID tài liệu minh chứng.';result.evidence_document_id=body.evidence_document_id;
 const limits={metrics:{moisture_percent:[0,100],water_activity:[0,1],cielab_l:[0,100],cielab_a:[-128,127],cielab_b:[-128,127],solubility_percent:[0,100]},nutrition:{energy_kcal:[0,1000],protein_g:[0,100],fat_g:[0,100],carbohydrate_g:[0,100],sodium_mg:[0,100000]}};
 for(const group of ['metrics','nutrition']){const values=body[group]??{};result[group]={};if(!values||typeof values!=='object'||Array.isArray(values)){errors[group]='Cần object các chỉ tiêu đo.';continue;}for(const[key,value]of Object.entries(values)){const range=Object.hasOwn(limits[group],key)?limits[group][key]:null;if(!range||!Number.isFinite(value)||value<range[0]||value>range[1])errors[group]='Chỉ tiêu hoặc giá trị đo không hợp lệ.';else result[group][key]=value;}}
 if(!Object.keys(result.metrics).length&&!Object.keys(result.nutrition).length)errors.measurements='Cần ít nhất một chỉ tiêu đo thực tế có minh chứng.';
 result.publication_status=body.publication_status??'PRIVATE';if(!['PRIVATE','PUBLIC'].includes(result.publication_status))errors.publication_status='Chọn PRIVATE hoặc PUBLIC.';
 return{input:result,errors};
}
export function projectRouter(db,security,config){
 const router=Router();
 const list=async()=> (await db.prepare("SELECT p.id,p.sample_code,p.label,p.origin,p.process_notes,p.metrics_json,p.nutrition_json,p.measured_at,p.evidence_document_id FROM product_samples p JOIN quality_documents d ON d.id=p.evidence_document_id WHERE p.publication_status='PUBLIC' AND d.evidence_status='FINAL' AND d.doc_type IN ('COA','REPORT') ORDER BY p.measured_at DESC,p.sample_code").all()).map(row=>{const{metrics_json,nutrition_json,...metadata}=row;return{...metadata,metrics:JSON.parse(metrics_json),nutrition:JSON.parse(nutrition_json),nutrition_basis:'per 100 g',evidence_access:'authenticated_judge_portal'};});
 router.get('/project/overview',(req,res)=>res.json({brand:'Musuroom',release:'Musuroom 1',title:'Phát triển bột gia vị từ phụ phẩm nấm ăn để giảm lãng phí thực phẩm',stage:'Nghiên cứu và hoàn thiện',scope:'Phần cắt tỉa của nấm ăn còn phù hợp làm thực phẩm; không dùng giá thể, nấm hỏng hoặc nguyên liệu không rõ nguồn.',deployment:config.production?'cloud':'local',survey_url:'/trai-nghiem.html',judge_url:'/giam-khao.html'}));
 router.get('/product/batches',async(req,res)=>{const items=await list();res.json({items,count:items.length,notice:'Chỉ hiển thị mẫu có dữ liệu đo, minh chứng và đã được người vận hành cho phép công bố. Mẻ tính ước tính được quản lý riêng.'});});
 router.get('/product/nutrition',async(req,res)=>{const items=(await list()).filter(x=>Object.keys(x.nutrition).length);res.json({items,available:items.length>0,comparison_available:false,notice:'Chưa có số liệu đối chứng để so sánh với gia vị khác. Dữ liệu dinh dưỡng chỉ được công bố theo mẫu đo có tài liệu minh chứng.'});});
 router.post('/admin/product-samples',security.requireAdmin,async(req,res)=>{
  const {input,errors}=validateSample(req.body);if(Object.keys(errors).length)return res.status(422).json({errors});
  const doc=await db.prepare('SELECT evidence_status,doc_type FROM quality_documents WHERE id=?').get(input.evidence_document_id);
  if(!isMeasurementEvidence(doc))return res.status(422).json({errors:{evidence_document_id:'Cần phiếu kiểm nghiệm COA hoặc báo cáo đo REPORT đã hoàn thiện.'}});
  if(await db.prepare('SELECT id FROM product_samples WHERE sample_code=?').get(input.sample_code))return res.status(409).json({error:'sample_code_exists'});
  const id=randomUUID();const inserted=await db.prepare('INSERT INTO product_samples(id,sample_code,label,origin,process_notes,metrics_json,nutrition_json,measured_at,evidence_document_id,publication_status) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(sample_code) DO NOTHING').run(id,input.sample_code,input.label,input.origin,input.process_notes,JSON.stringify(input.metrics),JSON.stringify(input.nutrition),input.measured_at,input.evidence_document_id,input.publication_status);
  if(!inserted.changes)return res.status(409).json({error:'sample_code_exists'});
  await security.audit(req.principal.account_id,'SAMPLE_REGISTERED',id);res.status(201).json({id,sample_code:input.sample_code,publication_status:input.publication_status});
 });
 return router;
}
