import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resourcesFor,useResource,remaining} from '../src/rules/resources';
import {takeRest} from '../src/rules/rest';
import {state} from '../src/rules/model';
import {resolveSpellEffect} from '../src/rules/spell-effects';
import {applyCastConcentration,concentration,needsConcentrationConfirmation,spellConcentration,startConcentration} from '../src/rules/concentration';
const E=require('../public/rules/character-engine'),{create,choose}=require('./character-choices.cjs');
const names=['Armadura de Sombras','Vigor Abissal','Escultor de Carne','Sinal de Mau Agouro'];
const ids=['armadura-arcana','vitalidade-falsa','metamorfose','rogar-maldicao'];
const invocations=(c:any)=>resourcesFor(c,E).filter(r=>r.id.startsWith('bruxo:invocation-'));
function advance(c:any,answers:any={}){const d=E.context({},{},c,'bruxo');choose(d,'corruptor',answers);return E.levelUp(c,'bruxo',d.answers);}
function make(level=7){
  let c=create('bruxo','corruptor');
  for(let n=2;n<=level;n++)c=advance(c,n===2?{invocations:names.slice(0,2)}:n===5?{invocations:['Sinal de Mau Agouro']}:n===7?{invocations:['Escultor de Carne']}:{});
  return c;
}
test('quatro referências e magias preservam fonte, nível, duração e exceções específicas de 2014',()=>{
  for(const [i,name] of names.entries()){
    const r=E.reference(name,'bruxo');assert.equal(r.classId,'bruxo');assert.ok(r.text.trim());assert.equal(r.pdfPage,i%2?61:60);
  }
  assert.match(E.reference(names[0],'bruxo').text,/em si mesmo[\s\S]*sem precisar gastar/);
  assert.match(E.reference(names[1],'bruxo').text,/em si mesmo[\s\S]*1° nível/);
  for(const name of names.slice(2))assert.match(E.reference(name,'bruxo').text,/espaço de magia de bruxo[\s\S]*descanso longo/);
  const spells=ids.map(id=>E.spell(id));assert.deepEqual(spells.map(s=>s.level),[1,1,4,3]);
  assert.deepEqual(spells.map(s=>s.concentration),[false,false,true,true]);
  assert.deepEqual(spells.map(s=>s.range),['Toque','Pessoal','18 metros','Toque']);
  assert.deepEqual(spells.map(s=>s.duration),['8 horas','1 hora','Concentração, até 1 hora','Concentração, até 1 minuto']);
  assert.match(spells[1].text,/1d4 \+ 4 pontos de vida temporários/);
});
test('pré-requisitos usam nível de bruxo, inclusive ao escolher e substituir em multiclasse',()=>{
  const offered=(c:any,replace=false)=>{
    const d=E.context({},{},c,'bruxo');if(replace)d.answers.invocationsReplace='Vigor Abissal';
    return (E.requirements(d).find((f:any)=>f.id===(replace?'invocationsReplacement':'invocations'))?.options || []).map((x:any)=>x.value);
  };
  const low=create('bruxo','corruptor');assert.ok(offered(low).includes('Armadura de Sombras'));assert.ok(!offered(low).includes('Sinal de Mau Agouro'));
  assert.ok(offered(make(4)).includes('Sinal de Mau Agouro'));assert.ok(!offered(make(4)).includes('Escultor de Carne'));assert.ok(offered(make(6)).includes('Escultor de Carne'));
  const m=make(2);m.classes.push({classId:'feiticeiro',level:8,subclassId:'draconica',subclass:'Linhagem Dracônica'});m.abilities.cha.score=16;
  assert.ok(!offered(m,true).includes('Sinal de Mau Agouro'));assert.ok(!offered(m,true).includes('Escultor de Carne'));
  const d=E.context({},{},low,'bruxo');const a=choose(d,'corruptor');assert.throws(()=>E.levelUp(low,'bruxo',{...a,invocations:['Sinal de Mau Agouro','Escultor de Carne']}),/indisponível/);
});
test('à vontade não cria usos diários; Sinal/Escultor têm reservas únicas e recuperação longa, separadas do Pacto manual',()=>{
  const c=make(),list=invocations(c);assert.deepEqual(list.map(r=>r.name).sort(),names.slice(2).sort());
  assert.equal(new Set(list.map(r=>r.id)).size,list.length);
  assert.ok(list.every(r=>r.max===1 && r.recovery==='long'));
  assert.ok(ids.every(id=>!c.spells.some((s:any)=>s.bookId===id)),'invocações não viram magias conhecidas automaticamente');
  const sinal=list.find(r=>r.name==='Sinal de Mau Agouro')!,pact=JSON.stringify(c.pactMagic);
  useResource(c,sinal,E);assert.equal(remaining(c,sinal),0);assert.equal(JSON.stringify(c.pactMagic),pact);
  const before=JSON.stringify(c);assert.throws(()=>useResource(c,sinal,E),/insuficientes/);assert.equal(JSON.stringify(c),before);
  takeRest(c,'short',E);assert.equal(remaining(c,sinal),0);takeRest(c,'long',E);assert.equal(remaining(c,sinal),1);
  c.pactMagic.used=c.pactMagic.total;useResource(c,sinal,E);assert.equal(remaining(c,sinal),0,'registro diário funciona após descontar o espaço na mesa');assert.equal(c.pactMagic.used,c.pactMagic.total);
});
test('trocar invocação retira a característica antiga sem reescrever histórico, notas ou reservas',()=>{
  const c=make();state(c).used['bruxo:invocation-sinal-de-mau-agouro']=1;c.lore.backstory='Texto próprio preservado.';
  const next=advance(c,{invocationsReplace:'Sinal de Mau Agouro',invocationsReplacement:'Visão Diabólica'}),before=JSON.stringify(next);
  const features=E.features(next).filter((f:any)=>names.concat('Visão Diabólica').includes(f.name));
  assert.ok(!features.some((f:any)=>f.name==='Sinal de Mau Agouro'));
  assert.equal(features.filter((f:any)=>f.name==='Visão Diabólica').length,1);
  assert.ok(!invocations(next).some(r=>r.name==='Sinal de Mau Agouro'));
  assert.ok(next.rules.history.some((h:any)=>h.answers.invocations?.includes('Sinal de Mau Agouro')),'registro original preservado');
  assert.equal(JSON.stringify(next),before);assert.equal(next.lore.backstory,c.lore.backstory);
  assert.equal(next.ruleState.used['bruxo:invocation-sinal-de-mau-agouro'],1);
});
test('reaprender uma invocação mostra uma única aquisição atual, sem renovar o uso antigo',()=>{
  let c=make();state(c).used['bruxo:invocation-sinal-de-mau-agouro']=1;
  c=advance(c,{invocationsReplace:'Sinal de Mau Agouro',invocationsReplacement:'Visão Diabólica'});
  c=advance(c,{invocations:['Sinal de Mau Agouro']});const before=JSON.stringify(c);
  const gains=E.features(c).filter((f:any)=>f.classId==='bruxo' && f.name==='Sinal de Mau Agouro');
  assert.equal(gains.length,1);assert.equal(gains[0].level,9);
  assert.equal(remaining(c,invocations(c).find(r=>r.name==='Sinal de Mau Agouro')!),0);
  assert.equal(JSON.stringify(c),before);
});
test('Vitalidade Falsa é PV temporário, sem cura/Vida automática; o resumo respeita o círculo e fórmulas próprias',()=>{
  const c=make();c.classes.push({classId:'clerigo',level:1,subclassId:'vida'});
  const s=E.toSheetSpell(E.spell('vitalidade-falsa'),'bruxo',{dmgType:'cura',effectSummary:'Cura · 1 hora'});
  assert.equal(E.spellMeta(E.spell(s.bookId)).dmgType,'defesa');
  for(const circle of [1,2,5]){const p=resolveSpellEffect(c,s,circle,E,{legacyFormula:'1d4+4'});assert.equal(p.formula,null);assert.equal(p.summary,`1d4+${4+5*(circle-1)} PV temporários · 1 hora`);}
  assert.equal(resolveSpellEffect(c,{...s,customRoll:'1d4+12'},5,E).formula,'1d4+12');
});
test('Rogar Maldição não lança dano ao conjurar e conserva fórmulas próprias',()=>{
  const c=make(),s=E.toSheetSpell(E.spell('rogar-maldicao'),'bruxo',{dmgType:'necrotico'}),before=JSON.stringify(c);
  assert.equal(E.spellMeta(E.spell(s.bookId)).diceFormula,null);
  const p=resolveSpellEffect(c,s,3,E,{legacyFormula:'1d8'});assert.equal(p.formula,null);assert.match(p.explanation,/posteriores/);
  assert.equal(resolveSpellEffect(c,{...s,customRoll:'1d8+2'},3,E).formula,'1d8+2');assert.equal(JSON.stringify(c),before);
});
test('Rogar Maldição usa o círculo escolhido para duração/concentração, inclusive Pacto de 5º e campos próprios',()=>{
  const c=make(),s=E.toSheetSpell(E.spell('rogar-maldicao'),'bruxo');
  for(const [circle,held,duration]of [[3,true,'Concentração, até 1 minuto'],[4,true,'Concentração, até 10 minutos'],[5,false,'8 horas'],[6,false,'8 horas'],[7,false,'24 horas'],[8,false,'24 horas'],[9,false,'Até ser dissipada']] as const){
    const p=spellConcentration(c,s,E,false,circle);assert.equal(p.held,held);assert.equal(p.duration,duration);
    assert.ok(resolveSpellEffect(c,s,circle,E).summary.includes(duration));
  }
  startConcentration(c,{name:'Efeito anterior'});const old=concentration(c)!.id;
  assert.equal(needsConcentrationConfirmation(c,s,E,false,5),false);applyCastConcentration(c,s,E,false,5);assert.equal(concentration(c)!.id,old);
  assert.equal(needsConcentrationConfirmation(c,s,E,false,4),true);applyCastConcentration(c,s,E,false,4);assert.equal(concentration(c)!.duration,'Concentração, até 10 minutos');
  assert.equal(spellConcentration(c,{...s,conc:false},E,false,3).held,false);
  assert.equal(spellConcentration(c,{...s,customSpell:true,duration:'Duração própria'},E,false,5).duration,'Duração própria');
  assert.equal(spellConcentration(c,{...s,customRoll:'1d8'},E,false,5).held,true);
});
