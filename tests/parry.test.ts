import {test} from 'node:test';
import assert from 'node:assert/strict';
import {knowsParry,parryOptions,previewParry} from '../src/rules/parry';
import {previewTypedDamage,typedDamageSummary,type DamagePacket} from '../src/rules/damage';
import {applyTypedDamage} from '../src/rules/combat';
import {resetResources} from '../src/rules/resources';
import {startConcentration,concentration} from '../src/rules/concentration';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');
function make(level=5){const c=warrior();c.classes=[{classId:'guerreiro',level,subclassId:'mestreBatalha',subclass:'Mestre de Batalha',hitDie:10,hitDiceUsed:0}];c.abilities.dex.score=14;c.abilities.str.score=20;c.hpCurrent=c.hpMax=100;c.hpTemp=0;c.armorEquipped='';c.shieldEquipped=false;c.rules={raceId:'humano',history:[{classId:'guerreiro',level:3,answers:{maneuvers:['Aparar','Derrubar','Ataque de Precisão']}}]};c.ruleState={version:1,used:{},pools:{},active:{},targets:{},portent:[]};return c;}
const choice=(source='guerreiro:superiority',face=6)=>({source,face,melee:true,reaction:true,noOtherManeuver:true});
const packet=():DamagePacket=>({source:'weapon',parts:[{type:'slashing',amount:20}],parry:choice()});
test('Aparar exige conhecimento vigente; não herda manobra de subclasse removida ou aquisição futura',()=>{
  const c=make();assert.equal(knowsParry(c,E),true);c.classes[0].level=2;assert.equal(knowsParry(c,E),false);
  c.classes[0].level=5;c.classes[0].subclassId='campeao';assert.equal(knowsParry(c,E),false);c.classes[0].subclassId='mestreBatalha';
  c.rules.history[0].level=7;assert.equal(knowsParry(c,E),false);assert.throws(()=>previewParry(c,choice(),E));
});
test('Adepto Marcial pode fornecer Aparar e d6 sem Mestre de Batalha; superioridade aprimorada usa nível próprio',()=>{
  const c=make();c.classes[0].subclassId='campeao';c.rules.history.push({classId:'guerreiro',level:4,answers:{feat:'Adepto Marcial',featManeuvers:['Aparar','Inspirar']}});
  assert.equal(parryOptions(c,E).length,1);assert.equal(previewParry(c,choice('feat:superiority'),E).source.die,6);
  c.classes[0].subclassId='mestreBatalha';c.classes[0].level=9;c.classes.push({classId:'ladino',level:9});assert.equal(parryOptions(c,E)[1].die,6);
  c.classes[0].level=10;assert.deepEqual(parryOptions(c,E).map(s=>s.die),[10,10]);c.classes[0].level=18;assert.deepEqual(parryOptions(c,E).map(s=>s.die),[12,12]);
});
test('redução usa somente face + DES, com mínimo zero; não usa FOR, proficiência ou modo do dado',()=>{
  const c=make();assert.equal(previewParry(c,choice(),E).reduction,8);c.abilities.dex.score=8;assert.equal(previewParry(c,choice(),E).reduction,5);
  c.abilities.dex.score=1;const p=packet();p.parry!.face=1;assert.equal(previewTypedDamage(c,p,E).parry!.reduction,0);applyTypedDamage(c,p,E);assert.equal(c.hpCurrent,80);assert.equal(c.ruleState.used['guerreiro:superiority'],1);
  c.abilities.dex.score=undefined;assert.throws(()=>previewParry(c,choice(),E),/Destreza/);
});
test('exige ataque corpo a corpo declarado e reação, mas não exige visão; incapacidade e forma não recebem estatísticas humanas',()=>{
  const c=make();for(const key of ['melee','reaction','noOtherManeuver'])assert.throws(()=>previewParry(c,{...choice(),[key]:false},E),/Confirme/);
  c.ruleState.conditions={cego:true};assert.equal(previewParry(c,choice(),E).reduction,8);
  for(const id of ['incapacitado','inconsciente','paralisado','atordoado']){c.ruleState.conditions={[id]:true};assert.throws(()=>previewParry(c,choice(),E));}
  c.ruleState.conditions={};c.ruleState.active['druida:wildShape']=true;assert.throws(()=>previewParry(c,choice(),E),/Forma Selvagem/);
});
test('melee de magia também serve; efeito por resistência, dano fora de ataque e duas reações não se combinam',()=>{
  const c=make();for(const source of ['weapon','magicWeapon','spellAttack','attack','magicAttack']){const p=packet();p.source=source as DamagePacket['source'];assert.equal(previewTypedDamage(c,p,E).received,12);}
  for(const source of ['spell','other','magic']){const p=packet();p.source=source as DamagePacket['source'];assert.throws(()=>previewTypedDamage(c,p,E),/ataque corpo a corpo/);}
  const p=packet();c.classes.push({classId:'ladino',level:5});p.uncannyDodge=true;assert.throws(()=>applyTypedDamage(c,p,E),/não combine/);assert.equal(c.ruleState.used['guerreiro:superiority'],undefined);
});
test('um orçamento de redução por ataque misto, antes de resistência/vulnerabilidade, alocado pela ordem das linhas',()=>{
  const c=make(),p=packet();p.parts=[{type:'slashing',amount:10},{type:'fire',amount:10,defense:'resistance'}];
  const before=JSON.stringify(c),first=previewTypedDamage(c,p,E);assert.equal(first.received,7);assert.deepEqual(first.parts.map(x=>x.parryReduction),[8,0]);assert.equal(JSON.stringify(c),before);
  p.parts.reverse();assert.equal(previewTypedDamage(c,p,E).received,11);p.parts[0].vulnerable=true;assert.equal(previewTypedDamage(c,p,E).received,12);
  applyTypedDamage(c,p,E);assert.equal(c.ruleState.used['guerreiro:superiority'],1);
});
test('proteção absorve primeiro, imunidade não consome a redução; dano já zerado não paga Aparar',()=>{
  const c=make();c.classes.push({classId:'mago',level:2,subclassId:'abjuracao'});c.ruleState.pools['mago:ward']=5;
  const p=packet();p.parts[0].amount=15;assert.equal(previewTypedDamage(c,p,E).received,2);
  p.parts[0].amount=4;const before=JSON.stringify(c);assert.throws(()=>applyTypedDamage(c,p,E),/já é zero/);assert.equal(JSON.stringify(c),before);
  c.ruleState.pools['mago:ward']=0;p.parts=[{type:'fire',amount:10,defense:'immunity'},{type:'slashing',amount:10}];const result=previewTypedDamage(c,p,E);assert.equal(result.received,2);assert.deepEqual(result.parts.map(x=>x.parryReduction),[0,8]);
});
test('ordem entre Maestria de Armadura e Aparar é explícita; dois orçamentos não se multiplicam por tipo',()=>{
  const c=make(),p=packet();c.armorEquipped='Cota de malha';c.rules.history.push({classId:'guerreiro',level:4,answers:{feat:'Maestria em Armadura Pesada'}});
  p.parts=[{type:'slashing',amount:5,defense:'resistance'},{type:'fire',amount:10}];assert.equal(previewTypedDamage(c,p,E).received,4);
  p.parryOrder='parryFirst';const result=previewTypedDamage(c,p,E);assert.equal(result.received,7);assert.match(typedDamageSummary(result),/Aparar antes da armadura/);
  p.parryOrder='errada' as any;assert.throws(()=>applyTypedDamage(c,p,E),/ordem/);
});
test('faces, origem, registros ilegíveis, máximos e saldo são validados antes de alterar PV/proteção/usos',()=>{
  for(const face of [0,9,-1,1.5,NaN]){const c=make(),p=packet();p.parry!.face=face;const before=structuredClone(c);assert.throws(()=>applyTypedDamage(c,p,E),/face/);assert.deepEqual(c,before);}
  for(const value of [null,'0',-1,0.5,NaN,8]){const c=make();c.ruleState.used['guerreiro:superiority']=value;const before=structuredClone(c);assert.throws(()=>applyTypedDamage(c,packet(),E));assert.deepEqual(c,before);}
  const c=make();c.rules.resourceMaxOverrides={'guerreiro:superiority':1};applyTypedDamage(c,packet(),E);const before=JSON.stringify(c);assert.throws(()=>applyTypedDamage(c,packet(),E),/esgotada/);assert.equal(JSON.stringify(c),before);
  for(const value of [[],7,'ilegível']){const c=make();c.ruleState.used=value;const before=structuredClone(c);assert.throws(()=>applyTypedDamage(c,packet(),E),/ilegível/);assert.deepEqual(c,before);}
});
test('erro em outro tipo ou escolha de sobrevivência não cobra dado nem reduz proteção antes da validação completa',()=>{
  for(const kind of ['part','duplicate','survival']){
    const c=make(),p=packet();c.classes.push({classId:'mago',level:2,subclassId:'abjuracao'});c.ruleState.pools['mago:ward']=5;
    if(kind==='part')p.parts.push({type:'fire',amount:-1});if(kind==='duplicate')p.parts.push({type:'slashing',amount:1});const before=JSON.stringify(c);
    assert.throws(()=>applyTypedDamage(c,p,E,kind==='survival'?{kind:'endurance'}:undefined));assert.equal(JSON.stringify(c),before);
  }
});
test('crítico não dobra redução ou custo; temporários e concentração usam um único dano final',()=>{
  const c=make(),p=packet();c.hpTemp=1;startConcentration(c,{name:'Efeito sintético'});p.critical=true;p.parts=[{type:'slashing',amount:10},{type:'fire',amount:10}];
  const result=applyTypedDamage(c,p,E);assert.equal(result.received,12);assert.equal(c.hpCurrent,89);assert.equal(c.hpTemp,0);assert.equal(c.ruleState.used['guerreiro:superiority'],1);assert.equal(concentration(c)!.checks.length,1);assert.equal(concentration(c)!.checks[0].damage,12);
});
test('mesmas reservas de classe/talento e descansos, sem RNG no motor ou alteração de armas/escolhas',()=>{
  const c=make();c.rules.history.push({classId:'guerreiro',level:4,answers:{feat:'Adepto Marcial',featManeuvers:['Aparar','Inspirar']}});const stable=JSON.stringify([c.weapons,c.rules.history,c.classes]),random=Math.random;Math.random=()=>{throw Error('Sem RNG');};
  try{applyTypedDamage(c,packet(),E);const p=packet();p.parry!.source='feat:superiority';applyTypedDamage(c,p,E);assert.equal(c.ruleState.used['guerreiro:superiority'],1);assert.equal(c.ruleState.used['feat:superiority'],1);resetResources(c,'short',E);assert.equal(c.ruleState.used['feat:superiority'],0);assert.equal(c.ruleState.used['guerreiro:superiority'],0);assert.equal(JSON.stringify([c.weapons,c.rules.history,c.classes]),stable);}finally{Math.random=random;}
});
