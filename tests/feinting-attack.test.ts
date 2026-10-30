import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyFeintingAttack,canUseFeintingAttack,commitFeintingWeaponAttack,endFeinting,feintingRollDescription,feintingRollDetails,feintingWeaponOption,knowsFeintingAttack,previewFeintingAttack,resolveFeintingAtTable} from '../src/rules/feinting-attack';
import {pendingFeint} from '../src/rules/feinting-state';
import {attackHasManeuver,beginWeaponAttack,clearWeaponAttacks,currentFeintingAttack,currentWeaponAttack,finishWeaponAttack} from '../src/rules/weapon-attack-session';
import {previewWeaponDamage,commitWeaponDamage} from '../src/rules/weapon-damage';
import {precisionAttackOptions} from '../src/rules/precision-attack';
import {addLuckyDie,chooseLuckyDie,evaluateDicePool,rerollHalfling} from '../src/rules/dice-roll';
import {resetResources} from '../src/rules/resources';
import {beginWeaponReroll,rerollGreatWeapon,weaponRerollResult} from '../src/rules/weapon-rerolls';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');
function make(level=6){
 const c=warrior();c.classes=[{classId:'guerreiro',level,subclassId:'mestreBatalha',subclass:'Mestre de Batalha',hitDie:10,hitDiceUsed:0}];c.hpCurrent=c.hpMax=100;
 c.rules={raceId:'humano',history:[{classId:'guerreiro',level:3,answers:{maneuvers:['Ataque de Finta','Ataque de Precisão','Derrubar']}},{classId:'guerreiro',level:4,answers:{feat:'Adepto Marcial',featManeuvers:['Ataque de Finta','Inspirar']}}]};
 c.ruleState={version:1,used:{},pools:{},active:{},targets:{},conditions:{},portent:[]};c.weapons=[{name:'Rapieira'},{name:'Alabarda'},{name:'Machadinha',attackMode:'thrown'},{name:'Arco Longo'},{name:'Rede'},{name:'Ataque próprio',calculationMode:'manual',bonus:'+5',damage:'1d6+3'}];return c;
}
const choice=(source='guerreiro:superiority')=>({source,target:'  Alvo da mesa  ',declared:true});
const start=(c:any,source='guerreiro:superiority')=>applyFeintingAttack(c,choice(source),E);
test('Finta exige aquisição vigente; talento independente e dado aprimorado pelo nível próprio',()=>{
 const c=make();assert.equal(knowsFeintingAttack(c,E),true);c.rules.history=[];assert.equal(knowsFeintingAttack(c,E),false);c.rules.history=[{classId:'guerreiro',level:7,answers:{maneuvers:['Ataque de Finta']}}];assert.equal(knowsFeintingAttack(c,E),false);
 c.rules.history=[{classId:'guerreiro',level:4,answers:{feat:'Adepto Marcial',featManeuvers:['Ataque de Finta','Inspirar']}}];c.classes[0].subclassId='campeao';assert.equal(previewFeintingAttack(c,choice('feat:superiority'),E).source.die,6);c.classes[0].subclassId='mestreBatalha';c.classes.push({classId:'ladino',level:12});assert.equal(previewFeintingAttack(c,choice('feat:superiority'),E).source.die,6);c.classes[0].level=10;assert.equal(previewFeintingAttack(c,choice('feat:superiority'),E).source.die,10);c.classes[0].level=18;assert.equal(previewFeintingAttack(c,choice('feat:superiority'),E).source.die,12);
});
test('prévia pura e ativação sem RNG: um gasto, alvo aparado e tamanho capturado sem face antecipada',()=>{
 const c=make(),before=structuredClone(c),random=Math.random;Math.random=()=>{throw Error('RNG proibido');};
 try{previewFeintingAttack(c,choice(),E);assert.deepEqual(c,before);const f=start(c);assert.equal(f.target,'Alvo da mesa');assert.equal(f.die,8);assert.equal(pendingFeint(c),f);assert.equal(c.ruleState.used['guerreiro:superiority'],1);}finally{Math.random=random;}
 before.ruleState.used['guerreiro:superiority']=1;assert.deepEqual(c,before);
});
test('ação bônus, próprio turno/distância declarados e alvo válido precedem qualquer gasto',()=>{
 for(const patch of [{declared:false},{target:''},{target:' '.repeat(8)},{target:'x'.repeat(81)},{target:42},{source:'monge:ki'}]){const c=make(),before=structuredClone(c);assert.throws(()=>applyFeintingAttack(c,{...choice(),...patch} as any,E));assert.deepEqual(c,before);assert.equal(pendingFeint(c),undefined);}
});
test('contadores e máximos ilegíveis são preservados; esgotar uma origem não gasta a outra',()=>{
 for(const raw of [null,'0',-1,.5,NaN,5]){const c=make();c.ruleState.used['guerreiro:superiority']=raw;const before=structuredClone(c);assert.throws(()=>start(c),/preservado/);assert.deepEqual(c,before);}
 const c=make();c.rules.resourceMaxOverrides={'guerreiro:superiority':1};start(c);endFeinting(c);assert.equal(canUseFeintingAttack(c,E,'guerreiro:superiority'),false);assert.throws(()=>start(c),/esgotada/);assert.equal(c.ruleState.used['feat:superiority'],undefined);start(c,'feat:superiority');assert.equal(c.ruleState.used['feat:superiority'],1);
});
test('uma Finta por vez, inclusive entre origens e depois de lançar o ataque',()=>{
 const c=make();start(c);const before=JSON.stringify(c);assert.throws(()=>start(c,'feat:superiority'),/já paga/);assert.equal(JSON.stringify(c),before);commitFeintingWeaponAttack(c,c.weapons[0],true,E);assert.throws(()=>start(c),/já paga/);assert.equal(JSON.stringify(c),before);
});
test('arma reconhecida com dano aceita Finta corpo a corpo/distância/arremesso sem exigir proficiência; demais na mesa',()=>{
 const c=make();for(const i of [0,1,2,3])assert.ok(feintingWeaponOption(c,c.weapons[i],E));c.weapons[0].proficient=false;assert.ok(feintingWeaponOption(c,c.weapons[0],E));for(const i of [4,5])assert.equal(feintingWeaponOption(c,c.weapons[i],E),null);
 const w=c.weapons[0];w.attackAdjustment='inválido';assert.equal(feintingWeaponOption(c,w,E),null);delete w.attackAdjustment;c.ruleState.active['druida:wildShape']=true;assert.equal(feintingWeaponOption(c,w,E),null);
});
test('ataques contra outra criatura não usam a Finta; só o próximo contra o alvo declarado a consome',()=>{
 const c=make(),w=c.weapons[0],f=start(c);beginWeaponAttack(c,c.weapons[3]);assert.equal(pendingFeint(c),f);assert.equal(previewWeaponDamage(c,c.weapons[3],{},E).feinting,undefined);
 const before=JSON.stringify(c);assert.throws(()=>commitFeintingWeaponAttack(c,w,false,E),/próximo ataque/);assert.equal(pendingFeint(c),f);assert.equal(JSON.stringify(c),before);
 const attack=commitFeintingWeaponAttack(c,w,true,E);assert.equal(attack.feinting,f);assert.equal(pendingFeint(c),undefined);assert.equal(currentFeintingAttack(c),attack);assert.equal(attackHasManeuver(attack),true);assert.equal(JSON.stringify(c),before);assert.throws(()=>commitFeintingWeaponAttack(c,w,true,E),/indisponível/);
});
test('fontes de vantagem são reunidas antes de cancelar; Finta e inspiração não superam desvantagem',()=>{
 for(const selected of ['normal','adv','dis'] as const)for(const inspired of [false,true]){
  const p=feintingRollDetails(selected,inspired);assert.equal(p.mode,selected==='dis'?'normal':'adv');assert.equal(p.inspired,inspired);const result=evaluateDicePool({20:1},7,p.mode,{},()=>1);assert.equal(result.groups[0].faces.length,selected==='dis'?1:2);assert.match(feintingRollDescription(p),selected==='dis'?/anula.*1d20/:/2d20/);
 }
 assert.throws(()=>feintingRollDetails('inválido' as any));
});
test('acerto acrescenta o dado do tipo da arma, crítico dobra e confirmação não paga superioridade novamente',()=>{
 const c=make(),w=c.weapons[0];start(c,'feat:superiority');commitFeintingWeaponAttack(c,w,true,E);const p=previewWeaponDamage(c,w,{},E);assert.deepEqual(p.parts.at(-1),{name:'Ataque de Finta',formula:'1d6',type:p.parts[0].type});assert.equal(p.feinting!.source,'feat:superiority');assert.equal(commitWeaponDamage(c,w,{critical:true},E).parts.at(-1)!.formula,'2d6');assert.equal(c.ruleState.used['feat:superiority'],1);assert.equal(c.ruleState.used['guerreiro:superiority'],undefined);finishWeaponAttack(c,w);assert.equal(previewWeaponDamage(c,w,{},E).feinting,undefined);
});
test('Finta bloqueia Precisão e outra manobra no mesmo ataque, mantendo d20 e Sortudos',()=>{
 const c=make(),w=c.weapons[0];start(c);commitFeintingWeaponAttack(c,w,true,E);const result=evaluateDicePool({20:1},7,'adv',{halflingLuck:true,luckyFeat:true},()=>1);
 const lucky=chooseLuckyDie(addLuckyDie(result,20),2),repeated=rerollHalfling(lucky,()=>12);for(const r of [result,lucky,repeated])assert.equal(precisionAttackOptions(c,w,r,E).length,0);
 assert.equal(lucky.d20Natural,20);assert.equal(repeated.appliedMode,'adv');const before=JSON.stringify(c);assert.throws(()=>commitWeaponDamage(c,w,{maneuver:'trip',superiority:'guerreiro:superiority',maneuverAbility:'str',noOtherManeuver:true},E),/já usou/);assert.equal(JSON.stringify(c),before);
});
test('próximo ataque, erro e fim do turno encerram o efeito sem reembolso nem herança de dano',()=>{
 const c=make(),w=c.weapons[0];start(c);commitFeintingWeaponAttack(c,w,true,E);beginWeaponAttack(c,c.weapons[3]);assert.equal(currentWeaponAttack(c,w),undefined);assert.equal(previewWeaponDamage(c,w,{},E).feinting,undefined);assert.equal(c.ruleState.used['guerreiro:superiority'],1);
 start(c);endFeinting(c);assert.equal(pendingFeint(c),undefined);assert.equal(c.ruleState.used['guerreiro:superiority'],2);start(c);commitFeintingWeaponAttack(c,w,true,E);endFeinting(c);assert.equal(currentFeintingAttack(c),undefined);assert.equal(c.ruleState.used['guerreiro:superiority'],3);
});
test('Furtivo, Destruição e –5/+10 continuam independentes e repetições da arma preservam o dado da Finta',()=>{
 const c=make(),w=c.weapons[0];c.classes.push({classId:'paladino',level:2},{classId:'ladino',level:3});c.standardSlots={1:{total:2,used:0}};start(c);commitFeintingWeaponAttack(c,w,true,E);const plan=commitWeaponDamage(c,w,{critical:true,sneak:'advantage',smiteSlot:'slot:1'},E);assert.ok(plan.parts.some(p=>p.name==='Ataque Furtivo'&&p.formula==='4d6'));assert.ok(plan.parts.some(p=>p.name==='Destruição Divina'&&p.formula==='4d8'));assert.equal(c.standardSlots[1].used,1);assert.equal(c.ruleState.used['guerreiro:superiority'],1);
 finishWeaponAttack(c,w);start(c);commitFeintingWeaponAttack(c,w,true,E);const damage=previewWeaponDamage(c,w,{},E),faces=[1,6],result=evaluateDicePool({8:2},4,'normal',{},()=>faces.shift()!);const roll=beginWeaponReroll(damage,result,{savage:false,greatWeapon:true});assert.deepEqual(weaponRerollResult(rerollGreatWeapon(roll,[0],()=>4)).groups[0].faces,[4,6]);
 finishWeaponAttack(c,w);c.rules.history.push({classId:'guerreiro',level:6,answers:{feat:'Mestre de Armas Grandes'}});start(c);commitFeintingWeaponAttack(c,c.weapons[1],true,E);assert.ok(previewWeaponDamage(c,c.weapons[1],{powerAttack:true},E).parts.some(p=>p.formula==='10'));
});
test('resolver magia/ataque próprio/sem dano na mesa usa o dado já pago, sem novo gasto nem RNG',()=>{
 const c=make(),f=start(c),before=JSON.stringify(c),random=Math.random;Math.random=()=>{throw Error('Sem RNG');};
 try{assert.throws(()=>resolveFeintingAtTable(c,false));assert.equal(pendingFeint(c),f);assert.equal(resolveFeintingAtTable(c,true),f);assert.equal(pendingFeint(c),undefined);assert.equal(currentFeintingAttack(c),undefined);assert.equal(JSON.stringify(c),before);assert.throws(()=>resolveFeintingAtTable(c,true));}finally{Math.random=random;}
});
test('descansos curto/longo limpam crédito ou ataque e recuperam reservas; limpeza de sessão não reembolsa',()=>{
 for(const rest of ['short','long'] as const)for(const used of [false,true]){const c=make();start(c);if(used)commitFeintingWeaponAttack(c,c.weapons[0],true,E);resetResources(c,rest,E);assert.equal(pendingFeint(c),undefined);assert.equal(currentFeintingAttack(c),undefined);assert.equal(c.ruleState.used['guerreiro:superiority'],0);}
 const c=make();start(c);clearWeaponAttacks();assert.equal(pendingFeint(c),undefined);assert.equal(c.ruleState.used['guerreiro:superiority'],1);
});
test('incapacitação/forma impedem ação; custo já pago e crédito ficam intactos em tentativa inválida',()=>{
 const c=make();c.ruleState.conditions.incapacitado=true;assert.throws(()=>start(c));assert.equal(c.ruleState.used['guerreiro:superiority'],undefined);c.ruleState.conditions={};const f=start(c),before=JSON.stringify(c);c.ruleState.conditions.incapacitado=true;assert.throws(()=>commitFeintingWeaponAttack(c,c.weapons[0],true,E));assert.throws(()=>resolveFeintingAtTable(c,true));assert.equal(pendingFeint(c),f);c.ruleState.conditions={};assert.equal(JSON.stringify(c),before);endFeinting(c);c.ruleState.active['druida:wildShape']=true;assert.throws(()=>start(c),/Forma Selvagem/);
});
test('documento/armas não guardam alvo/face/sessão; cópia não herda Finta e dado pago não muda com nível posterior',()=>{
 const c=make(),before=structuredClone(c);start(c);const copy=JSON.parse(JSON.stringify(c));assert.equal(pendingFeint(copy),undefined);assert.equal(copy.ruleState.used['guerreiro:superiority'],1);c.classes[0].level=18;commitFeintingWeaponAttack(c,c.weapons[0],true,E);assert.equal(previewWeaponDamage(c,c.weapons[0],{},E).feinting!.die,8);assert.deepEqual(c.weapons,before.weapons);assert.equal(JSON.stringify(c).includes('Alvo da mesa'),false);c.weapons[0].calculationMode='manual';assert.throws(()=>previewWeaponDamage(c,c.weapons[0],{},E),/Finta mudou/);
});
