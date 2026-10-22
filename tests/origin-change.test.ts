import {test} from 'node:test';
import assert from 'node:assert/strict';
import {proposeOriginChange} from '../src/sheet-edit/origin-change';
import {hasFeat} from '../src/rules/passives';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');
test('troca de origem é proposta: preserva totais e dados; aposenta só escolhas da origem',()=>{
 const c=warrior();c.rules.history[0].answers.racialFeat='Robusto';c.rules.history[0].answers.backgroundLanguages=['Élfico'];const before=structuredClone(c);
 const {next,changes,review}=proposeOriginChange(c,'race','Draconato',E);
 assert.deepEqual(c,before);assert.equal(next.rules.raceId,'draconato');assert.deepEqual(next.abilities,c.abilities);assert.equal(next.hpMax,c.hpMax);assert.equal(next.id,c.id);assert.deepEqual(next.proficiencies,c.proficiencies);assert.deepEqual(next.lore,c.lore);assert.equal(hasFeat(next,E,'Robusto'),false);assert.deepEqual(E.selections(next,null,'backgroundLanguages'),['Élfico']);assert.ok(next.rules.history[0].retiredOrigins.some((x:any)=>x.answers.racialFeat==='Robusto'));assert.match(changes.join(' '),/Entram os vínculos/);assert.match(review.join(' '),/ancestralidade/);assert.equal(next.rules.originReview.race.manualTotals,true);
});
test('antecedente atualiza o vínculo de consulta sem apagar escolhas raciais e classes',()=>{
 const c=warrior();const {next}=proposeOriginChange(c,'background','Sábio',E);assert.equal(next.rules.backgroundId,'sabio');assert.ok(E.features(next).some((x:any)=>x.name==='Pesquisador'));assert.deepEqual(E.selections(next,null,'raceLanguages'),E.selections(c,null,'raceLanguages'));assert.deepEqual(next.classes,c.classes);
 const free=proposeOriginChange(next,'background','Cronista da mesa',E).next;assert.equal(free.rules.backgroundId,'');assert.equal(free.background,'Cronista da mesa');assert.ok(!E.features(free).some((x:any)=>x.source==='Sábio'));
});
test('magias da raça anterior viram adaptações explícitas sem recuperar usos',()=>{
 const c=warrior();c.race='Tiefling';c.rules.raceId='tiefling';c.spells=[{...E.toSheetSpell(E.spell('Repreensão Infernal'),'guerreiro'),extraSource:'Tiefling',castingAbility:'cha',automatic:true,limitedUse:1,usesUsed:1,notes:'Texto particular'}];
 const next=proposeOriginChange(c,'race','Alto Elfo',E).next;assert.equal(next.spells.length,1);assert.match(next.spells[0].extraSource,/Adaptação.*Tiefling/);assert.equal(next.spells[0].automatic,false);assert.equal(next.spells[0].usesUsed,1);assert.equal(next.spells[0].notes,'Texto particular');assert.equal(c.spells[0].extraSource,'Tiefling');
});
