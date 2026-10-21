import {test} from 'node:test';
import assert from 'node:assert/strict';
import {armorClass,weaponStats} from '../src/rules/combat';
import {previewWeaponDamage} from '../src/rules/weapon-damage';
import {passiveSkill,skillBonus} from '../src/rules/passives';
import {resolveSpellEffect} from '../src/rules/spell-effects';
import {parseDiceFormula} from '../src/rules/dice-formula';
import {applyDamage} from '../src/rules/combat';
import {healHitPoints} from '../src/rules/health';
import {takeRest} from '../src/rules/rest';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');
const make=(id='guerreiro',n=12,sub='')=>{
  const c=warrior();c.classes=[{classId:id,level:n,subclassId:sub,subclass:'',hitDie:E.data.classes[id].die,hitDiceUsed:0}];
  c.rules={raceId:'humano',history:[]};c.armorEquipped=null;c.shieldEquipped=false;c.abilities.str.score=18;c.abilities.dex.score=14;c.abilities.cha.score=16;
  return c;
};
const feat=(c:any,name:string,key='feat')=>c.rules.history.push({classId:c.classes[0].classId,level:4,answers:{[key]:name}});
const inv=(c:any)=>c.rules.history.push({classId:'bruxo',level:12,answers:{pact:'lamina',invocations:['Sorvedor de Vida']}});
const dragon=(c:any,name='Vermelho — fogo')=>c.rules.history.push({classId:'feiticeiro',level:1,answers:{dragon:name}});
const spell=(name:string,cls='feiticeiro',extra={})=>E.toSheetSpell(E.spell(name),cls,{prepared:true,...extra});
const per={id:'percepcao',ability:'wis'},invest={id:'investigacao',ability:'int'};

