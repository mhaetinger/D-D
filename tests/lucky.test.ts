import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addLuckyDie, canRerollHalfling, chooseLuckyDie, evaluateDicePool, luckyFaces, rerollHalfling, sheetD20Rules } from '../src/rules/dice-roll';
import { luckRemaining, luckyResource, spendLuck } from '../src/rules/lucky';
import { featureResourceBindings } from '../src/rules/placement';
import { resourcesFor, refund } from '../src/rules/resources';
import { takeRest } from '../src/rules/rest';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');
const make=(key='feat')=>{const c=warrior();c.classes[0].level=4;c.rules.history.push({classId:'guerreiro',level:4,answers:{[key]:'Sortudo'}});return c;};
const dice=(faces:number[],mode='normal',extraRules={})=>{const f=[...faces];return evaluateDicePool({20:1},0,mode,{luckyFeat:true,...extraRules},()=>f.shift()!);};

test('Sortudo tem uma reserva de três pontos por descanso longo, independente do nível e de escolhas repetidas',()=>{
  const c=make();c.classes[0].level=20;c.rules.history.push({classId:'guerreiro',level:6,answers:{feat:'Sortudo'}});
  const r=luckyResource(c,E)!;assert.equal(r.max,3);assert.equal(r.recovery,'long');assert.equal(r.kind,'counter');
  assert.equal(resourcesFor(c,E).filter(r=>r.id==='feat:lucky').length,1);assert.equal(luckRemaining(c,E),3);
  spendLuck(c,E);assert.equal(luckRemaining(c,E),2);spendLuck(c,E);spendLuck(c,E);
  const before=JSON.stringify(c);assert.throws(()=>spendLuck(c,E),/Sem pontos/);assert.equal(JSON.stringify(c),before);
});
test('Sortudo racial não concede pontos; escolha estruturada do talento é necessária',()=>{
  const c=warrior();c.rules.raceId='halflingLeve';c.features=[{name:'Sortudo'}];
  assert.equal(luckRemaining(c,E),0);assert.equal(luckyResource(c,E),undefined);
  assert.equal(sheetD20Rules(c,{type:'save'},E).luckyFeat,false);
  const before=JSON.stringify(c);assert.throws(()=>spendLuck(c,E),/Sem pontos/);assert.equal(JSON.stringify(c),before);
});
test('descanso curto mantém pontos gastos; longo recupera e não duplica reserva racial/talento',()=>{
  const c=make();c.rules.raceId='halflingRobusto';spendLuck(c,E);
  takeRest(c,'short',E);assert.equal(luckRemaining(c,E),2);
  takeRest(c,'long',E);assert.equal(luckRemaining(c,E),3);
  assert.equal(resourcesFor(c,E).filter(r=>r.id==='feat:lucky').length,1);
});
test('Sortudo pode ser gasto inconsciente, inclusive para resistência de morte',()=>{
  const c=make();c.hpCurrent=0;c.conscious=false;
  spendLuck(c,E);assert.equal(luckRemaining(c,E),2);
  assert.equal(takeRest(c,'long',E),false);assert.equal(luckRemaining(c,E),2);
});
test('escolha racial do talento sobrevive à remoção da classe original; talento da classe removida deixa de conceder pontos',()=>{
  for(const key of ['feat','racialFeat']) {
    const c=make(key);spendLuck(c,E);c.classes=[{classId:'ladino',level:4,subclass:''}];
    assert.equal(luckRemaining(c,E),key==='racialFeat'?2:0);assert.equal(c.ruleState.used['feat:lucky'],1);
  }
});
test('vínculo põe a reserva na escolha de talento, sem associá-la ao traço racial homônimo',()=>{
  const c=make();c.rules.raceId='halflingLeve';const {gains,bindings}=featureResourceBindings(c,E);
  const race=gains.findIndex(g=>g.name==='Sortudo' && !g.classId),feat=gains.findIndex(g=>g.name==='Sortudo' && g.classId);
  assert.ok(race>=0 && feat>=0);assert.equal(bindings.has(race),false);assert.equal(bindings.get(feat)![0].id,'feat:lucky');
  assert.equal(gains[race].reference.pdfPage,27);assert.equal(gains[feat].reference.pdfPage,171);
  const adapted=make('racialFeat');adapted.classes=[{classId:'ladino',level:4,subclass:''}];
  const fallback=featureResourceBindings(adapted,E);const i=fallback.gains.findIndex(g=>g.name==='Sortudo' && g.source==='Talentos');
  assert.ok(i>=0);assert.equal(fallback.bindings.get(i)![0].id,'feat:lucky');
});
test('ajustes explícitos de máximo são preservados e reserva ilegível não vira pontos novos',()=>{
  const c=make();c.rules.resourceMaxOverrides={'feat:lucky':5};spendLuck(c,E);assert.equal(luckRemaining(c,E),4);
  refund(c,luckyResource(c,E)!);assert.equal(luckRemaining(c,E),5);
  c.ruleState.used['feat:lucky']=4;c.rules.resourceMaxOverrides['feat:lucky']=1;
  refund(c,luckyResource(c,E)!);assert.equal(c.ruleState.used['feat:lucky'],3);assert.equal(luckRemaining(c,E),0);
  for(const value of ['ilegível',-1,1.5]) {
    c.ruleState.used['feat:lucky']=value;const before=JSON.stringify(c);
    assert.equal(luckRemaining(c,E),0);assert.throws(()=>spendLuck(c,E));assert.throws(()=>refund(c,luckyResource(c,E)!));assert.equal(JSON.stringify(c),before);
  }
});
test('dado adicional não substitui automaticamente o original nem repete outros dados/modificadores',()=>{
  const faces=[8,3],original=evaluateDicePool({20:1,4:1},4,'normal',{luckyFeat:true},()=>faces.shift()!),before=structuredClone(original);
  const extra=addLuckyDie(original,2);assert.equal(extra.total,15);assert.deepEqual(luckyFaces(extra),[8,2]);
  assert.equal(chooseLuckyDie(extra,1).total,9);assert.equal(chooseLuckyDie(extra,0).total,15);
  assert.deepEqual(original,before);assert.deepEqual(extra.groups[1].faces,[3]);assert.equal(extra.modifier,4);
});
test('com vantagem/desvantagem pode escolher qualquer um dos três d20, mantendo o modo da jogada',()=>{
  for(const mode of ['adv','dis']) {
    const extra=addLuckyDie(dice([4,18],mode),2);
    assert.deepEqual(luckyFaces(extra),[4,18,2]);
    for(const [i,face] of [4,18,2].entries()) {
      const chosen=chooseLuckyDie(extra,i);assert.equal(chosen.total,face);assert.equal(chosen.d20Natural,face);assert.equal(chosen.appliedMode,mode);
    }
  }
  const crit=chooseLuckyDie(addLuckyDie(dice([1,20],'dis'),2),1);assert.equal(crit.d20Natural,20);
});
test('cancelamento por outra criatura mantém a face e não oferece dado adicional nem segundo gasto na mesma jogada',()=>{
  const original=dice([2,19],'dis'),canceled=addLuckyDie(original,null);
  assert.equal(canceled.total,2);assert.equal(canceled.appliedMode,'dis');assert.deepEqual(luckyFaces(canceled),[]);
  assert.match(canceled.breakdown.join(' '),/sem d20 adicional/);assert.throws(()=>addLuckyDie(canceled,20));assert.throws(()=>chooseLuckyDie(canceled,0));
});
test('mínimo de Talento Confiável usa a face escolhida, sem fabricar natural 20 ou somar a correção duas vezes',()=>{
  const original=dice([1],'normal',{reliableTalent:true});
  const extra=addLuckyDie(original,9);assert.equal(chooseLuckyDie(extra,1).total,10);assert.equal(chooseLuckyDie(extra,1).d20Natural,9);
  assert.equal(chooseLuckyDie(extra,0).total,10);
  const high=addLuckyDie(original,20);assert.equal(chooseLuckyDie(high,1).total,20);assert.equal(chooseLuckyDie(high,1).d20Natural,20);
});
test('Sortudo racial pode repetir um 1 do conjunto, inclusive o adicional, uma única vez; escolha mantém os outros dados',()=>{
  const extra=addLuckyDie(dice([13],'normal',{halflingLuck:true}),1);
  assert.equal(canRerollHalfling(extra),true);const repeated=rerollHalfling(extra,()=>20);
  assert.deepEqual(luckyFaces(repeated),[13,20]);assert.equal(repeated.total,13);assert.equal(chooseLuckyDie(repeated,1).total,20);assert.equal(canRerollHalfling(repeated),false);
  const before=rerollHalfling(dice([1,1],'adv',{halflingLuck:true}),()=>7),after=addLuckyDie(before,1);
  assert.deepEqual(luckyFaces(after),[7,1,1]);assert.equal(canRerollHalfling(after),false);
});
test('fórmula livre/ambígua, face inválida e índice fora das opções não aceitam Sortudo',()=>{
  assert.throws(()=>addLuckyDie(evaluateDicePool({20:1},0,'normal'),20));
  assert.throws(()=>addLuckyDie(evaluateDicePool({20:2},0,'normal',{luckyFeat:true}),20));
  for(const face of [0,21,2.5])assert.throws(()=>addLuckyDie(dice([7]),face));
  const extra=addLuckyDie(dice([7]),20);for(const i of [-1,2,0.5])assert.throws(()=>chooseLuckyDie(extra,i));
  assert.throws(()=>addLuckyDie(extra,3));
});
