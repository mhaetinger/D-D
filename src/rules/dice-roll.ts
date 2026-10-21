import { level, type Engine, type Sheet } from './model';

export type RollMode = 'normal'|'adv'|'dis';
export interface RollContext { type:'check'|'attack'|'save'; skill?:string }
export interface D20Rules { reliableTalent?:boolean; halflingLuck?:boolean }
interface DiceGroup { sides:number; faces:number[] }
interface Reroll { index:number; from:number; to:number }
export interface DiceResult {
  total:number; d20Natural:number|null; breakdown:string[]; appliedMode:RollMode;
  groups:DiceGroup[]; modifier:number; rules:D20Rules; reroll?:Reroll;
}
const rollDie=(sides:number)=>Math.floor(Math.random()*sides)+1;
export const hasHalflingLuck=(c:Sheet)=>['halflingLeve','halflingRobusto'].includes(c?.rules?.raceId);

/** O nome da jogada e um bônus escrito não provam proficiência. A meia
 * proficiência de Versatilidade/Atleta não ativa Talento Confiável. */
export function sheetD20Rules(c:Sheet,context:RollContext|null,E:Engine):D20Rules {
  if(!context || !['check','attack','save'].includes(context.type))return {};
  return {
    halflingLuck:hasHalflingLuck(c),
    reliableTalent:context.type==='check' && level(c,'ladino')>=11 && !!context.skill &&
      Object.hasOwn(E.data.skills,context.skill) && c.skillsProf?.includes(context.skill)===true,
  };
}

function summarize(groups:DiceGroup[],modifier:number,appliedMode:RollMode,rules:D20Rules,reroll?:Reroll):DiceResult {
  let total=0,d20Natural:number|null=null;
  const breakdown:string[]=[];
  for(const {sides,faces} of groups) {
    if(sides===20 && appliedMode!=='normal') {
      d20Natural=(appliedMode==='adv'?Math.max:Math.min)(faces[0],faces[1]);
      total+=d20Natural;
      breakdown.push(`d20 [${faces[0]}, ${faces[1]}] → ${appliedMode==='adv'?'maior':'menor'}: ${d20Natural}`);
      for(const extra of faces.slice(2)) {total+=extra;breakdown.push(`d20 extra [${extra}]`);}
    }else {
      total+=faces.reduce((sum,x)=>sum+x,0);
      if(sides===20)d20Natural=faces[0];
      breakdown.push(`${faces.length}d${sides}[${faces.join('+')}]`);
    }
  }
  if(reroll)breakdown.push(`Sortudo racial: ${reroll.from} → ${reroll.to} (nova face obrigatória)`);
  if(rules.reliableTalent && d20Natural!==null && d20Natural<10) {
    total+=10-d20Natural;
    breakdown.push(`Talento Confiável: d20 ${d20Natural} tratado como 10`);
  }
  total+=modifier;
  if(modifier!==0)breakdown.push(modifier>0?`+${modifier}`:String(modifier));
  return {total,d20Natural,breakdown,appliedMode,groups,modifier,rules,...(reroll?{reroll}:{})};
}

/** O primeiro d20 é o teste; vantagem não repete dados adicionais. Regras
 * contextuais só são aceitas com um único d20 na fórmula, nunca por adivinhação
 * num pool de vários testes. Sem contexto, mantém o contrato do rolador livre. */
export function evaluateDicePool(counts:Record<number,number>,modifier:number,mode:string,rules:D20Rules={},die=rollDie):DiceResult {
  const appliedMode=counts[20]>0 && (mode==='adv' || mode==='dis')?mode:'normal';
  const groups=Object.entries(counts).filter(([,count])=>count>0).sort(([a],[b])=>Number(b)-Number(a))
    .map(([sides,count])=>({sides:Number(sides),faces:Array.from({length:count+(Number(sides)===20 && appliedMode!=='normal'?1:0)},()=>die(Number(sides)))}));
  return summarize(groups,modifier,appliedMode,counts[20]===1?{...rules}:{});
}

/** Com dois 1, repetir qualquer um é equivalente; a regra permite somente
 * um deles, uma única vez. O novo 1 não concede uma cadeia de rerrolagens. */
export function canRerollHalfling(result:DiceResult) {
  return !!result.rules.halflingLuck && !result.reroll && !!result.groups.find(g=>g.sides===20)?.faces.includes(1);
}
export function rerollHalfling(result:DiceResult,die=rollDie):DiceResult {
  if(!canRerollHalfling(result))throw new Error('Esta jogada não permite outra rerrolagem de Sortudo racial.');
  const groups=result.groups.map(g=>({...g,faces:[...g.faces]})),group=groups.find(g=>g.sides===20)!;
  const index=group.faces.indexOf(1),to=die(20);
  group.faces[index]=to;
  return summarize(groups,result.modifier,result.appliedMode,result.rules,{index,from:1,to});
}
