import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveSpellEffect,twinEligible} from '../src/rules/spell-effects';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');
const make=(id:string,n:number,sub='')=>{
  const c=warrior();c.classes=[{classId:id,level:n,subclassId:sub,subclass:'',hitDie:E.data.classes[id].die,hitDiceUsed:0}];
  c.rules={raceId:'humano',history:[],legacy:false};c.abilities.wis.score=16;return c;
};
const spell=(id:string,cls='clerigo',extra={})=>E.toSheetSpell(E.spell(id),cls,{prepared:true,...extra});
test('curas fixas: Cura Completa e Cura Completa em Massa classificadas como cura, com aumento e Discípulo da Vida',()=>{
  for(const id of ['cura-completa','cura-completa-em-massa'])assert.equal(E.spellMeta(E.spell(id)).dmgType,'cura');
  const cl=make('clerigo',17),life=make('clerigo',17,'vida');
  assert.match(resolveSpellEffect(cl,spell('cura-completa'),6,E).summary,/^70 PV ·/);
  assert.match(resolveSpellEffect(cl,spell('cura-completa'),8,E).summary,/^90 PV ·/);
  assert.match(resolveSpellEffect(life,spell('cura-completa'),6,E).summary,/^70 PV \+8 Discípulo da Vida/);
  assert.match(resolveSpellEffect(life,spell('cura-completa-em-massa'),9,E).summary,/\+11 por criatura curada/);
  assert.equal(resolveSpellEffect(life,spell('cura-completa'),6,E).formula,null);
  assert.equal(resolveSpellEffect(life,spell('cura-completa','clerigo',{customRoll:'80'}),6,E).formula,'80');
  assert.equal(E.spellMeta(E.spell('simulacro')).dmgType,'utilidade');
});
test('Bom Fruto não oferece Magia Duplicada; curas de um alvo continuam elegíveis',()=>{
  const c=make('feiticeiro',6);
  assert.equal(twinEligible(c,spell('bom-fruto','feiticeiro'),1,E),false);
  assert.equal(twinEligible(c,spell('curar-ferimentos','feiticeiro'),1,E),true);
  assert.equal(twinEligible(c,spell('cura-completa','feiticeiro'),6,E),true);
});


test('curas fixas: círculos válidos, Gêmea e multiclasse mantêm efeito por alvo sem dados',()=>{
 const c=make('clerigo',1,'vida');c.classes.push({classId:'feiticeiro',level:19});
 for(let circle=6;circle<=9;circle++){
  const s=spell('cura-completa','feiticeiro',{dmgType:'utilidade',effectSummary:'Instantânea'}),before=JSON.stringify(s);
  const effect=resolveSpellEffect(c,s,circle,E,{twinned:true});
  assert.equal(effect.formula,null);assert.ok(effect.summary.startsWith(`2 alvos × (${70+10*(circle-6)} PV +${circle+2} Discípulo da Vida`));
  assert.equal(JSON.stringify(s),before);
 }
 const mass=resolveSpellEffect(c,spell('cura-completa-em-massa'),9,E,{twinned:true});
 assert.equal(mass.canTwin,false);assert.equal(mass.formula,null);assert.match(mass.summary,/^Até 700 PV divididos/);assert.match(mass.summary,/11 por criatura/);
});

test('auditoria de cura preserva as cinco fórmulas anteriores e fórmulas próprias',()=>{
 const c=make('clerigo',20,'vida');
 for(const [id,circle,formula]of [['curar-ferimentos',3,'3d8+8'],['palavra-curativa',1,'1d4+6'],['oracao-curativa',4,'4d8+9'],['palavra-curativa-em-massa',5,'3d4+10'],['curar-ferimentos-em-massa',6,'4d8+11']] as const)assert.equal(resolveSpellEffect(c,spell(id),circle,E).formula,formula);
 for(const id of ['cura-completa','cura-completa-em-massa'])for(const formula of ['80','2d8+10'])assert.equal(resolveSpellEffect(c,spell(id,'clerigo',{customRoll:formula}),9,E).formula,formula);
});
