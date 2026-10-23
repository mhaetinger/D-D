import {test} from 'node:test';
import assert from 'node:assert/strict';
import {weaponPowerAttack,weaponPowerAttackOption} from '../src/rules/weapon-power-attack';
import {weaponStats} from '../src/rules/combat';
import {commitWeaponDamage,previewWeaponDamage} from '../src/rules/weapon-damage';
import {parseDiceFormula} from '../src/rules/dice-formula';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');
const make=(name='Espada Grande')=>{const c=warrior();c.classes[0].level=6;c.abilities.str.score=18;c.abilities.dex.score=16;c.hpMax=40;c.hpCurrent=31;c.rules.history.push({classId:'guerreiro',level:4,answers:{feat:['Mestre de Armas Grandes','Atirador Aguçado']}});c.weapons=[{name}];return c;};
const preview=(c:any,choice:any={powerAttack:true})=>previewWeaponDamage(c,c.weapons[0],choice,E);

test('–5/+10: armas elegíveis de 2014, sem confundir pesada à distância ou versátil com pesada',()=>{
 for(const [name,feat] of [['Espada Grande','Mestre de Armas Grandes'],['Machado grande','Mestre de Armas Grandes'],['Alabarda','Mestre de Armas Grandes'],['Arco longo','Atirador Aguçado'],['Arco curto','Atirador Aguçado'],['Dardo','Atirador Aguçado'],['Funda','Atirador Aguçado'],['Besta pesada','Atirador Aguçado'],['Zarabatana','Atirador Aguçado']] as const){const c=make(name);assert.equal(weaponPowerAttackOption(c,c.weapons[0],E)?.name,feat,name);}
 for(const name of ['Espada longa','Bordão','Rapieira','Machadinha','Rede']){const c=make(name);c.weapons[0].hands=2;assert.equal(weaponPowerAttackOption(c,c.weapons[0],E),null,name);}
 const c=make('Besta pesada');c.rules.history.at(-1).answers.feat=['Mestre de Armas Grandes'];assert.equal(weaponPowerAttackOption(c,c.weapons[0],E),null,'pesada não transforma a besta em ataque corpo a corpo');
});
test('–5/+10: arremesso mantém categoria; Dardo é arma à distância, Adaga/Azagaia não',()=>{
 for(const name of ['Adaga','Azagaia','Machadinha']){const c=make(name);c.weapons[0].attackMode='thrown';assert.equal(weaponPowerAttackOption(c,c.weapons[0],E),null);}
 const c=make('Dardo');c.weapons[0].attackMode='thrown';assert.equal(weaponPowerAttackOption(c,c.weapons[0],E)?.name,'Atirador Aguçado');
 const heavy=make();heavy.weapons[0].attackMode='thrown';assert.equal(weaponPowerAttackOption(heavy,heavy.weapons[0],E),null,'arremesso improvisado de arma pesada não recebe o talento');
});
test('Dardo com acuidade escolhe FOR ou DES no cálculo automático, preservando escolha explícita',()=>{
 const c=make('Dardo');let w=weaponStats(c,c.weapons[0],E);assert.equal(w.ability,'str');assert.equal(w.bonus,'+9','FOR +4, proficiência +3 e Arquearia +2');assert.equal(parseDiceFormula(preview(c).formula)?.modifier,14);
 c.abilities.dex.score=20;w=weaponStats(c,c.weapons[0],E);assert.equal(w.ability,'dex');assert.equal(w.bonus,'+10');
 c.weapons[0].abilityOverride='str';w=weaponStats(c,c.weapons[0],E);assert.equal(w.ability,'str');assert.equal(w.bonus,'+9');c.weapons[0]={name:'Arco longo'};c.abilities.str.score=22;c.abilities.dex.score=8;assert.equal(weaponStats(c,c.weapons[0],E).ability,'dex','arco sem acuidade continua usando DES');
});
test('–5/+10: exige talento estruturado e proficiência, incluindo escolha racial e treino do elfo',()=>{
 const c=make('Arco longo');c.weapons[0].proficient=false;assert.equal(weaponPowerAttackOption(c,c.weapons[0],E),null);delete c.weapons[0].proficient;
 c.classes=[{classId:'mago',level:6}];c.proficiencies.weapons='';c.rules.history=[];c.rules.history.push({classId:'mago',level:1,answers:{racialFeat:'Atirador Aguçado'}});assert.equal(weaponPowerAttackOption(c,c.weapons[0],E),null);
 c.rules.raceId='altoElfo';assert.equal(weaponPowerAttackOption(c,c.weapons[0],E)?.name,'Atirador Aguçado');
 c.rules.history=[];c.notes='Atirador Aguçado';assert.equal(weaponPowerAttackOption(c,c.weapons[0],E),null,'prosa não concede talento');
});
test('–5/+10: prévia pura, escolha opcional e bônus fixo uma única vez em crítico',()=>{
 const c=make(),before=structuredClone(c),base=weaponStats(c,c.weapons[0],E);
 assert.deepEqual(weaponPowerAttack(c,c.weapons[0],true,E),{name:'Mestre de Armas Grandes',type:'cortante',attack:-5,damage:10});
 assert.equal(weaponPowerAttack(c,c.weapons[0],false,E),null);assert.equal(base.bonus,'+7');
 const normal=preview(c),critical=preview(c,{powerAttack:true,critical:true});
 assert.equal(parseDiceFormula(normal.formula)?.modifier,14);assert.equal(parseDiceFormula(critical.formula)?.modifier,14);assert.deepEqual(parseDiceFormula(normal.formula)?.counts,{6:2});assert.deepEqual(parseDiceFormula(critical.formula)?.counts,{6:4});
 assert.equal(critical.parts.filter(p=>p.name==='Mestre de Armas Grandes').length,1);assert.equal(critical.parts.at(-1)?.formula,'10');assert.equal(parseDiceFormula(preview(c,{}).formula)?.modifier,4);assert.deepEqual(c,before);
});
test('–5/+10: magia, ajustes, Fúria e crítico brutal continuam com seus próprios valores',()=>{
 const c=make('Machado grande');c.classes=[{classId:'barbaro',level:13}];c.rules.history.at(-1).classId='barbaro';c.rules.raceId='meioOrc';c.ruleState={active:{'barbaro:rage':true}};c.armorEquipped=null;c.weapons[0].magicBonus=2;c.weapons[0].attackAdjustment=-1;c.weapons[0].damageAdjustment=1;
 const w=weaponStats(c,c.weapons[0],E),power=weaponPowerAttack(c,c.weapons[0],true,E)!;assert.equal(Number(w.bonus)+power.attack,5);const p=preview(c,{powerAttack:true,critical:true});assert.deepEqual(parseDiceFormula(p.formula)?.counts,{12:5});assert.equal(parseDiceFormula(p.formula)?.modifier,20);assert.equal(p.parts.find(p=>p.name==='Mestre de Armas Grandes')?.type,'cortante');c.armorEquipped='Cota de malha';assert.equal(parseDiceFormula(preview(c).formula)?.modifier,17,'armadura pesada impede o bônus de Fúria');
});
test('–5/+10 com Destruição: +10 é da arma; dados radiantes e espaço não duplicam o bônus',()=>{
 const c=make();c.classes=[{classId:'paladino',level:11}];c.rules.history.at(-1).classId='paladino';c.standardSlots={1:{total:2,used:0}};c.ruleState={concentration:{name:'Efeito preservado'}};const before=structuredClone(c);
 const p=preview(c,{powerAttack:true,critical:true,smiteSlot:'slot:1'});assert.deepEqual(parseDiceFormula(p.formula)?.counts,{6:4,8:6});assert.equal(parseDiceFormula(p.formula)?.modifier,14);assert.equal(p.parts.find(p=>p.name==='Mestre de Armas Grandes')?.type,'cortante');assert.equal(p.parts.find(p=>p.name==='Destruição Divina')?.formula,'4d8');assert.deepEqual(c,before);
 commitWeaponDamage(c,c.weapons[0],{powerAttack:true,critical:true,smiteSlot:'slot:1'},E);assert.equal(c.standardSlots[1].used,1);assert.equal(c.hpCurrent,31);assert.deepEqual(c.ruleState.concentration,before.ruleState.concentration);
});
test('–5/+10: não aplica em valores manuais, ataques próprios, Forma Selvagem ou arma removida',()=>{
 const c=make();c.weapons[0].calculationMode='manual';c.weapons[0].bonus='+2';c.weapons[0].damage='2d6+14';let before=structuredClone(c);assert.throws(()=>preview(c),/não permitem/);assert.deepEqual(c,before);assert.equal(preview(c,{}).formula,'2d6+14');
 c.weapons[0]={name:'Sopro personalizado',damage:'2d6',bonus:''};assert.equal(weaponPowerAttackOption(c,c.weapons[0],E),null);
 c.weapons[0]={name:'Espada Grande'};c.ruleState={active:{'druida:wildShape':true}};assert.equal(weaponPowerAttackOption(c,c.weapons[0],E),null);c.ruleState.active['druida:wildShape']=false;assert.equal(weaponPowerAttackOption(c,{...c.weapons[0]},E),null);
});
test('–5/+10: inválidos e perda de proficiência/talento não gastam espaços nem alteram dados',()=>{
 const c=make();c.classes.push({classId:'paladino',level:2});c.standardSlots={1:{total:2,used:0}};
 for(const powerAttack of ['sim',1,null]){const before=structuredClone(c);assert.throws(()=>preview(c,{powerAttack,smiteSlot:'slot:1'}));assert.deepEqual(c,before);}
 for(const change of [(c:any)=>{c.weapons[0].proficient=false;},(c:any)=>{c.rules.history=[];}]){const d=structuredClone(c);change(d);const before=structuredClone(d);assert.throws(()=>commitWeaponDamage(d,d.weapons[0],{powerAttack:true,smiteSlot:'slot:1'},E));assert.deepEqual(d,before);}
});
test('–5/+10: dano fixo da zarabatana não vira dado nem multiplica dez no crítico',()=>{
 const c=make('Zarabatana'),random=Math.random;
 try{Math.random=()=>{throw new Error('RNG indevido');};for(const critical of [false,true]){const p=preview(c,{powerAttack:true,critical});assert.deepEqual(parseDiceFormula(p.formula)?.counts,{});assert.equal(parseDiceFormula(p.formula)?.modifier,14);assert.equal(p.powerAttack?.name,'Atirador Aguçado');}}finally{Math.random=random;}
});
