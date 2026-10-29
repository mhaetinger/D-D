import {test} from 'node:test';
import assert from 'node:assert/strict';
import {armorStealthDisadvantage,sheetRollDetails,sheetRollTraits} from '../src/rules/roll-context';
import {duelistWeapons,previewDefensiveDuelist,previewInspiringLeader,applyInspiringLeader} from '../src/rules/combat-feats';
import {evaluateDicePool,sheetD20Rules,addLuckyDie,chooseLuckyDie,rerollHalfling} from '../src/rules/dice-roll';
import {armorClass} from '../src/rules/combat';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');
function make(){const c=warrior();c.classes[0].level=8;c.armorEquipped='';c.shieldEquipped=false;c.hpCurrent=40;c.hpMax=80;c.hpTemp=19;c.hpTempSource='Fonte anterior';c.abilities.dex.score=16;c.abilities.cha.score=16;c.rules.history.push({classId:'guerreiro',level:4,answers:{feat:'Duelista Defensivo'}},{classId:'guerreiro',level:6,answers:{feat:'Líder Inspirador'}});c.weapons=[{name:'Rapieira'},{name:'Dardo'},{name:'Alabarda'}];c.ruleState={version:1,used:{},pools:{},targets:{},active:{},conditions:{}};return c;}
test('exaustão e veneno: habilidade/ataque/resistência distintos, sem inventar penalidade em resistência por veneno',()=>{
 const c=make();c.ruleState.conditions.envenenado=true;for(const type of ['check','attack','save'] as const)assert.equal(sheetRollDetails(c,{type,ability:'cha'},'normal',E).mode,type==='save'?'normal':'dis');
 c.ruleState.conditions={};for(const n of [1,2,3,4,5]){c.exhaustion=n;for(const type of ['check','attack','save'] as const)assert.equal(sheetRollDetails(c,{type,ability:'cha'},'normal',E).mode,type==='check'||n>=3?'dis':'normal');}
});
test('caído/cego/impedido afetam ataques; impedido impõe desvantagem só à resistência de DES',()=>{
 for(const id of ['caido','cego','impedido']){const c=make();c.ruleState.conditions[id]=true;assert.equal(sheetRollDetails(c,{type:'attack'},'normal',E).mode,'dis');assert.equal(sheetRollDetails(c,{type:'check',ability:'int'},'normal',E).mode,'normal');for(const ability of ['str','dex','con'])assert.equal(sheetRollDetails(c,{type:'save',ability},'normal',E).mode,id==='impedido'&&ability==='dex'?'dis':'normal');}
});
test('invisibilidade/Finta/inspiração e desvantagens cancelam uma só vez, sem alterar a ficha',()=>{
 const c=make();c.ruleState.conditions={invisivel:true,envenenado:true};c.heroicInspiration=true;c.ruleState.inspirationReady=true;const before=structuredClone(c),p=sheetRollDetails(c,{type:'attack'},'adv',E,true,['Finta']);assert.equal(p.mode,'normal');assert.equal(p.advantage.length,4);assert.equal(p.disadvantage.length,1);assert.deepEqual(c,before);
});
test('armadura/escudo sem proficiência afetam apenas jogadas que usam FOR/DES; não dão penalidade a ataque mágico de CAR',()=>{
 const c=make();c.classes=[{classId:'mago',level:8}];c.armorProficiencies=[];c.armorEquipped='Cota de malha';c.shieldEquipped=true;for(const type of ['check','save','attack'] as const)for(const ability of ['str','dex','con','int','wis','cha'])assert.equal(sheetRollDetails(c,{type,ability},'normal',E).mode,['str','dex'].includes(ability)?'dis':'normal');
 c.armorEquipped='';assert.equal(sheetRollDetails(c,{type:'save',ability:'dex'},'normal',E).mode,'dis');c.shieldEquipped=false;assert.equal(sheetRollDetails(c,{type:'save',ability:'dex'},'normal',E).mode,'normal');
});
test('Furtividade usa metadado do catálogo, Maestria remove só a penalidade da armadura média',()=>{
 const c=make();for(const [name,dis] of [['Armadura acolchoada',true],['Brunea',true],['Meia-armadura',true],['Peitoral',false],['Cota de malha +1',true],['Couro',false]] as const){c.armorEquipped=name;assert.equal(armorStealthDisadvantage(c,E),dis,name);assert.equal(sheetRollDetails(c,{type:'check',skill:'furtividade'},'normal',E).mode,dis?'dis':'normal',name);}
 c.rules.history.push({classId:'guerreiro',level:8,answers:{feat:'Maestria em Armadura Média'}});for(const [name,dis] of [['Brunea',false],['Meia-armadura',false],['Armadura acolchoada',true],['Cota de malha',true]] as const){c.armorEquipped=name;assert.equal(armorStealthDisadvantage(c,E),dis);}
 c.armorEquipped='Brunea';c.ruleState.conditions.envenenado=true;assert.equal(sheetRollDetails(c,{type:'check',skill:'furtividade'},'normal',E).mode,'dis');
});
test('Fúria concede vantagem a testes/resistências de FOR, sem vantagem geral em ataques ou armadura pesada',()=>{
 const c=make();c.classes=[{classId:'barbaro',level:18}];c.ruleState.active['barbaro:rage']=true;for(const type of ['check','save','attack'] as const)assert.equal(sheetRollDetails(c,{type,ability:'str'},'normal',E).mode,type==='attack'?'normal':'adv');assert.equal(sheetRollDetails(c,{type:'check',skill:'atletismo'},'normal',E).mode,'adv');c.armorEquipped='Cota de malha';assert.equal(sheetRollDetails(c,{type:'save',ability:'str'},'normal',E).mode,'normal');
});
test('arma pesada de criatura Pequena, Forma Selvagem e contexto desconhecido não presumem estatísticas da forma',()=>{
 const c=make();c.rules.raceId='halflingLeve';assert.equal(sheetRollDetails(c,{type:'attack',weapon:c.weapons[2]},'normal',E).mode,'dis');assert.equal(sheetRollDetails(c,{type:'attack',weapon:c.weapons[0]},'normal',E).mode,'normal');c.ruleState.active['druida:wildShape']=true;c.armorEquipped='Cota de malha';c.classes=[{classId:'druida',level:8}];assert.equal(sheetRollDetails(c,{type:'attack',weapon:c.weapons[2]},'normal',E).mode,'normal');assert.equal(sheetRollDetails(c,{type:'check',skill:'furtividade'},'normal',E).mode,'normal');assert.ok(sheetRollTraits(c,{type:'check'},E).notes.length);
});
test('medo e gatilhos raciais não são deduzidos do alvo; iniciativa conserva as próprias fontes',()=>{
 const c=make();c.ruleState.conditions.amedrontado=true;assert.equal(sheetRollDetails(c,{type:'attack'},'normal',E).mode,'normal');assert.match(sheetRollTraits(c,{type:'attack'},E).notes.join(),/medo/);c.classes=[{classId:'barbaro',level:8}];assert.equal(sheetRollDetails(c,{type:'check',initiative:true},'normal',E).mode,'adv');c.exhaustion=1;assert.equal(sheetRollDetails(c,{type:'check',initiative:true},'normal',E).mode,'normal');
});
test('Força Indomável usa valor de FOR no TOTAL do teste, preservando natural e repetições de Sortudo',()=>{
 const c=make();c.classes=[{classId:'barbaro',level:18}];c.abilities.str.score=24;c.rules.raceId='halflingLeve';c.rules.history.push({classId:'barbaro',level:4,answers:{feat:'Sortudo'}});const context={type:'check' as const,skill:'atletismo'},rules=sheetD20Rules(c,context,E);let r=evaluateDicePool({20:1},-3,'dis',rules,()=>1);assert.equal(r.total,24);assert.equal(r.d20Natural,1);r=rerollHalfling(r,()=>20);assert.equal(r.total,24);r=addLuckyDie(r,2);r=chooseLuckyDie(r,2);assert.equal(r.total,24);assert.equal(r.d20Natural,2);
 const high=evaluateDicePool({20:1},10,'normal',rules,()=>20);assert.equal(high.total,30);for(const type of ['save','attack'] as const)assert.equal(sheetD20Rules(c,{type,ability:'str'},E).indomitableMight,undefined);assert.equal(sheetD20Rules(c,{type:'check',ability:'dex'},E).indomitableMight,undefined);c.classes[0].level=17;assert.equal(sheetD20Rules(c,context,E).indomitableMight,undefined);c.classes[0].level=18;c.ruleState.active['druida:wildShape']=true;assert.equal(sheetD20Rules(c,context,E).indomitableMight,undefined);
});
test('Duelista usa acuidade e proficiência, incluindo Dardo, sem exigir DES no ataque ou arma corpo a corpo',()=>{
 const c=make();assert.deepEqual(duelistWeapons(c,E).map((x:any)=>x.index),[0,1]);const before=structuredClone(c),ac=armorClass(c,E).total,p=previewDefensiveDuelist(c,{weapon:1,total:ac,critical:false,declared:true},E);assert.equal(p.after,ac+3);assert.equal(p.miss,true);assert.deepEqual(c,before);assert.equal(armorClass(c,E).total,ac);
});
test('Duelista: igualdade ainda acerta, crítico não erra, CA escrita e demais bônus entram uma vez',()=>{
 const c=make();c.rules.fieldOverrides={armor:true};c.baseAcArmor=18;c.acFormula='written';c.ruleState.active['spell:shieldOfFaith']=true;const ac=armorClass(c,E).total;assert.equal(ac,20);assert.equal(previewDefensiveDuelist(c,{weapon:0,total:23,critical:false,declared:true},E).miss,false);assert.equal(previewDefensiveDuelist(c,{weapon:0,total:20,critical:true,declared:true},E).miss,false);assert.equal(previewDefensiveDuelist(c,{weapon:0,total:-2,critical:true,declared:true},E).miss,false);
});
test('Duelista rejeita pré-requisito, arma, proficiência, declaração, ataque já errado e valores inválidos antes de qualquer mutação',()=>{
 const plan={weapon:0,total:20,critical:false,declared:true};for(const mutate of [(c:any)=>c.rules.history=[],(c:any)=>c.abilities.dex.score=12,(c:any)=>c.hpCurrent=0,(c:any)=>c.ruleState.active['druida:wildShape']=true,(c:any)=>c.weapons[0].proficient=false]){const c=make();mutate(c);const before=structuredClone(c);assert.throws(()=>previewDefensiveDuelist(c,plan,E));assert.deepEqual(c,before);}
 for(const extra of [{weapon:2},{declared:false},{total:0},{total:1},{total:1.5},{total:NaN},{critical:'sim'}])assert.throws(()=>previewDefensiveDuelist(make(),{...plan,...extra} as any,E));
});
test('Líder usa nível total + CAR, até seis incluindo você, sem gastar recurso ou modificar aliados',()=>{
 const c=make();c.classes=[{classId:'guerreiro',level:6},{classId:'bardo',level:2}];const choice={allies:[' Ana ','Bia','Caio','Davi','Eli'],self:'keep' as const,declared:true},before=structuredClone(c),p=applyInspiringLeader(c,choice,E);assert.equal(p.temporary,11);assert.equal(p.count,6);assert.equal(p.allies[0],'Ana');assert.deepEqual(c,before);assert.equal(previewInspiringLeader(c,{allies:['🐉','👑'],self:'none',declared:true},E).count,2);
});
test('Líder substitui temporários somente com escolha explícita, mesmo quando os novos são menores; não cura',()=>{
 const c=make(),before=structuredClone(c);applyInspiringLeader(c,{allies:[],self:'replace',declared:true},E);before.hpTemp=11;before.hpTempSource='Líder Inspirador';assert.deepEqual(c,before);
});
test('Líder rejeita requisitos, nomes repetidos, excesso, vazio e declaração ausente preservando toda a ficha',()=>{
 const good={allies:['Ana'],self:'none' as const,declared:true};for(const extra of [{allies:[]},{allies:['Ana','ana']},{allies:['x'.repeat(81)]},{allies:Array.from({length:6},(_,i)=>'Aliado '+i),self:'keep'},{self:'outro'},{declared:false}]){const c=make(),before=structuredClone(c);assert.throws(()=>applyInspiringLeader(c,{...good,...extra} as any,E));assert.deepEqual(c,before);}
 for(const mutate of [(c:any)=>c.rules.history=[],(c:any)=>c.abilities.cha.score=12,(c:any)=>c.hpCurrent=0,(c:any)=>c.ruleState.active['druida:wildShape']=true]){const c=make();mutate(c);const before=structuredClone(c);assert.throws(()=>previewInspiringLeader(c,good,E));assert.deepEqual(c,before);}
});
