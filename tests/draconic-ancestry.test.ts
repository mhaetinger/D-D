import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DRAGON_ANCESTRIES,breathProfile,setDragonChoice} from '../src/rules/draconic-ancestry';
import {damageDefenses} from '../src/rules/damage';
import {proposeImport} from '../src/import/character-review';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');

test('draconatos: dez cores/elementos, áreas e testes conferidos na p. 34 do livro de 2014',()=>{
 const expected=[['Azul','lightning',true,'dex'],['Branco','cold',false,'con'],['Bronze','lightning',true,'dex'],['Cobre','acid',true,'dex'],['Latão','fire',true,'dex'],['Negro','acid',true,'dex'],['Ouro','fire',false,'dex'],['Prata','cold',false,'con'],['Verde','poison',false,'con'],['Vermelho','fire',false,'dex']];
 assert.deepEqual(DRAGON_ANCESTRIES.map(x=>[x.choice.split(' — ')[0],x.type,x.line,x.save]),expected);
 assert.deepEqual(DRAGON_ANCESTRIES.map(x=>x.choice),E.options.dragons);
 const c=warrior();c.rules.raceId='draconato';
 for(const dragon of DRAGON_ANCESTRIES){setDragonChoice(c,'raceDragon',dragon.choice);for(const type of ['acid','cold','fire','lightning','poison'] as const)assert.equal(damageDefenses(c,type,{source:'other'},E).resistance.length,type===dragon.type?1:0);}
});
test('sopro: dano por nível total e CD de Constituição, com limiares de 2014',()=>{
 const c=warrior();c.abilities.con.score=16;
 for(const [level,dice] of [[1,'2d6'],[5,'2d6'],[6,'3d6'],[10,'3d6'],[11,'4d6'],[15,'4d6'],[16,'5d6'],[20,'5d6']] as const){c.classes[0].level=level;const p=breathProfile(c,'Latão — fogo')!;assert.equal(p.dice,dice);assert.equal(p.dc,8+3+2+Math.floor((level-1)/4));assert.equal(p.area,'linha de 1,5 m × 9 m');}
 c.classes[0].level=3;c.classes.push({classId:'bruxo',level:3});assert.equal(breathProfile(c,'Ouro — fogo')!.dice,'3d6');assert.equal(breathProfile(c,'Ouro — fogo')!.area,'cone de 4,5 m');
});
test('importação: ancestral racial e de feiticeiro separados, removíveis e sem apagar outros dados',()=>{
 const c=warrior();c.rules.raceId='draconato';c.classes=[{classId:'feiticeiro',level:6,subclassId:'draconica'}];c.rules.history=[{classId:'feiticeiro',level:1,answers:{raceDragon:'Ouro — fogo',dragon:'Azul — elétrico',racialFeat:'Teste preservado'},detail:'Metadado'}];
 setDragonChoice(c,'raceDragon','Branco — frio');assert.deepEqual(E.selections(c,'feiticeiro','dragon'),['Azul — elétrico']);assert.equal(c.rules.history[0].detail,'Metadado');assert.equal(c.rules.history[0].answers.racialFeat,'Teste preservado');
 assert.equal(damageDefenses(c,'cold',{source:'other'},E).resistance.length,1);assert.equal(damageDefenses(c,'lightning',{source:'other'},E).resistance.length,0);
 c.ruleState={active:{'feiticeiro:elementalAffinity':true}};assert.equal(damageDefenses(c,'lightning',{source:'other'},E).resistance.length,1);
 setDragonChoice(c,'dragon','Vermelho — fogo');assert.deepEqual(E.selections(c,null,'raceDragon'),['Branco — frio']);assert.equal(damageDefenses(c,'lightning',{source:'other'},E).resistance.length,0);assert.equal(damageDefenses(c,'fire',{source:'other'},E).resistance.length,1);
 setDragonChoice(c,'dragon','');assert.equal(damageDefenses(c,'fire',{source:'other'},E).resistance.length,0);assert.equal(damageDefenses(c,'cold',{source:'other'},E).resistance.length,1);assert.throws(()=>setDragonChoice(c,'raceDragon','Rubi — fogo'));
 c.rules.history[0].answers.raceDragon='Rubi — fogo';assert.equal(damageDefenses(c,'fire',{source:'other'},E).resistance.length,0,'texto com elemento não inventa uma cor do livro');
 c.rules.history[0].answers.raceDragon='BRANCO — frio';assert.equal(damageDefenses(c,'cold',{source:'other'},E).resistance.length,1,'preserva grafias equivalentes de escolhas antigas');
});
test('raça com cor explícita propõe ancestral sem adivinhar pela aparência nem substituir escolha existente',()=>{
 const c=warrior();c.race='Draconato Azul';delete c.rules.raceId;const before=structuredClone(c),backup={format:'critcall.character-backup' as const,version:1 as const,exportedAt:'',characters:[c]};
 let proposed=proposeImport(backup,E).characters[0] as any;assert.equal(proposed.rules.raceId,'draconato');assert.deepEqual(E.selections(proposed,null,'raceDragon'),['Azul — elétrico']);assert.deepEqual(c,before);
 setDragonChoice(c,'raceDragon','Ouro — fogo');proposed=proposeImport(backup,E).characters[0];assert.deepEqual(E.selections(proposed,null,'raceDragon'),['Ouro — fogo']);
 c.race='Draconato';c.rules.history=[];c.physical.skin='Azul';proposed=proposeImport(backup,E).characters[0];assert.deepEqual(E.selections(proposed,null,'raceDragon'),[]);
});
