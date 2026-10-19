import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveSpellEffect,innateCastLevel,twinEligible} from '../src/rules/spell-effects';
import {wizardPrivilege,preparation,canCastNormally,canRitual,castingRestriction} from '../src/rules/spellcasting';
import {applyDamage,changePermanentAbility,initiativeBonus} from '../src/rules/combat';
import {onSpellCast} from '../src/rules/resources';
import {takeRest} from '../src/rules/rest';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');
const make=(id:string,n:number,sub='')=>{
  const c=warrior();c.classes=[{classId:id,level:n,subclassId:sub,subclass:'',hitDie:E.data.classes[id].die,hitDiceUsed:0}];
  c.armorEquipped=null;c.shieldEquipped=false;c.rules={raceId:'humano',history:[],legacy:false};
  c.abilities.wis.score=16;c.abilities.cha.score=16;c.abilities.int.score=16;c.hpMax=40;c.hpCurrent=30;c.hpTemp=0;
  return c;
};
const spell=(name:string,cls='clerigo',extra={})=>E.toSheetSpell(E.spell(name),cls,{prepared:true,...extra});
test('todos os truques de dano escalam pelo nível total no resolvedor, inclusive multiclasse',()=>{
  const c=make('clerigo',3);c.classes.push({classId:'guerreiro',level:2,subclass:'',subclassId:''});
  for(const [name,formula] of [['Chama Sagrada','2d8'],['Chicote de Espinhos','2d6'],['Zombaria Viciosa','2d4'],['Raio de Fogo','2d10']]) assert.equal(resolveSpellEffect(c,spell(name),0,E).formula,formula);
  c.classes[1].level=8;assert.equal(resolveSpellEffect(c,spell('Chama Sagrada'),0,E).formula,'3d8');
  c.classes[1].level=14;assert.equal(resolveSpellEffect(c,spell('Chama Sagrada'),0,E).formula,'4d8');
});
test('cura inclui modificador, círculo e Discípulo da Vida, sem mudar fórmulas personalizadas',()=>{
  const c=make('clerigo',5);
  assert.equal(resolveSpellEffect(c,spell('Curar Ferimentos'),1,E).formula,'1d8+3');
  assert.equal(resolveSpellEffect(c,spell('Curar Ferimentos'),3,E).formula,'3d8+3');
  assert.equal(resolveSpellEffect(c,spell('Palavra Curativa'),2,E).formula,'2d4+3');
  c.classes[0].subclassId='vida';assert.equal(resolveSpellEffect(c,spell('Curar Ferimentos'),3,E).formula,'3d8+8');
  c.abilities.wis.score=8;c.classes[0].subclassId='conhecimento';assert.equal(resolveSpellEffect(c,spell('Curar Ferimentos'),1,E).formula,'1d8-1');
  assert.equal(resolveSpellEffect(c,spell('Curar Ferimentos','clerigo',{customRoll:'7d4+2'}),3,E).formula,'7d4+2');
});
test('dano genérico aumenta com espaço e não reaplica aumento já resolvido pelo legado',()=>{
  const c=make('feiticeiro',5);
  assert.equal(resolveSpellEffect(c,spell('Repreensão Infernal','feiticeiro'),2,E).formula,'3d10');
  assert.equal(resolveSpellEffect(c,spell('Bola de Fogo','feiticeiro'),4,E,{legacyFormula:'9d6'}).formula,'9d6');
  assert.equal(resolveSpellEffect(c,spell('Raio de Gelo','feiticeiro'),0,E,{legacyFormula:'2d8',legacySummary:'2d8 Frio (-3m)'}).summary,'2d8 Frio (-3m)');
});
test('feixes usam dano por acerto e Explosão Agonizante soma CAR por feixe',()=>{
  const c=make('bruxo',5);c.rules.history=[{classId:'bruxo',level:2,answers:{invocations:['Explosão Agonizante']}}];
  const r=resolveSpellEffect(c,spell('Rajada Mística','bruxo'),0,E,{legacyFormula:'2d10'});
  assert.equal(r.formula,'1d10+3');assert.equal(r.summary,'2 feixe(s) × 1d10+3 Energia');assert.equal(r.perRay,true);
  const rays=resolveSpellEffect(c,spell('Raio Ardente','bruxo'),3,E);assert.equal(rays.formula,'2d6');assert.ok(rays.summary.startsWith('4 raio(s)'));
});
test('Gêmea respeita múltiplos alvos/círculo e mantém a adaptação de Mísseis',()=>{
  const c=make('feiticeiro',5);
  assert.equal(twinEligible(c,spell('Raio Ardente'),2,E),false);
  assert.equal(twinEligible(c,spell('Invisibilidade'),3,E),false);
  assert.equal(resolveSpellEffect(c,spell('Mísseis Mágicos'),2,E,{twinned:true}).formula,'8d4+8');
  assert.equal(resolveSpellEffect(c,spell('Curar Ferimentos'),1,E,{twinned:true}).formula,'2d8+6');
  assert.equal(E.spellMeta(E.spell('Chicote de Espinhos')).defType,'atq_magico');
  assert.equal(E.spellMeta(E.spell('Raio Ardente')).canTwin,false);
  assert.equal(resolveSpellEffect(c,spell('Raio Ardente','feiticeiro',{customRoll:'4d6'}),2,E,{canTwin:false,twinned:true}).canTwin,false);
});
test('nível racial fixo também corrige a leitura de fichas anteriores sem alterar a magia de classe',()=>{
  const c=make('guerreiro',3);c.rules.raceId='tiefling';
  assert.equal(innateCastLevel(c,spell('Repreensão Infernal','guerreiro',{extraSource:'Tiefling',limitedUse:1,castingAbility:'cha'}),E),2);
  assert.equal(innateCastLevel(c,spell('Repreensão Infernal','bruxo'),E),1);
});
test('privilégios do mago usam a seleção e reservas independentes sem converter a magia em ilimitada',()=>{
  const c=make('mago',20);c.rules.history=[{classId:'mago',level:18,answers:{mastery1:'escudo-arcano'}},{classId:'mago',level:20,answers:{signature:['bola-de-fogo','relampago']}}];
  const s=spell('Bola de Fogo','mago',{prepared:false});c.spells=[s];
  assert.equal(wizardPrivilege(c,spell('Escudo Arcano','mago'),E)?.value,'mastery');
  assert.equal(wizardPrivilege(c,s,E)?.remaining,1);assert.equal(preparation(c,'mago',E).used,0);assert.equal(canCastNormally(c,s,E),true);
  c.ruleState={used:{'mago:signature:bola-de-fogo':1}};assert.equal(wizardPrivilege(c,s,E)?.remaining,0);
  takeRest(c,'short',E);assert.equal(wizardPrivilege(c,s,E)?.remaining,1);
  assert.equal(wizardPrivilege(c,{...s,classId:'bruxo'},E),null);
  c.rules.history[0].answers.mastery1='desejo';assert.equal(wizardPrivilege(c,spell('Desejo','mago'),E),null);
});
test('armadura vestida sem proficiência bloqueia lançamento e ritual, mas mochila não bloqueia',()=>{
  const c=make('mago',5);c.armorProficiencies=[];const s=spell('Detectar Magia','mago');
  assert.equal(canCastNormally(c,s,E),true);assert.equal(canRitual(c,s,E),true);
  c.armorEquipped='Placas';assert.equal(canCastNormally(c,s,E),false);assert.equal(canRitual(c,s,E),false);assert.ok(castingRestriction(c,E)?.includes('proficiência'));
  c.armorProficiencies=['pesada'];assert.equal(canCastNormally(c,s,E),true);
  c.shieldEquipped=true;assert.equal(canCastNormally(c,s,E),false);c.armorProficiencies.push('escudo');assert.equal(canCastNormally(c,s,E),true);
  delete c.armorProficiencies;c.shieldEquipped=false;c.armorEquipped='Peitoral';c.rules.raceId='anaoMontanha';assert.equal(canCastNormally(c,s,E),true);
  c.rules.raceId='humano';assert.equal(canCastNormally(c,s,E),false);
});
test('proteção externa, temporários, besta e dano excedente retornam absorção real',()=>{
  const c=make('druida',8,'lua');c.hpTemp=5;c.ruleState={active:{'druida:wildShape':true},pools:{'druida:wildShape':10}};
  assert.deepEqual(applyDamage(c,4),{ward:0,temp:4,beast:0,hp:0,excess:0});assert.equal(c.ruleState.pools['druida:wildShape'],10);
  c.classes.push({classId:'mago',level:2,subclassId:'abjuracao',subclass:''});c.ruleState.pools['mago:ward']=3;
  assert.deepEqual(applyDamage(c,20),{ward:3,temp:1,beast:10,hp:6,excess:0});assert.equal(c.hpCurrent,24);assert.equal(c.ruleState.active['druida:wildShape'],false);
});
test('Constituição permanente preserva déficit, PV manuais e personagem a 0 PV',()=>{
  const c=make('guerreiro',5);c.abilities.con.score=14;c.hpMax=44;c.hpCurrent=37;
  changePermanentAbility(c,'con',2);assert.equal(c.hpMax,49);assert.equal(c.hpCurrent,42);
  c.hpCurrent=0;changePermanentAbility(c,'con',2);assert.equal(c.hpMax,54);assert.equal(c.hpCurrent,0);
  c.rules.abilityMethod='adapted';c.abilities.str.score=30;changePermanentAbility(c,'str',-1);assert.equal(c.abilities.str.score,29);changePermanentAbility(c,'str',1);assert.equal(c.abilities.str.score,30);
});
test('descanso longo não beneficia 0 PV; curto preserva forma e proteção aceita outra classe',()=>{
  const c=make('druida',8,'lua');c.ruleState={active:{'druida:wildShape':true},pools:{'druida:wildShape':10}};
  takeRest(c,'short',E);assert.equal(c.ruleState.active['druida:wildShape'],true);
  c.hpCurrent=0;const before=JSON.stringify(c);assert.equal(takeRest(c,'long',E),false);assert.equal(JSON.stringify(c),before);
  const mage=make('mago',2,'abjuracao');mage.classes.push({classId:'clerigo',level:1,subclassId:'vida',subclass:''});
  onSpellCast(mage,spell('Escudo da Fé'),1,E);assert.equal(mage.ruleState.pools['mago:ward'],7);
});
test('iniciativa soma Alerta e no máximo uma meia proficiência',()=>{
  const c=make('bardo',2);c.abilities.dex.score=14;assert.equal(initiativeBonus(c,E),3);
  c.classes.push({classId:'guerreiro',level:7,subclassId:'campeao'});c.rules.history=[{classId:'guerreiro',level:4,answers:{feat:'Alerta'}}];
  assert.equal(initiativeBonus(c,E),9);
});
test('componentes materiais multilinha preservam custo e não criam componentes V/S falsos',()=>{
  const orb=E.spell('Orbe Cromática'),friend=E.spell('Amizade'),light=E.spell('Luz');
  assert.ok(orb.components.includes('50 po'));assert.ok(friend.components.includes('maquiagem'));assert.ok(friend.components.endsWith(')'));
  const a=E.toSheetSpell(friend,'mago'),b=E.toSheetSpell(light,'mago');
  assert.deepEqual([a.v,a.s,a.m],[false,true,true]);assert.deepEqual([b.v,b.s,b.m],[true,false,true]);
});
