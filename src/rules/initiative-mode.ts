import {active,level,type Engine,type Sheet} from './model';
import {hasCondition} from './conditions';
import {armorProficiencies} from './spellcasting';
import type {RollMode} from './dice-roll';

/** Iniciativa é teste de DES. Visibilidade do medo, surpresa e alvos do
 * primeiro turno não existem no documento e continuam declarados pela mesa. */
export function initiativeTraits(c:Sheet,E:Engine) {
  const advantage:string[]=[],disadvantage:string[]=[],notes:string[]=[];
  if(level(c,'barbaro')>=7){
    advantage.push('Instinto Selvagem');
    notes.push('Surpresa: Instinto Selvagem exige não estar incapacitado e entrar em Fúria antes de qualquer outra coisa no primeiro turno. Ative a Fúria na mesa; a iniciativa não gasta esse recurso.');
  }
  if(level(c,'patrulheiro')>=1){
    advantage.push('Explorador Natural · Patrulheiro Revisado');
    notes.push('Adaptação: Patrulheiro Revisado. A vantagem em ataques no primeiro turno depende de o alvo ainda não ter agido; informe esse contexto na mesa.');
  }
  if(Number(c.exhaustion)>=1)disadvantage.push('Exaustão');
  if(hasCondition(c,'envenenado'))disadvantage.push('Envenenado');
  if(active(c,'druida:wildShape'))notes.push('Forma Selvagem: confira DES e equipamento da forma na mesa; armadura/escudo incorporados não são presumidos em uso. Informe o modo de equipamento se necessário.');
  else {
    const profs=armorProficiencies(c,E),armor=E.armorInfo(c.armorEquipped);
    if(armor && armor.type!=='shield' && !profs.includes(armor.type))disadvantage.push('Armadura sem proficiência');
    if(c.shieldEquipped && !profs.includes('escudo'))disadvantage.push('Escudo sem proficiência');
  }
  if(hasCondition(c,'amedrontado'))notes.push('Amedrontado: selecione desvantagem no dado se a fonte do medo estiver à vista. A ficha não conhece sua visibilidade.');
  return {advantage,disadvantage,notes};
}

/** Reúne todas as fontes antes de cancelar: duas vantagens e uma desvantagem
 * ainda produzem um único d20. Consulta pura, sem gastar inspiração ou rolar. */
export function initiativeRollDetails(c:Sheet,selected:RollMode,E:Engine,includeInspiration=true) {
  const traits=initiativeTraits(c,E);
  if(selected==='adv')traits.advantage.push('Vantagem informada no dado');
  if(selected==='dis')traits.disadvantage.push('Desvantagem informada no dado');
  const inspired=includeInspiration && !!c.heroicInspiration && c.ruleState?.inspirationReady===true;
  if(inspired)traits.advantage.push('Inspiração preparada');
  const adv=!!traits.advantage.length,dis=!!traits.disadvantage.length;
  const mode:RollMode=adv===dis?'normal':adv?'adv':'dis';
  return {...traits,mode,inspired};
}
export function initiativeRollDescription(details:ReturnType<typeof initiativeRollDetails>) {
  const {mode,advantage,disadvantage}=details;
  const sources=[advantage.length?'Vantagem: '+advantage.join(', '):'',disadvantage.length?'Desvantagem: '+disadvantage.join(', '):''].filter(Boolean).join('. ');
  return (advantage.length && disadvantage.length?'Fontes se anulam: 1d20. ':mode==='adv'?'2d20, use o maior. ':mode==='dis'?'2d20, use o menor. ':'1d20. ')+sources;
}
