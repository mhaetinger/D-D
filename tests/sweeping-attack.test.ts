import {test} from 'node:test';
import assert from 'node:assert/strict';
import {previewSweepingAttack,sweepingAttackOption,sweepingDamage} from '../src/rules/sweeping-attack';
import {previewWeaponDamage,commitWeaponDamage,weaponDamageOptions,type WeaponDamageChoice} from '../src/rules/weapon-damage';
import {beginWeaponAttack,beginFeintingWeaponAttack,markAttackPrecision,clearWeaponAttacks} from '../src/rules/weapon-attack-session';
import {beginWeaponReroll,rerollGreatWeapon,rerollSavageAttacker,weaponRerollResult} from '../src/rules/weapon-rerolls';
import {evaluateDicePool} from '../src/rules/dice-roll';
import {parseDiceFormula} from '../src/rules/dice-formula';
import {resetResources} from '../src/rules/resources';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');
function make(level=6){
 const c=warrior();c.classes=[{classId:'guerreiro',level,subclassId:'mestreBatalha',hitDie:10,hitDiceUsed:0}];c.hpCurrent=c.hpMax=100;
 c.rules={raceId:'humano',history:[{classId:'guerreiro',level:3,answers:{maneuvers:['Ataque Trespassante','Derrubar','Ataque de Precisão']}},{classId:'guerreiro',level:4,answers:{feat:'Adepto Marcial',featManeuvers:['Inspirar','Ataque Trespassante']}}]};
 c.ruleState={version:1,used:{},active:{},pools:{},targets:{},portent:[]};c.weapons=[{name:'Rapieira'},{name:'Alabarda'},{name:'Adaga',attackMode:'thrown'},{name:'Arco Longo'},{name:'Rede'},{name:'Ataque próprio',calculationMode:'manual',damage:'1d6+3',bonus:'+5'}];return c;
}
const choice=(extra:Partial<WeaponDamageChoice>={}):WeaponDamageChoice=>({maneuver:'sweeping',superiority:'guerreiro:superiority',noOtherManeuver:true,sweeping:{target:'  Segunda criatura  ',declared:true,wouldHit:true},...extra});
const preview=(c:any,extra:Partial<WeaponDamageChoice>={})=>previewWeaponDamage(c,c.weapons[0],choice(extra),E);
test('Trespassante exige aquisição vigente; origem do talento independente e melhorias pelo nível próprio',()=>{
 const c=make();assert.equal(sweepingAttackOption(c,c.weapons[0],E),true);c.rules.history=[];assert.equal(sweepingAttackOption(c,c.weapons[0],E),false);
 c.rules.history=[{classId:'guerreiro',level:7,answers:{maneuvers:['Ataque Trespassante']}}];assert.equal(sweepingAttackOption(c,c.weapons[0],E),false);
 c.rules.history=[{classId:'guerreiro',level:4,answers:{feat:'Adepto Marcial',featManeuvers:['Ataque Trespassante']}}];c.classes[0].subclassId='campeao';assert.equal(preview(c,{superiority:'feat:superiority'}).sweeping?.formula,'1d6');
 c.classes[0].subclassId='mestreBatalha';c.classes.push({classId:'ladino',level:12});assert.equal(preview(c).sweeping?.formula,'1d8');assert.equal(preview(c,{superiority:'feat:superiority'}).sweeping?.formula,'1d6');
 c.classes[0].level=10;assert.equal(preview(c,{superiority:'feat:superiority'}).sweeping?.formula,'1d10');c.classes[0].level=18;assert.equal(preview(c).sweeping?.formula,'1d12');
});
test('somente corpo a corpo reconhecido com dano; arremesso, distância, Rede e personalizado ficam fora do controle',()=>{
 const c=make();assert.equal(sweepingAttackOption(c,c.weapons[1],E),true);
 for(const entry of c.weapons.slice(2)){assert.equal(sweepingAttackOption(c,entry,E),false);assert.equal(weaponDamageOptions(c,entry,E).maneuvers.some(m=>m.id==='sweeping'),false);assert.throws(()=>previewWeaponDamage(c,entry,choice(),E));}
});
test('prévia pura sem RNG: segundo alvo separado, sem duplicar arma, bônus ou dados extras de crítico',()=>{
 const c=make(),before=structuredClone(c),random=Math.random;Math.random=()=>{throw Error('RNG proibido');};
 try{for(const critical of [false,true]){
  const p=preview(c,{critical}),base=previewWeaponDamage(c,c.weapons[0],{critical},E);
  assert.equal(p.formula,base.formula);assert.deepEqual(p.parts,base.parts);assert.equal(p.sweeping?.formula,'1d8');assert.equal(p.sweeping?.target,'Segunda criatura');assert.equal(p.sweeping?.type,p.parts[0].type);assert.equal(p.maneuver?.dc,null);assert.deepEqual(c,before);
 }}finally{Math.random=random;}
});
test('Furtivo, Destruição, Crítico Brutal, Ataques Selvagens e –5/+10 pertencem somente ao alvo original',()=>{
 const c=make();c.classes.push({classId:'paladino',level:2},{classId:'ladino',level:3},{classId:'barbaro',level:9});c.rules.raceId='meioOrc';c.standardSlots={1:{total:2,used:0}};
 const p=preview(c,{critical:true,sneak:'advantage',smiteSlot:'slot:1',smiteFavored:true});assert.equal(p.sweeping?.formula,'1d8');
 assert.equal(p.parts.find(x=>x.name==='Ataque Furtivo')?.formula,'4d6');assert.equal(p.parts.find(x=>x.name==='Destruição Divina')?.formula,'6d8');assert.equal(p.parts.find(x=>x.name==='Crítico Brutal')?.formula,'1d8');assert.equal(p.parts.find(x=>x.name==='Ataques Selvagens')?.formula,'1d8');
 c.weapons[0]={name:'Alabarda'};c.rules.history.push({classId:'guerreiro',level:6,answers:{feat:'Mestre de Armas Grandes'}});const power=preview(c,{powerAttack:true});assert.ok(power.parts.some(p=>p.formula==='10'));assert.equal(power.sweeping?.formula,'1d8');
});
test('acerto original, segunda criatura, alcance e mesma jogada vs CA são declarações obrigatórias',()=>{
 const patches:any[]=[{sweeping:undefined},{noOtherManeuver:false},{maneuverAbility:'str'},...[
 {target:''},{target:' '.repeat(8)},{target:'x'.repeat(81)},{target:42},{declared:false},{declared:'sim'},{wouldHit:undefined},{wouldHit:'hit'},
 ].map(patch=>({sweeping:{target:'Outro',declared:true,wouldHit:true,...patch}}))];
 for(const patch of patches){const c=make(),before=structuredClone(c);assert.throws(()=>commitWeaponDamage(c,c.weapons[0],choice(patch),E));assert.deepEqual(c,before);}
 const c=make();assert.throws(()=>previewWeaponDamage(c,c.weapons[0],{sweeping:choice().sweeping},E),/Escolha Ataque Trespassante/);
});
test('uma origem paga uma única tentativa; erro no segundo alvo também gasta, sem adicionar dano',()=>{
 const c=make(),before=structuredClone(c);const first=commitWeaponDamage(c,c.weapons[0],choice(),E);assert.equal(first.maneuver?.source.id,'guerreiro:superiority');assert.equal(c.ruleState.used['guerreiro:superiority'],1);
 const miss=commitWeaponDamage(c,c.weapons[0],choice({superiority:'feat:superiority',sweeping:{target:'Outro',declared:true,wouldHit:false}}),E);
 assert.equal(sweepingDamage(miss.sweeping!),0);assert.equal(c.ruleState.used['feat:superiority'],1);before.ruleState.used={'guerreiro:superiority':1,'feat:superiority':1};assert.deepEqual(c,before);
 assert.throws(()=>preview(c,{superiority:'feat:superiority'}),/esgotada/);
});
test('face secundária validada sem modificador; tentativa sem atingir não aceita face',()=>{
 const p=preview(make()).sweeping!;for(const face of [1,8])assert.equal(sweepingDamage(p,face),face);
 for(const face of [undefined,0,9,1.5,NaN,'4',null])assert.throws(()=>sweepingDamage(p,face as any));
 const miss={...p,wouldHit:false};assert.equal(sweepingDamage(miss),0);assert.throws(()=>sweepingDamage(miss,1));
});
test('registros ilegíveis/esgotados, fonte inválida, incapacitação, forma ou arma substituída não gastam',()=>{
 for(const used of [null,-1,5,1.5,NaN,'1']){const c=make();c.ruleState.used['guerreiro:superiority']=used;const before=structuredClone(c);assert.throws(()=>commitWeaponDamage(c,c.weapons[0],choice(),E));assert.deepEqual(c,before);}
 for(const mutate of [(c:any)=>c.ruleState.used=[] as any,(c:any)=>c.ruleState.used=42,(c:any)=>c.ruleState.used['guerreiro:superiority']=4,(c:any)=>c.hpCurrent=0,(c:any)=>c.ruleState.active['druida:wildShape']=true]){const c=make();mutate(c);const before=structuredClone(c);assert.throws(()=>commitWeaponDamage(c,c.weapons[0],choice(),E));assert.deepEqual(c,before);}
 const c=make(),old=c.weapons[0];c.weapons[0]={name:'Rapieira'};assert.throws(()=>previewSweepingAttack(c,old,'guerreiro:superiority',choice().sweeping!,E));assert.throws(()=>preview(c,{superiority:'monge:ki'}));
});
test('Precisão, Estendido e Finta já usados bloqueiam Trespassante no mesmo ataque',()=>{
 for(const kind of ['precision','lunging','feinting']){
  const c=make(),entry=c.weapons[0];if(kind==='precision')markAttackPrecision(beginWeaponAttack(c,entry));
  if(kind==='lunging')beginWeaponAttack(c,entry,{source:'guerreiro:superiority',name:'Mestre de Batalha',die:8});
  if(kind==='feinting')beginFeintingWeaponAttack(c,entry,{source:'guerreiro:superiority',name:'Mestre de Batalha',die:8,target:'Outro'});
  const before=structuredClone(c);assert.throws(()=>commitWeaponDamage(c,entry,choice(),E),/já usou uma manobra/);assert.deepEqual(c,before);clearWeaponAttacks();
 }
});
test('repetições da arma nunca incluem o dado secundário, mesmo usando o mesmo tamanho',()=>{
 const c=make();const p=preview(c,{critical:true}),parsed=parseDiceFormula(p.formula)!;
 const result=evaluateDicePool(parsed.counts,parsed.modifier,'normal',{},()=>1),roll=beginWeaponReroll(p,result,{savage:true,greatWeapon:true});let calls=0;
 const repeated=rerollGreatWeapon(roll,[0],()=>{calls++;return 8;});assert.equal(calls,1);
 const bestial=rerollSavageAttacker(repeated,true,()=>{calls++;return 7;});assert.equal(calls,3);assert.equal(weaponRerollResult(bestial).total,14+parsed.modifier);assert.equal(p.sweeping?.formula,'1d8');
});
test('descansos recuperam ambas as origens; não há requisito inventado de turno próprio ou proficiência',()=>{
 for(const rest of ['short','long'] as const){const c=make();c.weapons[0].proficient=false;commitWeaponDamage(c,c.weapons[0],choice(),E);commitWeaponDamage(c,c.weapons[0],choice({superiority:'feat:superiority'}),E);resetResources(c,rest,E);assert.equal(c.ruleState.used['guerreiro:superiority'],0);assert.equal(c.ruleState.used['feat:superiority'],0);assert.equal(preview(c).sweeping?.formula,'1d8');}
});
