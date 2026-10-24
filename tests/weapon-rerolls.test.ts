import {test} from 'node:test';
import assert from 'node:assert/strict';
import {weaponRerollOptions,beginWeaponReroll,greatWeaponDice,rerollGreatWeapon,rerollSavageAttacker,chooseWeaponSet,weaponRerollResult} from '../src/rules/weapon-rerolls';
import {previewWeaponDamage} from '../src/rules/weapon-damage';
import {evaluateDicePool} from '../src/rules/dice-roll';
import {parseDiceFormula} from '../src/rules/dice-formula';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');
function make(name='Espada Grande'){
  const c=warrior();c.shieldEquipped=false;c.hpCurrent=100;c.hpMax=100;c.abilities.str.score=18;
  c.rules.history[0].answers.fighting='Combate com Armas Grandes';
  c.rules.history.push({classId:'guerreiro',level:4,answers:{feat:'Atacante Bestial'}});
  c.classes[0].level=4;c.weapons=[{name}];return c;
}
function begin(c:any,faces:number[],choice:any={}){
  const plan=previewWeaponDamage(c,c.weapons[0],choice,E),p=parseDiceFormula(plan.formula)!;
  const result=evaluateDicePool(p.counts,p.modifier,'normal',{},()=>faces.shift()!);
  return beginWeaponReroll(plan,result,weaponRerollOptions(c,c.weapons[0],E));
}
test('elegibilidade distingue talento, estilo estruturado, empunhadura, arremesso e dano manual',()=>{
  const c=make(),option=()=>weaponRerollOptions(c,c.weapons[0],E);
  assert.deepEqual(option(),{savage:true,greatWeapon:true});
  c.weapons[0]={name:'Espada Longa'};assert.deepEqual(option(),{savage:true,greatWeapon:false});
  c.weapons[0].hands=2;assert.equal(option().greatWeapon,true);
  c.shieldEquipped=true;assert.equal(option().greatWeapon,false);c.shieldEquipped=false;
  c.weapons[0]={name:'Rapieira',hands:2};assert.equal(option().greatWeapon,false);
  for(const w of [{name:'Adaga',attackMode:'thrown'},{name:'Espada Grande',attackMode:'thrown'},{name:'Arco Longo'},{name:'Rede'},{name:'Ataque desarmado',damage:'1d4'},{name:'Espada Grande',calculationMode:'manual',damage:'2d6+4'}]){
    c.weapons[0]=w;assert.deepEqual(option(),{savage:false,greatWeapon:false});
  }
  c.weapons[0]={name:'Espada Grande'};c.ruleState={active:{'druida:wildShape':true}};assert.deepEqual(option(),{savage:false,greatWeapon:false});
});
test('estilo não é inferido de notas ou talento Mestre; aceita paladino e segundo estilo do Campeão no nível próprio',()=>{
  const c=make();c.rules.history=[];c.weapons[0].notes='Combate com Armas Grandes';
  c.rules.history.push({classId:'guerreiro',level:4,answers:{feat:'Mestre de Armas Grandes'}});
  assert.deepEqual(weaponRerollOptions(c,c.weapons[0],E),{savage:false,greatWeapon:false});
  c.classes=[{classId:'paladino',level:1}];c.rules.history=[{classId:'paladino',level:2,answers:{fighting:'Combate com Armas Grandes'}}];
  assert.equal(weaponRerollOptions(c,c.weapons[0],E).greatWeapon,false);c.classes[0].level=2;assert.equal(weaponRerollOptions(c,c.weapons[0],E).greatWeapon,true);
  c.classes=[{classId:'guerreiro',level:10,subclassId:'campeao'}];c.rules.history=[{classId:'guerreiro',level:10,answers:{championFighting:'Combate com Armas Grandes'}}];
  assert.equal(weaponRerollOptions(c,c.weapons[0],E).greatWeapon,true);
  c.classes[0].subclassId='mestreBatalha';assert.equal(weaponRerollOptions(c,c.weapons[0],E).greatWeapon,false);
});
test('estilo é opcional por dado; nova face baixa é obrigatória e não pode ser repetida pelo estilo novamente',()=>{
  const c=make(),before=JSON.stringify(c),roll=begin(c,[1,2]);
  assert.deepEqual(greatWeaponDice(roll),[0,1]);const next=rerollGreatWeapon(roll,[0],()=>2);
  assert.deepEqual(next.sets[0].faces,[2,2]);assert.deepEqual(greatWeaponDice(next),[1]);
  assert.equal(weaponRerollResult(next).total,8);assert.deepEqual(roll.sets[0].faces,[1,2]);
  let calls=0;assert.throws(()=>rerollGreatWeapon(next,[0],()=>++calls),/somente dados/);assert.equal(calls,0);
  assert.throws(()=>rerollGreatWeapon(next,[1,1]),/somente dados/);assert.throws(()=>rerollGreatWeapon(next,[]),/somente dados/);
  assert.equal(JSON.stringify(c),before);
});
test('Atacante Bestial repete todos os dados uma vez e escolhe um conjunto inteiro, sem juntar melhores faces',()=>{
  const c=make(),roll=begin(c,[6,1]);assert.throws(()=>rerollSavageAttacker(roll,false),/Confirme/);
  const faces=[2,4],next=rerollSavageAttacker(roll,true,()=>faces.shift()!);
  assert.equal(weaponRerollResult(next).total,10);assert.equal(weaponRerollResult(chooseWeaponSet(next,0)).total,11);
  assert.deepEqual(next.sets.map(s=>s.faces),[[6,1],[2,4]]);assert.throws(()=>rerollSavageAttacker(next,true),/não pode repetir/);
  assert.throws(()=>chooseWeaponSet(next,-1),/Escolha/);assert.throws(()=>chooseWeaponSet(next,2),/Escolha/);
});
test('as duas regras compõem conjuntos independentes e conservam as novas faces obrigatórias do estilo',()=>{
  const c=make();let roll=rerollGreatWeapon(begin(c,[1,6]),[0],()=>2);
  const faces=[1,2];roll=rerollSavageAttacker(roll,true,()=>faces.shift()!);
  assert.deepEqual(greatWeaponDice(roll),[0,1]);roll=rerollGreatWeapon(roll,[0,1],()=>1);
  assert.deepEqual(greatWeaponDice(roll),[]);roll=chooseWeaponSet(roll,0);
  assert.deepEqual(greatWeaponDice(roll),[]);assert.deepEqual(roll.sets.map(s=>s.faces),[[2,6],[1,1]]);
  assert.equal(weaponRerollResult(roll).total,12);
});
test('crítico repete só os dados da parte Arma; Furtivo, Destruição, Brutal e racial não mudam mesmo com o mesmo tamanho',()=>{
  const c=make('Rapieira');c.rules.raceId='meioOrc';c.classes.push({classId:'paladino',level:11},{classId:'barbaro',level:9},{classId:'ladino',level:3});
  c.standardSlots={1:{total:1,used:0}};
  const before=JSON.stringify(c),roll=begin(c,Array(20).fill(1),{critical:true,sneak:'ally',smiteSlot:'slot:1'});
  assert.equal(roll.count,2);const p=weaponRerollResult(roll),next=rerollSavageAttacker(roll,true,()=>8),result=weaponRerollResult(next);
  assert.equal(result.total,p.total+14);assert.deepEqual(result.groups.find(g=>g.sides===6),p.groups.find(g=>g.sides===6));
  assert.deepEqual(result.groups.find(g=>g.sides===8)?.faces.slice(2),p.groups.find(g=>g.sides===8)?.faces.slice(2));
  assert.equal(JSON.stringify(c),before);
});
test('bônus fixos não são repetidos; negativo tem piso zero só no total final, sem perder pontos na recomposição',()=>{
  const c=make();c.weapons[0].damageAdjustment=-10;const roll=begin(c,[1,1]);
  const fixed=roll.original.modifier;assert.equal(fixed,-6);const result=weaponRerollResult(rerollSavageAttacker(roll,true,()=>6));
  assert.equal(result.modifier,fixed);assert.equal(result.total,6);assert.equal(weaponRerollResult(roll).total,0);
  const base=make();base.rules.history.push({classId:'guerreiro',level:6,answers:{feat:'Mestre de Armas Grandes'}});
  const power=begin(base,[1,1],{powerAttack:true}),next=weaponRerollResult(rerollSavageAttacker(power,true,()=>6));assert.equal(next.modifier,14);assert.equal(next.total,26);
});
test('entrada inválida não modifica sessão nem aceita repetição inelegível',()=>{
  const c=make(),roll=begin(c,[1,2]),before=JSON.stringify(roll);
  assert.throws(()=>rerollGreatWeapon(roll,[0],()=>7),/Face/);assert.throws(()=>rerollSavageAttacker(roll,true,()=>0),/Face/);
  assert.equal(JSON.stringify(roll),before);const p=previewWeaponDamage(c,c.weapons[0],{},E);
  assert.throws(()=>beginWeaponReroll(p,roll.original,{savage:false,greatWeapon:false}),/não permite/);
  const ranged=make('Arco Longo');assert.equal(weaponRerollOptions(ranged,ranged.weapons[0],E).savage,false);
});
