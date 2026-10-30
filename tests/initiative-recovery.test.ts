import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initiativeRecovery,initiativeRecoveryFeatures,applyInitiativeRecovery,initiativeRecoveryDescription} from '../src/rules/initiative-recovery';
import {resourcesFor,remaining,resetResources,spend} from '../src/rules/resources';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');
function make(id='guerreiro',level=15,subclassId='mestreBatalha'){
  const c=warrior();c.classes=[{classId:id,level,subclassId,subclass:'',hitDie:E.data.classes[id].die,hitDiceUsed:0}];
  c.rules={raceId:'humano',history:[]};c.abilities.cha.score=18;
  c.ruleState={version:1,used:{'guerreiro:superiority':6,'bardo:inspiration':4},pools:{'monge:ki':0},active:{},targets:{}};return c;
}
const resource=(c:any,id:string)=>resourcesFor(c,E).find(r=>r.id===id)!;
test('Implacável exige Mestre de Batalha 15 próprio, não nível total, outras subclasses ou escolhas antigas',()=>{
  const c=make();assert.deepEqual(initiativeRecoveryFeatures(c,E).map(f=>f.name),['Implacável']);
  c.classes[0].level=14;c.classes.push({classId:'ladino',level:6});assert.equal(initiativeRecovery(c,E).recoveries.length,0);
  c.classes[0].level=15;c.classes[0].subclassId='campeao';assert.equal(initiativeRecovery(c,E).recoveries.length,0);
  c.classes=[];assert.equal(initiativeRecovery(c,E).recoveries.length,0);
});
test('Implacável devolve exatamente um dado da reserva existente, sem reset, e uma segunda consulta/aplicação não acumula',()=>{
  const c=make(),before=JSON.stringify(c),p=initiativeRecovery(c,E);
  assert.equal(p.recoveries[0].amount,1);assert.equal(p.recoveries[0].resource.id,'guerreiro:superiority');assert.equal(JSON.stringify(c),before);
  applyInitiativeRecovery(c,E);assert.equal(c.ruleState.used['guerreiro:superiority'],5);assert.equal(remaining(c,resource(c,'guerreiro:superiority')),1);
  assert.equal(c.ruleState.used['bardo:inspiration'],4);assert.equal(c.ruleState.pools['monge:ki'],0);
  const recovered=JSON.stringify(c);assert.equal(applyInitiativeRecovery(c,E).recoveries.length,0);assert.equal(JSON.stringify(c),recovered);
});
test('dado adicional do Adepto Marcial impede Implacável enquanto qualquer origem tiver saldo; recuperar não recria o dado do talento',()=>{
  const c=make();c.rules.history=[{classId:'guerreiro',level:4,answers:{feat:'Adepto Marcial',featManeuvers:['Aparar','Inspirar']}}];
  assert.equal(initiativeRecovery(c,E).recoveries.length,0);c.ruleState.used['feat:superiority']=1;
  applyInitiativeRecovery(c,E);assert.equal(c.ruleState.used['guerreiro:superiority'],5);assert.equal(c.ruleState.used['feat:superiority'],1);
  c.ruleState.used['guerreiro:superiority']=6;c.ruleState.used['feat:superiority']=0;assert.equal(initiativeRecovery(c,E).recoveries.length,0);
  c.rules.history=[{classId:'guerreiro',level:16,answers:{feat:'Adepto Marcial'}}];
  applyInitiativeRecovery(c,E);assert.equal(c.ruleState.used['guerreiro:superiority'],5);assert.equal(c.ruleState.used['feat:superiority'],0,'o talento futuro não cria outra reserva nem apaga o registro antigo');
});
test('Inspiração Superior recupera um uso só no bardo 20 vazio, preservando inspiração heroica e outras reservas',()=>{
  const c=make('bardo',20,'conhecimento');c.heroicInspiration=true;c.ruleState.inspirationReady=true;
  const plan=applyInitiativeRecovery(c,E);assert.match(initiativeRecoveryDescription(plan),/Inspiração Superior.*1 uso.*\(1\/4\)/);
  assert.equal(c.ruleState.used['bardo:inspiration'],3);assert.equal(c.heroicInspiration,true);assert.equal(c.ruleState.inspirationReady,true);
  assert.equal(c.ruleState.used['guerreiro:superiority'],6);assert.equal(c.ruleState.pools['monge:ki'],0);
  c.classes[0].level=19;c.classes.push({classId:'guerreiro',level:1});c.ruleState.used['bardo:inspiration']=4;assert.equal(initiativeRecovery(c,E).recoveries.length,0);
});
test('Auto Aperfeiçoamento recupera quatro Chi somente quando o monge 20 está em zero',()=>{
  const c=make('monge',20,'sombras');assert.equal(applyInitiativeRecovery(c,E).recoveries[0].amount,4);assert.equal(c.ruleState.pools['monge:ki'],4);
  const after=JSON.stringify(c);assert.equal(applyInitiativeRecovery(c,E).recoveries.length,0);assert.equal(JSON.stringify(c),after);
  c.ruleState.pools['monge:ki']=1;assert.equal(initiativeRecovery(c,E).recoveries.length,0);
  c.ruleState.pools['monge:ki']=0;c.classes[0].level=19;c.classes.push({classId:'ladino',level:1});assert.equal(initiativeRecovery(c,E).recoveries.length,0);
});
test('máximos ajustados limitam recuperação sem apagar gastos; máximo zero e reserva ainda disponível não concedem usos',()=>{
  const c=make();c.rules.resourceMaxOverrides={'guerreiro:superiority':2};c.ruleState.used['guerreiro:superiority']=2;
  applyInitiativeRecovery(c,E);assert.equal(c.ruleState.used['guerreiro:superiority'],1);assert.equal(c.rules.resourceMaxOverrides['guerreiro:superiority'],2);
  c.rules.resourceMaxOverrides['guerreiro:superiority']=0;c.ruleState.used['guerreiro:superiority']=0;assert.equal(initiativeRecovery(c,E).recoveries.length,0);
  const m=make('monge',20);m.rules.resourceMaxOverrides={'monge:ki':2};assert.equal(applyInitiativeRecovery(m,E).recoveries[0].amount,2);assert.equal(m.ruleState.pools['monge:ki'],2);
  const b=make('bardo',20);b.abilities.cha.score=8;b.ruleState.used['bardo:inspiration']=1;applyInitiativeRecovery(b,E);assert.equal(b.ruleState.used['bardo:inspiration'],0);
});
test('registros ilegíveis ou acima do máximo são preservados; não transformam erro em reserva vazia',()=>{
  for(const [id,key,cls] of [['guerreiro:superiority','used','guerreiro'],['bardo:inspiration','used','bardo'],['monge:ki','pools','monge']]){
    for(const value of [null,'0',-1,0.5,NaN,Infinity,1000]){
      const c=make(cls,cls==='guerreiro'?15:20);c.ruleState[key][id]=value;const before=structuredClone(c);
      const plan=applyInitiativeRecovery(c,E);assert.equal(plan.recoveries.length,0);assert.equal(plan.warnings.length,1);assert.deepEqual(c,before);
    }
  }
  const c=make();c.rules.history=[{classId:'guerreiro',level:4,answers:{feat:'Adepto Marcial'}}];c.ruleState.used['feat:superiority']='1';
  const before=JSON.stringify(c);assert.equal(applyInitiativeRecovery(c,E).warnings.length,1);assert.equal(JSON.stringify(c),before);
});
test('registros ausentes têm o saldo inicial já usado pelo app, sem criar recursos ao consultar',()=>{
  for(const cls of ['guerreiro','bardo','monge']){
    const c=make(cls,cls==='guerreiro'?15:20);delete c.ruleState;const before=JSON.stringify(c);
    assert.equal(applyInitiativeRecovery(c,E).recoveries.length,0);assert.equal(JSON.stringify(c),before);
  }
});
test('gasto posterior e descansos usam a mesma reserva recuperada, sem contadores de combate extras',()=>{
  const c=make();applyInitiativeRecovery(c,E);spend(c,resource(c,'guerreiro:superiority'));assert.equal(c.ruleState.used['guerreiro:superiority'],6);
  applyInitiativeRecovery(c,E);assert.equal(c.ruleState.used['guerreiro:superiority'],5);resetResources(c,'short',E);assert.equal(c.ruleState.used['guerreiro:superiority'],0);assert.equal(initiativeRecovery(c,E).recoveries.length,0);
  const m=make('monge',20);applyInitiativeRecovery(m,E);spend(m,resource(m,'monge:ki'),4);assert.equal(m.ruleState.pools['monge:ki'],0);
  applyInitiativeRecovery(m,E);resetResources(m,'long',E);assert.equal(m.ruleState.pools['monge:ki'],20);
});
