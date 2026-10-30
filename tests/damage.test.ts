import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyDamage,applyTypedDamage} from '../src/rules/combat';
import {damageDefenses,previewTypedDamage,typedDamageSummary,type DamagePacket} from '../src/rules/damage';
import {concentration,startConcentration} from '../src/rules/concentration';
import {deathStatus} from '../src/rules/health';
import {state} from '../src/rules/model';
import {hasEvasion,hasUncannyDodge} from '../src/rules/damage';
import {previewSurvival,relentlessDC,survivalOptions} from '../src/rules/survival';
import {resetResources} from '../src/rules/resources';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');
const make=(id='guerreiro',level=5,subclassId='campeao')=>{
  const c=warrior();c.classes=[{classId:id,level,subclassId}];c.armorEquipped=null;c.hpMax=100;c.hpCurrent=100;c.hpTemp=0;c.exhaustion=0;c.rules={raceId:'humano',history:[],legacy:false};return c;
};
const packet=(type='fire',amount=21,source='other'):DamagePacket=>({source,parts:[{type,amount}]} as DamagePacket);
test('resistência primeiro arredonda para baixo, vulnerabilidade depois dobra; imunidade prevalece',()=>{
  const c=make(),p=packet();p.parts[0].defense='resistance';p.parts[0].vulnerable=true;
  assert.equal(previewTypedDamage(c,p,E).received,20);
  p.parts[0].defense='immunity';assert.equal(previewTypedDamage(c,p,E).received,0);
});
test('redução adicional precede resistência/vulnerabilidade e não torna o dano negativo',()=>{
  const c=make(),p=packet('bludgeoning',25);Object.assign(p.parts[0],{reduction:5,defense:'resistance'});
  assert.equal(previewTypedDamage(c,p,E).received,10);
  p.parts[0].reduction=26;assert.equal(previewTypedDamage(c,p,E).received,0);
});
test('resistências de Fúria e Proteção contra Lâminas não se acumulam; magia não é ataque de arma',()=>{
  const c=make('barbaro'),s=state(c);s.active['barbaro:rage']=true;s.active['spell:bladeWard']=true;
  const p=packet('slashing',21,'weapon');assert.equal(previewTypedDamage(c,p,E).parts[0].resistance.length,2);assert.equal(previewTypedDamage(c,p,E).received,10);
  s.active['barbaro:rage']=false;assert.equal(previewTypedDamage(c,packet('slashing',21,'spellAttack'),E).received,21);
  assert.equal(previewTypedDamage(c,packet('slashing',21,'magicWeapon'),E).received,10);
  assert.equal(previewTypedDamage(c,packet('fire',21,'weapon'),E).received,21);
});
test('Fúria básica não protege em armadura pesada; Urso de nível 3 não é o Aspecto do nível 6',()=>{
  const c=make('barbaro',6,'totemico');state(c).active['barbaro:rage']=true;c.armorEquipped='Cota de malha';
  c.rules.history=[{classId:'barbaro',level:3,answers:{totem:'Lobo'}},{classId:'barbaro',level:6,answers:{aspect:'Urso'}}];
  assert.equal(previewTypedDamage(c,packet('slashing'),E).received,21);
  c.rules.history[0].answers.totem='Urso';assert.equal(previewTypedDamage(c,packet('fire'),E).received,10);
  assert.equal(previewTypedDamage(c,packet('psychic'),E).received,21);
});
test('resistências raciais exigem identificação da raça e ancestral; classe tem ancestral independente',()=>{
  const c=make();c.rules.raceId='tiefling';assert.equal(previewTypedDamage(c,packet(),E).received,10);
  c.rules.raceId='anaoColina';assert.equal(previewTypedDamage(c,packet('poison'),E).received,10);assert.equal(previewTypedDamage(c,packet(),E).received,21);
  c.rules.raceId='halflingRobusto';assert.equal(previewTypedDamage(c,packet('poison'),E).received,10,'Resiliência dos Robustos também concede resistência ao dano de veneno (p. 28)');
  c.rules.raceId='halflingLeve';assert.equal(previewTypedDamage(c,packet('poison'),E).received,21);
  c.rules.raceId='draconato';c.rules.history=[{classId:'guerreiro',level:1,answers:{raceDragon:'Ouro — fogo'}}];assert.equal(previewTypedDamage(c,packet(),E).received,10);
  c.classes=[{classId:'feiticeiro',level:6,subclassId:'draconica'}];c.rules.history.push({classId:'feiticeiro',level:1,answers:{dragon:'Azul — elétrico'}});state(c).active['feiticeiro:elementalAffinity']=true;
  assert.equal(previewTypedDamage(c,packet('lightning'),E).received,10);assert.equal(previewTypedDamage(c,packet(),E).received,10);
  delete c.rules.history[0].answers.raceDragon;assert.equal(previewTypedDamage(c,packet(),E).received,21);
});
test('Fúria antiga marcada a zero/inconsciente não protege; paralisia sozinha não retira a resistência',()=>{
  const c=make('barbaro');state(c).active['barbaro:rage']=true;c.hpCurrent=0;assert.equal(previewTypedDamage(c,packet('slashing'),E).received,21);
  c.hpCurrent=100;c.conscious=false;assert.equal(previewTypedDamage(c,packet('slashing'),E).received,21);
  c.conscious=true;c.ruleState.conditions={paralisado:true};assert.equal(previewTypedDamage(c,packet('slashing'),E).received,10);
});
test('petrificação resiste a todos os tipos e imuniza dano de veneno; não apaga veneno registrado',()=>{
  const c=make();state(c).conditions={petrificado:true,envenenado:true};assert.equal(previewTypedDamage(c,packet('force'),E).received,10);assert.equal(previewTypedDamage(c,packet('poison'),E).received,0);
  assert.equal(c.ruleState.conditions.envenenado,true);
});
test('Pureza Corporal e Proteção Natural respeitam nível e subclasse',()=>{
  const c=make('monge',9);assert.equal(previewTypedDamage(c,packet('poison'),E).received,21);c.classes[0].level=10;assert.equal(previewTypedDamage(c,packet('poison'),E).received,0);
  c.classes=[{classId:'druida',level:10,subclassId:'lua'}];assert.equal(previewTypedDamage(c,packet('poison'),E).received,21);c.classes[0].subclassId='terra';assert.equal(previewTypedDamage(c,packet('poison'),E).received,0);
});
test('Corpo Vazio precisa do estado e nível corretos, sem resistência a energia',()=>{
  const c=make('monge',18);assert.equal(previewTypedDamage(c,packet(),E).received,21);state(c).active['monge:emptyBody']=true;
  assert.equal(previewTypedDamage(c,packet(),E).received,10);assert.equal(previewTypedDamage(c,packet('force'),E).received,21);
  c.classes[0].level=17;assert.equal(previewTypedDamage(c,packet(),E).received,21);
});
test('Escudo de Pensamentos não resiste a outros tipos nem causa dano automático a outro personagem',()=>{
  const c=make('bruxo',10,'grandeAntigo');assert.equal(previewTypedDamage(c,packet('psychic'),E).received,10);assert.equal(previewTypedDamage(c,packet(),E).received,21);
});
test('Resistência Demoníaca escolhida não protege contra arma mágica ou de prata; outras resistências permanecem',()=>{
  const c=make('bruxo',10,'corruptor');c.rules.history=[{classId:'bruxo',level:10,answers:{fiendResistance:'Fogo'}}];
  assert.equal(previewTypedDamage(c,packet('fire',21,'weapon'),E).received,10);assert.equal(previewTypedDamage(c,packet('fire',21,'magicWeapon'),E).received,21);
  const p=packet('fire',21,'weapon');p.silvered=true;assert.equal(previewTypedDamage(c,p,E).received,21);
  c.rules.raceId='tiefling';assert.equal(previewTypedDamage(c,p,E).received,10);
  c.rules.raceId='humano';assert.equal(previewTypedDamage(c,packet('fire',21,'spell'),E).received,10);
});
test('Pedra do Transmutador exige benefício ativo e não confunde proficiência em CON com resistência a dano',()=>{
  const c=make('mago',6,'transmutacao'),s=state(c);s.active['mago:stone']=true;s.targets['mago:stone']='constitution';assert.equal(previewTypedDamage(c,packet(),E).received,21);
  s.targets['mago:stone']='fire';assert.equal(previewTypedDamage(c,packet(),E).received,10);s.active['mago:stone']=false;assert.equal(previewTypedDamage(c,packet(),E).received,21);
});
test('resistência do abjurador 14 é a dano de magia, não a toda fonte mágica',()=>{
  const c=make('mago',14,'abjuracao');assert.equal(previewTypedDamage(c,packet('fire',21,'spell'),E).received,10);assert.equal(previewTypedDamage(c,packet('fire',21,'spellAttack'),E).received,10);
  assert.equal(previewTypedDamage(c,packet('fire',21,'magicWeapon'),E).received,21);assert.equal(previewTypedDamage(c,packet('fire',21,'magic'),E).received,21);
});
test('Proteção Arcana vem antes de imunidade/resistência própria e não usa essas defesas',()=>{
  const c=make('mago',5,'abjuracao');c.rules.raceId='tiefling';state(c).pools['mago:ward']=10;
  const r=applyTypedDamage(c,packet('fire',21),E);assert.equal(r.ward,10);assert.equal(r.received,5);assert.equal(c.hpCurrent,95);assert.equal(c.ruleState.pools['mago:ward'],0);
  const immune=make('mago',5,'abjuracao');state(immune).pools['mago:ward']=10;const p=packet();p.parts[0].defense='immunity';assert.equal(applyTypedDamage(immune,p,E).ward,10);assert.equal(immune.hpCurrent,100);
});
test('ordem declarada dos tipos determina a alocação da proteção; prévia é pura',()=>{
  const c=make('mago',5,'abjuracao');c.rules.raceId='tiefling';state(c).pools['mago:ward']=10;const p:DamagePacket={source:'other',parts:[{type:'fire',amount:10},{type:'cold',amount:10}]},before=JSON.stringify(c);
  assert.equal(previewTypedDamage(c,p,E).received,10);assert.equal(JSON.stringify(c),before);p.parts.reverse();assert.equal(previewTypedDamage(c,p,E).received,5);assert.equal(JSON.stringify(c),before);
});
test('dano misto usa temporários e gera apenas um teste de concentração com a CD do total recebido',()=>{
  const c=make('mago');startConcentration(c,{name:'Efeito sintético'});c.hpTemp=40;
  const r=applyTypedDamage(c,{source:'weapon',parts:[{type:'slashing',amount:21},{type:'fire',amount:21}]},E);
  assert.deepEqual(r.absorption,{ward:0,temp:40,beast:0,hp:2,excess:0});assert.equal(concentration(c)!.checks.length,1);assert.equal(concentration(c)!.checks[0].dc,21);
});
test('imunidade/redução a zero não geram concentração ou falhas contra a morte',()=>{
  const c=make();c.hpCurrent=0;c.hpTemp=40;const p=packet();p.parts[0].defense='immunity';applyTypedDamage(c,p,E);assert.equal(deathStatus(c).failures,0);assert.equal(c.hpTemp,40);
  c.hpCurrent=100;startConcentration(c,{name:'Efeito sintético'});applyTypedDamage(c,p,E);assert.equal(concentration(c)!.checks.length,0);
});
test('a zero, dano misto crítico causa duas falhas uma única vez, inclusive quando temporários absorvem',()=>{
  const c=make();c.hpCurrent=0;c.hpTemp=40;applyTypedDamage(c,{source:'weapon',critical:true,parts:[{type:'slashing',amount:2},{type:'fire',amount:2}]},E);assert.equal(deathStatus(c).failures,2);assert.equal(c.hpTemp,36);
});
test('dano maciço considera o total após defesas; resistência pode impedir morte instantânea',()=>{
  const c=make();c.hpMax=30;c.hpCurrent=5;const p=packet('fire',40);p.parts[0].defense='resistance';applyTypedDamage(c,p,E);assert.equal(deathStatus(c).dead,false);
  const other=make();other.hpMax=30;other.hpCurrent=5;applyTypedDamage(other,packet('fire',40),E);assert.equal(deathStatus(other).dead,true);
});
test('substituição da mesa vale só para o evento; não apaga nem duplica as fontes da ficha',()=>{
  const c=make();c.rules.raceId='tiefling';const p=packet();p.parts[0].defense='normal';assert.equal(applyTypedDamage(c,p,E).received,21);assert.equal(previewTypedDamage(c,packet(),E).received,10);
  assert.deepEqual(damageDefenses(c,'fire',{source:'other'},E).resistance,['Resistência Infernal']);
});
test('origem, valores, tipos duplicados, forma e proteção ilegível são rejeitados antes de mutar',()=>{
  const c=make('mago',5,'abjuracao');state(c).pools['mago:ward']=5;
  for(const p of [{...packet(),source:'__proto__'},{...packet(),parts:[]},{...packet(),parts:[{type:'fire',amount:1},{type:'fire',amount:2}]},{...packet(),parts:[{type:'fire',amount:NaN}]},{...packet(),parts:[{type:'fire',amount:1,reduction:-1}]},{...packet(),parts:[{type:'fire',amount:1,defense:'inventado'}]},{...packet(),parts:[{type:'fire',amount:1,vulnerable:'true'}]}]){
    const before=JSON.stringify(c);assert.throws(()=>applyTypedDamage(c,p as DamagePacket,E));assert.equal(JSON.stringify(c),before);
  }
  c.ruleState.active['druida:wildShape']=true;const before=JSON.stringify(c);assert.throws(()=>applyTypedDamage(c,packet(),E),/Forma Selvagem/);assert.equal(JSON.stringify(c),before);
  c.ruleState.active['druida:wildShape']=false;c.ruleState.pools['mago:ward']='ilegível';const invalid=JSON.stringify(c);assert.throws(()=>applyTypedDamage(c,packet(),E),/preservada/);assert.equal(JSON.stringify(c),invalid);
});
test('contrato de dano já resolvido preserva retorno e não reaplica a resistência da ficha',()=>{
  const c=make();c.rules.raceId='tiefling';assert.deepEqual(applyDamage(c,21),{ward:0,temp:0,beast:0,hp:21,excess:0});assert.equal(c.hpCurrent,79);
  assert.ok(!typedDamageSummary(previewTypedDamage(c,packet(),E)).includes('<'));
});
test('Maestria em Armadura Pesada exige talento/armadura/origem; ataque misto compartilha redução 3',()=>{
  const c=make();c.rules.history=[{classId:'guerreiro',level:4,answers:{feat:'Maestria em Armadura Pesada',racialFeat:'Maestria em Armadura Pesada'}}];c.armorEquipped='Cota de malha';
  for(const source of ['weapon','attack'] as const)assert.equal(previewTypedDamage(c,packet('slashing',21,source),E).received,18);
  for(const source of ['magicWeapon','spellAttack','spell','magicAttack','other','magic'] as const)assert.equal(previewTypedDamage(c,packet('slashing',21,source),E).received,21);
  assert.equal(previewTypedDamage(c,packet('fire',21,'weapon'),E).received,21);
  const mixed:DamagePacket={source:'weapon',silvered:true,parts:[{type:'slashing',amount:2},{type:'piercing',amount:7},{type:'fire',amount:3}]};
  const plan=previewTypedDamage(c,mixed,E);assert.deepEqual(plan.parts.map(x=>x.heavyReduction),[2,1,0]);assert.equal(plan.received,9);
  c.armorEquipped='Couro';assert.equal(previewTypedDamage(c,packet('slashing',21,'weapon'),E).received,21);
});
test('Esquiva exige nível próprio ou escolha de Caçador 15; visão, reação e origem são revalidadas sem mutação',()=>{
  const c=make('ladino',4);c.classes.push({classId:'monge',level:6});assert.equal(hasUncannyDodge(c,E),false);assert.equal(hasEvasion(c,E),false);
  c.classes[0].level=5;const p=packet('fire',21,'spellAttack');p.uncannyDodge=true;
  assert.equal(previewTypedDamage(c,p,E).received,10);
  for(const condition of ['cego','incapacitado','paralisado']) {
    state(c).conditions={[condition]:true};const before=JSON.stringify(c);assert.throws(()=>applyTypedDamage(c,p,E),/Esquiva/);assert.equal(JSON.stringify(c),before);
  }
  state(c).conditions={};p.source='spell';assert.throws(()=>previewTypedDamage(c,p,E),/Esquiva/);
  c.classes=[{classId:'patrulheiro',level:15,subclassId:'cacador'}];c.rules.history=[{classId:'patrulheiro',level:7,answers:{hunter:'Evasão'}}];assert.equal(hasEvasion(c,E),false);
  c.rules.history.push({classId:'patrulheiro',level:15,answers:{hunter:'Esquiva Sobrenatural'}});assert.equal(hasUncannyDodge(c,E),true);assert.equal(hasEvasion(c,E),false);
  c.rules.history[1].answers.hunter='Evasão';assert.equal(hasEvasion(c,E),true);assert.equal(hasUncannyDodge(c,E),false);
});
test('redução/Esquiva têm ordem declarada; resistência vem depois e não se confunde com outra metade',()=>{
  const c=make('ladino',7);c.armorEquipped='Cota de malha';c.rules.history=[{classId:'ladino',level:4,answers:{feat:'Maestria em Armadura Pesada'}}];
  const p=packet('slashing',21,'weapon');p.uncannyDodge=true;p.parts[0].defense='resistance';
  assert.equal(previewTypedDamage(c,p,E).received,4);p.modifierOrder='halveFirst';assert.equal(previewTypedDamage(c,p,E).received,3);
  p.parts[0].vulnerable=true;assert.equal(previewTypedDamage(c,p,E).received,6);
  p.parts[0].defense='immunity';assert.equal(previewTypedDamage(c,p,E).received,0);
});
test('DES para metade precede proteção; Evasão respeita nível, falha automática e resistência posterior',()=>{
  const c=make('mago',5,'abjuracao');state(c).pools['mago:ward']=5;const p=packet('fire',21,'spell');p.dexteritySave='success';
  assert.equal(previewTypedDamage(c,p,E).received,5);
  c.classes.push({classId:'monge',level:7});assert.equal(previewTypedDamage(c,p,E).received,0);assert.equal(previewTypedDamage(c,p,E).ward,0);
  p.dexteritySave='failure';c.rules.raceId='tiefling';assert.equal(previewTypedDamage(c,p,E).received,2);
  state(c).conditions={paralisado:true};assert.equal(previewTypedDamage(c,p,E).received,2,'Evasão não gasta ação/reação');
  p.dexteritySave='success';assert.throws(()=>previewTypedDamage(c,p,E),/falha automática/);
  state(c).conditions={};p.source='spellAttack';assert.throws(()=>previewTypedDamage(c,p,E),/Separe/);
});
test('Esquiva em ataque misto usa um único evento de dano e um teste de concentração após temporários',()=>{
  const c=make('ladino',7);c.hpTemp=5;startConcentration(c,{name:'Efeito de teste'});
  const result=applyTypedDamage(c,{source:'spellAttack',uncannyDodge:true,parts:[{type:'fire',amount:25},{type:'cold',amount:21}]},E);
  assert.equal(result.received,22);assert.equal(c.hpTemp,0);assert.equal(c.hpCurrent,83);assert.deepEqual(concentration(c)!.checks.map(x=>[x.damage,x.dc]),[[22,11]]);
});
test('Resistência Implacável impede queda sem apagar concentração; uso só muda no envio, após temporários/proteção',()=>{
  const c=make('mago',5,'abjuracao');c.rules.raceId='meioOrc';c.hpCurrent=5;c.hpTemp=3;state(c).pools['mago:ward']=4;startConcentration(c,{name:'Efeito de teste'});
  const before=JSON.stringify(c),p=packet('fire',12),preview=previewTypedDamage(c,p,E);
  assert.equal(previewSurvival(c,preview.received,{kind:'endurance'})!.saved,true);assert.equal(JSON.stringify(c),before);
  const r=applyTypedDamage(c,p,E,{kind:'endurance'});assert.equal(c.hpCurrent,1);assert.equal(c.hpTemp,0);assert.equal(r.absorption.hp,4);assert.equal(deathStatus(c).dead,false);
  assert.equal(c.ruleState.used['race:endurance'],1);assert.equal(c.ruleState.conditions?.caido,undefined);assert.equal(concentration(c)!.checks.length,1);assert.equal(concentration(c)!.checks[0].damage,8);
  assert.equal(survivalOptions(c,5).endurance,false);resetResources(c,'short',E);assert.equal(survivalOptions(c,5).endurance,false);resetResources(c,'long',E);assert.equal(survivalOptions(c,5).endurance,true);
});
test('Fúria Implacável: sucesso preserva Fúria/Frenesi, falha encerra uma vez e cada tentativa eleva CD',()=>{
  const c=make('barbaro',11,'berserker'),s=state(c);c.hpCurrent=5;s.active['barbaro:rage']=true;s.active['barbaro:frenzy']=true;s.frenzyUsed=true;
  const success=applyTypedDamage(c,packet('fire',5),E,{kind:'rage',natural:10});assert.equal(success.survival!.saved,true);assert.equal(c.hpCurrent,1);assert.equal(s.active['barbaro:rage'],true);assert.equal(c.exhaustion,0);assert.equal(relentlessDC(c),15);
  applyDamage(c,5,{survival:{kind:'rage',natural:1}});assert.equal(c.hpCurrent,0);assert.equal(s.active['barbaro:rage'],false);assert.equal(c.exhaustion,1);assert.equal(relentlessDC(c),20);
  c.hpCurrent=20;resetResources(c,'short',E);assert.equal(relentlessDC(c),10);
});
test('teste de Fúria usa CON/proficiência e bônus, sem sucesso/falha automática por 1/20; alternativa meio-orc é explícita',()=>{
  const c=make('barbaro',11);c.rules.raceId='meioOrc';c.hpCurrent=1;const s=state(c);s.active['barbaro:rage']=true;
  assert.equal(previewSurvival(c,5,{kind:'rage',natural:1,extraBonus:20})!.saved,true);
  s.used['barbaro:relentless']=20;assert.equal(previewSurvival(c,5,{kind:'rage',natural:20})!.saved,false);
  const r=applyTypedDamage(c,packet('fire',5),E,{kind:'rage',natural:1,fallbackEndurance:true});
  assert.equal(c.hpCurrent,1);assert.equal(r.survival!.endurance,true);assert.equal(s.used['race:endurance'],1);assert.equal(s.used['barbaro:relentless'],21);assert.equal(s.active['barbaro:rage'],true);
});
test('defesas de queda rejeitam morte instantânea, zero prévio, forma e registros inválidos sem descontar reservas',()=>{
  const c=make('barbaro',11);c.rules.raceId='meioOrc';c.hpMax=20;c.hpCurrent=1;const s=state(c);s.active['barbaro:rage']=true;
  const unchanged=(f:()=>void)=>{const before=JSON.stringify(c);assert.throws(f);assert.equal(JSON.stringify(c),before);};
  unchanged(()=>applyTypedDamage(c,packet('fire',21),E,{kind:'endurance'}));
  c.hpCurrent=0;unchanged(()=>applyDamage(c,1,{survival:{kind:'rage',natural:20}}));
  c.hpCurrent=1;s.active['druida:wildShape']=true;unchanged(()=>applyDamage(c,1,{survival:{kind:'endurance'}}));s.active['druida:wildShape']=false;
  unchanged(()=>applyDamage(c,1,{survival:{kind:'rage',natural:21}}));s.used['barbaro:relentless']='ilegível';unchanged(()=>applyDamage(c,1,{survival:{kind:'rage',natural:10}}));
  s.used['barbaro:relentless']=0;s.used['race:endurance']=1;unchanged(()=>applyDamage(c,1,{survival:{kind:'rage',natural:10,fallbackEndurance:true}}));
  applyDamage(c,21);assert.equal(deathStatus(c).dead,true,'sem escolha, o contrato de morte instantânea permanece');
});
