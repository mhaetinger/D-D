import {test} from 'node:test';
import assert from 'node:assert/strict';
import {editSheetField} from '../src/sheet-edit/model';
import {changePermanentAbility,initiativeBonus,savingThrow,weaponStats} from '../src/rules/combat';
import {skillBonus} from '../src/rules/passives';
import {resolveSpellEffect,twinEligible,spellDamageBreakdown} from '../src/rules/spell-effects';
import {evaluateDicePool} from '../src/rules/dice-roll';
import {resourcesFor,toggleResource,remaining} from '../src/rules/resources';
import {startConcentration,concentration,queueConcentrationDamage,resolveConcentration,endConcentration} from '../src/rules/concentration';
import {applyRolledResource,finishInterventionWeek,interventionWaiting} from '../src/rules/resource-effects';
import {takeRest} from '../src/rules/rest';
import {importSpellReference} from '../src/rules/spell-reference';
import type {Sheet} from '../src/rules/model';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');
const make=(id='guerreiro',n=5,sub='')=>{const c=warrior();c.classes=[{classId:id,level:n,subclassId:sub,subclass:'',hitDie:E.data.classes[id].die,hitDiceUsed:0}];c.rules={raceId:'humano',history:[]};c.abilities.con.score=14;c.abilities.dex.score=14;c.abilities.int.score=c.abilities.wis.score=c.abilities.cha.score=16;c.hpMax=44;c.hpCurrent=37;c.hpTemp=0;return c;};
const spell=(name:string,cls='mago',extra={})=>E.toSheetSpell(E.spell(name),cls,extra);
const resource=(c:Sheet,id:string)=>resourcesFor(c,E).find(r=>r.id===id)!;

