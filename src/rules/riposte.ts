import {active,norm,type Engine,type Sheet} from './model';
import {weaponStats} from './combat';
import {incapacityReason} from './concentration';
import {maneuverTraining} from './maneuvers';
import {superiorityOptions} from './superiority';
import {spend} from './resources';
import {beginRiposte,currentRiposte} from './weapon-attack-session';
import {pendingFeint} from './feinting-state';
import {parseDiceFormula} from './dice-formula';

export interface RiposteChoice {source:string;target:string;triggered:boolean;newAttack:boolean}
/** Limite do controle integrado: arma reconhecida corpo a corpo com dano.
 * Ataque próprio/desarmado e Forma Selvagem podem ser resolvidos na mesa;
 * a manobra não exige proficiência nem turno próprio. */
export function riposteOption(c:Sheet,entry:Sheet,E:Engine) {
  if(!entry || !c.weapons?.includes(entry) || active(c,'druida:wildShape') || !maneuverTraining(c,E).known.has('contra atacar'))return null;
  const w=weaponStats(c,entry,E);
  if(!w.ruleWeapon || w.calculationMode==='manual' || !w.meleeAttack || entry.attackMode==='thrown' || !w.weaponDie || w.weaponDie==='0')return null;
  if(!/^[+-]?\d+$/.test(String(w.bonus)) || !parseDiceFormula(`1d20${Number(w.bonus)>=0?'+':''}${Number(w.bonus)}`) || !parseDiceFormula(w.damage))return null;
  return w;
}
/** PHB 2014, p. 88 / PDF 87: após uma criatura errar sua jogada corpo a corpo
 * contra você, reação + dado pagam UM ataque corpo a corpo com arma contra ela.
 * Não é ação Atacar ou ataque de oportunidade. Gatilho/reação/alcance ficam
 * declarados; não inferimos um erro por agarrão/empurrão ou pelo dado da bandeja. */
export function previewRiposte(c:Sheet,entry:Sheet,choice:RiposteChoice,E:Engine) {
  for(const record of [c.ruleState,c.ruleState?.used])if(record!=null && (typeof record!=='object' || Array.isArray(record)))throw new Error('Registro de superioridade ilegível preservado; confira os usos.');
  const w=riposteOption(c,entry,E);
  if(!w || incapacityReason(c))throw new Error('Contra-Atacar exige a manobra conhecida e poder atacar corpo a corpo com esta arma reconhecida.');
  if(currentRiposte(c))throw new Error('Já há um contra-ataque pago. Registre seu dano ou encerre esse ataque antes de outro.');
  if(choice?.triggered!==true || choice.newAttack!==true)throw new Error('Confirme o erro de uma jogada corpo a corpo contra você, reação disponível, alcance e novo ataque contra essa criatura sem outra manobra.');
  if(typeof choice.target!=='string' || !choice.target.trim() || choice.target.trim().length>80)throw new Error('Identifique a criatura que errou o ataque em até 80 caracteres.');
  if(pendingFeint(c) && norm(choice.target) && norm(pendingFeint(c)!.target)===norm(choice.target))throw new Error('Há Finta pendente contra essa criatura. Não combine duas manobras no mesmo ataque; confira alvo e turno na mesa.');
  const source=superiorityOptions(c,E).find(s=>s.id===choice.source);
  if(!source)throw new Error('Escolha uma origem de superioridade vigente.');
  const raw=c.ruleState?.used?.[source.id],used=raw===undefined?0:raw;
  if(!Number.isSafeInteger(used) || used<0 || used>source.resource.max)throw new Error('Registro de superioridade ilegível ou fora do máximo preservado; confira os usos.');
  if(source.remaining<1)throw new Error('A origem de superioridade está esgotada.');
  return {w,source,target:choice.target.trim()};
}
/** Sem face antecipada: o dado só será rolado no dano se o contra-ataque acertar.
 * Se errar, reação/dado continuam gastos; limpar o contexto nunca reembolsa. */
export function commitRiposte(c:Sheet,entry:Sheet,choice:RiposteChoice,E:Engine) {
  const plan=previewRiposte(c,entry,choice,E);
  spend(c,plan.source.resource);
  return beginRiposte(c,entry,{source:plan.source.id,name:plan.source.name,die:plan.source.die,target:plan.target});
}
