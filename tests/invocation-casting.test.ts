import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {INVOCATION_CASTS,invocationResourceId,previewInvocationCast,validateInvocationChoice,applyInvocationCast} from '../src/rules/invocation-casting';
import {resourcesFor,resetResources} from '../src/rules/resources';
import {startConcentration} from '../src/rules/concentration';
const require=createRequire(import.meta.url),E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');
function make(name='Sinal de Mau Agouro',n=15) {
 const c=warrior();c.classes=[{classId:'bruxo',level:n,subclassId:'corruptor',subclass:'O Corruptor',hitDie:8,hitDiceUsed:0}];c.armorEquipped=null;c.shieldEquipped=false;c.hpMax=c.hpCurrent=80;c.hpTemp=0;c.pactMagic={level:5,total:3,used:0};c.standardSlots={3:{total:4,used:0},5:{total:2,used:0}};
 c.rules={raceId:'humano',history:[{classId:'bruxo',level:2,answers:{invocations:[name]}},{classId:'bruxo',level:3,answers:{pact:'corrente'}}]};c.ruleState={version:1,used:{},pools:{},active:{},targets:{},portent:[],future:{text:'Preservar'}};return c;
}
const yes={declared:true};
test('sete invocações diárias pagam simultaneamente uso e Pacto; nenhuma paga com Conjuração ou adiciona magia conhecida',()=>{
 const daily=['Encharcar a Mente','Escultor de Carne','Lacaios do Caos','Larápio dos Cinco Destinos','Palavra Terrível','Sinal de Mau Agouro','Sussurros Sedutores'];
 for(const name of daily){const c=make(name),before=structuredClone(c);const r=applyInvocationCast(c,name,yes,E);assert.equal(r.castLevel,5);assert.equal(c.pactMagic.used,1);assert.equal(c.ruleState.used[invocationResourceId(name)],1);assert.deepEqual(c.standardSlots,before.standardSlots);assert.deepEqual(c.spells,before.spells);assert.deepEqual(c.ruleState.future,before.ruleState.future);const after=structuredClone(c);assert.throws(()=>applyInvocationCast(c,name,yes,E),/esgotado/);assert.deepEqual(c,after);}
});
test('nenhum recurso/concentração muda quando falta espaço de Pacto, mesmo havendo Conjuração',()=>{
 const c=make();startConcentration(c,{name:'Anterior'});c.pactMagic.used=3;const before=structuredClone(c);assert.throws(()=>applyInvocationCast(c,'Sinal de Mau Agouro',yes,E),/Sem espaço/);assert.deepEqual(c,before);
});
test('descanso curto recupera Pacto sem liberar uso diário; longo libera a mesma reserva',()=>{
 const c=make('Escultor de Carne');applyInvocationCast(c,'Escultor de Carne',yes,E);resetResources(c,'short',E);assert.equal(c.ruleState.used[invocationResourceId('Escultor de Carne')],1);assert.throws(()=>previewInvocationCast(c,'Escultor de Carne',E),/esgotado/);resetResources(c,'long',E);assert.equal(previewInvocationCast(c,'Escultor de Carne',E).remaining,1);
});
test('Maldição em Pacto 3/4 substitui concentração; em 5 não exige nem encerra a anterior',()=>{
 for(const [n,duration,replace] of [[3,'1 minuto',true],[4,'10 minutos',true],[5,'8 horas',false]] as const){const c=make();c.pactMagic.level=n;startConcentration(c,{name:'Anterior',spellKey:'old'});const id=c.ruleState.concentration.id,p=previewInvocationCast(c,'Sinal de Mau Agouro',E);assert.equal(p.replaces,replace);assert.match(p.info.duration,new RegExp(duration));assert.equal(p.effect.formula,null);applyInvocationCast(c,'Sinal de Mau Agouro',yes,E);assert.equal(c.ruleState.concentration.id===id,!replace);}
});
test('Metamorfose e Elemental mantêm concentração e tempo do catálogo, sem fabricar ataques/estatísticas da criatura',()=>{
 for(const name of ['Escultor de Carne','Lacaios do Caos']){const c=make(name),weapons=structuredClone(c.weapons),p=previewInvocationCast(c,name,E);assert.equal(p.info.held,true);assert.equal(p.info.prolonged,name==='Lacaios do Caos');applyInvocationCast(c,name,yes,E);assert.match(c.ruleState.concentration.duration,/1 hora/);assert.deepEqual(c.weapons,weapons);assert.equal(c.ruleState.active['druida:wildShape'],undefined);}
});
test('onze conjurações à vontade usam o círculo base, sem Pacto/uso diário ou concessão de magia conhecida',()=>{
 const rows=INVOCATION_CASTS.filter(i=>!('pact' in i) && !('targetLimited' in i));assert.equal(rows.length,11);
 for(const row of rows){const c=make(row.name);c.pactMagic.used=3;const before=structuredClone(c);const p=previewInvocationCast(c,row.name,E);assert.equal(p.castLevel,E.spell(row.spell).level);applyInvocationCast(c,row.name,{...yes,face:2,temporary:'replace'},E);assert.deepEqual(c.pactMagic,before.pactMagic);assert.deepEqual(c.spells,before.spells);assert.equal(c.ruleState.used[invocationResourceId(row.name)],undefined);}
});
test('Vigor Abissal é sempre 1d4+4 temporários, não cura, Vida e nível alto não aumentam',()=>{
 const c=make('Vigor Abissal');c.classes.push({classId:'clerigo',level:1,subclassId:'vida',subclass:'Domínio da Vida'});c.hpCurrent=10;const r=applyInvocationCast(c,'Vigor Abissal',{...yes,face:4,temporary:'replace'},E);assert.equal(r.castLevel,1);assert.equal(c.hpCurrent,10);assert.equal(c.hpTemp,8);assert.match(c.hpTempSource,/1 hora/);
});
test('reserva temporária maior/menor pode ser mantida ou substituída, sem somar',()=>{
 const c=make('Vigor Abissal');c.hpTemp=20;c.hpTempSource='Outra fonte';applyInvocationCast(c,'Vigor Abissal',{...yes,face:1,temporary:'keep'},E);assert.equal(c.hpTemp,20);assert.equal(c.hpTempSource,'Outra fonte');applyInvocationCast(c,'Vigor Abissal',{...yes,face:1,temporary:'replace'},E);assert.equal(c.hpTemp,5);
});
test('faces/decisão/declaração inválidas não alteram documento',()=>{
 const c=make('Vigor Abissal'),before=structuredClone(c);for(const choice of [{...yes,face:0,temporary:'replace'},{...yes,face:5,temporary:'replace'},{...yes,face:2},{declared:false,face:2,temporary:'replace'}])assert.throws(()=>applyInvocationCast(c,'Vigor Abissal',choice as any,E));assert.deepEqual(c,before);
});
test('Armadura Arcana é em si e exige ausência de armadura; escudo proficiente permite',()=>{
 const c=make('Armadura de Sombras');c.armorEquipped='Couro';let before=structuredClone(c);assert.throws(()=>applyInvocationCast(c,'Armadura de Sombras',yes,E),/sem armadura/);assert.deepEqual(c,before);c.armorEquipped=null;c.shieldEquipped=true;c.armorProficiencies=['leve','escudo'];applyInvocationCast(c,'Armadura de Sombras',yes,E);assert.equal(c.mageArmorActive,true);
});
test('Proteção Arcana usa a consequência comum do grimório na conjuração à vontade',()=>{
 const c=make('Armadura de Sombras');c.classes.push({classId:'mago',level:2,subclassId:'abjuracao',subclass:'Escola de Abjuração'});c.abilities.int.score=16;applyInvocationCast(c,'Armadura de Sombras',yes,E);assert.equal(c.ruleState.pools['mago:ward'],7);c.ruleState.pools['mago:ward']=1;applyInvocationCast(c,'Armadura de Sombras',yes,E);assert.equal(c.ruleState.pools['mago:ward'],3);
});
test('Conjuração por invocação recarrega Transposição Benigna pela mesma consequência, sem outro contador',()=>{
 const c=make('Lacaios do Caos');c.ruleState.used['mago:benign']=1;applyInvocationCast(c,'Lacaios do Caos',yes,E);assert.equal(c.ruleState.used['mago:benign'],0);
});
test('Cárceri usa pré-requisitos de nível próprio e Pacto da Corrente',()=>{
 const c=make('Correntes de Cárceri',14);assert.throws(()=>previewInvocationCast(c,'Correntes de Cárceri',E),/não disponível/);c.classes[0].level=15;c.rules.history[1].answers.pact='tomo';assert.throws(()=>previewInvocationCast(c,'Correntes de Cárceri',E),/não disponível/);c.rules.history[1].answers.pact='corrente';assert.equal(previewInvocationCast(c,'Correntes de Cárceri',E).castLevel,5);
});
test('Cárceri não cria limite global: alvo/tipo/repetição declarados por criatura e contador antigo preservado',()=>{
 const c=make('Correntes de Cárceri'),id=invocationResourceId('Correntes de Cárceri');c.ruleState.used[id]=1;c.pactMagic.used=3;assert.equal(resourcesFor(c,E).some(r=>r.id===id),false);const before=structuredClone(c);assert.throws(()=>applyInvocationCast(c,'Correntes de Cárceri',{...yes,target:'A'},E),/criatura/);assert.deepEqual(c,before);for(const target of ['Celestial A','Elemental B'])applyInvocationCast(c,'Correntes de Cárceri',{...yes,target,targetEligible:true},E);assert.equal(c.ruleState.used[id],1);assert.equal(c.pactMagic.used,3);assert.match(c.ruleState.concentration.name,/Imobilizar Monstro/);
});
test('seleção ausente, invocação substituída ou nível total de outras classes não concede conjuração',()=>{
 const c=make('Escultor de Carne',6);c.classes.push({classId:'guerreiro',level:14,subclass:'Campeão'});assert.throws(()=>previewInvocationCast(c,'Escultor de Carne',E),/não disponível/);c.classes[0].level=7;c.rules.history[0].answers.invocations=['Visão Diabólica'];assert.throws(()=>previewInvocationCast(c,'Escultor de Carne',E),/não disponível/);assert.throws(()=>previewInvocationCast(c,'Nome inventado',E),/não disponível/);
});
test('Fúria, incapacitação, Forma Selvagem e equipamento não proficiente bloqueiam sem cobrança',()=>{
 for(const edit of [(c:any)=>c.ruleState.active['barbaro:rage']=true,(c:any)=>c.ruleState.conditions={atordoado:true},(c:any)=>c.hpCurrent=0,(c:any)=>c.ruleState.active['druida:wildShape']=true,(c:any)=>{c.armorEquipped='Placas';c.armorProficiencies=[];}]){const c=make();edit(c);const before=structuredClone(c);assert.throws(()=>applyInvocationCast(c,'Sinal de Mau Agouro',yes,E));assert.deepEqual(c,before);}
});
test('concentração futura/ilegível é preservada e bloqueia a próxima magia que exige concentração',()=>{
 const c=make('Escultor de Carne');c.ruleState.concentration={version:9,secret:'Preservar'};const before=structuredClone(c);assert.throws(()=>applyInvocationCast(c,'Escultor de Carne',yes,E),/ilegível/);assert.deepEqual(c,before);
});
test('reservas ilegíveis e versão futura são preservadas sem normalização destrutiva',()=>{
 for(const edit of [(c:any)=>c.ruleState.used[invocationResourceId('Sinal de Mau Agouro')]='1',(c:any)=>c.pactMagic.used=-1,(c:any)=>c.pactMagic.level=6,(c:any)=>c.ruleState.version=9,(c:any)=>c.ruleState.used=[]]){const c=make();edit(c);const before=structuredClone(c);assert.throws(()=>applyInvocationCast(c,'Sinal de Mau Agouro',yes,E));assert.deepEqual(c,before);}
});
test('validar prévia não cobra nem substitui concentração; alteração posterior é revalidada ao aplicar',()=>{
 const c=make('Escultor de Carne');startConcentration(c,{name:'Anterior'});const before=structuredClone(c);validateInvocationChoice(c,'Escultor de Carne',yes,E);assert.deepEqual(c,before);c.pactMagic.used=3;const after=structuredClone(c);assert.throws(()=>applyInvocationCast(c,'Escultor de Carne',yes,E));assert.deepEqual(c,after);
});
test('resistência usa CAR do bruxo com proficiência total, não habilidade de outra classe nem ataque contra CA',()=>{
 const c=make();c.classes.push({classId:'mago',level:3,subclassId:'evocacao',subclass:'Escola de Evocação'});c.abilities.cha.score=18;c.abilities.int.score=20;assert.equal(previewInvocationCast(c,'Sinal de Mau Agouro',E).save,'SAB CD 18 (CAR de bruxo)');c.rules.history[0].answers.invocations=['Larápio dos Cinco Destinos'];assert.equal(previewInvocationCast(c,'Larápio dos Cinco Destinos',E).save,'CAR CD 18 (CAR de bruxo)');
});
test('Proteção Arcana ilegível e temporários desconhecidos bloqueiam antes de qualquer aplicação',()=>{
 for(const name of ['Armadura de Sombras','Vigor Abissal']){const c=make(name);if(name==='Armadura de Sombras'){c.classes.push({classId:'mago',level:2,subclassId:'abjuracao',subclass:'Escola de Abjuração'});c.ruleState.pools['mago:ward']='3';}else c.hpTemp='5';const before=structuredClone(c);assert.throws(()=>previewInvocationCast(c,name,E),/ilegível/);assert.deepEqual(c,before);}
});
