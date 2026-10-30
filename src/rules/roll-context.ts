import {active,level,norm,type Engine,type Sheet} from './model';
import {hasCondition} from './conditions';
import {armorProficiencies} from './spellcasting';
import {hasFeat} from './passives';
import {catalogueWeapon,weaponStats} from './combat';
import {initiativeTraits} from './initiative-mode';
import type {RollMode} from './dice-roll';

export interface SheetRollContext {type:'check'|'save'|'attack';ability?:string;skill?:string;initiative?:boolean;weapon?:Sheet;ranged?:boolean;hostileNear?:boolean;grappledByYou?:boolean}
const skillAbilities:Record<string,string>={acrobacia:'dex',arcanismo:'int',atletismo:'str',atuacao:'cha',enganacao:'cha',furtividade:'dex',historia:'int',intimidacao:'cha',intuicao:'wis',investigacao:'int',lidar_animais:'wis',medicina:'wis',natureza:'int',percepcao:'wis',persuasao:'cha',prestidigitacao:'dex',religiao:'int',sobrevivencia:'wis'};
export function rollAbility(c:Sheet,context:SheetRollContext,E:Engine) {
  return context.ability || (context.initiative?'dex':context.skill?skillAbilities[context.skill]:context.weapon?weaponStats(c,context.weapon,E).ability:undefined);
}
/** Metadados vêm do catálogo gerado; aliases só reconhecem os nomes legados.
 * Não deduzimos penalidades de uma descrição ou armadura personalizada. */
export function armorStealthDisadvantage(c:Sheet,E:Engine) {
  if(active(c,'druida:wildShape'))return false;
  const armor=E.armorInfo(c.armorEquipped);if(!armor || armor.type==='shield')return false;
  if(armor.type==='media' && (hasFeat(c,E,'Maestria em Armadura Média') || hasFeat(c,E,'Mestre de Armaduras Médias')))return false;
  let name=norm(c.armorEquipped).replace(/ [123]$/,'');
  const aliases:Record<string,string>={acolchoada:'armadura acolchoada',couro:'armadura de couro','couro batido':'armadura de couro batido','camisao de malha':'camisa de malha',placas:'armadura de placas'};
  name=aliases[name] || name;
  const item=E.equipmentCatalog().find((x:Sheet)=>x.category==='armaduras' && norm(x.name)===name);
  return !!item && /furtividade.*desv/i.test(item.meta);
}
/** Fontes próprias verificáveis. Visibilidade do medo, sentidos especiais,
 * luz solar, efeitos mágicos e características do alvo continuam na mesa. */
export function sheetRollTraits(c:Sheet,context:SheetRollContext,E:Engine) {
  if(context.initiative)return initiativeTraits(c,E);
  const advantage:string[]=[],disadvantage:string[]=[],notes:string[]=[],key=rollAbility(c,context,E);
  if(Number(c.exhaustion)>=(context.type==='check'?1:3))disadvantage.push('Exaustão');
  if(context.type!=='save' && hasCondition(c,'envenenado'))disadvantage.push('Envenenado');
  if(context.type==='attack'){
    const ranged=context.ranged || context.weapon && (weaponStats(c,context.weapon,E).rangedWeapon || context.weapon.attackMode==='thrown');
    if(ranged && context.hostileNear){if(hasFeat(c,E,'Especialista em Besta'))notes.push('Especialista em Besta evita a desvantagem apenas por inimigo a até 1,5 m.');else disadvantage.push('Inimigo a até 1,5 m');}
    if(context.grappledByYou && hasFeat(c,E,'Imobilizador'))advantage.push('Imobilizador · alvo agarrado por você');
    for(const [id,label] of [['cego','Cego'],['caido','Caído'],['impedido','Impedido']])if(hasCondition(c,id))disadvantage.push(label);
    if(hasCondition(c,'invisivel'))advantage.push('Invisível');
    const w=context.weapon && catalogueWeapon(context.weapon,E);
    if(!active(c,'druida:wildShape') && w && /pesada/i.test(w.properties) && E.options.races[c.rules?.raceId]?.size==='Pequeno')disadvantage.push('Arma pesada · criatura Pequena');
  }
  if(context.type==='save' && key==='dex' && hasCondition(c,'impedido'))disadvantage.push('Impedido');
  const shape=active(c,'druida:wildShape'),armor=E.armorInfo(c.armorEquipped);
  if(!shape){
    const profs=armorProficiencies(c,E);
    if(['str','dex'].includes(key || '')){
      if(armor && armor.type!=='shield' && !profs.includes(armor.type))disadvantage.push('Armadura sem proficiência');
      if(c.shieldEquipped && !profs.includes('escudo'))disadvantage.push('Escudo sem proficiência');
    }
    if(context.type==='check' && context.skill==='furtividade' && armorStealthDisadvantage(c,E))disadvantage.push('Armadura · Furtividade');
    if(key==='str' && context.type!=='attack' && active(c,'barbaro:rage') && armor?.type!=='pesada')advantage.push('Fúria');
  }else notes.push('Forma Selvagem: estatísticas e equipamento incorporado continuam na mesa; não aplicamos os bônus/penalidades humanos de equipamento ou Fúria.');
  if(context.type!=='save' && hasCondition(c,'amedrontado'))notes.push('Amedrontado: informe desvantagem se a fonte do medo estiver à vista.');
  if(context.type==='attack' && hasCondition(c,'invisivel'))notes.push('Invisível: confira sentidos especiais e exceções na mesa.');
  return {advantage,disadvantage,notes};
}
/** Cancela só DEPOIS de reunir todas as fontes. Duas vantagens não vencem
 * uma desvantagem. Pool livre não chama esta função. */
export function sheetRollDetails(c:Sheet,context:SheetRollContext,selected:RollMode,E:Engine,includeInspiration=true,additionalAdvantages:string[]=[]) {
  const traits=sheetRollTraits(c,context,E);
  traits.advantage.push(...additionalAdvantages);
  if(selected==='adv')traits.advantage.push('Vantagem informada no dado');
  if(selected==='dis')traits.disadvantage.push('Desvantagem informada no dado');
  const inspired=includeInspiration && !!c.heroicInspiration && c.ruleState?.inspirationReady===true;
  if(inspired)traits.advantage.push('Inspiração preparada');
  const adv=!!traits.advantage.length,dis=!!traits.disadvantage.length;
  return {...traits,inspired,mode:(adv===dis?'normal':adv?'adv':'dis') as RollMode};
}
