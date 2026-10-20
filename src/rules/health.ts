import { ability, active, level, proficiency, selections, state, type Engine, type Sheet } from './model';

export const hitPointMaximum = (c:Sheet):number => Number(c.exhaustion)>=4 ? Math.floor(c.hpMax/2) : c.hpMax;
const counter = (n:unknown) => Math.max(0,Math.min(3,Math.floor(Number(n)||0)));
export function deathStatus(c:Sheet) {
  const d=c.ruleState?.death;
  const dead=!!d?.dead || counter(d?.failures)>=3 || Number(c.exhaustion)>=6;
  return {successes:counter(d?.successes),failures:counter(d?.failures),stable:!!d?.stable && !dead,dead};
}
export function requireConscious(c:Sheet) {
  if(deathStatus(c).dead || c.conscious===false || c.hpCurrent<=0 && !active(c,'druida:wildShape')) throw new Error('É preciso estar vivo e consciente para realizar esta ação.');
}
function death(c:Sheet) { return state(c).death=deathStatus(c); }
export function markDead(c:Sheet) {
  const d=death(c);d.dead=true;d.stable=false;c.hpCurrent=0;
}
export function healHitPoints(c:Sheet,amount:number) {
  if (!Number.isInteger(amount) || amount<0) throw new Error('Informe uma cura inteira e não negativa.');
  if (deathStatus(c).dead) throw new Error('Cura comum não revive. Registre primeiro o retorno à vida após a decisão da mesa.');
  const before=c.hpCurrent;c.hpCurrent=Math.min(hitPointMaximum(c),c.hpCurrent+amount);
  if (c.hpCurrent>before) state(c).death={successes:0,failures:0,stable:false,dead:false};
  return Math.max(0,c.hpCurrent-before);
}
/** Recebe o dano que atingiu o personagem após a proteção externa. Temporários
 * ainda contam como dano a quem já está a 0 PV; dano absorvido pela besta não. */
export function trackDamageAtZero(c:Sheet,received:number,excess:number,wasAtZero:boolean,critical=false) {
  if (received<=0 || deathStatus(c).dead) return;
  if (wasAtZero) {
    const d=death(c);d.stable=false;d.failures=Math.min(3,d.failures+(critical?2:1));
    if (received>=hitPointMaximum(c) || d.failures>=3) markDead(c);
  } else if (c.hpCurrent===0) {
    state(c).death={successes:0,failures:0,stable:false,dead:false};
    if (excess>=hitPointMaximum(c)) markDead(c);
  }
}
function canTestDeath(c:Sheet) {
  if (c.hpCurrent!==0 || active(c,'druida:wildShape')) throw new Error('O teste contra a morte exige 0 PV fora da Forma Selvagem.');
  const d=deathStatus(c);
  if (d.dead) throw new Error('O personagem está morto; não realiza novos testes contra a morte.');
  if (d.stable) throw new Error('Estável: não precisa de teste contra a morte até sofrer dano.');
}
export function deathSaveBonus(c:Sheet) { return level(c,'monge')>=14 ? proficiency(c) : 0; }
export function resolveDeathSave(c:Sheet,natural:number,extraBonus=0) {
  canTestDeath(c);
  if (!Number.isInteger(natural) || natural<1 || natural>20 || !Number.isInteger(extraBonus) || Math.abs(extraBonus)>100) throw new Error('Informe a face do d20 (1–20) e um bônus inteiro válido.');
  const total=natural+deathSaveBonus(c)+extraBonus,d=death(c);
  if (natural===20) { healHitPoints(c,1);return {natural,total,outcome:'Recuperou 1 PV · 20 natural'}; }
  if (natural===1) d.failures=Math.min(3,d.failures+2);
  else if (total>=10) d.successes=Math.min(3,d.successes+1);
  else d.failures=Math.min(3,d.failures+1);
  if (d.failures>=3) markDead(c);
  else if (d.successes>=3) state(c).death={successes:0,failures:0,stable:true,dead:false};
  const current=deathStatus(c);
  return {natural,total,outcome:current.dead?'Morto · três falhas':current.stable?'Estável · três sucessos':natural===1?'Duas falhas · 1 natural':total>=10?'Um sucesso':'Uma falha'};
}
export function stabilize(c:Sheet) {
  canTestDeath(c);state(c).death={successes:0,failures:0,stable:true,dead:false};
}
/** Ressurreição é registrada explicitamente após resolução na mesa, nunca cura. */
export function returnToLife(c:Sheet,hp:number) {
  if (!deathStatus(c).dead || !Number.isInteger(hp) || hp<1 || hp>hitPointMaximum(c)) throw new Error('Confira o estado e os PV recebidos ao retornar à vida.');
  if (Number(c.exhaustion)>=6) throw new Error('Resolva também a exaustão fatal na mesa antes de registrar o retorno à vida.');
  state(c).death={successes:0,failures:0,stable:false,dead:false};c.hpCurrent=hp;
}

