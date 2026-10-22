import {test} from 'node:test';
import assert from 'node:assert/strict';
import {proposeImport,validateImport,importWarnings,suggestPdfPools} from '../src/import/character-review';
import {pdfToBackup} from '../src/import/pdf-character';
import {toggleRecord} from '../src/import/proficiency-fields';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');
const backup=(c:any)=>({format:'critcall.character-backup' as const,version:1 as const,exportedAt:'',characters:[c]});
const pdf=(values:Record<string,string>)=>({pages:[{width:612,height:792,text:''}],fields:Object.entries(values).map(([name,value],i)=>({name,value,page:1,x:0,y:i*20,width:100,height:12,checkbox:false}))});

test('opções de idiomas preservam texto desconhecido e não duplicam o mesmo idioma',()=>{
 const raw='Idioma Comum e Dracônico e Infernal, Língua da mesa';
 assert.equal(toggleRecord(raw,'Comum',true),raw);
 const changed=toggleRecord(toggleRecord(raw,'Élfico',true),'Dracônico',false);
 assert.equal(changed,'Idioma Comum, Infernal, Língua da mesa, Élfico');
 assert.equal(toggleRecord('Dracônico antigo, Dracônico','Dracônico',false),'Dracônico antigo');
 assert.equal(toggleRecord('Arma da mesa; simples','Armas simples',true),'Arma da mesa; simples');
});
test('antecedente só é vinculado por correspondência inequívoca e sem mudar treinos',()=>{
 const c=warrior();c.background='Sábio';delete c.rules.backgroundId;
 const before=structuredClone(c),p=proposeImport(backup(c),E).characters[0] as any;
 assert.equal(p.rules.backgroundId,'sabio');assert.deepEqual(p.skillsProf,c.skillsProf);assert.deepEqual(p.proficiencies,c.proficiencies);assert.deepEqual(c,before);
 c.background='Sábio da mesa';assert.equal((proposeImport(backup(c),E).characters[0] as any).rules.backgroundId,undefined);
 c.background='Sábio';c.rules.manualMode=true;assert.equal((proposeImport(backup(c),E).characters[0] as any).rules.backgroundId,undefined);
});

