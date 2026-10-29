import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initiativeTraits,initiativeRollDetails,initiativeRollDescription} from '../src/rules/initiative-mode';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');
function make(id='barbaro',level=7){
  const c=warrior();c.classes=[{classId:id,level,subclassId:'',subclass:''}];c.rules={raceId:'humano',history:[]};
  c.armorEquipped='';c.shieldEquipped=false;delete c.armorProficiencies;
  c.ruleState={version:1,used:{},active:{},pools:{},conditions:{},targets:{}};return c;
}
test('Instinto Selvagem usa nível próprio 7, independe de Fúria, armadura e subclasse',()=>{
  const c=make();assert.equal(initiativeRollDetails(c,'normal',E).mode,'adv');
  c.classes[0].level=6;c.classes.push({classId:'guerreiro',level:14});assert.equal(initiativeRollDetails(c,'normal',E).mode,'normal');
  c.classes[0].level=7;c.classes[0].subclassId='berserker';c.ruleState.active['barbaro:rage']=true;
  c.armorEquipped='Cota de malha';c.armorProficiencies=['pesada'];assert.equal(initiativeRollDetails(c,'normal',E).mode,'adv');
  assert.match(initiativeTraits(c,E).notes.join(' '),/não estar incapacitado.*Fúria/);
});
test('Explorador Natural pertence ao Patrulheiro Revisado 1 de qualquer subclasse, sem exigir terreno escolhido',()=>{
  for(const subclassId of ['','cacador','besta','subterraneo']){
    const c=make('patrulheiro',1);c.classes[0].subclassId=subclassId;
    assert.equal(initiativeRollDetails(c,'normal',E).mode,'adv');assert.match(initiativeTraits(c,E).advantage.join(' '),/Patrulheiro Revisado/);
    assert.match(initiativeTraits(c,E).notes.join(' '),/alvo ainda não ter agido/);
    c.classes[0].level=0;assert.equal(initiativeRollDetails(c,'normal',E).mode,'normal');
  }
});
test('todas as fontes cancelam uma só vez, incluindo classe, modo informado e inspiração',()=>{
  const c=make();c.classes.push({classId:'patrulheiro',level:1});c.heroicInspiration=true;c.ruleState.inspirationReady=true;
  for(const selected of ['normal','adv','dis'] as const)for(const poisoned of [false,true])for(const inspired of [false,true]){
    c.ruleState.conditions.envenenado=poisoned;c.ruleState.inspirationReady=inspired;
    const p=initiativeRollDetails(c,selected,E),dis=selected==='dis'||poisoned;
    assert.equal(p.mode,dis?'normal':'adv');assert.equal(p.inspired,inspired);assert.equal(p.advantage.includes('Inspiração preparada'),inspired);
    if(dis)assert.match(initiativeRollDescription(p),/se anulam: 1d20/);
  }
  c.classes=[];c.ruleState.conditions={};c.ruleState.inspirationReady=true;
  assert.equal(initiativeRollDetails(c,'dis',E).mode,'normal');c.heroicInspiration=false;
  assert.equal(initiativeRollDetails(c,'dis',E).mode,'dis');
});
test('exaustão e veneno impõem desvantagem no teste de DES, nunca d20 adicionais acumulados',()=>{
  const c=make('guerreiro',1);
  for(let n=0;n<=6;n++){c.exhaustion=n;assert.equal(initiativeRollDetails(c,'normal',E).mode,n?'dis':'normal');}
  c.ruleState.conditions.envenenado=true;assert.equal(initiativeRollDetails(c,'normal',E).disadvantage.length,2);
  assert.equal(initiativeRollDetails(c,'adv',E).mode,'normal');
});
test('armadura e escudo consultam proficiências vigentes, incluindo escolhas manuais e multiclasse',()=>{
  const c=make('mago',1);c.armorEquipped='Cota de malha';
  assert.deepEqual(initiativeTraits(c,E).disadvantage,['Armadura sem proficiência']);
  c.shieldEquipped=true;assert.equal(initiativeTraits(c,E).disadvantage.length,2);
  c.armorProficiencies=['pesada','escudo'];assert.equal(initiativeRollDetails(c,'normal',E).mode,'normal');
  c.armorProficiencies=[];assert.equal(initiativeRollDetails(c,'normal',E).mode,'dis');
  delete c.armorProficiencies;c.armorEquipped='Couro';c.classes.push({classId:'guerreiro',level:1});
  assert.equal(initiativeRollDetails(c,'normal',E).mode,'normal');
  c.armorEquipped='Cota de malha';assert.equal(initiativeRollDetails(c,'normal',E).mode,'dis','guerreiro secundário não concede armadura pesada');
});
test('medo exige visibilidade informada; caído, cego e impedido não inventam desvantagem de iniciativa',()=>{
  const c=make('guerreiro',1);c.ruleState.conditions={amedrontado:true,impedido:true,cego:true,caido:true};
  const p=initiativeRollDetails(c,'normal',E);assert.equal(p.mode,'normal');assert.match(p.notes.join(' '),/fonte do medo estiver à vista/);
  assert.equal(initiativeRollDetails(c,'dis',E).mode,'dis');
});
test('Forma Selvagem preserva benefícios de classe sem presumir equipamento incorporado; sua DES continua conferida na mesa',()=>{
  const c=make();c.classes.push({classId:'druida',level:2});c.ruleState.active['druida:wildShape']=true;
  c.armorEquipped='Cota de malha';c.shieldEquipped=true;c.armorProficiencies=[];
  const p=initiativeRollDetails(c,'normal',E);assert.equal(p.mode,'adv');assert.match(p.notes.join(' '),/DES e equipamento/);
  assert.equal(initiativeRollDetails(c,'dis',E).mode,'normal');
});
test('consulta não altera estado, máximos, bônus, Fúria, inspiração ou histórico e não usa RNG',()=>{
  const c=make();c.heroicInspiration=true;c.ruleState.inspirationReady=true;
  const before=structuredClone(c),random=Math.random;Math.random=()=>{throw Error('Sem RNG');};
  try{assert.equal(initiativeRollDetails(c,'normal',E).mode,'adv');initiativeTraits(c,E);assert.deepEqual(c,before);}
  finally{Math.random=random;}
});
test('orientação física exclui inspiração que não foi gasta e descreve quantidade/escolha sem alterar dados',()=>{
  const c=make('guerreiro',1);c.heroicInspiration=true;c.ruleState.inspirationReady=true;
  assert.match(initiativeRollDescription(initiativeRollDetails(c,'normal',E,false)),/^1d20/);
  assert.match(initiativeRollDescription(initiativeRollDetails(c,'adv',E,false)),/2d20, use o maior/);
  assert.match(initiativeRollDescription(initiativeRollDetails(c,'dis',E,false)),/2d20, use o menor/);
  assert.equal(c.ruleState.inspirationReady,true);assert.equal(c.heroicInspiration,true);
});
