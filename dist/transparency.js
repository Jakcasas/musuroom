import { element,number } from './portal-ui.js';
const status=document.getElementById('sample-status');const list=document.getElementById('sample-list');
const metrics={moisture_percent:['Độ ẩm','%'],water_activity:['Hoạt độ nước (aw)',''],cielab_l:['Màu CIELAB L*',''],cielab_a:['Màu CIELAB a*',''],cielab_b:['Màu CIELAB b*',''],solubility_percent:['Độ hòa tan','%']};
const nutrients={energy_kcal:['Năng lượng','kcal'],protein_g:['Protein','g'],fat_g:['Chất béo','g'],carbohydrate_g:['Carbohydrate','g'],sodium_mg:['Natri','mg']};
try{
 const response=await fetch('/api/v1/product/batches',{signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error('unavailable');const data=await response.json();
 status.textContent=data.count?`${data.count} mẫu có hồ sơ được công bố.`:'Chưa có mẫu với số liệu đo được công bố. Dự án sẽ cập nhật sau khi hoàn thiện thử nghiệm và hồ sơ minh chứng.';
 for(const sample of data.items){const card=element('article','','feature-card');card.append(element('p',sample.sample_code,'eyebrow'),element('h2',sample.label),element('p','Nguồn nguyên liệu: '+sample.origin),element('p','Ngày đo: '+new Date(sample.measured_at+'T00:00:00Z').toLocaleDateString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})));
  if(sample.process_notes)card.append(element('p',sample.process_notes));
  for(const[group,definitions,title]of [[sample.metrics,metrics,'Chỉ tiêu đo'],[sample.nutrition,nutrients,'Dinh dưỡng / 100 g']]){if(!Object.keys(group).length)continue;card.append(element('h3',title));for(const[key,value]of Object.entries(group)){const[label,unit]=definitions[key]||[key,''];card.append(element('p',`${label}: ${number(value)} ${unit}`));}}
  const link=element('a','Xem hồ sơ trong cổng giám khảo ↗','arrow-link');link.href='giam-khao.html';card.append(link);list.append(card);
 }
}catch{status.textContent='Chưa thể tải hồ sơ. Vui lòng tải lại trang sau.';status.classList.add('error');}