test('proposta corrige somente vínculos inequívocos e conserva dados/nota/original',()=>{
 const c=warrior();c.race='Meio-Orc';c.rules={history:[],legacy:true};c.classes[0].level=3;c.classes[0].subclassId='mestre-batalha';c.classes[0].subclass='Mestre de Batalha';c.lore.backstory='Texto pessoal original';c.spells=[E.toSheetSpell(E.spell('Raio de Fogo'),'guerreiro',{bookId:'legado-inexistente',castingAbility:'int',extraSource:'Talento'})];
 const data={...backup(c),privateNotes:{[c.id]:'Nota separada'}},before=structuredClone(data),p=proposeImport(data,E).characters[0] as any;
 assert.equal(p.rules.raceId,'meioOrc');assert.equal(p.classes[0].subclassId,'mestreBatalha');assert.equal(p.spells[0].bookId,'raio-de-fogo');assert.equal(p.lore.backstory,c.lore.backstory);assert.deepEqual(data,before);
});
test('raça ampla e escolhas ausentes não viram sub-raça/juramento/preparação',()=>{
 const c=warrior();c.race='Anão';c.classes=[{classId:'paladino',level:6,subclass:'',subclassId:''}];c.rules={history:[],legacy:true};c.spells=[E.toSheetSpell(E.spell('Bênção'),'paladino')];
 const p=proposeImport(backup(c),E).characters[0] as any;
 assert.equal(p.rules.raceId,undefined);assert.equal(p.classes[0].subclassId,'');assert.equal(p.spells[0].prepared,undefined);assert.ok(importWarnings(p,E).some(s=>s.includes('não preparadas')));
});
test('PDF 2014: multiclasse, atributos, história e origem ambígua exigem revisão',()=>{
 const data=pdfToBackup(pdf({CharacterName:'Pessoa fictícia',ClassLevel:'Feiticeiro 6 | Bruxo 1','Race ':'Meio-Elfo',STR:'12',DEX:'14',CON:'16',INT:'10',WIS:'11',CHA:'18',HPMax:'48',HPCurrent:'7',AC:'13',Speed:'9','Spells 1014':'Raio de fogo 2d10','Spells 1015':'Rajada Mística BRUXO 2 feixes','Spells 1016':'Amizade',Backstory:'Minha história fictícia','Campo desconhecido':'Conteúdo que não pode sumir'}),E),c=data.characters[0] as any;
 assert.deepEqual(c.classes.map((x:any)=>[x.classId,x.level]),[['feiticeiro',6],['bruxo',1]]);assert.equal(c.rules.raceId,'meioElfo');assert.equal(c.hpCurrent,7);assert.equal(c.abilities.cha.score,18);assert.equal(c.lore.backstory,'Minha história fictícia');assert.equal(c.spells[0].classId,'feiticeiro');assert.equal(c.spells[1].classId,'bruxo');assert.equal(c.spells[2].classId,'');assert.ok(data.privateNotes![c.id].includes('Conteúdo que não pode sumir'));assert.deepEqual(c.standardSlots[3],{total:3,used:0});assert.equal(c.pactMagic.total,1);
 assert.throws(()=>validateImport(c,E),/origem de Amizade/);
});
test('PDF com campos de layout 2024 importa seus valores sem trocar regras',()=>{
 const c=pdfToBackup(pdf({CharacterName:'Guerreira fictícia',Class:'Bárbaro',Level:'3',SubClass:'Berserker','Race ':'Meio-Orc',STRscore:'18',DEXscore:'14',CONscore:'16',INTscore:'8',WISscore:'12',CHAscore:'10',HPMax:'35',HPCurrent:'7',AC:'15',Speed:'9M','Wpn1 Name':'Machado de Batalha','Wpn1 AtkBonus':'1d8','Wpn1 Damage':'Versátil 1d10'}),E).characters[0] as any;
 assert.equal(c.classes[0].subclassId,'berserker');assert.equal(c.rules.raceId,'meioOrc');assert.equal(c.abilities.str.score,18);assert.equal(c.weapons[0].damage,'1d8');assert.equal(c.weapons[0].bonus,'');assert.equal(c.weapons[0].calculationMode,'manual');assert.deepEqual(c.standardSlots,{});
});
test('PDF não inventa nível, atributos, CA ou origem quando ausentes',()=>{
 const c=pdfToBackup(pdf({CharacterName:'Incompleta',Class:'Mago','Spells 1014':'Magia desconhecida inventada'}),E).characters[0] as any;
 assert.equal(c.classes[0].level,0);assert.equal(c.abilities.str.score,undefined);assert.equal(c.baseAcArmor,undefined);assert.equal(c.spells[0].circle,undefined);assert.throws(()=>validateImport(c,E));
 const multi=pdfToBackup(pdf({CharacterName:'Multiclasse sem distribuição',Class:'Feiticeiro | Bruxo',Level:'7'}),E).characters[0] as any;assert.deepEqual(multi.classes.map((x:any)=>x.level),[0,0]);
});
test('origem especial, preparo acima do limite e usos inconsistentes são verificados',()=>{
 const c=warrior();c.classes=[{classId:'paladino',level:2,subclass:'',subclassId:''}];c.spells=[E.toSheetSpell(E.spell('Raio de Fogo'),'paladino')];
 assert.throws(()=>validateImport(c,E),/lista comum/);Object.assign(c.spells[0],{extraSource:'Talento confirmado'});assert.throws(()=>validateImport(c,E),/habilidade/);c.spells[0].castingAbility='int';validateImport(c,E);
 c.spells[0].limitedUse=1;c.spells[0].usesUsed=2;assert.throws(()=>validateImport(c,E),/usos/);c.spells[0].usesUsed=0;c.spells[0].ritual=true;assert.throws(()=>validateImport(c,E),/forma especial/);
 c.spells=['Bênção','Comando','Curar Ferimentos','Escudo da Fé','Heroísmo'].map(id=>E.toSheetSpell(E.spell(id),'paladino',{prepared:true}));assert.throws(()=>validateImport(c,E),/limite/);c.rules.importPreparationAdapted=true;validateImport(c,E);
});
test('reservas sugeridas consideram nível da classe, multiclasse e não dão magia ao paladino 1',()=>{
 const c=warrior();c.classes=[{classId:'paladino',level:1}];suggestPdfPools(c,E);assert.deepEqual(c.standardSlots,{});
 c.classes=[{classId:'paladino',level:5}];suggestPdfPools(c,E);assert.deepEqual(c.standardSlots,{1:{total:4,used:0},2:{total:2,used:0}});
 c.classes=[{classId:'paladino',level:5},{classId:'mago',level:1},{classId:'bruxo',level:3}];suggestPdfPools(c,E);assert.deepEqual(c.standardSlots,{1:{total:4,used:0},2:{total:2,used:0}});assert.deepEqual(c.pactMagic,{level:2,total:2,used:0});
});
test('magia de juramento exige subclasse e nível suficientes; entradas iguais não são fundidas',()=>{
 const c=warrior();c.classes=[{classId:'paladino',level:3,subclass:'Juramento de Devoção',subclassId:'devocao'}];c.spells=[E.toSheetSpell(E.spell('Santuário'),'paladino',{prepared:true})];validateImport(c,E);c.classes[0].level=2;assert.throws(()=>validateImport(c,E),/lista comum/);
 const other=warrior();other.classes=[{classId:'mago',level:2,subclass:'',subclassId:''},{classId:'feiticeiro',level:2,subclass:'',subclassId:''}];other.spells=[E.toSheetSpell(E.spell('Raio de Fogo'),'mago'),E.toSheetSpell(E.spell('Raio de Fogo'),'feiticeiro')];const p=proposeImport(backup(other),E);assert.equal((p.characters[0].spells as any[]).length,2);assert.deepEqual((p.characters[0].spells as any[]).map(s=>s.classId),['mago','feiticeiro']);
});

