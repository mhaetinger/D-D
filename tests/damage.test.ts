import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyDamage,applyTypedDamage} from '../src/rules/combat';
import {damageDefenses,previewTypedDamage,typedDamageSummary,type DamagePacket} from '../src/rules/damage';
import {concentration,startConcentration} from '../src/rules/concentration';
import {deathStatus} from '../src/rules/health';
import {state} from '../src/rules/model';
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
  c.rules.raceId='halflingRobusto';assert.equal(previewTypedDamage(c,packet('poison'),E).received,21,'vantagem contra veneno não é resistência a dano');
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