export function hitDiceRemaining(cls:Sheet) { return Math.max(0,cls.level-Math.max(0,Number(cls.hitDiceUsed)||0)); }
export function songOfRestDie(c:Sheet) {
  const n=level(c,'bardo');return n>=17?12:n>=13?10:n>=9?8:n>=2?6:0;
}
export function validateHitDie(c:Sheet,classId:string) {
  const cls=c.classes.find((x:Sheet)=>x.classId===classId);
  if (!cls || ![6,8,10,12].includes(cls.hitDie) || !hitDiceRemaining(cls)) throw new Error('Não há Dado de Vida disponível nessa classe.');
  if(!Number.isInteger(Number(cls.hitDiceUsed || 0)) || Number(cls.hitDiceUsed || 0)<0) throw new Error('Confira a reserva de Dados de Vida dessa classe.');
  const d=deathStatus(c);
  // O descanso curto de 2014 não exige PV positivos ou vigília. Resolva os
  // testes pendentes antes de registrar a hora de descanso de alguém a 0 PV.
  if(d.dead) throw new Error('Um Dado de Vida não revive o personagem.');
  if(c.hpCurrent<=0 && !active(c,'druida:wildShape') && !d.stable) throw new Error('Resolva a estabilização antes de registrar o descanso curto a 0 PV.');
  return cls;
}
export function spendHitDie(c:Sheet,classId:string,roll:number,E:Engine,options:{shapeCon?:number;song?:{sides:number;roll:number}}={}) {
  const cls=validateHitDie(c,classId),shape=active(c,'druida:wildShape');
  const con=shape?options.shapeCon:ability(c,'con');
  if (!Number.isInteger(roll) || roll<1 || roll>cls.hitDie || !Number.isInteger(con) || Math.abs(con!)>10) throw new Error('Confira a face do Dado de Vida e a Constituição da forma atual.');
  if (shape && !(Number.isFinite(c.ruleState?.beastMax) && c.ruleState.beastMax>0 && c.ruleState.pools?.['druida:wildShape']>0)) throw new Error('Confira os PV atuais/máximos da forma de besta antes de curá-la.');
  const song=options.song;
  if (song && (c.ruleState?.songOfRestUsed || ![6,8,10,12].includes(song.sides) || !Number.isInteger(song.roll) || song.roll<1 || song.roll>song.sides)) throw new Error('Canção do Descanso: um bônus por descanso, com dado válido de quem realizou a atuação.');
  const durable=selections(c,E,'feat').concat(selections(c,E,'racialFeat')).includes('Resistente');
  const baseHealing=Math.max(durable?Math.max(2,2*con!):0,roll+con!);
  const before=shape?c.ruleState.pools['druida:wildShape']:c.hpCurrent;
  const songBonus=song && baseHealing>0 && before<(shape?c.ruleState.beastMax:hitPointMaximum(c))?song.roll:0;
  const healing=baseHealing+songBonus;
  cls.hitDiceUsed=Number(cls.hitDiceUsed || 0)+1;
  if (songBonus) state(c).songOfRestUsed=true;
  if (shape) c.ruleState.pools['druida:wildShape']=Math.min(c.ruleState.beastMax,before+healing);
  else healHitPoints(c,healing);
  return {roll,con:con!,healing,song:songBonus,restored:(shape?c.ruleState.pools['druida:wildShape']:c.hpCurrent)-before,remaining:hitDiceRemaining(cls),shape};
}

export type RollMode = 'normal'|'adv'|'dis';
export function inspirationRollMode(c:Sheet,mode:RollMode):RollMode {
  return c.heroicInspiration && c.ruleState?.inspirationReady ? mode==='dis'?'normal':'adv' : mode;
}
export function consumeInspiration(c:Sheet) {
  if (!c.heroicInspiration || !c.ruleState?.inspirationReady) return false;
  c.heroicInspiration=false;c.ruleState.inspirationReady=false;return true;
}
