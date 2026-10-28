import {test} from 'node:test';
import assert from 'node:assert/strict';
import {maneuverTraining,superioritySources,maneuverDC} from '../src/rules/maneuvers';
import type {DamageManeuver} from '../src/rules/maneuvers';
import {previewWeaponDamage,commitWeaponDamage,weaponDamageOptions} from '../src/rules/weapon-damage';
import {resourcesFor,remaining,resetResources,spend,refund} from '../src/rules/resources';
import {featureResourceBindings} from '../src/rules/placement';
import {parseDiceFormula} from '../src/rules/dice-formula';
import {evaluateDicePool} from '../src/rules/dice-roll';
import {beginWeaponReroll,rerollSavageAttacker,weaponRerollResult} from '../src/rules/weapon-rerolls';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');
function make(level=4,adept=false){
  const c=warrior();c.classes[0]={...c.classes[0],level,subclassId:'mestreBatalha'};c.weapons=[{name:'Rapieira'}];
  c.abilities.str.score=18;c.abilities.dex.score=16;c.hpCurrent=c.hpMax=100;
  c.rules.history=[{classId:'guerreiro',level:3,answers:{maneuvers:['Ataque Desarmante','Derrubar','Ataque de Precisão']}}];
  if(adept)c.rules.history.push({classId:'guerreiro',level:4,answers:{feat:'Adepto Marcial',featManeuvers:['Golpe Distrativo','Ataque Desarmante']}});
  c.ruleState={used:{'guerreiro:superiority':2},active:{},pools:{},targets:{}};return c;
}
const choice=(extra:any={})=>({maneuver:'disarm' as const,superiority:'guerreiro:superiority',maneuverAbility:'str' as const,noOtherManeuver:true,...extra});
function effects(level=10){
  const c=make(level,true);
  c.rules.history=[
    {classId:'guerreiro',level:3,answers:{maneuvers:['Ataque Ameaçador','Ataque de Encontrão','Ataque Provocante']}},
    {classId:'guerreiro',level:4,answers:{feat:'Adepto Marcial',featManeuvers:['Ataque de Precisão','Inspirar']}},
    {classId:'guerreiro',level:7,answers:{maneuvers:['Ataque de Manobra','Golpe Distrativo']}},
    {classId:'guerreiro',level:10,answers:{maneuvers:['Ataque Desarmante','Derrubar']}},
  ];return c;
}
const effectChoice=(maneuver:DamageManeuver,extra:any={})=>choice({maneuver,maneuverAbility:['maneuvering','distract'].includes(maneuver)?undefined:'str',...extra});
test('reservas crescem pelo nível próprio; Adepto dá d6 e Superioridade Aprimorada melhora ambos, sem mudar gastos',()=>{
  for(const [level,max,die,featDie] of [[4,4,8,6],[7,5,8,6],[10,5,10,10],[15,6,10,10],[18,6,12,12]]){
    const c=make(level,true),before=JSON.stringify(c),sources=superioritySources(c,E);
    assert.deepEqual(sources.map(s=>[s.max,s.die]),[[max,die],[1,featDie]]);
    const resources=resourcesFor(c,E);assert.equal(remaining(c,resources.find(r=>r.id==='guerreiro:superiority')!),max-2);
    assert.equal(resources.filter(r=>r.id==='feat:superiority').length,1);assert.equal(JSON.stringify(c),before);
  }
  const c=make(4,true);c.classes.push({classId:'mago',level:14});assert.equal(superioritySources(c,E)[0].die,8);
});
test('talento sem Mestre de Batalha e racial têm uma reserva; campos órfãos e ganhos futuros/removidos não concedem nada',()=>{
  const c=make(4,true);c.classes[0].subclassId='campeao';assert.deepEqual(superioritySources(c,E).map(s=>s.id),['feat:superiority']);
  assert.deepEqual(weaponDamageOptions(c,c.weapons[0],E).maneuvers.map(m=>m.id),['disarm','distract']);
  c.classes[0].level=3;assert.equal(superioritySources(c,E).length,0);c.classes=[];assert.equal(superioritySources(c,E).length,0);
  c.rules.history=[{answers:{featManeuvers:['Derrubar']}}];assert.equal(superioritySources(c,E).length,0);
  c.rules.raceId='humanoVariante';c.rules.history=[{classId:'mago',level:1,answers:{racialFeat:'Adepto Marcial',racialFeatManeuvers:['Derrubar']}}];
  assert.deepEqual(superioritySources(c,E).map(s=>[s.id,s.die]),[['feat:superiority',6]]);
  c.rules.raceId='elfo';assert.equal(superioritySources(c,E).length,0);
});
test('troca/reaprendizado de manobra conserva aquisições do talento e ignora troca futura',()=>{
  const c=make(7,true);c.rules.history.push({classId:'guerreiro',level:7,answers:{maneuversReplace:'Ataque Desarmante',maneuversReplacement:'Ataque Ameaçador'}});
  assert.ok(maneuverTraining(c,E).known.has('ataque desarmante'),'a aquisição pelo talento permanece');
  c.rules.history[1].answers.featManeuvers=['Golpe Distrativo','Inspirar'];assert.ok(!maneuverTraining(c,E).known.has('ataque desarmante'));
  c.classes[0].level=6;assert.ok(maneuverTraining(c,E).known.has('ataque desarmante'));
  c.classes[0].level=10;c.rules.history.push({classId:'guerreiro',level:10,answers:{maneuvers:['Ataque Desarmante']}});
  assert.equal(weaponDamageOptions(c,c.weapons[0],E).maneuvers.filter(m=>m.id==='disarm').length,1);
});
test('dano/CD por escolha: crítico dobra só dados; Furtivo/Destruição podem coexistir com uma manobra',()=>{
  const c=make();c.classes.push({classId:'paladino',level:2},{classId:'ladino',level:3});c.standardSlots={1:{total:1,used:0}};
  const before=JSON.stringify(c),p=previewWeaponDamage(c,c.weapons[0],choice({critical:true,sneak:'ally',smiteSlot:'slot:1'}),E);
  assert.equal(p.parts.find(p=>p.name==='Ataque Desarmante')?.formula,'2d8');assert.equal(p.parts.find(p=>p.name==='Ataque Furtivo')?.formula,'4d6');
  assert.deepEqual(parseDiceFormula(p.formula)?.counts,{8:8,6:4});assert.equal(parseDiceFormula(p.formula)?.modifier,4);
  assert.equal(p.maneuver?.dc,16);assert.match(p.maneuver!.note,/item empunhado.*aos pés/);assert.equal(JSON.stringify(c),before);
  assert.equal(maneuverDC(c,'dex'),15);
  commitWeaponDamage(c,c.weapons[0],choice({smiteSlot:'slot:1'}),E);assert.equal(c.standardSlots[1].used,1);assert.equal(c.ruleState.used['guerreiro:superiority'],3);
});
test('Derrubar aceita arco/arremesso, mostra o limite de tamanho sem negar dano a alvo maior',()=>{
  const c=make();for(const w of [{name:'Arco Longo'},{name:'Adaga',attackMode:'thrown'}]){
    c.weapons=[w];const p=previewWeaponDamage(c,w,choice({maneuver:'trip',maneuverAbility:'dex'}),E);
    assert.equal(p.parts.at(-1)?.formula,'1d8');assert.match(p.maneuver!.note,/Grande ou menor/);assert.match(p.maneuver!.note,/maiores recebem o dano adicional/);
  }
});
test('uma única origem paga o dado; reservas manuais e descansos reutilizam os mesmos registros',()=>{
  const c=make(4,true);c.rules.resourceMaxOverrides={'guerreiro:superiority':3};
  commitWeaponDamage(c,c.weapons[0],choice({superiority:'feat:superiority'}),E);
  assert.deepEqual(c.ruleState.used,{'guerreiro:superiority':2,'feat:superiority':1});
  assert.throws(()=>commitWeaponDamage(c,c.weapons[0],choice({superiority:'feat:superiority'}),E),/esgotada/);
  commitWeaponDamage(c,c.weapons[0],choice(),E);assert.equal(c.ruleState.used['guerreiro:superiority'],3);
  assert.throws(()=>commitWeaponDamage(c,c.weapons[0],choice(),E),/esgotada/);
  resetResources(c,'short',E);assert.equal(c.ruleState.used['guerreiro:superiority'],0);assert.equal(c.ruleState.used['feat:superiority'],0);
  commitWeaponDamage(c,c.weapons[0],choice(),E);resetResources(c,'long',E);assert.equal(c.ruleState.used['guerreiro:superiority'],0);
  const {gains,bindings}=featureResourceBindings(c,E);assert.equal([...bindings.values()].flat().filter(r=>r.id==='feat:superiority').length,1);
  const index=[...bindings.keys()].find(i=>bindings.get(i)!.some(r=>r.id==='feat:superiority'))!;assert.equal(gains[index].name,'Adepto Marcial');
});
test('nenhum custo parcial em erro: manobra desconhecida/múltipla, uso ilegível, fonte/arma inválida e espaço esgotado',()=>{
  const c=make(4,true);c.classes.push({classId:'paladino',level:2});c.standardSlots={1:{total:1,used:0}};
  const unchanged=(f:()=>void)=>{const before=JSON.stringify(c);assert.throws(f);assert.equal(JSON.stringify(c),before);};
  for(const extra of [{maneuver:['disarm','trip']},{maneuver:'precision'},{noOtherManeuver:false},{maneuverAbility:'cha'},{superiority:'__proto__'}])unchanged(()=>commitWeaponDamage(c,c.weapons[0],choice({...extra,smiteSlot:'slot:1'}),E));
  for(const used of [-1,0.5,'1',NaN,8]){
    c.ruleState.used['guerreiro:superiority']=used;unchanged(()=>commitWeaponDamage(c,c.weapons[0],choice({smiteSlot:'slot:1'}),E));
    if(used!==8){const r=resourcesFor(c,E).find(r=>r.id==='guerreiro:superiority')!;unchanged(()=>spend(c,r));unchanged(()=>refund(c,r));}
  }
  c.ruleState.used['guerreiro:superiority']=0;c.standardSlots[1].used=1;unchanged(()=>commitWeaponDamage(c,c.weapons[0],choice({smiteSlot:'slot:1'}),E));
  c.weapons[0]={name:'Rapieira',calculationMode:'manual',damage:'1d8+4'};unchanged(()=>commitWeaponDamage(c,c.weapons[0],choice(),E));
  c.weapons[0]={name:'Rede'};unchanged(()=>commitWeaponDamage(c,c.weapons[0],choice(),E));
  c.weapons[0]={name:'Rapieira'};c.hpCurrent=0;unchanged(()=>commitWeaponDamage(c,c.weapons[0],choice(),E));
});
test('repetição da arma mantém faces da manobra, mesmo com dados do mesmo tamanho e no crítico',()=>{
  const c=make(),p=previewWeaponDamage(c,c.weapons[0],choice({critical:true}),E),parsed=parseDiceFormula(p.formula)!;
  const result=evaluateDicePool(parsed.counts,parsed.modifier,'normal',{},()=>1);
  const roll=beginWeaponReroll(p,result,{savage:true,greatWeapon:false}),next=weaponRerollResult(rerollSavageAttacker(roll,true,()=>8));
  assert.equal(roll.count,2);assert.deepEqual(next.groups[0].faces,[8,8,1,1]);assert.equal(next.total,22);assert.equal(c.ruleState.used['guerreiro:superiority'],2);
});
test('Ameaçador/Provocante testam SAB do alvo, Encontrão testa FOR; a CD usa FOR/DES do atacante',()=>{
  const c=effects();c.abilities.wis.score=8;const before=JSON.stringify(c);
  for(const id of ['menace','push','goad'] as const)for(const key of ['str','dex'] as const){
    const p=previewWeaponDamage(c,c.weapons[0],effectChoice(id,{maneuverAbility:key}),E);
    assert.equal(p.maneuver?.save,id==='push'?'str':'wis');assert.equal(p.maneuver?.ability,key);
    assert.equal(p.maneuver?.dc,key==='str'?16:15);
    assert.match(p.maneuver!.note,id==='push'?/Resistência de FOR/:/Resistência de SAB/);
    assert.throws(()=>commitWeaponDamage(c,c.weapons[0],effectChoice(id,{maneuverAbility:undefined}),E),/FOR ou DES/);
  }
  assert.equal(JSON.stringify(c),before);
});
test('Manobra/Distrativo não pedem CD nem habilidade e não aceitam uma falsa resistência',()=>{
  const c=effects();for(const id of ['maneuvering','distract'] as const){
    const before=JSON.stringify(c),p=previewWeaponDamage(c,c.weapons[0],effectChoice(id),E);
    assert.equal(p.maneuver?.save,null);assert.equal(p.maneuver?.dc,null);assert.equal(p.maneuver?.ability,null);
    assert.match(p.maneuver!.note,/Sem teste de resistência/);assert.doesNotMatch(p.maneuver!.note,/\bCD\b/);
    for(const key of ['str','dex','wis',null])assert.throws(()=>commitWeaponDamage(c,c.weapons[0],effectChoice(id,{maneuverAbility:key}),E),/não pede teste/);
    assert.equal(JSON.stringify(c),before);
    commitWeaponDamage(c,c.weapons[0],effectChoice(id),E);assert.equal(c.ruleState.used['guerreiro:superiority'],id==='maneuvering'?3:4);
  }
});
test('cinco manobras novas respeitam aquisição vigente, substituição, arma/arremesso e Adepto independente',()=>{
  const c=effects(6);assert.deepEqual(weaponDamageOptions(c,c.weapons[0],E).maneuvers.map(m=>m.id),['menace','push','goad']);
  c.classes[0].level=10;
  for(const w of [{name:'Arco Longo'},{name:'Adaga',attackMode:'thrown'}]){
    c.weapons=[w];for(const id of ['menace','push','goad','maneuvering','distract'] as const)assert.ok(previewWeaponDamage(c,w,effectChoice(id),E).maneuver);
  }
  c.rules.history.push({classId:'guerreiro',level:10,answers:{maneuversReplace:'Ataque Ameaçador',maneuversReplacement:'Inspirar'}});
  assert.throws(()=>previewWeaponDamage(c,c.weapons[0],effectChoice('menace'),E),/conhecida/);
  c.classes[0].subclassId='campeao';c.rules.history[1].answers.featManeuvers=['Ataque Ameaçador','Golpe Distrativo'];
  assert.deepEqual(weaponDamageOptions(c,c.weapons[0],E).maneuvers.map(m=>m.id),['menace','distract']);
  const p=commitWeaponDamage(c,c.weapons[0],effectChoice('distract',{superiority:'feat:superiority'}),E);
  assert.equal(p.maneuver?.source.die,6);assert.equal(c.ruleState.used['feat:superiority'],1);
  for(const w of [{name:'Adaga',calculationMode:'manual',damage:'1d4+3'},{name:'Rede'}]){
    c.weapons=[w];assert.equal(weaponDamageOptions(c,w,E).maneuvers.length,0);
  }
});
test('cada efeito preserva o alcance da regra: duração, tamanho, uma reação e só o próximo ataque de outra criatura',()=>{
  const c=effects(),note=(id:DamageManeuver)=>previewWeaponDamage(c,c.weapons[0],effectChoice(id),E).maneuver!.note;
  assert.match(note('menace'),/amedrontado por você até o fim do seu próximo turno/);
  assert.match(note('goad'),/desvantagem.*criaturas diferentes de você até o fim do seu próximo turno/);
  assert.match(note('push'),/Grande ou menor.*4,5 m para longe.*maiores recebem o dano adicional/);
  assert.match(note('maneuvering'),/aliado.*ver ou ouvir.*própria reação.*metade do deslocamento.*do alvo atingido.*Outras criaturas/);
  assert.match(note('distract'),/próxima jogada.*outra criatura.*vantagem.*antes do começo do seu próximo turno/);
  assert.match(note('distract'),/Não beneficia um ataque seu nem todos os ataques/);
});
test('novas manobras dobram só dados no crítico, pagam uma vez e suas faces ficam fora da repetição da arma',()=>{
  for(const id of ['menace','push','goad','maneuvering','distract'] as const)for(const level of [4,10,18])for(const source of ['guerreiro:superiority','feat:superiority']){
    const c=effects(level);c.rules.history[1].answers.featManeuvers=['Ataque de Manobra','Golpe Distrativo'];
    const before=JSON.stringify(c),p=previewWeaponDamage(c,c.weapons[0],effectChoice(id,{critical:true,superiority:source}),E);
    const die=source==='feat:superiority'&&level===4?6:level===4?8:level===10?10:12;
    assert.equal(p.parts.at(-1)?.formula,`2d${die}`);const parsed=parseDiceFormula(p.formula)!;assert.equal(parsed.modifier,4);
    const result=evaluateDicePool(parsed.counts,parsed.modifier,'normal',{},()=>1);
    const roll=beginWeaponReroll(p,result,{savage:true,greatWeapon:false}),next=weaponRerollResult(rerollSavageAttacker(roll,true,()=>8));
    assert.equal(roll.count,2);assert.equal(next.total,22);assert.equal(JSON.stringify(c),before);
    commitWeaponDamage(c,c.weapons[0],effectChoice(id,{critical:true,superiority:source}),E);
    assert.equal(c.ruleState.used[source],source==='feat:superiority'?1:3);
    assert.equal(c.ruleState.used[source==='feat:superiority'?'guerreiro:superiority':'feat:superiority'],source==='feat:superiority'?2:undefined);
  }
});