import {applySuggestedPools,importNotices} from '../src/import/character-review';
import {removeClass} from '../src/sheet-edit/class-removal';
test('comparação de reservas não descansa e recusa máximos abaixo dos usos sem alterar a origem',()=>{
 const c=warrior();c.classes=[{classId:'feiticeiro',level:6},{classId:'bruxo',level:1}];c.standardSlots={1:{total:5,used:2,created:1}};c.pactMagic={level:3,total:3,used:1};c.sorceryPoints={max:9,current:2};c.rules.fieldOverrides={standardSlots:true,pactMagic:true,sorceryPoints:true,speed:true};const before=structuredClone(c);
 const next=applySuggestedPools(c,E);assert.deepEqual(c,before);assert.deepEqual(next.standardSlots[1],{total:4,used:2});assert.deepEqual(next.pactMagic,{level:1,total:1,used:1});assert.deepEqual(next.sorceryPoints,{max:6,current:2});assert.deepEqual(next.rules.fieldOverrides,{speed:true});
 c.pactMagic.used=2;assert.throws(()=>applySuggestedPools(c,E),/usos de Pacto/);assert.equal(c.standardSlots[1].total,5);c.pactMagic.used=1;c.sorceryPoints.current=7;assert.throws(()=>applySuggestedPools(c,E),/pontos atuais/);c.sorceryPoints.current=2;c.standardSlots[1].used=5;assert.throws(()=>applySuggestedPools(c,E),/1º círculo/);
});
test('remoção explícita mantém ou exclui só magias vinculadas e preserva os dados e a origem',()=>{
 const c=warrior();c.classes=[{classId:'feiticeiro',level:6},{classId:'bruxo',level:1}];c.spells=[E.toSheetSpell(E.spell('Raio de Fogo'),'feiticeiro'),E.toSheetSpell(E.spell('Rajada Mística'),'bruxo',{notes:'Nota da magia',limitedUse:2,usesUsed:1,extraSource:'Dádiva'})];c.rules.history=[{original:true}];c.lore.backstory='Preservar';c.pactMagic={level:1,total:1,used:1};const before=structuredClone(c);
 assert.throws(()=>removeClass(c,1,E),/Escolha/);assert.throws(()=>removeClass(c,1,E,{spells:'keep',group:'bruxo'}),/restante/);
 const next=removeClass(c,1,E,{spells:'keep',group:'feiticeiro'});assert.deepEqual(c,before);assert.equal(next.classes.length,1);assert.equal(next.spells[1].classId,'feiticeiro');assert.equal(next.spells[1].castingAbility,'cha');assert.match(next.spells[1].extraSource,/Dádiva.*Classe anterior: Bruxo/);assert.equal(next.spells[1].notes,'Nota da magia');assert.equal(next.spells[1].usesUsed,1);assert.equal(next.hpMax,c.hpMax);assert.deepEqual(next.pactMagic,c.pactMagic);assert.deepEqual(next.rules.history,c.rules.history);assert.equal(next.lore.backstory,c.lore.backstory);
 const deleted=removeClass(c,1,E,{spells:'remove'});assert.equal(deleted.spells.length,1);assert.deepEqual(deleted.spells[0],c.spells[0]);assert.throws(()=>removeClass(deleted,0,E),/ao menos uma/);
});
test('observações explicam valores fixos e vínculos pendentes no setor correspondente',()=>{
 const c=warrior();c.acFormula='legacy';c.rules.pdfImport={};c.customSkillBonuses={arcanismo:5};c.weapons[0].calculationMode='manual';const notices=importNotices(c,E);
 assert.ok(notices.some(n=>n.sector==='combat'&&n.title.includes('CA')));assert.ok(notices.some(n=>n.sector==='skills'&&n.detail.includes('Apagar um total manual')));assert.ok(notices.some(n=>n.sector==='equipment'&&n.detail.includes('Não acompanham mudanças')));
});
test('classe removida não continua concedendo escolhas/efeitos pelo histórico preservado',()=>{
 const c=warrior();c.classes.push({classId:'bruxo',level:1,hitDie:8});c.ruleState={active:{'guerreiro:secondWind':true,'spell:shield':true}};const before=structuredClone(c);
 assert.deepEqual(E.selections(c,null,'fighting'),['Arquearia']);const next=removeClass(c,0,E);assert.equal(next.classes[0].classId,'bruxo');assert.deepEqual(E.selections(next,null,'fighting'),[]);assert.deepEqual(E.selections(next,null,'raceLanguages'),E.selections(c,null,'raceLanguages'));assert.deepEqual(next.rules.history,c.rules.history);assert.equal(next.ruleState.active['guerreiro:secondWind'],false);assert.equal(next.ruleState.active['spell:shield'],true);assert.deepEqual(c,before);
});

 test('PDF: Raio Místico com dados na linha é Rajada Mística, círculo zero, conservando texto',()=>{
 const raw='Raio Mistico, 1d10, dois feixes 36 m',source=pdf({CharacterName:'Conjuradora de teste',ClassLevel:'Ladino 6 / Bruxo 1',Race:'Tiefling','Spells 1014':raw});const before=structuredClone(source),c=pdfToBackup(source,E).characters[0] as any;
 assert.equal(c.spells[0].bookId,'rajada-mistica');assert.equal(c.spells[0].circle,0);assert.equal(c.spells[0].classId,'bruxo');assert.ok(c.spells[0].notes.includes(raw));assert.deepEqual(source,before);
 });
