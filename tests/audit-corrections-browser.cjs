const assert=require('node:assert/strict');
const {auditBookUI}=require('../scripts/audit-book-ui.cjs');
auditBookUI().then(result=>{
  assert.equal(result.summary.divergences,0,JSON.stringify(result.cases.filter(c=>!c.matches),null,2));
  console.log(`PASS ${result.summary.cases} casos das correções de auditoria: fórmulas/rolagem, PV, concentração/cancelamento, físico/OFF, semana da aventura, consulta e mobile.`);
}).catch(error=>{console.error(error);process.exitCode=1;});
