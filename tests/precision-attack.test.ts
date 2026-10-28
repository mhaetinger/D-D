import {test} from 'node:test';
import assert from 'node:assert/strict';
import {precisionAttackOptions,previewPrecisionAttack,commitPrecisionAttack} from '../src/rules/precision-attack';
import {evaluateDicePool,addLuckyDie,chooseLuckyDie,rerollHalfling,type DiceResult} from '../src/rules/dice-roll';
import {beginWeaponAttack,currentWeaponAttack,isCurrentWeaponAttack,markAttackPrecision,finishWeaponAttack,clearWeaponAttacks} from '../src/rules/weapon-attack-session';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');
function make(){
  const c=warrior();c.classes[0]={...c.classes[0],level:4,subclassId:'mestreBatalha'};c.hpCurrent=c.hpMax=100;
  c.weapons=[{name:'Rapieira'}];c.rules.history=[{classId:'guerreiro',level:3,answers:{maneuvers:['Ataque de Precisão','Derrubar','Ataque Desarmante']}},{classId:'guerreiro',level:4,answers:{feat:'Adepto Marcial',featManeuvers:['Inspirar','Aparar']}}];
  c.ruleState={used:{'guerreiro:superiority':1},active:{},pools:{},targets:{}};return c;
}
const choice={source:'guerreiro:superiority',unresolved:true,noOtherManeuver:true};
function roll(faces:number[],mode='normal',modifier=5):DiceResult{
  const remaining=[...faces];return evaluateDicePool({20:1},modifier,mode,{halflingLuck:true,luckyFeat:true},()=>{assert.ok(remaining.length);return remaining.shift()!;});
}
test('Precisão aumenta total sem mudar natural, modo, bônus, grupos e critério de crítico/erro',()=>{
  for(const natural of [1,12,19,20])for(const mode of ['normal','adv','dis']){
    const c=make(),result=roll(mode==='normal'?[natural]:[natural,natural],mode,-2),before=structuredClone(result),snapshot=JSON.stringify(c);
    assert.equal(previewPrecisionAttack(c,c.weapons[0],result,choice,E).die,8);assert.equal(JSON.stringify(c),snapshot);
    const next=commitPrecisionAttack(c,c.weapons[0],result,choice,8,E);
    assert.equal(next.total,natural+6);assert.equal(next.d20Natural,natural);assert.equal(next.appliedMode,mode);assert.equal(next.modifier,-2);assert.deepEqual(next.groups,before.groups);assert.deepEqual(result,before);
    assert.equal(next.breakdown.filter(x=>x.startsWith('Ataque de Precisão')).length,1);assert.equal(c.ruleState.used['guerreiro:superiority'],2);
  }
});
test('qualquer origem paga Precisão conhecida; Adepto não exige Mestre de Batalha e pode vir da criação racial',()=>{
  const c=make(),result=roll([8]);const next=commitPrecisionAttack(c,c.weapons[0],result,{...choice,source:'feat:superiority'},6,E);
  assert.equal(next.total,19);assert.equal(c.ruleState.used['feat:superiority'],1);assert.equal(c.ruleState.used['guerreiro:superiority'],1);
  c.classes[0].subclassId='campeao';assert.equal(precisionAttackOptions(c,c.weapons[0],result,E).length,0);
  c.rules.history[1].answers.featManeuvers=['Ataque de Precisão','Aparar'];assert.equal(precisionAttackOptions(c,c.weapons[0],result,E)[0].die,6);
  c.classes[0].level=3;assert.equal(precisionAttackOptions(c,c.weapons[0],result,E).length,0);
  c.rules.raceId='humanoVariante';c.rules.history=[{classId:'guerreiro',level:1,answers:{racialFeat:'Adepto Marcial',racialFeatManeuvers:['Ataque de Precisão','Aparar']}}];assert.equal(precisionAttackOptions(c,c.weapons[0],result,E)[0].die,6);
});
test('arco, arremesso e rede aceitam Precisão; dano da arma não é requisito, ataques/fórmulas manuais ficam na mesa',()=>{
  const c=make(),result=roll([7]);for(const w of [{name:'Arco Longo'},{name:'Adaga',attackMode:'thrown'},{name:'Rede'}]){c.weapons=[w];assert.equal(precisionAttackOptions(c,w,result,E).length,2);}
  for(const w of [{name:'Ataque desarmado',damage:'1d4',bonus:'+4'},{name:'Rapieira',calculationMode:'manual',bonus:'+5',damage:'1d8'}]){c.weapons=[w];assert.equal(precisionAttackOptions(c,w,result,E).length,0);}
});
test('Sortudo antes/depois de Precisão conserva o mesmo adicional sem acumular, mesmo escolhendo 1 ou 20',()=>{
  for(const mode of ['normal','adv','dis'])for(const extra of [1,20]){
    const c=make(),base=roll(mode==='normal'?[12]:[2,12],mode),before=structuredClone(base);
    const precision=commitPrecisionAttack(c,c.weapons[0],base,choice,4,E),lucky=addLuckyDie(precision,extra);
    for(let i=0;i<(mode==='normal'?2:3);i++){
      const chosen=chooseLuckyDie(lucky,i);assert.equal(chosen.total,chosen.d20Natural!+9);assert.deepEqual(chosen.precision,precision.precision);assert.equal(chosen.breakdown.filter(x=>x.startsWith('Ataque de Precisão')).length,1);
    }
    const c2=make(),firstLucky=chooseLuckyDie(addLuckyDie(base,extra),mode==='normal'?1:2),lastPrecision=commitPrecisionAttack(c2,c2.weapons[0],firstLucky,choice,4,E);
    assert.equal(lastPrecision.total,extra+9);assert.equal(lastPrecision.d20Natural,extra);assert.deepEqual(base,before);
    const opposed=addLuckyDie(precision,null);assert.equal(opposed.total,precision.total);assert.deepEqual(opposed.precision,precision.precision);
    assert.equal(c.ruleState.used['guerreiro:superiority'],2);
  }
});
test('halfling conserva o dado de Precisão ao repetir 1 inicial ou adicional, sem rerrolar superioridade',()=>{
  for(const replacement of [1,20]){
    const c=make(),precise=commitPrecisionAttack(c,c.weapons[0],roll([1]),choice,3,E);let calls=0;
    const repeated=rerollHalfling(precise,()=>{calls++;return replacement;});assert.equal(repeated.total,replacement+8);assert.equal(calls,1);assert.deepEqual(repeated.precision,precise.precision);
    const c2=make(),lucky=addLuckyDie(roll([12]),1),next=commitPrecisionAttack(c2,c2.weapons[0],lucky,choice,3,E);
    const again=chooseLuckyDie(rerollHalfling(next,()=>replacement),1);assert.equal(again.total,replacement+8);assert.deepEqual(again.precision,next.precision);
  }
});
test('faces inválidas, reserva ilegível/esgotada, confirmação ausente e segunda aplicação não gastam',()=>{
  const c=make(),base=roll([13]);
  const unchanged=(fn:()=>void)=>{const before=JSON.stringify(c);assert.throws(fn);assert.equal(JSON.stringify(c),before);};
  for(const face of [0,9,-1,1.5,NaN,Infinity])unchanged(()=>commitPrecisionAttack(c,c.weapons[0],base,choice,face,E));
  for(const extra of [{source:'__proto__'},{source:'feat:lucky'},{noOtherManeuver:false},{unresolved:false},{noOtherManeuver:'true'}])unchanged(()=>commitPrecisionAttack(c,c.weapons[0],base,{...choice,...extra} as any,2,E));
  for(const used of [-1,0.5,'1',NaN,4]){c.ruleState.used['guerreiro:superiority']=used;unchanged(()=>commitPrecisionAttack(c,c.weapons[0],base,choice,2,E));}
  c.ruleState.used['guerreiro:superiority']=0;const precise=commitPrecisionAttack(c,c.weapons[0],base,choice,2,E);unchanged(()=>commitPrecisionAttack(c,c.weapons[0],precise,choice,2,E));
});
test('ataque removido, incapacidade, forma, múltiplos d20 ou dano não concedem opção contextual',()=>{
  const c=make(),base=roll([5]),entry=c.weapons[0];c.weapons=[];assert.equal(precisionAttackOptions(c,entry,base,E).length,0);c.weapons=[entry];
  c.hpCurrent=0;assert.equal(precisionAttackOptions(c,entry,base,E).length,0);c.hpCurrent=100;c.ruleState.active['druida:wildShape']=true;assert.equal(precisionAttackOptions(c,entry,base,E).length,0);c.ruleState.active={};
  for(const counts of [{20:2},{8:1}] as Record<number,number>[])assert.equal(precisionAttackOptions(c,entry,evaluateDicePool(counts,0,'normal'),E).length,0);
});
test('sessão identifica ataque, proprietário e arma; nova jogada/resolução/troca encerra a antiga sem guardar no documento',()=>{
  const c=make(),entry=c.weapons[0],before=JSON.stringify(c),attack=beginWeaponAttack(c,entry);
  assert.equal(currentWeaponAttack(c,entry),attack);markAttackPrecision(attack);assert.throws(()=>markAttackPrecision(attack));
  const next=beginWeaponAttack(c,entry);assert.equal(next.precisionUsed,false);assert.equal(isCurrentWeaponAttack(attack),false);assert.throws(()=>markAttackPrecision(attack));
  assert.equal(currentWeaponAttack(structuredClone(c),entry),undefined);finishWeaponAttack(c,entry);assert.equal(isCurrentWeaponAttack(next),false);
  const third=beginWeaponAttack(c,entry);clearWeaponAttacks();assert.equal(isCurrentWeaponAttack(third),false);assert.equal(JSON.stringify(c),before);
});
