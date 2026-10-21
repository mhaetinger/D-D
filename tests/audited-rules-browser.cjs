const assert=require('node:assert/strict');
const {auditScenarios}=require('../scripts/audit-phb-scenarios.cjs');
auditScenarios().then(report=>{
  assert.equal(report.summary.divergences,0,JSON.stringify(report.cases.filter(c=>!c.matches),null,2));
  console.log(`PASS ${report.summary.cases} cenários auditados: fórmulas/rolagem, cura, invocação, racial, mago sem duplicar gastos, PV/forma/descansos, multiclasse, iniciativa, metadados e carga.`);
}).catch(error=>{console.error(error);process.exitCode=1;});
