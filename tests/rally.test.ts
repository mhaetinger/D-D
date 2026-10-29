import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyRally,canUseRally,knowsRally,previewRally,type RallyChoice} from '../src/rules/rally';
import {resetResources} from '../src/rules/resources';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');
function make(level=5){
  const c=warrior();c.classes=[{classId:'guerreiro',level,subclassId:'mestreBatalha',hitDie:10,hitDiceUsed:0}];
  c.abilities.cha.score=16;c.hpCurrent=20;c.hpMax=80;c.hpTemp=12;c.hpTempSource='Fonte anterior';
  c.rules={raceId:'humano',history:[{classId:'guerreiro',level:3,answers:{maneuvers:['Inspirar','Derrubar','Ataque de Precisão']}}]};
  c.ruleState={version:1,used:{},pools:{},active:{},targets:{},portent:[]};return c;
}
const choice=(source='guerreiro:superiority',face=4):RallyChoice=>({source,face,ally:' Aliado da mesa ',declared:true});
test('Inspirar exige conhecimento vigente e não aproveita aquisição futura nem subclasse removida',()=>{
  const c=make();assert.equal(knowsRally(c,E),true);c.classes[0].level=2;assert.equal(knowsRally(c,E),false);
  c.classes[0].level=5;c.classes[0].subclassId='campeao';assert.equal(canUseRally(c,E,choice().source),false);assert.throws(()=>applyRally(c,choice(),E),/conhecida/);
  c.classes[0].subclassId='mestreBatalha';c.rules.history[0].level=7;assert.equal(knowsRally(c,E),false);
});
test('Adepto Marcial oferece d6 independente; classe pode pagar manobra aprendida no talento',()=>{
  const c=make();c.rules.history[0].answers.maneuvers=['Aparar'];
  c.rules.history.push({classId:'guerreiro',level:4,answers:{feat:'Adepto Marcial',featManeuvers:['Inspirar','Ataque Estendido']}});
  assert.equal(previewRally(c,choice('feat:superiority'),E).source.die,6);
  applyRally(c,choice(),E);applyRally(c,choice('feat:superiority'),E);
  assert.deepEqual(c.ruleState.used,{'guerreiro:superiority':1,'feat:superiority':1});
  c.classes[0].subclassId='campeao';assert.equal(canUseRally(c,E,'guerreiro:superiority'),false);c.ruleState.used['feat:superiority']=0;assert.equal(canUseRally(c,E,'feat:superiority'),true);
});
test('dados aprimorados dependem do nível próprio, não do total multiclasse',()=>{
  const c=make(9);c.classes.push({classId:'ladino',level:9});assert.equal(previewRally(c,choice(),E).source.die,8);
  c.classes[0].level=10;assert.equal(previewRally(c,choice(),E).source.die,10);
  c.classes[0].level=18;assert.equal(previewRally(c,choice('guerreiro:superiority',12),E).source.die,12);
});
test('prévia pura calcula face + CAR sem mínimo 1; zero não cura nem devolve dado',()=>{
  const c=make(),before=JSON.stringify(c),p=previewRally(c,choice(),E);
  assert.equal(p.temporary,7);assert.equal(p.ally,'Aliado da mesa');assert.equal(JSON.stringify(c),before);
  c.abilities.cha.score=8;assert.equal(previewRally(c,choice(),E).temporary,3);
  c.abilities.cha.score=1;assert.equal(applyRally(c,choice('guerreiro:superiority',1),E).temporary,0);
  assert.equal(c.ruleState.used['guerreiro:superiority'],1);assert.equal(c.hpCurrent,20);assert.equal(c.hpTemp,12);
});
test('exige declaração de turno/ação/percepção e identificação do aliado; rejeita face/origem inválida',()=>{
  const c=make();
  const invalid=[{declared:false},{ally:''},{ally:'  '},{ally:'a'.repeat(81)},{ally:undefined},{source:'bardo:inspiration'},...[0,9,-1,2.5,NaN].map(face=>({face}))];
  for(const patch of invalid){const before=structuredClone(c);assert.throws(()=>applyRally(c,{...choice(),...patch} as RallyChoice,E));assert.deepEqual(c,before);}
  const name='<img src=x onerror=alert(1)>';assert.equal(previewRally(c,{...choice(),ally:name},E).ally,name);
});
test('incapacitação impede ação bônus; cegueira/surdez do usuário isoladas não inventam impedimento do aliado',()=>{
  const c=make();
  for(const id of ['incapacitado','inconsciente','atordoado','paralisado','petrificado']){c.ruleState.conditions={[id]:true};assert.equal(canUseRally(c,E,choice().source),false);}
  c.ruleState.conditions={cego:true,surdo:true};assert.equal(canUseRally(c,E,choice().source),true);
  c.hpCurrent=0;assert.equal(canUseRally(c,E,choice().source),false);c.hpCurrent=20;c.ruleState.death={dead:true};assert.equal(canUseRally(c,E,choice().source),false);
  c.ruleState.death={};c.ruleState.active['druida:wildShape']=true;assert.throws(()=>applyRally(c,choice(),E),/Forma Selvagem/);
});
test('Carisma ilegível e contadores ilegíveis/fora do máximo não são corrigidos nem cobrados',()=>{
  for(const value of [undefined,'ilegível',0,31,11.5]){const c=make();c.abilities.cha.score=value;const before=structuredClone(c);assert.throws(()=>applyRally(c,choice(),E),/Carisma/);assert.deepEqual(c,before);}
  for(const value of [null,'0',-1,.5,NaN,5]){const c=make();c.ruleState.used['guerreiro:superiority']=value;const before=structuredClone(c);assert.throws(()=>applyRally(c,choice(),E),/preservado/);assert.deepEqual(c,before);}
  for(const value of [[],7,'ilegível'])for(const key of ['ruleState','used']){const c=make();if(key==='ruleState')c.ruleState=value;else c.ruleState.used=value;const before=structuredClone(c);assert.throws(()=>applyRally(c,choice(),E),/ilegível/);assert.deepEqual(c,before);}
});
test('máximo ajustado é respeitado, esgotamento não gasta outra origem, descanso recupera as duas',()=>{
  const c=make();c.rules.history.push({classId:'guerreiro',level:4,answers:{feat:'Adepto Marcial',featManeuvers:['Inspirar','Aparar']}});
  c.rules.resourceMaxOverrides={'guerreiro:superiority':1};applyRally(c,choice(),E);const before=JSON.stringify(c);assert.throws(()=>applyRally(c,choice(),E),/esgotada/);assert.equal(JSON.stringify(c),before);
  applyRally(c,choice('feat:superiority'),E);resetResources(c,'short',E);assert.equal(c.ruleState.used['guerreiro:superiority'],0);assert.equal(c.ruleState.used['feat:superiority'],0);
  c.rules.resourceMaxOverrides['guerreiro:superiority']=0;assert.equal(canUseRally(c,E,'guerreiro:superiority'),false);
});
test('aplicação só altera a reserva própria: não cura, estabiliza, soma temporários, grava alvo ou usa RNG',()=>{
  const c=make(),ally=make(),before=structuredClone(c),allyBefore=structuredClone(ally),random=Math.random;
  c.ruleState.used['recurso:antigo']=3;before.ruleState.used['recurso:antigo']=3;
  Math.random=()=>{throw Error('Sem RNG no motor');};
  try{applyRally(c,choice(),E);}finally{Math.random=random;}
  before.ruleState.used['guerreiro:superiority']=1;assert.deepEqual(c,before);assert.deepEqual(ally,allyBefore);
});
