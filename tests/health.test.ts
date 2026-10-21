import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyDamage} from '../src/rules/combat';
import {consumeInspiration,deathSaveBonus,deathStatus,healHitPoints,hitDiceRemaining,inspirationRollMode,markDead,resolveDeathSave,returnToLife,songOfRestDie,spendHitDie,stabilize} from '../src/rules/health';
import {takeRest} from '../src/rules/rest';
import {canCastNormally} from '../src/rules/spellcasting';
import {resourcesFor,toggleResource,useResource} from '../src/rules/resources';
import {hitDiceControls} from '../src/rules/health-ui';
const E=require('../public/rules/character-engine');
const {warrior}=require('./fixture.cjs');
const make=()=>{const c=warrior();c.classes[0].level=3;c.classes[0].hitDiceUsed=0;c.hpMax=30;c.hpCurrent=20;c.hpTemp=0;c.exhaustion=0;c.abilities.con.score=16;return c;};
test('cair a zero inicia contagens; crítico nessa queda não causa falhas adicionais',()=>{
  const c=make();applyDamage(c,20,{critical:true});
  assert.equal(c.hpCurrent,0);assert.deepEqual(deathStatus(c),{successes:0,failures:0,stable:false,dead:false});
  applyDamage(c,1,{critical:true});assert.equal(deathStatus(c).failures,2);
  applyDamage(c,1);assert.equal(deathStatus(c).dead,true);
});
test('sucessos e falhas não precisam ser consecutivos; estabilizar zera as duas contagens',()=>{
  const c=make();c.hpCurrent=0;
  resolveDeathSave(c,10);resolveDeathSave(c,9);resolveDeathSave(c,12);resolveDeathSave(c,18);
  assert.deepEqual(deathStatus(c),{successes:0,failures:0,stable:true,dead:false});
  assert.throws(()=>resolveDeathSave(c,20),/Estável/);
  applyDamage(c,1);assert.deepEqual(deathStatus(c),{successes:0,failures:1,stable:false,dead:false});
});
test('1 natural vale duas falhas apesar de bônus; 20 natural cura 1 PV apesar de penalidade',()=>{
  const c=make();c.hpCurrent=0;resolveDeathSave(c,1,50);assert.equal(deathStatus(c).failures,2);
  resolveDeathSave(c,20,-50);assert.equal(c.hpCurrent,1);assert.deepEqual(deathStatus(c),{successes:0,failures:0,stable:false,dead:false});
});
test('bônus recebido altera o total comum; Alma de Diamante soma proficiência ao teste sem habilidade',()=>{
  const c=make();c.hpCurrent=0;resolveDeathSave(c,9,1);assert.equal(deathStatus(c).successes,1);
  c.classes=[{classId:'monge',level:14,hitDie:8,subclass:'',hitDiceUsed:0}];
  assert.equal(deathSaveBonus(c),5);assert.equal(resolveDeathSave(c,5).total,10);
});
test('dano maciço usa o excesso e os PV máximos efetivos; morte bloqueia cura/descanso',()=>{
  const c=make();c.hpCurrent=5;applyDamage(c,35);assert.equal(deathStatus(c).dead,true);
  assert.throws(()=>healHitPoints(c,30),/não revive/);assert.throws(()=>takeRest(c,'long',E),/não revive/);
  returnToLife(c,2);assert.equal(c.hpCurrent,2);assert.equal(deathStatus(c).dead,false);
  const less=make();less.hpCurrent=5;applyDamage(less,34);assert.equal(deathStatus(less).dead,false);
  const exhausted=make();exhausted.exhaustion=4;exhausted.hpCurrent=5;applyDamage(exhausted,20);assert.equal(deathStatus(exhausted).dead,true);
});
test('a zero, dano absorvido por temporários causa falha; proteção externa impede esse dano',()=>{
  const c=make();c.hpCurrent=0;c.hpTemp=10;applyDamage(c,4);assert.equal(c.hpTemp,6);assert.equal(deathStatus(c).failures,1);
  c.classes.push({classId:'mago',level:2,subclassId:'abjuracao',subclass:'Escola de Abjuração'});c.ruleState.pools={'mago:ward':5};
  applyDamage(c,4,{critical:true});assert.equal(deathStatus(c).failures,1);assert.equal(c.hpTemp,6);
  const massive=make();massive.hpCurrent=0;massive.hpTemp=40;applyDamage(massive,30);assert.equal(deathStatus(massive).dead,true);
});
test('dano na besta não causa falhas nos PV humanos a zero; excesso após reverter causa',()=>{
  const c=make();c.classes=[{classId:'druida',level:4,subclass:'',hitDie:8,hitDiceUsed:0}];c.hpCurrent=0;
  c.ruleState={active:{'druida:wildShape':true},pools:{'druida:wildShape':10},beastMax:10};
  applyDamage(c,4);assert.equal(deathStatus(c).failures,0);assert.equal(c.ruleState.pools['druida:wildShape'],6);
  applyDamage(c,7);assert.equal(deathStatus(c).failures,1);assert.equal(c.ruleState.active['druida:wildShape'],false);
});
test('cura positiva e estabilização explícita limpam contagens; cura zero não limpa',()=>{
  const c=make();c.hpCurrent=0;resolveDeathSave(c,4);healHitPoints(c,0);assert.equal(deathStatus(c).failures,1);
  stabilize(c);assert.equal(deathStatus(c).stable,true);healHitPoints(c,4);assert.equal(c.hpCurrent,4);assert.equal(deathStatus(c).stable,false);
  assert.throws(()=>stabilize(c),/exige 0 PV/);
});
test('entradas inválidas não gastam recursos nem alteram contagens',()=>{
  const c=make();c.hpCurrent=0;const before=JSON.stringify(c);
  for(const n of [0,21,1.5,NaN]) assert.throws(()=>resolveDeathSave(c,n));
  assert.equal(JSON.stringify(c),before);
  c.hpCurrent=10;const alive=JSON.stringify(c);
  for(const n of [0,11,1.5,NaN]) assert.throws(()=>spendHitDie(c,'guerreiro',n,E));
  assert.equal(JSON.stringify(c),alive);
});
test('cada Dado de Vida gasta só a classe escolhida; cura limitada ao máximo e mínimo zero',()=>{
  const c=make();c.classes.push({classId:'mago',level:1,hitDie:6,hitDiceUsed:0,subclass:''});c.hpCurrent=27;
  const r=spendHitDie(c,'mago',6,E);assert.equal(r.restored,3);assert.equal(c.classes[1].hitDiceUsed,1);assert.equal(c.classes[0].hitDiceUsed,0);
  assert.throws(()=>spendHitDie(c,'mago',3,E),/Não há/);
  c.hpCurrent=10;c.abilities.con.score=1;const negative=spendHitDie(c,'guerreiro',1,E);assert.equal(negative.restored,0);assert.equal(c.hpCurrent,10);assert.equal(hitDiceRemaining(c.classes[0]),2);
});
test('Resistente impõe mínimo de duas vezes CON, com piso 2, antes da canção',()=>{
  const c=make();c.hpCurrent=1;c.rules.history=[{classId:'guerreiro',level:4,answers:{feat:'Resistente'}}];
  assert.equal(spendHitDie(c,'guerreiro',1,E).healing,6);
  c.abilities.con.score=1;assert.equal(spendHitDie(c,'guerreiro',1,E).healing,2);
});
test('Canção do Descanso soma uma vez e não aceita segundo bônus sem novo descanso',()=>{
  const c=make();c.hpCurrent=1;
  assert.equal(spendHitDie(c,'guerreiro',1,E,{song:{sides:8,roll:5}}).restored,9);
  const before=JSON.stringify(c);assert.throws(()=>spendHitDie(c,'guerreiro',1,E,{song:{sides:8,roll:5}}),/um bônus/);assert.equal(JSON.stringify(c),before);
  spendHitDie(c,'guerreiro',1,E);takeRest(c,'short',E);assert.equal(c.ruleState.songOfRestUsed,false);
  for(const [n,die] of [[1,0],[2,6],[9,8],[13,10],[17,12]]){c.classes=[{classId:'bardo',level:n}];assert.equal(songOfRestDie(c),die);}
});
test('canção exige recuperar PV pelo Dado de Vida; um resultado sem cura não gasta o bônus',()=>{
  const c=make();c.abilities.con.score=1;c.hpCurrent=10;
  const r=spendHitDie(c,'guerreiro',1,E,{song:{sides:6,roll:5}});assert.equal(r.restored,0);assert.equal(r.song,0);assert.equal(c.ruleState?.songOfRestUsed,undefined);
  c.classes[0].hitDiceUsed='1';spendHitDie(c,'guerreiro',10,E);assert.equal(c.classes[0].hitDiceUsed,2);
});
test('cura com Dado de Vida em Forma Selvagem exige CON da besta e não cura os PV humanos',()=>{
  const c=make();c.classes=[{classId:'druida',level:4,hitDie:8,hitDiceUsed:0,subclass:''}];c.hpCurrent=0;c.ruleState={active:{'druida:wildShape':true},pools:{'druida:wildShape':5},beastMax:12};
  const before=JSON.stringify(c);assert.throws(()=>spendHitDie(c,'druida',4,E),/Constituição/);assert.equal(JSON.stringify(c),before);
  const r=spendHitDie(c,'druida',4,E,{shapeCon:1});assert.equal(r.restored,5);assert.equal(c.hpCurrent,0);assert.equal(c.ruleState.pools['druida:wildShape'],10);
});
test('descanso longo recupera orçamento por classe, não restaura todos os dados automaticamente',()=>{
  const c=make();c.classes[0].hitDiceUsed=3;c.classes.push({classId:'mago',level:2,hitDie:6,hitDiceUsed:2,subclass:''});
  takeRest(c,'long',E);assert.equal(c.ruleState.hitDiceRecovery,2);assert.equal(c.classes[0].hitDiceUsed,3);assert.equal(c.classes[1].hitDiceUsed,2);
});
test('estável a zero pode recuperar PV com Dado de Vida ao concluir descanso curto',()=>{
  const c=make();c.hpCurrent=0;assert.throws(()=>spendHitDie(c,'guerreiro',1,E),/estabilização/);
  stabilize(c);spendHitDie(c,'guerreiro',1,E);assert.equal(c.hpCurrent,4);assert.equal(deathStatus(c).stable,false);
});
test('a zero/morto não conjura nem ativa cura própria; não consome o recurso recusado',()=>{
  const c=make();c.hpCurrent=0;const r=resourcesFor(c,E).find(x=>x.action==='secondWind')!,before=JSON.stringify(c);
  assert.throws(()=>useResource(c,r,E),/consciente/);assert.equal(JSON.stringify(c),before);
  assert.equal(canCastNormally(c,E.toSheetSpell(E.spell('Raio de Fogo'),'mago'),E),false);
  const barb=make();barb.classes=[{classId:'barbaro',level:3,hitDie:12,hitDiceUsed:0,subclassId:'berserker',subclass:''}];markDead(barb);
  assert.throws(()=>toggleResource(barb,resourcesFor(barb,E).find(r=>r.id==='barbaro:rage')!,E),/consciente/);
});
test('exaustão fatal não é removida por cura e exige resolver a causa antes do retorno',()=>{
  const c=make();c.exhaustion=6;markDead(c);assert.throws(()=>returnToLife(c,1),/exaustão/);
  c.exhaustion=5;assert.equal(deathStatus(c).dead,true);returnToLife(c,1);assert.equal(deathStatus(c).dead,false);
});
test('inspiração de 2014 concede vantagem uma vez, cancela desvantagem e não acumula',()=>{
  const c=make();c.heroicInspiration=true;c.ruleState={inspirationReady:true};
  assert.equal(inspirationRollMode(c,'normal'),'adv');assert.equal(inspirationRollMode(c,'adv'),'adv');assert.equal(inspirationRollMode(c,'dis'),'normal');
  assert.equal(consumeInspiration(c),true);assert.equal(consumeInspiration(c),false);assert.equal(c.heroicInspiration,false);assert.equal(inspirationRollMode(c,'normal'),'normal');
});
test('campo opcional de dado adulterado no backup não vira HTML e não pode ser gasto',()=>{
  const c=make();c.classes[0].hitDie='<img src=x onerror=alert(1)>';
  assert.ok(!hitDiceControls(c,E).includes('<img'));assert.throws(()=>spendHitDie(c,'guerreiro',1,E),/Não há/);
});
