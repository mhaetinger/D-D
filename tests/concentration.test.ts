import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyDamage,changePermanentAbility,concentrationSaveDetails,movementWithEffects,savingThrow} from '../src/rules/combat';
import {applyCastConcentration,concentration,concentrationBlock,endConcentration,focusedConjuration,incapacityReason,needsConcentrationConfirmation,queueConcentrationDamage,resolveConcentration,startConcentration} from '../src/rules/concentration';
import {automaticSaveFailure,conditionSpeed,derivedCondition,hasCondition,setCondition} from '../src/rules/conditions';
import {deathStatus,healHitPoints} from '../src/rules/health';
import {concentrationControls} from '../src/rules/concentration-ui';
import {canCastNormally} from '../src/rules/spellcasting';
import {resourcesFor,toggleResource,useResource} from '../src/rules/resources';
import {takeRest} from '../src/rules/rest';
const E=require('../public/rules/character-engine');
const {warrior}=require('./fixture.cjs');
const make=(id='mago',n=5,sub='abjuracao')=>{const c=warrior();c.classes=[{classId:id,level:n,hitDie:E.data.classes[id].die,hitDiceUsed:0,subclassId:sub,subclass:E.data.classes[id].subclasses[sub]?.name || ''}];c.hpMax=500;c.hpCurrent=400;c.hpTemp=0;c.exhaustion=0;c.rules={history:[],raceId:'humano',legacy:false};c.abilities.con.score=16;c.abilities.con.saveProf=false;c.abilities.cha.score=16;return c;};
const spell=(name:string)=>E.toSheetSpell(E.spell(name),'mago',{prepared:true});
test('magia de concentração cria um único estado; reconjurar limpa testes e invalida o identificador anterior',()=>{
  const c=make(),s=spell('detectar-magia');applyCastConcentration(c,s,E);const old=concentration(c)!;
  applyDamage(c,1);assert.equal(old.checks.length,1);applyCastConcentration(c,s,E);
  assert.notEqual(concentration(c)!.id,old.id);assert.equal(concentration(c)!.checks.length,0);
  assert.throws(()=>resolveConcentration(c,old.id,old.checks[0].id,20,20),/mudou/);
});
test('troca exige confirmação para outro efeito; magia comum não encerra e conjuração prolongada encerra',()=>{
  const c=make();applyCastConcentration(c,spell('detectar-magia'),E);const id=concentration(c)!.id;
  assert.equal(needsConcentrationConfirmation(c,spell('detectar-magia'),E),false);
  assert.equal(needsConcentrationConfirmation(c,spell('bencao'),E),true);
  assert.equal(needsConcentrationConfirmation(c,spell('raio-de-fogo'),E),false);
  applyCastConcentration(c,spell('raio-de-fogo'),E);assert.equal(concentration(c)!.id,id);
  assert.equal(needsConcentrationConfirmation(c,spell('convocar-familiar'),E,true),true);
  applyCastConcentration(c,spell('convocar-familiar'),E,true);assert.equal(concentration(c),null);
});
test('ritual pode manter concentração na magia concluída; não duplica o efeito',()=>{
  const c=make();applyCastConcentration(c,spell('detectar-magia'),E,true);assert.equal(concentration(c)!.name,'Detectar Magia');
  assert.equal(needsConcentrationConfirmation(c,spell('detectar-magia'),E,true),false);
});
test('cada fonte gera um teste com CD 10 ou metade arredondada para baixo, sem fundir danos',()=>{
  const c=make();startConcentration(c,{name:'Efeito sintético'});
  for(const n of [1,21,22,43])applyDamage(c,n);
  const s=concentration(c)!;assert.deepEqual(s.checks.map(x=>x.dc),[10,10,11,21]);
  const before=JSON.stringify(c);assert.throws(()=>resolveConcentration(c,s.id,s.checks[1].id,20,0),/primeiro/);assert.equal(JSON.stringify(c),before);
  resolveConcentration(c,s.id,s.checks[0].id,10,0);assert.equal(s.checks.length,3);
});
test('proteção externa exclui dano absorvido; temporários contam para a CD',()=>{
  const c=make();startConcentration(c,{name:'Efeito sintético'});c.ruleState.pools['mago:ward']=10;c.hpTemp=50;
  applyDamage(c,4);assert.equal(concentration(c)!.checks.length,0);
  applyDamage(c,30);assert.equal(concentration(c)!.checks[0].damage,24);assert.equal(concentration(c)!.checks[0].dc,12);assert.equal(c.hpCurrent,400);
});
test('dano na besta pede teste próprio; reverter com PV humanos não encerra concentração',()=>{
  const c=make('druida',8,'lua');startConcentration(c,{name:'Efeito sintético'});c.ruleState.active['druida:wildShape']=true;c.ruleState.pools['druida:wildShape']=5;
  applyDamage(c,6);assert.equal(c.ruleState.active['druida:wildShape'],false);assert.equal(c.hpCurrent,399);assert.equal(concentration(c)!.checks[0].shape,true);
  c.ruleState.active['druida:wildShape']=true;c.ruleState.pools['druida:wildShape']=5;setCondition(c,'inconsciente',true);assert.equal(c.ruleState.active['druida:wildShape'],false);assert.equal(concentration(c),null);
});
test('cair a zero encerra concentração e marca queda; cura não levanta nem restaura o efeito',()=>{
  const c=make();startConcentration(c,{name:'Efeito sintético'});c.hpCurrent=4;applyDamage(c,4);
  assert.equal(concentration(c),null);assert.equal(hasCondition(c,'inconsciente'),true);assert.equal(hasCondition(c,'caido'),true);
  healHitPoints(c,1);assert.equal(hasCondition(c,'inconsciente'),false);assert.equal(hasCondition(c,'caido'),true);assert.equal(concentration(c),null);
});
test('reduzir Constituição até cair a zero também encerra concentração, sem inventar dano',()=>{
  const c=make();c.hpMax=2;c.hpCurrent=1;startConcentration(c,{name:'Efeito'});changePermanentAbility(c,'con',-2);
  assert.equal(c.hpCurrent,0);assert.equal(concentration(c),null);assert.equal(hasCondition(c,'caido'),true);assert.equal(deathStatus(c).failures,0);
});
test('ficha antiga a zero deriva queda sem mutação; cura conserva a queda para levantar explicitamente',()=>{
  const c=make();c.hpCurrent=0;const before=JSON.stringify(c);
  assert.equal(hasCondition(c,'caido'),true);assert.equal(derivedCondition(c,'caido'),true);assert.equal(JSON.stringify(c),before);
  healHitPoints(c,1);assert.equal(hasCondition(c,'inconsciente'),false);assert.equal(hasCondition(c,'caido'),true);
  setCondition(c,'caido',false);assert.equal(hasCondition(c,'caido'),false);
});
test('1/20 naturais não determinam sucesso automático; falhar apaga os testes remanescentes',()=>{
  const c=make();startConcentration(c,{name:'Efeito sintético'});applyDamage(c,1);
  assert.equal(resolveConcentration(c,concentration(c)!.id,concentration(c)!.checks[0].id,1,9).success,true);
  applyDamage(c,50);applyDamage(c,1);assert.equal(resolveConcentration(c,concentration(c)!.id,concentration(c)!.checks[0].id,20,0).success,false);assert.equal(concentration(c),null);
});
test('Conjuração Focada protege somente de dano em escola elegível, inclusive em multiclasse',()=>{
  const c=make('mago',10,'conjuracao');applyCastConcentration(c,spell('teia'),E);assert.equal(focusedConjuration(c),true);applyDamage(c,40);assert.equal(concentration(c)!.checks.length,0);
  assert.equal(resolveConcentration(c,concentration(c)!.id,null,1,0,10).success,false);
  applyCastConcentration(c,spell('teia'),E);c.hpCurrent=1;applyDamage(c,1);assert.equal(concentration(c),null);
  c.hpCurrent=100;applyCastConcentration(c,spell('detectar-magia'),E);applyDamage(c,1);assert.equal(concentration(c)!.checks.length,1);
});
test('Conjurador de Guerra, exaustão, modo da mesa e inspiração agregam fontes antes de cancelar',()=>{
  const c=make();c.rules.history=[{classId:'mago',level:4,answers:{feat:'Conjurador de Guerra'}}];
  assert.equal(concentrationSaveDetails(c,E,{mode:'normal',damage:true}).mode,'adv');
  assert.equal(concentrationSaveDetails(c,E,{mode:'normal',damage:false}).mode,'normal');
  c.exhaustion=3;c.heroicInspiration=true;c.ruleState={inspirationReady:true};
  assert.equal(concentrationSaveDetails(c,E,{mode:'adv',damage:true}).mode,'normal');
  c.exhaustion=0;assert.equal(concentrationSaveDetails(c,E,{mode:'dis',damage:true}).mode,'normal');
});
test('CON soma proficiência/Alma de Diamante/Aura uma vez; forma usa total explícito em lugar do humano',()=>{
  const c=make();c.classes.push({classId:'paladino',level:6});c.abilities.con.saveProf=true;
  assert.equal(concentrationSaveDetails(c,E,{mode:'normal',damage:true}).bonus,10);
  assert.equal(concentrationSaveDetails(c,E,{mode:'normal',damage:true,shapeBonus:7,extra:2}).bonus,9);
  c.ruleState={conditions:{inconsciente:true}};assert.equal(savingThrow(c,'con',E),7);
  const monk=make('monge',14,'maoAberta');assert.equal(savingThrow(monk,'con',E),8);monk.abilities.con.saveProf=true;assert.equal(savingThrow(monk,'con',E),8);
});
test('incapacitação decorre das condições; agarrado, veneno, cegueira e surdez não encerram',()=>{
  for(const id of ['atordoado','paralisado','petrificado','inconsciente','incapacitado']){
    const c=make();startConcentration(c,{name:'Efeito'});setCondition(c,id,true);assert.equal(concentration(c),null);assert.equal(hasCondition(c,'incapacitado'),true);
    if(id!=='incapacitado')assert.equal(derivedCondition(c,'incapacitado'),true);
    assert.equal(canCastNormally(c,spell('raio-de-fogo'),E),false);
  }
  const c=make();startConcentration(c,{name:'Efeito'});for(const id of ['agarrado','envenenado','cego','surdo'])setCondition(c,id,true);assert.ok(concentration(c));
});
test('paralisia não encerra Fúria imediatamente; inconsciência encerra Frenesi uma única vez',()=>{
  const c=make('barbaro',5,'berserker'),rs=resourcesFor(c,E),rage=rs.find(x=>x.id==='barbaro:rage')!,frenzy=rs.find(x=>x.id==='barbaro:frenzy')!;
  toggleResource(c,rage,E);toggleResource(c,frenzy,E);setCondition(c,'paralisado',true);assert.equal(c.ruleState.active['barbaro:rage'],true);
  setCondition(c,'inconsciente',true);assert.equal(c.ruleState.active['barbaro:rage'],false);assert.equal(c.exhaustion,1);setCondition(c,'inconsciente',true);assert.equal(c.exhaustion,1);
});
test('ativar Fúria encerra concentração só depois de gastar um uso válido',()=>{
  const c=make('barbaro',5,'berserker'),r=resourcesFor(c,E).find(x=>x.id==='barbaro:rage')!;startConcentration(c,{name:'Efeito'});
  c.ruleState.used[r.id]=r.max;assert.throws(()=>toggleResource(c,r,E),/insuficientes/);assert.ok(concentration(c));
  c.ruleState.used[r.id]=0;toggleResource(c,r,E);assert.equal(concentration(c),null);assert.ok(concentrationBlock(c));
});
test('movimento 0 e falhas automáticas dependem da condição correta; queda persiste após acordar',()=>{
  const c=make();setCondition(c,'incapacitado',true);assert.equal(conditionSpeed(c,9),9);assert.equal(automaticSaveFailure(c,'dex'),false);
  setCondition(c,'incapacitado',false);setCondition(c,'impedido',true);assert.equal(movementWithEffects(c,9),0);assert.equal(automaticSaveFailure(c,'dex'),false);
  setCondition(c,'paralisado',true);assert.equal(automaticSaveFailure(c,'str'),true);assert.equal(automaticSaveFailure(c,'con'),false);
  setCondition(c,'inconsciente',true);setCondition(c,'inconsciente',false);assert.equal(hasCondition(c,'caido'),true);
});
test('descanso curto e longo consciente preservam concentração; sono encerra',()=>{
  const c=make();startConcentration(c,{name:'Efeito de longa duração'});takeRest(c,'short',E);assert.ok(concentration(c));
  takeRest(c,'long',E,{foodAndWater:true,tableHitDice:false,slept:false});assert.ok(concentration(c));takeRest(c,'long',E);assert.equal(concentration(c),null);
});
test('morte por Frenesi ao iniciar descanso não concede recuperação de recursos',()=>{
  const c=make('barbaro',5,'berserker');c.exhaustion=5;const rage=resourcesFor(c,E).find(x=>x.id==='barbaro:rage')!;toggleResource(c,rage,E);c.ruleState.frenzyUsed=true;c.standardSlots[1]={total:2,used:2};
  assert.equal(takeRest(c,'long',E),false);assert.equal(deathStatus(c).dead,true);assert.equal(c.standardSlots[1].used,2);
});
test('dados inválidos e efeitos obsoletos não apagam registros, notas ou reservas',()=>{
  const c=make();c.ruleState={concentration:['dado ilegível']};const before=JSON.stringify(c);assert.equal(concentration(c),null);assert.throws(()=>startConcentration(c,{name:'Outro'}),/ilegível/);assert.equal(JSON.stringify(c),before);
  c.ruleState={};startConcentration(c,{name:'<img src=x onerror=alert(1)>',duration:'<script>x</script>'});assert.ok(!concentrationControls(c).includes('<img'));assert.ok(!concentrationControls(c).includes('<script>'));
  const state=JSON.stringify(c);assert.throws(()=>setCondition(c,'__proto__',true),/desconhecida/);assert.equal(JSON.stringify(c),state);
});
test('teste cancelado/inválido não altera fila; encerrar não limpa efeitos recebidos de outros conjuradores',()=>{
  const c=make();startConcentration(c,{name:'Escudo da Fé'});c.ruleState.active['spell:shieldOfFaith']=true;queueConcentrationDamage(c,1);
  const s=concentration(c)!,before=JSON.stringify(c);assert.throws(()=>resolveConcentration(c,s.id,s.checks[0].id,0,0),/Confira/);assert.equal(JSON.stringify(c),before);
  endConcentration(c);assert.equal(c.ruleState.active['spell:shieldOfFaith'],true);assert.equal(incapacityReason(c),null);
});
