import {test} from 'node:test';
import assert from 'node:assert/strict';
import {manualCharacter} from '../src/manual/character';
import {validateImport,proposeImport} from '../src/import/character-review';
import {pdfToBackup} from '../src/import/pdf-character';
import {slotTable} from '../src/rules/spellcasting';
import {takeRest} from '../src/rules/rest';
import {armorClass} from '../src/rules/combat';
const E=require('../public/rules/character-engine');
const complete=()=>{const c=manualCharacter('Pessoa fictícia');c.name='Experimento';c.classes[0].classId='mago';c.classes[0].level=3;c.classes[0].hitDie=6;return c;};

test('ficha manual permite escolhas livres e conserva os limites técnicos de armazenamento',()=>{
  const c=complete();for(const a of Object.values(c.abilities) as any[])a.score=30;
  c.hpMax=c.hpCurrent=999;c.standardSlots={9:{total:25,used:3}};
  c.spells=['Raio de Fogo','Bênção','Comando'].map(id=>E.toSheetSpell(E.spell(id),'mago',{prepared:true}));
  validateImport(c,E);assert.deepEqual(slotTable(c,E),c.standardSlots);
  c.abilities.str.score=31;assert.throws(()=>validateImport(c,E),/atributo str/);c.abilities.str.score=30;
  c.classes[0].level=21;assert.throws(()=>validateImport(c,E),/nível/);c.classes[0].level=3;
  c.spells[0].customRoll='500d20';assert.throws(()=>validateImport(c,E),/fórmula/);
});
test('refresh e descanso não refazem as reservas nem concedem magias à ficha manual',()=>{
  const c=complete();c.classes.push({classId:'bruxo',level:1,subclass:'',subclassId:'',hitDie:8,hitDiceUsed:0});
  c.standardSlots={1:{total:11,used:2},9:{total:7,used:3}};c.pactMagic={level:5,total:8,used:6};c.sorceryPoints={max:42,current:6};c.hpMax=95;c.hpCurrent=12;
  const original=structuredClone(c);E.refresh(c,true);assert.deepEqual(c,original);
  takeRest(c,'long',E);assert.equal(c.hpCurrent,95);assert.equal(c.standardSlots[9].total,7);assert.equal(c.standardSlots[9].used,0);assert.equal(c.pactMagic.total,8);assert.equal(c.pactMagic.level,5);assert.deepEqual(c.sorceryPoints,{max:42,current:42});assert.deepEqual(c.spells,[]);
  assert.throws(()=>E.levelUp(c,'mago',{}),/preenchimento manual/);
});
test('revisão não liga novamente uma magia personalizada que tem nome do catálogo',()=>{
  const c=complete();c.spells=[{name:'Raio de Fogo',bookId:'custom_experimento',customSpell:true,circle:9,classId:'mago',castingAbility:'int',customRoll:'4d12+30'}];
  const p=proposeImport({format:'critcall.character-backup',version:1,exportedAt:'',characters:[c as any]},E).characters[0] as any;
  assert.equal(p.spells[0].bookId,'custom_experimento');assert.equal(p.spells[0].circle,9);validateImport(p,E);
});
test('formatos preenchidos à mão: classes sem espaços, CA aritmética e dados sem quantidade',()=>{
  const values={CharacterName:'Exemplo fictício',ClassLevel:'Monge6/Guerreiro3',AC:'18 + 1',Speed:'16,5 m','Wpn Name':'Arma fictícia','Wpn1 AtkBonus':'d6/d8','Wpn1 Damage':'Versátil'};
  const pdf={pages:[{width:612,height:792,text:''}],fields:Object.entries(values).map(([name,value],i)=>({name,value,page:1,x:0,y:i*20,width:100,height:12,checkbox:false}))};
  const c=pdfToBackup(pdf,E).characters[0] as any;
  assert.deepEqual(c.classes.map((x:any)=>[x.classId,x.level]),[['monge',6],['guerreiro',3]]);assert.equal(c.baseAcArmor,19);assert.equal(c.speed,16.5);assert.equal(c.weapons[0].damage,'1d6');assert.equal(c.weapons[0].bonus,'');
  pdf.fields.find(f=>f.name==='AC')!.value='18 + alert(1)';assert.equal((pdfToBackup(pdf,E).characters[0] as any).baseAcArmor,undefined);
});
test('CA escrita no modo manual inclui escudo/armadura uma vez e mantém efeitos explícitos',()=>{
  const c=complete();c.armorEquipped='Cota de malha';c.shieldEquipped=true;c.baseAcArmor=29;c.acFormula='legacy';
  c.ruleState={active:{'spell:shieldOfFaith':true}};c.acAdjustment=1;
  assert.equal(armorClass(c,E).total,32);
});
test('PDF não atribui à classe uma magia que também pode ter origem racial',()=>{
  const values={CharacterName:'Exemplo fictício',ClassLevel:'Bruxo 3','Race ':'Tiefling','Spells 1014':'Repreensão Infernal','Spells 1015':'Taumaturgia'};
  const pdf={pages:[{width:612,height:792,text:''}],fields:Object.entries(values).map(([name,value],i)=>({name,value,page:1,x:0,y:i*20,width:100,height:12,checkbox:false}))};
  const backup=proposeImport(pdfToBackup(pdf,E),E),c=backup.characters[0] as any;
  assert.ok(c.spells.every((s:any)=>s.classId===''&&s.importOriginNeedsConfirmation));assert.equal(c.spells[0].limitedUse,undefined);
});
