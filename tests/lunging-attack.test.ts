import {test} from 'node:test';
import assert from 'node:assert/strict';
import {commitLungingAttack,lungingAttackOption,previewLungingAttack} from '../src/rules/lunging-attack';
import {attackHasManeuver,beginWeaponAttack,clearWeaponAttacks,currentWeaponAttack,finishLungingAttack,finishWeaponAttack,markAttackPrecision} from '../src/rules/weapon-attack-session';
import {commitWeaponDamage,previewWeaponDamage} from '../src/rules/weapon-damage';
import {commitPrecisionAttack,precisionAttackOptions} from '../src/rules/precision-attack';
import {evaluateDicePool} from '../src/rules/dice-roll';
import {resetResources} from '../src/rules/resources';
import {beginWeaponReroll,rerollGreatWeapon,weaponRerollResult} from '../src/rules/weapon-rerolls';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');
function make(level=5){
  const c=warrior();c.classes=[{classId:'guerreiro',level,subclassId:'mestreBatalha',subclass:'Mestre de Batalha',hitDie:10,hitDiceUsed:0}];c.hpCurrent=c.hpMax=100;
  c.rules={raceId:'humano',history:[{classId:'guerreiro',level:3,answers:{maneuvers:['Ataque Estendido','Derrubar','Ataque de Precisão']}}]};
  c.ruleState={version:1,used:{},pools:{},active:{},targets:{},conditions:{},portent:[]};c.weapons=[{name:'Espada longa'},{name:'Alabarda'},{name:'Machadinha',attackMode:'thrown'},{name:'Arco Longo'},{name:'Ataque próprio',calculationMode:'manual',bonus:'+5',damage:'1d6+3'}];return c;
}
const choice=(source='guerreiro:superiority')=>({source,ownTurn:true,newAttack:true});
const d20=()=>evaluateDicePool({20:1},5,'normal',{},()=>12);
test('Estendido exige conhecimento vigente; Adepto Marcial independente e melhorias por nível próprio',()=>{
  const c=make(),w=c.weapons[0];assert.ok(lungingAttackOption(c,w,E));c.classes[0].level=2;assert.equal(lungingAttackOption(c,w,E),null);c.classes[0].level=5;c.rules.history[0].level=7;assert.equal(lungingAttackOption(c,w,E),null);c.rules.history[0].level=3;c.classes[0].subclassId='campeao';assert.equal(lungingAttackOption(c,w,E),null);
  c.rules.history.push({classId:'guerreiro',level:4,answers:{feat:'Adepto Marcial',featManeuvers:['Ataque Estendido','Inspirar']}});assert.equal(previewLungingAttack(c,w,choice('feat:superiority'),E).source.die,6);
  c.classes[0].subclassId='mestreBatalha';c.classes.push({classId:'ladino',level:9});assert.equal(previewLungingAttack(c,w,choice(),E).source.die,8);c.classes[0].level=10;assert.equal(previewLungingAttack(c,w,choice('feat:superiority'),E).source.die,10);c.classes[0].level=18;assert.equal(previewLungingAttack(c,w,choice(),E).source.die,12);
});
test('corpo a corpo reconhecido, inclusive arma de alcance e sem proficiência; arremesso/distância/manual/forma ficam fora',()=>{
  const c=make();for(const i of [0,1])assert.equal(lungingAttackOption(c,c.weapons[i],E)!.reachBonus,1.5);
  c.weapons[0].proficient=false;assert.ok(lungingAttackOption(c,c.weapons[0],E));for(const i of [2,3,4])assert.equal(lungingAttackOption(c,c.weapons[i],E),null);
  c.ruleState.active['druida:wildShape']=true;assert.equal(lungingAttackOption(c,c.weapons[0],E),null);
});
test('prévia sem custo/RNG; gasto ocorre no novo ataque, mesmo que erre, sem rolar ainda o dano',()=>{
  const c=make(),w=c.weapons[0],before=structuredClone(c),random=Math.random;Math.random=()=>{throw Error('Sem RNG');};
  try{previewLungingAttack(c,w,choice(),E);assert.deepEqual(c,before);const attack=commitLungingAttack(c,w,choice(),E);assert.equal(attack.lunging!.die,8);assert.equal(attackHasManeuver(attack),true);assert.equal(c.ruleState.used['guerreiro:superiority'],1);finishWeaponAttack(c,w);assert.equal(c.ruleState.used['guerreiro:superiority'],1);}finally{Math.random=random;}
  before.ruleState.used['guerreiro:superiority']=1;assert.deepEqual(c,before);
});
test('acerto soma um dado do tipo da arma, crítico dobra esse dado e o custo nunca se repete',()=>{
  const c=make(),w=c.weapons[0],normal=previewWeaponDamage(c,w,{},E);commitLungingAttack(c,w,choice(),E);
  const p=previewWeaponDamage(c,w,{},E);assert.equal(p.parts.length,normal.parts.length+1);assert.deepEqual(p.parts.at(-1),{name:'Ataque Estendido',formula:'1d8',type:p.parts[0].type});assert.equal(p.lunging!.source,'guerreiro:superiority');
  const critical=commitWeaponDamage(c,w,{critical:true},E);assert.equal(critical.parts.at(-1)!.formula,'2d8');assert.equal(c.ruleState.used['guerreiro:superiority'],1);finishWeaponAttack(c,w);assert.equal(previewWeaponDamage(c,w,{},E).formula,normal.formula);
});
test('apenas uma manobra por ataque: bloqueia Precisão e manobra no acerto; novo ataque pode usá-las',()=>{
  const c=make(),w=c.weapons[0];commitLungingAttack(c,w,choice(),E);const before=JSON.stringify(c);
  assert.equal(precisionAttackOptions(c,w,d20(),E).length,0);assert.throws(()=>commitPrecisionAttack(c,w,d20(),{source:'guerreiro:superiority',unresolved:true,noOtherManeuver:true},4,E));
  assert.throws(()=>commitWeaponDamage(c,w,{maneuver:'trip',superiority:'guerreiro:superiority',maneuverAbility:'str',noOtherManeuver:true},E),/já usou/);assert.equal(JSON.stringify(c),before);
  const next=beginWeaponAttack(c,w);assert.equal(attackHasManeuver(next),false);assert.ok(precisionAttackOptions(c,w,d20(),E).length);markAttackPrecision(next);assert.equal(precisionAttackOptions(c,w,d20(),E).length,0);
});
test('novo ataque com outra arma, erro ou limpeza encerra Estendido sem reembolso nem herança de alcance/dano',()=>{
  const c=make(),w=c.weapons[0],other=c.weapons[1];commitLungingAttack(c,w,choice(),E);beginWeaponAttack(c,other);assert.equal(currentWeaponAttack(c,w),undefined);assert.equal(previewWeaponDamage(c,w,{},E).lunging,undefined);
  commitLungingAttack(c,w,choice(),E);finishLungingAttack(c);assert.equal(currentWeaponAttack(c,w),undefined);commitLungingAttack(c,w,choice(),E);clearWeaponAttacks();assert.equal(currentWeaponAttack(c,w),undefined);assert.equal(c.ruleState.used['guerreiro:superiority'],3);
});
test('Arma, –5/+10, Furtivo e Destruição conservam parcelas/custos próprios com Estendido',()=>{
  const c=make(),w=c.weapons[0];c.classes.push({classId:'paladino',level:2});c.standardSlots={1:{total:2,used:0}};c.weapons[0]={name:'Rapieira'};c.classes.push({classId:'ladino',level:3});commitLungingAttack(c,c.weapons[0],choice(),E);
  const p=commitWeaponDamage(c,c.weapons[0],{sneak:'ally',smiteSlot:'slot:1',critical:true},E);assert.ok(p.parts.some(x=>x.name==='Ataque Furtivo'&&x.formula==='4d6'));assert.ok(p.parts.some(x=>x.name==='Destruição Divina'&&x.formula==='4d8'));assert.equal(c.standardSlots[1].used,1);assert.equal(c.ruleState.used['guerreiro:superiority'],1);
  finishWeaponAttack(c,c.weapons[0]);c.rules.history.push({classId:'guerreiro',level:4,answers:{feat:'Mestre de Armas Grandes'}});const heavy=c.weapons[1];commitLungingAttack(c,heavy,choice(),E);assert.ok(commitWeaponDamage(c,heavy,{powerAttack:true},E).parts.some(p=>p.formula==='10'));assert.equal(c.ruleState.used['guerreiro:superiority'],2);
});
test('repetições de dados da arma preservam Estendido mesmo usando o mesmo tamanho de dado',()=>{
  const c=make(),w=c.weapons[0];commitLungingAttack(c,w,choice(),E);const plan=previewWeaponDamage(c,w,{},E),faces=[1,6];const result=evaluateDicePool({8:2},3,'normal',{},()=>faces.shift()!);
  const roll=beginWeaponReroll(plan,result,{savage:false,greatWeapon:true}),repeated=weaponRerollResult(rerollGreatWeapon(roll,[0],()=>4));assert.deepEqual(repeated.groups[0].faces,[4,6]);assert.equal(c.ruleState.used['guerreiro:superiority'],1);
});
test('declaração, arma/bônus inválidos e contadores ilegíveis são recusados antes de qualquer gasto',()=>{
  for(const patch of [{ownTurn:false},{newAttack:false},{source:'bardo:inspiration'}]){const c=make(),before=structuredClone(c);assert.throws(()=>commitLungingAttack(c,c.weapons[0],{...choice(),...patch},E));assert.deepEqual(c,before);}
  for(const raw of [null,'0',-1,.5,NaN,5]){const c=make();c.ruleState.used['guerreiro:superiority']=raw;const before=structuredClone(c);assert.throws(()=>commitLungingAttack(c,c.weapons[0],choice(),E),/preservado/);assert.deepEqual(c,before);}
  const c=make();c.weapons[0].attackAdjustment='invalido';const before=structuredClone(c);assert.throws(()=>commitLungingAttack(c,c.weapons[0],choice(),E),/bônus/);assert.deepEqual(c,before);
});
test('ação incapacitada impede ataque; dados próprios e máximo ajustado esgotam sem gastar outra origem',()=>{
  const c=make();c.rules.history.push({classId:'guerreiro',level:4,answers:{feat:'Adepto Marcial',featManeuvers:['Ataque Estendido','Inspirar']}});c.rules.resourceMaxOverrides={'guerreiro:superiority':1};
  c.ruleState.conditions.incapacitado=true;assert.throws(()=>commitLungingAttack(c,c.weapons[0],choice(),E));c.ruleState.conditions={};commitLungingAttack(c,c.weapons[0],choice(),E);assert.throws(()=>commitLungingAttack(c,c.weapons[0],choice(),E),/esgotada/);assert.equal(c.ruleState.used['feat:superiority'],undefined);
  commitLungingAttack(c,c.weapons[0],choice('feat:superiority'),E);assert.equal(currentWeaponAttack(c,c.weapons[0])!.lunging!.die,6);resetResources(c,'short',E);assert.equal(c.ruleState.used['guerreiro:superiority'],0);assert.equal(c.ruleState.used['feat:superiority'],0);assert.equal(currentWeaponAttack(c,c.weapons[0]),undefined);
});
test('sessão não é gravada em armas/documento; cópia/recarga não herda ataque pago; alterar arma exige conferir na mesa',()=>{
  const c=make(),w=c.weapons[0],before=structuredClone(c.weapons);commitLungingAttack(c,w,choice(),E);assert.deepEqual(c.weapons,before);
  const copy=JSON.parse(JSON.stringify(c));assert.equal(currentWeaponAttack(copy,copy.weapons[0]),undefined);assert.equal(copy.ruleState.used['guerreiro:superiority'],1);
  w.attackMode='thrown';assert.throws(()=>previewWeaponDamage(c,w,{},E),/mudou/);
});
