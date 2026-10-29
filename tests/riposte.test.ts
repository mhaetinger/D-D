import {test} from 'node:test';
import assert from 'node:assert/strict';
import {riposteOption,previewRiposte,commitRiposte} from '../src/rules/riposte';
import {beginWeaponAttack,currentWeaponAttack,currentRiposte,finishRiposte,finishWeaponAttack,clearWeaponAttacks,attackHasManeuver,beginFeintingWeaponAttack} from '../src/rules/weapon-attack-session';
import {previewWeaponDamage,commitWeaponDamage} from '../src/rules/weapon-damage';
import {precisionAttackOptions} from '../src/rules/precision-attack';
import {evaluateDicePool,addLuckyDie,chooseLuckyDie,rerollHalfling} from '../src/rules/dice-roll';
import {beginWeaponReroll,rerollGreatWeapon,weaponRerollResult} from '../src/rules/weapon-rerolls';
import {applyFeintingAttack} from '../src/rules/feinting-attack';
import {pendingFeint} from '../src/rules/feinting-state';
import {resetResources} from '../src/rules/resources';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');
function make(level=6){
 const c=warrior();c.classes=[{classId:'guerreiro',level,subclassId:'mestreBatalha',hitDie:10,hitDiceUsed:0}];c.hpCurrent=c.hpMax=100;
 c.rules={raceId:'humano',history:[{classId:'guerreiro',level:3,answers:{maneuvers:['Contra-Atacar','Ataque de Precisão','Derrubar']}},{classId:'guerreiro',level:4,answers:{feat:'Adepto Marcial',featManeuvers:['Ataque de Finta','Ataque Trespassante']}}]};
 c.ruleState={version:1,used:{},active:{},pools:{},targets:{},portent:[]};c.weapons=[{name:'Rapieira'},{name:'Alabarda'},{name:'Adaga',attackMode:'thrown'},{name:'Arco Longo'},{name:'Rede'},{name:'Ataque próprio',calculationMode:'manual',bonus:'+5',damage:'1d6+3'}];return c;
}
const choice=(extra:any={})=>({source:'guerreiro:superiority',target:'  Atacante  ',triggered:true,newAttack:true,...extra});
const start=(c:any,extra:any={})=>commitRiposte(c,c.weapons[0],choice(extra),E);
test('Contra-Atacar exige aquisição vigente; talento independente e melhorias pelos níveis próprios',()=>{
 const c=make();assert.ok(riposteOption(c,c.weapons[0],E));c.rules.history=[];assert.equal(riposteOption(c,c.weapons[0],E),null);
 c.rules.history=[{classId:'guerreiro',level:7,answers:{maneuvers:['Contra-Atacar']}}];assert.equal(riposteOption(c,c.weapons[0],E),null);
 c.rules.history=[{classId:'guerreiro',level:4,answers:{feat:'Adepto Marcial',featManeuvers:['Contra-Atacar']}}];c.classes[0].subclassId='campeao';assert.equal(previewRiposte(c,c.weapons[0],choice({source:'feat:superiority'}),E).source.die,6);
 c.classes[0].subclassId='mestreBatalha';c.classes.push({classId:'ladino',level:12});assert.equal(previewRiposte(c,c.weapons[0],choice(),E).source.die,8);assert.equal(previewRiposte(c,c.weapons[0],choice({source:'feat:superiority'}),E).source.die,6);
 c.classes[0].level=10;c.classes[1].level=10;assert.equal(previewRiposte(c,c.weapons[0],choice({source:'feat:superiority'}),E).source.die,10);c.classes[0].level=18;c.classes[1].level=2;assert.equal(previewRiposte(c,c.weapons[0],choice(),E).source.die,12);
});
test('controle cobre armas reconhecidas corpo a corpo com dano, sem exigir proficiência; demais na mesa',()=>{
 const c=make();assert.ok(riposteOption(c,c.weapons[1],E));c.weapons[0].proficient=false;assert.ok(riposteOption(c,c.weapons[0],E));for(const w of c.weapons.slice(2))assert.equal(riposteOption(c,w,E),null);
 c.weapons[0].attackAdjustment='inválido';assert.equal(riposteOption(c,c.weapons[0],E),null);delete c.weapons[0].attackAdjustment;c.ruleState.active['druida:wildShape']=true;assert.equal(riposteOption(c,c.weapons[0],E),null);
});
test('prévia sem mutação/RNG; custo antecipado único, alvo aparado e dado capturado sem rolar dano',()=>{
 const c=make(),before=structuredClone(c),random=Math.random;Math.random=()=>{throw Error('RNG proibido');};
 try{previewRiposte(c,c.weapons[0],choice(),E);assert.deepEqual(c,before);const attack=start(c,{source:'feat:superiority'});assert.equal(attack.riposte?.target,'Atacante');assert.equal(attack.riposte?.die,6);assert.equal(currentRiposte(c),attack);assert.equal(attackHasManeuver(attack),true);before.ruleState.used['feat:superiority']=1;assert.deepEqual(c,before);}finally{Math.random=random;}
});
test('erro corpo a corpo, reação/alcance, novo ataque e alvo válido precedem qualquer gasto',()=>{
 for(const patch of [{triggered:false},{triggered:'sim'},{newAttack:false},{target:''},{target:' '.repeat(5)},{target:'x'.repeat(81)},{target:42},{source:'monge:ki'}]){const c=make(),before=structuredClone(c);assert.throws(()=>start(c,patch));assert.deepEqual(c,before);assert.equal(currentRiposte(c),undefined);}
 for(const mutate of [(c:any)=>c.hpCurrent=0,(c:any)=>c.ruleState.conditions={incapacitado:true},(c:any)=>c.conscious=false]){const c=make();mutate(c);const before=structuredClone(c);assert.throws(()=>start(c));assert.deepEqual(c,before);}
});
test('contadores ilegíveis/esgotados e máximos ajustados são preservados sem gastar a outra origem',()=>{
 for(const used of [null,'0',-1,.5,NaN,5]){const c=make();c.ruleState.used['guerreiro:superiority']=used;const before=structuredClone(c);assert.throws(()=>start(c),/preservado/);assert.deepEqual(c,before);}
 for(const used of [[],42]){const c=make();c.ruleState.used=used;const before=structuredClone(c);assert.throws(()=>start(c));assert.deepEqual(c,before);}
 const c=make();c.rules.resourceMaxOverrides={'guerreiro:superiority':1};start(c);finishRiposte(c);assert.throws(()=>start(c),/esgotada/);start(c,{source:'feat:superiority'});assert.equal(c.ruleState.used['guerreiro:superiority'],1);assert.equal(c.ruleState.used['feat:superiority'],1);
});
test('contra-ataque pendente bloqueia segunda cobrança, inclusive em outra arma/origem',()=>{
 const c=make();start(c);const before=structuredClone(c);assert.throws(()=>start(c,{source:'feat:superiority'}),/já há/i);assert.throws(()=>commitRiposte(c,c.weapons[1],choice(),E),/já há/i);assert.deepEqual(c,before);
});
test('dano no acerto inclui dado já pago do tipo da arma e dobra em crítico sem novo gasto',()=>{
 const c=make(),w=c.weapons[0];start(c,{source:'feat:superiority'});const p=previewWeaponDamage(c,w,{},E);assert.deepEqual(p.parts.at(-1),{name:'Contra-Atacar',formula:'1d6',type:p.parts[0].type});assert.equal(commitWeaponDamage(c,w,{critical:true},E).parts.at(-1)?.formula,'2d6');assert.equal(c.ruleState.used['feat:superiority'],1);assert.equal(c.ruleState.used['guerreiro:superiority'],undefined);
});
test('Precisão/outra manobra ficam bloqueadas; Sortudo e halfling preservam o mesmo contra-ataque',()=>{
 const c=make(),w=c.weapons[0],attack=start(c),result=evaluateDicePool({20:1},7,'dis',{halflingLuck:true,luckyFeat:true},()=>1);
 const lucky=chooseLuckyDie(addLuckyDie(result,20),2),repeated=rerollHalfling(lucky,()=>12);for(const r of [result,lucky,repeated])assert.equal(precisionAttackOptions(c,w,r,E).length,0);assert.equal(currentWeaponAttack(c,w),attack);
 for(const maneuver of ['trip','sweeping']){const before=structuredClone(c);assert.throws(()=>commitWeaponDamage(c,w,{maneuver:maneuver as any,superiority:'guerreiro:superiority',noOtherManeuver:true},E),/já usou uma manobra/);assert.deepEqual(c,before);}
});
test('novo ataque, erro e encerramento descartam contexto sem reembolsar ou herdar dano',()=>{
 const c=make(),w=c.weapons[0];start(c);finishRiposte(c);assert.equal(currentRiposte(c),undefined);assert.equal(c.ruleState.used['guerreiro:superiority'],1);assert.equal(previewWeaponDamage(c,w,{},E).riposte,undefined);
 start(c);beginWeaponAttack(c,c.weapons[1]);assert.equal(currentWeaponAttack(c,w),undefined);assert.equal(c.ruleState.used['guerreiro:superiority'],2);
 start(c);beginFeintingWeaponAttack(c,c.weapons[1],{source:'feat:superiority',name:'Adepto Marcial',die:6,target:'Outro'});assert.equal(currentRiposte(c),undefined);assert.equal(c.ruleState.used['guerreiro:superiority'],3);
});
test('substituir/remover arma ou documento não reaproveita sessão; arma alterada requer resolução na mesa',()=>{
 const c=make(),w=c.weapons[0];start(c);w.attackMode='thrown';assert.throws(()=>previewWeaponDamage(c,w,{},E),/contra-ataque mudou/);delete w.attackMode;w.calculationMode='manual';assert.throws(()=>previewWeaponDamage(c,w,{},E),/contra-ataque mudou/);delete w.calculationMode;
 const clone=structuredClone(c);assert.equal(currentRiposte(clone),undefined);c.weapons[0]={name:'Rapieira'};assert.equal(currentRiposte(c),undefined);assert.throws(()=>commitRiposte(c,w,choice(),E));assert.ok(start(c));
});
test('Finta pendente no mesmo alvo impede combinação; contra outra criatura não consome vantagem',()=>{
 const c=make();applyFeintingAttack(c,{source:'feat:superiority',target:'Atacante',declared:true},E);const f=pendingFeint(c),before=structuredClone(c);assert.throws(()=>start(c),/Finta pendente/);assert.deepEqual(c,before);start(c,{target:'Outra criatura'});assert.equal(pendingFeint(c),f);assert.equal(previewWeaponDamage(c,c.weapons[0],{},E).feinting,undefined);
});
test('Furtivo por turno, Destruição, –5/+10 e rerrolagens da arma mantêm custos e dados separados',()=>{
 const c=make(),w=c.weapons[0];c.classes.push({classId:'paladino',level:2},{classId:'ladino',level:3});c.standardSlots={1:{total:2,used:0}};start(c);const p=commitWeaponDamage(c,w,{critical:true,sneak:'ally',smiteSlot:'slot:1'},E);assert.ok(p.parts.some(p=>p.name==='Ataque Furtivo'&&p.formula==='4d6'));assert.ok(p.parts.some(p=>p.name==='Destruição Divina'&&p.formula==='4d8'));assert.equal(c.standardSlots[1].used,1);assert.equal(c.ruleState.used['guerreiro:superiority'],1);
 finishWeaponAttack(c,w);start(c);const plan=previewWeaponDamage(c,w,{},E),faces=[1,6],result=evaluateDicePool({8:2},2,'normal',{},()=>faces.shift()!);const repeat=beginWeaponReroll(plan,result,{greatWeapon:true,savage:false});assert.deepEqual(weaponRerollResult(rerollGreatWeapon(repeat,[0],()=>4)).groups[0].faces,[4,6]);
 finishRiposte(c);c.rules.history.push({classId:'guerreiro',level:6,answers:{feat:'Mestre de Armas Grandes'}});commitRiposte(c,c.weapons[1],choice(),E);assert.ok(previewWeaponDamage(c,c.weapons[1],{powerAttack:true},E).parts.some(p=>p.formula==='10'));
});
test('descansos e limpeza de contexto recuperam/descartam corretamente, sem novo campo persistido',()=>{
 for(const kind of ['short','long'] as const){const c=make();start(c);resetResources(c,kind,E);assert.equal(currentRiposte(c),undefined);assert.equal(c.ruleState.used['guerreiro:superiority'],0);}
 const c=make();start(c);clearWeaponAttacks();assert.equal(currentRiposte(c),undefined);assert.equal(c.ruleState.used['guerreiro:superiority'],1);
});
