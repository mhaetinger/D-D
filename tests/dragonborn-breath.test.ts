import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DRAGON_ANCESTRIES,isDragonborn,racialBreathProfile,setDragonChoice} from '../src/rules/draconic-ancestry';
import {BREATH_ID,previewDragonbornBreath,useDragonbornBreath} from '../src/rules/dragonborn-breath';
import {remaining,resourcesFor,resetResources,refund} from '../src/rules/resources';
import {featureResourceBindings,resourcePlace} from '../src/rules/placement';
const E=require('../public/rules/character-engine'),{warrior}=require('./fixture.cjs');
const make=()=>{const c=warrior();c.race='Draconato';c.rules.raceId='draconato';c.abilities.con.score=16;c.hpMax=40;c.hpCurrent=31;c.classes[0].level=6;setDragonChoice(c,'raceDragon','Ouro — fogo');return c;};
const resource=(c:any)=>resourcesFor(c,E).find(r=>r.id===BREATH_ID)!;

test('sopro: dez ancestrais, limiares por nível total e CD de CON/proficiência',()=>{
 for(const dragon of DRAGON_ANCESTRIES)for(const [level,dice] of [[1,'2d6'],[5,'2d6'],[6,'3d6'],[10,'3d6'],[11,'4d6'],[15,'4d6'],[16,'5d6'],[20,'5d6']] as const){
  const c=make();setDragonChoice(c,'raceDragon',dragon.choice);c.classes[0].level=level;
  const p=previewDragonbornBreath(c,E);assert.equal(p.dice,dice);assert.equal(p.dc,11+2+Math.floor((level-1)/4));assert.equal(p.save,dragon.save);assert.equal(p.type,dragon.type);assert.equal(p.area,dragon.line?'linha de 1,5 m × 9 m':'cone de 4,5 m');
 }
 const c=make();c.classes=[{classId:'monge',level:3},{classId:'guerreiro',level:3}];assert.equal(previewDragonbornBreath(c,E).dice,'3d6');
 c.abilities.con.score=20;assert.equal(previewDragonbornBreath(c,E).dc,16);
});
test('sopro: uma reserva racial, ligada à característica, sem confundir Linhagem Dracônica',()=>{
 const c=make(),r=resource(c);assert.equal(r.max,1);assert.equal(r.recovery,'short');assert.equal(resourcePlace(c,r),'features');
 const {gains,bindings}=featureResourceBindings(c,E),bound=[...bindings].filter(([,rs])=>rs.some(x=>x.id===BREATH_ID));assert.equal(bound.length,1);assert.equal(gains[bound[0][0]].name,'Arma de Sopro');assert.equal(gains.filter(g=>g.name==='Arma de Sopro').length,1);
 c.rules.raceId='humano';c.classes=[{classId:'feiticeiro',level:6,subclassId:'draconica'}];setDragonChoice(c,'dragon','Vermelho — fogo');assert.equal(resource(c),undefined);assert.equal(racialBreathProfile(c,E),null);
 delete c.rules.raceId;c.race='Draconato Azul';assert.equal(isDragonborn(c),true);setDragonChoice(c,'raceDragon','');assert.equal(racialBreathProfile(c,E),null,'cor escrita não concede escolha automaticamente');
});
test('sopro físico: gasta só um uso, não rola RNG e não altera PV, magias, notas ou concentração',()=>{
 const c=make();c.ruleState={active:{'feiticeiro:elementalAffinity':true},concentration:{version:1,name:'Efeito preservado'},used:{},pools:{}};c.notes='Texto preservado';c.spells=[{name:'Bênção',usesUsed:1}];c.sorceryPoints={current:3,max:6};const before=structuredClone(c),random=Math.random;
 let result;try{Math.random=()=>{throw new Error('RNG indevido');};result=useDragonbornBreath(c,13,E);}finally{Math.random=random;}
 assert.equal(result.total,13);assert.equal(result.half,6);assert.equal(result.source,'physical');assert.equal(c.ruleState.used[BREATH_ID],1);assert.deepEqual(c.ruleState.lastBreath,result);assert.equal(remaining(c,resource(c)),0);
 for(const key of ['hpCurrent','hpMax','notes','spells','sorceryPoints','rules'])assert.deepEqual(c[key],before[key]);assert.deepEqual(c.ruleState.concentration,before.ruleState.concentration);assert.deepEqual(c.ruleState.active,before.ruleState.active);
 const spent=structuredClone(c);assert.throws(()=>useDragonbornBreath(c,13,E),/esgotado/);assert.deepEqual(c,spent);
});
test('sopro: descanso curto e longo recuperam; trocar ancestral ou nível não recupera',()=>{
 const c=make();useDragonbornBreath(c,13,E);setDragonChoice(c,'raceDragon','Branco — frio');assert.equal(remaining(c,resource(c)),0);setDragonChoice(c,'raceDragon','');setDragonChoice(c,'raceDragon','Verde — veneno');c.classes[0].level=16;assert.equal(remaining(c,resource(c)),0);
 resetResources(c,'short',E);assert.equal(remaining(c,resource(c)),1);useDragonbornBreath(c,5,E,{},'virtual');assert.equal(c.ruleState.lastBreath.dice,'5d6');resetResources(c,'long',E);assert.equal(remaining(c,resource(c)),1);assert.equal(c.ruleState.lastBreath.total,5,'último resultado continua identificado como passado');
});
test('sopro: inválidos, incapacitação e registros ilegíveis não alteram dados',()=>{
 const check=(change:(c:any)=>void,total=13)=>{const c=make();change(c);const before=structuredClone(c);assert.throws(()=>useDragonbornBreath(c,total,E));assert.deepEqual(c,before);};
 for(const total of [NaN,Infinity,0,2,19,3.5])check(()=>{},total);
 check(c=>setDragonChoice(c,'raceDragon',''));check(c=>{c.rules.raceId='humano';});check(c=>{c.classes[0].level=0;});check(c=>{c.classes[0].level=21;});check(c=>{c.abilities.con.score=31;});check(c=>{c.abilities.con.score=NaN;});
 for(const used of ['1',-1,NaN,Infinity]){check(c=>{c.ruleState={used:{[BREATH_ID]:used}};});const c=make();c.ruleState={used:{[BREATH_ID]:used}};const before=structuredClone(c);assert.throws(()=>refund(c,resource(c)),/ilegível preservado/);assert.deepEqual(c,before);}
 check(c=>{c.hpCurrent=0;});check(c=>{c.ruleState={conditions:{incapacitado:true}};});check(c=>{c.ruleState={death:{dead:true}};});
 const c=make(),before=structuredClone(c);assert.throws(()=>useDragonbornBreath(c,13,E,{},'inválido' as any));assert.deepEqual(c,before);
});
test('sopro em Forma Selvagem: exige capacidade física e usa CON da forma, sem alterar a humana',()=>{
 const c=make();c.ruleState={active:{'druida:wildShape':true},pools:{'druida:wildShape':12},beastMax:20};
 for(const options of [{},{shapeCapable:true},{shapeCapable:true,shapeCon:11},{shapeCapable:false,shapeCon:5},{shapeCapable:true,shapeCon:NaN}]){const before=structuredClone(c);assert.throws(()=>useDragonbornBreath(c,13,E,options));assert.deepEqual(c,before);}
 const result=useDragonbornBreath(c,13,E,{shapeCapable:true,shapeCon:5});assert.equal(result.dc,16);assert.equal(c.abilities.con.score,16);assert.equal(c.ruleState.pools['druida:wildShape'],12);assert.equal(c.hpCurrent,31);
 const rage=make();rage.classes=[{classId:'barbaro',level:6}];rage.ruleState={active:{'barbaro:rage':true}};assert.equal(useDragonbornBreath(rage,13,E).total,13,'sopro não é conjuração');assert.equal(rage.ruleState.active['barbaro:rage'],true);
});
