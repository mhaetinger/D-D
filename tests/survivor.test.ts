import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applySurvivor,hasSurvivor,previewSurvivor} from '../src/rules/survivor';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');
function make(){
  const c=warrior();c.classes=[{classId:'guerreiro',level:18,subclassId:'campeao',subclass:'Campeão',hitDie:10,hitDiceUsed:3}];
  c.hpCurrent=40;c.hpMax=80;c.hpTemp=12;c.hpTempSource='Fonte sintética';c.exhaustion=0;c.abilities.con.score=16;
  c.ruleState={version:1,used:{'guerreiro:secondWind':1},active:{},pools:{},targets:{},portent:[],death:{successes:0,failures:0,stable:false,dead:false}};return c;
}
test('Sobrevivente exige Campeão de nível próprio 18 e aceita a identificação legada da subclasse',()=>{
  const c=make();assert.equal(hasSurvivor(c,E),true);c.classes[0].level=17;c.classes.push({classId:'clerigo',level:3});assert.equal(hasSurvivor(c,E),false);assert.throws(()=>applySurvivor(c,E,true),/nível próprio 18/);
  c.classes[0].level=18;c.classes[0].subclassId='mestreBatalha';assert.equal(hasSurvivor(c,E),false);
  c.classes[0].subclassId='';assert.equal(hasSurvivor(c,E),true);c.classes[0].level=20;assert.equal(hasSurvivor(c,E),true);
});
test('metade é requisito anterior: cura ultrapassa a metade e máximo ímpar não arredonda para cima',()=>{
  const c=make(),before=JSON.stringify(c);assert.deepEqual(previewSurvivor(c,E),{before:40,maximum:80,con:3,amount:8,after:48,restored:8});assert.equal(JSON.stringify(c),before);
  applySurvivor(c,E,true);assert.equal(c.hpCurrent,48);assert.throws(()=>applySurvivor(c,E,true),/até metade/);
  c.hpMax=31;c.hpCurrent=16;assert.throws(()=>previewSurvivor(c,E),/até metade/);c.hpCurrent=15;applySurvivor(c,E,true);assert.equal(c.hpCurrent,23);
});
test('zero PV, estabilização, morte registrada, três falhas e exaustão fatal não recebem recuperação',()=>{
  for(const extra of [{hpCurrent:0},{hpCurrent:0,ruleState:{death:{stable:true}}},{ruleState:{death:{dead:true}}},{ruleState:{death:{failures:3}}},{exhaustion:6}]){
    const c=Object.assign(make(),extra),before=structuredClone(c);assert.throws(()=>applySurvivor(c,E,true));assert.deepEqual(c,before);
  }
});
test('exaustão 4/5 usa o máximo reduzido para a metade e não modifica o máximo base',()=>{
  const c=make();for(const n of [4,5]){
    c.exhaustion=n;c.hpCurrent=21;assert.throws(()=>previewSurvivor(c,E),/até metade/);c.hpCurrent=20;
    assert.equal(previewSurvivor(c,E).maximum,40);applySurvivor(c,E,true);assert.equal(c.hpCurrent,28);assert.equal(c.hpMax,80);
  }
});
test('passivo não exige ação nem consciência: sono, paralisia ou atordoamento com PV positivos não bloqueiam',()=>{
  for(const condition of ['inconsciente','paralisado','atordoado','incapacitado']){
    const c=make();c.conscious=false;c.ruleState.conditions={[condition]:true};applySurvivor(c,E,true);
    assert.equal(c.hpCurrent,48);assert.equal(c.conscious,false);assert.equal(c.ruleState.conditions[condition],true);
  }
});
test('Forma Selvagem não usa os PV ou Constituição humanos, nem altera a reserva da besta',()=>{
  const c=make();c.ruleState.active['druida:wildShape']=true;c.ruleState.pools['druida:wildShape']=5;c.ruleState.beastMax=20;
  const before=structuredClone(c);assert.throws(()=>applySurvivor(c,E,true),/Constituição da besta/);assert.deepEqual(c,before);
});
test('usa CON negativa e limita somente ao máximo: zero de cura não cria histórico/estado',()=>{
  const c=make();c.abilities.con.score=8;assert.equal(applySurvivor(c,E,true).restored,4);
  c.hpCurrent=40;c.abilities.con.score=1;const before=structuredClone(c);assert.equal(previewSurvivor(c,E).amount,0);assert.throws(()=>applySurvivor(c,E,true),/0 PV de recuperação/);assert.deepEqual(c,before);
  c.hpMax=10;c.hpCurrent=5;c.abilities.con.score=30;const plan=applySurvivor(c,E,true);assert.equal(plan.amount,15);assert.equal(plan.restored,5);assert.equal(c.hpCurrent,10);
});
test('valores ilegíveis são preservados; consulta e falhas não criam nem normalizam registros',()=>{
  for(const extra of [{hpMax:0},{hpMax:'80'},{hpMax:NaN},{hpCurrent:-1},{hpCurrent:81},{hpCurrent:0.5},{hpCurrent:'40'},{hpCurrent:Infinity}]){
    const c=Object.assign(make(),extra),before=structuredClone(c);assert.throws(()=>applySurvivor(c,E,true),/Confira os PV/);assert.deepEqual(c,before);
  }
  for(const score of [undefined,null,NaN,0,31,12.5]){const c=make();c.abilities.con.score=score;const before=structuredClone(c);assert.throws(()=>applySurvivor(c,E,true),/Constituição/);assert.deepEqual(c,before);}
  for(const record of ['ilegível',[],7,true]){const c=make();c.ruleState=record;const before=structuredClone(c);assert.throws(()=>applySurvivor(c,E,true),/Registro de regras/);assert.deepEqual(c,before);}
  const c=make();delete c.ruleState;const before=JSON.stringify(c);previewSurvivor(c,E);assert.equal(JSON.stringify(c),before);
});
test('exige declaração de turno, não usa RNG nem gasta Fôlego/dados/inspiração/temporários; turnos posteriores continuam possíveis',()=>{
  const c=make();c.hpCurrent=1;c.heroicInspiration=true;c.ruleState.inspirationReady=true;
  c.ruleState.concentration={name:'Efeito sintético',checks:[{damage:20}]};
  const stable=JSON.stringify([c.ruleState,c.hpTemp,c.hpTempSource,c.classes,c.heroicInspiration]),random=Math.random;
  Math.random=()=>{throw Error('Sem dados');};
  try{
    assert.throws(()=>applySurvivor(c,E,false),/novo turno/);assert.equal(c.hpCurrent,1);
    for(let turn=0;turn<3;turn++)applySurvivor(c,E,true);assert.equal(c.hpCurrent,25);
    assert.equal(JSON.stringify([c.ruleState,c.hpTemp,c.hpTempSource,c.classes,c.heroicInspiration]),stable);
  }finally{Math.random=random;}
});
