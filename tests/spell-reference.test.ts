import {test} from 'node:test';
import assert from 'node:assert/strict';
import {importSpellReference,spellCatalogDetail} from '../src/rules/spell-reference';
const E=require('../public/rules/character-engine');
test('consulta da importação usa só o catálogo vinculado e sua página',()=>{
 const entry=E.spell('Taumaturgia'),s=E.toSheetSpell(entry,'clerigo');s.notes='Texto que veio do PDF';const ref=importSpellReference(s,E)!;
 assert.ok(ref.text.includes(entry.text));assert.equal(ref.pdfPage,entry.pdfPage);assert.ok(!ref.text.includes(s.notes));assert.equal(importSpellReference({...s,customSpell:true},E),null);assert.equal(importSpellReference({name:entry.name},E),null);assert.equal(importSpellReference({...s,bookId:'não-existe'},E),null);
});
test('lista de classe não exclui origem racial: Taumaturgia mostra Clérigo e Tiefling',()=>{
 const detail=spellCatalogDetail(E.spell('Taumaturgia'),E);assert.match(detail,/Listas de classe: Clérigo/);assert.match(detail,/Traço racial: Tiefling/);assert.match(spellCatalogDetail(E.spell('Bênção'),E),/características ou talentos/);
});
