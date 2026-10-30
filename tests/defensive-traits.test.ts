import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isConscious,ownProtectionAura,savingThrowBonus} from '../src/rules/model';
import {hasCondition,setCondition} from '../src/rules/conditions';
import {ownConditionImmunity,ancientAura} from '../src/rules/defensive-traits';
import {situationalSaveDetails,situationalSaveSources,type SaveSituation} from '../src/rules/situational-saves';
import {canShieldMaster,shieldSaveBonus} from '../src/rules/shield-master';
import {previewTypedDamage,typedDamageSummary,type DamagePacket} from '../src/rules/damage';
import {applyTypedDamage} from '../src/rules/combat';
import {startConcentration,concentration} from '../src/rules/concentration';
import {parseBackup} from '../src/storage/validation';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');
function make(id='paladino',n=10,sub='devocao') {
 const c=warrior();c.classes=[{classId:id,level:n,subclassId:sub,subclass:'',hitDie:10,hitDiceUsed:0}];c.rules={raceId:'humano',history:[]};c.abilities.cha.score=18;c.hpCurrent=c.hpMax=100;c.hpTemp=0;c.exhaustion=0;c.shieldEquipped=false;c.armorEquipped='';c.ruleState={version:1,used:{},active:{},pools:{},targets:{},conditions:{}};return c;
}
const situation=(s:Partial<SaveSituation>={}):SaveSituation=>({ability:'wis',effect:'other',magic:'none',creature:'other',visible:false,onlyTarget:false,casterNear:false,...s});
const details=(c:any,s:Partial<SaveSituation>={},mode:'normal'|'adv'|'dis'='normal',extra=0)=>situationalSaveDetails(c,situation(s),mode,E,extra);
const packet=(p:Partial<DamagePacket>={}):DamagePacket=>({source:'spell',parts:[{type:'fire',amount:21}],...p});
function feat(c:any,name='Mestre de Escudo'){c.rules.history.push({classId:c.classes[0].classId,level:4,answers:{feat:name}});}
function unchanged(c:any,fn:()=>unknown){const before=structuredClone(c);assert.throws(fn);assert.deepEqual(c,before);}
test('Proteção/Coragem/Devoção exigem nível próprio e consciência; não somam proficiência nem encerram a marca antiga',()=>{
 const c=make();c.ruleState.conditions={enfeiticado:true,amedrontado:true};const before=structuredClone(c);
 assert.equal(ownProtectionAura(c),4);assert.equal(savingThrowBonus(c,'wis'),4);assert.equal(hasCondition(c,'enfeiticado'),false);assert.equal(hasCondition(c,'amedrontado'),false);assert.deepEqual(c,before);
 c.classes[0].level=6;assert.equal(hasCondition(c,'enfeiticado'),true);assert.equal(hasCondition(c,'amedrontado'),true);
 c.classes.push({classId:'guerreiro',level:14});c.classes[0].level=5;assert.equal(ownProtectionAura(c),0);assert.equal(ownConditionImmunity(c,'enfeiticado').length,0);
});
test('consciência inclui morte, exaustão 6, queda e flags, mas não confunde incapacitação com inconsciência',()=>{
 for(const conditions of [{incapacitado:true},{atordoado:true},{paralisado:true}]){const c=make();c.ruleState.conditions=conditions;assert.equal(isConscious(c),true);assert.equal(ownProtectionAura(c),4);assert.equal(hasCondition(c,'amedrontado'),false);}
 for(const alter of [(c:any)=>c.hpCurrent=0,(c:any)=>c.conscious=false,(c:any)=>c.ruleState.conditions.inconsciente=true,(c:any)=>c.ruleState.death={dead:true},(c:any)=>c.ruleState.death={failures:3},(c:any)=>c.exhaustion=6]){const c=make();alter(c);assert.equal(isConscious(c),false);assert.equal(ownProtectionAura(c),0);assert.equal(ownConditionImmunity(c,'enfeiticado').length,0);}
 const c=make();c.hpCurrent=0;c.ruleState.active['druida:wildShape']=true;assert.equal(isConscious(c),true);c.conscious=false;assert.equal(isConscious(c),false);
});
test('Aura de Proteção tem mínimo +1 e alcança CON compartilhada sem modificar CAR/proficiências',()=>{
 const c=make();c.abilities.cha.score=6;c.abilities.con.saveProf=false;assert.equal(ownProtectionAura(c),1);assert.equal(details(c,{ability:'con'}).base,3);c.abilities.cha.score=18;assert.equal(details(c,{ability:'con'}).base,6);
 c.classes[0].subclassId='vinganca';assert.equal(ownConditionImmunity(c,'enfeiticado').length,0);
});
test('Fúria Inconsciente suspende encanto/medo em berserker 6, não apaga nem termina o efeito',()=>{
 const c=make('barbaro',6,'berserker');c.ruleState.conditions={enfeiticado:true,amedrontado:true};c.ruleState.active['barbaro:rage']=true;const before=structuredClone(c);
 assert.equal(hasCondition(c,'enfeiticado'),false);assert.equal(hasCondition(c,'amedrontado'),false);assert.deepEqual(c,before);unchanged(c,()=>setCondition(c,'enfeiticado',true));
 c.ruleState.active['barbaro:rage']=false;assert.equal(hasCondition(c,'amedrontado'),true);c.ruleState.active['barbaro:rage']=true;c.classes[0].subclassId='totemico';assert.equal(hasCondition(c,'amedrontado'),true);c.classes[0].subclassId='berserker';c.classes[0].level=5;assert.equal(hasCondition(c,'amedrontado'),true);
});
test('imunidades de marca bloqueiam novos efeitos, preservam originais e reconhecem nomes antigos sem sobrepor ID explícito',()=>{
 const c=make();c.classes[0].subclassId='';c.classes[0].subclass='Juramento de Devoção';assert.equal(hasCondition({...c,ruleState:{conditions:{enfeiticado:true}}},'enfeiticado'),false);unchanged(c,()=>setCondition(c,'enfeiticado',true));
 c.ruleState.conditions.enfeiticado=true;setCondition(c,'enfeiticado',false);assert.equal(c.ruleState.conditions.enfeiticado,undefined);
 c.classes[0].subclassId='vinganca';assert.equal(ownConditionImmunity(c,'enfeiticado').length,0);
});
test('Proteção Natural da Terra e Pureza Corporal não convertem imunidade a veneno em imunidade geral a condições',()=>{
 for(const [id,sub] of [['monge','maoAberta'],['druida','terra']]){const c=make(id,10,sub);c.ruleState.conditions={envenenado:true,enfeiticado:true};assert.equal(hasCondition(c,'envenenado'),false);assert.equal(hasCondition(c,'enfeiticado'),true);unchanged(c,()=>setCondition(c,'envenenado',true));assert.ok(details(c,{effect:'poison'}).immunity.length);c.classes[0].level=9;assert.equal(hasCondition(c,'envenenado'),true);}
});
test('Defesa Sedutora impede encanto no bruxo Arquifada 10 mesmo inconsciente; não dá imunidade a medo nem devolve o efeito automaticamente',()=>{
 const c=make('bruxo',10,'arquifada');c.conscious=false;c.ruleState.conditions={enfeiticado:true,amedrontado:true};const before=structuredClone(c);assert.equal(hasCondition(c,'enfeiticado'),false);assert.equal(hasCondition(c,'amedrontado'),true);assert.ok(details(c,{effect:'charm'}).immunity.includes('Defesa Sedutora'));assert.deepEqual(c,before);unchanged(c,()=>setCondition(c,'enfeiticado',true));c.classes[0].level=9;assert.equal(hasCondition(c,'enfeiticado'),true);c.classes[0].level=10;c.classes[0].subclassId='corruptor';assert.equal(hasCondition(c,'enfeiticado'),true);
});
test('Terra só impede encanto/medo de fadas/elementais; origem desconhecida, besta ou outro círculo não é imune',()=>{
 const c=make('druida',10,'terra');for(const effect of ['charm','fear'] as const){for(const creature of ['fey','elemental'] as const)assert.ok(details(c,{effect,creature}).immunity.includes('Proteção Natural · '+(creature==='fey'?'fada':'elemental')));assert.equal(details(c,{effect}).immunity.length,0);}c.classes[0].subclassId='lua';assert.equal(details(c,{effect:'charm',creature:'fey'}).immunity.length,0);
});
test('Ancestral Feérico distingue vantagem de encanto, imunidade a sono mágico e outros estados',()=>{
 const c=make('guerreiro',4,'');for(const race of ['altoElfo','elfoFloresta','drow','meioElfo']){c.rules.raceId=race;assert.equal(details(c,{effect:'charm'}).mode,'adv');assert.equal(details(c,{effect:'fear'}).mode,'normal');assert.equal(details(c,{effect:'sleep',magic:'spell'}).immunity.length,1);assert.equal(details(c,{effect:'other'}).immunity.length,0);}unchanged(c,()=>details(c,{effect:'sleep',magic:'none'}));c.rules.raceId='humano';assert.equal(details(c,{effect:'sleep',magic:'spell'}).immunity.length,0);
});
test('Esperteza Gnômica só beneficia INT/SAB/CAR contra magia; Bravura só medo e resiliências só veneno',()=>{
 const c=make('guerreiro',4,'');for(const race of ['gnomoFloresta','gnomoRochas']){c.rules.raceId=race;for(const key of ['int','wis','cha'])for(const magic of ['spell','other'] as const)assert.equal(details(c,{ability:key,magic}).mode,'adv');for(const key of ['str','dex','con'])assert.equal(details(c,{ability:key,magic:'spell'}).mode,'normal');assert.equal(details(c,{ability:'wis',magic:'none'}).mode,'normal');}
 for(const race of ['halflingLeve','halflingRobusto']){c.rules.raceId=race;assert.equal(details(c,{effect:'fear'}).mode,'adv');assert.equal(details(c,{effect:'poison'}).mode,race==='halflingRobusto'?'adv':'normal');}
 for(const race of ['anaoColina','anaoMontanha']){c.rules.raceId=race;assert.equal(details(c,{effect:'poison'}).mode,'adv');assert.equal(details(c,{effect:'charm'}).mode,'normal');}
});
test('Sentido de Perigo exige DES, visão do efeito, audição e capacidade; não presume ver uma armadilha',()=>{
 const c=make('barbaro',2,'berserker');assert.equal(details(c,{ability:'dex'}).mode,'normal');assert.equal(details(c,{ability:'dex',visible:true}).mode,'adv');assert.equal(details(c,{ability:'str',visible:true}).mode,'normal');
 for(const id of ['cego','surdo','incapacitado','atordoado','inconsciente','paralisado']){c.ruleState.conditions={[id]:true};const d=details(c,{ability:'dex',visible:true});assert.ok(!d.advantage.includes('Sentido de Perigo'));}c.ruleState.conditions={};c.classes[0].level=1;assert.equal(details(c,{ability:'dex',visible:true}).mode,'normal');
});
test('Abjuração e Matador de Conjuradores distinguem magia conjurada de outros efeitos mágicos e distância declarada',()=>{
 const c=make('mago',14,'abjuracao');assert.equal(details(c,{magic:'spell'}).mode,'adv');assert.equal(details(c,{magic:'other'}).mode,'normal');c.classes[0].level=13;assert.equal(details(c,{magic:'spell'}).mode,'normal');feat(c,'Matador de Conjuradores');assert.equal(details(c,{magic:'spell',casterNear:true}).mode,'adv');assert.equal(details(c,{magic:'spell',casterNear:false}).mode,'normal');assert.equal(details(c,{magic:'other',casterNear:true}).mode,'normal');
});
test('fontes condicionais, inspiração, impedido e exaustão cancelam uma vez; múltiplas vantagens não vencem desvantagem',()=>{
 const c=make('barbaro',4,'berserker');c.rules.raceId='halflingRobusto';c.heroicInspiration=true;c.ruleState.inspirationReady=true;c.ruleState.conditions.impedido=true;const before=structuredClone(c),d=details(c,{ability:'dex',effect:'poison',visible:true},'adv');assert.equal(d.advantage.length,4);assert.equal(d.disadvantage.length,1);assert.equal(d.mode,'normal');assert.equal(d.inspired,true);assert.deepEqual(c,before);c.ruleState.conditions={};c.exhaustion=3;assert.equal(details(c,{effect:'poison'}).mode,'normal');
});
test('Mestre de Escudo só soma o bônus próprio em DES com alvo exclusivo; magia do escudo inclui override 0',()=>{
 const c=make('guerreiro',8,'');feat(c);c.shieldEquipped=true;c.shieldName='Escudo +2';assert.equal(shieldSaveBonus(c,E),4);assert.equal(details(c,{ability:'dex',onlyTarget:true}).shield,4);assert.equal(details(c,{ability:'dex',onlyTarget:false}).shield,0);assert.equal(details(c,{ability:'str',onlyTarget:true}).shield,0);c.ruleState.active['spell:shield']=true;c.acAdjustment=8;assert.equal(shieldSaveBonus(c,E),4);c.shieldMagicBonus=0;assert.equal(details(c,{ability:'dex',onlyTarget:true}).shield,2);assert.equal(savingThrowBonus(c,'dex'),2);
});
test('escudo não empunhado, incapacidade ou sem talento não dão bônus; dados inválidos não viram zero silencioso',()=>{
 const c=make('guerreiro',8,'');feat(c);assert.equal(canShieldMaster(c,E),false);c.shieldEquipped=true;assert.equal(canShieldMaster(c,E),true);for(const invalid of ['2',null,NaN,-1,1.5,101]){c.shieldMagicBonus=invalid;if(invalid===null)assert.equal(shieldSaveBonus(c,E),2);else unchanged(c,()=>shieldSaveBonus(c,E));}delete c.shieldMagicBonus;c.ruleState.conditions.incapacitado=true;assert.equal(details(c,{ability:'dex',onlyTarget:true}).shield,0);c.ruleState.conditions={};c.rules.history=[];assert.equal(details(c,{ability:'dex',onlyTarget:true}).shield,0);
});
test('Mestre de Escudo evita todo o dano misto em sucesso e área, sem absorver Proteção Arcana ou enfileirar concentração',()=>{
 const c=make('guerreiro',8,'');feat(c);c.shieldEquipped=true;c.classes.push({classId:'mago',subclassId:'abjuracao',level:2,hitDie:6,hitDiceUsed:0,subclass:''});c.ruleState.pools['mago:ward']=8;startConcentration(c,{name:'Efeito de teste'});
 const p=packet({shieldMaster:true,dexteritySave:'success',parts:[{type:'fire',amount:21},{type:'cold',amount:11}]});const plan=previewTypedDamage(c,p,E);assert.equal(plan.received,0);assert.equal(plan.ward,0);assert.match(typedDamageSummary(plan),/Mestre de Escudo.*reação/);applyTypedDamage(c,p,E);assert.equal(c.hpCurrent,100);assert.equal(c.ruleState.pools['mago:ward'],8);assert.equal(concentration(c)?.checks.length,0);
});
test('reação do escudo não funciona na falha, em ataque, sem reação ou combinada; rejeita antes de mutar PV',()=>{
 const c=make('guerreiro',8,'');feat(c);c.shieldEquipped=true;const p=packet({shieldMaster:true,dexteritySave:'success'});
 for(const bad of [{dexteritySave:'failure'},{dexteritySave:undefined},{source:'spellAttack'},{shieldMaster:1},{uncannyDodge:true},{parry:{declared:true}},{monkDefense:{kind:'fall',declared:true}}])unchanged(c,()=>applyTypedDamage(c,{...p,...bad} as any,E));
 for(const id of ['incapacitado','inconsciente','atordoado']){c.ruleState.conditions={[id]:true};unchanged(c,()=>applyTypedDamage(c,p,E));}c.ruleState.conditions={};c.shieldEquipped=false;unchanged(c,()=>applyTypedDamage(c,p,E));
});
test('Evasão não gasta reação de escudo; falha segue metade, sem Evasão segue dano completo',()=>{
 const c=make('ladino',7,'ladrao');feat(c);c.shieldEquipped=true;unchanged(c,()=>previewTypedDamage(c,packet({shieldMaster:true,dexteritySave:'success'}),E));assert.equal(previewTypedDamage(c,packet({dexteritySave:'success'}),E).received,0);assert.equal(previewTypedDamage(c,packet({dexteritySave:'failure'}),E).received,10);c.classes[0].level=6;assert.equal(previewTypedDamage(c,packet({dexteritySave:'failure'}),E).received,21);
});
test('Aura de Vigilância só resiste dano de magia conjurada e tem contrato distinto de consciência',()=>{
 const c=make('paladino',7,'ancioes');assert.equal(ancientAura(c),true);for(const source of ['spell','spellAttack'] as const)assert.equal(previewTypedDamage(c,packet({source}),E).received,10);for(const source of ['magicWeapon','magicAttack','magic','weapon','other'] as const)assert.equal(previewTypedDamage(c,packet({source}),E).received,21);
 c.conscious=false;assert.equal(ownProtectionAura(c),0);assert.equal(previewTypedDamage(c,packet(),E).received,10);c.classes[0].level=6;assert.equal(previewTypedDamage(c,packet(),E).received,21);c.classes[0].level=7;c.classes[0].subclassId='devocao';assert.equal(previewTypedDamage(c,packet(),E).received,21);
});
test('Vigilância não empilha resistências, respeita vulnerabilidade/arredondamento e escolha manual por ocorrência',()=>{
 const c=make('paladino',7,'ancioes');c.rules.raceId='tiefling';assert.equal(previewTypedDamage(c,packet(),E).received,10);assert.equal(previewTypedDamage(c,packet({parts:[{type:'fire',amount:21,vulnerable:true}]}),E).received,20);assert.equal(previewTypedDamage(c,packet({parts:[{type:'fire',amount:21,defense:'normal'}]}),E).received,21);
});
test('resiliência dos robustos difere da sub-raça pés-leves e não se torna imunidade',()=>{
 const c=make('guerreiro',4,'');c.rules.raceId='halflingRobusto';assert.equal(previewTypedDamage(c,packet({parts:[{type:'poison',amount:21}]}),E).received,10);assert.equal(details(c,{effect:'poison'}).immunity.length,0);c.rules.raceId='halflingLeve';assert.equal(previewTypedDamage(c,packet({parts:[{type:'poison',amount:21}]}),E).received,21);
});
test('valida contexto/ajuste/forma e preserva campos futuros, notas e backup nas consultas',()=>{
 const c=make();c.ruleState.future={unknown:[1,2]};const before=structuredClone(c);
 for(const bad of [{ability:'luc'},{magic:'unknown'},{effect:'unknown'},{creature:'unknown'},{visible:1}])unchanged(c,()=>details(c,bad as any));for(const extra of [NaN,Infinity,1.5,101])unchanged(c,()=>details(c,{},'normal',extra));
 assert.ok(situationalSaveSources(c,E).includes('Aura de Devoção'));details(c,{effect:'charm'});assert.deepEqual(c,before);assert.deepEqual((parseBackup(JSON.stringify({format:'critcall.character-backup',version:1,characters:[c]})).characters[0] as any).ruleState.future,{unknown:[1,2]});c.ruleState.active['druida:wildShape']=true;unchanged(c,()=>details(c));
});
