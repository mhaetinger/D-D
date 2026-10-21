import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseDiceFormula} from '../src/rules/dice-formula';
import {commitWeaponDamage,previewWeaponDamage,smiteSlots,weaponDamageOptions} from '../src/rules/weapon-damage';
import {startConcentration,concentration} from '../src/rules/concentration';
import {state} from '../src/rules/model';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');
function make(id='paladino',level=11,name='Rapieira') {
  const c=warrior();c.classes=[{classId:id,level,subclassId:id==='paladino'?'devocao':'ladrao',subclass:''}];
  c.rules={raceId:'humano',history:[]};c.armorEquipped=null;c.hpCurrent=100;c.hpMax=100;c.hpTemp=0;
  c.abilities.str.score=18;c.abilities.dex.score=16;c.weapons=[{name}];c.standardSlots={1:{total:2,used:0},4:{total:1,used:0}};return c;
}
const preview=(c:any,choice:any={})=>previewWeaponDamage(c,c.weapons[0],choice,E);
test('o analisador compartilhado preserva fórmulas e rejeita execução, dados negativos e limites antes da rolagem',()=>{
  assert.deepEqual(parseDiceFormula(' d8 + 2d6 - 3 + 1 '),{formula:'1d8+2d6-3+1',counts:{8:1,6:2},modifier:-2});
  for(const f of ['1d8-1d6','101d6','1d3','1d8+10001','1d8+10000+1','alert(1)','1d6;globalThis.secret','-1d6'])assert.equal(parseDiceFormula(f),null);
  assert.equal(parseDiceFormula('100d6-10000')?.modifier,-10000);
});
test('crítico dobra dados da arma e Aprimorada uma vez; bônus, Fúria, magia e ajustes permanecem fixos',()=>{
  const c=make();c.weapons[0].magicBonus=2;c.weapons[0].damageAdjustment=-1;
  const p=preview(c,{critical:true});assert.deepEqual(parseDiceFormula(p.formula)?.counts,{8:4});assert.equal(parseDiceFormula(p.formula)?.modifier,5);
  assert.deepEqual(p.parts.map(p=>[p.name,p.type,p.formula]),[['Arma','perfurante','2d8+5'],['Destruição Divina Aprimorada','radiante','2d8']]);
  const b=make('barbaro',8,'Machado grande');state(b).active['barbaro:rage']=true;b.weapons[0].offHand=true;
  assert.equal(parseDiceFormula(preview(b,{critical:true}).formula)?.modifier,2,'mão secundária retira FOR positiva, mas mantém Fúria');
});
test('Crítico Brutal/ataque selvagem acrescentam dados individuais depois da duplicação, por nível próprio e só corpo a corpo',()=>{
  for(const [level,extra] of [[8,0],[9,1],[13,2],[17,3]]) {
    const c=make('barbaro',level,'Espada Grande');c.rules.raceId='meioOrc';
    assert.equal(parseDiceFormula(preview(c,{critical:true}).formula)?.counts[6],4+extra+1);
    assert.equal(parseDiceFormula(preview(c).formula)?.counts[6],2);
  }
  const c=make('barbaro',17,'Machadinha');c.rules.raceId='meioOrc';c.weapons[0].attackMode='thrown';
  assert.equal(parseDiceFormula(preview(c,{critical:true}).formula)?.counts[6],2);
});
test('Furtivo usa nível de ladino e propriedade da arma, inclusive arremesso de adaga, sem inferir acuidade pela DES de monge',()=>{
  const c=make('ladino',3);c.classes.push({classId:'paladino',level:11});
  const p=preview(c,{critical:true,sneak:'ally'});assert.equal(p.parts.find(x=>x.name==='Ataque Furtivo')?.formula,'4d6');
  c.weapons[0]={name:'Adaga',attackMode:'thrown'};assert.equal(weaponDamageOptions(c,c.weapons[0],E).sneak,true);assert.equal(weaponDamageOptions(c,c.weapons[0],E).smite,false);
  c.weapons[0]={name:'Machadinha',attackMode:'thrown'};assert.throws(()=>preview(c,{sneak:'advantage'}),/não permite/);
  c.classes=[{classId:'ladino',level:3},{classId:'monge',level:7}];c.weapons[0]={name:'Bordão'};assert.throws(()=>preview(c,{sneak:'ally'}),/não permite/);
});
test('Destruição usa um espaço de Conjuração/Pacto; teto 5d8 mais alvo 1d8 e crítico dobrando ambos',()=>{
  const c=make();c.standardSlots[9]={total:1,used:0};c.classes.push({classId:'bruxo',level:2});c.pactMagic={level:1,total:2,used:0};
  const before=JSON.stringify(c),p=preview(c,{critical:true,smiteSlot:'slot:9',smiteFavored:true});
  assert.equal(p.parts.find(x=>x.name==='Destruição Divina')?.formula,'12d8');assert.equal(JSON.stringify(c),before);
  commitWeaponDamage(c,c.weapons[0],{smiteSlot:'pact'},E);assert.equal(c.pactMagic.used,1);assert.equal(c.standardSlots[1].used,0);
  commitWeaponDamage(c,c.weapons[0],{smiteSlot:'slot:9'},E);assert.equal(c.standardSlots[9].used,1);assert.throws(()=>preview(c,{smiteSlot:'slot:9'}),/indisponível/);
  assert.equal(smiteSlots(c).find(x=>x.value==='slot:9')?.remaining,0);
});
test('Destruição não dispara conjuração, não quebra concentração nem cria proteção; continua possível em Fúria',()=>{
  const c=make();c.classes.push({classId:'mago',level:2,subclassId:'abjuracao'});state(c).pools['mago:ward']=0;
  startConcentration(c,{name:'Efeito de teste'});const id=concentration(c)!.id;commitWeaponDamage(c,c.weapons[0],{smiteSlot:'slot:1'},E);
  assert.equal(concentration(c)!.id,id);assert.equal(c.ruleState.pools['mago:ward'],0);
  c.classes.push({classId:'barbaro',level:1});state(c).active['barbaro:rage']=true;commitWeaponDamage(c,c.weapons[0],{smiteSlot:'slot:1'},E);assert.equal(c.standardSlots[1].used,2);
});
test('Colossos exige Caçador e escolha do nível 3, sem transformar escolhas homônimas posteriores em benefícios',()=>{
  const c=make('patrulheiro',7);c.classes[0].subclassId='cacador';c.rules.history=[{classId:'patrulheiro',level:7,answers:{hunter:'Assassino de Colossos'}}];
  assert.throws(()=>preview(c,{colossus:true}),/não permite/);c.rules.history[0].level=3;
  assert.equal(preview(c,{critical:true,colossus:true}).parts.find(x=>x.name==='Assassino de Colossos')?.formula,'2d8');
});
test('ataques manuais preservam cadastro, duplicam só dados no crítico e não recebem adicionais automáticos',()=>{
  const c=make();c.rules.raceId='meioOrc';c.weapons[0]={name:'Rapieira',calculationMode:'manual',damage:'2d6+1d4-3',bonus:'+7'};
  const before=JSON.stringify(c),p=preview(c,{critical:true});assert.deepEqual(parseDiceFormula(p.formula)?.counts,{6:4,4:2});assert.equal(parseDiceFormula(p.formula)?.modifier,-3);assert.equal(p.parts.length,1);assert.equal(JSON.stringify(c),before);
  assert.throws(()=>preview(c,{smiteSlot:'slot:1'}),/não permite/);
  c.weapons[0].damage='0-3';assert.equal(preview(c,{critical:true}).formula,'0-3');
});
test('entrada inválida, espaço esgotado/ilegível, arma trocada, rede, forma e incapacitação não gastam recursos',()=>{
  const c=make(),unchanged=(f:()=>void)=>{const before=JSON.stringify(c);assert.throws(f);assert.equal(JSON.stringify(c),before);};
  unchanged(()=>commitWeaponDamage(c,c.weapons[0],{smiteSlot:'__proto__'},E));unchanged(()=>preview(c,{smiteFavored:true}));unchanged(()=>preview(c,{critical:'sim'}));
  c.standardSlots[1].used=-1;unchanged(()=>commitWeaponDamage(c,c.weapons[0],{smiteSlot:'slot:1'},E));c.standardSlots[1].used=2;unchanged(()=>preview(c,{smiteSlot:'slot:1'}));
  c.weapons[0]={name:'Arma manual',calculationMode:'manual',damage:'51d6+2'};unchanged(()=>preview(c,{critical:true}));
  const old=c.weapons[0];c.weapons[0]={name:'Rede'};unchanged(()=>preview(c));unchanged(()=>previewWeaponDamage(c,old,{},E));
  c.weapons[0]={name:'Adaga'};state(c).active['druida:wildShape']=true;unchanged(()=>preview(c));c.ruleState.active['druida:wildShape']=false;c.hpCurrent=0;unchanged(()=>preview(c));
});
