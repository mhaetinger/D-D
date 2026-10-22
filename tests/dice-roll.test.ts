import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canRerollHalfling, evaluateDicePool, rerollHalfling, sheetD20Rules, type D20Rules } from '../src/rules/dice-roll';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');
const rogue=()=>{const c=warrior();c.classes=[{classId:'ladino',level:11}];c.rules.raceId='halflingLeve';return c;};
const roll=(faces:number[],mode='normal',rules:D20Rules={},counts:Record<number,number>={20:1},modifier=0)=>{
  const remaining=[...faces];
  const result=evaluateDicePool(counts,modifier,mode,rules,()=>{assert.ok(remaining.length,'Não pode rolar dados extras');return remaining.shift()!;});
  assert.equal(remaining.length,0);return result;
};

test('Talento Confiável exige ladino 11 e perícia realmente proficiente, inclusive com ajuste total zero',()=>{
  const c=rogue();c.customSkillBonuses={acrobacia:0};
  assert.equal(sheetD20Rules(c,{type:'check',skill:'acrobacia'},E).reliableTalent,true);
  for(const context of [{type:'check',skill:'arcanismo'},{type:'check'},{type:'attack'},{type:'save'},{type:'check',skill:'__proto__'}])
    assert.equal(sheetD20Rules(c,context as any,E).reliableTalent,false);
  c.classes=[{classId:'ladino',level:10},{classId:'bardo',level:2}];
  assert.equal(sheetD20Rules(c,{type:'check',skill:'acrobacia'},E).reliableTalent,false);
  c.classes=[{classId:'bardo',level:11}];assert.equal(sheetD20Rules(c,{type:'check',skill:'arcanismo'},E).reliableTalent,false);
  const copy=rogue(),before=JSON.stringify(copy);sheetD20Rules(copy,{type:'check',skill:'acrobacia'},E);assert.equal(JSON.stringify(copy),before);
});
test('Sortudo racial usa vínculo canônico das duas sub-raças, sem confundir raça escrita e talento Sortudo',()=>{
  const c=rogue();
  for(const race of ['halflingLeve','halflingRobusto'])for(const type of ['check','attack','save']){
    c.rules.raceId=race;assert.equal(sheetD20Rules(c,{type} as any,E).halflingLuck,true);
  }
  c.rules.raceId='humano';c.race='Halfling';c.rules.history=[{classId:'ladino',level:4,answers:{feat:'Sortudo'}}];
  assert.equal(sheetD20Rules(c,{type:'attack'},E).halflingLuck,false);
  c.rules.raceId='halflingLeve';assert.deepEqual(sheetD20Rules(c,null,E),{});
  assert.deepEqual(sheetD20Rules(c,{type:'damage'} as any,E),{});
});
test('Talento Confiável afeta somente o d20 escolhido, antes de somar bônus negativos e outros dados',()=>{
  for(const face of [1,9,10,19,20]) {
    const result=roll([face,3],'normal',{reliableTalent:true},{20:1,4:1},-2);
    assert.equal(result.total,Math.max(10,face)+1);assert.equal(result.d20Natural,face);
    assert.equal(result.breakdown.some(x=>x.startsWith('Talento Confiável')),face<10);
  }
  assert.equal(roll([1],'normal',{},undefined,-2).total,-1);
});
test('mínimo é aplicado após escolher maior/menor; não muda modo nem faces naturais',()=>{
  const adv=roll([1,9],'adv',{reliableTalent:true});assert.equal(adv.total,10);assert.equal(adv.d20Natural,9);
  const dis=roll([20,1],'dis',{reliableTalent:true});assert.equal(dis.total,10);assert.equal(dis.d20Natural,1);
  assert.equal(roll([11,20],'adv',{reliableTalent:true}).total,20);
});
test('rolador livre mantém ordem, soma, primeiro d20 e vantagem apenas no primeiro teste',()=>{
  const r=roll([80,2,18,7,4,3],'adv',{}, {100:1,20:2,6:2},-2);
  assert.equal(r.total,110);assert.equal(r.d20Natural,18);assert.equal(r.appliedMode,'adv');
  assert.deepEqual(r.breakdown,['1d100[80]','d20 [2, 18] → maior: 18','d20 extra [7]','2d6[4+3]','-2']);
});
test('pool com múltiplos d20 ou só dano nunca recebe regras de um teste contextual',()=>{
  const r=roll([1,2,3],'dis',{reliableTalent:true,halflingLuck:true},{20:2});
  assert.equal(r.total,4);assert.deepEqual(r.rules,{});assert.equal(canRerollHalfling(r),false);
  const damage=roll([1],'adv',{reliableTalent:true,halflingLuck:true},{6:1});
  assert.equal(damage.total,1);assert.equal(damage.appliedMode,'normal');assert.equal(damage.d20Natural,null);
  assert.equal(evaluateDicePool({},-4,'adv').total,-4);
});
test('Sortudo permite repetir 1 uma vez, aceita nova face obrigatoriamente e conserva outros dados/bônus',()=>{
  const first=roll([1,4],'normal',{halflingLuck:true},{20:1,4:1},5),before=structuredClone(first);
  assert.equal(canRerollHalfling(first),true);
  const second=rerollHalfling(first,()=>20);assert.equal(second.total,29);assert.equal(second.d20Natural,20);
  assert.deepEqual(first,before);assert.deepEqual(second.groups[1].faces,[4]);assert.equal(canRerollHalfling(second),false);
  assert.throws(()=>rerollHalfling(second),/outra rerrolagem/);
  const again=rerollHalfling(first,()=>1);assert.equal(again.total,10);assert.equal(canRerollHalfling(again),false);
  assert.throws(()=>rerollHalfling(roll([1])),/não permite/);
  assert.equal(canRerollHalfling(roll([2],'normal',{halflingLuck:true})),false);
});
test('com vantagem pode repetir 1 descartado; com dois 1 só um deles muda',()=>{
  const adv=rerollHalfling(roll([1,13],'adv',{halflingLuck:true}),()=>20);
  assert.equal(adv.total,20);assert.equal(adv.appliedMode,'adv');
  const dis=rerollHalfling(roll([1,1],'dis',{halflingLuck:true}),()=>20);
  assert.equal(dis.total,1);assert.equal(dis.d20Natural,1);assert.equal(canRerollHalfling(dis),false);
  assert.deepEqual(dis.groups[0].faces,[20,1]);
});
test('mínimo do ladino é reavaliado depois de Sortudo sem acumular o bônus nem perder o natural',()=>{
  const rules={halflingLuck:true,reliableTalent:true};
  for(const face of [1,9,10,20])for(const mode of ['normal','adv','dis']) {
    const first=roll(mode==='normal'?[1]:[1,13],mode,rules,undefined,4);
    const second=rerollHalfling(first,()=>face),raw=mode==='normal'?face:mode==='adv'?Math.max(face,13):Math.min(face,13);
    assert.equal(second.total,Math.max(10,raw)+4);assert.equal(second.d20Natural,raw);
  }
});
