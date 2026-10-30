import {active,type Engine,type Sheet} from './model';
import {incapacityReason} from './concentration';
import {maneuverTraining} from './maneuvers';
import {superiorityOptions} from './superiority';
import {spend} from './resources';
import {currentCommand,holdCommand,endCommand} from './commanders-strike-state';

export interface CommandChoice {source:string;ally:string;ownTurn:boolean;attackAction:boolean;forgoAttack:boolean;bonusAction:boolean;friendlyPerceiving:boolean}
export interface CommandResultChoice {outcome:'hit'|'critical'|'miss'|'declined';declared:boolean}
export const knowsCommandersStrike=(c:Sheet,E:Engine)=>maneuverTraining(c,E).known.has('golpe do comandante');
/** PHB 2014 p. 88/PDF 87: ação Atacar no próprio turno, UM ataque cedido,
 * ação bônus e um dado. O aliado amigável que vê OU ouve você pode reagir
 * imediatamente com um ataque com arma, inclusive à distância. O custo não
 * depende de ele aceitar, ter reação ou acertar; nada altera outra ficha. */
export function previewCommandersStrike(c:Sheet,choice:CommandChoice,E:Engine) {
  for(const record of [c.ruleState,c.ruleState?.used])if(record!=null && (typeof record!=='object' || Array.isArray(record)))throw new Error('Registro de superioridade ilegível preservado; confira os usos.');
  if(!knowsCommandersStrike(c,E) || incapacityReason(c))throw new Error('Golpe do Comandante exige a manobra conhecida e poder realizar a ação Atacar e ação bônus.');
  if(active(c,'druida:wildShape'))throw new Error('Golpe do Comandante em Forma Selvagem continua na mesa; confira a capacidade física da forma.');
  if(currentCommand(c))throw new Error('Já há uma ordem paga. Registre o ataque do aliado ou encerre essa ordem antes de outra.');
  if(!choice || [choice.ownTurn,choice.attackAction,choice.forgoAttack,choice.bonusAction,choice.friendlyPerceiving].some(v=>v!==true))throw new Error('Confirme seu turno, ação Atacar, um ataque cedido, ação bônus disponível e criatura amigável que possa ver ou ouvir você.');
  if(typeof choice.ally!=='string' || !choice.ally.trim() || choice.ally.trim().length>80)throw new Error('Identifique a criatura amigável em até 80 caracteres.');
  const source=superiorityOptions(c,E).find(s=>s.id===choice.source);
  if(!source)throw new Error('Escolha uma origem de superioridade vigente.');
  const raw=c.ruleState?.used?.[source.id],used=raw===undefined?0:raw;
  if(!Number.isSafeInteger(used) || used<0 || used>source.resource.max)throw new Error('Registro de superioridade ilegível ou fora do máximo preservado; confira os usos.');
  if(source.remaining<1)throw new Error('A origem de superioridade está esgotada.');
  return {source,ally:choice.ally.trim()};
}
export function canCommandersStrike(c:Sheet,E:Engine,source:string) {
  try{previewCommandersStrike(c,{source,ally:'Aliado',ownTurn:true,attackAction:true,forgoAttack:true,bonusAction:true,friendlyPerceiving:true},E);return true;}catch{return false;}
}
/** Gasta antes da reação/jogada do aliado. Não rola ataque ou dano antecipado. */
export function issueCommandersStrike(c:Sheet,choice:CommandChoice,E:Engine) {
  const plan=previewCommandersStrike(c,choice,E);
  spend(c,plan.source.resource);
  return holdCommand(c,{source:plan.source.id,name:plan.source.name,die:plan.source.die,ally:plan.ally});
}
export function previewCommandResult(c:Sheet,choice:CommandResultChoice) {
  const command=currentCommand(c);
  if(!command)throw new Error('Não há ordem paga nesta sessão; confira o dado já gasto e resolva na mesa se necessário.');
  if(!choice || !['hit','critical','miss','declined'].includes(choice.outcome))throw new Error('Informe o resultado do ataque do aliado.');
  const count=choice.outcome==='critical'?2:choice.outcome==='hit'?1:0;
  if(count && choice.declared!==true)throw new Error('Confirme a reação imediata com um ataque com arma, acerto e que o dado ainda não foi incluído no dano.');
  return {command,outcome:choice.outcome,count,formula:count?`${count}d${command.die}`:null};
}
/** Resolve somente o dado adicional, não a arma ou os bônus do comandante.
 * Crítico dobra os dados deste ataque, mas custa o mesmo único uso já pago.
 * Não revalida a reserva para cobrar de novo nem exige consciência contínua
 * para registrar o resultado de uma ordem que já foi dada. */
export function finishCommandResult(c:Sheet,choice:CommandResultChoice,faces:number[]=[]) {
  const plan=previewCommandResult(c,choice);
  if(!Array.isArray(faces) || faces.length!==plan.count || faces.some(n=>!Number.isInteger(n) || n<1 || n>plan.command.die))throw new Error(`Informe ${plan.count} face(s) de 1 a ${plan.command.die}; a ordem já paga foi preservada.`);
  const total=faces.reduce((sum,n)=>sum+n,0);endCommand(c);
  return {...plan,faces:[...faces],total};
}