test('A01: CON digitada e botões preservam dano, totais manuais, exaustão e zero PV',()=>{
  for(const exhaustion of [0,4])for(const current of [0,7,37]){
    const c=make();c.exhaustion=exhaustion;c.hpCurrent=Math.min(current,exhaustion?22:44);c.rules.fieldOverrides={hpMax:true};
    const before=structuredClone(c),buttons=structuredClone(c);changePermanentAbility(buttons,'con',2);
    const typed=editSheetField(c,'abilities.con.score',16,E);
    assert.deepEqual(typed.abilities,buttons.abilities);assert.equal(typed.hpMax,49);assert.equal(typed.hpCurrent,buttons.hpCurrent);assert.deepEqual(c,before);
  }
});
test('A02: druida reconhece armas do catálogo sem depender do texto e respeita ajuste explícito',()=>{
  const c=make('druida',1);c.proficiencies.weapons='';
  for(const name of ['Adaga','Azagaia','Bordão','Cimitarra','Porrete','Dardo','Funda','Foice Curta','Maça','Lança'])assert.equal(weaponStats(c,{name},E).proficient,true,name);
  assert.equal(weaponStats(c,{name:'Espada Longa'},E).proficient,false);
  assert.equal(weaponStats(c,{name:'Porrete',proficient:false},E).proficient,false);
  const mage=make('mago',1);mage.proficiencies.weapons='';assert.equal(weaponStats(mage,{name:'Maça'},E).proficient,false);
});
test('A03: dano simultâneo conserva tipos e escala apenas os componentes indicados',()=>{
  const c=make('mago',20,'abjuracao');
  for(const [name,circle,formula,types]of [['Chuva de Meteoros',9,'20d6+20d6',['fogo','concussao']],['Tempestade de Gelo',6,'4d8+4d6',['concussao','frio']],['Coluna de Chamas',5,'4d6+4d6',['fogo','radiante']]] as const){const r=resolveSpellEffect(c,spell(name),circle,E);assert.equal(r.formula,formula);assert.deepEqual(r.components?.map(p=>p.type),types);}
  const higher=resolveSpellEffect(c,spell('Coluna de Chamas'),7,E);assert.equal(higher.formula,'4d6+4d6+2d6');assert.equal(higher.components?.[2].type,'escolha');
  assert.equal(resolveSpellEffect(c,spell('Tempestade de Gelo','mago',{customRoll:'7d4+2'}),6,E).formula,'7d4+2');
});
test('A04: dano inicial de Raio de Bruxa e aumentos a cada dois círculos',()=>{
  const c=make('mago',20);
  for(let n=2;n<=9;n++){
    assert.equal(resolveSpellEffect(c,spell('Raio de Bruxa'),n,E).formula,`${n}d12`);
    assert.equal(resolveSpellEffect(c,spell('Lâmina Flamejante'),n,E).formula,`${3+Math.floor((n-2)/2)}d6`);
    assert.equal(resolveSpellEffect(c,spell('Arma Espiritual','clerigo'),n,E).formula,`${1+Math.floor((n-2)/2)}d8+3`);
  }
});
test('A03: subtotais por tipo consomem as mesmas faces do pool, sem nova rolagem nem duplicar bônus',()=>{
  const result=evaluateDicePool({6:8},3,'normal',{},()=>2),before=structuredClone(result);
  const detail=spellDamageBreakdown(result,[{formula:'4d6',type:'fogo',label:'Fogo'},{formula:'4d6',type:'radiante',label:'Radiante'}]);
  assert.equal(detail.total,19);assert.equal(detail.groups,result.groups);assert.deepEqual(result,before);
  assert.ok(detail.breakdown.includes('Fogo: 4d6 = 8'));assert.ok(detail.breakdown.includes('Radiante: 4d6 = 8'));
  assert.equal(spellDamageBreakdown(result,[{formula:'20d6',type:'fogo',label:'Fogo'}]),result);
});
test('A05: Evocação soma INT uma vez, na classe/escola e rolagem elegíveis; manual é soberano',()=>{
  const c=make('mago',10,'evocacao');
  assert.equal(resolveSpellEffect(c,spell('Bola de Fogo'),3,E).formula,'8d6+3');
  assert.equal(resolveSpellEffect(c,spell('Chuva de Meteoros'),9,E).formula,'20d6+20d6+3');
  assert.equal(resolveSpellEffect(c,spell('Raio Ardente'),2,E,{elementalAffinity:false}).formula,'2d6');
  assert.equal(resolveSpellEffect(c,spell('Bola de Fogo','feiticeiro'),3,E).formula,'8d6');
  assert.equal(resolveSpellEffect(c,spell('Bola de Fogo','mago',{customRoll:'3d4'}),3,E).formula,'3d4');
  c.abilities.int.score=8;assert.equal(resolveSpellEffect(c,spell('Bola de Fogo'),3,E).formula,'8d6-1');
  c.classes[0].subclassId='abjuracao';assert.equal(resolveSpellEffect(c,spell('Bola de Fogo'),3,E).formula,'8d6');
});
test('A06: Atletismo arredonda para cima sem somar a Versatilidade, treino, especialização ou total manual',()=>{
  const c=make('guerreiro',7,'campeao');c.skillsProf=[];
  assert.equal(initiativeBonus(c,E),4);assert.equal(skillBonus(c,{id:'acrobacia',ability:'dex'}),4);
  assert.equal(skillBonus(c,{id:'arcanismo',ability:'int'}),3);assert.equal(savingThrow(c,'dex',E),2);
  c.classes.push({classId:'bardo',level:2});assert.equal(initiativeBonus(c,E),4);
  c.classes[0].level=11;assert.equal(initiativeBonus(c,E),5);
  c.skillsProf=['acrobacia'];assert.equal(skillBonus(c,{id:'acrobacia',ability:'dex'}),7);
  c.expertise=['acrobacia'];assert.equal(skillBonus(c,{id:'acrobacia',ability:'dex'}),12);
  c.customSkillBonuses={acrobacia:0};assert.equal(skillBonus(c,{id:'acrobacia',ability:'dex'}),0);
  const legacy=make('guerreiro',7);legacy.skillsProf=[];legacy.classes[0].subclass='Campeão (livro de 2014)';assert.equal(initiativeBonus(legacy,E),4);assert.equal(skillBonus(legacy,{id:'acrobacia',ability:'dex'}),4);
  legacy.classes[0].subclassId='mestreBatalha';assert.equal(initiativeBonus(legacy,E),2);
});
test('A07: concentração de característica participa da troca, dos testes e encerramento; bloqueio não gasta',()=>{
  for(const [cls,n,sub,id]of [['clerigo',3,'enganacao','clerigo:duplicate'],['feiticeiro',18,'draconica','feiticeiro:presence']] as const){
    const c=make(cls,n,sub);c.sorceryPoints={current:18,max:18};startConcentration(c,{name:'Bênção'});
    toggleResource(c,resource(c,id),E);assert.equal(concentration(c)?.resourceId,id);assert.equal(c.ruleState.active[id],true);
    queueConcentrationDamage(c,1);const held=concentration(c)!;resolveConcentration(c,held.id,held.checks[0].id,1,0);assert.equal(concentration(c),null);assert.equal(c.ruleState.active[id],false);
    takeRest(c,'long',E);toggleResource(c,resource(c,id),E);startConcentration(c,{name:'Voo'});assert.equal(c.ruleState.active[id],false);
    const beforeBad=structuredClone(c);assert.throws(()=>startConcentration(c,{name:'Inválido',resourceId:'mago:stone'}),/Recurso/);assert.deepEqual(c,beforeBad);
    c.ruleState.active['barbaro:rage']=true;const before=structuredClone(c);assert.throws(()=>toggleResource(c,resource(c,id),E),/Fúria/);assert.deepEqual(c,before);
  }
});
test('A08/A11: criar imagem/mão não é alvo para Gêmea; geometria explícita vence a iluminação',()=>{
  const c=make('feiticeiro',5);
  for(const name of ['Ilusão Menor','Imagem Silenciosa','Mãos Mágicas'])assert.equal(twinEligible(c,spell(name,'feiticeiro'),E.spell(name).level,E),false);
  assert.equal(twinEligible(c,spell('Curar Ferimentos','feiticeiro'),1,E),true);
  assert.equal(twinEligible(c,spell('Mísseis Mágicos','feiticeiro'),1,E),true);
  assert.equal(E.spellMeta(E.spell('Raio Solar')).targetType,'linha');
});
test('A10: última descrição não inclui apêndice e demais metadados permanecem completos',()=>{
  const zone=E.spell('Zona da Verdade');assert.ok(zone.text.includes('mentira'));assert.doesNotMatch(zone.text,/APÊNDICE|ATORDOADO|CEGO/);
  const spells=require('../public/rules/phb2014-spells');assert.equal(spells.length,361);assert.ok(spells.every((s:Sheet)=>s.time&&s.range&&s.components&&s.duration&&s.text));
});
test('A09: correção editorial identificada mantém os dois danos e permite a rolagem',()=>{
  const s=E.spell('Onda Destrutiva');assert.match(s.sourceNote,/5d5/);assert.match(s.sourceNote,/5d6/);assert.doesNotMatch(s.text,/5d5/);
  assert.match(importSpellReference(spell(s.name,'paladino'),E)!.text,/Correção editorial do CritCall/);
  const result=resolveSpellEffect(make('paladino',17),spell(s.name,'paladino'),5,E);assert.equal(result.formula,'5d6+5d6');assert.deepEqual(result.components?.map(p=>p.type),['trovejante','escolha']);
});
test('auditoria repetível do livro não conserva divergências A01–A12 conhecidas',()=>{
  const report=require('../scripts/audit-book-consistency.cjs').auditBookConsistency();assert.equal(report.summary.divergences,0,JSON.stringify(report.divergences));
});
test('A12: asas sobrevivem a descansos; recurso de concentração termina no descanso e no botão',()=>{
  const c=make('feiticeiro',18,'draconica');c.sorceryPoints={current:18,max:18};toggleResource(c,resource(c,'feiticeiro:wings'),E);
  toggleResource(c,resource(c,'feiticeiro:presence'),E);takeRest(c,'short',E);assert.equal(c.ruleState.active['feiticeiro:wings'],true);assert.equal(concentration(c),null);
  takeRest(c,'long',E);assert.equal(c.ruleState.active['feiticeiro:wings'],true);toggleResource(c,resource(c,'feiticeiro:wings'),E);assert.equal(c.ruleState.active['feiticeiro:wings'],false);
});
test('A13: face inválida não gasta nem cura; Retomar aplica a face informada e Presságio não sorteia quando informado',()=>{
  const c=make();c.hpCurrent=10;const r=resource(c,'guerreiro:secondWind'),before=structuredClone(c);
  for(const face of [0,11,1.5,NaN]){assert.throws(()=>applyRolledResource(c,r,E,face));assert.deepEqual(c,before);}
  applyRolledResource(c,r,E,4);assert.equal(c.hpCurrent,19);assert.equal(remaining(c,r),0);assert.throws(()=>applyRolledResource(c,r,E,4));assert.equal(c.hpCurrent,19);
  const mage=make('mago',14,'adivinhacao');takeRest(mage,'long',E,{foodAndWater:true,tableHitDice:false,portent:[2,13,20]},()=>{throw new Error('Não sortear');});assert.deepEqual(mage.ruleState.portent.map((p:Sheet)=>p.value),[2,13,20]);
});
test('A14: sucesso espera semana ficcional após descansos; legado permanece até confirmação explícita',()=>{
  const c=make('clerigo',20,'vida'),r=resource(c,'clerigo:intervention');applyRolledResource(c,r,E);assert.equal(interventionWaiting(c),true);assert.equal(c.ruleState.blockedUntil,undefined);
  takeRest(c,'long',E);assert.equal(remaining(c,r),0);finishInterventionWeek(c);assert.equal(remaining(c,r),1);assert.throws(()=>finishInterventionWeek(c));
  c.ruleState.blockedUntil={'clerigo:intervention':Date.now()+100000};assert.equal(interventionWaiting(c),true);const before=JSON.stringify(c);assert.equal(remaining(c,r),0);assert.equal(JSON.stringify(c),before);finishInterventionWeek(c);assert.equal(remaining(c,r),1);
});
