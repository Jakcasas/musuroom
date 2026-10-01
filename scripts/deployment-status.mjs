const uuid='[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
export function deploymentId(output) {
 const match=String(output).match(new RegExp('(?:deploymentId|deployment_id)"?\\s*[:=]\\s*"?('+uuid+')','i'))
  ||String(output).match(new RegExp('https://railway\\.(?:com|app)/[^\\s]*[?&]id=('+uuid+')','i'));
 if(!match)throw new Error('Railway did not return a deployment ID. Inspect the dashboard before verifying the release.');
 return match[1];
}
export function deploymentReady(list,id) {
 const item=list.find(row=>row.id===id);
 if(['FAILED','CRASHED','REMOVED','SKIPPED'].includes(item?.status))throw new Error('New Railway deployment failed. Inspect its build/deploy logs.');
 return item?.status==='SUCCESS';
}