test('Ambidestro exige escolha e duas armas confirmadas; escudo, inconsciência e forma removem o bônus',()=>{
  const c=make();c.ruleState={active:{'feat:dualWielder':true}};
  assert.equal(armorClass(c,E).total,12);feat(c,'Ambidestro','racialFeat');
  assert.equal(armorClass(c,E).total,13);assert.match(armorClass(c,E).explanation,/Ambidestro 1/);
  c.ruleState.active['feat:dualWielder']=false;assert.equal(armorClass(c,E).total,12);
  c.ruleState.active['feat:dualWielder']=true;c.shieldEquipped=true;assert.equal(armorClass(c,E).total,14);
  c.shieldEquipped=false;c.ruleState.active['druida:wildShape']=true;assert.equal(armorClass(c,E).total,12);
  c.ruleState.active['druida:wildShape']=false;c.hpCurrent=0;assert.equal(armorClass(c,E).total,12);
});
test('Ambidestro soma uma vez à fórmula calculada e preserva CA manual/escrita com outros ajustes',()=>{
  const c=make();feat(c,'Ambidestro');c.ruleState={active:{'feat:dualWielder':true,'spell:shieldOfFaith':true}};c.armorEquipped='Peitoral';c.acAdjustment=2;
  assert.equal(armorClass(c,E).total,21);
  c.baseAcArmor=23;c.rules.fieldOverrides={armor:true};c.acFormula='written';assert.equal(armorClass(c,E).total,27);
  c.rules.manualMode=true;c.acFormula='legacy';assert.equal(armorClass(c,E).total,27);
});
test('descanso curto preserva armas confirmadas; cair inconsciente exige empunhá-las novamente após cura',()=>{
  const c=make();feat(c,'Ambidestro');c.ruleState={active:{'feat:dualWielder':true}};
  takeRest(c,'short',E);assert.equal(armorClass(c,E).total,13);
  applyDamage(c,c.hpCurrent);assert.equal(c.ruleState.active['feat:dualWielder'],false);
  healHitPoints(c,1);assert.equal(armorClass(c,E).total,12);
});
test('Observador aplica +5 só aos dois passivos, com proficiência/especialização e contexto próprio',()=>{
  const c=make();feat(c,'Observador');c.abilities.wis.score=16;c.skillsProf=['percepcao'];c.expertise=['percepcao'];
  assert.equal(skillBonus(c,per),11);assert.equal(passiveSkill(c,per,E).total,26);
  assert.equal(passiveSkill(c,invest,E).total,16);assert.equal(passiveSkill(c,{id:'natureza',ability:'int'},E).observer,0);
  assert.equal(passiveSkill(c,per,E,'adv').total,31);assert.equal(passiveSkill(c,per,E,'dis').total,21);
  assert.equal(skillBonus(c,per),11);
});
test('passivos conservam ajuste ativo zero, valores negativos, meia proficiência e origem racial do talento',()=>{
  const c=make('bardo',2);feat(c,'Observador','racialFeat');c.customSkillBonuses={percepcao:0,investigacao:-2};
  assert.equal(passiveSkill(c,per,E).total,15);assert.equal(passiveSkill(c,invest,E).total,13);
  delete c.customSkillBonuses;assert.equal(skillBonus(c,per),1);
  c.classes=[{classId:'guerreiro',level:2}];assert.equal(passiveSkill(c,per,E).observer,5); // escolha racial independe da classe original
  c.rules.history=[];assert.equal(passiveSkill(c,per,E).total,10);
});
test('Sorvedor afeta somente a arma do pacto automática e mantém seu dano necrótico separado no crítico',()=>{
  const c=make('bruxo');inv(c);const w={name:'Espada longa',ruleWeapon:'Espada longa',pactWeapon:true};c.weapons=[w];
  assert.equal(weaponStats(c,w,E).damage,'1d8+7');assert.equal(weaponStats(c,{...w,pactWeapon:false},E).damage,'1d8+4');
  const plan=previewWeaponDamage(c,w,{critical:true},E);assert.equal(parseDiceFormula(plan.formula)?.modifier,7);assert.equal(parseDiceFormula(plan.formula)?.counts[8],2);
  assert.deepEqual(plan.parts.find(p=>p.name==='Sorvedor de Vida'),{name:'Sorvedor de Vida',formula:'3',type:'necrótico'});
  assert.equal(plan.parts[0].formula,'2d8+4');assert.match(weaponStats(c,w,E).explanation,/Sorvedor de Vida 3 necrótico/);
});
test('Sorvedor exige nível de bruxo, pacto e invocação; CAR tem mínimo 1, sem alterar fórmulas manuais',()=>{
  const c=make('bruxo');inv(c);const w={name:'Espada longa',pactWeapon:true};c.abilities.cha.score=8;
  assert.equal(weaponStats(c,w,E).damage,'1d8+5');
  const manual={...w,calculationMode:'manual',damage:'3d6+9',bonus:'+2'};assert.equal(weaponStats(c,manual,E).damage,'3d6+9');
  c.classes[0].level=11;c.classes.push({classId:'guerreiro',level:1});assert.equal(weaponStats(c,w,E).lifedrinker,0);
  c.classes[0].level=12;c.rules.history[0].answers.pact='tomo';assert.equal(weaponStats(c,w,E).lifedrinker,0);
  c.rules.history[0].answers.pact='lamina';c.rules.history[0].answers.invocationsReplace=['Sorvedor de Vida'];c.rules.history.push({classId:'bruxo',level:13,answers:{invocationsReplace:['Sorvedor de Vida']}});assert.equal(weaponStats(c,w,E).lifedrinker,0);
});
test('Afinidade usa origem/nível próprios, elemento estruturado e não depende da resistência paga',()=>{
  const c=make('feiticeiro',6,'draconica');dragon(c);
  assert.equal(resolveSpellEffect(c,spell('Bola de Fogo'),3,E).formula,'8d6+3');
  c.ruleState={active:{'feiticeiro:elementalAffinity':true}};assert.equal(resolveSpellEffect(c,spell('Bola de Fogo'),4,E).formula,'9d6+3');
  assert.equal(resolveSpellEffect(c,spell('Raio de Gelo'),0,E).formula,'2d8');
  c.classes[0].level=5;c.classes.push({classId:'guerreiro',level:1});assert.equal(resolveSpellEffect(c,spell('Raio de Fogo'),0,E).formula,'2d10');
  c.classes[0].level=6;c.classes[0].subclassId='selvagem';assert.equal(resolveSpellEffect(c,spell('Bola de Fogo'),3,E).formula,'8d6');
});
test('Afinidade não multiplica CAR em Gêmea/raios e ignora customização/cura; CAR negativo não tem mínimo',()=>{
  const c=make('feiticeiro',6,'draconica');dragon(c);
  const twin=resolveSpellEffect(c,spell('Raio de Fogo'),0,E,{twinned:true});assert.equal(twin.formula,'4d10+3');
  const ray=resolveSpellEffect(c,spell('Raio Ardente'),3,E);assert.equal(ray.formula,'2d6+3');assert.match(ray.summary,/4 raio/);
  assert.equal(resolveSpellEffect(c,spell('Raio Ardente'),3,E,{elementalAffinity:false}).formula,'2d6');
  assert.equal(resolveSpellEffect(c,spell('Raio de Fogo','feiticeiro',{customRoll:'7d4+8'}),0,E).formula,'7d4+8');
  assert.equal(resolveSpellEffect(c,spell('Curar Ferimentos','clerigo'),1,E).formula,'1d8');
  c.abilities.cha.score=8;assert.equal(resolveSpellEffect(c,spell('Bola de Fogo'),3,E).formula,'8d6-1');
  assert.equal(parseDiceFormula(twin.formula)?.modifier,3);
});
test('ancestral racial, tipo variável e valores não canônicos não inventam Afinidade',()=>{
  const c=make('feiticeiro',6,'draconica');c.rules.raceId='draconato';c.rules.history=[{classId:'feiticeiro',level:1,answers:{raceDragon:'Vermelho — fogo'}}];
  assert.equal(resolveSpellEffect(c,spell('Bola de Fogo'),3,E).formula,'8d6');
  dragon(c,'Vermelho de casa');assert.equal(resolveSpellEffect(c,spell('Bola de Fogo'),3,E).formula,'8d6');
  dragon(c);assert.equal(resolveSpellEffect(c,spell('Orbe Cromática'),1,E).formula,'3d8');
  c.classes.push({classId:'mago',level:1});assert.equal(resolveSpellEffect(c,spell('Bola de Fogo','mago'),3,E).formula,'8d6+3');
});
