import {test} from 'node:test';
import assert from 'node:assert/strict';
import {blankCharacter,editSheetField,changeClassList} from '../src/sheet-edit/model';
import {canEditSheet,setSheetAuthorityProvider} from '../src/sheet-edit/access';
import {proposeImport} from '../src/import/character-review';
import {pdfToBackup} from '../src/import/pdf-character';
import {armorClass} from '../src/rules/combat';
import {takeRest} from '../src/rules/rest';
import {resourcesFor} from '../src/rules/resources';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');

test('edição direta de CON ajusta PV retroativos sem trocar o modo nem reconstruir a ficha',()=>{
  const original=warrior(),before=structuredClone(original);original.lore.backstory='História preservada';before.lore.backstory=original.lore.backstory;
  const expectedMax=original.hpMax+(10-Math.floor((original.abilities.con.score-10)/2))*original.classes[0].level;
  let c=editSheetField(original,'abilities.con.score','30',E);assert.equal(c.hpMax,expectedMax);assert.equal(c.abilities.con.score,30);assert.deepEqual(original,before);assert.equal(c.rules.manualMode,undefined);
  c=editSheetField(c,'classes.0.level','6',E);assert.equal(c.classes[0].level,6);assert.equal(c.hpMax,expectedMax);assert.equal(c.spells.length,original.spells.length);assert.equal(c.lore.backstory,original.lore.backstory);
  assert.throws(()=>editSheetField(c,'abilities.con.score','31',E));assert.throws(()=>editSheetField(c,'classes.0.level','2.5',E));assert.throws(()=>editSheetField(c,'__proto__.x','teste',E));assert.equal(({} as any).x,undefined);
});
test('máximos e reservas ajustados sobrevivem ao refresh e ao descanso sem alterar o criador',()=>{
  let c=blankCharacter();c.classes=[{classId:'mago',level:3,subclass:'',subclassId:'',hitDie:6,hitDiceUsed:0},{classId:'bruxo',level:1,subclass:'',subclassId:'',hitDie:8,hitDiceUsed:0}];
  for(const [path,value] of [['standardSlots.9.total','7'],['standardSlots.9.remaining','4'],['pactMagic.total','8'],['pactMagic.level','5'],['sorceryPoints.max','42'],['sorceryPoints.current','6'],['speed','16.5']] as const)c=editSheetField(c,path,value,E);
  assert.throws(()=>editSheetField(c,'standardSlots.9.total','1',E));assert.throws(()=>editSheetField(c,'pactMagic.remaining','9',E));
  E.refresh(c,true);assert.deepEqual(c.standardSlots[9],{total:7,used:3});assert.equal(c.pactMagic.total,8);assert.equal(c.pactMagic.level,5);assert.equal(c.sorceryPoints.max,42);assert.equal(E.movementSpeed(c),16.5);
  takeRest(c,'long',E);assert.deepEqual(c.standardSlots[9],{total:7,used:0,created:0});assert.equal(c.pactMagic.total,8);assert.deepEqual(c.sorceryPoints,{max:42,current:42});
});
test('classe com magias não é removida ou trocada silenciosamente e duplicação/nível total são validados',()=>{
  let c=blankCharacter();c.classes[0].classId='mago';c.spells=[E.toSheetSpell(E.spell('Raio de Fogo'),'mago')];c=changeClassList(c,null,E);
  assert.throws(()=>changeClassList(c,0,E),/Escolha/);assert.throws(()=>editSheetField(c,'classes.0.classId','bruxo',E),/Reatribua/);
  assert.throws(()=>editSheetField(c,'classes.1.classId','mago',E),/repetida/);assert.throws(()=>editSheetField(c,'classes.0.level','20',E),/total/);
  c=changeClassList(c,1,E);assert.equal(c.classes.length,1);assert.equal(c.spells.length,1);
});
test('corrigir usos mantém espaços temporários e não fixa máximos que continuam automáticos',()=>{
  let c=warrior();c.standardSlots={1:{total:5,used:1,created:1}};c.pactMagic={total:4,used:2,level:2};c.sorceryPoints={max:6,current:1};
  c=editSheetField(c,'standardSlots.1.remaining','2',E);c=editSheetField(c,'pactMagic.remaining','3',E);c=editSheetField(c,'sorceryPoints.current','3',E);
  assert.equal(c.standardSlots[1].created,1);assert.equal(c.rules.fieldOverrides?.standardSlots,undefined);assert.equal(c.rules.fieldOverrides?.pactMagic,undefined);assert.equal(c.rules.fieldOverrides?.sorceryPoints,undefined);
  takeRest(c,'long',E);assert.deepEqual(c.standardSlots[1],{total:4,used:0,created:0});assert.equal(c.sorceryPoints.max,6);
});
test('permissão da sala vem do contexto externo e é conferida ao aplicar, mesmo com dados adulterados',()=>{
  const c=blankCharacter();c.rules.room={role:'gm',canEdit:true};
  try {setSheetAuthorityProvider(()=>({kind:'room',role:'player',playerCanEdit:false}));assert.equal(canEditSheet(c),false);assert.throws(()=>editSheetField(c,'hpMax','900',E),/bloqueada/);assert.throws(()=>changeClassList(c,null,E),/bloqueada/);
    setSheetAuthorityProvider(()=>({kind:'room',role:'player',playerCanEdit:true}));assert.equal(editSheetField(c,'hpMax','900',E).hpMax,900);
    setSheetAuthorityProvider(()=>({kind:'room',role:'gm',playerCanEdit:false}));assert.equal(editSheetField(c,'hpMax','500',E).hpMax,500);
  }finally{setSheetAuthorityProvider(()=>({kind:'personal'}));}
});
test('CA digitada mantém o total com equipamento/escudo e efeitos temporários, sem duplicação',()=>{
  const c=warrior();c.shieldEquipped=true;c.armorEquipped='Cota de malha';c.ruleState={active:{'spell:shieldOfFaith':true}};c.acAdjustment=1;
  const next=editSheetField(c,'armorTotal','32',E);assert.equal(armorClass(next,E).total,32);assert.equal(next.baseAcArmor,29);next.ruleState.active['spell:shieldOfFaith']=false;assert.equal(armorClass(next,E).total,30);
});
test('bônus de perícia vazio retoma o cálculo; máximos de recurso guardam ajuste explícito',()=>{
  let c=warrior();c=editSheetField(c,'customSkillBonuses.arcanismo','0',E);assert.equal(c.customSkillBonuses.arcanismo,0);c=editSheetField(c,'customSkillBonuses.arcanismo','',E);assert.equal(Object.hasOwn(c.customSkillBonuses,'arcanismo'),false);
  const r=resourcesFor(c,E).find(r=>r.id==='guerreiro:secondWind')!;assert.ok(r);c=editSheetField(c,'resourceMax.'+r.id,'7',E);assert.equal(resourcesFor(c,E).find(x=>x.id===r.id)!.max,7);c=editSheetField(c,'resourceMax.'+r.id,'',E);assert.equal(resourcesFor(c,E).find(x=>x.id===r.id)!.max,r.max);
});
test('revisão mantém ID próprio da magia personalizada mesmo com nome do catálogo',()=>{
  const c=blankCharacter();c.spells=[{name:'Raio de Fogo',bookId:'custom_exemplo',customSpell:true,circle:9,classId:'guerreiro',castingAbility:'int',customRoll:'4d12+30'}];
  const p=proposeImport({format:'critcall.character-backup',version:1,exportedAt:'',characters:[c as any]},E).characters[0] as any;assert.equal(p.spells[0].bookId,'custom_exemplo');assert.equal(p.spells[0].circle,9);
});
const pdf=(values:Record<string,string>)=>({pages:[{width:612,height:792,text:''}],fields:Object.entries(values).map(([name,value],i)=>({name,value,page:1,x:0,y:i*20,width:100,height:12,checkbox:false}))});
test('PDF escrito à mão: classes sem espaços, CA restrita, dados abreviados e deslocamento fracionário',()=>{
  const data=pdf({CharacterName:'Exemplo fictício',ClassLevel:'Monge6/Guerreiro3',AC:'18 + 1',Speed:'16,5 m','Wpn Name':'Arma fictícia','Wpn1 AtkBonus':'d6/d8','Wpn1 Damage':'Versátil'}),c=pdfToBackup(data,E).characters[0] as any;
  assert.deepEqual(c.classes.map((x:any)=>[x.classId,x.level]),[['monge',6],['guerreiro',3]]);assert.equal(c.baseAcArmor,19);assert.equal(c.speed,16.5);assert.equal(c.weapons[0].damage,'1d6');assert.equal(c.weapons[0].bonus,'');data.fields.find(f=>f.name==='AC')!.value='18 + alert(1)';assert.equal((pdfToBackup(data,E).characters[0] as any).baseAcArmor,undefined);
});
test('PDF não atribui à classe uma magia que também pode vir da raça',()=>{
  const data=proposeImport(pdfToBackup(pdf({CharacterName:'Exemplo fictício',ClassLevel:'Bruxo 3','Race ':'Tiefling','Spells 1014':'Repreensão Infernal','Spells 1015':'Taumaturgia'}),E),E),c=data.characters[0] as any;assert.ok(c.spells.every((s:any)=>s.classId===''&&s.importOriginNeedsConfirmation));
});
