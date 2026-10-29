import {test} from 'node:test';
import assert from 'node:assert/strict';
import {knowsCommandersStrike,canCommandersStrike,previewCommandersStrike,issueCommandersStrike,previewCommandResult,finishCommandResult,type CommandChoice} from '../src/rules/commanders-strike';
import {currentCommand,endCommand} from '../src/rules/commanders-strike-state';
import {clearWeaponAttacks,beginWeaponAttack,currentWeaponAttack} from '../src/rules/weapon-attack-session';
import {applyFeintingAttack} from '../src/rules/feinting-attack';
import {pendingFeint} from '../src/rules/feinting-state';
import {resetResources} from '../src/rules/resources';
import {previewWeaponDamage} from '../src/rules/weapon-damage';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');
function make(level=6){
 const c=warrior();c.classes=[{classId:'guerreiro',level,subclassId:'mestreBatalha',hitDie:10,hitDiceUsed:0}];c.hpCurrent=c.hpMax=100;c.abilities.cha.score=20;
 c.rules={raceId:'humano',history:[{classId:'guerreiro',level:3,answers:{maneuvers:['Golpe do Comandante','Ataque de Precisão','Derrubar']}},{classId:'guerreiro',level:4,answers:{feat:'Adepto Marcial',featManeuvers:['Ataque de Finta','Golpe do Comandante']}}]};
 c.ruleState={version:1,used:{},active:{},pools:{},targets:{},portent:[]};return c;
}
const choice=(extra:Partial<CommandChoice>={}):CommandChoice=>({source:'guerreiro:superiority',ally:'  Aliado  ',ownTurn:true,attackAction:true,forgoAttack:true,bonusAction:true,friendlyPerceiving:true,...extra});
const issue=(c:any,extra:Partial<CommandChoice>={})=>issueCommandersStrike(c,choice(extra),E);
test('Comandante exige aquisição vigente; talento independente e melhorias pelo nível próprio',()=>{
 const c=make();assert.equal(knowsCommandersStrike(c,E),true);c.rules.history=[];assert.equal(knowsCommandersStrike(c,E),false);c.rules.history=[{classId:'guerreiro',level:7,answers:{maneuvers:['Golpe do Comandante']}}];assert.equal(knowsCommandersStrike(c,E),false);
 c.rules.history=[{classId:'guerreiro',level:4,answers:{feat:'Adepto Marcial',featManeuvers:['Golpe do Comandante']}}];c.classes[0].subclassId='campeao';assert.equal(previewCommandersStrike(c,choice({source:'feat:superiority'}),E).source.die,6);
 c.classes[0].subclassId='mestreBatalha';c.classes.push({classId:'ladino',level:12});assert.equal(previewCommandersStrike(c,choice(),E).source.die,8);assert.equal(previewCommandersStrike(c,choice({source:'feat:superiority'}),E).source.die,6);c.classes[0].level=10;c.classes[1].level=10;assert.equal(previewCommandersStrike(c,choice({source:'feat:superiority'}),E).source.die,10);c.classes[0].level=18;c.classes[1].level=2;assert.equal(previewCommandersStrike(c,choice(),E).source.die,12);
});
test('prévia pura e um gasto antes da reação, sem RNG/ataque/dano antecipados ou bônus de CAR',()=>{
 const c=make(),before=structuredClone(c),random=Math.random;Math.random=()=>{throw Error('RNG proibido');};
 try{previewCommandersStrike(c,choice(),E);assert.deepEqual(c,before);const paid=issue(c,{source:'feat:superiority'});assert.equal(paid.ally,'Aliado');assert.equal(paid.die,6);assert.equal(currentCommand(c),paid);before.ruleState.used['feat:superiority']=1;assert.deepEqual(c,before);}finally{Math.random=random;}
});
test('seu turno, ação Atacar, um ataque cedido, ação bônus e percepção são requisitos distintos',()=>{
 for(const key of ['ownTurn','attackAction','forgoAttack','bonusAction','friendlyPerceiving'])for(const value of [false,undefined,'sim']){const c=make(),before=structuredClone(c);assert.throws(()=>issue(c,{[key]:value} as any));assert.deepEqual(c,before);}
 for(const ally of ['', '  ', 'x'.repeat(81),42,null]){const c=make(),before=structuredClone(c);assert.throws(()=>issue(c,{ally} as any));assert.deepEqual(c,before);}
});
test('não exige Ataque Extra, arma equipada, proximidade, reação do comandante ou bônus de classe do aliado',()=>{
 const c=make(3);c.weapons=[];c.armorEquipped='';c.shieldEquipped=false;assert.equal(canCommandersStrike(c,E,'guerreiro:superiority'),true);issue(c);assert.equal(finishCommandResult(c,{outcome:'hit',declared:true},[8]).total,8);
});
test('incapacitação/forma impedem dar ordem; não há requisito de consciência contínua após emiti-la',()=>{
 for(const mutate of [(c:any)=>c.hpCurrent=0,(c:any)=>c.ruleState.conditions={incapacitado:true},(c:any)=>c.ruleState.active['druida:wildShape']=true]){const c=make();mutate(c);const before=structuredClone(c);assert.throws(()=>issue(c));assert.deepEqual(c,before);}
 const c=make();issue(c);c.hpCurrent=0;assert.equal(finishCommandResult(c,{outcome:'hit',declared:true},[4]).total,4);
});
test('saldo/contadores ilegíveis ou fora do máximo são preservados; origem do talento não é gasta por engano',()=>{
 for(const used of [null,'0',-1,.5,NaN,5]){const c=make();c.ruleState.used['guerreiro:superiority']=used;const before=structuredClone(c);assert.throws(()=>issue(c),/preservado/);assert.deepEqual(c,before);}
 for(const used of [[],42]){const c=make();c.ruleState.used=used;const before=structuredClone(c);assert.throws(()=>issue(c));assert.deepEqual(c,before);}
 const c=make();c.rules.resourceMaxOverrides={'guerreiro:superiority':1};issue(c);endCommand(c);assert.equal(canCommandersStrike(c,E,'guerreiro:superiority'),false);assert.throws(()=>issue(c),/esgotada/);issue(c,{source:'feat:superiority'});assert.equal(c.ruleState.used['guerreiro:superiority'],1);assert.equal(c.ruleState.used['feat:superiority'],1);
});
test('uma ordem pendente entre origens impede cobrança repetida',()=>{
 const c=make();issue(c);const before=structuredClone(c);assert.throws(()=>issue(c,{source:'feat:superiority'}),/já há/i);assert.deepEqual(c,before);assert.equal(currentCommand(c)?.source,'guerreiro:superiority');
});
test('acerto usa um dado; crítico dobra só o dado adicional e não gasta novamente',()=>{
 for(const outcome of ['hit','critical'] as const){const c=make();issue(c,{source:'feat:superiority'});const before=structuredClone(c),p=previewCommandResult(c,{outcome,declared:true});assert.equal(p.formula,outcome==='critical'?'2d6':'1d6');assert.deepEqual(c,before);const faces=outcome==='critical'?[6,5]:[6],result=finishCommandResult(c,{outcome,declared:true},faces);assert.equal(result.total,outcome==='critical'?11:6);assert.deepEqual(c,before);assert.equal(currentCommand(c),undefined);assert.throws(()=>finishCommandResult(c,{outcome,declared:true},faces));}
});
test('erro, recusa ou encerrar na mesa não rolam dado nem devolvem o custo',()=>{
 for(const outcome of ['miss','declined'] as const){const c=make();issue(c);assert.equal(previewCommandResult(c,{outcome,declared:false}).count,0);assert.equal(finishCommandResult(c,{outcome,declared:false}).total,0);assert.equal(c.ruleState.used['guerreiro:superiority'],1);assert.equal(currentCommand(c),undefined);}
});
test('reação/ataque com arma imediato e dado ainda não incluído devem ser confirmados; faces inválidas preservam ordem paga',()=>{
 for(const [outcome,declared,faces] of [['hit',false,[1]],['critical',false,[1,1]],['hit',true,[0]],['hit',true,[9]],['critical',true,[8]],['critical',true,[8,9]],['critical',true,[1,.5]],['hit',true,['1']],['miss',false,[1]],['declined',false,[1]],['outro',false,[]]] as any[]){const c=make();const command=issue(c),before=structuredClone(c);assert.throws(()=>finishCommandResult(c,{outcome,declared},faces));assert.deepEqual(c,before);assert.equal(currentCommand(c),command);}
});
test('origem/tamanho pagos são capturados; nível ou máximo posterior não refazem o gasto ou dado',()=>{
 const c=make();issue(c);c.classes[0].level=10;c.rules.resourceMaxOverrides={'guerreiro:superiority':0};assert.equal(previewCommandResult(c,{outcome:'critical',declared:true}).formula,'2d8');finishCommandResult(c,{outcome:'critical',declared:true},[8,8]);assert.equal(c.ruleState.used['guerreiro:superiority'],1);
});
test('ordem não rola ataque do comandante, não consome Finta nem muda seus danos/preparações',()=>{
 const c=make(),w=c.weapons[0],attack=beginWeaponAttack(c,w);applyFeintingAttack(c,{source:'feat:superiority',target:'Outro',declared:true},E);const feint=pendingFeint(c),damage=previewWeaponDamage(c,w,{},E);issue(c);finishCommandResult(c,{outcome:'hit',declared:true},[5]);assert.equal(currentWeaponAttack(c,w),attack);assert.equal(pendingFeint(c),feint);assert.deepEqual(previewWeaponDamage(c,w,{},E),damage);
});
test('descansos/contexto/novo objeto descartam ordem, sem reembolso ou persistência do alvo',()=>{
 for(const rest of ['short','long'] as const){const c=make();issue(c);resetResources(c,rest,E);assert.equal(currentCommand(c),undefined);assert.equal(c.ruleState.used['guerreiro:superiority'],0);}
 const c=make();issue(c);assert.equal(currentCommand(structuredClone(c)),undefined);clearWeaponAttacks();assert.equal(currentCommand(c),undefined);assert.equal(c.ruleState.used['guerreiro:superiority'],1);
});
