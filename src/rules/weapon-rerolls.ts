import {weaponStats} from './combat';
import {active, level, subclass, type Engine, type Sheet} from './model';
import {hasFeat} from './passives';
import {parseDiceFormula} from './dice-formula';
import {type DiceResult} from './dice-roll';
import {type WeaponDamagePlan} from './weapon-damage';

export interface WeaponRerollOptions {savage:boolean; greatWeapon:boolean}
export function weaponRerollOptions(c:Sheet,entry:Sheet,E:Engine):WeaponRerollOptions {
  const none={savage:false,greatWeapon:false};
  if(!entry || !c.weapons?.includes(entry) || active(c,'druida:wildShape'))return none;
  const w=weaponStats(c,entry,E);
  if(!w.ruleWeapon || w.calculationMode==='manual' || !w.meleeAttack || entry.attackMode==='thrown' || !/^\d+d\d+$/.test(w.weaponDie))return none;
  const style='Combate com Armas Grandes';
  const selected=level(c,'guerreiro')>=1 && E.selections(c,'guerreiro','fighting').includes(style) ||
    level(c,'paladino')>=2 && E.selections(c,'paladino','fighting').includes(style) ||
    level(c,'guerreiro')>=10 && subclass(c,'guerreiro',E)==='campeao' && E.selections(c,'guerreiro','championFighting').includes(style);
  return {savage:hasFeat(c,E,'Atacante Bestial'),greatWeapon:!!selected && !c.shieldEquipped &&
    (/duas mãos/i.test(w.properties) || /vers[aá]til/i.test(w.properties) && entry.hands===2)};
}

interface WeaponSet {faces:number[]; repeated:number[]; changes:string[]}
export interface WeaponReroll {
  original:DiceResult; sides:number; count:number; options:WeaponRerollOptions;
  sets:WeaponSet[]; selected:number;
}
const sum=(faces:number[])=>faces.reduce((a,b)=>a+b,0);
const rollDie=(sides:number)=>Math.floor(Math.random()*sides)+1;
function face(die:(sides:number)=>number,sides:number) {
  const value=die(sides);
  if(!Number.isInteger(value) || value<1 || value>sides)throw new Error('Face de dano inválida; a repetição não foi aplicada.');
  return value;
}
/** A parte Arma vem primeiro para cada tamanho no pool. O crítico comum já
 * dobrou esses dados. Furtivo, Destruição e dados extras de características
 * continuam em partes próprias, conforme o esclarecimento do Sage Advice. */
export function beginWeaponReroll(plan:WeaponDamagePlan,result:DiceResult,options:WeaponRerollOptions):WeaponReroll {
  const base=plan.parts.find(p=>p.name==='Arma'),parsed=base && parseDiceFormula(base.formula);
  const counts=parsed && Object.entries(parsed.counts);
  if(plan.manual || !counts || counts.length!==1 || !options.savage && !options.greatWeapon || result.appliedMode!=='normal')throw new Error('Este dano não permite a repetição automática de dados da arma.');
  const [sides,count]=counts[0].map(Number),faces=result.groups.find(g=>g.sides===sides)?.faces.slice(0,count);
  if(!faces || faces.length!==count || faces.some(n=>!Number.isInteger(n) || n<1 || n>sides))throw new Error('Não foi possível identificar os dados desta arma.');
  return {original:structuredClone(result),sides,count,options:{...options},sets:[{faces,repeated:[],changes:[]}],selected:0};
}
export const greatWeaponDice=(roll:WeaponReroll,set=roll.selected)=>roll.options.greatWeapon?
  roll.sets[set].faces.flatMap((n,i)=>n<=2 && !roll.sets[set].repeated.includes(i)?[i]:[]):[];

/** Cada face baixa pode ser repetida uma vez pelo estilo, inclusive quando
 * a nova face também é baixa. Outra face não é alterada nem lançada de novo. */
export function rerollGreatWeapon(roll:WeaponReroll,indices:number[],die=rollDie):WeaponReroll {
  const allowed=greatWeaponDice(roll);
  if(!Array.isArray(indices) || !indices.length || new Set(indices).size!==indices.length || indices.some(i=>!allowed.includes(i)))throw new Error('Escolha somente dados 1 ou 2 ainda não repetidos pelo estilo.');
  const next=structuredClone(roll),set=next.sets[next.selected];
  for(const i of indices){const to=face(die,next.sides);set.changes.push(`${set.faces[i]} → ${to}`);set.faces[i]=to;set.repeated.push(i);}
  return next;
}
/** Atacante Bestial repete o conjunto, nunca escolhe o melhor de cada dado.
 * A disponibilidade de uma vez por turno é declarada pela mesa, sem reserva
 * diária ou relógio inventado. O estilo pode atuar nas faces de cada conjunto. */
export function rerollSavageAttacker(roll:WeaponReroll,availableThisTurn:boolean,die=rollDie):WeaponReroll {
  if(!roll.options.savage || roll.sets.length!==1 || availableThisTurn!==true)throw new Error('Confirme Atacante Bestial disponível neste turno; não pode repetir este conjunto outra vez.');
  const next=structuredClone(roll);
  next.sets.push({faces:Array.from({length:roll.count},()=>face(die,roll.sides)),repeated:[],changes:[]});
  next.selected=1;return next;
}
export function chooseWeaponSet(roll:WeaponReroll,index:number):WeaponReroll {
  if(!Number.isInteger(index) || index<0 || index>=roll.sets.length)throw new Error('Escolha um dos conjuntos completos da arma.');
  return {...roll,selected:index};
}
export function weaponRerollResult(roll:WeaponReroll):DiceResult {
  const result=structuredClone(roll.original),set=roll.sets[roll.selected];
  const group=result.groups.find(g=>g.sides===roll.sides)!;
  group.faces.splice(0,roll.count,...set.faces);
  result.total=Math.max(0,result.groups.reduce((n,g)=>n+sum(g.faces),result.modifier));
  result.breakdown=result.groups.map(g=>`${g.faces.length}d${g.sides}[${g.faces.join('+')}]`);
  if(result.modifier)result.breakdown.push(result.modifier>0?'+'+result.modifier:String(result.modifier));
  if(roll.sets.length>1)result.breakdown.push(`Atacante Bestial: conjuntos ${roll.sets.map(s=>`[${s.faces.join('+')}] = ${sum(s.faces)}`).join(' / ')}; escolhido ${roll.selected+1}`);
  for(const [i,s] of roll.sets.entries())if(s.changes.length)result.breakdown.push(`Combate com Armas Grandes · conjunto ${i+1}: ${s.changes.join(', ')} (novas faces obrigatórias)`);
  return result;
}
