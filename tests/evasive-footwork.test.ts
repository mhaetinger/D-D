import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canStartEvasiveFootwork,evasiveFootworkBonus,finishEvasiveFootwork,knowsEvasiveFootwork,previewEvasiveFootwork,startEvasiveFootwork,type EvasiveChoice} from '../src/rules/evasive-footwork';
import {readEvasiveFootwork} from '../src/rules/evasive-footwork-state';
import {armorClass,applyDamage} from '../src/rules/combat';
import {setCondition} from '../src/rules/conditions';
import {healHitPoints,markDead,returnToLife,syncIncapacity} from '../src/rules/health';
import {resetResources} from '../src/rules/resources';
import {validateCharacters} from '../src/storage/validation';
import {editSheetField} from '../src/sheet-edit/model';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');
function make(level=5){
  const c=warrior();c.classes=[{classId:'guerreiro',level,subclassId:'mestreBatalha',subclass:'Mestre de Batalha',hitDie:10,hitDiceUsed:0}];
  c.hpCurrent=c.hpMax=80;c.hpTemp=0;c.speed=9;
  c.rules={raceId:'humano',history:[{classId:'guerreiro',level:3,answers:{maneuvers:['Passo Evasivo','Aparar','Ataque de Precisão']}}]};
  c.ruleState={version:1,used:{},pools:{},active:{},targets:{},portent:[],conditions:{}};return c;
}
const choice=(source='guerreiro:superiority',face=4):EvasiveChoice=>({source,face,moving:true});
test('Passo Evasivo exige conhecimento vigente; talento sobrevive à troca de subclasse',()=>{
  const c=make();assert.equal(knowsEvasiveFootwork(c,E),true);c.classes[0].level=2;assert.equal(knowsEvasiveFootwork(c,E),false);
  c.classes[0].level=5;c.rules.history[0].level=7;assert.equal(knowsEvasiveFootwork(c,E),false);c.rules.history[0].level=3;
  c.classes[0].subclassId='campeao';assert.equal(knowsEvasiveFootwork(c,E),false);
  c.rules.history.push({classId:'guerreiro',level:4,answers:{feat:'Adepto Marcial',featManeuvers:['Passo Evasivo','Inspirar']}});
  assert.equal(previewEvasiveFootwork(c,choice('feat:superiority'),E).source.die,6);assert.equal(canStartEvasiveFootwork(c,E,'guerreiro:superiority'),false);
});
test('prévia é pura; dados aprimorados usam nível próprio e não o total multiclasse',()=>{
  const c=make(9),before=structuredClone(c);previewEvasiveFootwork(c,choice(),E);assert.deepEqual(c,before);
  c.classes.push({classId:'ladino',level:9});assert.equal(previewEvasiveFootwork(c,choice(),E).source.die,8);
  c.classes[0].level=10;assert.equal(previewEvasiveFootwork(c,choice(),E).source.die,10);c.classes[0].level=18;assert.equal(previewEvasiveFootwork(c,choice('guerreiro:superiority',12),E).source.die,12);
});
test('CA soma apenas a face a todas as fórmulas, sem duplicar ajuste, escudo, Defesa ou magias',()=>{
  const c=make();c.rules.history[0].answers.fighting='Defesa';c.acAdjustment=2;c.armorMagicBonus=1;c.shieldEquipped=true;c.shieldMagicBonus=1;c.ruleState.active['spell:shield']=true;c.ruleState.active['spell:shieldOfFaith']=true;
  const before=armorClass(c,E);startEvasiveFootwork(c,choice(),E);const after=armorClass(c,E);assert.equal(after.total,before.total+4);assert.deepEqual(after.options.map((x:any)=>x.total),before.options.map((x:any)=>x.total+4));assert.match(after.explanation,/Passo Evasivo 4 \(até parar/);
  finishEvasiveFootwork(c);assert.deepEqual(armorClass(c,E),before);assert.equal(c.ruleState.used['guerreiro:superiority'],1);
  for(const mode of ['manual','written']){c.baseAcArmor=22;c.rules.manualMode=mode==='manual';c.rules.fieldOverrides={armor:mode==='written'};c.acFormula=mode==='manual'?'legacy':'written';const base=armorClass(c,E).total;startEvasiveFootwork(c,choice(),E);assert.equal(armorClass(c,E).total,base+4);finishEvasiveFootwork(c);}
});
test('uma única ativação, mesmo com duas origens; encerrar não recupera dado e começar de novo paga outra vez',()=>{
  const c=make();c.rules.history.push({classId:'guerreiro',level:4,answers:{feat:'Adepto Marcial',featManeuvers:['Passo Evasivo','Inspirar']}});
  startEvasiveFootwork(c,choice(),E);const before=structuredClone(c);assert.throws(()=>startEvasiveFootwork(c,choice('feat:superiority'),E),/Encerre/);assert.deepEqual(c,before);
  finishEvasiveFootwork(c);startEvasiveFootwork(c,choice('feat:superiority',6),E);assert.equal(evasiveFootworkBonus(c,E),6);assert.deepEqual(c.ruleState.used,{'guerreiro:superiority':1,'feat:superiority':1});
});
test('não exige ação/reação, visão ou estar de pé; incapacitação isolada não impede mover-se',()=>{
  const c=make();c.ruleState.conditions={incapacitado:true,cego:true,surdo:true,caido:true,amedrontado:true};startEvasiveFootwork(c,choice(),E);assert.equal(evasiveFootworkBonus(c,E),4);
  syncIncapacity(c);assert.equal(evasiveFootworkBonus(c,E),4);assert.equal(c.ruleState.used['guerreiro:superiority'],1);
});
test('condições que impedem movimento encerram definitivamente; remover condição não restaura o bônus',()=>{
  for(const id of ['agarrado','impedido','atordoado','inconsciente','paralisado','petrificado']){
    const c=make();startEvasiveFootwork(c,choice(),E);setCondition(c,id,true);assert.equal(readEvasiveFootwork(c),null);assert.equal(evasiveFootworkBonus(c,E),0);assert.equal(c.ruleState.used['guerreiro:superiority'],1);setCondition(c,id,false);assert.equal(evasiveFootworkBonus(c,E),0);
    assert.throws(()=>{setCondition(c,id,true);startEvasiveFootwork(c,choice(),E);});
  }
  // Um registro carregado junto de condição impeditiva também não renasce ao removê-la.
  const c=make();startEvasiveFootwork(c,choice(),E);c.ruleState.conditions.agarrado=true;setCondition(c,'agarrado',false);assert.equal(readEvasiveFootwork(c),null);
});
test('queda, morte e exaustão com deslocamento zero encerram; dano absorvido e cura comum não encerram sem parada',()=>{
  const c=make();startEvasiveFootwork(c,choice(),E);c.hpTemp=10;applyDamage(c,5,E);assert.equal(evasiveFootworkBonus(c,E),4);healHitPoints(c,1);assert.equal(evasiveFootworkBonus(c,E),4);
  c.hpCurrent=1;c.hpTemp=0;applyDamage(c,1,E);assert.equal(readEvasiveFootwork(c),null);healHitPoints(c,1);assert.equal(evasiveFootworkBonus(c,E),0);
  for(const setup of ['death','exhaustion','zero']){const c=make();startEvasiveFootwork(c,choice(),E);if(setup==='death')markDead(c);if(setup==='exhaustion'){c.exhaustion=5;syncIncapacity(c);}if(setup==='zero'){c.hpCurrent=0;healHitPoints(c,1);}assert.equal(readEvasiveFootwork(c),null);}
  const stale=make();startEvasiveFootwork(stale,choice(),E);stale.ruleState.death={dead:true};stale.hpCurrent=0;returnToLife(stale,10);assert.equal(readEvasiveFootwork(stale),null);
});
test('descanso curto/longo encerra movimento e recupera reservas pelo fluxo existente',()=>{
  for(const kind of ['short','long'] as const){const c=make();startEvasiveFootwork(c,choice(),E);resetResources(c,kind,E);assert.equal(evasiveFootworkBonus(c,E),0);assert.equal(readEvasiveFootwork(c),null);assert.equal(c.ruleState.used['guerreiro:superiority'],0);}
});
test('faces/origens/declaração e registros ilegíveis são rejeitados antes de qualquer gasto',()=>{
  for(const patch of [{moving:false},{source:'bardo:inspiration'},...[0,9,-1,2.5,NaN].map(face=>({face}))]){const c=make(),before=structuredClone(c);assert.throws(()=>startEvasiveFootwork(c,{...choice(),...patch},E));assert.deepEqual(c,before);}
  for(const value of [null,'0',-1,.5,NaN,5]){const c=make();c.ruleState.used['guerreiro:superiority']=value;const before=structuredClone(c);assert.throws(()=>startEvasiveFootwork(c,choice(),E),/preservado/);assert.deepEqual(c,before);}
  for(const key of ['ruleState','used'])for(const value of [[],7,'ilegível']){const c=make();if(key==='ruleState')c.ruleState=value;else c.ruleState.used=value;const before=structuredClone(c);assert.throws(()=>startEvasiveFootwork(c,choice(),E));assert.deepEqual(c,before);}
});
test('registro de efeito ilegível/futuro não dá bônus nem é apagado ao encerrar, curar ou descansar',()=>{
  for(const value of [null,true,[],{version:2,face:4},{version:1,source:'feat:superiority',die:6,face:7}]){const c=make();c.ruleState.evasiveFootwork=value;const before=structuredClone(value);assert.equal(evasiveFootworkBonus(c,E),0);assert.throws(()=>startEvasiveFootwork(c,choice(),E),/ilegível/);assert.throws(()=>finishEvasiveFootwork(c),/preservados/);healHitPoints(c,0);resetResources(c,'short',E);assert.deepEqual(c.ruleState.evasiveFootwork,before);}
});
test('máximos ajustados e deslocamento são respeitados; forma/treino removido não recebem bônus humano',()=>{
  const c=make();c.rules.resourceMaxOverrides={'guerreiro:superiority':1};startEvasiveFootwork(c,choice(),E);finishEvasiveFootwork(c);assert.equal(canStartEvasiveFootwork(c,E,'guerreiro:superiority'),false);
  c.ruleState.used={};c.speed=0;assert.equal(canStartEvasiveFootwork(c,E,'guerreiro:superiority'),false);c.speed=9;startEvasiveFootwork(c,choice(),E);
  c.ruleState.active['druida:wildShape']=true;assert.equal(evasiveFootworkBonus(c,E),0);c.ruleState.active['druida:wildShape']=false;c.classes[0].subclassId='campeao';assert.equal(evasiveFootworkBonus(c,E),0);finishEvasiveFootwork(c);assert.equal(c.ruleState.used['guerreiro:superiority'],1);
});
test('registro opcional sobrevive à validação/JSON; não toca armas, escolhas, outras reservas ou RNG',()=>{
  const c=make(),before=structuredClone(c),random=Math.random;Math.random=()=>{throw Error('Sem RNG no motor');};
  try{startEvasiveFootwork(c,choice(),E);}finally{Math.random=random;}
  before.ruleState.used['guerreiro:superiority']=1;before.ruleState.evasiveFootwork={version:1,source:'guerreiro:superiority',die:8,face:4};assert.deepEqual(c,before);
  const copy=validateCharacters(JSON.parse(JSON.stringify([c])))[0];assert.deepEqual(copy,c);assert.equal(evasiveFootworkBonus(copy,E),4);finishEvasiveFootwork(copy);assert.equal(evasiveFootworkBonus(copy,E),0);assert.equal(evasiveFootworkBonus(c,E),4);
});
test('editar CA atual desconta o bônus temporário; editar deslocamento/PV/classe encerra sem retomada',()=>{
  const c=make();startEvasiveFootwork(c,choice(),E);
  const edited=editSheetField(c,'armorTotal',30,E);assert.equal(armorClass(edited,E).total,30);finishEvasiveFootwork(edited);assert.equal(armorClass(edited,E).total,26);assert.equal(evasiveFootworkBonus(c,E),4);
  for(const [field,value] of [['speed',0],['hpCurrent',0],['classes.0.subclassId','campeao']] as const){const next=editSheetField(c,field,value,E);assert.equal(readEvasiveFootwork(next),null);assert.equal(next.ruleState.used['guerreiro:superiority'],1);}
  const stopped=make();startEvasiveFootwork(stopped,choice(),E);stopped.speed=0;const restored=editSheetField(stopped,'speed',9,E);assert.equal(readEvasiveFootwork(restored),null);
  const before=structuredClone(c);assert.throws(()=>editSheetField(c,'speed',-1,E));assert.deepEqual(c,before);
});
